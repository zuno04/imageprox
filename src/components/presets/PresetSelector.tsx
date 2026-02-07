import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Globe,
  Mail,
  Share2,
  Image,
  Printer,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PresetType } from '@/types';

interface PresetSelectorProps {
  selectedPreset: PresetType;
  onSelectPreset: (preset: PresetType) => void;
  className?: string;
  compact?: boolean;
}

const presetIcons: Record<PresetType, React.ReactNode> = {
  web: <Globe size={16} />,
  email: <Mail size={16} />,
  'social-media': <Share2 size={16} />,
  thumbnail: <Image size={16} />,
  print: <Printer size={16} />,
  custom: <Settings size={16} />,
};

const PresetSelector: React.FC<PresetSelectorProps> = ({
  selectedPreset,
  onSelectPreset,
  className,
  compact = false,
}) => {
  const { t } = useTranslation();

  const presets: { id: PresetType; name: string; description: string }[] = [
    { id: 'web', name: t('presets.web'), description: t('presets.webDesc') },
    { id: 'email', name: t('presets.email'), description: t('presets.emailDesc') },
    { id: 'social-media', name: t('presets.socialMedia'), description: t('presets.socialMediaDesc') },
    { id: 'thumbnail', name: t('presets.thumbnail'), description: t('presets.thumbnailDesc') },
    { id: 'print', name: t('presets.print'), description: t('presets.printDesc') },
    { id: 'custom', name: t('presets.custom'), description: t('presets.customDesc') },
  ];

  if (compact) {
    return (
      <div className={cn('flex flex-wrap gap-2', className)}>
        {presets.map((preset) => (
          <Button
            key={preset.id}
            variant={selectedPreset === preset.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSelectPreset(preset.id)}
            className="gap-1"
            title={preset.description}
          >
            {presetIcons[preset.id]}
            {preset.name}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      <h3 className="text-sm font-medium">{t('presets.title')}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {presets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onSelectPreset(preset.id)}
            className={cn(
              'flex flex-col items-center gap-1 p-3 rounded-lg border transition-all',
              'hover:border-primary/50 hover:bg-muted/50',
              selectedPreset === preset.id
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-border'
            )}
          >
            <div
              className={cn(
                'p-2 rounded-full',
                selectedPreset === preset.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {presetIcons[preset.id]}
            </div>
            <span className="text-sm font-medium">{preset.name}</span>
            <span className="text-xs text-muted-foreground text-center line-clamp-2">
              {preset.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PresetSelector;
