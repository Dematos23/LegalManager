
'use client';

import type { CampaignWithDetails, EmailTemplate, User } from '@/types';
import { useLanguage } from '@/context/language-context';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import { format, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { Button, buttonVariants } from './ui/button';
import { Eye, Calendar as CalendarIcon, X, ArrowUpDown, Trash2, Loader2, MoreHorizontal, Users, LayoutTemplate, CalendarClock, User as UserIcon } from 'lucide-react';
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
import { deleteCampaignAction } from '@/app/(protected)/campaigns/actions';
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
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from './ui/label';
import { useIsMobile } from '@/hooks/use-mobile';


function DeleteCampaignDialog({ campaign, onCampaignDeleted, children, isMenuItem = true }: { campaign: CampaignWithDetails, onCampaignDeleted: (id: string) => void, children: React.ReactNode, isMenuItem?: boolean }) {
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

    const trigger = isMenuItem ? (
        <DropdownMenuItem onSelect={(e) => {e.preventDefault(); setIsOpen(true)}}>
            {children}
        </DropdownMenuItem>
    ) : (
        <Button variant="destructive" size="sm" onClick={() => setIsOpen(true)}>
            {children}
        </Button>
    )

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogTrigger asChild>
                {trigger}
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

function CampaignCard({ campaign, onCampaignDeleted, formatDate, dictionary }: { campaign: CampaignWithDetails, onCampaignDeleted: (id: string) => void, formatDate: (date: Date) => string, dictionary: any }) {
    return (
        <Card>
            <CardHeader>
                 <CardTitle className="text-lg">{campaign.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
                 <div className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{dictionary.tracking.table.sentBy}: </span>
                    <span>{campaign.user ? `${campaign.user.firstName} ${campaign.user.lastName}` : 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-2">
                    <LayoutTemplate className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{dictionary.tracking.table.template}: </span>
                    <span>{campaign.emailTemplate.name}</span>
                </div>
                 <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{dictionary.tracking.table.recipients}: </span>
                    <Badge variant="outline">{campaign._count.sentEmails}</Badge>
                </div>
                <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{dictionary.tracking.table.sentAt}: </span>
                    <span>{formatDate(new Date(campaign.createdAt))}</span>
                </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                <DeleteCampaignDialog campaign={campaign} onCampaignDeleted={onCampaignDeleted} isMenuItem={false}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    {dictionary.tracking.table.delete}
                </DeleteCampaignDialog>
                <Button asChild size="sm">
                    <Link href={`/tracking/${campaign.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        {dictionary.tracking.table.view}
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    )
}

type TrackingClientProps = {
    campaigns: CampaignWithDetails[];
}


export function TrackingClient({ campaigns: initialCampaigns }: TrackingClientProps) {
  const { language, dictionary } = useLanguage();
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [searchTerm, setSearchTerm] = useState('');
  const [templateFilter, setTemplateFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [sorting, setSorting] = useState<SortingState>([]);
  const isMobile = useIsMobile();
  
  const formatDate = (date: Date) => {
    return format(date, 'MMM dd, yyyy, h:mm a', {
      locale: language === 'es' ? es : undefined,
    });
  };

  const templates = useMemo(() => {
    const uniqueTemplates = new Map<string, EmailTemplate>();
    initialCampaigns.forEach(campaign => {
        if (campaign.emailTemplate) {
            uniqueTemplates.set(campaign.emailTemplate.id, campaign.emailTemplate);
        }
    });
    return Array.from(uniqueTemplates.values());
  }, [initialCampaigns]);

  const filteredCampaigns = useMemo(() => {
    return campaigns
        .filter(campaign => {
            const searchString = `${campaign.name} ${campaign.user?.firstName} ${campaign.user?.lastName}`.toLowerCase();
            const matchesSearch = searchString.includes(searchTerm.toLowerCase());
            const matchesTemplate = templateFilter === 'all' || !campaign.emailTemplate || campaign.emailTemplateId === templateFilter;
            const campaignDate = new Date(campaign.createdAt);
            const matchesDate = !dateRange || (dateRange.from && isWithinInterval(campaignDate, { start: dateRange.from, end: dateRange.to || dateRange.from }));
            return matchesSearch && matchesTemplate && matchesDate;
        })
        .sort((a, b) => {
            if (sorting.length === 0) return 0;
            const sortConfig = sorting[0];
            const key = sortConfig.id as keyof CampaignWithDetails;
            
            let valA: any = a[key];
            let valB: any = b[key];

            if (key === 'emailTemplate.name') {
                valA = a.emailTemplate?.name || '';
                valB = b.emailTemplate?.name || '';
            }
             if (key === 'user') {
                valA = `${a.user?.firstName} ${a.user?.lastName}`;
                valB = `${b.user?.firstName} ${b.user?.lastName}`;
            }

            let result = 0;
            if (valA < valB) result = -1;
            if (valA > valB) result = 1;

            return sortConfig.desc ? -result : result;
        });
  }, [campaigns, searchTerm, templateFilter, dateRange, sorting]);

  const handleCampaignDeleted = (campaignId: string) => {
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
        accessorKey: 'user',
        header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                {dictionary.tracking.table.sentBy}
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => {
            const user = row.original.user;
            return user ? `${user.firstName} ${user.lastName}` : 'Unknown';
        },
    },
    {
        accessorKey: 'emailTemplate.name',
        header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                {dictionary.tracking.table.template}
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => row.original.emailTemplate?.name || 'Custom Email',
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
                            <Trash2 className="mr-2 h-4 w-4" />
                            {dictionary.tracking.table.delete}
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

      {isMobile ? (
        <div className="space-y-4">
            {filteredCampaigns.length > 0 ? (
                filteredCampaigns.map(campaign => (
                    <CampaignCard 
                        key={campaign.id} 
                        campaign={campaign}
                        onCampaignDeleted={handleCampaignDeleted}
                        formatDate={formatDate}
                        dictionary={dictionary}
                    />
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
      )}
    </div>
  );
}

    