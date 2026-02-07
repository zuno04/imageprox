import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowRight, Check } from 'lucide-react';
import {
  RENAME_TOKENS,
  DEFAULT_RENAME_CONFIG,
  previewRenames,
} from '@/lib/renamePatterns';
import type { RenameConfig } from '@/types';

interface BulkRenamerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filenames: string[];
  onApply: (renamedFiles: { original: string; renamed: string }[]) => void;
}

const BulkRenamer: React.FC<BulkRenamerProps> = ({
  open,
  onOpenChange,
  filenames,
  onApply,
}) => {
  const { t } = useTranslation();
  const [config, setConfig] = useState<RenameConfig>(DEFAULT_RENAME_CONFIG);

  const previews = useMemo(() => {
    return previewRenames(filenames, config);
  }, [filenames, config]);

  const handleApply = () => {
    onApply(previews);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('rename.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Pattern input */}
          <div className="space-y-2">
            <Label htmlFor="pattern">{t('rename.pattern')}</Label>
            <Input
              id="pattern"
              value={config.pattern}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, pattern: e.target.value }))
              }
              placeholder="{name}_{index}"
            />
          </div>

          {/* Available tokens */}
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs">
              {t('rename.tokens')}
            </Label>
            <div className="flex flex-wrap gap-1">
              {RENAME_TOKENS.map((token) => (
                <button
                  key={token.token}
                  onClick={() =>
                    setConfig((prev) => ({
                      ...prev,
                      pattern: prev.pattern + token.token,
                    }))
                  }
                  className="px-2 py-1 text-xs bg-muted rounded hover:bg-muted/80 font-mono"
                  title={`${token.description} (e.g., ${token.example})`}
                >
                  {token.token}
                </button>
              ))}
            </div>
          </div>

          {/* Start index */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="startIndex">{t('rename.startIndex')}</Label>
              <Input
                id="startIndex"
                type="number"
                min={0}
                value={config.startIndex}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    startIndex: parseInt(e.target.value) || 1,
                  }))
                }
                className="w-20"
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="preserveExt"
                checked={config.preserveExtension}
                onCheckedChange={(checked) =>
                  setConfig((prev) => ({
                    ...prev,
                    preserveExtension: checked === true,
                  }))
                }
              />
              <Label htmlFor="preserveExt" className="text-sm">
                Preserve extension
              </Label>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">{t('rename.preview')}</Label>
            <div className="max-h-48 overflow-y-auto border rounded-md">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="text-left p-2">Original</th>
                    <th className="w-8"></th>
                    <th className="text-left p-2">New Name</th>
                  </tr>
                </thead>
                <tbody>
                  {previews.slice(0, 10).map((preview, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-2 truncate max-w-[150px]" title={preview.original}>
                        {preview.original}
                      </td>
                      <td className="text-center text-muted-foreground">
                        <ArrowRight size={14} />
                      </td>
                      <td className="p-2 truncate max-w-[150px] font-medium" title={preview.renamed}>
                        {preview.renamed}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filenames.length > 10 && (
                <div className="p-2 text-center text-xs text-muted-foreground border-t">
                  ... and {filenames.length - 10} more files
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply}>
            <Check size={16} className="mr-1" />
            {t('rename.apply')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkRenamer;
