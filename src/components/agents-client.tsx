
'use client';

import type { AgentWithCounts } from '@/types';
import { useLanguage } from '@/context/language-context';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Link from 'next/link';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Globe, Users, Network, ArrowUpDown, X, Briefcase, FileText, Building } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
    getFilteredRowModel,
} from '@tanstack/react-table';
import { useIsMobile } from '@/hooks/use-mobile';
import { Country } from '@prisma/client';

type AgentsClientProps = {
  agents: AgentWithCounts[];
};

function AgentCard({ agent, dictionary }: { agent: AgentWithCounts, dictionary: any }) {
    return (
        <Card>
            <CardHeader>
                <Link href={`/agents/${agent.id}`}>
                    <CardTitle className="text-lg hover:underline text-primary flex items-center gap-2">
                        <Briefcase className="h-5 w-5" />
                        {agent.name}
                    </CardTitle>
                </Link>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span>{agent.country.replace(/_/g, ' ').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())}</span>
                </div>
                 {agent.area && (
                    <div className="flex items-center gap-2">
                        <Network className="h-4 w-4 text-muted-foreground" />
                        <span>{agent.area}</span>
                    </div>
                 )}
            </CardContent>
            <CardFooter className="grid grid-cols-2 gap-2 text-sm font-medium w-full">
                <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span>{agent.ownerCount} {dictionary.agents.table.owners}</span>
                </div>
                 <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>{agent.trademarkCount} {dictionary.agents.table.trademarks}</span>
                </div>
            </CardFooter>
        </Card>
    );
}

export function AgentsClient({ agents }: AgentsClientProps) {
  const { dictionary } = useLanguage();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('all');
  const [areaFilter, setAreaFilter] = useState('all');
  const isMobile = useIsMobile();
  
  const columns = useMemo<ColumnDef<AgentWithCounts>[]>(() => [
    {
        accessorKey: 'name',
        header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                {dictionary.agents.table.name}
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <Link href={`/agents/${row.original.id}`} className="font-medium hover:underline text-primary">
                {row.getValue('name')}
            </Link>
        ),
    },
    {
        accessorKey: 'country',
        header: dictionary.agents.table.country,
        cell: ({ row }) => row.original.country.replace(/_/g, ' ').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()),
    },
    {
        accessorKey: 'area',
        header: dictionary.agents.table.area,
        cell: ({ row }) => row.original.area || 'N/A',
    },
    {
        accessorKey: 'ownerCount',
        header: ({ column }) => (
             <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                {dictionary.agents.table.owners}
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => <span className="pl-4">{row.original.ownerCount}</span>,
    },
     {
        accessorKey: 'trademarkCount',
        header: ({ column }) => (
             <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                {dictionary.agents.table.trademarks}
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => <span className="pl-4">{row.original.trademarkCount}</span>,
    },
  ], [dictionary]);
  
  const filteredAgents = useMemo(() => {
    return agents.filter(agent => {
        const matchesSearch = agent.name.toLowerCase().includes(globalFilter.toLowerCase());
        const matchesCountry = countryFilter === 'all' || agent.country === countryFilter;
        const matchesArea = areaFilter === 'all' || agent.area === areaFilter;
        return matchesSearch && matchesCountry && matchesArea;
    });
  }, [agents, globalFilter, countryFilter, areaFilter]);

  const table = useReactTable({
    data: filteredAgents,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });
  
  const agentAreas = useMemo(() => Array.from(new Set(agents.map(a => a.area).filter(Boolean))), [agents]);

  const clearFilters = () => {
      setGlobalFilter('');
      setCountryFilter('all');
      setAreaFilter('all');
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          {dictionary.agents.title}
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{dictionary.dashboard.filtersTitle}</CardTitle>
          <CardDescription>{dictionary.agents.filterDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <Input 
                    placeholder={dictionary.agents.searchPlaceholder}
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                />
                <Select value={countryFilter} onValueChange={setCountryFilter}>
                    <SelectTrigger>
                        <SelectValue placeholder={dictionary.agents.countryFilterPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{dictionary.agents.allCountries}</SelectItem>
                        {Object.values(Country).map(country => (
                            <SelectItem key={country} value={country}>{country.replace(/_/g, ' ').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                 <Select value={areaFilter} onValueChange={setAreaFilter}>
                    <SelectTrigger>
                        <SelectValue placeholder={dictionary.dashboard.areaFilterLabel} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{dictionary.dashboard.allAreas}</SelectItem>
                        {agentAreas.map(area => (
                            <SelectItem key={area} value={area}>{area}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
             <div className="flex justify-end">
                <Button variant="ghost" onClick={clearFilters}>
                    <X className="mr-2 h-4 w-4" />
                    {dictionary.dashboard.clearFilters}
                </Button>
            </div>
        </CardContent>
      </Card>
      
      {isMobile ? (
          <div className="space-y-4">
              {table.getRowModel().rows.length > 0 ? (
                  table.getRowModel().rows.map(row => (
                      <AgentCard key={row.original.id} agent={row.original} dictionary={dictionary} />
                  ))
              ) : (
                  <Card>
                      <CardContent className="h-40 text-center flex items-center justify-center">
                          {dictionary.dashboard.table.noResults}
                      </CardContent>
                  </Card>
              )}
          </div>
      ) : (
          <Card>
            <CardHeader>
                <CardTitle>{dictionary.agents.listTitle}</CardTitle>
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
                        <TableRow key={row.id}>
                            {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                            ))}
                        </TableRow>
                        ))
                    ) : (
                        <TableRow>
                        <TableCell colSpan={columns.length} className="h-40 text-center">
                            {dictionary.dashboard.table.noResults}
                        </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
            </CardContent>
          </Card>
      )}
    </div>
  );
}
