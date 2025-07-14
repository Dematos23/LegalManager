
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
import { CalendarIcon, Loader2 } from 'lucide-react';
import { Calendar } from './ui/calendar';
import { Textarea } from './ui/textarea';
import { useLanguage } from '@/context/language-context';
import { createTrademark } from '@/app/trademarks/actions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { TrademarkType, Country } from '@prisma/client';
import type { Agent, Owner, Contact, Trademark } from '@/types';

const TrademarkFormSchema = z.object({
  denomination: z.string().min(1, 'Denomination is required.'),
  class: z.coerce.number().int().min(1).max(45),
  type: z.nativeEnum(TrademarkType),
  certificate: z.string().min(1, 'Certificate is required.'),
  expiration: z.date({ required_error: 'Expiration date is required.' }),
  products: z.string().optional(),
  
  ownerId: z.string().min(1, "Please select or create an owner."),
  ownerName: z.string().optional(),
  ownerCountry: z.nativeEnum(Country).optional(),

  contactId: z.string().min(1, "Please select or create a contact."),
  contactFirstName: z.string().optional(),
  contactLastName: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  
  agentId: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.ownerId === 'new') {
        if (!data.ownerName) {
            ctx.addIssue({ code: 'custom', message: 'Owner name is required for a new owner.', path: ['ownerName'] });
        }
        if (!data.ownerCountry) {
            ctx.addIssue({ code: 'custom', message: 'Owner country is required for a new owner.', path: ['ownerCountry'] });
        }
    }
    if (data.contactId === 'new') {
        if (!data.contactFirstName) {
            ctx.addIssue({ code: 'custom', message: 'First name is required for a new contact.', path: ['contactFirstName'] });
        }
        if (!data.contactLastName) {
            ctx.addIssue({ code: 'custom', message: 'Last name is required for a new contact.', path: ['contactLastName'] });
        }
        if (!data.contactEmail) {
            ctx.addIssue({ code: 'custom', message: 'Email is required for a new contact.', path: ['contactEmail'] });
        }
        if (!data.agentId) {
            ctx.addIssue({ code: 'custom', message: 'Agent is required for a new contact.', path: ['agentId'] });
        }
    }
});

type TrademarkFormValues = z.infer<typeof TrademarkFormSchema>;

interface TrademarkFormProps {
  trademark?: Trademark;
  agents: Agent[];
  owners: Owner[];
  contacts: Contact[];
}

export function TrademarkForm({ trademark, agents, owners, contacts }: TrademarkFormProps) {
  const { dictionary } = useLanguage();
  const { toast } = useToast();
  
  const form = useForm<TrademarkFormValues>({
    resolver: zodResolver(TrademarkFormSchema),
    defaultValues: {
      denomination: trademark?.denomination ?? '',
      class: trademark?.class ?? 1,
      type: trademark?.type ?? 'NOMINATIVE',
      certificate: trademark?.certificate ?? '',
      expiration: trademark?.expiration ? new Date(trademark.expiration) : undefined,
      products: trademark?.products ?? '',
      ownerId: '',
      contactId: '',
    },
  });

  const ownerId = form.watch('ownerId');
  const contactId = form.watch('contactId');

  const onSubmit = async (data: TrademarkFormValues) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
          if (value instanceof Date) {
            formData.append(key, value.toISOString());
          } else {
            formData.append(key, String(value));
          }
      }
    });

    const result = await createTrademark(formData);

    if (result?.errors) {
      // Handle server-side validation errors
      Object.entries(result.errors).forEach(([key, messages]) => {
        form.setError(key as keyof TrademarkFormValues, {
          type: 'server',
          message: (messages as string[]).join(', '),
        });
      });
      toast({
        title: "Error",
        description: "Please correct the errors in the form.",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Create New Trademark</CardTitle>
            <CardDescription>Fill in the details for the new trademark.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Trademark Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Trademark Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="denomination" render={({ field }) => (
                    <FormItem><FormLabel>Denomination</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="certificate" render={({ field }) => (
                    <FormItem><FormLabel>Certificate</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="class" render={({ field }) => (
                    <FormItem><FormLabel>Class</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
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
                    <FormLabel>Expiration Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" className={cn(!field.value && 'text-muted-foreground')}>
                            {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
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
                <FormItem><FormLabel>Products</FormLabel><FormControl><Textarea {...field} /></FormControl><FormDescription>Optional: list of products or services.</FormDescription><FormMessage /></FormItem>
              )} />
            </div>

            {/* Owner and Contact */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Owner & Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Owner Section */}
                <div className="space-y-4 rounded-md border p-4">
                  <FormField control={form.control} name="ownerId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Owner</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select or create an owner..." /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="new">-- Create New Owner --</SelectItem>
                          {owners.map(o => <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  {ownerId === 'new' && (
                    <>
                      <FormField control={form.control} name="ownerName" render={({ field }) => (
                        <FormItem><FormLabel>New Owner Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="ownerCountry" render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Owner Country</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select country..." /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {Object.values(Country).map(c => <SelectItem key={c} value={c}>{c.replace(/_/g, ' ')}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                      )} />
                    </>
                  )}
                </div>

                {/* Contact Section */}
                <div className="space-y-4 rounded-md border p-4">
                   <FormField control={form.control} name="contactId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact</FormLabel>
                       <FormDescription>This contact will be associated with the owner.</FormDescription>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select or create a contact..." /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="new">-- Create New Contact --</SelectItem>
                          {contacts.map(c => <SelectItem key={c.id} value={String(c.id)}>{`${c.firstName} ${c.lastName}`}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  {contactId === 'new' && (
                    <>
                      <FormField control={form.control} name="contactFirstName" render={({ field }) => (
                        <FormItem><FormLabel>New Contact First Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="contactLastName" render={({ field }) => (
                        <FormItem><FormLabel>New Contact Last Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="contactEmail" render={({ field }) => (
                        <FormItem><FormLabel>New Contact Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="agentId" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Agent for New Contact</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select agent..." /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {agents.map(a => <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                      )} />
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : 'Create Trademark'}
        </Button>
      </form>
    </Form>
  );
}
