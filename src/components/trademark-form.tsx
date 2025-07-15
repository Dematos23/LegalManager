
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
import type { Agent, Owner, Contact as PrismaContact, Trademark } from '@/types';

// The page passes contacts with agents included
type ContactWithAgent = PrismaContact & { agent: Agent };

const TrademarkFormSchema = z.object({
  denomination: z.string().min(1, 'Denomination is required.'),
  class: z.coerce.number().int().min(1, 'Class must be between 1 and 45.').max(45, 'Class must be between 1 and 45.'),
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
  contacts: ContactWithAgent[];
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
      ownerName: '',
      ownerCountry: undefined,
      contactId: '',
      contactFirstName: '',
      contactLastName: '',
      contactEmail: '',
      agentId: '',
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
        title: dictionary.trademarkForm.errorTitle,
        description: dictionary.trademarkForm.errorDescription,
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>{dictionary.trademarkForm.title}</CardTitle>
            <CardDescription>{dictionary.trademarkForm.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Trademark Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">{dictionary.trademarkForm.trademarkDetailsTitle}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="denomination" render={({ field }) => (
                    <FormItem><FormLabel>{dictionary.trademarkForm.denomination}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="certificate" render={({ field }) => (
                    <FormItem><FormLabel>{dictionary.trademarkForm.certificate}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="class" render={({ field }) => (
                    <FormItem><FormLabel>{dictionary.trademarkForm.class}</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
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

            {/* Owner and Contact */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">{dictionary.trademarkForm.ownerAndContactTitle}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Owner Section */}
                <div className="space-y-4 rounded-md border p-4">
                  <FormField control={form.control} name="ownerId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{dictionary.trademarkForm.owner}</FormLabel>
                      <FormDescription>{dictionary.trademarkForm.contactAssociationDescription}</FormDescription>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder={dictionary.trademarkForm.ownerPlaceholder} /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="new">{dictionary.trademarkForm.createNewOwner}</SelectItem>
                          {owners.map(o => <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  {ownerId === 'new' && (
                    <>
                      <FormField control={form.control} name="ownerName" render={({ field }) => (
                        <FormItem><FormLabel>{dictionary.trademarkForm.newOwnerName}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="ownerCountry" render={({ field }) => (
                          <FormItem>
                            <FormLabel>{dictionary.trademarkForm.newOwnerCountry}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder={dictionary.trademarkForm.countryPlaceholder} /></SelectTrigger></FormControl>
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
                      <FormLabel>{dictionary.trademarkForm.contact}</FormLabel>
                       <FormDescription>{dictionary.trademarkForm.contactAssociationDescription}</FormDescription>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder={dictionary.trademarkForm.contactPlaceholder} /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="new">{dictionary.trademarkForm.createNewContact}</SelectItem>
                          {contacts.map(c => (
                              <SelectItem key={c.id} value={String(c.id)}>
                                {`${c.firstName} ${c.lastName} (${c.agent.name})`}
                              </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  {contactId === 'new' && (
                    <>
                      <FormField control={form.control} name="contactFirstName" render={({ field }) => (
                        <FormItem><FormLabel>{dictionary.trademarkForm.newContactFirstName}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="contactLastName" render={({ field }) => (
                        <FormItem><FormLabel>{dictionary.trademarkForm.newContactLastName}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="contactEmail" render={({ field }) => (
                        <FormItem><FormLabel>{dictionary.trademarkForm.newContactEmail}</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="agentId" render={({ field }) => (
                        <FormItem>
                            <FormLabel>{dictionary.trademarkForm.agentForNewContact}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder={dictionary.trademarkForm.agentPlaceholder} /></SelectTrigger></FormControl>
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
          ) : dictionary.trademarkForm.submitButton }
        </Button>
      </form>
    </Form>
  );
}
