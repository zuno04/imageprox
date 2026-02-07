import type { OutputFormat } from '@/types';

interface FormatRecommendation {
  format: OutputFormat;
  reason: string;
  confidence: number; // 0-1
}

/**
 * Analyze an image and recommend the best output format.
 * Uses canvas pixel analysis to detect transparency, color count, and content type.
 */
export async function recommendFormat(
  file: File
): Promise<FormatRecommendation> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        URL.revokeObjectURL(url);
        resolve({
          format: 'image/webp',
          reason: 'ai.formatReason',
          confidence: 0.5,
        });
        return;
      }

      // Sample at a manageable size for analysis
      const maxDim = 256;
      const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      URL.revokeObjectURL(url);

      // Analyze image properties
      const analysis = analyzePixels(data);

      // Make recommendation
      if (analysis.hasTransparency) {
        // PNG or WebP for transparency
        if (analysis.uniqueColors < 256) {
          resolve({
            format: 'image/png',
            reason: 'ai.graphic',
            confidence: 0.9,
          });
        } else {
          resolve({
            format: 'image/webp',
            reason: 'ai.graphic',
            confidence: 0.85,
          });
        }
      } else if (analysis.uniqueColors < 256 && analysis.isGraphic) {
        // Low color count, likely graphic/illustration
        resolve({
          format: 'image/png',
          reason: 'ai.graphic',
          confidence: 0.8,
        });
      } else if (analysis.isPhotographic) {
        // Photographic content
        if (supportsAvif()) {
          resolve({
            format: 'image/avif',
            reason: 'ai.photographic',
            confidence: 0.85,
          });
        } else {
          resolve({
            format: 'image/webp',
            reason: 'ai.photographic',
            confidence: 0.8,
          });
        }
      } else {
        // Default to WebP for good all-round compression
        resolve({
          format: 'image/webp',
          reason: 'ai.formatReason',
          confidence: 0.7,
        });
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({
        format: 'image/webp',
        reason: 'ai.formatReason',
        confidence: 0.5,
      });
    };

    img.src = url;
  });
}

interface PixelAnalysis {
  hasTransparency: boolean;
  uniqueColors: number;
  isPhotographic: boolean;
  isGraphic: boolean;
  avgComplexity: number;
}

function analyzePixels(data: Uint8ClampedArray): PixelAnalysis {
  let hasTransparency = false;
  const colorSet = new Set<string>();
  let totalDifference = 0;
  let sampleCount = 0;

  // Sample every 4th pixel for performance
  const step = 4;
  for (let i = 0; i < data.length; i += 4 * step) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    if (a < 255) {
      hasTransparency = true;
    }

    // Quantize colors to reduce unique count (group similar colors)
    const qr = Math.round(r / 16) * 16;
    const qg = Math.round(g / 16) * 16;
    const qb = Math.round(b / 16) * 16;
    colorSet.add(`${qr},${qg},${qb}`);

    // Calculate local complexity (difference from neighbors)
    if (i + 4 * step < data.length) {
      const nr = data[i + 4 * step];
      const ng = data[i + 4 * step + 1];
      const nb = data[i + 4 * step + 2];
      totalDifference += Math.abs(r - nr) + Math.abs(g - ng) + Math.abs(b - nb);
      sampleCount++;
    }
  }

  const avgComplexity = sampleCount > 0 ? totalDifference / sampleCount / 765 : 0;
  const uniqueColors = colorSet.size;

  // Photographic: many unique colors, moderate complexity
  const isPhotographic = uniqueColors > 500 && avgComplexity > 0.02;

  // Graphic: few unique colors, low complexity
  const isGraphic = uniqueColors < 100 || avgComplexity < 0.01;

  return {
    hasTransparency,
    uniqueColors,
    isPhotographic,
    isGraphic,
    avgComplexity,
  };
}

/**
 * Check AVIF support
 */
function supportsAvif(): boolean {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/avif').startsWith('data:image/avif');
}

/**
 * Get human-readable format name
 */
export function getFormatName(format: OutputFormat): string {
  switch (format) {
    case 'image/png':
      return 'PNG';
    case 'image/jpeg':
      return 'JPEG';
    case 'image/webp':
      return 'WebP';
    case 'image/avif':
      return 'AVIF';
    default:
      return 'Original';
  }
}
