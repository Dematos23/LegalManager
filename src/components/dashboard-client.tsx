
'use client';

import * as React from 'react';
import { TrademarkTable } from "@/components/trademark-table";
import { useLanguage } from "@/context/language-context";
import type { TrademarkWithDetails, ContactWithAgent } from "@/types";
import { Button } from '@/components/ui/button';
import { Mail, MoreHorizontal, ArrowUpDown, PlusCircle, Users, FileText, CalendarClock } from 'lucide-react';
import {
    ColumnDef,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
    ColumnFiltersState,
    FilterFn,
    Row,
  } from '@tanstack/react-table';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import { format, differenceInDays, isPast, addDays, getYear, subDays } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { TrademarkFilters } from '@/components/trademark-filters';
import { useRouter } from 'next/navigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardHeader, CardFooter, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const globalFilterFn: FilterFn<TrademarkWithDetails> = (row: Row<TrademarkWithDetails>, columnId: string, value: string) => {
    const trademark = row.original;
    const search = String(value).toLowerCase();

    const flatString = [
        trademark.denomination,
        trademark.owner.name,
        trademark.trademarkClasses.map(tc => tc.class.id).join(' '),
        trademark.certificate,
        ...trademark.owner.ownerContacts.map(oc => oc.contact).flatMap(c => [c.firstName, c.lastName, c.email, c.agent.name, c.agent.area])
    ].filter(Boolean).join(' ').toLowerCase();

    return flatString.includes(search);
}

const expirationFilterFn: FilterFn<any> = (row, columnId, value) => {
    const expiration = row.getValue(columnId) as Date;
    if (!value) return true;

    const now = new Date();
    // Set time to 00:00:00 to compare dates only
    now.setHours(0, 0, 0, 0);
    const expirationDate = new Date(expiration);
    expirationDate.setHours(0, 0, 0, 0);
    
    switch(value) {
        case 'expired':
            return expirationDate < subDays(now, 180);
        case 'grace_period':
            // Expired, but within the last 180 days.
            return expirationDate < now && expirationDate >= subDays(now, 180);
        case '30':
            return expirationDate >= now && expirationDate <= addDays(now, 30);
        case '60':
            return expirationDate > addDays(now, 30) && expirationDate <= addDays(now, 60);
        case '90':
            return expirationDate > addDays(now, 60) && expirationDate <= addDays(now, 90);
        case '180':
            return expirationDate > addDays(now, 90) && expirationDate <= addDays(now, 180);
        case 'over_180':
            return expirationDate > addDays(now, 180);
        default:
            return true;
    }
};

const areaFilterFn: FilterFn<any> = (row, columnId, value, addMeta) => {
    if (!value) return true;
    const agent = row.original.owner.ownerContacts?.[0]?.contact.agent;
    return agent?.area === value;
};

const yearFilterFn: FilterFn<any> = (row, columnId, value, addMeta) => {
    if (!value) return true;
    const expirationDate = new Date(row.original.expiration);
    return getYear(expirationDate).toString() === value;
};


type DashboardClientProps = {
    trademarks: TrademarkWithDetails[];
}


