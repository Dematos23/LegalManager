
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
import { Button } from './ui/button';
import { Eye, Calendar as CalendarIcon, X } from 'lucide-react';
import { Badge } from './ui/badge';
import React, { useState, useMemo } from 'react';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import type { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';

type TrackingClientProps = {
  campaigns: CampaignWithDetails[];
};

export function TrackingClient({ campaigns }: TrackingClientProps) {
  const { language, dictionary } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [templateFilter, setTemplateFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const formatDate = (date: Date) => {
    return format(date, 'MMM dd, yyyy, h:mm a', {
      locale: language === 'es' ? es : undefined,
    });
  };

  const templates = useMemo(() => {
    const uniqueTemplates = new Map<number, EmailTemplate>();
    campaigns.forEach(campaign => {
        uniqueTemplates.set(campaign.emailTemplate.id, campaign.emailTemplate);
    });
    return Array.from(uniqueTemplates.values());
  }, [campaigns]);

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(campaign => {
        // Search Term Filter
        const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Template Filter
        const matchesTemplate = templateFilter === 'all' || campaign.emailTemplateId === Number(templateFilter);

        // Date Range Filter
        const campaignDate = new Date(campaign.createdAt);
        const matchesDate = !dateRange || (dateRange.from && isWithinInterval(campaignDate, { start: dateRange.from, end: dateRange.to || dateRange.from }));

        return matchesSearch && matchesTemplate && matchesDate;
    })
  }, [campaigns, searchTerm, templateFilter, dateRange]);

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
          <CardTitle>{dictionary.dashboard.filtersTitle}</CardTitle>
          <CardDescription>{dictionary.tracking.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input 
                    placeholder="Search by campaign name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Select value={templateFilter} onValueChange={setTemplateFilter}>
                    <SelectTrigger>
                        <SelectValue placeholder="Filter by template..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Templates</SelectItem>
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
                        <span>Pick a date range</span>
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
                    Clear Filters
                </Button>
            </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Campaign List</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCampaigns.length === 0 ? (
            <div className="flex justify-center items-center h-40">
              <p className="text-muted-foreground">{dictionary.dashboard.table.noResults}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{dictionary.tracking.table.campaignName}</TableHead>
                  <TableHead>{dictionary.tracking.table.template}</TableHead>
                  <TableHead>{dictionary.tracking.table.recipients}</TableHead>
                  <TableHead>{dictionary.tracking.table.sentAt}</TableHead>
                  <TableHead className="text-right">{dictionary.tracking.table.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCampaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">{campaign.name}</TableCell>
                    <TableCell>{campaign.emailTemplate.name}</TableCell>
                    <TableCell>
                        <Badge variant="outline">{campaign._count.sentEmails}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(new Date(campaign.createdAt))}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/tracking/${campaign.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            {dictionary.tracking.table.view}
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
