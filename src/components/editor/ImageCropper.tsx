import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Check, X } from 'lucide-react';
import type { AspectRatioPreset } from '@/types';

interface ImageCropperProps {
  imageSrc: string;
  onCrop: (croppedImageUrl: string) => void;
  onCancel: () => void;
}

const aspectRatioPresets: AspectRatioPreset[] = [
  { name: 'cropper.freeform', ratio: undefined },
  { name: 'cropper.square', ratio: 1 },
  { name: 'cropper.landscape', ratio: 16 / 9 },
  { name: 'cropper.portrait', ratio: 9 / 16 },
  { name: 'cropper.photo', ratio: 4 / 3 },
  { name: 'cropper.classic', ratio: 3 / 2 },
];

const ImageCropper: React.FC<ImageCropperProps> = ({
  imageSrc,
  onCrop,
  onCancel,
}) => {
  const { t } = useTranslation();
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [selectedAspect, setSelectedAspect] = useState<string>('cropper.freeform');
  const imageRef = React.useRef<HTMLImageElement>(null);

  const currentAspect = aspectRatioPresets.find(p => p.name === selectedAspect)?.ratio;

  const handleAspectChange = (aspectName: string) => {
    setSelectedAspect(aspectName);
    const preset = aspectRatioPresets.find(p => p.name === aspectName);

    if (imageRef.current && preset?.ratio) {
      const { width, height } = imageRef.current;
      const imageAspect = width / height;

      let cropWidth: number;
      let cropHeight: number;

      if (preset.ratio > imageAspect) {
        cropWidth = 100;
        cropHeight = (100 * imageAspect) / preset.ratio;
      } else {
        cropHeight = 100;
        cropWidth = (100 * preset.ratio) / imageAspect;
      }

      setCrop({
        unit: '%',
        x: (100 - cropWidth) / 2,
        y: (100 - cropHeight) / 2,
        width: cropWidth,
        height: cropHeight,
      });
    }
  };

  const getCroppedImage = useCallback((): string | null => {
    if (!completedCrop || !imageRef.current) return null;

    const image = imageRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    // Calculate the scale factors
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Set canvas dimensions to the cropped size
    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    return canvas.toDataURL('image/png');
  }, [completedCrop]);

  const handleApply = () => {
    const croppedUrl = getCroppedImage();
    if (croppedUrl) {
      onCrop(croppedUrl);
    }
  };

  return (
    <div className="space-y-4">
      {/* Aspect ratio selector */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">{t('cropper.aspectRatio')}</label>
        <Select value={selectedAspect} onValueChange={handleAspectChange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {aspectRatioPresets.map((preset) => (
              <SelectItem key={preset.name} value={preset.name}>
                {t(preset.name)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Crop area */}
      <div className="flex justify-center bg-muted/30 rounded-lg p-4 max-h-[60vh] overflow-auto">
        <ReactCrop
          crop={crop}
          onChange={(c) => setCrop(c)}
          onComplete={(c) => setCompletedCrop(c)}
          aspect={currentAspect}
          className="max-w-full"
        >
          <img
            ref={imageRef}
            src={imageSrc}
            alt="Crop preview"
            className="max-h-[50vh] w-auto"
            crossOrigin="anonymous"
          />
        </ReactCrop>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          <X size={16} className="mr-1" />
          {t('editor.cancel')}
        </Button>
        <Button onClick={handleApply} disabled={!completedCrop}>
          <Check size={16} className="mr-1" />
          {t('editor.apply')}
        </Button>
      </div>
    </div>
  );
};

export default ImageCropper;
