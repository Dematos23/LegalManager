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
} from '@tanstack/react-table';
import { format, differenceInDays, isPast } from 'date-fns';
import type { TrademarkWithDetails } from '@/types';
import { cn } from '@/lib/utils';
import { EmailModal } from './email-modal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Mail, MoreHorizontal, ArrowUpDown } from 'lucide-react';

type TrademarkTableProps = {
  trademarks: TrademarkWithDetails[];
};

export function TrademarkTable({ trademarks }: TrademarkTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedContactEmail, setSelectedContactEmail] = React.useState<string | null>(null);

  const handleGenerateEmail = (email: string) => {
    setSelectedContactEmail(email);
    setIsModalOpen(true);
  };
  
  const columns: ColumnDef<TrademarkWithDetails>[] = [
    {
      accessorKey: 'trademark',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Trademark
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="font-medium">{row.getValue('trademark')}</div>,
    },
    {
      accessorKey: 'owner.name',
      header: 'Owner',
    },
    {
      accessorKey: 'class',
      header: 'Class',
    },
    {
      accessorKey: 'expiration',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Expiration
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const expirationDate = row.getValue('expiration') as Date;
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
      accessorKey: 'agent.name',
      header: 'Agent',
    },
    {
      accessorKey: 'contact.name',
      header: 'Contact',
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const trademark = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleGenerateEmail(trademark.contact.email)}>
                <Mail className="mr-2 h-4 w-4" />
                <span>Generate Email</span>
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
    state: {
      sorting,
      columnFilters,
    },
  });

  const setExpirationFilter = (days: number | null) => {
    table.getColumn('expiration')?.setFilterValue((old: unknown) => {
      if (days === null) return undefined;
      const now = new Date();
      const futureDate = new Date(now.setDate(now.getDate() + days));
      return [new Date(), futureDate];
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search trademarks..."
          value={(table.getColumn('trademark')?.getFilterValue() as string) ?? ''}
          onChange={(event) => table.getColumn('trademark')?.setFilterValue(event.target.value)}
          className="max-w-sm"
        />
        <div className="space-x-2">
          <Button variant="outline" onClick={() => setExpirationFilter(30)}>Expiring in 30 days</Button>
          <Button variant="outline" onClick={() => setExpirationFilter(60)}>Expiring in 60 days</Button>
          <Button variant="outline" onClick={() => setExpirationFilter(90)}>Expiring in 90 days</Button>
          <Button variant="ghost" onClick={() => table.resetColumnFilters()}>Clear Filters</Button>
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
                  No results.
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
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
      {selectedContactEmail && (
        <EmailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          contactEmail={selectedContactEmail}
        />
      )}
    </div>
  );
}
