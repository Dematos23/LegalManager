
'use client';

import type { CampaignDetails } from '@/types';
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
import { ArrowLeft } from 'lucide-react';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';

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

  const getStatusBadge = (status: string) => {
      switch (status.toLowerCase()) {
          case 'sent':
              return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
          case 'delivered':
              return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
          case 'bounced':
              return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
          case 'opened':
              return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300';
          default:
              return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      }
  }

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
                <TableHead>{dictionary.tracking.details.table.email}</TableHead>
                <TableHead>{dictionary.tracking.details.table.status}</TableHead>
                <TableHead>{dictionary.tracking.details.table.sentAt}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaign.sentEmails.map((email) => (
                <TableRow key={email.id}>
                  <TableCell className="font-medium">
                      <Link href={`/contacts/${email.contact.id}`} className="hover:underline text-primary">
                        {`${email.contact.firstName || ''} ${email.contact.lastName || ''}`.trim()}
                      </Link>
                  </TableCell>
                  <TableCell>{email.contact.email}</TableCell>
                  <TableCell>
                      <Badge className={cn("border-transparent capitalize", getStatusBadge(email.status))}>
                          {email.status}
                      </Badge>
                  </TableCell>
                  <TableCell>{formatDate(new Date(email.sentAt))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
