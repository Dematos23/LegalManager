
'use client';

import type { ContactWithDetails } from '@/types';
import { useLanguage } from '@/context/language-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Mail, Briefcase, Building, Globe, Network, Contact as ContactIcon } from 'lucide-react';
import { format, differenceInDays, isPast } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

type ContactDetailClientProps = {
  contact: ContactWithDetails;
};

export function ContactDetailClient({ contact }: ContactDetailClientProps) {
  const { dictionary } = useLanguage();

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          {dictionary.contact.title}
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Contact Info Card */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <ContactIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-2xl">{`${contact.firstName} ${contact.lastName}`}</CardTitle>
                <CardDescription>{dictionary.contact.contactDetails}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm">{contact.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <Briefcase className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm">{contact.agent.name}</span>
            </div>
            {contact.agent.area && (
              <div className="flex items-center gap-3">
                <Network className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm">{contact.agent.area}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Associated Owners & Trademarks */}
        <div className="space-y-6">
          {contact.owners.length === 0 ? (
            <Card>
              <CardHeader>
                 <CardTitle>{dictionary.contact.ownersTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{dictionary.contact.noOwners}</p>
              </CardContent>
            </Card>
          ) : (
            contact.owners.map(owner => (
              <Card key={owner.id}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Building className="h-6 w-6 text-primary" />
                    <div>
                      <CardTitle>{owner.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                         <Globe className="h-4 w-4" /> {owner.country.replace(/_/g, ' ').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <h3 className="mb-4 text-lg font-semibold">{dictionary.contact.trademarksTitle}</h3>
                  {owner.trademarks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{dictionary.contact.noTrademarks}</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{dictionary.dashboard.table.trademark}</TableHead>
                          <TableHead>{dictionary.dashboard.table.class}</TableHead>
                           <TableHead>{dictionary.contact.type}</TableHead>
                          <TableHead>{dictionary.dashboard.table.expiration}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {owner.trademarks.map(trademark => {
                          const expirationDate = new Date(trademark.expiration);
                          const daysUntilExpiration = differenceInDays(expirationDate, new Date());
                          const hasExpired = isPast(expirationDate);
                          const colorClass = hasExpired
                            ? 'text-destructive font-semibold'
                            : daysUntilExpiration <= 30
                            ? 'text-destructive'
                            : daysUntilExpiration <= 90
                            ? 'text-warning'
                            : '';

                          return (
                            <TableRow key={trademark.id}>
                              <TableCell className="font-medium">{trademark.denomination}</TableCell>
                              <TableCell>{trademark.class}</TableCell>
                              <TableCell>{trademark.type ? <Badge variant="outline">{trademark.type.charAt(0).toUpperCase() + trademark.type.slice(1).toLowerCase()}</Badge> : 'N/A'}</TableCell>
                              <TableCell className={cn('flex flex-col', colorClass)}>
                                <span>{format(expirationDate, 'MMM dd, yyyy')}</span>
                                <span className="text-xs">
                                  {hasExpired ? `${dictionary.contact.expired} ${-daysUntilExpiration} ${dictionary.contact.daysAgo}` : `${dictionary.contact.in} ${daysUntilExpiration} ${dictionary.contact.days}`}
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
