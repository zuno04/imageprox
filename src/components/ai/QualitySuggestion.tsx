import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { recommendQuality } from '@/lib/qualityAnalyzer';
import { cn } from '@/lib/utils';

interface QualitySuggestionProps {
  files: File[];
  currentMaxSizeMB: number;
  onApply: (maxSizeMB: number) => void;
  className?: string;
}

const QualitySuggestion: React.FC<QualitySuggestionProps> = ({
  files,
  currentMaxSizeMB,
  onApply,
  className,
}) => {
  const { t } = useTranslation();
  const [suggestion, setSuggestion] = useState<{
    maxSizeMB: number;
    reason: string;
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (files.length === 0) {
      setSuggestion(null);
      return;
    }

    let cancelled = false;

    const analyze = async () => {
      setIsAnalyzing(true);
      try {
        const result = await recommendQuality(files[0]);
        if (!cancelled) {
          setSuggestion({
            maxSizeMB: Math.round(result.maxSizeMB * 10) / 10,
            reason: result.reason,
          });
        }
      } catch {
        // Silently fail
      } finally {
        if (!cancelled) {
          setIsAnalyzing(false);
        }
      }
    };

    analyze();

    return () => {
      cancelled = true;
    };
  }, [files]);

  // Don't show if no suggestion or same value
  if (
    !suggestion ||
    Math.abs(suggestion.maxSizeMB - currentMaxSizeMB) < 0.1 ||
    isAnalyzing
  ) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 p-2 bg-primary/5 border border-primary/20 rounded-lg text-sm',
        className
      )}
    >
      <Sparkles size={16} className="text-primary flex-shrink-0" />
      <div className="flex-1">
        <span className="text-muted-foreground">
          {t('ai.qualitySuggestion')}:{' '}
        </span>
        <span className="font-medium">{suggestion.maxSizeMB} MB</span>
        <span className="text-xs text-muted-foreground ml-1">
          ({t(suggestion.reason)})
        </span>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs"
        onClick={() => onApply(suggestion.maxSizeMB)}
      >
        Apply
      </Button>
    </div>
  );
};

export default QualitySuggestion;
