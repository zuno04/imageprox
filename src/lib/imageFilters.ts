import type { FilterSettings } from '@/types';

/**
 * Default filter settings
 */
export const DEFAULT_FILTER_SETTINGS: FilterSettings = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  sharpness: 0,
  blur: 0,
};

/**
 * Apply filters to an image using canvas
 */
export async function applyFilters(
  imageSrc: string,
  filters: FilterSettings
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;

      // Apply CSS filters
      const filterString = buildFilterString(filters);
      ctx.filter = filterString;

      // Draw the image with filters
      ctx.drawImage(img, 0, 0);

      // Apply sharpness (using convolution kernel)
      if (filters.sharpness > 0) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const sharpenedData = applySharpen(imageData, filters.sharpness / 100);
        ctx.putImageData(sharpenedData, 0, 0);
      }

      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = imageSrc;
  });
}

/**
 * Build CSS filter string from settings
 */
function buildFilterString(filters: FilterSettings): string {
  const parts: string[] = [];

  // Brightness: CSS uses 1 as default, we use 0 as default
  // Range: -100 to 100 maps to 0 to 2
  if (filters.brightness !== 0) {
    const value = 1 + filters.brightness / 100;
    parts.push(`brightness(${value})`);
  }

  // Contrast: CSS uses 1 as default
  // Range: -100 to 100 maps to 0 to 2
  if (filters.contrast !== 0) {
    const value = 1 + filters.contrast / 100;
    parts.push(`contrast(${value})`);
  }

  // Saturation: CSS uses 1 as default
  // Range: -100 to 100 maps to 0 to 2
  if (filters.saturation !== 0) {
    const value = 1 + filters.saturation / 100;
    parts.push(`saturate(${value})`);
  }

  // Blur: Range 0 to 100 maps to 0 to 10px
  if (filters.blur > 0) {
    const value = (filters.blur / 100) * 10;
    parts.push(`blur(${value}px)`);
  }

  return parts.length > 0 ? parts.join(' ') : 'none';
}

/**
 * Apply sharpening using convolution
 */
function applySharpen(imageData: ImageData, amount: number): ImageData {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;

  // Create a copy for the output
  const output = new Uint8ClampedArray(data);

  // Sharpening kernel
  const kernel = [
    0, -amount, 0,
    -amount, 1 + 4 * amount, -amount,
    0, -amount, 0,
  ];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4 + c;
            const kernelIdx = (ky + 1) * 3 + (kx + 1);
            sum += data[idx] * kernel[kernelIdx];
          }
        }
        const idx = (y * width + x) * 4 + c;
        output[idx] = Math.min(255, Math.max(0, sum));
      }
    }
  }

  return new ImageData(output, width, height);
}

/**
 * Rotate image by 90 degrees clockwise
 */
export async function rotateImage(imageSrc: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Swap dimensions for 90-degree rotation
      canvas.width = img.height;
      canvas.height = img.width;

      // Rotate
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((90 * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = imageSrc;
  });
}

/**
 * Flip image horizontally
 */
export async function flipHorizontal(imageSrc: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;

      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0);

      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = imageSrc;
  });
}

/**
 * Flip image vertically
 */
export async function flipVertical(imageSrc: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;

      ctx.translate(0, canvas.height);
      ctx.scale(1, -1);
      ctx.drawImage(img, 0, 0);

      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = imageSrc;
  });
}

/**
 * Convert image to grayscale
 */
export async function toGrayscale(imageSrc: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;

      ctx.filter = 'grayscale(100%)';
      ctx.drawImage(img, 0, 0);

      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = imageSrc;
  });
}
