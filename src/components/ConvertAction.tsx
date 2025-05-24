import React, { useState } from "react";
import imageCompression, { type Options } from "browser-image-compression";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { saveToLocalStorage, loadFromLocalStorage } from "@/lib/utils";

interface ConvertActionProps {
  images: File[];
  setConverted: (convertedImages: ConvertedImage[]) => void;
}

export interface ConvertedImage {
  image_name: string;
  image_data: string;
}

const ConvertAction: React.FC<ConvertActionProps> = ({
  images,
  setConverted,
}) => {
  const LOCAL_STORAGE_MAX_SIZE_KEY = "compressionMaxSizeMB";
  const LOCAL_STORAGE_MAX_DIMENSION_KEY = "compressionMaxWidthOrHeight";
  const LOCAL_STORAGE_OUTPUT_FORMAT_KEY = "compressionOutputFormat";
  const LOCAL_STORAGE_COMPRESSION_MODE_KEY = "compressionQualityMode";
  const LOCAL_STORAGE_KEEP_EXIF_KEY = "compressionKeepExif";

  const [maxSizeMB, setMaxSizeMB] = useState<number>(
    loadFromLocalStorage<number>(LOCAL_STORAGE_MAX_SIZE_KEY) || 1
  );
  const [maxWidthOrHeight, setMaxWidthOrHeight] = useState<number>(
    loadFromLocalStorage<number>(LOCAL_STORAGE_MAX_DIMENSION_KEY) || 1920
  );
  const [outputFormat, setOutputFormat] = useState<string>(
    loadFromLocalStorage<string>(LOCAL_STORAGE_OUTPUT_FORMAT_KEY) || "original"
  );
  const [compressionMode, setCompressionMode] = useState<string>(
    loadFromLocalStorage<string>(LOCAL_STORAGE_COMPRESSION_MODE_KEY) || "lossy"
  );
  const [keepExif, setKeepExif] = useState<boolean>(
    loadFromLocalStorage<boolean>(LOCAL_STORAGE_KEEP_EXIF_KEY) ?? false
  );

  const [processing, setProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleMaxSizeChange = (value: string) => {
    const newSize = parseFloat(value);
    const valid = newSize > 0 ? newSize : 1;
    setMaxSizeMB(valid);
    saveToLocalStorage(LOCAL_STORAGE_MAX_SIZE_KEY, valid);
  };

  const handleMaxWidthOrHeightChange = (value: string) => {
    const newDim = parseInt(value, 10);
    const valid = newDim > 0 ? newDim : 1920;
    setMaxWidthOrHeight(valid);
    saveToLocalStorage(LOCAL_STORAGE_MAX_DIMENSION_KEY, valid);
  };

  const convertBlobToBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Failed to read blob."));
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error("Unexpected result format."));
        }
      };

      reader.readAsDataURL(blob);
    });

  const processImages = async (
    imageFiles: File[]
  ): Promise<ConvertedImage[] | undefined> => {
    setError(null);
    const results: ConvertedImage[] = [];

    const options: Options = {
      maxSizeMB,
      maxWidthOrHeight,
      useWebWorker: true,
      preserveExif: keepExif,
      initialQuality: compressionMode === "high" ? 1.0 : 0.8,
      alwaysKeepResolution: compressionMode === "high",
    };

    if (outputFormat !== "original") {
      options.fileType = outputFormat;
    }

    try {
      for (const file of imageFiles) {
        const compressed = await imageCompression(file, options);
        const base64 = await convertBlobToBase64(compressed);
        let filename = `Reduced_${file.name}`;
        if (outputFormat !== "original") {
          const ext = outputFormat.split("/")[1];
          filename = `Reduced_${file.name.replace(/\.[^/.]+$/, "")}.${ext}`;
        }
        results.push({ image_name: filename, image_data: base64 });
      }
      return results;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error.";
      setError(`Compression failed: ${message}`);
      return undefined;
    }
  };

  const handleConversion = async () => {
    if (!images.length) return;
    setProcessing(true);
    const result = await processImages(images);
    if (result) setConverted(result);
    setProcessing(false);
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-4 md:w-auto w-full">
      {!processing ? (
        <>
          <div className="text-center text-lg font-semibold">
            Upload your images, reduce their size, and download them!
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 w-full">
            <div className="space-y-2">
              <Label htmlFor="maxSizeMB">Max Size (MB)</Label>
              <Input
                id="maxSizeMB"
                type="number"
                value={maxSizeMB}
                onChange={(e) => handleMaxSizeChange(e.target.value)}
                min="0.1"
                step="0.1"
                className="w-full min-w-[100px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxWidthOrHeight">Max W/H (px)</Label>
              <Input
                id="maxWidthOrHeight"
                type="number"
                value={maxWidthOrHeight}
                onChange={(e) => handleMaxWidthOrHeightChange(e.target.value)}
                min="100"
                step="10"
                className="w-full min-w-[100px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Output Format</Label>
              <Select
                value={outputFormat}
                onValueChange={(val) => {
                  setOutputFormat(val);
                  saveToLocalStorage(LOCAL_STORAGE_OUTPUT_FORMAT_KEY, val);
                }}
              >
                <SelectTrigger className="w-full min-w-[100px]">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="original">Keep Original</SelectItem>
                  <SelectItem value="image/png">PNG</SelectItem>
                  <SelectItem value="image/jpeg">JPG</SelectItem>
                  <SelectItem value="image/webp">WEBP</SelectItem>
                </SelectContent>
              </Select>
              {outputFormat === "image/webp" && (
                <p className="text-xs text-muted-foreground">
                  WEBP offers better compression but may not be supported by all
                  devices.
                </p>
              )}
            </div>
          </div>

          <div className="w-full px-4">
            <Label>Compression Mode</Label>
            <RadioGroup
              value={compressionMode}
              onValueChange={(val) => {
                setCompressionMode(val);
                saveToLocalStorage(LOCAL_STORAGE_COMPRESSION_MODE_KEY, val);
              }}
              className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="lossy" id="lossy" />
                <Label htmlFor="lossy">Aggressive (Smaller Size)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="high" id="high" />
                <Label htmlFor="high">High Quality (Larger Size)</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="w-full px-4 flex items-center space-x-2">
            <Checkbox
              id="keepExif"
              checked={keepExif}
              onCheckedChange={(val: boolean) => {
                setKeepExif(val);
                saveToLocalStorage(LOCAL_STORAGE_KEEP_EXIF_KEY, val);
              }}
            />
            <Label htmlFor="keepExif">
              Keep EXIF Data (camera, GPS). Applies to JPEGs. May increase size.
            </Label>
          </div>

          <Button
            onClick={handleConversion}
            disabled={images.length === 0 || processing}
            className="w-full md:w-auto"
          >
            Process Images {images.length > 0 ? `(${images.length})` : ""}
          </Button>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </>
      ) : (
        <div className="flex flex-col items-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Processing images...</p>
        </div>
      )}
    </div>
  );
};

export default ConvertAction;
