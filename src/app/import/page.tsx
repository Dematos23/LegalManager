'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud } from 'lucide-react';
import { useState } from 'react';

export default function ImportPage() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFileName(event.target.files[0].name);
    } else {
      setFileName(null);
    }
  };
  
  const handleImport = () => {
    if (!fileName) {
      toast({
        title: "No file selected",
        description: "Please select an Excel file to import.",
        variant: "destructive",
      });
      return;
    }
    setIsImporting(true);
    // Simulate import process
    setTimeout(() => {
      setIsImporting(false);
      toast({
        title: "Import Successful",
        description: `${fileName} has been imported.`,
      });
      setFileName(null);
    }, 2000);
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-headline text-primary">
          Import Trademarks
        </h1>
      </div>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Upload Excel File</CardTitle>
          <CardDescription>
            Import trademark data from an .xlsx file. Make sure the columns match
            the required format.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="relative flex flex-col items-center justify-center w-full p-10 border-2 border-dashed rounded-lg border-border hover:border-primary transition-colors">
            <UploadCloud className="w-16 h-16 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">
              {fileName ? 'File selected:' : 'Drag & drop your file here or click to browse'}
            </p>
            {fileName && <p className="mt-1 font-semibold text-primary">{fileName}</p>}
            <Input
              id="file-upload"
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              disabled={isImporting}
            />
          </div>
          <Button onClick={handleImport} disabled={!fileName || isImporting} className="w-full">
            {isImporting ? 'Importing...' : 'Import Data'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
