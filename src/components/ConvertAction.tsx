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
// RadioGroup and RadioGroupItem are no longer used directly for compression mode
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { saveToLocalStorage, loadFromLocalStorage } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/dialog"; // Using AlertDialog for simple info
import { Sparkles } from "lucide-react"; // Icon for the button

interface ConvertActionProps {
  images: File[];
  setConverted: (convertedImages: ConvertedImage[]) => void;
  onUndo: () => void;
  canUndo: boolean;
}

// Define Preset types
interface PresetSetting {
  maxSizeMB?: number; // Optional if a preset only changes format/quality
  maxWidthOrHeight?: number; // Optional
  outputFormat: string; // 'original', 'image/png', 'image/jpeg', 'image/webp'
  // New way to define compression characteristics
  quality?: number; // 0.1 - 1.0. Applied as initialQuality for JPG/WEBP.
  forcePngLossless?: boolean; // If true, ensures PNG is used for a "lossless" feel.
  alwaysKeepResolution?: boolean; // For high quality mode
  keepExif: boolean;
}

interface Preset {
  name: string;
  settings: PresetSetting | null; // Null for "Custom"
}

const presets: Preset[] = [
  { name: "Custom", settings: null },
  {
    name: "Web (Balanced WEBP)",
    settings: {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      outputFormat: "image/webp",
      quality: 0.75, // Good balance for WEBP
      alwaysKeepResolution: false,
      keepExif: false,
    },
  },
  {
    name: "Web (Balanced JPG)",
    settings: {
      maxSizeMB: 1.2, // JPG might be slightly larger than WEBP for same quality
      maxWidthOrHeight: 1920,
      outputFormat: "image/jpeg",
      quality: 0.8, // Good balance for JPG
      alwaysKeepResolution: false,
      keepExif: false,
    },
  },
  {
    name: "High Quality (PNG Lossless-like)",
    settings: {
      maxSizeMB: 10, // PNG can be large
      maxWidthOrHeight: 3000,
      outputFormat: "image/png",
      forcePngLossless: true, // Custom flag to ensure PNG specific options if any
      quality: 1.0, // Does not directly apply to PNG in same way, but indicates intent
      alwaysKeepResolution: true, // Keep resolution for high quality
      keepExif: true,
    },
  },
  {
    name: "Thumbnails (Small JPG)",
    settings: {
      maxSizeMB: 0.2,
      maxWidthOrHeight: 400,
      outputFormat: "image/jpeg",
      quality: 0.6,
      alwaysKeepResolution: false,
      keepExif: false,
    },
  },
];


export interface ConvertedImage {
  image_name: string;
  image_data: string;
}

