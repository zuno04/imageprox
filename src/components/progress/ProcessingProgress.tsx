import React from 'react';
import { useTranslation } from 'react-i18next';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, Loader2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProcessingStatus } from '@/types';

interface FileProgress {
  id: string;
  name: string;
  status: ProcessingStatus;
  progress: number;
  error?: string;
}

interface ProcessingProgressProps {
  files: FileProgress[];
  className?: string;
}

const ProcessingProgress: React.FC<ProcessingProgressProps> = ({
  files,
  className,
}) => {
  const { t } = useTranslation();

  const completedCount = files.filter((f) => f.status === 'completed').length;
  const errorCount = files.filter((f) => f.status === 'error').length;
  const processingFile = files.find((f) => f.status === 'processing');
  const overallProgress =
    files.length > 0
      ? Math.round((completedCount / files.length) * 100)
      : 0;

  const getStatusIcon = (status: ProcessingStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'error':
        return <XCircle size={16} className="text-destructive" />;
      case 'processing':
        return <Loader2 size={16} className="text-primary animate-spin" />;
      default:
        return <Clock size={16} className="text-muted-foreground" />;
    }
  };

  const getStatusText = (file: FileProgress) => {
    switch (file.status) {
      case 'completed':
        return t('progress.completed', { count: 1 });
      case 'error':
        return file.error || t('progress.error');
      case 'processing':
        return `${file.progress}%`;
      default:
        return t('progress.pending');
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Overall progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            {processingFile
              ? t('progress.processing', {
                  current: completedCount + 1,
                  total: files.length,
                })
              : completedCount === files.length
              ? t('progress.completed', { count: completedCount })
              : t('progress.pending')}
          </span>
          <span className="text-muted-foreground">{overallProgress}%</span>
        </div>
        <Progress value={overallProgress} className="h-2" />
      </div>

      {/* Summary stats */}
      <div className="flex items-center gap-4 text-sm">
        {completedCount > 0 && (
          <div className="flex items-center gap-1 text-green-500">
            <CheckCircle size={14} />
            <span>{completedCount}</span>
          </div>
        )}
        {errorCount > 0 && (
          <div className="flex items-center gap-1 text-destructive">
            <XCircle size={14} />
            <span>{errorCount}</span>
          </div>
        )}
        {files.length - completedCount - errorCount > 0 && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock size={14} />
            <span>{files.length - completedCount - errorCount}</span>
          </div>
        )}
      </div>

      {/* Individual file progress */}
      <div className="max-h-48 overflow-y-auto space-y-2">
        {files.map((file) => (
          <div
            key={file.id}
            className={cn(
              'flex items-center gap-3 p-2 rounded-md text-sm',
              file.status === 'processing' && 'bg-primary/5',
              file.status === 'error' && 'bg-destructive/5'
            )}
          >
            {getStatusIcon(file.status)}
            <span className="flex-1 truncate" title={file.name}>
              {file.name}
            </span>
            <span
              className={cn(
                'text-xs',
                file.status === 'error'
                  ? 'text-destructive'
                  : 'text-muted-foreground'
              )}
            >
              {getStatusText(file)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProcessingProgress;
