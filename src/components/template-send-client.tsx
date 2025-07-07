
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
import { Input } from '@/components/ui/input';
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
} from '@tanstack/react-table';
import { format, differenceInDays, isPast, addDays } from 'date-fns';
import type { TrademarkWithDetails, EmailTemplate } from '@/types';
import { cn } from '@/lib/utils';
import { ArrowUpDown, Send } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/context/language-context';
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

type TemplateSendClientProps = {
  template: EmailTemplate;
  trademarks: TrademarkWithDetails[];
};

const expirationFilterFn: FilterFn<any> = (row, columnId, value, addMeta) => {
    const expiration = row.getValue(columnId) as Date;
    if (!value) return true;

    const [start, end] = value;
    if (!start || !end) return true;

    const expirationDate = new Date(expiration);

    return expirationDate >= start && expirationDate <= end;
};


const globalFilterFn: FilterFn<any> = (row, columnId, value, addMeta) => {
    const trademark = row.original as TrademarkWithDetails;
    const search = value.toLowerCase();

    const flatString = [
        trademark.denomination,
        trademark.owner.name,
        ...trademark.owner.contacts.flatMap(c => [c.firstName, c.lastName, c.email, c.agent.name])
    ].filter(Boolean).join(' ').toLowerCase();
    
    return flatString.includes(search);
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
        header: dictionary.dashboard.table.agent,
        cell: ({ row }) => row.original.owner.contacts?.[0]?.agent?.name ?? 'N/A',
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

  const setExpirationFilter = (days: number | null) => {
    const expirationCol = table.getColumn('expiration');
    if (!expirationCol) return;

    if (days === null) {
      expirationCol.setFilterValue(undefined);
    } else {
        const now = new Date();
        const futureDate = addDays(now, days);
        // Using a function here is important to avoid issues with stale state
        expirationCol.setFilterValue(() => [now, futureDate]);
    }
  };

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

        <Card>
            <CardHeader>
                <CardTitle>{dictionary.sendTemplate.filterTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <Input
                    placeholder={dictionary.sendTemplate.searchPlaceholder}
                    value={globalFilter ?? ''}
                    onChange={(event) => setGlobalFilter(String(event.target.value))}
                    className="w-full md:max-w-sm"
                    />
                    <div className="flex flex-wrap items-center justify-center gap-2">
                    <Button variant="outline" onClick={() => setExpirationFilter(30)}>{dictionary.dashboard.expiring30}</Button>
                    <Button variant="outline" onClick={() => setExpirationFilter(60)}>{dictionary.dashboard.expiring60}</Button>
                    <Button variant="outline" onClick={() => setExpirationFilter(90)}>{dictionary.dashboard.expiring90}</Button>
                    <Button variant="ghost" onClick={() => { table.resetColumnFilters(); setGlobalFilter('') }}>{dictionary.dashboard.clearFilters}</Button>
                    </div>
                </div>
            </CardContent>
        </Card>

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
