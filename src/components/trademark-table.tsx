
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
} from '@tanstack/react-table';
import { format, differenceInDays, isPast, addDays } from 'date-fns';
import type { TrademarkWithDetails } from '@/types';
import { cn } from '@/lib/utils';
import { ArrowUpDown, Mail, MoreHorizontal } from 'lucide-react';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmailModal } from '@/components/email-modal';
import { useLanguage } from '@/context/language-context';

type TrademarkTableProps = {
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

export function TrademarkTable({ trademarks }: TrademarkTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'expiration', desc: false },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [isEmailModalOpen, setIsEmailModalOpen] = React.useState(false);
  const [selectedContactEmail, setSelectedContactEmail] = React.useState('');
  const { dictionary } = useLanguage();

  const handleGenerateEmail = (email: string) => {
    setSelectedContactEmail(email);
    setIsEmailModalOpen(true);
  };

  const columns: ColumnDef<TrademarkWithDetails>[] = [
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
      cell: ({ row }) => {
        const owner = row.original.owner;
        return owner ? owner.name : 'N/A';
      }
    },
    {
      accessorKey: 'class',
      header: dictionary.dashboard.table.class,
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
          ? 'text-yellow-600'
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
            const contacts = row.original.owner.contacts;
            if (!contacts || contacts.length === 0) return 'N/A';
            const primaryContact = contacts[0];
            return (
            <div>
                <div>{`${primaryContact.firstName} ${primaryContact.lastName}`}</div>
                <div className="text-xs text-muted-foreground">{primaryContact.email}</div>
            </div>
            );
        },
        enableSorting: false,
        enableColumnFilter: false,
    },
    {
        accessorKey: 'owner.contacts[0].agent.name',
        header: dictionary.dashboard.table.agent,
        cell: ({ row }) => {
            const agent = row.original.owner.contacts?.[0]?.agent;
            return agent ? agent.name : 'N/A';
        },
        enableSorting: false,
        enableColumnFilter: false,
    },
    {
        id: 'actions',
        cell: ({ row }) => {
          const contact = row.original.owner.contacts?.[0];
  
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
                  onClick={() => handleGenerateEmail(contact.email)}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  {dictionary.dashboard.actions.generateEmail}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
    },
  ];

  const table = useReactTable({
    data: trademarks,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: 'auto',
    state: {
      sorting,
      columnFilters,
    },
  });

  const setExpirationFilter = (days: number | null) => {
    if (days === null) {
        table.getColumn('expiration')?.setFilterValue(undefined);
    } else {
        const now = new Date();
        const futureDate = addDays(now, days);
        table.getColumn('expiration')?.setFilterValue([now, futureDate]);
    }
  };

  return (
    <div className="space-y-4">
      <EmailModal isOpen={isEmailModalOpen} onClose={() => setIsEmailModalOpen(false)} contactEmail={selectedContactEmail} />
      <div className="flex items-center justify-between">
        <Input
          placeholder={dictionary.dashboard.searchPlaceholder}
          value={(table.getColumn('denomination')?.getFilterValue() as string) ?? ''}
          onChange={(event) => table.getColumn('denomination')?.setFilterValue(event.target.value)}
          className="max-w-sm"
        />
        <div className="space-x-2">
          <Button variant="outline" onClick={() => setExpirationFilter(30)}>{dictionary.dashboard.expiring30}</Button>
          <Button variant="outline" onClick={() => setExpirationFilter(60)}>{dictionary.dashboard.expiring60}</Button>
          <Button variant="outline" onClick={() => setExpirationFilter(90)}>{dictionary.dashboard.expiring90}</Button>
          <Button variant="ghost" onClick={() => table.resetColumnFilters()}>{dictionary.dashboard.clearFilters}</Button>
        </div>
      </div>
      <Card>
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
      </Card>
      <div className="flex items-center justify-end space-x-2 py-4">
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
