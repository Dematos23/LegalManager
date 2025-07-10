
'use server';

import prisma from '@/lib/prisma';
import { Resend } from 'resend';
import * as Handlebars from 'handlebars';
import { format } from 'date-fns';
import { revalidatePath } from 'next/cache';

interface SendCampaignByTrademarkPayload {
    sendMode: 'trademark';
    templateId: number;
    campaignName: string;
    mergeTrademarks: boolean;
    trademarkIds: number[];
}

interface SendCampaignByContactPayload {
    sendMode: 'contact';
    templateId: number;
    campaignName: string;
    contactIds: number[];
}

type SendCampaignPayload = SendCampaignByTrademarkPayload | SendCampaignByContactPayload;

export async function sendCampaignAction(payload: SendCampaignPayload) {
    const { templateId, campaignName } = payload;
    const resend = new Resend(process.env.RESEND_API_KEY);

    try {
        if (!campaignName || campaignName.trim().length < 10) {
            return { error: 'Campaign name must be at least 10 characters long.' };
        }

        const template = await prisma.emailTemplate.findUnique({ where: { id: templateId } });
        if (!template) {
            return { error: 'Email template not found.' };
        }

        const campaign = await prisma.campaign.create({
            data: { name: campaignName, emailTemplateId: template.id },
        });

        // This map will hold the final email jobs to be sent.
        // Key: contact email. Value: object with contact and context for Handlebars.
        const emailJobs = new Map<string, { contact: any, context: any }>();
        
        if (payload.sendMode === 'contact') {
            const contacts = await prisma.contact.findMany({
                where: { id: { in: payload.contactIds } },
                include: {
                    agent: true,
                    owners: { include: { trademarks: true } }
                }
            });

            for (const contact of contacts) {
                const allTrademarks = contact.owners.flatMap(owner => owner.trademarks);
                const firstOwner = allTrademarks.length > 0 ? await prisma.owner.findFirst({ where: { trademarks: { some: { id: allTrademarks[0].id } } } }) : null;

                const context = createHandlebarsContext(contact, firstOwner, allTrademarks);
                emailJobs.set(contact.email, { contact, context });
            }

        } else if (payload.sendMode === 'trademark') {
            const selectedTrademarks = await prisma.trademark.findMany({
                where: { id: { in: payload.trademarkIds } },
                include: { owner: { include: { contacts: { include: { agent: true } } } } }
            });

            if (payload.mergeTrademarks) {
                // Group trademarks by owner, then by contact
                const trademarksByOwnerContact = new Map<string, { contact: any; owner: any; trademarks: any[] }>();

                for (const tm of selectedTrademarks) {
                    for (const contact of tm.owner.contacts) {
                        const key = `${contact.id}-${tm.owner.id}`;
                        if (!trademarksByOwnerContact.has(key)) {
                            trademarksByOwnerContact.set(key, { contact, owner: tm.owner, trademarks: [] });
                        }
                        trademarksByOwnerContact.get(key)!.trademarks.push(tm);
                    }
                }
                
                for (const { contact, owner, trademarks } of trademarksByOwnerContact.values()) {
                    const context = createHandlebarsContext(contact, owner, trademarks);
                     // We might overwrite if a contact is linked to multiple owners, but each email is owner-specific.
                     // A more complex key might be needed if one contact gets multiple distinct emails.
                     // For now, let's key by contact email + owner id to ensure unique jobs.
                    const jobKey = `${contact.email}-${owner.id}`;
                    emailJobs.set(jobKey, { contact, context });
                }

            } else { // Send one email per trademark
                for (const tm of selectedTrademarks) {
                     for (const contact of tm.owner.contacts) {
                        const context = createHandlebarsContext(contact, tm.owner, [tm]);
                        // Create a unique key for each trademark-contact pair to avoid overwriting jobs
                        const jobKey = `${contact.email}-${tm.id}`;
                        emailJobs.set(jobKey, { contact, context });
                    }
                }
            }
        }

        // Process all email jobs
        for (const { contact, context } of emailJobs.values()) {
            const emailSubject = compileAndRender(template.subject, context);
            const emailBody = compileAndRender(template.body, context);

            const { data, error } = await resend.emails.send({
                from: 'LegalIntel CRM <notifications@updates.artecasa.com.pe>',
                to: [contact.email],
                subject: emailSubject,
                html: emailBody,
                tags: [
                    { name: 'campaign_id', value: String(campaign.id) },
                    { name: 'template_id', value: String(template.id) },
                ]
            });
            
            if (error || !data) {
                console.error(`Failed to send email to ${contact.email}:`, error);
                continue;
            }

            await prisma.sentEmail.create({
                data: {
                    resendId: data.id,
                    campaignId: campaign.id,
                    contactId: contact.id,
                },
            });
        }

        revalidatePath('/tracking');
        return { success: `Campaign "${campaign.name}" sent successfully to ${emailJobs.size} recipients.` };

    } catch (error) {
        console.error('Failed to send campaign:', error);
        return { error: 'An unexpected error occurred while sending the campaign.' };
    }
}

