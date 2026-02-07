import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { History, Trash2, RotateCcw, FileImage } from 'lucide-react';
import type { HistoryEntry, ProcessingOptions } from '@/types';
import { getHistoryEntries, clearHistory, formatTimestamp } from '@/lib/storage';
import { formatBytes } from '@/hooks/useStats';
import { cn } from '@/lib/utils';

interface ProcessingHistoryProps {
  onRestoreSettings?: (options: ProcessingOptions) => void;
  className?: string;
}

const ProcessingHistory: React.FC<ProcessingHistoryProps> = ({
  onRestoreSettings,
  className,
}) => {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadHistory = async () => {
    setIsLoading(true);
    const historyEntries = await getHistoryEntries();
    setEntries(historyEntries);
    setIsLoading(false);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleClearHistory = async () => {
    await clearHistory();
    setEntries([]);
  };

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className={cn('text-center p-8', className)}>
        <History size={48} className="mx-auto text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">{t('history.noHistory')}</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <History size={16} />
          {t('history.title')}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearHistory}
          className="text-destructive hover:text-destructive h-7 text-xs"
        >
          <Trash2 size={14} className="mr-1" />
          {t('history.clearHistory')}
        </Button>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-full">
                <FileImage size={16} className="text-muted-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {entry.filesCount} file{entry.filesCount > 1 ? 's' : ''}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatTimestamp(entry.timestamp)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Saved {formatBytes(entry.stats.sizeSaved)} (
                  {entry.stats.compressionRatio.toFixed(1)}%)
                </div>
              </div>
            </div>

            {onRestoreSettings && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRestoreSettings(entry.options)}
                className="h-7"
              >
                <RotateCcw size={14} className="mr-1" />
                {t('history.restore')}
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProcessingHistory;