// A new component for the mobile card view
function TrademarkCard({ trademark, onSendEmail, dictionary }: { trademark: TrademarkWithDetails, onSendEmail: (trademark: TrademarkWithDetails, contact: ContactWithAgent) => void, dictionary: any }) {
    const contact = trademark.owner.ownerContacts?.[0]?.contact;
    const agent = contact?.agent;
    const classes = trademark.trademarkClasses.map(tc => tc.class.id).join(', ');

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
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <Link href={`/trademarks/${trademark.id}`}>
                        <CardTitle className="text-lg hover:underline text-primary">{trademark.denomination}</CardTitle>
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{dictionary.dashboard.table.actions}</DropdownMenuLabel>
                        <DropdownMenuItem
                          disabled={!contact}
                          onClick={() => contact && onSendEmail(trademark, contact)}
                        >
                          <Mail className="mr-2 h-4 w-4" />
                          {dictionary.dashboard.actions.sendEmail}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>Class {classes}</span>
                    </div>
                     <div className="flex items-center gap-2">
                        <span>•</span>
                        <span>{dictionary.dashboard.table.certificate}: {trademark.certificate}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {trademark.type && <Badge variant="outline">{trademark.type.charAt(0).toUpperCase() + trademark.type.slice(1).toLowerCase()}</Badge>}
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                        <span className="font-semibold">{dictionary.dashboard.table.owner}: </span>
                        <Link href={`/owners/${trademark.owner.id}`} className="hover:underline text-primary">
                            {trademark.owner.name}
                        </Link>
                    </div>
                </div>
                {contact && (
                    <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <div>
                           <span className="font-semibold">{dictionary.dashboard.table.contact}: </span>
                           <Link href={`/contacts/${contact.id}`} className="hover:underline text-primary">
                               {`${contact.firstName} ${contact.lastName}`}
                           </Link>
                        </div>
                    </div>
                )}
                 {agent && (
                    <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <div>
                           <span className="font-semibold">{dictionary.dashboard.table.agent}: </span>
                           <Link href={`/agents/${agent.id}`} className="hover:underline text-primary">
                                {agent.name}
                           </Link>
                        </div>
                    </div>
                )}
            </CardContent>
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
}

