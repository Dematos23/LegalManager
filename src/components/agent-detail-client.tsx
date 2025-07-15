
'use client';

import type { AgentWithDetails } from '@/types';
import { useLanguage } from '@/context/language-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Mail, Briefcase, Building, Globe, Network, Contact as ContactIcon, FileText } from 'lucide-react';
import { format, differenceInDays, isPast } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Button } from './ui/button';
import { ChevronDown } from 'lucide-react';


type AgentDetailClientProps = {
  agent: AgentWithDetails;
};

export function AgentDetailClient({ agent }: AgentDetailClientProps) {
  const { dictionary } = useLanguage();

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          Agent Profile
        </h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Agent Info Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Briefcase className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-2xl">{agent.name}</CardTitle>
                <CardDescription>Agent Details</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm">{agent.country.replace(/_/g, ' ')}</span>
            </div>
            {agent.area && (
              <div className="flex items-center gap-3">
                <Network className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm">{agent.area}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Associated Contacts */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Associated Contacts</CardTitle>
              <CardDescription>Contacts managed by {agent.name}</CardDescription>
            </CardHeader>
            <CardContent>
                {agent.contacts.length === 0 ? (
                    <p className="text-muted-foreground">This agent has no associated contacts.</p>
                ) : (
                    agent.contacts.map(contact => (
                         <Collapsible key={contact.id} className="border-b last:border-b-0">
                            <CollapsibleTrigger asChild>
                                <div className="flex items-center justify-between w-full p-4 cursor-pointer hover:bg-muted/50">
                                    <div className="flex items-center gap-3">
                                        <ContactIcon className="h-5 w-5 text-primary" />
                                        <div className="flex flex-col text-left">
                                            <Link href={`/contacts/${contact.id}`} className="font-medium hover:underline">
                                                {contact.firstName} {contact.lastName}
                                            </Link>
                                            <span className="text-sm text-muted-foreground">{contact.email}</span>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm">
                                        <ChevronDown className="h-4 w-4" />
                                        <span className="sr-only">Toggle</span>
                                    </Button>
                                </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="p-4 pt-0 space-y-4">
                                {contact.owners.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">This contact has no associated owners.</p>
                                ) : (
                                    contact.owners.map(owner => (
                                        <Card key={owner.id}>
                                            <CardHeader>
                                                <div className="flex items-center gap-3">
                                                    <Building className="h-6 w-6 text-primary" />
                                                    <div>
                                                    <CardTitle className="text-base">{owner.name}</CardTitle>
                                                    <CardDescription className="flex items-center gap-2 text-xs">
                                                        <Globe className="h-4 w-4" /> {owner.country.replace(/_/g, ' ').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())}
                                                    </CardDescription>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <h4 className="mb-2 text-sm font-semibold">Trademarks</h4>
                                                {owner.trademarks.length === 0 ? (
                                                    <p className="text-xs text-muted-foreground">This owner has no trademarks.</p>
                                                ) : (
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                            <TableHead className="text-xs">Denomination</TableHead>
                                                            <TableHead className="text-xs">Class</TableHead>
                                                            <TableHead className="text-xs">Expiration</TableHead>
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
                                                                        <TableCell className="font-medium text-xs">{trademark.denomination}</TableCell>
                                                                        <TableCell className="text-xs">{trademark.class}</TableCell>
                                                                        <TableCell className={cn('text-xs', colorClass)}>
                                                                            {format(expirationDate, 'MMM dd, yyyy')}
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
                            </CollapsibleContent>
                        </Collapsible>
                    ))
                )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
