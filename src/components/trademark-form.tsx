
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { CalendarIcon, Loader2, ChevronsUpDown, X } from 'lucide-react';
import { Calendar } from './ui/calendar';
import { Textarea } from './ui/textarea';
import { useLanguage } from '@/context/language-context';
import { createTrademark, updateTrademark } from '@/app/(protected)/trademarks/actions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { TrademarkType, Country } from '@prisma/client';
import type { Agent, Owner, ContactWithAgent, TrademarkWithDetails } from '@/types';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Checkbox } from './ui/checkbox';


const TrademarkFormSchema = z.object({
  denomination: z.string().min(1, 'Denomination is required.'),
  classIds: z.array(z.string()).min(1, 'At least one class is required.'),
  type: z.nativeEnum(TrademarkType),
  certificate: z.string().min(1, 'Certificate is required.'),
  expiration: z.date({ required_error: 'Expiration date is required.' }),
  products: z.string().optional(),
  
  ownerId: z.string().min(1, "Please select an owner."),
  contactId: z.string().min(1, "Please select a contact."),
});

type TrademarkFormValues = z.infer<typeof TrademarkFormSchema>;

interface TrademarkFormProps {
  trademark?: TrademarkWithDetails;
  agents: Agent[];
  owners: Owner[];
  contacts: ContactWithAgent[];
}

const ALL_CLASSES = Array.from({ length: 45 }, (_, i) => ({
  value: String(i + 1),
  label: `Class ${i + 1}`,
}));

export function TrademarkForm({ trademark, agents, owners, contacts }: TrademarkFormProps) {
  const { dictionary } = useLanguage();
  const { toast } = useToast();
  
  const form = useForm<TrademarkFormValues>({
    resolver: zodResolver(TrademarkFormSchema),
    defaultValues: {
      denomination: trademark?.denomination ?? '',
      classIds: trademark?.trademarkClasses?.map((tc: any) => String(tc.class.id)) ?? [],
      type: trademark?.type ?? 'NOMINATIVE',
      certificate: trademark?.certificate ?? '',
      expiration: trademark?.expiration ? new Date(trademark.expiration) : undefined,
      products: trademark?.products ?? '',
      ownerId: String(trademark?.ownerId || ''),
      contactId: String(trademark?.owner.ownerContacts[0]?.contactId || ''),
    },
  });

  const onSubmit = async (data: TrademarkFormValues) => {
    const formData = new FormData();
    
    // Append non-array fields
    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'classIds' && value !== undefined && value !== null) {
        if (value instanceof Date) {
          formData.append(key, value.toISOString());
        } else {
          formData.append(key, String(value));
        }
      }
    });

    // Append array field
    data.classIds.forEach(id => {
        formData.append('classIds', id);
    });

    // We need owner details for the action, even if they aren't directly in the schema
    const selectedOwner = owners.find(o => o.id === data.ownerId);
    if (selectedOwner) {
        formData.append('ownerName', selectedOwner.name);
        formData.append('ownerCountry', selectedOwner.country);
    }

    const action = trademark ? updateTrademark.bind(null, trademark.id) : createTrademark;
    const result = await action(formData);

    if (result?.errors) {
      Object.entries(result.errors).forEach(([key, messages]) => {
        form.setError(key as keyof TrademarkFormValues, {
          type: 'server',
          message: (messages as string[]).join(', '),
        });
      });
      toast({
        title: dictionary.trademarkForm.errorTitle,
        description: dictionary.trademarkForm.errorDescription,
        variant: "destructive",
      });
    }
  };

  const title = trademark ? dictionary.trademarkForm.editTitle : dictionary.trademarkForm.createTitle;
  const description = trademark ? dictionary.trademarkForm.editDescription : dictionary.trademarkForm.description;
  const submitButtonText = trademark ? dictionary.trademarkForm.updateButton : dictionary.trademarkForm.submitButton;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">{dictionary.trademarkForm.trademarkDetailsTitle}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="denomination" render={({ field }) => (
                    <FormItem><FormLabel>{dictionary.trademarkForm.denomination}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="certificate" render={({ field }) => (
                    <FormItem><FormLabel>{dictionary.trademarkForm.certificate}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField
                  control={form.control}
                  name="classIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{dictionary.trademarkForm.class}</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        className={cn(
                                        "w-full justify-between h-auto min-h-10",
                                        !field.value.length && "text-muted-foreground"
                                        )}
                                    >
                                        <div className="flex gap-1 flex-wrap">
                                        {field.value.length > 0 ? (
                                             field.value.map((id) => (
                                                <Badge
                                                    variant="secondary"
                                                    key={id}
                                                    className="mr-1"
                                                    onClick={() => {
                                                        const newValues = field.value.filter((val) => val !== id);
                                                        field.onChange(newValues);
                                                    }}
                                                >
                                                    {ALL_CLASSES.find(c => c.value === id)?.label}
                                                    <X className="ml-1 h-3 w-3" />
                                                </Badge>
                                            ))
                                        ) : (
                                            <span>Select classes...</span>
                                        )}
                                        </div>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <ScrollArea className="h-72">
                                {ALL_CLASSES.map((item) => (
                                    <div key={item.value} className="flex items-center space-x-2 p-2">
                                    <Checkbox
                                        id={`class-${item.value}`}
                                        checked={field.value.includes(item.value)}
                                        onCheckedChange={(checked) => {
                                        const newValue = checked
                                            ? [...field.value, item.value]
                                            : field.value.filter(
                                                (value) => value !== item.value
                                            );
                                        field.onChange(newValue);
                                        }}
                                    />
                                    <label htmlFor={`class-${item.value}`} className="text-sm font-medium leading-none">
                                        {item.label}
                                    </label>
                                    </div>
                                ))}
                                </ScrollArea>
                            </PopoverContent>
                        </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{dictionary.trademarkForm.type}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {Object.values(TrademarkType).map(type => (
                          <SelectItem key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="expiration" render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{dictionary.trademarkForm.expirationDate}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" className={cn(!field.value && 'text-muted-foreground')}>
                            {field.value ? format(field.value, 'PPP') : <span>{dictionary.trademarkForm.pickDate}</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="products" render={({ field }) => (
                <FormItem><FormLabel>{dictionary.trademarkForm.products}</FormLabel><FormControl><Textarea {...field} /></FormControl><FormDescription>{dictionary.trademarkForm.productsDescription}</FormDescription><FormMessage /></FormItem>
              )} />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">{dictionary.trademarkForm.ownerAndContactTitle}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="ownerId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{dictionary.trademarkForm.owner}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder={dictionary.trademarkForm.ownerPlaceholder} /></SelectTrigger></FormControl>
                      <SelectContent>
                        {owners.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                 <FormField control={form.control} name="contactId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{dictionary.trademarkForm.contact}</FormLabel>
                     <FormDescription>{dictionary.trademarkForm.contactAssociationDescription}</FormDescription>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder={dictionary.trademarkForm.contactPlaceholder} /></SelectTrigger></FormControl>
                      <SelectContent>
                        {contacts.map(c => (
                            <SelectItem key={c.id} value={c.id}>
                              {`${c.firstName} ${c.lastName} (${c.agent.name})`}
                            </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : submitButtonText }
        </Button>
      </form>
    </Form>
  );
}
