import React from 'react';
import { useTranslation } from 'react-i18next';
import { FileImage, TrendingDown, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsDashboardProps {
  filesProcessed: number;
  originalSize: string;
  processedSize: string;
  sizeSaved: string;
  compressionRatio: string;
  className?: string;
  compact?: boolean;
}

const StatsDashboard: React.FC<StatsDashboardProps> = ({
  filesProcessed,
  originalSize,
  processedSize,
  sizeSaved,
  compressionRatio,
  className,
  compact = false,
}) => {
  const { t } = useTranslation();

  const stats = [
    {
      icon: <FileImage size={compact ? 16 : 20} />,
      label: t('stats.filesProcessed'),
      value: filesProcessed.toString(),
      color: 'text-blue-500',
    },
    {
      icon: <TrendingDown size={compact ? 16 : 20} />,
      label: t('stats.totalSaved'),
      value: sizeSaved,
      color: 'text-green-500',
    },
    {
      icon: <BarChart3 size={compact ? 16 : 20} />,
      label: t('stats.avgCompression'),
      value: compressionRatio,
      color: 'text-purple-500',
    },
  ];

  if (compact) {
    return (
      <div className={cn('flex items-center gap-4 text-sm', className)}>
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-1.5">
            <span className={stat.color}>{stat.icon}</span>
            <span className="font-medium">{stat.value}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <h3 className="text-sm font-semibold text-muted-foreground">
        {t('stats.title')}
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-center p-3 rounded-lg bg-muted/30"
          >
            <div className={cn('mb-2', stat.color)}>{stat.icon}</div>
            <span className="text-xl font-bold">{stat.value}</span>
            <span className="text-xs text-muted-foreground text-center">
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      {/* Detailed stats */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex justify-between p-2 bg-muted/20 rounded">
          <span className="text-muted-foreground">{t('stats.originalSize')}</span>
          <span className="font-medium">{originalSize}</span>
        </div>
        <div className="flex justify-between p-2 bg-muted/20 rounded">
          <span className="text-muted-foreground">{t('stats.compressedSize')}</span>
          <span className="font-medium">{processedSize}</span>
        </div>
      </div>
    </div>
  );
};

export default StatsDashboard;
