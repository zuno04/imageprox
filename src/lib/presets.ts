import type { Preset, PresetType, ProcessingOptions } from '@/types';

/**
 * Default processing options
 */
export const DEFAULT_OPTIONS: ProcessingOptions = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  outputFormat: 'original',
  compressionMode: 'lossy',
  keepExif: false,
  preset: 'custom',
};

/**
 * Preset configurations for quick image processing
 */
export const PRESETS: Record<PresetType, Preset> = {
  web: {
    id: 'web',
    name: 'presets.web',
    description: 'presets.webDesc',
    options: {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1920,
      outputFormat: 'image/webp',
      compressionMode: 'lossy',
      keepExif: false,
    },
  },
  email: {
    id: 'email',
    name: 'presets.email',
    description: 'presets.emailDesc',
    options: {
      maxSizeMB: 0.2,
      maxWidthOrHeight: 1024,
      outputFormat: 'image/jpeg',
      compressionMode: 'lossy',
      keepExif: false,
    },
  },
  'social-media': {
    id: 'social-media',
    name: 'presets.socialMedia',
    description: 'presets.socialMediaDesc',
    options: {
      maxSizeMB: 1,
      maxWidthOrHeight: 2048,
      outputFormat: 'image/jpeg',
      compressionMode: 'lossy',
      keepExif: false,
    },
  },
  thumbnail: {
    id: 'thumbnail',
    name: 'presets.thumbnail',
    description: 'presets.thumbnailDesc',
    options: {
      maxSizeMB: 0.05,
      maxWidthOrHeight: 300,
      outputFormat: 'image/jpeg',
      compressionMode: 'lossy',
      keepExif: false,
    },
  },
  print: {
    id: 'print',
    name: 'presets.print',
    description: 'presets.printDesc',
    options: {
      maxSizeMB: 10,
      maxWidthOrHeight: 4096,
      outputFormat: 'original',
      compressionMode: 'high',
      keepExif: true,
    },
  },
  custom: {
    id: 'custom',
    name: 'presets.custom',
    description: 'presets.customDesc',
    options: {},
  },
};

/**
 * Get preset options by ID
 */
export function getPresetOptions(presetId: PresetType): Partial<ProcessingOptions> {
  return PRESETS[presetId]?.options ?? {};
}

/**
 * Apply preset to current options
 */
export function applyPreset(
  currentOptions: ProcessingOptions,
  presetId: PresetType
): ProcessingOptions {
  const presetOptions = getPresetOptions(presetId);
  return {
    ...currentOptions,
    ...presetOptions,
    preset: presetId,
  };
}

/**
 * Get all available presets as an array
 */
export function getPresetsArray(): Preset[] {
  return Object.values(PRESETS);
}
