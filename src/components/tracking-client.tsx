
'use client';

import type { CampaignWithDetails, EmailTemplate } from '@/types';
import { useLanguage } from '@/context/language-context';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { Button, buttonVariants } from './ui/button';
import { Eye, Calendar as CalendarIcon, X, ArrowUpDown, Trash2, Loader2, MoreHorizontal } from 'lucide-react';
import { Badge } from './ui/badge';
import React, { useState, useMemo, useTransition } from 'react';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import type { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
} from '@tanstack/react-table';
import { deleteCampaignAction } from '@/app/campaigns/actions';
import { useToast } from '@/hooks/use-toast';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from './ui/label';

type TrackingClientProps = {
  campaigns: CampaignWithDetails[];
};

function DeleteCampaignDialog({ campaign, onCampaignDeleted, children }: { campaign: CampaignWithDetails, onCampaignDeleted: (id: number) => void, children: React.ReactNode }) {
    const { dictionary } = useLanguage();
    const { toast } = useToast();
    const [isDeleting, startDeleteTransition] = useTransition();
    const [deleteInput, setDeleteInput] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const handleDelete = () => {
        startDeleteTransition(async () => {
            const result = await deleteCampaignAction(campaign.id);
            if (result.success) {
                onCampaignDeleted(campaign.id);
                toast({
                    title: dictionary.tracking.deleteDialog.successTitle,
                    description: dictionary.tracking.deleteDialog.successDescription,
                });
                setIsOpen(false);
            } else {
                toast({
                    title: dictionary.tracking.deleteDialog.errorTitle,
                    description: result.error,
                    variant: 'destructive',
                });
            }
            setDeleteInput('');
        });
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogTrigger asChild>
                {children}
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{dictionary.tracking.deleteDialog.title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {dictionary.tracking.deleteDialog.description}
                        <span className="font-bold text-destructive">
                            {campaign.name}
                        </span>
                        . {dictionary.tracking.deleteDialog.confirm}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="grid gap-2">
                   <Label htmlFor={`delete-confirm-${campaign.id}`}>{dictionary.tracking.deleteDialog.confirmLabel}</Label>
                    <Input 
                        id={`delete-confirm-${campaign.id}`}
                        value={deleteInput}
                        onChange={(e) => setDeleteInput(e.target.value)}
                        placeholder="DELETE"
                        autoFocus
                    />
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDeleteInput('')}>{dictionary.tracking.deleteDialog.cancel}</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={deleteInput !== 'DELETE' || isDeleting}
                        className={cn(buttonVariants({ variant: 'destructive' }))}
                    >
                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {dictionary.tracking.deleteDialog.continue}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}


export function TrackingClient({ campaigns: initialCampaigns }: TrackingClientProps) {
  const { language, dictionary } = useLanguage();
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [searchTerm, setSearchTerm] = useState('');
  const [templateFilter, setTemplateFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [sorting, setSorting] = useState<SortingState>([]);
  
  const formatDate = (date: Date) => {
    return format(date, 'MMM dd, yyyy, h:mm a', {
      locale: language === 'es' ? es : undefined,
    });
  };

  const templates = useMemo(() => {
    const uniqueTemplates = new Map<number, EmailTemplate>();
    initialCampaigns.forEach(campaign => {
        uniqueTemplates.set(campaign.emailTemplate.id, campaign.emailTemplate);
    });
    return Array.from(uniqueTemplates.values());
  }, [initialCampaigns]);

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(campaign => {
        const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTemplate = templateFilter === 'all' || campaign.emailTemplateId === Number(templateFilter);
        const campaignDate = new Date(campaign.createdAt);
        const matchesDate = !dateRange || (dateRange.from && isWithinInterval(campaignDate, { start: dateRange.from, end: dateRange.to || dateRange.from }));
        return matchesSearch && matchesTemplate && matchesDate;
    })
  }, [campaigns, searchTerm, templateFilter, dateRange]);

  const handleCampaignDeleted = (campaignId: number) => {
      setCampaigns(prev => prev.filter(c => c.id !== campaignId));
  }

  const columns = useMemo<ColumnDef<CampaignWithDetails>[]>(() => [
    {
        accessorKey: 'name',
        header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                {dictionary.tracking.table.campaignName}
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>,
    },
    {
        accessorKey: 'emailTemplate.name',
        header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                {dictionary.tracking.table.template}
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => row.original.emailTemplate.name,
    },
    {
        accessorKey: '_count.sentEmails',
        header: dictionary.tracking.table.recipients,
        cell: ({ row }) => <Badge variant="outline">{row.original._count.sentEmails}</Badge>,
        enableSorting: false,
    },
    {
        accessorKey: 'createdAt',
        header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                {dictionary.tracking.table.sentAt}
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => formatDate(new Date(row.getValue('createdAt'))),
    },
    {
        id: 'actions',
        header: () => <div className="text-right">{dictionary.tracking.table.actions}</div>,
        cell: ({ row }) => (
            <div className="flex items-center justify-end gap-2">
                <Button asChild variant="outline" size="sm">
                    <Link href={`/tracking/${row.original.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        {dictionary.tracking.table.view}
                    </Link>
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                         <DeleteCampaignDialog campaign={row.original} onCampaignDeleted={handleCampaignDeleted}>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                {dictionary.tracking.table.delete}
                            </DropdownMenuItem>
                         </DeleteCampaignDialog>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        ),
    }
  ], [dictionary, formatDate, handleCampaignDeleted]);

  const table = useReactTable({
    data: filteredCampaigns,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const clearFilters = () => {
    setSearchTerm('');
    setTemplateFilter('all');
    setDateRange(undefined);
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          {dictionary.tracking.title}
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{dictionary.tracking.filtersTitle}</CardTitle>
          <CardDescription>{dictionary.tracking.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input 
                    placeholder={dictionary.tracking.searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Select value={templateFilter} onValueChange={setTemplateFilter}>
                    <SelectTrigger>
                        <SelectValue placeholder={dictionary.tracking.templateFilterPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{dictionary.tracking.allTemplates}</SelectItem>
                        {templates.map(template => (
                            <SelectItem key={template.id} value={String(template.id)}>{template.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                 <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                        dateRange.to ? (
                            <>
                            {format(dateRange.from, "LLL dd, y")} -{" "}
                            {format(dateRange.to, "LLL dd, y")}
                            </>
                        ) : (
                            format(dateRange.from, "LLL dd, y")
                        )
                        ) : (
                        <span>{dictionary.tracking.dateRangePlaceholder}</span>
                        )}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                    />
                    </PopoverContent>
                </Popover>
            </div>
             <div className="flex justify-end">
                <Button variant="ghost" onClick={clearFilters}>
                    <X className="mr-2 h-4 w-4" />
                    {dictionary.tracking.clearFilters}
                </Button>
            </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{dictionary.tracking.campaignListTitle}</CardTitle>
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
    </div>
  );
}
