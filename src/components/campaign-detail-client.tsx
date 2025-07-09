
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
import { ArrowLeft, Mail, MailOpen, CheckCircle2, XCircle, ArrowRight, RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import React, { useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import { syncCampaignStatusAction } from '@/app/campaigns/actions';


type CampaignDetailClientProps = {
  campaign: CampaignDetails;
};

export function CampaignDetailClient({ campaign }: CampaignDetailClientProps) {
  const { language, dictionary } = useLanguage();
  const [isSyncing, startSyncTransition] = useTransition();
  const { toast } = useToast();

  const formatDate = (date: Date) => {
    return format(date, 'MMM dd, yyyy, h:mm a', {
      locale: language === 'es' ? es : undefined,
    });
  };

  const handleSync = () => {
    startSyncTransition(async () => {
        const result = await syncCampaignStatusAction(campaign.id);
        if (result.error) {
            toast({
                title: dictionary.tracking.details.syncErrorTitle,
                description: result.error,
                variant: 'destructive',
            });
        } else {
            toast({
                title: dictionary.tracking.details.syncSuccessTitle,
                description: result.success || '',
            });
        }
    });
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          {campaign.name}
        </h1>
        <div className="flex gap-2">
            <Button onClick={handleSync} disabled={isSyncing} variant="outline">
                {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                {dictionary.tracking.details.syncButton}
            </Button>
            <Button asChild variant="outline">
                <Link href="/tracking">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {dictionary.tracking.details.back}
                </Link>
            </Button>
        </div>
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
            A list of all emails sent in this campaign. Click sync to fetch the latest statuses.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{dictionary.tracking.details.table.contact}</TableHead>
                <TableHead>{dictionary.tracking.details.table.deliveryStatus}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaign.sentEmails.map((email) => {
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
                      <div className="flex items-start space-x-4">
                          <div className="flex flex-col items-center gap-1 text-center w-28">
                              <TooltipProvider>
                                  <Tooltip>
                                      <TooltipTrigger asChild>
                                          <div className={cn("flex items-center justify-center p-2 rounded-full", email.sentAt ? 'bg-gray-100 text-gray-600' : 'bg-gray-50 text-gray-300')}>
                                              <Mail className="h-6 w-6"/>
                                          </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                          <p className="font-semibold">{dictionary.tracking.details.table.sent}</p>
                                      </TooltipContent>
                                  </Tooltip>
                              </TooltipProvider>
                               {email.sentAt ? (
                                  <p className="text-xs text-muted-foreground">{formatDate(new Date(email.sentAt))}</p>
                              ) : (
                                  <p className="text-xs text-muted-foreground">{dictionary.tracking.details.table.pending}</p>
                              )}
                          </div>

                          {email.sentAt && <ArrowRight className="h-5 w-5 text-gray-300 mt-3" />}

                          <div className="flex flex-col items-center gap-1 text-center w-28">
                              <TooltipProvider>
                                  <Tooltip>
                                      <TooltipTrigger asChild>
                                          <div className={cn("flex items-center justify-center p-2 rounded-full", email.deliveredAt ? 'bg-green-100 text-green-600' : 'bg-gray-50 text-gray-300')}>
                                              <CheckCircle2 className="h-6 w-6"/>
                                          </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                          <p className="font-semibold">{dictionary.tracking.details.table.delivered}</p>
                                      </TooltipContent>
                                  </Tooltip>
                              </TooltipProvider>
                              {email.deliveredAt ? (
                                  <p className="text-xs text-muted-foreground">{formatDate(new Date(email.deliveredAt))}</p>
                              ) : (
                                  <p className="text-xs text-muted-foreground">{dictionary.tracking.details.table.pending}</p>
                              )}
                          </div>

                          {email.deliveredAt && <ArrowRight className="h-5 w-5 text-gray-300 mt-3" />}

                          <div className="flex flex-col items-center gap-1 text-center w-28">
                              <TooltipProvider>
                                  <Tooltip>
                                      <TooltipTrigger asChild>
                                          <div className={cn("flex items-center justify-center p-2 rounded-full", email.openedAt ? 'bg-blue-100 text-blue-600' : 'bg-gray-50 text-gray-300')}>
                                              <MailOpen className="h-6 w-6"/>
                                          </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                          <p className="font-semibold">{dictionary.tracking.details.table.opened}</p>
                                      </TooltipContent>
                                  </Tooltip>
                              </TooltipProvider>
                              {email.openedAt ? (
                                  <p className="text-xs text-muted-foreground">{formatDate(new Date(email.openedAt))}</p>
                              ) : (
                                  <p className="text-xs text-muted-foreground">{dictionary.tracking.details.table.pending}</p>
                              )}
                          </div>
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
