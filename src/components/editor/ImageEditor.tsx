import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Crop,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Sliders,
  Check,
  X,
  Undo2,
} from 'lucide-react';
import ImageCropper from './ImageCropper';
import AdjustmentSliders from './AdjustmentSliders';
import type { FilterSettings } from '@/types';
import {
  DEFAULT_FILTER_SETTINGS,
  applyFilters,
  rotateImage,
  flipHorizontal,
  flipVertical,
} from '@/lib/imageFilters';
import { useDebouncedCallback } from '@/hooks/useDebounce';

interface ImageEditorProps {
  imageSrc: string;
  onApply: (editedImageUrl: string) => void;
  onCancel: () => void;
}

const ImageEditor: React.FC<ImageEditorProps> = ({
  imageSrc,
  onApply,
  onCancel,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('adjust');
  const [currentImage, setCurrentImage] = useState(imageSrc);
  const [previewImage, setPreviewImage] = useState(imageSrc);
  const [filters, setFilters] = useState<FilterSettings>(DEFAULT_FILTER_SETTINGS);
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<string[]>([imageSrc]);

  // Apply filters with debounce for live preview
  const applyFiltersDebounced = useDebouncedCallback(
    async (src: string, filterSettings: FilterSettings) => {
      try {
        const result = await applyFilters(src, filterSettings);
        setPreviewImage(result);
      } catch (error) {
        console.error('Error applying filters:', error);
      }
    },
    150
  );

  useEffect(() => {
    applyFiltersDebounced(currentImage, filters);
  }, [filters, currentImage, applyFiltersDebounced]);

  const addToHistory = useCallback((newImage: string) => {
    setHistory((prev) => [...prev, newImage]);
    setCurrentImage(newImage);
    setPreviewImage(newImage);
    setFilters(DEFAULT_FILTER_SETTINGS);
  }, []);

  const handleUndo = useCallback(() => {
    if (history.length > 1) {
      const newHistory = history.slice(0, -1);
      setHistory(newHistory);
      setCurrentImage(newHistory[newHistory.length - 1]);
      setPreviewImage(newHistory[newHistory.length - 1]);
      setFilters(DEFAULT_FILTER_SETTINGS);
    }
  }, [history]);

  const handleRotate = async () => {
    setIsProcessing(true);
    try {
      // Apply current filters first, then rotate
      const withFilters = await applyFilters(currentImage, filters);
      const rotated = await rotateImage(withFilters);
      addToHistory(rotated);
    } catch (error) {
      console.error('Error rotating image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFlipH = async () => {
    setIsProcessing(true);
    try {
      const withFilters = await applyFilters(currentImage, filters);
      const flipped = await flipHorizontal(withFilters);
      addToHistory(flipped);
    } catch (error) {
      console.error('Error flipping image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFlipV = async () => {
    setIsProcessing(true);
    try {
      const withFilters = await applyFilters(currentImage, filters);
      const flipped = await flipVertical(withFilters);
      addToHistory(flipped);
    } catch (error) {
      console.error('Error flipping image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCrop = (croppedUrl: string) => {
    addToHistory(croppedUrl);
    setActiveTab('adjust');
  };

  const handleApply = async () => {
    setIsProcessing(true);
    try {
      // Apply final filters
      const result = await applyFilters(currentImage, filters);
      onApply(result);
    } catch (error) {
      console.error('Error applying edits:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTER_SETTINGS);
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="adjust" className="gap-1">
              <Sliders size={14} />
              Adjust
            </TabsTrigger>
            <TabsTrigger value="crop" className="gap-1">
              <Crop size={14} />
              {t('editor.crop')}
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleUndo}
              disabled={history.length <= 1 || isProcessing}
              title="Undo"
            >
              <Undo2 size={18} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRotate}
              disabled={isProcessing}
              title={t('editor.rotate')}
            >
              <RotateCw size={18} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleFlipH}
              disabled={isProcessing}
              title="Flip Horizontal"
            >
              <FlipHorizontal size={18} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleFlipV}
              disabled={isProcessing}
              title="Flip Vertical"
            >
              <FlipVertical size={18} />
            </Button>
          </div>
        </div>

        <TabsContent value="adjust" className="space-y-4">
          <div className="flex gap-6">
            {/* Preview */}
            <div className="flex-1 flex items-center justify-center bg-muted/30 rounded-lg p-4 min-h-[300px]">
              {isProcessing ? (
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <img
                  src={previewImage}
                  alt="Preview"
                  className="max-w-full max-h-[50vh] object-contain"
                />
              )}
            </div>

            {/* Sliders */}
            <div className="w-64 flex-shrink-0">
              <AdjustmentSliders
                filters={filters}
                onChange={setFilters}
                onReset={handleResetFilters}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel}>
              <X size={16} className="mr-1" />
              {t('editor.cancel')}
            </Button>
            <Button onClick={handleApply} disabled={isProcessing}>
              <Check size={16} className="mr-1" />
              {t('editor.apply')}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="crop">
          <ImageCropper
            imageSrc={currentImage}
            onCrop={handleCrop}
            onCancel={() => setActiveTab('adjust')}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ImageEditor;
