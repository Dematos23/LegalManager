
'use server';

import prisma from '@/lib/prisma';
import { Resend } from 'resend';
import * as Handlebars from 'handlebars';
import { format } from 'date-fns';
import { revalidatePath } from 'next/cache';
import type { Contact, Trademark } from '@/types';

interface SendCampaignPayload {
    templateId: number;
    campaignName: string;
    contactsData: {
        contactId: number;
        trademarkIds: number[];
    }[];
}

export async function sendCampaignAction(payload: SendCampaignPayload) {
    const { templateId, campaignName, contactsData } = payload;
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
            data: {
                name: campaignName,
                emailTemplateId: template.id,
            },
        });

        for (const item of contactsData) {
            const contact = await prisma.contact.findUnique({
                where: { id: item.contactId },
                include: { agent: true }
            });
            const trademarks = await prisma.trademark.findMany({
                where: { id: { in: item.trademarkIds } },
                include: { owner: true }
            });

            if (!contact) continue;

            const owner = trademarks.length > 0 ? trademarks[0].owner : null;

            const handlebarsContext = {
                agent: contact.agent,
                owner: owner ? {
                    ...owner,
                    country: owner.country.replace(/_/g, ' ').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())
                } : null,
                contact: {
                    name: `${contact.firstName || ''} ${contact.lastName || ''}`.trim(),
                    email: contact.email,
                },
                trademarks: trademarks.map(tm => ({
                    ...tm,
                    owner: undefined, // remove nested owner to avoid confusion
                    class: String(tm.class),
                    expiration: format(new Date(tm.expiration), 'yyyy-MM-dd'),
                    denomination: tm.denomination,
                    certificate: tm.certificate,
                    products: tm.products
                })),
            };

            const cleanSubject = (template.subject || '').replace(/<span class="merge-tag" contenteditable="false">(.*?)<\/span>/g, '$1');
            const cleanBody = (template.body || '').replace(/<span class="merge-tag" contenteditable="false">(.*?)<\/span>/g, '$1');

            const subjectTemplate = Handlebars.compile(cleanSubject);
            const bodyTemplate = Handlebars.compile(cleanBody);
            const emailSubject = subjectTemplate(handlebarsContext);
            const emailBody = bodyTemplate(handlebarsContext);
            
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
                // Optionally, log this failure somewhere
                continue;
            }

            await prisma.sentEmail.create({
                data: {
                    resendId: data.id,
                    campaignId: campaign.id,
                    contactId: contact.id,
                    deliveredAt: null,
                    openedAt: null,
                },
            });
        }

        revalidatePath('/tracking');
        return { success: `Campaign "${campaign.name}" sent successfully.` };

    } catch (error) {
        console.error('Failed to send campaign:', error);
        return { error: 'An unexpected error occurred while sending the campaign.' };
    }
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
                    // If it was opened, it must have been delivered.
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
