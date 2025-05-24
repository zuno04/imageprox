import React, { useState } from "react";
import imageCompression from "browser-image-compression";

// Shadcn UI components & icons
import { Button } from "@/components/ui/button"; 
import { Loader2 } from "lucide-react"; 
import { Input } from "@/components/ui/input"; 
import { Label } from "@/components/ui/label"; 
import { saveToLocalStorage, loadFromLocalStorage } from '@/lib/utils'; // Import localStorage utils
// import loader from "./loader.gif";

// Define the props for the component
interface ConvertActionProps {
  images: File[];
  setConverted: (convertedImages: ConvertedImage[]) => void;
}

// Define the structure for a converted image object
export interface ConvertedImage {
  image_name: string;
  image_data: string; // Base64 string
}

const ConvertAction: React.FC<ConvertActionProps> = ({
  images,
  setConverted,
}) => {
  const LOCAL_STORAGE_MAX_SIZE_KEY = 'compressionMaxSizeMB';
  const LOCAL_STORAGE_MAX_DIMENSION_KEY = 'compressionMaxWidthOrHeight';

  const initialMaxSizeMB = loadFromLocalStorage<number>(LOCAL_STORAGE_MAX_SIZE_KEY);
  const [maxSizeMB, setMaxSizeMB] = useState<number>(
    (typeof initialMaxSizeMB === 'number' && initialMaxSizeMB > 0) ? initialMaxSizeMB : 1
  );

  const initialMaxWidthOrHeight = loadFromLocalStorage<number>(LOCAL_STORAGE_MAX_DIMENSION_KEY);
  const [maxWidthOrHeight, setMaxWidthOrHeight] = useState<number>(
    (typeof initialMaxWidthOrHeight === 'number' && initialMaxWidthOrHeight > 0) ? initialMaxWidthOrHeight : 1920
  );

  const [processing, setProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleMaxSizeChange = (value: string) => {
    const newSize = parseFloat(value);
    if (newSize && newSize > 0) {
      setMaxSizeMB(newSize);
      saveToLocalStorage<number>(LOCAL_STORAGE_MAX_SIZE_KEY, newSize);
    } else { 
      setMaxSizeMB(1); 
      saveToLocalStorage<number>(LOCAL_STORAGE_MAX_SIZE_KEY, 1);
    }
  };

  const handleMaxWidthOrHeightChange = (value: string) => {
    const newDim = parseInt(value, 10);
    if (newDim && newDim > 0) {
      setMaxWidthOrHeight(newDim);
      saveToLocalStorage<number>(LOCAL_STORAGE_MAX_DIMENSION_KEY, newDim);
    } else {
      setMaxWidthOrHeight(1920);
      saveToLocalStorage<number>(LOCAL_STORAGE_MAX_DIMENSION_KEY, 1920);
    }
  };

  const convertBlobToBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () =>
        reject(new Error("Failed to read blob as Base64.")); // Pass an error object
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error("FileReader result is not a string."));
        }
      };
      reader.readAsDataURL(blob);
    });

  const processImages = async (
    imageFiles: File[]
  ): Promise<ConvertedImage[] | undefined> => {
    setError(null); // Clear previous errors
    const compressedImagesFiles: ConvertedImage[] = [];

    const options = {
      maxSizeMB: maxSizeMB, // Use state variable
      maxWidthOrHeight: maxWidthOrHeight, // Use state variable
      useWebWorker: true,
      // Consider adding onProgress for better UX if compression takes time
      // onProgress: (progress: number) => console.log(`Compression Progress: ${progress}%`),
    };

    try {
      for (const imageFile of imageFiles) {
        console.log(`Compressing ${imageFile.name}...`);
        const compressedFile = await imageCompression(imageFile, options);
        console.log(
          `Compressed ${imageFile.name} to ${compressedFile.size / 1024} KB`
        );

        const base64Image = await convertBlobToBase64(compressedFile);

        compressedImagesFiles.push({
          image_name: `Reduced_${imageFile.name}`, // Use original name for "Reduced_" prefix
          image_data: base64Image,
        });
      }
      return compressedImagesFiles;
    } catch (err) {
      console.error("Error during image compression:", err);
      const message =
        err instanceof Error
          ? err.message
          : "An unknown error occurred during compression.";
      setError(`Compression failed: ${message}`);
      return undefined; // Indicate failure
    }
  };

  const handleConversion = async () => {
    if (images.length === 0) return;

    setProcessing(true);
    setError(null);

    const result = await processImages(images);

    if (result) {
      setConverted(result);
    }
    // If result is undefined, an error was set by processImages

    setProcessing(false);
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-4 md:w-auto w-full">
      {!processing ? (
        <>
          {/* Configuration UI Elements */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 w-full px-4">
            <div className="space-y-2">
              <Label htmlFor="maxSizeMB" className="text-sm font-medium">Max Size (MB)</Label>
              <Input
                id="maxSizeMB"
                type="number"
                value={maxSizeMB}
                onChange={(e) => handleMaxSizeChange(e.target.value)}
                min="0.1"
                step="0.1"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxWidthOrHeight" className="text-sm font-medium">Max Width/Height (px)</Label>
              <Input
                id="maxWidthOrHeight"
                type="number"
                value={maxWidthOrHeight}
                onChange={(e) => handleMaxWidthOrHeightChange(e.target.value)}
                min="100"
                step="10"
                className="w-full"
              />
            </div>
          </div>

          <Button
            onClick={handleConversion}
            disabled={images.length === 0 || processing}
            className="w-full md:w-auto" // Full width on small screens, auto on medium+
          >
            Convert {images.length > 0 ? `(${images.length})` : ""}
          </Button>
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Processing images...</p>
        </div>
      )}
    </div>
  );
};

export default ConvertAction;
