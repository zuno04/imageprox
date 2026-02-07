import React from 'react';
import { useTranslation } from 'react-i18next';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import type { FilterSettings } from '@/types';
import { DEFAULT_FILTER_SETTINGS } from '@/lib/imageFilters';

interface AdjustmentSlidersProps {
  filters: FilterSettings;
  onChange: (filters: FilterSettings) => void;
  onReset: () => void;
}

interface SliderConfig {
  key: keyof FilterSettings;
  label: string;
  min: number;
  max: number;
  step: number;
}

const AdjustmentSliders: React.FC<AdjustmentSlidersProps> = ({
  filters,
  onChange,
  onReset,
}) => {
  const { t } = useTranslation();

  const sliders: SliderConfig[] = [
    { key: 'brightness', label: t('editor.brightness'), min: -100, max: 100, step: 1 },
    { key: 'contrast', label: t('editor.contrast'), min: -100, max: 100, step: 1 },
    { key: 'saturation', label: t('editor.saturation'), min: -100, max: 100, step: 1 },
    { key: 'sharpness', label: t('editor.sharpness'), min: 0, max: 100, step: 1 },
    { key: 'blur', label: t('editor.blur'), min: 0, max: 100, step: 1 },
  ];

  const handleSliderChange = (key: keyof FilterSettings, value: number[]) => {
    onChange({
      ...filters,
      [key]: value[0],
    });
  };

  const isModified = Object.keys(filters).some(
    (key) => filters[key as keyof FilterSettings] !== DEFAULT_FILTER_SETTINGS[key as keyof FilterSettings]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{t('editor.title')}</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          disabled={!isModified}
          className="h-7 text-xs"
        >
          <RotateCcw size={14} className="mr-1" />
          {t('editor.reset')}
        </Button>
      </div>

      <div className="space-y-4">
        {sliders.map((slider) => (
          <div key={slider.key} className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-muted-foreground">
                {slider.label}
              </label>
              <span className="text-sm font-medium w-12 text-right">
                {filters[slider.key]}
              </span>
            </div>
            <Slider
              value={[filters[slider.key]]}
              min={slider.min}
              max={slider.max}
              step={slider.step}
              onValueChange={(value) => handleSliderChange(slider.key, value)}
              className="w-full"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdjustmentSliders;
