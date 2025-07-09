
'use client';

import type { CampaignDetails, SentEmail, Contact } from '@/types';
import { useLanguage } from '@/context/language-context';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { Button } from './ui/button';
import { ArrowLeft, Mail, MailOpen, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import React from 'react';


type CampaignDetailClientProps = {
  campaign: CampaignDetails;
};

export function CampaignDetailClient({ campaign }: CampaignDetailClientProps) {
  const { language, dictionary } = useLanguage();

  const formatDate = (date: Date) => {
    return format(date, 'MMM dd, yyyy, h:mm a', {
      locale: language === 'es' ? es : undefined,
    });
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          {campaign.name}
        </h1>
        <Button asChild variant="outline">
            <Link href="/tracking">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {dictionary.tracking.details.back}
            </Link>
        </Button>
      </div>

      <Card>
          <CardHeader>
              <CardTitle>{dictionary.tracking.details.title}</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
              <div>
                  <p className="text-sm font-medium text-muted-foreground">{dictionary.tracking.details.template}</p>
                  <p>{campaign.emailTemplate.name}</p>
              </div>
               <div>
                  <p className="text-sm font-medium text-muted-foreground">{dictionary.tracking.details.sentAt}</p>
                  <p>{formatDate(new Date(campaign.createdAt))}</p>
              </div>
          </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{dictionary.tracking.details.sentEmailsTitle}</CardTitle>
          <CardDescription>
            A list of all emails sent in this campaign. Statuses are updated via Resend webhooks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{dictionary.tracking.details.table.contact}</TableHead>
                <TableHead>{dictionary.tracking.details.table.status}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaign.sentEmails.map((email) => {
                const sentAtFormatted = formatDate(new Date(email.sentAt));
                const status = email.status.toLowerCase();
                
                return (
                  <TableRow key={email.id}>
                    <TableCell>
                      <div className="font-medium">
                        <Link href={`/contacts/${email.contact.id}`} className="hover:underline text-primary">
                          {`${email.contact.firstName || ''} ${email.contact.lastName || ''}`.trim()}
                        </Link>
                      </div>
                      <div className="text-sm text-muted-foreground">{email.contact.email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1.5 text-gray-500"><Mail className="h-5 w-5"/></div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="font-semibold">{dictionary.tracking.details.table.sent}</p>
                              <p className="text-xs text-muted-foreground">{sentAtFormatted}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        {(status === 'delivered' || status === 'opened' || status === 'bounced') && <ArrowRight className="h-4 w-4 text-gray-300" />}
                        
                        {status === 'bounced' && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild><div className="flex items-center gap-1.5 text-red-600"><XCircle className="h-5 w-5"/></div></TooltipTrigger>
                              <TooltipContent>
                                <p className="font-semibold">{dictionary.tracking.details.table.bounced}</p>
                                <p className="text-xs text-muted-foreground">{dictionary.tracking.details.table.deliveryFailed}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        
                        {(status === 'delivered' || status === 'opened') && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild><div className="flex items-center gap-1.5 text-green-600"><CheckCircle2 className="h-5 w-5"/></div></TooltipTrigger>
                              <TooltipContent>
                                <p className="font-semibold">{dictionary.tracking.details.table.delivered}</p>
                                <p className="text-xs text-muted-foreground">{dictionary.tracking.details.table.statusUpdated}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}

                        {status === 'opened' && (
                          <>
                            <ArrowRight className="h-4 w-4 text-gray-300" />
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild><div className="flex items-center gap-1.5 text-blue-600"><MailOpen className="h-5 w-5"/></div></TooltipTrigger>
                                <TooltipContent>
                                  <p className="font-semibold">{dictionary.tracking.details.table.opened}</p>
                                  <p className="text-xs text-muted-foreground">{dictionary.tracking.details.table.statusUpdated}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

