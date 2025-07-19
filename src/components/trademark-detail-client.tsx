
'use client';

import type { TrademarkWithDetails } from '@/types';
import { useLanguage } from '@/context/language-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { format } from 'date-fns';
import { FileText, CalendarClock, Building, Contact as ContactIcon, Briefcase, Tag, Edit, Layers, Package } from 'lucide-react';
import { Separator } from './ui/separator';

type TrademarkDetailClientProps = {
  trademark: TrademarkWithDetails;
};

export function TrademarkDetailClient({ trademark }: TrademarkDetailClientProps) {
  const { dictionary } = useLanguage();
  const contact = trademark.owner.ownerContacts?.[0]?.contact;

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-primary break-all">
          {trademark.denomination}
        </h1>
        <Button asChild>
            <Link href={`/trademarks/${trademark.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                {dictionary.templates.table.edit}
            </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{dictionary.trademarkForm.trademarkDetailsTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex items-start gap-4">
                <FileText className="h-6 w-6 text-muted-foreground flex-shrink-0 mt-1" />
                <div className="flex-grow">
                  <p className="text-sm font-semibold text-muted-foreground">{dictionary.dashboard.table.certificate}</p>
                  <p className="text-lg">{trademark.certificate}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <CalendarClock className="h-6 w-6 text-muted-foreground flex-shrink-0 mt-1" />
                <div className="flex-grow">
                  <p className="text-sm font-semibold text-muted-foreground">{dictionary.dashboard.table.expiration}</p>
                  <p className="text-lg">{format(new Date(trademark.expiration), 'MMM dd, yyyy')}</p>
                </div>
              </div>
              {trademark.type && (
                <div className="flex items-start gap-4">
                    <Tag className="h-6 w-6 text-muted-foreground flex-shrink-0 mt-1" />
                    <div className="flex-grow">
                        <p className="text-sm font-semibold text-muted-foreground">{dictionary.contact.type}</p>
                        <Badge variant="outline" className="text-base mt-1">{trademark.type.charAt(0).toUpperCase() + trademark.type.slice(1).toLowerCase()}</Badge>
                    </div>
                </div>
              )}
               <div className="flex items-start gap-4">
                 <Layers className="h-6 w-6 text-muted-foreground flex-shrink-0 mt-1" />
                 <div className="flex-grow">
                    <p className="text-sm font-semibold text-muted-foreground">{dictionary.dashboard.table.class}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                        {trademark.trademarkClasses.map(tc => (
                            <Badge key={tc.classId} variant="secondary">{tc.class.id}</Badge>
                        ))}
                    </div>
                 </div>
               </div>
            </div>
            {trademark.products && (
                <>
                    <Separator className="my-4" />
                    <div className="flex items-start gap-4">
                        <Package className="h-6 w-6 text-muted-foreground flex-shrink-0 mt-1" />
                        <div className="flex-grow">
                            <p className="text-sm font-semibold text-muted-foreground">{dictionary.trademarkForm.products}</p>
                            <p className="text-sm mt-1 whitespace-pre-wrap">{trademark.products}</p>
                        </div>
                    </div>
                </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{dictionary.trademarkForm.ownerAndContactTitle}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href={`/owners/${trademark.owner.id}`} className="block hover:bg-muted/50 p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                    <Building className="h-6 w-6 text-primary" />
                    <div>
                        <p className="text-sm text-muted-foreground">{dictionary.dashboard.table.owner}</p>
                        <p className="font-semibold">{trademark.owner.name}</p>
                    </div>
                </div>
            </Link>
            {contact && (
              <Link href={`/contacts/${contact.id}`} className="block hover:bg-muted/50 p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <ContactIcon className="h-6 w-6 text-primary" />
                    <div>
                        <p className="text-sm text-muted-foreground">{dictionary.dashboard.table.contact}</p>
                        <p className="font-semibold">{contact.firstName} {contact.lastName}</p>
                        <p className="text-xs text-muted-foreground">{contact.email}</p>
                    </div>
                  </div>
              </Link>
            )}
            {contact?.agent && (
              <Link href={`/agents/${contact.agent.id}`} className="block hover:bg-muted/50 p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-6 w-6 text-primary" />
                    <div>
                        <p className="text-sm text-muted-foreground">{dictionary.dashboard.table.agent}</p>
                        <p className="font-semibold">{contact.agent.name}</p>
                    </div>
                  </div>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
