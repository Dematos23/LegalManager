
'use client';

import type { CampaignWithDetails } from '@/types';
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
import { Eye } from 'lucide-react';
import { Badge } from './ui/badge';

type TrackingClientProps = {
  campaigns: CampaignWithDetails[];
};

export function TrackingClient({ campaigns }: TrackingClientProps) {
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
          {dictionary.tracking.title}
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{dictionary.tracking.title}</CardTitle>
          <CardDescription>{dictionary.tracking.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <div className="flex justify-center items-center h-40">
              <p className="text-muted-foreground">{dictionary.tracking.noCampaigns}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{dictionary.tracking.table.campaignName}</TableHead>
                  <TableHead>{dictionary.tracking.table.template}</TableHead>
                  <TableHead>{dictionary.tracking.table.recipients}</TableHead>
                  <TableHead>{dictionary.tracking.table.sentAt}</TableHead>
                  <TableHead className="text-right">{dictionary.tracking.table.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">{campaign.name}</TableCell>
                    <TableCell>{campaign.emailTemplate.name}</TableCell>
                    <TableCell>
                        <Badge variant="outline">{campaign._count.sentEmails}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(new Date(campaign.createdAt))}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/tracking/${campaign.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            {dictionary.tracking.table.view}
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
