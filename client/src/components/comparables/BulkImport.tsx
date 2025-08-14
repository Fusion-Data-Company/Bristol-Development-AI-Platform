import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Upload, 
  FileText,
  Database 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BulkImportProps {
  onImportComplete?: () => void;
}

export function BulkImport({ onImportComplete }: BulkImportProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/comps-annex/import', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Import failed');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/comps-annex'] });
      toast({ 
        title: 'Import successful', 
        description: `Imported ${data.count || 0} records` 
      });
      setIsOpen(false);
      setSelectedFile(null);
      onImportComplete?.();
    },
    onError: () => {
      toast({ title: 'Import failed', variant: 'destructive' });
    },
  });

  const seedMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/comps-annex/seed', {
        method: 'POST',
      });
      
      if (!response.ok) throw new Error('Seed failed');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/comps-annex'] });
      toast({ 
        title: 'Sample data added', 
        description: `Added ${data.count || 0} sample records` 
      });
      setIsOpen(false);
      onImportComplete?.();
    },
    onError: () => {
      toast({ title: 'Seed failed', variant: 'destructive' });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleImport = () => {
    if (selectedFile) {
      importMutation.mutate(selectedFile);
    }
  };

  const handleSeed = () => {
    seedMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Import Data
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Comparables Data</DialogTitle>
          <DialogDescription>
            Upload a CSV file or populate with sample data to get started
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* CSV Upload */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <Label>Upload CSV File</Label>
            </div>
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              disabled={importMutation.isPending}
            />
            {selectedFile && (
              <div className="text-sm text-gray-600">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </div>
            )}
            <Button
              onClick={handleImport}
              disabled={!selectedFile || importMutation.isPending}
              className="w-full"
            >
              {importMutation.isPending ? 'Importing...' : 'Import CSV'}
            </Button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          {/* Sample Data */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <Label>Sample Data</Label>
            </div>
            <p className="text-sm text-gray-600">
              Add sample comparable properties to test the platform
            </p>
            <Button
              onClick={handleSeed}
              disabled={seedMutation.isPending}
              variant="secondary"
              className="w-full"
            >
              {seedMutation.isPending ? 'Adding Sample Data...' : 'Add Sample Data'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default BulkImport;