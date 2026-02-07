interface QualityRecommendation {
  quality: number; // 0-100
  reason: string;
  maxSizeMB: number;
}

/**
 * Analyze image content and recommend optimal quality settings.
 * Uses heuristics based on image dimensions, file type, and pixel analysis.
 */
export async function recommendQuality(
  file: File
): Promise<QualityRecommendation> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        URL.revokeObjectURL(url);
        resolve({ quality: 80, reason: 'ai.qualityReason', maxSizeMB: 1 });
        return;
      }

      // Sample for analysis
      const maxDim = 128;
      const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      URL.revokeObjectURL(url);

      const analysis = analyzeContent(imageData.data);

      // High detail images need higher quality
      if (analysis.isHighDetail) {
        resolve({
          quality: 90,
          reason: 'ai.photographic',
          maxSizeMB: Math.min(file.size / (1024 * 1024) * 0.7, 5),
        });
      }
      // Simple graphics can use lower quality
      else if (analysis.isSimple) {
        resolve({
          quality: 75,
          reason: 'ai.graphic',
          maxSizeMB: Math.min(file.size / (1024 * 1024) * 0.3, 0.5),
        });
      }
      // Medium complexity
      else {
        resolve({
          quality: 82,
          reason: 'ai.qualityReason',
          maxSizeMB: Math.min(file.size / (1024 * 1024) * 0.5, 2),
        });
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ quality: 80, reason: 'ai.qualityReason', maxSizeMB: 1 });
    };

    img.src = url;
  });
}

interface ContentAnalysis {
  isHighDetail: boolean;
  isSimple: boolean;
  edgeDensity: number;
  colorVariance: number;
}

function analyzeContent(
  data: Uint8ClampedArray,
): ContentAnalysis {
  let edgeCount = 0;
  let totalPixels = 0;
  let sumR = 0, sumG = 0, sumB = 0;
  let sumSqR = 0, sumSqG = 0, sumSqB = 0;

  // Sample pixels
  const step = 4;

  for (let i = 0; i < data.length; i += 4 * step) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    sumR += r;
    sumG += g;
    sumB += b;
    sumSqR += r * r;
    sumSqG += g * g;
    sumSqB += b * b;
    totalPixels++;

    // Simple edge detection: check difference with next sampled pixel
    if (i + 4 * step < data.length) {
      const nr = data[i + 4 * step];
      const ng = data[i + 4 * step + 1];
      const nb = data[i + 4 * step + 2];
      const diff = Math.abs(r - nr) + Math.abs(g - ng) + Math.abs(b - nb);
      if (diff > 80) {
        edgeCount++;
      }
    }
  }

  const edgeDensity = totalPixels > 0 ? edgeCount / totalPixels : 0;

  // Calculate color variance
  const n = totalPixels || 1;
  const varR = sumSqR / n - (sumR / n) ** 2;
  const varG = sumSqG / n - (sumG / n) ** 2;
  const varB = sumSqB / n - (sumB / n) ** 2;
  const colorVariance = (varR + varG + varB) / 3;

  // High detail: many edges and high color variance
  const isHighDetail = edgeDensity > 0.3 && colorVariance > 2000;

  // Simple: few edges and low color variance
  const isSimple = edgeDensity < 0.1 && colorVariance < 500;

  return {
    isHighDetail,
    isSimple,
    edgeDensity,
    colorVariance,
  };
}
