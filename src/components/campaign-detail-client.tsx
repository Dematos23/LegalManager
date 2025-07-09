
'use client';

import type { CampaignDetails, SentEmail, Contact } from '@/types';
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
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ArrowLeft, Mail, MailOpen, CheckCircle2, ArrowRight, RefreshCw, Loader2, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import React, { useMemo, useState, useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import { syncCampaignStatusAction } from '@/app/campaigns/actions';
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
    FilterFn,
} from '@tanstack/react-table';

type CampaignDetailClientProps = {
  campaign: CampaignDetails;
};

const globalFilterFn: FilterFn<any> = (row, columnId, value) => {
    const email = row.original;
    const search = String(value).toLowerCase();
    const { contact } = email;
    const contactString = `${contact.firstName} ${contact.lastName} ${contact.email}`.toLowerCase();
    return contactString.includes(search);
}

export function CampaignDetailClient({ campaign }: CampaignDetailClientProps) {
  const { language, dictionary } = useLanguage();
  const [isSyncing, startSyncTransition] = useTransition();
  const { toast } = useToast();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const formatDate = (date: Date) => {
    return format(date, 'MMM dd, yyyy, h:mm a', {
      locale: language === 'es' ? es : undefined,
    });
  };

  const getStatus = React.useCallback((email: SentEmail) => {
      if (email.openedAt) return { text: dictionary.tracking.details.statuses.opened, order: 3 };
      if (email.deliveredAt) return { text: dictionary.tracking.details.statuses.delivered, order: 2 };
      if (email.sentAt) return { text: dictionary.tracking.details.statuses.sent, order: 1 };
      return { text: dictionary.tracking.details.table.pending, order: 0 };
  }, [dictionary]);

  const columns = useMemo<ColumnDef<SentEmail & { contact: Contact }>[]>(() => [
    {
        accessorFn: (row) => `${row.contact.firstName} ${row.contact.lastName}`,
        id: 'contact',
        header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                {dictionary.tracking.details.table.contact}
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => {
            const email = row.original;
            return (
                <div className="flex flex-col">
                    <Link href={`/contacts/${email.contact.id}`} className="font-medium hover:underline text-primary">
                        {`${email.contact.firstName || ''} ${email.contact.lastName || ''}`.trim()}
                    </Link>
                    <div className="text-sm text-muted-foreground">{email.contact.email}</div>
                </div>
            )
        },
    },
    {
        id: 'status',
        accessorFn: (row) => getStatus(row).text,
        header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                {dictionary.tracking.details.table.status}
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => {
            const status = getStatus(row.original).text;
            let variant: "default" | "secondary" | "outline" = "outline";
            if (status === dictionary.tracking.details.statuses.opened) variant = "default";
            else if (status === dictionary.tracking.details.statuses.delivered) variant = "secondary";
            
            return <Badge variant={variant}>{status}</Badge>;
        },
        sortingFn: (rowA, rowB) => {
            const statusA = getStatus(rowA.original).order;
            const statusB = getStatus(rowB.original).order;
            return statusA - statusB;
        }
    },
    {
        id: 'emailTracking',
        header: () => <div className="text-left">{dictionary.tracking.details.table.emailTracking}</div>,
        cell: ({ row }) => {
            const email = row.original;
            return (
                <div className="flex items-start space-x-4">
                    <div className="flex flex-col items-center gap-1 text-center w-28">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className={cn("flex items-center justify-center p-2 rounded-full", email.sentAt ? 'bg-gray-100 text-gray-600' : 'bg-gray-50 text-gray-300')}>
                                        <Mail className="h-6 w-6"/>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="font-semibold">{dictionary.tracking.details.table.sent}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        {email.sentAt ? (
                            <p className="text-xs text-muted-foreground">{formatDate(new Date(email.sentAt))}</p>
                        ) : (
                            <p className="text-xs text-muted-foreground">{dictionary.tracking.details.table.pending}</p>
                        )}
                    </div>

                    {email.sentAt && <ArrowRight className="h-5 w-5 text-gray-300 mt-3" />}

                    <div className="flex flex-col items-center gap-1 text-center w-28">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className={cn("flex items-center justify-center p-2 rounded-full", email.deliveredAt ? 'bg-green-100 text-green-600' : 'bg-gray-50 text-gray-300')}>
                                        <CheckCircle2 className="h-6 w-6"/>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="font-semibold">{dictionary.tracking.details.table.delivered}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        {email.deliveredAt ? (
                            <p className="text-xs text-muted-foreground">{formatDate(new Date(email.deliveredAt))}</p>
                        ) : (
                            <p className="text-xs text-muted-foreground">{dictionary.tracking.details.table.pending}</p>
                        )}
                    </div>

                    {email.deliveredAt && <ArrowRight className="h-5 w-5 text-gray-300 mt-3" />}

                    <div className="flex flex-col items-center gap-1 text-center w-28">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className={cn("flex items-center justify-center p-2 rounded-full", email.openedAt ? 'bg-blue-100 text-blue-600' : 'bg-gray-50 text-gray-300')}>
                                        <MailOpen className="h-6 w-6"/>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="font-semibold">{dictionary.tracking.details.table.opened}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        {email.openedAt ? (
                            <p className="text-xs text-muted-foreground">{formatDate(new Date(email.openedAt))}</p>
                        ) : (
                            <p className="text-xs text-muted-foreground">{dictionary.tracking.details.table.pending}</p>
                        )}
                    </div>
                </div>
            );
        }
    }
  ], [dictionary, getStatus, formatDate]);

  const table = useReactTable({
    data: campaign.sentEmails,
    columns,
    state: {
        sorting,
        globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn,
  });

  const handleSync = () => {
    startSyncTransition(async () => {
        const result = await syncCampaignStatusAction(campaign.id);
        if (result.error) {
            toast({
                title: dictionary.tracking.details.syncErrorTitle,
                description: result.error,
                variant: 'destructive',
            });
        } else {
            toast({
                title: dictionary.tracking.details.syncSuccessTitle,
                description: result.success || '',
            });
        }
    });
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          {campaign.name}
        </h1>
        <div className="flex gap-2">
            <Button onClick={handleSync} disabled={isSyncing} variant="outline">
                {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                {dictionary.tracking.details.syncButton}
            </Button>
            <Button asChild variant="outline">
                <Link href="/tracking">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {dictionary.tracking.details.back}
                </Link>
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
            <CardHeader>
                <CardTitle>{dictionary.tracking.details.title}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{dictionary.tracking.details.template}</p>
                    <p>{campaign.emailTemplate.name}</p>
                </div>
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{dictionary.tracking.details.sentAt}</p>
                    <p>{formatDate(new Date(campaign.createdAt))}</p>
                </div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>{dictionary.dashboard.filtersTitle}</CardTitle>
            </CardHeader>
            <CardContent>
                <Input
                    placeholder={dictionary.tracking.details.searchPlaceholder}
                    value={globalFilter ?? ''}
                    onChange={(event) => setGlobalFilter(event.target.value)}
                    className="w-full"
                />
            </CardContent>
        </Card>
      </div>
      

      <Card>
        <CardHeader>
          <CardTitle>{dictionary.tracking.details.sentEmailsTitle}</CardTitle>
          <CardDescription>
            {dictionary.tracking.details.sentEmailsDescription}
          </CardDescription>
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
                  <TableCell colSpan={columns.length} className="h-24 text-center">
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
