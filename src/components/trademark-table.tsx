
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
import {
  flexRender,
  type Table as TanstackTable,
} from '@tanstack/react-table';
import type { TrademarkWithDetails } from '@/types';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/context/language-context';


type TrademarkTableProps = {
  table: TanstackTable<TrademarkWithDetails>
};

export function TrademarkTable({ table }: TrademarkTableProps) {
  const { dictionary } = useLanguage();
  
  return (
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
                <TableCell colSpan={table.getAllColumns().length} className="h-24 text-center">
                  {dictionary.dashboard.table.noResults}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
  );
}

    