
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, FileSpreadsheet, Loader2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import * as XLSX from 'xlsx';
import { importDataAction } from './actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useLanguage } from '@/context/language-context';

const MAPPABLE_FIELD_GROUPS = [
  {
    label: 'Agent',
    fields: [
      { value: 'agent.name', label: 'Name' },
      { value: 'agent.country', label: 'Country' },
    ]
  },
  {
    label: 'Contact',
    fields: [
      { value: 'contact.firstName', label: 'First Name' },
      { value: 'contact.lastName', label: 'Last Name' },
      { value: 'contact.email', label: 'Email' },
    ]
  },
  {
    label: 'Owner',
    fields: [
      { value: 'owner.name', label: 'Name' },
      { value: 'owner.country', label: 'Country' },
    ]
  },
  {
    label: 'Trademark',
    fields: [
      { value: 'trademark.denomination', label: 'Denomination' },
      { value: 'trademark.class', label: 'Class (1-45)' },
      { value: 'trademark.type', label: 'Type (WORD, FIGURATIVE, MIXED)' },
      { value: 'trademark.certificate', label: 'Certificate' },
      { value: 'trademark.expiration', label: 'Expiration Date (YYYY-MM-DD)' },
      { value: 'trademark.products', label: 'Products' },
    ]
  }
];

// For auto-mapping logic, we create the flat array with full labels
const MAPPABLE_FIELDS = MAPPABLE_FIELD_GROUPS.flatMap(group =>
  group.fields.map(field => ({
    value: field.value,
    label: `${group.label}: ${field.label}`
  }))
);


export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [isImporting, startImportTransition] = useTransition();
  const [importResult, setImportResult] = useState<{ message: string; errorDetails?: any[] } | null>(null);

  const { toast } = useToast();
  const { dictionary } = useLanguage();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsParsing(true);
    setHeaders([]);
    setMappings({});
    setImportResult(null);

    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false });
      
      if (Array.isArray(jsonData[0])) {
        const fileHeaders = (jsonData[0] as string[]).filter(h => h);
        setHeaders(fileHeaders);
        const initialMappings: Record<string, string> = {};
        fileHeaders.forEach(header => {
            // Match 'model_field' from Excel to 'model.field' in our app
            // e.g., "trademark_denomination" in Excel maps to "trademark.denomination"
            const modelFieldEquivalent = header.replace('_', '.');
            const foundField = MAPPABLE_FIELDS.find(field => field.value === modelFieldEquivalent);
            
            if (foundField) {
                initialMappings[header] = foundField.value;
            }
        });
        setMappings(initialMappings);
      }
    } catch (error) {
      console.error("File parsing error:", error);
      toast({
        title: "Error parsing file",
        description: "Could not read headers from the Excel file. Please ensure it is a valid .xlsx file.",
        variant: "destructive",
      });
      setFile(null);
    } finally {
      setIsParsing(false);
    }
  };
  
  const handleMappingChange = (header: string, value: string) => {
    setMappings(prev => ({ ...prev, [header]: value }));
  };

  const handleImport = () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select an Excel file to import.",
        variant: "destructive",
      });
      return;
    }
    
    setImportResult(null);
    startImportTransition(async () => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mappings', JSON.stringify(mappings));

      const result = await importDataAction(formData);

      if (result.error) {
        toast({
          title: "Import Failed",
          description: result.error,
          variant: "destructive",
        });
      } else {
        setImportResult(result);
        toast({
          title: "Import Processing Complete",
          description: result.message,
        });
      }
    });
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-headline text-primary">
          {dictionary.import.title}
        </h1>
      </div>
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>{dictionary.import.uploadTitle}</CardTitle>
          <CardDescription>
            {dictionary.import.uploadDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="relative flex flex-col items-center justify-center w-full p-10 border-2 border-dashed rounded-lg border-border hover:border-primary transition-colors">
            {file ? (
                <>
                    <FileSpreadsheet className="w-16 h-16 text-primary" />
                    <p className="mt-4 font-semibold text-primary">{file.name}</p>
                </>
            ) : (
                <>
                    <UploadCloud className="w-16 h-16 text-muted-foreground" />
                    <p className="mt-4 text-sm text-muted-foreground">
                        {dictionary.import.fileDrop}
                    </p>
                </>
            )}
            <Input
              id="file-upload"
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              disabled={isParsing || isImporting}
            />
          </div>

          {isParsing && <p className="text-center">{dictionary.import.parsingFile}</p>}

          {headers.length > 0 && (
            <div className="space-y-4">
               <CardHeader className="p-0">
                <CardTitle>{dictionary.import.mapTitle}</CardTitle>
                <CardDescription>
                  {dictionary.import.mapDescription}
                </CardDescription>
              </CardHeader>
              <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-1/2">{dictionary.import.fileColumn}</TableHead>
                            <TableHead className="w-1/2">{dictionary.import.dbField}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {headers.map(header => (
                            <TableRow key={header}>
                                <TableCell className="font-medium">{header}</TableCell>
                                <TableCell>
                                    <Select 
                                        value={mappings[header] || ''} 
                                        onValueChange={(value) => handleMappingChange(header, value)}
                                        disabled={isImporting}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a field..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ignore">{dictionary.import.ignoreOption}</SelectItem>
                                            {MAPPABLE_FIELD_GROUPS.map(group => (
                                                <SelectGroup key={group.label}>
                                                    <SelectLabel>{group.label}</SelectLabel>
                                                    {group.fields.map(field => (
                                                        <SelectItem key={field.value} value={field.value}>{field.label}</SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
              </Card>
            </div>
          )}
          
          <div className="pt-4">
            <CardHeader className="p-0">
              <CardTitle>{dictionary.import.importTitle}</CardTitle>
              <CardDescription>
                {dictionary.import.importDescription}
              </CardDescription>
            </CardHeader>
            <Button onClick={handleImport} disabled={!file || headers.length === 0 || isParsing || isImporting} className="w-full mt-4">
              {isImporting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {dictionary.import.importingButton}</> : dictionary.import.importButton}
            </Button>
          </div>
          {importResult && (
            <Alert variant={importResult.errorDetails ? "destructive" : "default"}>
                <AlertTitle>{dictionary.import.importResultTitle}</AlertTitle>
                <AlertDescription>
                   {importResult.message}
                   {importResult.errorDetails && (
                       <pre className="mt-2 w-full overflow-x-auto rounded-md bg-slate-950 p-4 max-h-60">
                           <code className="text-white">{JSON.stringify(importResult.errorDetails, null, 2)}</code>
                       </pre>
                   )}
                </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
