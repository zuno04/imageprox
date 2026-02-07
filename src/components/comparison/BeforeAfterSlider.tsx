import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ReactCompareSlider,
  ReactCompareSliderImage,
  ReactCompareSliderHandle,
} from 'react-compare-slider';
import { cn } from '@/lib/utils';

interface BeforeAfterSliderProps {
  beforeSrc: string;
  afterSrc: string;
  beforeLabel?: string;
  afterLabel?: string;
  beforeSize?: number;
  afterSize?: number;
  className?: string;
}

const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforeSrc,
  afterSrc,
  beforeLabel,
  afterLabel,
  beforeSize,
  afterSize,
  className,
}) => {
  const { t } = useTranslation();

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getSavingsPercent = () => {
    if (beforeSize && afterSize && beforeSize > 0) {
      const savings = ((beforeSize - afterSize) / beforeSize) * 100;
      return savings > 0 ? savings.toFixed(1) : null;
    }
    return null;
  };

  const savings = getSavingsPercent();

  return (
    <div className={cn('relative rounded-lg overflow-hidden', className)}>
      <ReactCompareSlider
        itemOne={
          <ReactCompareSliderImage
            src={beforeSrc}
            alt={beforeLabel || t('comparison.before')}
            style={{ objectFit: 'contain' }}
          />
        }
        itemTwo={
          <ReactCompareSliderImage
            src={afterSrc}
            alt={afterLabel || t('comparison.after')}
            style={{ objectFit: 'contain' }}
          />
        }
        handle={
          <ReactCompareSliderHandle
            buttonStyle={{
              backdropFilter: 'blur(4px)',
              background: 'rgba(255, 255, 255, 0.8)',
              border: '2px solid white',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
            }}
            linesStyle={{
              width: 2,
              background: 'white',
              boxShadow: '0 0 4px rgba(0, 0, 0, 0.3)',
            }}
          />
        }
        className="h-full"
      />

      {/* Labels */}
      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-md text-sm font-medium">
        <div>{beforeLabel || t('comparison.before')}</div>
        {beforeSize && (
          <div className="text-xs text-gray-300">{formatSize(beforeSize)}</div>
        )}
      </div>

      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-md text-sm font-medium">
        <div>{afterLabel || t('comparison.after')}</div>
        {afterSize && (
          <div className="text-xs text-gray-300">{formatSize(afterSize)}</div>
        )}
      </div>

      {/* Savings badge */}
      {savings && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-1.5 rounded-full text-sm font-semibold shadow-lg">
          {t('downloadResults.sizeSaved', { percent: savings })}
        </div>
      )}
    </div>
  );
};

export default BeforeAfterSlider;
