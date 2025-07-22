
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
import { Button } from '@/components/ui/button';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import type { User } from '@prisma/client';
import { Role, Area } from '@prisma/client';
import { useLanguage } from '@/context/language-context';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Form,
  FormControl,
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
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowUpDown, Edit, Loader2, MoreHorizontal, PlusCircle, Trash2, KeyRound } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createUser, updateUser, deactivateUser, resetPassword } from '@/app/users/actions';

type UsersClientProps = {
  users: User[];
};

const UserFormSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  role: z.nativeEnum(Role),
  area: z.nativeEnum(Area),
});

const CreateUserSchema = UserFormSchema.extend({
    password: z.string().min(8),
    passwordConfirm: z.string().min(8),
}).refine(data => data.password === data.passwordConfirm, {
    message: "Passwords don't match",
    path: ["passwordConfirm"],
});

type UserFormValues = z.infer<typeof UserFormSchema>;
type CreateUserFormValues = z.infer<typeof CreateUserSchema>;

function UserForm({ user, onFinished }: { user?: User; onFinished: () => void }) {
  const { dictionary } = useLanguage();
  const { toast } = useToast();
  
  const formSchema = user ? UserFormSchema : CreateUserSchema;
  
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: user || {
      firstName: '',
      lastName: '',
      email: '',
      role: Role.LEGAL,
      area: Area.ACD,
      password: '',
      passwordConfirm: '',
    },
  });

  const onSubmit = async (values: UserFormValues | CreateUserFormValues) => {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      formData.append(key, value as string);
    });

    const action = user ? updateUser.bind(null, user.id) : createUser;
    const result = await action(formData);
    
    if (result.success) {
      toast({ title: user ? dictionary.users.toasts.userUpdated : dictionary.users.toasts.userCreated });
      onFinished();
    } else if (result.errors) {
      Object.entries(result.errors).forEach(([key, messages]) => {
        form.setError(key as any, { type: 'manual', message: (messages as string[]).join(', ') });
      });
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{user ? dictionary.users.form.editTitle : dictionary.users.form.createTitle}</DialogTitle>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="firstName" render={({ field }) => (
              <FormItem><FormLabel>{dictionary.users.form.firstName}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="lastName" render={({ field }) => (
              <FormItem><FormLabel>{dictionary.users.form.lastName}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
          </div>
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem><FormLabel>{dictionary.users.form.email}</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          {!user && (
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem><FormLabel>{dictionary.users.form.password}</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="passwordConfirm" render={({ field }) => (
                <FormItem><FormLabel>{dictionary.users.form.passwordConfirm}</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="role" render={({ field }) => (
              <FormItem>
                <FormLabel>{dictionary.users.form.role}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>{Object.values(Role).map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}</SelectContent>
                </Select><FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="area" render={({ field }) => (
              <FormItem>
                <FormLabel>{dictionary.users.form.area}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>{Object.values(Area).map(area => <SelectItem key={area} value={area}>{area}</SelectItem>)}</SelectContent>
                </Select><FormMessage />
              </FormItem>
            )} />
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
            <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {user ? dictionary.users.form.updateButton : dictionary.users.form.createButton}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}


function ResetPasswordDialog({ user, onFinished }: { user: User; onFinished: () => void }) {
    const { dictionary } = useLanguage();
    const { toast } = useToast();
    
    const formSchema = z.object({
        password: z.string().min(8),
        passwordConfirm: z.string().min(8),
    }).refine(data => data.password === data.passwordConfirm, {
        message: "Passwords don't match",
        path: ["passwordConfirm"],
    });
    
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { password: '', passwordConfirm: '' },
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        const formData = new FormData();
        formData.append('password', values.password);
        
        const result = await resetPassword(user.id, formData);
        
        if (result.success) {
            toast({ title: dictionary.users.toasts.passwordReset });
            onFinished();
        } else if (result.errors) {
            Object.entries(result.errors).forEach(([key, messages]) => {
                form.setError(key as any, { type: 'manual', message: (messages as string[]).join(', ') });
            });
        }
    };
    
    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{dictionary.users.dialogs.resetPasswordTitle}</DialogTitle>
                <DialogDescription>{dictionary.users.dialogs.resetPasswordDescription}</DialogDescription>
            </DialogHeader>
             <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField control={form.control} name="password" render={({ field }) => (
                        <FormItem><FormLabel>{dictionary.users.dialogs.newPassword}</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="passwordConfirm" render={({ field }) => (
                        <FormItem><FormLabel>{dictionary.users.dialogs.confirmNewPassword}</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="ghost">{dictionary.users.dialogs.cancel}</Button></DialogClose>
                        <Button type="submit" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {dictionary.users.dialogs.reset}
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    )
}

export function UsersClient({ users: initialUsers }: UsersClientProps) {
  const [users, setUsers] = React.useState(initialUsers);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<User | undefined>(undefined);
  const { dictionary } = useLanguage();
  const { toast } = useToast();

  const onDeactivate = async (userId: number) => {
    const result = await deactivateUser(userId);
    if(result.success) {
        toast({ title: dictionary.users.toasts.statusChanged });
        setUsers(users.filter(u => u.id !== userId));
    } else {
        toast({ title: dictionary.users.toasts.error, description: result.error, variant: 'destructive' });
    }
  }

  const columns: ColumnDef<User>[] = React.useMemo(() => [
    {
      accessorKey: 'lastName',
      header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>{dictionary.users.table.name}<ArrowUpDown className="ml-2 h-4 w-4" /></Button>,
      cell: ({ row }) => `${row.original.firstName} ${row.original.lastName}`,
    },
    { accessorKey: 'email', header: dictionary.users.table.email },
    { accessorKey: 'role', header: dictionary.users.table.role, cell: ({ row }) => <Badge variant="outline">{row.getValue('role')}</Badge> },
    { accessorKey: 'area', header: dictionary.users.table.area, cell: ({ row }) => <Badge variant="secondary">{row.getValue('area')}</Badge> },
    {
      id: 'actions',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <Dialog>
             <AlertDialog>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{dictionary.users.table.actions}</DropdownMenuLabel>
                        <DropdownMenuItem onSelect={() => { setSelectedUser(user); setIsFormOpen(true); }}>
                            <Edit className="mr-2 h-4 w-4" />{dictionary.templates.table.edit}
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => { setSelectedUser(user); setIsResetPasswordOpen(true); }}>
                            <KeyRound className="mr-2 h-4 w-4" />{dictionary.users.dialogs.resetPasswordTitle}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />{dictionary.users.dialogs.deactivate}
                            </DropdownMenuItem>
                        </AlertDialogTrigger>
                    </DropdownMenuContent>
                </DropdownMenu>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{dictionary.users.dialogs.deactivateTitle}</AlertDialogTitle>
                        <AlertDialogDescription>{dictionary.users.dialogs.deactivateDescription}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{dictionary.users.dialogs.cancel}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDeactivate(user.id)}>{dictionary.users.dialogs.deactivate}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          </Dialog>
        );
      },
    },
  ], [dictionary, onDeactivate]);

  const table = useReactTable({
    data: users,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">{dictionary.users.title}</h1>
          <p className="text-muted-foreground">{dictionary.users.description}</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
                <Button onClick={() => setSelectedUser(undefined)}>
                    <PlusCircle className="mr-2 h-4 w-4" />{dictionary.users.createUser}
                </Button>
            </DialogTrigger>
            <UserForm user={selectedUser} onFinished={() => { setIsFormOpen(false); location.reload(); }} />
        </Dialog>
      </div>
      <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
        {selectedUser && <ResetPasswordDialog user={selectedUser} onFinished={() => setIsResetPasswordOpen(false)} />}
      </Dialog>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <TableHead key={header.id}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map(row => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map(cell => (
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
