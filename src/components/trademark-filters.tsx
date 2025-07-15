
'use client';

import * as React from 'react';
import { Table as TanstackTable } from '@tanstack/react-table';
import type { TrademarkWithDetails } from '@/types';
import { Input } from '@/components/ui/input';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/context/language-context';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

type TrademarkFiltersProps = {
  table: TanstackTable<TrademarkWithDetails>;
  agentAreas: string[];
  expirationYears: number[];
  onMobileSortChange: (value: string) => void;
  mobileSortValue: string;
};

export function TrademarkFilters({ table, agentAreas, expirationYears, onMobileSortChange, mobileSortValue }: TrademarkFiltersProps) {
  const { dictionary } = useLanguage();
  const isMobile = useIsMobile();

  const handleClearFilters = () => {
    table.resetColumnFilters();
    table.resetGlobalFilter();
  };

  if (isMobile) {
    return (
       <Card>
        <CardHeader>
          <CardTitle>{dictionary.dashboard.filtersTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder={dictionary.dashboard.searchPlaceholder}
            value={(table.getState().globalFilter as string) ?? ''}
            onChange={(event) => table.setGlobalFilter(event.target.value)}
            className="w-full"
          />
          <Select
            value={(table.getColumn('expiration')?.getFilterValue() as string) ?? ''}
            onValueChange={(value) => table.getColumn('expiration')?.setFilterValue(value === 'all' ? null : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={dictionary.dashboard.expiringIn} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{dictionary.dashboard.allExpirations}</SelectItem>
              <SelectItem value="30">{dictionary.dashboard.expiring30}</SelectItem>
              <SelectItem value="60">{dictionary.dashboard.expiring60}</SelectItem>
              <SelectItem value="90">{dictionary.dashboard.expiring90}</SelectItem>
              <SelectItem value="180">{dictionary.dashboard.expiring180}</SelectItem>
              <SelectItem value="over_180">{dictionary.dashboard.expiringOver180}</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Select
              value={mobileSortValue}
              onValueChange={onMobileSortChange}
            >
              <SelectTrigger className={cn(buttonVariants({ variant: "ghost" }), "w-1/2 justify-between border-none")}>
                <SelectValue placeholder={dictionary.dashboard.sortBy} />
              </SelectTrigger>
              <SelectContent>
                  <SelectItem value="expiration-asc">{dictionary.dashboard.table.expiration} (Asc)</SelectItem>
                  <SelectItem value="expiration-desc">{dictionary.dashboard.table.expiration} (Desc)</SelectItem>
                  <SelectItem value="denomination-asc">{dictionary.dashboard.table.trademark} (A-Z)</SelectItem>
                  <SelectItem value="denomination-desc">{dictionary.dashboard.table.trademark} (Z-A)</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" onClick={handleClearFilters} className="w-1/2">
                {dictionary.dashboard.clearFilters}
            </Button>
          </div>
        </CardContent>
       </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{dictionary.dashboard.filtersTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Global Search */}
          <div className="lg:col-span-2">
            <Input
              placeholder={dictionary.dashboard.searchPlaceholder}
              value={(table.getState().globalFilter as string) ?? ''}
              onChange={(event) => table.setGlobalFilter(event.target.value)}
              className="w-full"
            />
          </div>

          {/* Expiration Filter */}
          <Select
            value={(table.getColumn('expiration')?.getFilterValue() as string) ?? ''}
            onValueChange={(value) => table.getColumn('expiration')?.setFilterValue(value === 'all' ? null : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={dictionary.dashboard.expiringIn} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{dictionary.dashboard.allExpirations}</SelectItem>
              <SelectItem value="30">{dictionary.dashboard.expiring30}</SelectItem>
              <SelectItem value="60">{dictionary.dashboard.expiring60}</SelectItem>
              <SelectItem value="90">{dictionary.dashboard.expiring90}</SelectItem>
              <SelectItem value="180">{dictionary.dashboard.expiring180}</SelectItem>
              <SelectItem value="over_180">{dictionary.dashboard.expiringOver180}</SelectItem>
            </SelectContent>
          </Select>

          {/* Agent Area Filter */}
          <Select
            value={(table.getColumn('agent')?.getFilterValue() as string) ?? ''}
            onValueChange={(value) => table.getColumn('agent')?.setFilterValue(value === 'all' ? null : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={dictionary.dashboard.areaFilterLabel} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{dictionary.dashboard.allAreas}</SelectItem>
              {agentAreas.map((area) => (
                <SelectItem key={area} value={area}>
                  {area}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Expiration Year Filter */}
          <Select
            value={(table.getColumn('expirationYear')?.getFilterValue() as string) ?? ''}
            onValueChange={(value) => table.getColumn('expirationYear')?.setFilterValue(value === 'all' ? null : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={dictionary.dashboard.yearFilterLabel} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{dictionary.dashboard.allYears}</SelectItem>
              {expirationYears.map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-end">
            <Button variant="ghost" onClick={handleClearFilters}>
                {dictionary.dashboard.clearFilters}
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
