import { useState, useCallback, useMemo } from 'react';
import type { SessionStats, ConvertedImage } from '@/types';

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Hook for tracking session statistics
 */
export function useStats() {
  const [stats, setStats] = useState<SessionStats>({
    filesProcessed: 0,
    totalOriginalSize: 0,
    totalProcessedSize: 0,
    compressionRatio: 0,
    sizeSaved: 0,
  });

  const updateStats = useCallback(
    (originalFiles: File[], convertedImages: ConvertedImage[]) => {
      const totalOriginalSize = originalFiles.reduce(
        (acc, file) => acc + file.size,
        0
      );

      // Estimate processed size from base64 data
      // Base64 is ~33% larger than binary, so divide by 1.37 to approximate
      const totalProcessedSize = convertedImages.reduce((acc, img) => {
        // Remove data URL prefix and calculate approximate binary size
        const base64 = img.image_data.split(',')[1] || '';
        return acc + Math.ceil((base64.length * 3) / 4);
      }, 0);

      const sizeSaved = Math.max(0, totalOriginalSize - totalProcessedSize);
      const compressionRatio =
        totalOriginalSize > 0
          ? ((totalOriginalSize - totalProcessedSize) / totalOriginalSize) * 100
          : 0;

      setStats({
        filesProcessed: convertedImages.length,
        totalOriginalSize,
        totalProcessedSize,
        compressionRatio: Math.max(0, compressionRatio),
        sizeSaved,
      });
    },
    []
  );

  const resetStats = useCallback(() => {
    setStats({
      filesProcessed: 0,
      totalOriginalSize: 0,
      totalProcessedSize: 0,
      compressionRatio: 0,
      sizeSaved: 0,
    });
  }, []);

  const formattedStats = useMemo(
    () => ({
      filesProcessed: stats.filesProcessed,
      originalSize: formatBytes(stats.totalOriginalSize),
      processedSize: formatBytes(stats.totalProcessedSize),
      sizeSaved: formatBytes(stats.sizeSaved),
      compressionRatio: `${stats.compressionRatio.toFixed(1)}%`,
    }),
    [stats]
  );

  return {
    stats,
    formattedStats,
    updateStats,
    resetStats,
  };
}

export default useStats;
