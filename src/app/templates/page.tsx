
'use client';

import { getEmailTemplates, deleteEmailTemplate } from './actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, MoreHorizontal, Trash2, Edit, Send } from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useLanguage } from '@/context/language-context';
import { useState, useEffect } from 'react';
import type { EmailTemplate } from '@prisma/client';
import { Separator } from '@/components/ui/separator';

export default function TemplatesPage() {
  const { dictionary } = useLanguage();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      const data = await getEmailTemplates();
      setTemplates(data);
      if (data.length > 0) {
        setSelectedTemplate(data[0]);
      }
      setLoading(false);
    };
    fetchTemplates();
  }, []);

  const handleDelete = async (id: number) => {
    const result = await deleteEmailTemplate(id);
    if(result.success) {
      const newTemplates = templates.filter(t => t.id !== id);
      setTemplates(newTemplates);
      if (selectedTemplate?.id === id) {
          setSelectedTemplate(newTemplates.length > 0 ? newTemplates[0] : null);
      }
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          {dictionary.templates.title}
        </h1>
        <Link href="/templates/new">
          <Button>
            <PlusCircle className="mr-2" />
            {dictionary.templates.createButton}
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
            <CardHeader>
            <CardTitle>{dictionary.templates.cardTitle}</CardTitle>
            <CardDescription>
                {dictionary.templates.cardDescription}
            </CardDescription>
            </CardHeader>
            <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>{dictionary.templates.table.name}</TableHead>
                    <TableHead className="text-right">{dictionary.templates.table.actions}</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {loading ? (
                    <TableRow>
                    <TableCell colSpan={2} className="h-24 text-center">
                        Loading...
                    </TableCell>
                    </TableRow>
                ) : templates.length === 0 ? (
                    <TableRow>
                    <TableCell colSpan={2} className="h-24 text-center">
                        {dictionary.templates.table.noTemplates}
                    </TableCell>
                    </TableRow>
                ) : (
                    templates.map((template) => (
                    <TableRow 
                        key={template.id} 
                        onClick={() => setSelectedTemplate(template)}
                        data-state={selectedTemplate?.id === template.id ? 'selected' : ''}
                        className="cursor-pointer"
                    >
                        <TableCell className="font-medium">{template.name}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/templates/${template.id}/send`} passHref>
                              <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                                  <Send className="mr-2 h-4 w-4" />
                                  {dictionary.templates.table.send}
                              </Button>
                            </Link>
                            <AlertDialog>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                    <Link href={`/templates/edit/${template.id}`}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        {dictionary.templates.table.edit}
                                    </Link>
                                    </DropdownMenuItem>
                                    <AlertDialogTrigger asChild>
                                      <DropdownMenuItem onSelect={(e) => {e.preventDefault(); e.stopPropagation();}}>
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          {dictionary.templates.table.delete}
                                      </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>{dictionary.templates.deleteDialog.title}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                    {dictionary.templates.deleteDialog.description}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>{dictionary.templates.deleteDialog.cancel}</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(template.id)}>{dictionary.templates.deleteDialog.continue}</AlertDialogAction>
                                  </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                    </TableRow>
                    ))
                )}
                </TableBody>
            </Table>
            </CardContent>
        </Card>

        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>{dictionary.templates.previewTitle}</CardTitle>
            </CardHeader>
            <CardContent>
                {selectedTemplate ? (
                    <div className="space-y-4">
                         <div>
                            <p className="text-sm text-muted-foreground">{dictionary.templates.table.subject}</p>
                            <p className="font-semibold">{selectedTemplate.subject}</p>
                        </div>
                        <Separator />
                        <div 
                            className="w-full overflow-x-auto rounded-md border p-4 min-h-[400px] bg-white text-black"
                            dangerouslySetInnerHTML={{ __html: selectedTemplate.body }}
                        />
                    </div>
                ) : !loading && (
                    <div className="flex items-center justify-center min-h-[400px] text-muted-foreground rounded-md border border-dashed">
                        <p>{dictionary.templates.selectPreview}</p>
                    </div>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
