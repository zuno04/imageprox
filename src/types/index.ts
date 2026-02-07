// Shared types for ImageProx

/**
 * Represents a converted image with name and base64 data
 */
export interface ConvertedImage {
  image_name: string;
  image_data: string; // Base64 data URL
}

/**
 * Represents a file being processed with metadata
 */
export interface ImageFile {
  id: string;
  file: File;
  thumbnail?: string; // Base64 thumbnail for preview
  status: ProcessingStatus;
  progress: number; // 0-100
  error?: string;
  originalSize: number;
  processedSize?: number;
}

/**
 * Processing status for individual images
 */
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'error';

/**
 * Image processing options
 */
export interface ProcessingOptions {
  maxSizeMB: number;
  maxWidthOrHeight: number;
  outputFormat: OutputFormat;
  compressionMode: CompressionMode;
  keepExif: boolean;
  preset?: PresetType;
}

/**
 * Output format options
 */
export type OutputFormat = 'original' | 'image/png' | 'image/jpeg' | 'image/webp' | 'image/avif';

/**
 * Compression mode options
 */
export type CompressionMode = 'lossy' | 'high';

/**
 * Preset types for quick configuration
 */
export type PresetType =
  | 'web'
  | 'email'
  | 'social-media'
  | 'thumbnail'
  | 'print'
  | 'custom';

/**
 * Preset configuration
 */
export interface Preset {
  id: PresetType;
  name: string;
  description: string;
  options: Partial<ProcessingOptions>;
}

/**
 * Image object for modal preview
 */
export interface ImageObject {
  src: string;
  alt: string;
  title: string;
}

/**
 * Edit callback payload
 */
export interface EditPayload {
  newSrc: string;
  originalIndex: number;
}

/**
 * Session statistics
 */
export interface SessionStats {
  filesProcessed: number;
  totalOriginalSize: number;
  totalProcessedSize: number;
  compressionRatio: number;
  sizeSaved: number;
}

/**
 * Processing history entry
 */
export interface HistoryEntry {
  id: string;
  timestamp: number;
  filesCount: number;
  options: ProcessingOptions;
  stats: SessionStats;
}

/**
 * Keyboard shortcut definition
 */
export interface KeyboardShortcut {
  key: string;
  modifiers?: ('ctrl' | 'shift' | 'alt' | 'meta')[];
  description: string;
  action: string;
}

/**
 * Responsive image size preset
 */
export interface ResponsiveSize {
  name: string;
  width: number;
  suffix: string;
}

/**
 * Rename pattern tokens
 */
export interface RenameToken {
  token: string;
  description: string;
  example: string;
}

/**
 * Bulk rename configuration
 */
export interface RenameConfig {
  pattern: string;
  startIndex: number;
  preserveExtension: boolean;
}

/**
 * Image filter settings
 */
export interface FilterSettings {
  brightness: number; // -100 to 100
  contrast: number; // -100 to 100
  saturation: number; // -100 to 100
  sharpness: number; // 0 to 100
  blur: number; // 0 to 100
}

/**
 * Crop aspect ratio preset
 */
export interface AspectRatioPreset {
  name: string;
  ratio: number | undefined; // undefined for freeform
}

/**
 * View mode for gallery
 */
export type ViewMode = 'list' | 'grid';

/**
 * Selection state for multi-select
 */
export interface SelectionState {
  selectedIds: Set<string>;
  lastSelectedId: string | null;
}
