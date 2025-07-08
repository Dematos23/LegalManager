
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
import type { TrademarkWithDetails, EmailTemplate } from '@/types';
import { cn } from '@/lib/utils';
import { ArrowUpDown, Send } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/context/language-context';
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { TrademarkFilters } from './trademark-filters';

const expirationFilterFn: FilterFn<any> = (row, columnId, value, addMeta) => {
    const expiration = row.getValue(columnId) as Date;
    if (!value) return true;

    const now = new Date();
    const expirationDate = new Date(expiration);
    
    switch(value) {
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
    const agent = row.original.owner.contacts?.[0]?.agent;
    return agent?.area === value;
};

const yearFilterFn: FilterFn<any> = (row, columnId, value, addMeta) => {
    if (!value) return true;
    const expirationDate = new Date(row.original.expiration);
    return getYear(expirationDate).toString() === value;
};


const globalFilterFn: GlobalFilterFn<any> = (row, columnId, value, addMeta) => {
    const trademark = row.original as TrademarkWithDetails;
    const search = value.toLowerCase();

    const flatString = [
        trademark.denomination,
        trademark.owner.name,
        ...trademark.owner.contacts.flatMap(c => [c.firstName, c.lastName, c.email, c.agent.name, c.agent.area])
    ].filter(Boolean).join(' ').toLowerCase();
    
    return flatString.includes(search);
};


type TemplateSendClientProps = {
  template: EmailTemplate;
  trademarks: TrademarkWithDetails[];
};

export function TemplateSendClient({ template, trademarks }: TemplateSendClientProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'expiration', desc: false },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = React.useState('');
  
  const { dictionary } = useLanguage();
  const { toast } = useToast();

  const columns: ColumnDef<TrademarkWithDetails>[] = [
    {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
      accessorKey: 'denomination',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          {dictionary.dashboard.table.trademark}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="font-medium">{row.getValue('denomination')}</div>,
    },
    {
      accessorKey: 'owner.name',
      header: dictionary.dashboard.table.owner,
      cell: ({ row }) => row.original.owner?.name ?? 'N/A'
    },
    {
      accessorKey: 'expiration',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
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
              {hasExpired ? `Expired ${-daysUntilExpiration} days ago` : `in ${daysUntilExpiration} days`}
            </span>
          </div>
        );
      },
    },
    {
        accessorKey: 'owner.contacts',
        header: dictionary.dashboard.table.contact,
        cell: ({ row }) => {
            const primaryContact = row.original.owner.contacts?.[0];
            if (!primaryContact) return 'N/A';
            return (
                <Link href={`/contacts/${primaryContact.id}`} className="font-medium hover:underline text-primary">
                    {`${primaryContact.firstName} ${primaryContact.lastName}`}
                </Link>
            );
        },
    },
    {
        accessorKey: 'owner.contacts[0].agent.name',
        id: 'agent',
        header: dictionary.dashboard.table.agent,
        filterFn: areaFilterFn,
        cell: ({ row }) => {
            const agent = row.original.owner.contacts?.[0]?.agent;
            if (!agent) return 'N/A';
            return (
                <div className="flex flex-col">
                    <span>{agent.name}</span>
                    {agent.area && <span className="text-xs text-muted-foreground">{agent.area}</span>}
                </div>
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
    },
  ];

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
    onRowSelectionChange: setRowSelection,
    globalFilterFn: globalFilterFn,
    state: {
      sorting,
      columnFilters,
      rowSelection,
      globalFilter,
    },
  });

   const { agentAreas, expirationYears } = React.useMemo(() => {
    const areas = new Set<string>();
    const years = new Set<number>();
    trademarks.forEach(tm => {
        if (tm.owner.contacts[0]?.agent?.area) {
            areas.add(tm.owner.contacts[0].agent.area);
        }
        years.add(getYear(new Date(tm.expiration)));
    });
    return { 
        agentAreas: Array.from(areas).sort(), 
        expirationYears: Array.from(years).sort((a, b) => b - a) 
    };
  }, [trademarks]);

  const handleSendCampaign = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    if (selectedRows.length === 0) {
        toast({
            title: dictionary.sendTemplate.noSelectionTitle,
            description: dictionary.sendTemplate.noSelectionDesc,
            variant: "destructive",
        });
        return;
    }

    const recipientCount = selectedRows.length;
    // Here you would typically trigger a backend process
    // For now, we'll just simulate it with a toast.
    toast({
        title: dictionary.sendTemplate.campaignSentTitle,
        description: `${dictionary.sendTemplate.campaignSentDesc} ${recipientCount} ${dictionary.sendTemplate.recipients}.`,
    });
    table.resetRowSelection(true); // reset selection after sending
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl">{dictionary.sendTemplate.title}</CardTitle>
                <CardDescription>
                    {dictionary.sendTemplate.description} <strong>{template.name}</strong>
                </CardDescription>
            </CardHeader>
        </Card>

        <TrademarkFilters table={table} agentAreas={agentAreas} expirationYears={expirationYears} />

        <Card>
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <CardTitle>{dictionary.sendTemplate.recipientsTitle}</CardTitle>
                    <CardDescription>
                        {dictionary.sendTemplate.recipientsDescription}
                    </CardDescription>
                </div>
                <Button onClick={handleSendCampaign} disabled={table.getFilteredSelectedRowModel().rows.length === 0} className="w-full md:w-auto">
                    <Send className="mr-2" />
                    {dictionary.sendTemplate.sendButton} ({table.getFilteredSelectedRowModel().rows.length})
                </Button>
            </CardHeader>
            <CardContent>
            <Table>
                <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                        {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                    ))}
                    </TableRow>
                ))}
                </TableHeader>
                <TableBody>
                {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                        {row.getVisibleCells().map((cell) => (
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
            </CardContent>
        </Card>
      
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
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
    </div>
  );
}
