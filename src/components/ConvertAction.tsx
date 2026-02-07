import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import imageCompression, { type Options } from "browser-image-compression";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
import PresetSelector from "@/components/presets/PresetSelector";
import ProcessingProgress from "@/components/progress/ProcessingProgress";
import FormatSuggestion from "@/components/ai/FormatSuggestion";
import QualitySuggestion from "@/components/ai/QualitySuggestion";
import { applyPreset, DEFAULT_OPTIONS } from "@/lib/presets";
import type {
  ConvertedImage,
  PresetType,
  ProcessingStatus,
  OutputFormat,
} from "@/types";

interface ConvertActionProps {
  images: File[];
  setConverted: (convertedImages: ConvertedImage[]) => void;
  onProcessingComplete?: (
    originalFiles: File[],
    converted: ConvertedImage[]
  ) => void;
}

interface FileProgressItem {
  id: string;
  name: string;
  status: ProcessingStatus;
  progress: number;
  error?: string;
}

const ConvertAction: React.FC<ConvertActionProps> = ({
  images,
  setConverted,
  onProcessingComplete,
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

  const [selectedPreset, setSelectedPreset] = useState<PresetType>("custom");
  const [processing, setProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [fileProgress, setFileProgress] = useState<FileProgressItem[]>([]);
  const { t } = useTranslation();

  const handlePresetChange = (presetId: PresetType) => {
    setSelectedPreset(presetId);
    if (presetId === "custom") return;

    const newOptions = applyPreset(DEFAULT_OPTIONS, presetId);
    setMaxSizeMB(newOptions.maxSizeMB);
    setMaxWidthOrHeight(newOptions.maxWidthOrHeight);
    if (newOptions.outputFormat !== "original") {
      setOutputFormat(newOptions.outputFormat);
    } else {
      setOutputFormat("original");
    }
    setCompressionMode(newOptions.compressionMode);
    setKeepExif(newOptions.keepExif);

    // Save to localStorage
    saveToLocalStorage(LOCAL_STORAGE_MAX_SIZE_KEY, newOptions.maxSizeMB);
    saveToLocalStorage(
      LOCAL_STORAGE_MAX_DIMENSION_KEY,
      newOptions.maxWidthOrHeight
    );
    saveToLocalStorage(
      LOCAL_STORAGE_OUTPUT_FORMAT_KEY,
      newOptions.outputFormat === "original"
        ? "original"
        : newOptions.outputFormat
    );
    saveToLocalStorage(LOCAL_STORAGE_COMPRESSION_MODE_KEY, newOptions.compressionMode);
    saveToLocalStorage(LOCAL_STORAGE_KEEP_EXIF_KEY, newOptions.keepExif);
  };

  const handleMaxSizeChange = (value: string) => {
    const newSize = parseFloat(value);
    const valid = newSize > 0 ? newSize : 1;
    setMaxSizeMB(valid);
    setSelectedPreset("custom");
    saveToLocalStorage(LOCAL_STORAGE_MAX_SIZE_KEY, valid);
  };

  const handleMaxWidthOrHeightChange = (value: string) => {
    const newDim = parseInt(value, 10);
    const valid = newDim > 0 ? newDim : 1920;
    setMaxWidthOrHeight(valid);
    setSelectedPreset("custom");
    saveToLocalStorage(LOCAL_STORAGE_MAX_DIMENSION_KEY, valid);
  };

  const convertBlobToBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () =>
        reject(new Error(t("convertAction.errorFailedToReadBlob")));
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error(t("convertAction.errorUnexpectedResultFormat")));
        }
      };
      reader.readAsDataURL(blob);
    });

  const handleFormatSuggestion = useCallback(
    (format: OutputFormat) => {
      setOutputFormat(format);
      setSelectedPreset("custom");
      saveToLocalStorage(LOCAL_STORAGE_OUTPUT_FORMAT_KEY, format);
    },
    [LOCAL_STORAGE_OUTPUT_FORMAT_KEY]
  );

  const handleQualitySuggestion = useCallback(
    (suggestedMaxSizeMB: number) => {
      setMaxSizeMB(suggestedMaxSizeMB);
      setSelectedPreset("custom");
      saveToLocalStorage(LOCAL_STORAGE_MAX_SIZE_KEY, suggestedMaxSizeMB);
    },
    [LOCAL_STORAGE_MAX_SIZE_KEY]
  );

  const processImages = async (
    imageFiles: File[]
  ): Promise<ConvertedImage[] | undefined> => {
    setError(null);
    const results: ConvertedImage[] = [];

    // Initialize progress tracking
    const initialProgress: FileProgressItem[] = imageFiles.map(
      (file, index) => ({
        id: `file-${index}`,
        name: file.name,
        status: "pending" as ProcessingStatus,
        progress: 0,
      })
    );
    setFileProgress(initialProgress);

    // Check AVIF support
    let actualFormat = outputFormat;
    if (outputFormat === "image/avif") {
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      if (!canvas.toDataURL("image/avif").startsWith("data:image/avif")) {
        actualFormat = "image/webp";
        toast.warning(t("convertAction.avifNotSupported"));
      }
    }

    const options: Options = {
      maxSizeMB,
      maxWidthOrHeight,
      useWebWorker: true,
      preserveExif: keepExif,
    };

    if (actualFormat === "image/png") {
      options.fileType = "image/png";
    } else {
      options.initialQuality = compressionMode === "high" ? 1.0 : 0.8;
      options.alwaysKeepResolution = compressionMode === "high";
      if (actualFormat !== "original") {
        options.fileType = actualFormat;
      }
    }

    try {
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];

        // Update status to processing
        setFileProgress((prev) =>
          prev.map((fp, idx) =>
            idx === i ? { ...fp, status: "processing", progress: 0 } : fp
          )
        );

        try {
          const compressed = await imageCompression(file, {
            ...options,
            onProgress: (progress: number) => {
              setFileProgress((prev) =>
                prev.map((fp, idx) =>
                  idx === i
                    ? { ...fp, progress: Math.round(progress) }
                    : fp
                )
              );
            },
          });

          const base64 = await convertBlobToBase64(compressed);
          let filename =
            t("convertAction.reducedFileNamePrefix") + file.name;
          if (actualFormat !== "original") {
            const ext = actualFormat.split("/")[1];
            filename =
              t("convertAction.reducedFileNamePrefix") +
              file.name.replace(/\.[^/.]+$/, "") +
              `.${ext}`;
          }
          results.push({ image_name: filename, image_data: base64 });

          // Update status to completed
          setFileProgress((prev) =>
            prev.map((fp, idx) =>
              idx === i
                ? { ...fp, status: "completed", progress: 100 }
                : fp
            )
          );
        } catch (fileErr) {
          const message =
            fileErr instanceof Error
              ? fileErr.message
              : t("convertAction.errorUnknown");

          // Update status to error for this file
          setFileProgress((prev) =>
            prev.map((fp, idx) =>
              idx === i ? { ...fp, status: "error", error: message } : fp
            )
          );

          toast.error(
            t("convertAction.compressionFailed", { message }),
            { description: file.name }
          );
        }
      }

      return results;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : t("convertAction.errorUnknown");
      setError(t("convertAction.compressionFailed", { message }));
      return undefined;
    }
  };

  const handleConversion = async () => {
    if (!images.length) return;
    setProcessing(true);
    toast.info(t("toast.processingStarted", { count: images.length }));

    const result = await processImages(images);
    if (result && result.length > 0) {
      setConverted(result);
      toast.success(t("toast.processingComplete", { count: result.length }));
      onProcessingComplete?.(images, result);
    } else if (result && result.length === 0) {
      toast.error(t("toast.processingError"));
    }

    setProcessing(false);
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-4 md:w-auto w-full">
      {!processing ? (
        <>
          {/* Preset Selector */}
          <PresetSelector
            selectedPreset={selectedPreset}
            onSelectPreset={handlePresetChange}
            compact
            className="w-full"
          />

          {/* AI Suggestions */}
          <FormatSuggestion
            files={images}
            currentFormat={outputFormat as OutputFormat}
            onApply={handleFormatSuggestion}
            className="w-full"
          />
          <QualitySuggestion
            files={images}
            currentMaxSizeMB={maxSizeMB}
            onApply={handleQualitySuggestion}
            className="w-full"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 w-full">
            <div className="space-y-2">
              <Label htmlFor="maxSizeMB">
                {t("convertAction.maxSizeLabel")}
              </Label>
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
              <Label htmlFor="maxWidthOrHeight">
                {t("convertAction.maxDimensionLabel")}
              </Label>
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
              <Label>{t("convertAction.outputFormatLabel")}</Label>
              <Select
                value={outputFormat}
                onValueChange={(val) => {
                  setOutputFormat(val);
                  setSelectedPreset("custom");
                  saveToLocalStorage(LOCAL_STORAGE_OUTPUT_FORMAT_KEY, val);
                }}
              >
                <SelectTrigger className="w-full min-w-[100px]">
                  <SelectValue
                    placeholder={t("convertAction.selectFormatPlaceholder")}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="original">
                    {t("convertAction.formatOriginal")}
                  </SelectItem>
                  <SelectItem value="image/png">
                    {t("convertAction.formatPng")}
                  </SelectItem>
                  <SelectItem value="image/jpeg">
                    {t("convertAction.formatJpg")}
                  </SelectItem>
                  <SelectItem value="image/webp">
                    {t("convertAction.formatWebp")}
                  </SelectItem>
                  <SelectItem value="image/avif">
                    {t("convertAction.formatAvif")}
                  </SelectItem>
                </SelectContent>
              </Select>
              {outputFormat === "image/webp" && (
                <p className="text-xs text-muted-foreground">
                  {t("convertAction.webpWarning")}
                </p>
              )}
              {outputFormat === "image/avif" && (
                <p className="text-xs text-muted-foreground">
                  {t("convertAction.avifWarning")}
                </p>
              )}
            </div>
          </div>

          <div className="w-full px-4">
            <Label>{t("convertAction.compressionModeLabel")}</Label>
            <RadioGroup
              value={compressionMode}
              onValueChange={(val) => {
                setCompressionMode(val);
                setSelectedPreset("custom");
                saveToLocalStorage(LOCAL_STORAGE_COMPRESSION_MODE_KEY, val);
              }}
              className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="lossy" id="lossy" />
                <Label htmlFor="lossy">
                  {t("convertAction.modeAggressive")}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="high" id="high" />
                <Label htmlFor="high">
                  {t("convertAction.modeHighQuality")}
                </Label>
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
              {t("convertAction.keepExifLabel")}
            </Label>
          </div>

          <Button
            onClick={handleConversion}
            disabled={images.length === 0 || processing}
            className="w-full md:w-auto"
          >
            {t("convertAction.processButton", { count: images.length })}
          </Button>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </>
      ) : (
        <div className="w-full space-y-4">
          <ProcessingProgress files={fileProgress} />
        </div>
      )}
    </div>
  );
};

export default ConvertAction;
