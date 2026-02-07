import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { recommendFormat, getFormatName } from '@/lib/formatRecommender';
import type { OutputFormat } from '@/types';
import { cn } from '@/lib/utils';

interface FormatSuggestionProps {
  files: File[];
  currentFormat: OutputFormat;
  onApply: (format: OutputFormat) => void;
  className?: string;
}

const FormatSuggestion: React.FC<FormatSuggestionProps> = ({
  files,
  currentFormat,
  onApply,
  className,
}) => {
  const { t } = useTranslation();
  const [suggestion, setSuggestion] = useState<{
    format: OutputFormat;
    reason: string;
    confidence: number;
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
        // Analyze the first file as representative
        const result = await recommendFormat(files[0]);
        if (!cancelled) {
          setSuggestion(result);
        }
      } catch {
        // Silently fail - suggestions are optional
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

  // Don't show if no suggestion or suggestion matches current format
  if (!suggestion || suggestion.format === currentFormat || isAnalyzing) {
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
        <span className="text-muted-foreground">{t('ai.formatSuggestion')}: </span>
        <span className="font-medium">{getFormatName(suggestion.format)}</span>
        <span className="text-xs text-muted-foreground ml-1">
          ({t(suggestion.reason)})
        </span>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs"
        onClick={() => onApply(suggestion.format)}
      >
        Apply
      </Button>
    </div>
  );
};

export default FormatSuggestion;
