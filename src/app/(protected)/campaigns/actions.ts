
'use server';

import prisma from '@/lib/prisma';
import { Resend } from 'resend';
import * as Handlebars from 'handlebars';
import { format } from 'date-fns';
import { revalidatePath } from 'next/cache';
import type { Contact, Owner, Trademark, Agent } from '@prisma/client';
import { checkPermission } from '@/lib/permissions';

type TemplateType = 'plain' | 'single-trademark' | 'multi-trademark-no-owner' | 'multi-owner';

// Helper to analyze the template body
function getTemplateType(templateBody: string): TemplateType {
    // Strip HTML tags to analyze only the text content and handlebars expressions
    const bodyAsText = templateBody.replace(/<[^>]*>/g, '');
    
    const hasOwnersLoop = /\{\{#each owners\}\}/.test(bodyAsText);
    const hasTrademarksLoop = /\{\{#each trademarks\}\}/.test(bodyAsText);
    // This regex looks for single trademark fields that are NOT part of a 'trademarks' loop.
    const hasSingleTrademarkFields = /\{\{\s*(?!\/?each)(?:owner\.)?(denomination|class|certificate|expiration|products|type)\s*\}\}/.test(bodyAsText);

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
    templateId: string;
    campaignName: string;
    trademarkIds: string[];
}

interface SendCampaignByContactPayload {
    sendMode: 'contact';
    templateId: string;
    campaignName: string;
    contactIds: string[];
    trademarkId?: string; // Optional trademarkId for single sends
}

interface SendCustomEmailPayload {
    sendMode: 'custom';
    subject: string;
    body: string;
    contactIds: string[];
    campaignName?: string;
    campaignId?: string;
}


type SendCampaignPayload = (SendCampaignByTrademarkPayload | SendCampaignByContactPayload) & { campaignId?: string };


export async function sendCampaignAction(payload: SendCampaignPayload | SendCustomEmailPayload) {
    await checkPermission('campaign:send');
    const resend = new Resend(process.env.RESEND_API_KEY);

    try {
        // Since there is no auth yet, we will fetch the first user and assign them as the sender.
        const user = await prisma.user.findFirst();
        if (!user) {
            return { error: "No users found in the system. Please seed the database." };
        }

        if (payload.sendMode === 'custom') {
            return handleSendCustomEmail(payload, user.id);
        }

        const { templateId, campaignName } = payload;
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
            if (templateType === 'single-trademark' && !payload.trademarkId) {
                return { error: "This template is for a single trademark, but no specific trademark was selected. It must be sent by trademark." };
            }
        }
        
        let campaignId;
        if (payload.campaignId && payload.campaignId !== 'new') {
            const existingCampaign = await prisma.campaign.findUnique({ where: { id: payload.campaignId } });
            if (!existingCampaign) return { error: 'Selected campaign not found.' };
            campaignId = existingCampaign.id;
        } else {
             const campaign = await prisma.campaign.create({
                data: { 
                    name: campaignName, 
                    emailTemplateId: template.id,
                    userId: user.id
                },
            });
            campaignId = campaign.id;
        }


        const emailJobs = new Map<string, { contact: any, context: any }>();
        
        if (payload.sendMode === 'contact') {
            // Processing for 'Send by Contact'
            const contacts = await prisma.contact.findMany({
                where: { id: { in: payload.contactIds } },
                include: {
                    agent: true,
                    ownerContacts: {
                        include: {
                            owner: {
                                include: {
                                    trademarks: { 
                                        include: { trademarkClasses: { include: { class: true } } },
                                        orderBy: { expiration: 'asc' } 
                                    }
                                }
                            }
                        }
                    }
                }
            });

            for (const contact of contacts) {
                let allOwners = contact.ownerContacts.map(oc => oc.owner);
                let allTrademarks = allOwners.flatMap(owner => owner.trademarks);

                // For single-trademark templates sent via contact (e.g., from dashboard action)
                // filter down to the specific trademark.
                if (templateType === 'single-trademark' && payload.trademarkId) {
                    allTrademarks = allTrademarks.filter(tm => tm.id === payload.trademarkId);
                    if (allTrademarks.length > 0) {
                        const ownerId = allTrademarks[0].ownerId;
                        allOwners = allOwners.filter(owner => owner.id === ownerId);
                    }
                }

                // For 'plain', 'multi-owner', and 'multi-trademark-no-owner' templates sent by contact
                const context = await createHandlebarsContext(contact, allOwners, allTrademarks);
                emailJobs.set(contact.email, { contact, context });
            }

        } else if (payload.sendMode === 'trademark') {
            // Processing for 'Send by Trademark'
            const selectedTrademarks = await prisma.trademark.findMany({
                where: { id: { in: payload.trademarkIds } },
                include: {
                    owner: {
                        include: {
                            ownerContacts: {
                                include: {
                                    contact: {
                                        include: {
                                            agent: true
                                        }
                                    }
                                }
                            }
                        }
                    },
                    trademarkClasses: { include: { class: true } }
                }
            });
            
            if (templateType === 'multi-trademark-no-owner') {
                // Group trademarks by their contact. One email per contact with a list of their trademarks.
                const trademarksByContact = new Map<string, { contact: any; trademarks: any[] }>();
                for (const tm of selectedTrademarks) {
                    for (const ownerContact of tm.owner.ownerContacts) {
                        const contact = ownerContact.contact;
                        if (!trademarksByContact.has(contact.id)) {
                            trademarksByContact.set(contact.id, { contact, trademarks: [] });
                        }
                        trademarksByContact.get(contact.id)!.trademarks.push(tm);
                    }
                }
                
                for (const { contact, trademarks } of trademarksByContact.values()) {
                    // Context will have a list of trademarks for a single-owner (the one associated with the marks)
                    const owner = trademarks[0].owner;
                    const context = await createHandlebarsContext(contact, [owner], trademarks);
                    const jobKey = `${contact.email}`; // Unique key per contact
                    emailJobs.set(jobKey, { contact, context });
                }

            } else { // Single-trademark: Send one email per trademark, per contact
                for (const tm of selectedTrademarks) {
                     for (const ownerContact of tm.owner.ownerContacts) {
                        const contact = ownerContact.contact;
                        const context = await createHandlebarsContext(contact, [tm.owner], [tm]);
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
                from: 'Legal CRM <notifications@updates.artecasa.com.pe>',
                to: [contact.email],
                subject: emailSubject,
                html: emailBody,
                tags: [
                    { name: 'campaign_id', value: String(campaignId) },
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
                    campaignId: campaignId,
                    contactId: contact.id,
                },
            });
        }

        revalidatePath('/tracking');
        return { success: `Campaign "${campaignName}" sent successfully to ${emailJobs.size} recipients.` };

    } catch (error) {
        console.error('Failed to send campaign:', error);
        return { error: 'An unexpected error occurred while sending the campaign.' };
    }
}


async function handleSendCustomEmail(payload: SendCustomEmailPayload, userId: string) {
    const resend = new Resend(process.env.RESEND_API_KEY);

    let campaignId: string;
    let campaignName: string;

    const contact = await prisma.contact.findUnique({
        where: { id: payload.contactIds[0] },
        include: {
            agent: true,
            ownerContacts: {
                include: {
                    owner: {
                        include: {
                            trademarks: { 
                                include: { trademarkClasses: { include: { class: true } } },
                                orderBy: { expiration: 'asc' }
                            }
                        }
                    }
                }
            }
        }
    });
    if (!contact) {
        return { error: 'Contact not found.' };
    }

    if (payload.campaignId && payload.campaignId !== 'new') {
        const existingCampaign = await prisma.campaign.findUnique({ where: { id: payload.campaignId } });
        if (!existingCampaign) return { error: 'Selected campaign not found.' };
        campaignId = existingCampaign.id;
        campaignName = existingCampaign.name;
    } else {
        if (!payload.campaignName) {
            return { error: 'Campaign name is required for new campaigns.' };
        }
        campaignName = payload.campaignName;
        const newCampaign = await prisma.campaign.create({
            data: {
                name: campaignName,
                userId: userId,
                // Custom emails don't have a persistent template, so we can't link one.
            }
        });
        campaignId = newCampaign.id;
    }

    const allOwners = contact.ownerContacts.map(oc => oc.owner);
    const allTrademarks = allOwners.flatMap(owner => owner.trademarks);
    const context = await createHandlebarsContext(contact, allOwners, allTrademarks);

    const emailSubject = compileAndRender(payload.subject, context);
    const emailBody = compileAndRender(payload.body, context);

    const { data, error } = await resend.emails.send({
        from: 'Legal CRM <notifications@updates.artecasa.com.pe>',
        to: [contact.email],
        subject: emailSubject,
        html: emailBody,
        tags: [
            { name: 'campaign_id', value: String(campaignId) },
            { name: 'email_type', value: 'custom' },
        ]
    });

    if (error || !data) {
        console.error(`Failed to send custom email to ${contact.email}:`, error);
        return { error: 'Failed to send custom email.' };
    }

    await prisma.sentEmail.create({
        data: {
            resendId: data.id,
            campaignId: campaignId,
            contactId: contact.id,
        },
    });

    revalidatePath('/tracking');
    return { success: `Email successfully sent to ${contact.email} as part of campaign "${campaignName}".` };
}


type FullOwner = Owner & { trademarks: (Trademark & { trademarkClasses: { class: { id: number } }[] })[] };
type FullContact = Contact & { agent: Agent };

async function createHandlebarsContext(contact: FullContact, owners: FullOwner[], allTrademarks: any[]): Promise<any> {
    const ownersContext = owners.map(owner => ({
        name: owner.name,
        country: owner.country.replace(/_/g, ' ').replace(/\w\S*/g, (txt: string) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()),
        trademarks: (owner.trademarks || []).map(tm => ({
            denomination: tm.denomination,
            class: tm.trademarkClasses.map(tc => tc.class.id).join(', '),
            certificate: tm.certificate,
            expiration: tm.expiration ? format(new Date(tm.expiration), 'yyyy-MM-dd') : '',
            products: tm.products,
            type: tm.type
        }))
    }));

    const trademarksContextData = allTrademarks.map(tm => ({
        denomination: tm.denomination,
        class: tm.trademarkClasses.map((tc: any) => tc.class.id).join(', '),
        certificate: tm.certificate,
        expiration: tm.expiration ? format(new Date(tm.expiration), 'yyyy-MM-dd') : '',
        products: tm.products,
        type: tm.type
    }));

    let handlebarsContext: any = {
        agent: contact.agent,
        contact: {
            name: `${contact.firstName || ''} ${contact.lastName || ''}`.trim(),
            firstName: contact.firstName || '',
            lastName: contact.lastName || '',
            email: contact.email,
        },
        owners: ownersContext,
    };
    
    // For convenience in 'multi-trademark-no-owner' and 'single-trademark' templates
    // where there's logically only one owner in the context, or no owner context at all.
    if (owners.length === 1) {
        handlebarsContext.owner = ownersContext[0];
    }
    
    // Always provide the trademarks list for templates that need it.
    if (allTrademarks.length > 0) {
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
            user: true,
            emailTemplate: true,
            _count: {
                select: { sentEmails: true },
            },
        },
    });
}

export async function getCampaignDetails(campaignId: string) {
    return prisma.campaign.findUnique({
        where: { id: campaignId },
        include: {
            user: true,
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

export async function getContactDataForPreview(contactId: string, trademarkId?: string) {
    if (!contactId) return null;
    const contact = await prisma.contact.findUnique({
        where: { id: contactId },
        include: {
            agent: true,
            ownerContacts: {
                include: {
                    owner: {
                        include: {
                           trademarks: { 
                                include: { trademarkClasses: { include: { class: true } } },
                                orderBy: { expiration: 'asc' } 
                           }
                        }
                    }
                }
            }
        }
    });
    if (!contact) return null;

    let allOwners = contact.ownerContacts.map(oc => oc.owner);
    let allTrademarks = allOwners.flatMap(owner => owner.trademarks);

    // If a specific trademarkId is provided, filter the context for that single trademark
    if (trademarkId) {
        allTrademarks = allTrademarks.filter(tm => tm.id === trademarkId);
        if (allTrademarks.length > 0) {
            const singleOwnerId = allTrademarks[0].ownerId;
            allOwners = allOwners.filter(owner => owner.id === singleOwnerId);
        }
    }
    
    return createHandlebarsContext(contact, allOwners, allTrademarks);
}

export async function syncCampaignStatusAction(campaignId: string) {
    await checkPermission('campaign:sync');
    
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

export async function deleteCampaignAction(campaignId: string) {
    await checkPermission('campaign:delete');
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
