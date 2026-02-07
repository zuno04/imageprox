import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Link, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface UrlImporterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (file: File) => void;
}

const UrlImporter: React.FC<UrlImporterProps> = ({
  open,
  onOpenChange,
  onImport,
}) => {
  const { t } = useTranslation();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractFilename = (urlString: string): string => {
    try {
      const urlObj = new URL(urlString);
      const pathname = urlObj.pathname;
      const filename = pathname.split('/').pop() || 'image';
      // Ensure it has an extension
      if (!filename.includes('.')) {
        return `${filename}.jpg`;
      }
      return filename;
    } catch {
      return 'image.jpg';
    }
  };

  const handleImport = async () => {
    if (!url.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // Try to fetch the image
      const response = await fetch(url, {
        mode: 'cors',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.startsWith('image/')) {
        throw new Error('URL does not point to an image');
      }

      const blob = await response.blob();
      const filename = extractFilename(url);
      const file = new File([blob], filename, { type: blob.type });

      onImport(file);
      toast.success(t('toast.importSuccess', { count: 1 }));
      onOpenChange(false);
      setUrl('');
    } catch (err) {
      console.error('Error importing image:', err);
      setError(t('urlImport.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading && url.trim()) {
      handleImport();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link size={20} />
            {t('urlImport.title')}
          </DialogTitle>
          <DialogDescription>{t('urlImport.corsWarning')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="url">{t('urlImport.placeholder')}</Label>
            <Input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="https://example.com/image.jpg"
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={isLoading || !url.trim()}>
            {isLoading ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              t('urlImport.import')
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UrlImporter;