function createHandlebarsContext(contact: any, owner: any, trademarks: any[]): any {
    const trademarksContextData = trademarks.map(tm => ({
        denomination: tm.denomination,
        class: String(tm.class),
        certificate: tm.certificate,
        expiration: format(new Date(tm.expiration), 'yyyy-MM-dd'),
        products: tm.products,
        type: tm.type
    }));

    let handlebarsContext: any = {
        agent: contact.agent,
        owner: owner ? {
            ...owner,
            country: owner.country.replace(/_/g, ' ').replace(/\w\S*/g, (txt: string) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())
        } : null,
        contact: {
            name: `${contact.firstName || ''} ${contact.lastName || ''}`.trim(),
            email: contact.email,
        },
        trademarks: trademarksContextData,
    };

    if (trademarksContextData.length === 1) {
        handlebarsContext = {
            ...handlebarsContext,
            ...trademarksContextData[0]
        };
    }
    return handlebarsContext;
}

function compileAndRender(templateString: string, context: any): string {
    const cleanTemplate = (templateString || '').replace(/<span class="merge-tag" contenteditable="false">({{[^}]+}})<\/span>/g, '$1');
    const compiledTemplate = Handlebars.compile(cleanTemplate);
    return compiledTemplate(context);
}

export async function getCampaigns() {
    return prisma.campaign.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            emailTemplate: true,
            _count: {
                select: { sentEmails: true },
            },
        },
    });
}

export async function getCampaignDetails(campaignId: number) {
    return prisma.campaign.findUnique({
        where: { id: campaignId },
        include: {
            emailTemplate: true,
            sentEmails: {
                include: {
                    contact: true,
                },
                orderBy: {
                    sentAt: 'desc',
                },
            },
        },
    });
}

export async function syncCampaignStatusAction(campaignId: number) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    try {
        const campaign = await prisma.campaign.findUnique({
            where: { id: campaignId },
            include: { sentEmails: true },
        });

        if (!campaign) {
            return { error: 'Campaign not found.' };
        }
        
        for (const email of campaign.sentEmails) {
            try {
                const { data, error } = await resend.emails.get(email.resendId);
                if (error || !data) {
                    console.warn(`Could not sync status for email ${email.resendId}:`, error);
                    continue;
                }
                
                const updates: { deliveredAt?: Date, openedAt?: Date } = {};
                
                if (data.last_event === 'delivered' && !email.deliveredAt) {
                    updates.deliveredAt = new Date();
                } else if (data.last_event === 'opened' && !email.openedAt) {
                    if (!email.deliveredAt) {
                        updates.deliveredAt = new Date();
                    }
                    updates.openedAt = new Date();
                }

                if (Object.keys(updates).length > 0) {
                    await prisma.sentEmail.update({
                        where: { id: email.id },
                        data: updates,
                    });
                }
            } catch (syncError) {
                 console.warn(`Error syncing status for email ${email.resendId}:`, syncError);
            }
        }
        revalidatePath(`/tracking/${campaignId}`);
        return { success: 'Campaign statuses synced.' };
    } catch (error) {
        console.error('Failed to sync campaign statuses:', error);
        return { error: 'An unexpected error occurred while syncing.' };
    }
}

    