const ConvertAction: React.FC<ConvertActionProps> = ({
  images,
  setConverted,
  onUndo,
  canUndo,
}) => {
  const LOCAL_STORAGE_MAX_SIZE_KEY = "compressionMaxSizeMB";
  const LOCAL_STORAGE_MAX_DIMENSION_KEY = "compressionMaxWidthOrHeight";
  const LOCAL_STORAGE_OUTPUT_FORMAT_KEY = "compressionOutputFormat";
  // const LOCAL_STORAGE_COMPRESSION_MODE_KEY = "compressionQualityMode"; // Old key, to be replaced/managed by new preset logic
  const LOCAL_STORAGE_QUALITY_KEY = "compressionQuality";
  const LOCAL_STORAGE_ALWAYS_KEEP_RESOLUTION_KEY = "compressionAlwaysKeepResolution";
  const LOCAL_STORAGE_KEEP_EXIF_KEY = "compressionKeepExif";
  const LOCAL_STORAGE_CURRENT_PRESET_NAME = "currentPresetName";


  // Initialize state with a default preset or "Custom"
  // For "Custom", load individual settings from localStorage or defaults.
  const initialPresetName = loadFromLocalStorage<string>(LOCAL_STORAGE_CURRENT_PRESET_NAME) || "Custom";
  const findInitialPreset = presets.find(p => p.name === initialPresetName);
  const initialSettings = findInitialPreset?.settings;

  const [maxSizeMB, setMaxSizeMB] = useState<number>(
    initialSettings?.maxSizeMB ?? loadFromLocalStorage<number>(LOCAL_STORAGE_MAX_SIZE_KEY) ?? 1
  );
  const [maxWidthOrHeight, setMaxWidthOrHeight] = useState<number>(
    initialSettings?.maxWidthOrHeight ?? loadFromLocalStorage<number>(LOCAL_STORAGE_MAX_DIMENSION_KEY) ?? 1920
  );
  const [outputFormat, setOutputFormat] = useState<string>(
    initialSettings?.outputFormat ?? loadFromLocalStorage<string>(LOCAL_STORAGE_OUTPUT_FORMAT_KEY) ?? "original"
  );
  // New state for quality (0-1), replacing old compressionMode
  const [quality, setQuality] = useState<number>(
    initialSettings?.quality ?? loadFromLocalStorage<number>(LOCAL_STORAGE_QUALITY_KEY) ?? 0.8
  );
  // New state for alwaysKeepResolution
  const [alwaysKeepResolution, setAlwaysKeepResolution] = useState<boolean>(
    initialSettings?.alwaysKeepResolution ?? loadFromLocalStorage<boolean>(LOCAL_STORAGE_ALWAYS_KEEP_RESOLUTION_KEY) ?? false
  );
  const [keepExif, setKeepExif] = useState<boolean>(
    initialSettings?.keepExif ?? loadFromLocalStorage<boolean>(LOCAL_STORAGE_KEEP_EXIF_KEY) ?? false
  );
  // forcePngLossless is a behavior, not a direct state for a control, but used in options construction

  const [currentPresetName, setCurrentPresetName] = useState<string>(initialPresetName);
  const [showSmartDetectDialog, setShowSmartDetectDialog] = useState(false);

  const handlePresetChange = (selectedPresetName: string) => {
    setCurrentPresetName(selectedPresetName);
    saveToLocalStorage(LOCAL_STORAGE_CURRENT_PRESET_NAME, selectedPresetName);

    const selectedPreset = presets.find(p => p.name === selectedPresetName);
    if (selectedPreset && selectedPreset.settings) {
      const { settings } = selectedPreset;
      // Apply settings to individual state variables
      if (settings.maxSizeMB !== undefined) {
        setMaxSizeMB(settings.maxSizeMB);
        saveToLocalStorage(LOCAL_STORAGE_MAX_SIZE_KEY, settings.maxSizeMB);
      }
      if (settings.maxWidthOrHeight !== undefined) {
        setMaxWidthOrHeight(settings.maxWidthOrHeight);
        saveToLocalStorage(LOCAL_STORAGE_MAX_DIMENSION_KEY, settings.maxWidthOrHeight);
      }
      setOutputFormat(settings.outputFormat);
      saveToLocalStorage(LOCAL_STORAGE_OUTPUT_FORMAT_KEY, settings.outputFormat);
      
      if (settings.quality !== undefined) {
        setQuality(settings.quality);
        saveToLocalStorage(LOCAL_STORAGE_QUALITY_KEY, settings.quality);
      }
      if (settings.alwaysKeepResolution !== undefined) {
        setAlwaysKeepResolution(settings.alwaysKeepResolution);
        saveToLocalStorage(LOCAL_STORAGE_ALWAYS_KEEP_RESOLUTION_KEY, settings.alwaysKeepResolution);
      }
      setKeepExif(settings.keepExif);
      saveToLocalStorage(LOCAL_STORAGE_KEEP_EXIF_KEY, settings.keepExif);
    }
  };


  const [processing, setProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // State for progress tracking
  const [fileProgress, setFileProgress] = useState<Record<string, number>>({});
  const [overallProgress, setOverallProgress] = useState<number>(0);
  const [
    currentFileBeingProcessed,
    setCurrentFileBeingProcessed,
  ] = useState<string | null>(null);

  const handleMaxSizeChange = (value: string) => {
    const newSize = parseFloat(value);
    const valid = newSize > 0 ? newSize : 1;
    setMaxSizeMB(valid);
    saveToLocalStorage(LOCAL_STORAGE_MAX_SIZE_KEY, valid);
    setCurrentPresetName("Custom"); // Reset to custom on manual change
    saveToLocalStorage(LOCAL_STORAGE_CURRENT_PRESET_NAME, "Custom");
  };

  const handleMaxWidthOrHeightChange = (value: string) => {
    const newDim = parseInt(value, 10);
    const valid = newDim > 0 ? newDim : 1920;
    setMaxWidthOrHeight(valid);
    saveToLocalStorage(LOCAL_STORAGE_MAX_DIMENSION_KEY, valid);
    setCurrentPresetName("Custom");
    saveToLocalStorage(LOCAL_STORAGE_CURRENT_PRESET_NAME, "Custom");
  };

  const handleOutputFormatChange = (val: string) => {
    setOutputFormat(val);
    saveToLocalStorage(LOCAL_STORAGE_OUTPUT_FORMAT_KEY, val);
    setCurrentPresetName("Custom");
    saveToLocalStorage(LOCAL_STORAGE_CURRENT_PRESET_NAME, "Custom");
  };

  const handleQualityChange = (value: string) => {
    const newQuality = parseFloat(value);
    // Clamp quality between 0.1 and 1.0 as an example, adjust as needed
    const validQuality = Math.max(0.1, Math.min(newQuality, 1.0));
    setQuality(validQuality);
    saveToLocalStorage(LOCAL_STORAGE_QUALITY_KEY, validQuality);
    setCurrentPresetName("Custom");
    saveToLocalStorage(LOCAL_STORAGE_CURRENT_PRESET_NAME, "Custom");
  };
  
  const handleAlwaysKeepResolutionChange = (val: boolean) => {
    setAlwaysKeepResolution(val);
    saveToLocalStorage(LOCAL_STORAGE_ALWAYS_KEEP_RESOLUTION_KEY, val);
    setCurrentPresetName("Custom");
    saveToLocalStorage(LOCAL_STORAGE_CURRENT_PRESET_NAME, "Custom");
  };

  const handleKeepExifChange = (val: boolean) => {
    setKeepExif(val);
    saveToLocalStorage(LOCAL_STORAGE_KEEP_EXIF_KEY, val);
    setCurrentPresetName("Custom");
    saveToLocalStorage(LOCAL_STORAGE_CURRENT_PRESET_NAME, "Custom");
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
    setFileProgress({});
    setOverallProgress(0);
    setCurrentFileBeingProcessed(null);
    const results: ConvertedImage[] = [];
    const totalFiles = imageFiles.length;

    const optionsBase: Options = {
      maxSizeMB,
      maxWidthOrHeight,
      useWebWorker: true,
      preserveExif: keepExif,
      // alwaysKeepResolution is now a direct state
      alwaysKeepResolution: alwaysKeepResolution, 
    };

    if (outputFormat !== "original") {
      optionsBase.fileType = outputFormat;
    }

    // Apply quality setting, primarily for JPEG and WEBP
    // For PNG, quality is less about lossy compression and more about other factors like color depth/palette,
    // which browser-image-compression doesn't directly control via 'initialQuality'.
    // The 'forcePngLossless' in preset helps guide this.
    if (outputFormat === 'image/jpeg' || outputFormat === 'image/webp') {
      optionsBase.initialQuality = quality;
    }
    
    // If a preset specifies forcePngLossless and format is PNG, we might skip initialQuality
    // or ensure it's 1.0. The library itself handles PNGs as lossless by default.
    // The main thing is `fileType: 'image/png'`.
    const selectedPreset = presets.find(p => p.name === currentPresetName);
    if (outputFormat === 'image/png' && selectedPreset?.settings?.forcePngLossless) {
        // Potentially override other options for true PNG behavior if library offered more.
        // For now, ensuring fileType is 'image/png' is the main part.
        // initialQuality is not directly used for PNG by the library in a lossy sense.
    }


    try {
      for (let i = 0; i < totalFiles; i++) {
        const file = imageFiles[i];
        setCurrentFileBeingProcessed(file.name);

        const options: Options = {
          ...optionsBase,
          onProgress: (progress) => {
            setFileProgress((prev) => ({ ...prev, [file.name]: progress }));
            // Calculate overall progress
            let currentTotalProgress = 0;
            for (let j = 0; j < totalFiles; j++) {
              if (j < i) { // Files already processed
                currentTotalProgress += 100;
              } else if (j === i) { // Current file
                currentTotalProgress += progress;
              } else { // Files not yet processed
                // currentTotalProgress += 0; // Implicitly 0
              }
            }
            setOverallProgress(currentTotalProgress / totalFiles);
          },
        };

        const compressed = await imageCompression(file, options);
        // Ensure progress is 100% for this file after successful compression
        setFileProgress((prev) => ({ ...prev, [file.name]: 100 }));

        // Recalculate overall progress more reliably
        // This uses the most up-to-date fileProgress state for the current file (now 100%)
        // and assumes previous files are 100% (as they are completed)
        // and future files are at whatever progress they reported (likely 0, or their last reported if any)
        setOverallProgress((currentOverallProgress) => {
            let newTotalProgress = 0;
            for (let k = 0; k < totalFiles; k++) {
                if (k < i) { // Files already processed and should be 100%
                    newTotalProgress += 100;
                } else if (k === i) { // Current file, just completed
                    newTotalProgress += 100;
                } else { // Files not yet processed
                    // For files not yet processed, their progress is taken from fileProgress state,
                    // which should be 0 or undefined if they haven't started.
                    newTotalProgress += fileProgress[imageFiles[k].name] || 0;
                }
            }
            return newTotalProgress / totalFiles;
        });

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
      setError(`Compression failed for ${currentFileBeingProcessed || 'a file'}: ${message}`);
      setCurrentFileBeingProcessed(null); // Reset current file on error
      // Do not reset overall progress here, let it reflect the state at point of failure
      return undefined;
    }
  };

  const handleConversion = async () => {
    if (!images.length) return;
    setProcessing(true);
    setError(null); // Clear previous errors
    setFileProgress({}); // Reset progress for new batch
    setOverallProgress(0);
    setCurrentFileBeingProcessed(null);

    const result = await processImages(images);
    if (result) {
      setConverted(result);
      setOverallProgress(100); // Ensure it's 100% on successful completion of all
    }
    // setCurrentFileBeingProcessed(null); // Already handled in processImages or if error
    setProcessing(false);
    // Don't reset overallProgress if there was an error, to show where it stopped
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-4 md:w-auto w-full">
      {!processing ? (
        <>
          <div className="text-center text-lg font-semibold">
            Upload your images, reduce their size, and download them!
          </div>

          {/* Preset Selector */}
          <div className="w-full md:max-w-xs space-y-2 self-center"> {/* Centering the preset selector */}
            <Label htmlFor="preset-select">Optimization Preset</Label>
            <Select
              value={currentPresetName}
              onValueChange={handlePresetChange}
            >
              <SelectTrigger id="preset-select" className="w-full">
                <SelectValue placeholder="Select a preset" />
              </SelectTrigger>
              <SelectContent>
                {presets.map((preset) => (
                  <SelectItem key={preset.name} value={preset.name}>
                    {preset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="text-center text-sm text-muted-foreground my-2">
            Adjust individual settings below or choose a preset.
          </div>
          
          {/* Smart Detect Button */}
          <div className="w-full flex justify-center my-4">
            <Button variant="outline" onClick={() => setShowSmartDetectDialog(true)}>
              <Sparkles className="mr-2 h-4 w-4" />
              Smart Detect Analysis
            </Button>
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
                onValueChange={handleOutputFormatChange}
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

          {/* The old "Compression Mode" RadioGroup has been removed. */}
          {/* Its functionality is now handled by the "Quality" input and "Preserve Resolution" checkbox. */}
          
          {/* Quality Slider - replacing Compression Mode */}
          {(outputFormat === 'image/jpeg' || outputFormat === 'image/webp') && (
            <div className="w-full px-4">
              <Label htmlFor="quality">Quality (0.1 - 1.0)</Label>
              <Input
                id="quality"
                type="number"
                value={quality}
                onChange={(e) => handleQualityChange(e.target.value)}
                min="0.1"
                max="1.0"
                step="0.05"
                className="w-full"
              />
               <p className="text-xs text-muted-foreground mt-1">
                Lower values mean smaller size but lower quality. Only for JPG/WEBP.
              </p>
            </div>
          )}

          {/* Always Keep Resolution Checkbox - replacing part of Compression Mode */}
          <div className="w-full px-4 flex items-center space-x-2">
            <Checkbox
              id="alwaysKeepResolution"
              checked={alwaysKeepResolution}
              onCheckedChange={(val: boolean) => handleAlwaysKeepResolutionChange(val)}
            />
            <Label htmlFor="alwaysKeepResolution">
              Preserve Resolution (may increase size if other constraints are met)
            </Label>
          </div>


          <div className="w-full px-4 flex items-center space-x-2">
            <Checkbox
              id="keepExif"
              checked={keepExif}
              onCheckedChange={(val: boolean) => handleKeepExifChange(val)}
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
          <Button
            onClick={onUndo}
            disabled={!canUndo || processing}
            variant="outline"
            className="w-full md:w-auto"
          >
            Undo Last Conversion
          </Button>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </>
      ) : (
        <div className="flex flex-col items-center space-y-4 w-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Processing images...</p>
          {currentFileBeingProcessed && (
            <p className="text-sm text-foreground">
              Compressing: {currentFileBeingProcessed} (
              {(fileProgress[currentFileBeingProcessed] || 0).toFixed(0)}%)
            </p>
          )}
          <div className="w-full bg-muted rounded-full h-2.5">
            <div
              className="bg-primary h-2.5 rounded-full transition-all duration-150 ease-linear"
              style={{ width: `${overallProgress.toFixed(0)}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Overall Progress: {overallProgress.toFixed(0)}%
          </p>
        </div>
      )}

      {/* Smart Detect Dialog */}
      <AlertDialog open={showSmartDetectDialog} onOpenChange={setShowSmartDetectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Smart Detection Recommendation ✨</AlertDialogTitle>
            <AlertDialogDescription className="text-left pt-2"> {/* Added text-left and padding */}
              If your image contains fine details like text, QR codes, or intricate logos, consider these tips to preserve clarity:
              <ul className="list-disc list-outside pl-5 mt-2 space-y-1 text-sm"> {/* list-outside and pl-5 for better bullet alignment */}
                <li>
                  <strong>Format Choice:</strong> PNG is often best for sharp lines and text. High-quality WebP or JPEG (quality &gt; 0.9) can also work.
                </li>
                <li>
                  <strong>Avoid Aggressive Compression:</strong> Very low quality settings can blur details.
                </li>
                <li>
                  <strong>Sufficient Dimensions:</strong> Ensure the image isn't resized too small, which can make text unreadable.
                </li>
              </ul>
              <p className="mt-3 text-xs text-muted-foreground"> {/* Adjusted margin and text size */}
                This tool does not automatically analyze image content yet, but these general guidelines can help.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowSmartDetectDialog(false)}>Got it!</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ConvertAction;
