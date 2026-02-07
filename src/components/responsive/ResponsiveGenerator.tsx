import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Download, Copy, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ResponsiveSize } from '@/types';

interface ResponsiveGeneratorProps {
  imageSrc: string;
  imageName: string;
  onDownload: (images: { name: string; data: string }[]) => void;
}

const DEFAULT_SIZES: ResponsiveSize[] = [
  { name: 'sm', width: 640, suffix: '-640w' },
  { name: 'md', width: 1024, suffix: '-1024w' },
  { name: 'lg', width: 1920, suffix: '-1920w' },
  { name: 'xl', width: 3840, suffix: '-3840w' },
];

const ResponsiveGenerator: React.FC<ResponsiveGeneratorProps> = ({
  imageSrc,
  imageName,
  onDownload,
}) => {
  const { t } = useTranslation();
  const [selectedSizes, setSelectedSizes] = useState<Set<string>>(
    new Set(DEFAULT_SIZES.map((s) => s.name))
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedImages, setGeneratedImages] = useState<
    { name: string; data: string; width: number }[]
  >([]);
  const [copied, setCopied] = useState(false);

  const toggleSize = (sizeName: string) => {
    setSelectedSizes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sizeName)) {
        newSet.delete(sizeName);
      } else {
        newSet.add(sizeName);
      }
      return newSet;
    });
  };

  const resizeImage = useCallback(
    async (width: number): Promise<string> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
          // Only resize if image is larger than target
          if (img.width <= width) {
            resolve(imageSrc);
            return;
          }

          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          // Calculate height to maintain aspect ratio
          const ratio = width / img.width;
          const height = Math.round(img.height * ratio);

          canvas.width = width;
          canvas.height = height;

          // Use better quality scaling
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };

        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };

        img.src = imageSrc;
      });
    },
    [imageSrc]
  );

  const generateResponsiveImages = async () => {
    const sizesToGenerate = DEFAULT_SIZES.filter((s) =>
      selectedSizes.has(s.name)
    );

    if (sizesToGenerate.length === 0) return;

    setIsGenerating(true);
    setProgress(0);
    setGeneratedImages([]);

    const results: { name: string; data: string; width: number }[] = [];
    const baseName = imageName.replace(/\.[^/.]+$/, '');

    for (let i = 0; i < sizesToGenerate.length; i++) {
      const size = sizesToGenerate[i];
      try {
        const resized = await resizeImage(size.width);
        results.push({
          name: `${baseName}${size.suffix}.jpg`,
          data: resized,
          width: size.width,
        });
        setProgress(((i + 1) / sizesToGenerate.length) * 100);
      } catch (error) {
        console.error(`Error generating ${size.name}:`, error);
      }
    }

    setGeneratedImages(results);
    setIsGenerating(false);
  };

  const handleDownloadAll = () => {
    onDownload(
      generatedImages.map((img) => ({
        name: img.name,
        data: img.data,
      }))
    );
  };

  const generateSrcset = (): string => {
    const baseName = imageName.replace(/\.[^/.]+$/, '');
    return generatedImages
      .map((img) => `${baseName}${DEFAULT_SIZES.find((s) => img.width === s.width)?.suffix}.jpg ${img.width}w`)
      .join(',\n  ');
  };

  const copySrcset = async () => {
    const srcset = generateSrcset();
    const html = `<img
  src="${imageName}"
  srcset="
  ${srcset}
  "
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  alt=""
/>`;

    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      toast.success(t('toast.copySuccess'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('toast.copyError'));
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">{t('responsive.title')}</h3>

      {/* Size selection */}
      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">
          {t('responsive.sizes')}
        </label>
        <div className="flex flex-wrap gap-3">
          {DEFAULT_SIZES.map((size) => (
            <label
              key={size.name}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Checkbox
                checked={selectedSizes.has(size.name)}
                onCheckedChange={() => toggleSize(size.name)}
              />
              <span className="text-sm">
                {size.width}px ({size.name})
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Generate button */}
      <Button
        onClick={generateResponsiveImages}
        disabled={isGenerating || selectedSizes.size === 0}
        className="w-full"
      >
        {isGenerating ? (
          <>
            <Loader2 size={16} className="mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          t('responsive.generate')
        )}
      </Button>

      {/* Progress */}
      {isGenerating && (
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            {Math.round(progress)}%
          </p>
        </div>
      )}

      {/* Generated images preview */}
      {generatedImages.length > 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2">
            {generatedImages.map((img) => (
              <div
                key={img.name}
                className="aspect-video bg-muted rounded overflow-hidden"
              >
                <img
                  src={img.data}
                  alt={img.name}
                  className="w-full h-full object-cover"
                />
                <p className="text-xs text-center mt-1 truncate" title={img.name}>
                  {img.width}w
                </p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={handleDownloadAll} className="flex-1">
              <Download size={16} className="mr-2" />
              {t('responsive.downloadAll')}
            </Button>
            <Button variant="outline" onClick={copySrcset}>
              {copied ? (
                <Check size={16} className="mr-2" />
              ) : (
                <Copy size={16} className="mr-2" />
              )}
              srcset
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            {t('responsive.srcsetHint')}
          </p>
        </div>
      )}
    </div>
  );
};

export default ResponsiveGenerator;
