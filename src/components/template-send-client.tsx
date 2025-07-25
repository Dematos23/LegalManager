'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  ColumnFiltersState,
  FilterFn,
  RowSelectionState,
  GlobalFilterFn
} from '@tanstack/react-table';
import { format, differenceInDays, isPast, addDays, getYear } from 'date-fns';
import type { TrademarkWithDetails, EmailTemplate, ContactWithAgent } from '@/types';
import { cn } from '@/lib/utils';
import { ArrowUpDown, Send, Loader2, Info, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/context/language-context';
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { TrademarkFilters } from './trademark-filters';
import { sendCampaignAction } from '@/app/(protected)/campaigns/actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

type TemplateType = 'plain' | 'single-trademark' | 'multi-trademark-no-owner' | 'multi-owner';

// Helper to analyze the template body
function getTemplateType(templateBody: string): TemplateType {
    // Strip HTML tags to analyze only the text content and handlebars expressions
    const bodyAsText = templateBody.replace(/<[^>]*>/g, '');
    
    const hasOwnersLoop = /\{\{#each owners\}\}/.test(bodyAsText);
    const hasTrademarksLoop = /\{\{#each trademarks\}\}/.test(bodyAsText);
    // This regex looks for single trademark fields that are NOT part of a 'trademarks' loop.
    const hasSingleTrademarkFields = /\{\{(?!\/?each)(denomination|class|certificate|expiration|products|type)\}\}/.test(bodyAsText);
    
    if (hasOwnersLoop) {
        return 'multi-owner';
    }
    if (hasTrademarksLoop) {
        // Doesn't have owner loop, but has trademark loop
        return 'multi-trademark-no-owner';
    }
    if (hasSingleTrademarkFields && !hasTrademarksLoop && !hasOwnersLoop) {
        return 'single-trademark';
    }
    return 'plain';
}


type TemplateSendClientProps = {
  template: EmailTemplate;
  trademarks: TrademarkWithDetails[];
  contacts: ContactWithAgent[];
};

export function TemplateSendClient({ template, trademarks, contacts }: TemplateSendClientProps) {
  const [isSending, startSendingTransition] = React.useTransition();
  const [campaignName, setCampaignName] = React.useState('');
  
  const templateType = React.useMemo(() => getTemplateType(template.body), [template.body]);
  
  // Initialize state directly instead of using useEffect to prevent state update on unmounted component error
  const initialSendMode = React.useMemo(() => {
      switch (templateType) {
          case 'plain':
          case 'multi-owner':
              return 'contact';
          case 'single-trademark':
          case 'multi-trademark-no-owner':
          default:
              return 'trademark';
      }
  }, [templateType]);

  const [sendMode, setSendMode] = React.useState<'trademark' | 'contact'>(initialSendMode);


  const { dictionary } = useLanguage();
  const { toast } = useToast();

  const trademarkTable = useTrademarkTable(trademarks);
  const contactTable = useContactTable(contacts);
  
  const selectedCount = sendMode === 'trademark' 
    ? trademarkTable.getFilteredSelectedRowModel().rows.length
    : contactTable.getFilteredSelectedRowModel().rows.length;

  const handleSendCampaign = () => {
    let payload: any;
    if (sendMode === 'trademark') {
        const selectedTrademarks = trademarkTable.getFilteredSelectedRowModel().rows.map(row => row.original);
        payload = {
            templateId: template.id,
            campaignName,
            sendMode: 'trademark',
            trademarkIds: selectedTrademarks.map(t => t.id)
        }
    } else { // contact mode
        const selectedContacts = contactTable.getFilteredSelectedRowModel().rows.map(row => row.original);
        payload = {
            templateId: template.id,
            campaignName,
            sendMode: 'contact',
            contactIds: selectedContacts.map(c => c.id)
        }
    }
    
    startSendingTransition(async () => {
        const result = await sendCampaignAction(payload);
        if (result.error) {
            toast({
                title: dictionary.sendTemplate.campaignErrorTitle,
                description: result.error,
                variant: 'destructive',
                duration: 8000
            });
        } else {
            toast({
                title: dictionary.sendTemplate.campaignSentTitle,
                description: result.success,
            });
            trademarkTable.resetRowSelection(true);
            contactTable.resetRowSelection(true);
            setCampaignName('');
        }
    });
  }

  const renderGuidance = () => {
    const guidance = dictionary.sendTemplate.guidance;
    let title = guidance.default.title;
    let description = guidance.default.description;

    if (sendMode === 'trademark') {
        if (guidance.byTrademark[templateType]) {
            title = guidance.byTrademark[templateType].title;
            description = guidance.byTrademark[templateType].description;
        }
    } else { // sendMode === 'contact'
        if (guidance.byContact[templateType]) {
            title = guidance.byContact[templateType].title;
            description = guidance.byContact[templateType].description;
        }
    }

    return (
        <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>{title}</AlertTitle>
            <AlertDescription>{description}</AlertDescription>
        </Alert>
    );
  }

  const isTrademarkSendDisabled = templateType === 'plain' || templateType === 'multi-owner';
  const isContactSendDisabled = templateType === 'single-trademark';

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl">{dictionary.sendTemplate.title}</CardTitle>
                <CardDescription>
                    {dictionary.sendTemplate.description} <strong>{template.name}</strong>
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="campaignName">{dictionary.sendTemplate.campaignNameLabel}</Label>
                    <Input 
                        id="campaignName"
                        value={campaignName}
                        onChange={(e) => setCampaignName(e.target.value)}
                        placeholder={dictionary.sendTemplate.campaignNamePlaceholder}
                        disabled={isSending}
                    />
                </div>
                 {renderGuidance()}
            </CardContent>
        </Card>
        
        <Tabs value={sendMode} onValueChange={(value) => setSendMode(value as 'trademark' | 'contact')} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="trademark" disabled={isTrademarkSendDisabled}>Send by Trademark</TabsTrigger>
                <TabsTrigger value="contact" disabled={isContactSendDisabled}>Send by Contact</TabsTrigger>
            </TabsList>
            <TabsContent value="trademark">
                <TrademarkFilters table={trademarkTable} agentAreas={getAgentAreas(trademarks)} expirationYears={getExpirationYears(trademarks)} />
                <Card className="mt-4">
                    <CardHeader>
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div>
                                <CardTitle>{dictionary.sendTemplate.recipientsTitle}</CardTitle>
                                <CardDescription>{dictionary.sendTemplate.recipientsDescription}</CardDescription>
                            </div>
                             <Button onClick={handleSendCampaign} disabled={isSending || selectedCount === 0 || campaignName.trim().length < 10} className="w-full md:w-auto">
                                {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2" />}
                                {dictionary.sendTemplate.sendButton} ({selectedCount})
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <DataTable table={trademarkTable} columns={trademarkColumns} />
                    </CardContent>
                </Card>
                <DataTablePagination table={trademarkTable} />
            </TabsContent>
            <TabsContent value="contact">
                 <Card className="mt-4">
                    <CardHeader>
                       <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div>
                                <CardTitle>{dictionary.sendTemplate.recipientsTitle}</CardTitle>
                                <CardDescription>Select contacts to send this campaign to. Each contact will receive one email.</CardDescription>
                            </div>
                             <Button onClick={handleSendCampaign} disabled={isSending || selectedCount === 0 || campaignName.trim().length < 10} className="w-full md:w-auto">
                                {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2" />}
                                {dictionary.sendTemplate.sendButton} ({selectedCount})
                            </Button>
                        </div>
                         <Card className="mt-4">
                            <CardHeader>
                                <CardTitle>{dictionary.dashboard.filtersTitle}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <Input
                                        placeholder="Search contacts..."
                                        value={(contactTable.getState().globalFilter as string) ?? ''}
                                        onChange={(event) => contactTable.setGlobalFilter(event.target.value)}
                                        className="w-full"
                                    />
                                    <Select
                                        value={(contactTable.getColumn('agent')?.getFilterValue() as string) ?? ''}
                                        onValueChange={(value) => contactTable.getColumn('agent')?.setFilterValue(value === 'all' ? null : value)}
                                    >
                                        <SelectTrigger>
                                        <SelectValue placeholder={dictionary.dashboard.areaFilterLabel} />
                                        </SelectTrigger>
                                        <SelectContent>
                                        <SelectItem value="all">{dictionary.dashboard.allAreas}</SelectItem>
                                        {getContactAgentAreas(contacts).map((area) => (
                                            <SelectItem key={area} value={area}>
                                            {area}
                                            </SelectItem>
                                        ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                 <div className="flex justify-end">
                                    <Button variant="ghost" onClick={() => { contactTable.resetColumnFilters(); contactTable.resetGlobalFilter(); }}>
                                        <X className="mr-2 h-4 w-4" />
                                        {dictionary.dashboard.clearFilters}
                                    </Button>
                                </div>
                            </CardContent>
                         </Card>
                    </CardHeader>
                     <CardContent>
                        <DataTable table={contactTable} columns={contactColumns} />
                    </CardContent>
                 </Card>
                <DataTablePagination table={contactTable} />
            </TabsContent>
        </Tabs>
    </div>
  );
}

// --- Reusable Components ---
function DataTable({ table, columns }: { table: any, columns: any[] }) {
    const { dictionary } = useLanguage();
    return (
        <Table>
            <TableHeader>
            {table.getHeaderGroups().map((headerGroup: any) => (
                <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header: any) => (
                    <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                ))}
                </TableRow>
            ))}
            </TableHeader>
            <TableBody>
            {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row: any) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                    {row.getVisibleCells().map((cell: any) => (
                    <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                    ))}
                </TableRow>
                ))
            ) : (
                <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                    {dictionary.dashboard.table.noResults}
                </TableCell>
                </TableRow>
            )}
            </TableBody>
        </Table>
    );
}

function DataTablePagination({ table }: { table: any }) {
    const { dictionary } = useLanguage();
    return (
         <div className="flex items-center justify-end space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
                {table.getFilteredSelectedRowModel().rows.length} of{" "}
                {table.getFilteredRowModel().rows.length} row(s) selected.
            </div>
            <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            {dictionary.dashboard.table.previous}
            </Button>
            <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            {dictionary.dashboard.table.next}
            </Button>
      </div>
    )
}


// --- Hooks for Tables ---
const useTrademarkTable = (data: TrademarkWithDetails[]) => {
  const [sorting, setSorting] = React.useState<SortingState>([{ id: 'expiration', desc: false }]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = React.useState('');

  return useReactTable({
    data,
    columns: trademarkColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    globalFilterFn: globalTrademarkFilterFn,
    state: { sorting, columnFilters, rowSelection, globalFilter },
  });
};

const useContactTable = (data: ContactWithAgent[]) => {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = React.useState('');

  return useReactTable({
    data,
    columns: contactColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: globalContactFilterFn,
    state: { sorting, columnFilters, rowSelection, globalFilter },
  });
};

// --- Filter Functions ---
const expirationFilterFn: FilterFn<any> = (row, columnId, value) => {
    const expiration = row.getValue(columnId) as Date;
    if (!value) return true;
    const now = new Date();
    const expirationDate = new Date(expiration);
    switch(value) {
        case '30': return expirationDate >= now && expirationDate <= addDays(now, 30);
        case '60': return expirationDate > addDays(now, 30) && expirationDate <= addDays(now, 60);
        case '90': return expirationDate > addDays(now, 60) && expirationDate <= addDays(now, 90);
        case '180': return expirationDate > addDays(now, 90) && expirationDate <= addDays(now, 180);
        case 'over_180': return expirationDate > addDays(now, 180);
        default: return true;
    }
};

const areaFilterFn: FilterFn<any> = (row, columnId, value) => {
    if (!value) return true;
    const agent = row.original.owner?.ownerContacts?.[0]?.contact.agent ?? row.original.agent;
    return agent?.area === value;
};

const yearFilterFn: FilterFn<any> = (row, columnId, value) => {
    if (!value) return true;
    const expirationDate = new Date(row.original.expiration);
    return getYear(expirationDate).toString() === value;
};

const globalTrademarkFilterFn: GlobalFilterFn<any> = (row, columnId, value) => {
    const trademark = row.original as TrademarkWithDetails;
    const search = String(value).toLowerCase();
    const flatString = [
        trademark.denomination,
        trademark.owner.name,
        trademark.trademarkClasses.map(tc => tc.class.id).join(', '),
        trademark.certificate,
        ...trademark.owner.ownerContacts.map(oc => oc.contact).flatMap(c => [c.firstName, c.lastName, c.email, c.agent.name, c.agent.area])
    ].filter(Boolean).join(' ').toLowerCase();
    return flatString.includes(search);
};

const globalContactFilterFn: GlobalFilterFn<any> = (row, columnId, value) => {
    const contact = row.original as ContactWithAgent;
    const search = String(value).toLowerCase();
    const flatString = [
        contact.firstName,
        contact.lastName,
        contact.email,
        contact.agent.name,
        contact.agent.area,
    ].filter(Boolean).join(' ').toLowerCase();
    return flatString.includes(search);
};

// --- Column Definitions ---
const trademarkColumns: ColumnDef<TrademarkWithDetails>[] = [
    {
        id: 'select',
        header: ({ table }) => <Checkbox checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')} onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)} aria-label="Select all" />,
        cell: ({ row }) => <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Select row" />,
        enableSorting: false, enableHiding: false,
    },
    { accessorKey: 'denomination', header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>Trademark<ArrowUpDown className="ml-2 h-4 w-4" /></Button>, cell: ({ row }) => <div className="font-medium">{row.getValue('denomination')}</div> },
    { accessorKey: 'owner.name', header: 'Owner', cell: ({ row }) => row.original.owner?.name ?? 'N/A' },
    {
      accessorKey: 'expiration',
      header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>Expiration<ArrowUpDown className="ml-2 h-4 w-4" /></Button>,
      filterFn: expirationFilterFn,
      cell: ({ row }) => {
        const expirationDate = new Date(row.getValue('expiration'));
        if (!expirationDate || isNaN(expirationDate.getTime())) return 'N/A';
        const daysUntilExpiration = differenceInDays(expirationDate, new Date());
        const hasExpired = isPast(expirationDate);
        const colorClass = hasExpired ? 'text-destructive font-semibold' : daysUntilExpiration <= 30 ? 'text-destructive' : daysUntilExpiration <= 90 ? 'text-warning' : '';
        return <div className={cn('flex flex-col', colorClass)}><span>{format(expirationDate, 'MMM dd, yyyy')}</span><span className="text-xs">{hasExpired ? `Expired ${-daysUntilExpiration} days ago` : `in ${daysUntilExpiration} days`}</span></div>;
      },
    },
    {
        id: 'contact', 
        header: 'Contact',
        accessorFn: (row) => row.owner.ownerContacts[0]?.contact.email,
        cell: ({ row }) => {
            const primaryContact = row.original.owner.ownerContacts?.[0]?.contact;
            if (!primaryContact) return 'N/A';
            return <Link href={`/contacts/${primaryContact.id}`} className="font-medium hover:underline text-primary">{`${primaryContact.firstName} ${primaryContact.lastName}`}</Link>;
        },
    },
    {
        id: 'agent', 
        header: 'Agent', 
        accessorFn: (row) => row.owner.ownerContacts[0]?.contact.agent.name,
        filterFn: areaFilterFn,
        cell: ({ row }) => {
            const agent = row.original.owner.ownerContacts?.[0]?.contact.agent;
            if (!agent) return 'N/A';
            return <div className="flex flex-col"><span>{agent.name}</span>{agent.area && <span className="text-xs text-muted-foreground">{agent.area}</span>}</div>;
        },
    },
    { id: 'expirationYear', accessorKey: 'expiration', filterFn: yearFilterFn, header: () => null, cell: () => null, enableHiding: true },
];

const contactColumns: ColumnDef<ContactWithAgent>[] = [
    {
        id: 'select',
        header: ({ table }) => <Checkbox checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')} onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)} aria-label="Select all" />,
        cell: ({ row }) => <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Select row" />,
        enableSorting: false, enableHiding: false,
    },
    {
        accessorFn: (row) => `${row.firstName} ${row.lastName}`, id: 'name',
        header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>Name<ArrowUpDown className="ml-2 h-4 w-4" /></Button>,
        cell: ({ row }) => <Link href={`/contacts/${row.original.id}`} className="font-medium hover:underline text-primary">{`${row.original.firstName} ${row.original.lastName}`}</Link>,
    },
    { accessorKey: 'email', header: 'Email' },
    {
        id: 'agent',
        accessorKey: 'agent.name', 
        header: 'Agent', 
        filterFn: areaFilterFn,
        cell: ({ row }) => {
            const agent = row.original.agent;
            if (!agent) return 'N/A';
            return <div className="flex flex-col"><span>{agent.name}</span>{agent.area && <span className="text-xs text-muted-foreground">{agent.area}</span>}</div>;
        },
    },
];

// --- Helper Functions ---
const getAgentAreas = (trademarks: TrademarkWithDetails[]) => {
    const areas = new Set<string>();
    trademarks.forEach(tm => {
        const agentArea = tm.owner.ownerContacts[0]?.contact.agent.area
        if (agentArea) {
            areas.add(agentArea);
        }
    });
    return Array.from(areas).sort();
};

const getContactAgentAreas = (contacts: ContactWithAgent[]) => {
    const areas = new Set<string>();
    contacts.forEach(c => {
        if (c.agent?.area) {
            areas.add(c.agent.area);
        }
    });
    return Array.from(areas).sort();
};

const getExpirationYears = (trademarks: TrademarkWithDetails[]) => {
    const years = new Set<number>();
    trademarks.forEach(tm => {
        years.add(getYear(new Date(tm.expiration)));
    });
    return Array.from(years).sort((a, b) => b - a);
};