export function DashboardClient({ trademarks }: DashboardClientProps) {
  const { dictionary } = useLanguage();
  const isMobile = useIsMobile();
  const router = useRouter();
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'expiration', desc: false },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState('');

  const handleSendEmail = React.useCallback((trademark: TrademarkWithDetails, contact: ContactWithAgent) => {
    const params = new URLSearchParams();
    params.set('contactId', String(contact.id));
    params.set('contactName', `${contact.firstName} ${contact.lastName}`);
    params.set('trademarkId', String(trademark.id));
    router.push(`/send-email?${params.toString()}`);
  }, [router]);

  const columns: ColumnDef<TrademarkWithDetails>[] = React.useMemo(() => [
    {
      accessorKey: 'denomination',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="p-0 hover:bg-transparent">
          {dictionary.dashboard.table.trademark}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <Link href={`/trademarks/${row.original.id}`} className="font-medium hover:underline text-primary">
            {row.getValue('denomination')}
        </Link>
      ),
    },
    {
      accessorKey: 'owner.name',
      header: dictionary.dashboard.table.owner,
      cell: ({ row }) => {
        const owner = row.original.owner;
        return owner ? (
            <Link href={`/owners/${owner.id}`} className="hover:underline text-primary">
                {owner.name}
            </Link>
        ) : 'N/A';
      }
    },
    {
      id: 'class',
      accessorFn: (row) => row.trademarkClasses.map(tc => tc.class.id).join(', '),
      header: dictionary.dashboard.table.class,
    },
    {
      accessorKey: 'certificate',
      header: dictionary.dashboard.table.certificate,
    },
    {
      accessorKey: 'expiration',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="p-0 hover:bg-transparent">
          {dictionary.dashboard.table.expiration}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      filterFn: expirationFilterFn,
      cell: ({ row }) => {
        const expirationDate = new Date(row.getValue('expiration'));
        if (!expirationDate || isNaN(expirationDate.getTime())) return 'N/A';
        
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
          <div className={cn('flex flex-col', colorClass)}>
            <span>{format(expirationDate, 'MMM dd, yyyy')}</span>
            <span className="text-xs">
              {hasExpired ? `${dictionary.contact.expired} ${-daysUntilExpiration} ${dictionary.contact.daysAgo}` : `${dictionary.contact.in} ${daysUntilExpiration} ${dictionary.contact.days}`}
            </span>
          </div>
        );
      },
    },
    {
        id: 'contact',
        accessorFn: (row) => row.owner.ownerContacts[0]?.contact,
        header: dictionary.dashboard.table.contact,
        cell: ({ row }) => {
            const contacts = row.original.owner.ownerContacts.map(oc => oc.contact);
            if (!contacts || contacts.length === 0) return 'N/A';
            const primaryContact = contacts[0];
            return (
            <div className="flex flex-col">
                <Link href={`/contacts/${primaryContact.id}`} className="font-medium hover:underline text-primary">
                    {`${primaryContact.firstName} ${primaryContact.lastName}`}
                </Link>
                <div className="text-xs text-muted-foreground">{primaryContact.email}</div>
            </div>
            );
        },
        enableSorting: false,
        enableColumnFilter: false,
    },
    {
        id: 'agent',
        accessorFn: (row) => row.owner.ownerContacts[0]?.contact.agent.name,
        header: dictionary.dashboard.table.agent,
        filterFn: areaFilterFn,
        cell: ({ row }) => {
            const agent = row.original.owner.ownerContacts?.[0]?.contact.agent;
            if (!agent) return 'N/A';
            return (
                <div className="flex flex-col">
                    <Link href={`/agents/${agent.id}`} className="font-medium hover:underline text-primary">
                      {agent.name}
                    </Link>
                    {agent.area && <span className="text-xs text-muted-foreground">{agent.area}</span>}
                </div>
            );
        },
        enableSorting: false,
    },
    {
        id: 'actions',
        cell: ({ row }) => {
          const trademark = row.original;
          const contact = trademark.owner.ownerContacts?.[0]?.contact;
  
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{dictionary.dashboard.table.actions}</DropdownMenuLabel>
                <DropdownMenuItem
                  disabled={!contact}
                  onClick={() => contact && handleSendEmail(trademark, contact)}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  {dictionary.dashboard.actions.sendEmail}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
    },
    {
        id: 'expirationYear',
        accessorKey: 'expiration',
        filterFn: yearFilterFn,
        header: () => null,
        cell: () => null,
        enableHiding: true,
    }
  ], [dictionary, handleSendEmail]);

  const table = useReactTable({
    data: trademarks,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn,
    state: {
      sorting,
      columnFilters,
      globalFilter
    },
  });

  const { agentAreas, expirationYears } = React.useMemo(() => {
    const areas = new Set<string>();
    const years = new Set<number>();
    trademarks.forEach(tm => {
        const agentArea = tm.owner.ownerContacts[0]?.contact.agent?.area;
        if (agentArea) {
            areas.add(agentArea);
        }
        years.add(getYear(new Date(tm.expiration)));
    });
    return { 
        agentAreas: Array.from(areas).sort(), 
        expirationYears: Array.from(years).sort((a, b) => b - a) 
    };
  }, [trademarks]);
  
  const handleMobileSortChange = (value: string) => {
    const [id, dir] = value.split('-');
    setSorting([{ id, desc: dir === 'desc' }]);
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-row items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          {dictionary.dashboard.title}
        </h1>
        <Link href="/trademarks/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            {dictionary.dashboard.newTrademarkButton}
          </Button>
        </Link>
      </div>
       {trademarks.length === 0 ? (
         <p className="text-muted-foreground">
          {dictionary.dashboard.noTrademarks}
        </p>
       ) : (
        <>
            <TrademarkFilters 
                table={table} 
                agentAreas={agentAreas} 
                expirationYears={expirationYears}
                onMobileSortChange={handleMobileSortChange}
                mobileSortValue={`${sorting[0]?.id}-${sorting[0]?.desc ? 'desc' : 'asc'}`}
            />
            {isMobile ? (
                 <div className="space-y-4">
                    {table.getRowModel().rows.map(row => (
                        <TrademarkCard 
                            key={row.original.id} 
                            trademark={row.original} 
                            onSendEmail={handleSendEmail} 
                            dictionary={dictionary}
                        />
                    ))}
                    {table.getRowModel().rows.length === 0 && (
                        <div className="text-center text-muted-foreground py-10">
                            {dictionary.dashboard.table.noResults}
                        </div>
                    )}
                </div>
            ) : (
                <TrademarkTable table={table} />
            )}
            
            <div className="flex items-center justify-end space-x-2 py-4">
                <span className="text-sm text-muted-foreground">
                    Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                </span>
                <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                >
                {dictionary.dashboard.table.previous}
                </Button>
                <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                >
                {dictionary.dashboard.table.next}
                </Button>
            </div>
        </>
       )}
    </div>
  );
}
