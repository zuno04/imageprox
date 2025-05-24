import React, { useState } from "react";
import imageCompression from "browser-image-compression";

// Shadcn UI components & icons
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox"; // Import Checkbox
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
  const LOCAL_STORAGE_OUTPUT_FORMAT_KEY = 'compressionOutputFormat';
  const LOCAL_STORAGE_COMPRESSION_MODE_KEY = 'compressionQualityMode';
  const LOCAL_STORAGE_KEEP_EXIF_KEY = 'compressionKeepExif';

  const initialMaxSizeMB = loadFromLocalStorage<number>(LOCAL_STORAGE_MAX_SIZE_KEY);
  const [maxSizeMB, setMaxSizeMB] = useState<number>(
    (typeof initialMaxSizeMB === 'number' && initialMaxSizeMB > 0) ? initialMaxSizeMB : 1
  );

  const initialMaxWidthOrHeight = loadFromLocalStorage<number>(LOCAL_STORAGE_MAX_DIMENSION_KEY);
  const [maxWidthOrHeight, setMaxWidthOrHeight] = useState<number>(
    (typeof initialMaxWidthOrHeight === 'number' && initialMaxWidthOrHeight > 0) ? initialMaxWidthOrHeight : 1920
  );

  const initialOutputFormat = loadFromLocalStorage<string>(LOCAL_STORAGE_OUTPUT_FORMAT_KEY);
  const [outputFormat, setOutputFormat] = useState<string>(initialOutputFormat || 'original');

  const initialCompressionMode = loadFromLocalStorage<string>(LOCAL_STORAGE_COMPRESSION_MODE_KEY);
  const [compressionMode, setCompressionMode] = useState<string>(initialCompressionMode || 'lossy');

  const initialKeepExif = loadFromLocalStorage<boolean>(LOCAL_STORAGE_KEEP_EXIF_KEY);
  const [keepExif, setKeepExif] = useState<boolean>(initialKeepExif === null ? false : initialKeepExif);

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

  const handleOutputFormatChange = (value: string) => {
    setOutputFormat(value);
    saveToLocalStorage<string>(LOCAL_STORAGE_OUTPUT_FORMAT_KEY, value);
  };

  const handleCompressionModeChange = (value: string) => {
    setCompressionMode(value);
    saveToLocalStorage<string>(LOCAL_STORAGE_COMPRESSION_MODE_KEY, value);
  };

  const handleKeepExifChange = (checked: boolean) => {
    setKeepExif(checked);
    saveToLocalStorage<boolean>(LOCAL_STORAGE_KEEP_EXIF_KEY, checked);
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

    const options: imageCompression.Options = {
      maxSizeMB: maxSizeMB,
      maxWidthOrHeight: maxWidthOrHeight,
      useWebWorker: true,
      preserveExif: keepExif, // Add preserveExif option
    };

    if (outputFormat !== 'original') {
      options.fileType = outputFormat;
    }

    if (compressionMode === 'high') {
      options.initialQuality = 1.0;
      options.alwaysKeepResolution = true;
    } else { // 'lossy'
      options.initialQuality = 0.8;
      options.alwaysKeepResolution = false;
    }

    try {
      for (const imageFile of imageFiles) {
        console.log(`Compressing ${imageFile.name}...`);
        const compressedFile = await imageCompression(imageFile, options);
        console.log(
          `Compressed ${imageFile.name} to ${compressedFile.size / 1024} KB`
        );

        const base64Image = await convertBlobToBase64(compressedFile);
        let fileName = `Reduced_${imageFile.name}`;
        if (outputFormat !== 'original') {
          const nameParts = imageFile.name.split('.');
          nameParts.pop(); // Remove original extension
          const newExtension = outputFormat.split('/')[1];
          fileName = `Reduced_${nameParts.join('.')}.${newExtension}`;
        }

        compressedImagesFiles.push({
          image_name: fileName,
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4 w-full px-4">
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
            <div className="space-y-2">
              <Label htmlFor="outputFormat" className="text-sm font-medium">Output Format</Label>
              <Select value={outputFormat} onValueChange={handleOutputFormatChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="original">Keep Original Format</SelectItem>
                  <SelectItem value="image/png">PNG</SelectItem>
                  <SelectItem value="image/jpeg">JPG</SelectItem>
                  <SelectItem value="image/webp">WEBP</SelectItem>
                </SelectContent>
              </Select>
              {outputFormat === 'image/webp' && (
                <p className="text-xs text-muted-foreground pt-1">
                  WEBP offers better compression but check browser compatibility if sharing widely.
                </p>
              )}
            </div>
          </div>
          
          {/* Compression Mode Toggle */}
          <div className="w-full px-4 mb-4">
            <Label className="text-sm font-medium mb-2 block">Compression Mode</Label>
            <RadioGroup
              value={compressionMode}
              onValueChange={handleCompressionModeChange}
              className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="lossy" id="lossy" />
                <Label htmlFor="lossy" className="font-normal">Aggressive (Smaller Size)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="high" id="high" />
                <Label htmlFor="high" className="font-normal">High Quality (Larger Size)</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Keep EXIF Data Checkbox */}
          <div className="w-full px-4 mb-4 flex items-center space-x-2">
            <Checkbox
              id="keepExif"
              checked={keepExif}
              onCheckedChange={handleKeepExifChange}
            />
            <Label htmlFor="keepExif" className="text-sm font-normal">
              Keep EXIF Data (e.g., camera, GPS). Applies to JPEGs. May increase file size.
            </Label>
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
