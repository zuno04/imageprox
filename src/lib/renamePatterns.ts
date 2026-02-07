import type { RenameToken, RenameConfig } from '@/types';

/**
 * Available rename tokens
 */
export const RENAME_TOKENS: RenameToken[] = [
  {
    token: '{name}',
    description: 'Original filename (without extension)',
    example: 'photo',
  },
  {
    token: '{index}',
    description: 'Sequential number',
    example: '001',
  },
  {
    token: '{date}',
    description: 'Current date (YYYY-MM-DD)',
    example: '2024-01-15',
  },
  {
    token: '{time}',
    description: 'Current time (HH-MM-SS)',
    example: '14-30-25',
  },
  {
    token: '{width}',
    description: 'Image width in pixels',
    example: '1920',
  },
  {
    token: '{height}',
    description: 'Image height in pixels',
    example: '1080',
  },
];

/**
 * Default rename configuration
 */
export const DEFAULT_RENAME_CONFIG: RenameConfig = {
  pattern: '{name}_{index}',
  startIndex: 1,
  preserveExtension: true,
};

/**
 * Get file extension
 */
export function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return '';
  return filename.slice(lastDot);
}

/**
 * Get filename without extension
 */
export function getBaseName(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return filename;
  return filename.slice(0, lastDot);
}

/**
 * Pad number with leading zeros
 */
export function padIndex(index: number, totalCount: number): string {
  const maxDigits = String(totalCount).length;
  return String(index).padStart(Math.max(3, maxDigits), '0');
}

/**
 * Format current date as YYYY-MM-DD
 */
export function formatDate(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Format current time as HH-MM-SS
 */
export function formatTime(): string {
  const now = new Date();
  return now.toTimeString().split(' ')[0].replace(/:/g, '-');
}

interface ImageInfo {
  width?: number;
  height?: number;
}

/**
 * Apply rename pattern to a single file
 */
export function applyRenamePattern(
  filename: string,
  config: RenameConfig,
  index: number,
  totalCount: number,
  imageInfo?: ImageInfo
): string {
  const baseName = getBaseName(filename);
  const extension = getExtension(filename);

  let result = config.pattern;

  // Replace tokens
  result = result.replace(/{name}/g, baseName);
  result = result.replace(/{index}/g, padIndex(config.startIndex + index, totalCount + config.startIndex - 1));
  result = result.replace(/{date}/g, formatDate());
  result = result.replace(/{time}/g, formatTime());
  result = result.replace(/{width}/g, String(imageInfo?.width || 0));
  result = result.replace(/{height}/g, String(imageInfo?.height || 0));

  // Add extension if configured
  if (config.preserveExtension && extension) {
    result += extension;
  }

  return result;
}

/**
 * Apply rename pattern to multiple files and return previews
 */
export function previewRenames(
  filenames: string[],
  config: RenameConfig,
  imageInfos?: ImageInfo[]
): { original: string; renamed: string }[] {
  return filenames.map((filename, index) => ({
    original: filename,
    renamed: applyRenamePattern(
      filename,
      config,
      index,
      filenames.length,
      imageInfos?.[index]
    ),
  }));
}
