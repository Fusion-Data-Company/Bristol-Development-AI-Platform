import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BulkImportProps {
  onImportComplete: () => void;
}

export default function BulkImport({ onImportComplete }: BulkImportProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/comps-annex/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const result = await response.json();
      
      toast({
        title: "Import Successful",
        description: `Imported ${result.count || 0} records`,
      });

      onImportComplete();
      setIsOpen(false);
      setFile(null);
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Unable to import file. Please check format and try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Import
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bulk Import Comparables</DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file to import multiple comparable properties
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Select File</label>
            <Input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="mt-1"
            />
          </div>
          {file && (
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
              <FileSpreadsheet className="h-4 w-4" />
              <span className="text-sm">{file.name}</span>
            </div>
          )}
          <Button 
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="w-full"
          >
            {isUploading ? 'Uploading...' : 'Upload and Import'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}