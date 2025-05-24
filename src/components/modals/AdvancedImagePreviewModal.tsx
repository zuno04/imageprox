// src/components/modals/AdvancedImagePreviewModal.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ZoomIn, ZoomOut, RotateCw, RotateCcw, Download as DownloadIcon, ChevronLeft, ChevronRight, Palette, Save } from 'lucide-react'; // Added Save
import { Button } from '@/components/ui/button';
import { saveToLocalStorage, loadFromLocalStorage } from '@/lib/utils';

export interface ImageObject { // Exporting for use in parent components
  src: string; // Can be data URL or placeholder for dynamic loading
  alt: string;
  title: string;
}

interface AdvancedImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: ImageObject[]; // Array of all images
  currentIndex: number; 
  onNavigate: (newIndex: number) => void; 
  imageOverrideSrc?: string; 
  onApplyEdit?: (editedImage: { newSrc: string; originalIndex: number }) => void; // New prop
}

const AdvancedImagePreviewModal: React.FC<AdvancedImagePreviewModalProps> = ({
  isOpen,
  onClose,
  images,
  currentIndex,
  onNavigate,
  imageOverrideSrc,
  onApplyEdit, // Destructure new prop
}) => {
  const LOCAL_STORAGE_ZOOM_KEY = 'advancedPreviewZoom';
  const initialZoom = loadFromLocalStorage<number>(LOCAL_STORAGE_ZOOM_KEY) || 1;

  const [zoom, setZoom] = useState(initialZoom);
  const [rotation, setRotation] = useState(0); // View-only rotation
  const [editedImageData, setEditedImageData] = useState<string | null>(null); // For canvas edited image
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const currentImage = images[currentIndex];
  // Prioritize editedImageData, then imageOverrideSrc, then original src
  const displaySrc = editedImageData || imageOverrideSrc || currentImage?.src;

  const updateZoom = useCallback((newZoom: number) => {
    const clampedZoom = Math.max(0.5, Math.min(newZoom, 3));
    setZoom(clampedZoom);
    saveToLocalStorage<number>(LOCAL_STORAGE_ZOOM_KEY, clampedZoom);
  }, []);

  const handleZoomIn = useCallback(() => updateZoom(zoom + 0.25), [zoom, updateZoom]);
  const handleZoomOut = useCallback(() => updateZoom(zoom - 0.25), [zoom, updateZoom]);
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const resetTransformations = useCallback((resetEditedData = true) => {
    setZoom(initialZoom); 
    setRotation(0);
    if (resetEditedData) {
      setEditedImageData(null);
    }
  }, [initialZoom]);

  const handleNext = useCallback(() => {
    if (currentIndex < images.length - 1) {
      onNavigate(currentIndex + 1);
      resetTransformations(true); // Pass true to reset editedImageData
    }
  }, [currentIndex, images.length, onNavigate, resetTransformations]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      onNavigate(currentIndex - 1);
      resetTransformations(true); // Pass true to reset editedImageData
    }
  }, [currentIndex, onNavigate, resetTransformations]);

  const handleDownload = useCallback(() => {
    const sourceToDownload = editedImageData || displaySrc; // Prioritize edited image for download
    if (sourceToDownload && currentImage) {
      const link = document.createElement('a');
      link.href = sourceToDownload;
      link.download = currentImage.title || 'image';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [editedImageData, displaySrc, currentImage]);
  
  const handleEditRotate = useCallback(async () => {
    const imageToRotate = editedImageData || imageOverrideSrc || images[currentIndex]?.src;
    if (!imageToRotate) return;

    const imageElement = new Image();
    imageElement.crossOrigin = "anonymous"; // Handle CORS if image is from another domain
    imageElement.src = imageToRotate;

    imageElement.onload = () => {
      const canvas = document.createElement('canvas');
      // When rotating 90 degrees, width becomes height and vice-versa
      canvas.width = imageElement.height;
      canvas.height = imageElement.width;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Translate to center of canvas and rotate
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((90 * Math.PI) / 180); // 90 degrees clockwise

      // Draw the image, adjusting for the new origin
      ctx.drawImage(imageElement, -imageElement.width / 2, -imageElement.height / 2);
      
      // Get new data URL
      const newDataUrl = canvas.toDataURL('image/png'); // Or 'image/jpeg'
      setEditedImageData(newDataUrl);
      setRotation(0); // Reset view rotation as the image itself is now rotated
    };
    imageElement.onerror = (error) => {
      console.error("Error loading image for canvas rotation:", error);
    };
  }, [editedImageData, imageOverrideSrc, images, currentIndex]);

  const handleEditGrayscale = useCallback(async () => {
    const imageToGrayscale = editedImageData || imageOverrideSrc || images[currentIndex]?.src;
    if (!imageToGrayscale) return;

    const imageElement = new Image();
    imageElement.crossOrigin = "anonymous";
    imageElement.src = imageToGrayscale;

    imageElement.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = imageElement.width;
      canvas.height = imageElement.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(imageElement, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = avg; // red
        data[i + 1] = avg; // green
        data[i + 2] = avg; // blue
      }
      ctx.putImageData(imageData, 0, 0);
      
      const newDataUrl = canvas.toDataURL('image/png');
      setEditedImageData(newDataUrl);
      // View-only rotation should remain, zoom also
    };
    imageElement.onerror = (error) => {
      console.error("Error loading image for canvas grayscale:", error);
    };
  }, [editedImageData, imageOverrideSrc, images, currentIndex]);


  useEffect(() => {
    if (isOpen) {
      resetTransformations(true); // Reset when modal opens or currentIndex changes, including edited data
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, currentIndex, resetTransformations]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, handleNext, handlePrev]);

  // Effect for mouse wheel zoom
  useEffect(() => {
    const container = imageContainerRef.current;
    if (!isOpen || !container || !currentImage) return;

    const handleWheelZoom = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        updateZoom(zoom + 0.25); // Use updateZoom
      } else if (e.deltaY > 0) {
        updateZoom(zoom - 0.25); // Use updateZoom
      }
    };

    container.addEventListener('wheel', handleWheelZoom);
    return () => {
      container.removeEventListener('wheel', handleWheelZoom);
    };
  }, [isOpen, currentImage, zoom, updateZoom]); // Added zoom and updateZoom to dependencies


  if (!isOpen || !currentImage) {
    return null;
  }

  const modalContent = (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-0 transition-opacity duration-300 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      aria-labelledby="image-preview-title"
      role="dialog"
      aria-modal="true"
    >
      <div className={`absolute inset-0 bg-black/90 transition-opacity duration-300 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />

      {/* Navigation Buttons - Placed outside the main content box for edge placement */}
      {images.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 text-white hover:bg-white/20 h-10 w-10 sm:h-12 sm:w-12" // Larger buttons
            title="Previous (Left Arrow)"
          >
            <ChevronLeft size={30} /> {/* Larger icon */}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
            disabled={currentIndex === images.length - 1}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 text-white hover:bg-white/20 h-10 w-10 sm:h-12 sm:w-12"
            title="Next (Right Arrow)"
          >
            <ChevronRight size={30} />
          </Button>
        </>
      )}

      <div className={`relative z-10 w-full h-full flex flex-col text-white p-2 sm:p-4 transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
        <div className="flex items-center justify-between p-3 sm:p-4 bg-black/60 backdrop-blur-sm rounded-t-lg">
          <div className="flex-1 min-w-0">
            <h2 id="image-preview-title" className="text-base sm:text-lg font-semibold truncate" title={currentImage.title}>
              {currentImage.title}
            </h2>
            {images.length > 1 && (
              <p className="text-xs sm:text-sm text-gray-300">{`${currentIndex + 1} of ${images.length}`}</p>
            )}
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0"> {/* Prevent controls from shrinking */}
            <Button variant="ghost" size="icon" onClick={handleZoomOut} disabled={zoom <= 0.5} title="Zoom Out"> <ZoomOut size={20} /> </Button>
            <Button variant="ghost" size="icon" onClick={handleZoomIn} disabled={zoom >= 3} title="Zoom In"> <ZoomIn size={20} /> </Button>
            <Button variant="ghost" size="icon" onClick={handleRotate} title="Rotate View"> <RotateCw size={20} /> </Button>
            <Button variant="ghost" size="icon" onClick={handleEditRotate} title="Rotate Edit (90° CW)"> <RotateCcw size={20} /> </Button>
            <Button variant="ghost" size="icon" onClick={handleEditGrayscale} title="Grayscale"> <Palette size={20} /> </Button>
            {onApplyEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (editedImageData) {
                    onApplyEdit({ newSrc: editedImageData, originalIndex: currentIndex });
                    setEditedImageData(null); // Clear edit after applying
                  }
                }}
                disabled={!editedImageData}
                title="Apply Edits to List"
              >
                <Save size={20} />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={handleDownload} title="Download" disabled={!displaySrc}> <DownloadIcon size={20} /> </Button>
            <Button variant="ghost" size="icon" onClick={onClose} title="Close (Esc)"> <X size={24} /> </Button>
          </div>
        </div>

        <div ref={imageContainerRef} className="flex-1 flex items-center justify-center overflow-hidden p-2 sm:p-4"> {/* Added ref */}
          {displaySrc ? (
            <img
              src={displaySrc}
              alt={currentImage.alt}
              className="max-w-full max-h-full object-contain transition-transform duration-200 ease-in-out select-none"
              style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
              draggable="false"
            />
          ) : (
            <div className="text-gray-400">Loading image...</div> // Fallback if src is not ready
          )}
        </div>

        <div className="p-2 text-center bg-black/60 backdrop-blur-sm rounded-b-lg text-xs text-gray-300">
            Use Esc, Left/Right Arrows. Mouse wheel to zoom. Zoom & Rotate controls available. {/* Updated hint */}
        </div>
      </div>
    </div>
  );

  // Ensure modalRoot is not null before calling createPortal
  const modalRootElement = document.getElementById('modal-root');
  if (!modalRootElement) {
    // This case should ideally not happen if index.html is set up correctly
    // Or, you could dynamically create and append modal-root here as a fallback
    console.error("Modal root element #modal-root not found in the DOM.");
    return null; // Or render the modal directly without portal as a fallback
  }

  return createPortal(modalContent, modalRootElement);
};

export default AdvancedImagePreviewModal;
