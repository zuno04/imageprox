import React from 'react';
import { useTranslation } from 'react-i18next';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DropzoneOverlayProps {
  isActive: boolean;
  className?: string;
}

const DropzoneOverlay: React.FC<DropzoneOverlayProps> = ({
  isActive,
  className,
}) => {
  const { t } = useTranslation();

  if (!isActive) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        'bg-primary/10 backdrop-blur-sm',
        'border-4 border-dashed border-primary',
        'transition-all duration-200',
        className
      )}
    >
      <div className="flex flex-col items-center gap-4 p-8 bg-background/95 rounded-xl shadow-2xl">
        <div className="p-4 bg-primary/10 rounded-full">
          <Upload size={48} className="text-primary" />
        </div>
        <div className="text-center">
          <p className="text-xl font-semibold text-foreground">
            {t('dropzone.dragActive')}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {t('fileUpload.imageTypes')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DropzoneOverlay;
