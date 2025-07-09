
'use server';

import prisma from '@/lib/prisma';
import { Resend } from 'resend';
import * as Handlebars from 'handlebars';
import { format } from 'date-fns';
import { revalidatePath } from 'next/cache';
import type { Contact, Trademark } from '@/types';

interface SendCampaignPayload {
    templateId: number;
    contactsData: {
        contactId: number;
        trademarkIds: number[];
    }[];
}

export async function sendCampaignAction(payload: SendCampaignPayload) {
    const { templateId, contactsData } = payload;
    const resend = new Resend(process.env.RESEND_API_KEY);

    try {
        const template = await prisma.emailTemplate.findUnique({ where: { id: templateId } });
        if (!template) {
            return { error: 'Email template not found.' };
        }

        const campaign = await prisma.campaign.create({
            data: {
                name: `${template.name} - ${format(new Date(), 'yyyy-MM-dd HH:mm')}`,
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
            });

            if (!contact) continue;

            const handlebarsContext = {
                contact: {
                    name: `${contact.firstName || ''} ${contact.lastName || ''}`.trim(),
                    email: contact.email,
                },
                trademarks: trademarks.map(tm => ({
                    ...tm,
                    class: String(tm.class),
                    expiration: format(new Date(tm.expiration), 'yyyy-MM-dd'),
                })),
                 crmData: `Contact since ${format(contact.createdAt, 'yyyy-MM-dd')}. Associated with agent: ${contact.agent.name}.`
            };

            const subjectTemplate = Handlebars.compile(template.subject || '');
            const bodyTemplate = Handlebars.compile(template.body || '');
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
                    status: 'sent',
                    campaignId: campaign.id,
                    contactId: contact.id,
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
