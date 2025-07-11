
'use server';

import prisma from '@/lib/prisma';
import { Resend } from 'resend';
import * as Handlebars from 'handlebars';
import { format } from 'date-fns';
import { revalidatePath } from 'next/cache';
import type { Contact, Owner, Trademark, Agent } from '@prisma/client';

type TemplateType = 'plain' | 'single-trademark' | 'multi-trademark-no-owner' | 'multi-owner';

// Helper to analyze the template body
function getTemplateType(templateBody: string): TemplateType {
    // Strip HTML tags to analyze only the text content and handlebars expressions
    const bodyAsText = templateBody.replace(/<[^>]*>/g, '');
    
    const hasOwnersLoop = /\{\{#each owners\}\}/.test(bodyAsText);
    const hasTrademarksLoop = /\{\{#each trademarks\}\}/.test(bodyAsText);
    // This regex looks for single trademark fields that are NOT part of a 'trademarks' loop.
    const hasSingleTrademarkFields = /\{\{(?!\/?each)(denomination|class|certificate|expiration|products|type)\}\}/.test(bodyAsText);
    
    if (hasOwnersLoop) {
        return 'multi-owner';
    }
    if (hasTrademarksLoop) {
        // Doesn't have owner loop, but has trademark loop
        return 'multi-trademark-no-owner';
    }
    if (hasSingleTrademarkFields && !hasTrademarksLoop && !hasOwnersLoop) {
        return 'single-trademark';
    }
    return 'plain';
}


interface SendCampaignByTrademarkPayload {
    sendMode: 'trademark';
    templateId: number;
    campaignName: string;
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
        // --- Basic Validation ---
        if (!campaignName || campaignName.trim().length < 10) {
            return { error: 'Campaign name must be at least 10 characters long.' };
        }

        const template = await prisma.emailTemplate.findUnique({ where: { id: templateId } });
        if (!template) {
            return { error: 'Email template not found.' };
        }
        
        const templateType = getTemplateType(template.body);

        // --- Logic Validation ---
        if (payload.sendMode === 'trademark') {
            if (templateType === 'plain') {
                return { error: "Plain text templates don't use trademark data and must be sent by contact." };
            }
            if (templateType === 'multi-owner') {
                return { error: "This multi-owner template includes all of a contact's data and must be sent by contact." };
            }
        } else if (payload.sendMode === 'contact') {
            if (templateType === 'single-trademark') {
                return { error: "This template is for a single trademark, but no specific trademark was selected. It must be sent by trademark." };
            }
        }

        const campaign = await prisma.campaign.create({
            data: { name: campaignName, emailTemplateId: template.id },
        });

        const emailJobs = new Map<string, { contact: any, context: any }>();
        
        if (payload.sendMode === 'contact') {
            // Processing for 'Send by Contact'
            const contacts = await prisma.contact.findMany({
                where: { id: { in: payload.contactIds } },
                include: {
                    agent: true,
                    owners: { 
                        include: { 
                            trademarks: { orderBy: { expiration: 'asc' } } 
                        } 
                    }
                }
            });

            for (const contact of contacts) {
                const allOwners = contact.owners;
                const allTrademarks = allOwners.flatMap(owner => owner.trademarks);

                // For 'plain', 'multi-owner', and 'multi-trademark-no-owner' templates sent by contact
                const context = createHandlebarsContext(contact, allOwners, allTrademarks);
                emailJobs.set(contact.email, { contact, context });
            }

        } else if (payload.sendMode === 'trademark') {
            // Processing for 'Send by Trademark'
            const selectedTrademarks = await prisma.trademark.findMany({
                where: { id: { in: payload.trademarkIds } },
                include: { owner: { include: { contacts: { include: { agent: true } } } } }
            });
            
            if (templateType === 'multi-trademark-no-owner') {
                // Group trademarks by their contact. One email per contact with a list of their trademarks.
                const trademarksByContact = new Map<number, { contact: any; trademarks: any[] }>();
                for (const tm of selectedTrademarks) {
                    for (const contact of tm.owner.contacts) {
                        if (!trademarksByContact.has(contact.id)) {
                            trademarksByContact.set(contact.id, { contact, trademarks: [] });
                        }
                        trademarksByContact.get(contact.id)!.trademarks.push(tm);
                    }
                }
                
                for (const { contact, trademarks } of trademarksByContact.values()) {
                    // Context will have a list of trademarks for a single-owner (the one associated with the marks)
                    const owner = trademarks[0].owner;
                    const context = createHandlebarsContext(contact, [owner], trademarks);
                    const jobKey = `${contact.email}`; // Unique key per contact
                    emailJobs.set(jobKey, { contact, context });
                }

            } else { // Single-trademark: Send one email per trademark, per contact
                for (const tm of selectedTrademarks) {
                     for (const contact of tm.owner.contacts) {
                        const context = createHandlebarsContext(contact, [tm.owner], [tm]);
                        const jobKey = `${contact.email}-${tm.id}`; // Unique key per contact-trademark pair
                        emailJobs.set(jobKey, { contact, context });
                    }
                }
            }
        }

        if (emailJobs.size === 0) {
            return { error: 'No valid recipients found for this campaign based on your selection.' };
        }

        // --- Send Emails ---
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

type FullOwner = Owner & { trademarks: Trademark[] };
type FullContact = Contact & { agent: Agent };

function createHandlebarsContext(contact: FullContact, owners: FullOwner[], allTrademarks: Trademark[]): any {
    const ownersContext = owners.map(owner => ({
        name: owner.name,
        country: owner.country.replace(/_/g, ' ').replace(/\w\S*/g, (txt: string) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()),
        trademarks: (owner.trademarks || []).map(tm => ({
            denomination: tm.denomination,
            class: String(tm.class),
            certificate: tm.certificate,
            expiration: format(new Date(tm.expiration), 'yyyy-MM-dd'),
            products: tm.products,
            type: tm.type
        }))
    }));

    // For multi-trademark-no-owner, trademarks are grouped under a single owner in the context
    // For single-trademark, allTrademarks will just have one.
    const trademarksContextData = allTrademarks.map(tm => ({
        denomination: tm.denomination,
        class: String(tm.class),
        certificate: tm.certificate,
        expiration: format(new Date(tm.expiration), 'yyyy-MM-dd'),
        products: tm.products,
        type: tm.type
    }));

    let handlebarsContext: any = {
        agent: contact.agent,
        contact: {
            name: `${contact.firstName || ''} ${contact.lastName || ''}`.trim(),
            email: contact.email,
        },
        owners: ownersContext,
    };
    
    // For convenience in 'multi-trademark-no-owner' and 'single-trademark' templates
    // where there's logically only one owner in the context.
    if (owners.length === 1) {
        handlebarsContext.owner = ownersContext[0];
        handlebarsContext.trademarks = trademarksContextData;
    }
    
    // For single-trademark contexts, provide top-level trademark fields
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
    const compiledTemplate = Handlebars.compile(cleanTemplate, { noEscape: true });
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

export async function deleteCampaignAction(campaignId: number) {
    try {
        // Use a transaction to ensure both deletions succeed or fail together
        await prisma.$transaction([
            // First, delete all SentEmail records associated with the campaign
            prisma.sentEmail.deleteMany({
                where: { campaignId: campaignId },
            }),
            // Then, delete the Campaign itself
            prisma.campaign.delete({
                where: { id: campaignId },
            }),
        ]);
        revalidatePath('/tracking');
        return { success: true };
    } catch (error) {
        console.error('Failed to delete campaign:', error);
        return { error: 'An unexpected error occurred while deleting the campaign.' };
    }
}
