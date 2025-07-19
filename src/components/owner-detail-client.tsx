
'use client';

import * as React from 'react';
import type { OwnerWithDetails, ContactWithAgent, Agent } from '@/types';
import { useLanguage } from '@/context/language-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building, Globe, FileText, CalendarClock, Contact as ContactIcon, Mail, Briefcase, Edit } from 'lucide-react';
import { format, differenceInDays, isPast } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from './ui/checkbox';
import { updateOwnerContacts } from '@/app/owners/actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { useIsMobile } from '@/hooks/use-mobile';

type FullContact = ContactWithAgent;

function EditContactsDialog({ owner, allContacts, allAgents }: { owner: OwnerWithDetails; allContacts: FullContact[], allAgents: Agent[] }) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [isSaving, startSavingTransition] = React.useTransition();
    const { toast } = useToast();
    const router = useRouter();
    const { dictionary } = useLanguage();

    const ownerContacts = owner.ownerContacts.map(oc => oc.contact);
    const initialAgentId = ownerContacts[0]?.agentId;
    const [selectedAgentId, setSelectedAgentId] = React.useState<number | undefined>(initialAgentId);

    const [selectedContactIds, setSelectedContactIds] = React.useState<number[]>(() =>
        ownerContacts.map(c => c.id)
    );

    const handleAgentChange = (agentId: string) => {
        const id = Number(agentId);
        setSelectedAgentId(id);
        setSelectedContactIds([]); // Clear selection when agent changes
    };

    const handleSave = async () => {
        if (ownerContacts.length > 0 && !selectedAgentId) {
            toast({ title: "Agent Required", description: "Please select an agent before saving.", variant: 'destructive' });
            return;
        }

        startSavingTransition(async () => {
            const result = await updateOwnerContacts(owner.id, selectedContactIds);
            if (result.success) {
                toast({ title: "Contacts Updated", description: "The owner's contact list has been updated." });
                setIsOpen(false);
                router.refresh();
            } else {
                toast({ title: "Error", description: result.error, variant: 'destructive' });
            }
        });
    };
    
    const availableContacts = selectedAgentId
        ? allContacts.filter(c => c.agentId === selectedAgentId)
        : [];

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                    <Edit className="mr-2 h-4 w-4" />
                    {dictionary.owner.editContacts}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{dictionary.owner.editContacts} for {owner.name}</DialogTitle>
                    <DialogDescription>
                        Select an agent, then select the contacts to associate with this owner.
                    </DialogDescription>
                </DialogHeader>
                 <div className="space-y-2">
                    <Label htmlFor="agent-select">Agent</Label>
                    <Select
                        value={selectedAgentId ? String(selectedAgentId) : ''}
                        onValueChange={handleAgentChange}
                    >
                        <SelectTrigger id="agent-select">
                            <SelectValue placeholder="Select an agent..." />
                        </SelectTrigger>
                        <SelectContent>
                            {allAgents.map(agent => (
                                <SelectItem key={agent.id} value={String(agent.id)}>
                                    {agent.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-4 max-h-60 overflow-y-auto p-1">
                    {availableContacts.map(contact => (
                        <div key={contact.id} className="flex items-center space-x-3 rounded-md border p-3">
                            <Checkbox
                                id={`contact-${contact.id}`}
                                checked={selectedContactIds.includes(contact.id)}
                                onCheckedChange={(checked) => {
                                    setSelectedContactIds(prev =>
                                        checked ? [...prev, contact.id] : prev.filter(id => id !== contact.id)
                                    );
                                }}
                            />
                            <label
                                htmlFor={`contact-${contact.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                <div className="flex flex-col">
                                    <span>{contact.firstName} {contact.lastName}</span>
                                    <span className="text-xs text-muted-foreground">{contact.email}</span>
                                </div>
                            </label>
                        </div>
                    ))}
                    {selectedAgentId && availableContacts.length === 0 && (
                        <p className="text-sm text-center text-muted-foreground p-4">
                            This agent has no contacts.
                        </p>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

type OwnerDetailClientProps = {
  owner: OwnerWithDetails;
  allContacts: FullContact[];
  allAgents: Agent[];
};

export function OwnerDetailClient({ owner, allContacts, allAgents }: OwnerDetailClientProps) {
  const { dictionary } = useLanguage();
  const contacts = owner.ownerContacts.map(oc => oc.contact);
  const isMobile = useIsMobile();

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          {dictionary.owner.title}
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Building className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="text-2xl">{owner.name}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Globe className="h-4 w-4" /> {owner.country.replace(/_/g, ' ').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
        
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="space-y-1">
                    <CardTitle>{dictionary.owner.associatedContacts}</CardTitle>
                </div>
                <EditContactsDialog owner={owner} allContacts={allContacts} allAgents={allAgents} />
            </CardHeader>
            <CardContent>
                {contacts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">This owner has no associated contacts.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {contacts.map(contact => (
                            <Card key={contact.id}>
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <ContactIcon className="h-6 w-6 text-primary" />
                                        <div>
                                            <CardTitle className="text-base">
                                                <Link href={`/contacts/${contact.id}`} className="hover:underline">
                                                    {contact.firstName} {contact.lastName}
                                                </Link>
                                            </CardTitle>
                                            <CardDescription className="text-xs">{contact.email}</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="text-sm space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                                         <Link href={`/agents/${contact.agent.id}`} className="hover:underline">
                                            {contact.agent.name}
                                         </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{dictionary.owner.trademarks}</CardTitle>
          </CardHeader>
          <CardContent>
            {owner.trademarks.length === 0 ? (
              <p className="text-sm text-muted-foreground">This owner has no trademarks.</p>
            ) : isMobile ? (
                <div className="space-y-4">
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
                        const classes = trademark.trademarkClasses.map(tc => tc.class.id).join(', ');
                        return (
                             <Card key={trademark.id}>
                                <CardHeader className="space-y-2">
                                    <Link href={`/trademarks/${trademark.id}`} className="hover:underline text-primary">
                                        <CardTitle className="text-lg">{trademark.denomination}</CardTitle>
                                    </Link>
                                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                        <Badge variant="outline">Class: {classes}</Badge>
                                        <Badge variant="outline">Cert: {trademark.certificate}</Badge>
                                        {trademark.type && <Badge variant="outline">{trademark.type.charAt(0).toUpperCase() + trademark.type.slice(1).toLowerCase()}</Badge>}
                                    </div>
                                </CardHeader>
                                <CardFooter>
                                    <div className={cn('flex items-center gap-2 text-sm font-medium w-full', colorClass)}>
                                        <CalendarClock className="h-4 w-4" />
                                        <div>
                                            <span>{format(expirationDate, 'MMM dd, yyyy')}</span>
                                            <span className="ml-2 text-xs font-normal">
                                            ({hasExpired ? `${dictionary.contact.expired} ${-daysUntilExpiration} ${dictionary.contact.daysAgo}` : `${dictionary.contact.in} ${daysUntilExpiration} ${dictionary.contact.days}`})
                                            </span>
                                        </div>
                                    </div>
                                </CardFooter>
                            </Card>
                        )
                    })}
                </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{dictionary.dashboard.table.trademark}</TableHead>
                    <TableHead>{dictionary.dashboard.table.class}</TableHead>
                    <TableHead>{dictionary.dashboard.table.certificate}</TableHead>
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
                    const classes = trademark.trademarkClasses.map(tc => tc.class.id).join(', ');
                    return (
                      <TableRow key={trademark.id}>
                        <TableCell className="font-medium">
                            <Link href={`/trademarks/${trademark.id}`} className="hover:underline text-primary">
                                {trademark.denomination}
                            </Link>
                        </TableCell>
                        <TableCell>{classes}</TableCell>
                        <TableCell>{trademark.certificate}</TableCell>
                        <TableCell className={cn(colorClass)}>
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

      </div>
    </div>
  );
}
