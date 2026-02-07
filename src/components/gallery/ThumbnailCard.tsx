import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, XCircle, Download, FileImage } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThumbnailCardProps {
  id: string;
  name: string;
  size: number;
  thumbnail?: string;
  isSelected: boolean;
  onSelect: (id: string, event: React.MouseEvent) => void;
  onPreview: () => void;
  onRemove: () => void;
  onDownload?: () => void;
  downloadUrl?: string;
  showCheckbox?: boolean;
  status?: 'pending' | 'processing' | 'completed' | 'error';
  progress?: number;
}

const ThumbnailCard: React.FC<ThumbnailCardProps> = ({
  id,
  name,
  size,
  thumbnail,
  isSelected,
  onSelect,
  onPreview,
  onRemove,
  onDownload,
  downloadUrl,
  showCheckbox = true,
  status,
  progress,
}) => {
  const { t } = useTranslation();
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    setImageLoaded(false);
  }, [thumbnail]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div
      className={cn(
        'relative group rounded-lg border bg-card overflow-hidden transition-all duration-200',
        isSelected && 'ring-2 ring-primary border-primary',
        'hover:shadow-md'
      )}
      onClick={(e) => onSelect(id, e)}
    >
      {/* Thumbnail area */}
      <div className="relative aspect-square bg-muted/30 flex items-center justify-center overflow-hidden">
        {thumbnail ? (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <FileImage className="w-8 h-8 text-muted-foreground animate-pulse" />
              </div>
            )}
            <img
              src={thumbnail}
              alt={name}
              className={cn(
                'w-full h-full object-cover transition-opacity duration-200',
                imageLoaded ? 'opacity-100' : 'opacity-0'
              )}
              onLoad={() => setImageLoaded(true)}
              draggable={false}
            />
          </>
        ) : (
          <FileImage className="w-12 h-12 text-muted-foreground" />
        )}

        {/* Processing overlay */}
        {status === 'processing' && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              {progress !== undefined && (
                <span className="text-xs font-medium">{progress}%</span>
              )}
            </div>
          </div>
        )}

        {/* Checkbox */}
        {showCheckbox && (
          <div
            className={cn(
              'absolute top-2 left-2 transition-opacity duration-200',
              isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onSelect(id, {} as React.MouseEvent)}
              className="bg-background/80 border-2"
            />
          </div>
        )}

        {/* Action buttons */}
        <div
          className={cn(
            'absolute top-2 right-2 flex gap-1 transition-opacity duration-200',
            'opacity-0 group-hover:opacity-100'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="secondary"
            size="icon"
            className="h-7 w-7 bg-background/80 backdrop-blur-sm"
            onClick={onPreview}
            title={t('fileUpload.previewTitle', { fileName: name })}
          >
            <Eye size={14} />
          </Button>
          {downloadUrl ? (
            <Button
              variant="secondary"
              size="icon"
              className="h-7 w-7 bg-background/80 backdrop-blur-sm"
              asChild
            >
              <a href={downloadUrl} download={name} title={t('downloadResults.downloadTitle', { fileName: name })}>
                <Download size={14} />
              </a>
            </Button>
          ) : onDownload ? (
            <Button
              variant="secondary"
              size="icon"
              className="h-7 w-7 bg-background/80 backdrop-blur-sm"
              onClick={onDownload}
              title={t('downloadResults.downloadTitle', { fileName: name })}
            >
              <Download size={14} />
            </Button>
          ) : null}
          <Button
            variant="secondary"
            size="icon"
            className="h-7 w-7 bg-background/80 backdrop-blur-sm text-destructive hover:text-destructive"
            onClick={onRemove}
            title={t('fileUpload.removeTitle', { fileName: name })}
          >
            <XCircle size={14} />
          </Button>
        </div>

        {/* Status badge */}
        {status === 'completed' && (
          <div className="absolute bottom-2 right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
            {t('progress.completed', { count: 1 }).split(' ')[0]}
          </div>
        )}
        {status === 'error' && (
          <div className="absolute bottom-2 right-2 bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">
            {t('progress.error')}
          </div>
        )}
      </div>

      {/* File info */}
      <div className="p-2">
        <p className="text-sm font-medium truncate" title={name}>
          {name}
        </p>
        <p className="text-xs text-muted-foreground">{formatSize(size)}</p>
      </div>
    </div>
  );
};

export default ThumbnailCard;
