import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Download, FileText, Eye, SplitSquareHorizontal } from "lucide-react";
import { generateZip } from "@/lib/jzip";
import AdvancedImagePreviewModal, {
  type ImageObject as ModalImageObject,
} from "@/components/modals/AdvancedImagePreviewModal";
import BeforeAfterSlider from "@/components/comparison/BeforeAfterSlider";
import ThumbnailGrid from "@/components/gallery/ThumbnailGrid";
import StatsDashboard from "@/components/stats/StatsDashboard";
import { useSelection } from "@/hooks/useSelection";
import { formatBytes } from "@/hooks/useStats";
import type { ConvertedImage, ViewMode } from "@/types";
import { loadFromLocalStorage, saveToLocalStorage } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";

interface FileRenderDownloadProps {
  converted: ConvertedImage[];
  originalFiles?: File[];
  onApplyEdit: (editedImage: {
    newSrc: string;
    originalIndex: number;
  }) => void;
}

interface ConvertedWithId {
  id: string;
  image: ConvertedImage;
}

const FileRenderDownload: React.FC<FileRenderDownloadProps> = ({
  converted,
  originalFiles,
  onApplyEdit,
}) => {
  const { t } = useTranslation();

  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [comparisonIndex, setComparisonIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(
    loadFromLocalStorage<ViewMode>("downloadViewMode") || "list"
  );

  // Add IDs to converted images for selection
  const convertedWithIds = useMemo<ConvertedWithId[]>(() => {
    return converted.map((img) => ({
      id: uuidv4(),
      image: img,
    }));
  }, [converted]);

  const selection = useSelection(convertedWithIds);

  // Calculate stats
  const stats = useMemo(() => {
    const totalOriginalSize = originalFiles
      ? originalFiles.reduce((acc, f) => acc + f.size, 0)
      : 0;

    const totalProcessedSize = converted.reduce((acc, img) => {
      const base64 = img.image_data.split(",")[1] || "";
      return acc + Math.ceil((base64.length * 3) / 4);
    }, 0);

    const sizeSaved = Math.max(0, totalOriginalSize - totalProcessedSize);
    const compressionRatio =
      totalOriginalSize > 0
        ? ((totalOriginalSize - totalProcessedSize) / totalOriginalSize) * 100
        : 0;

    return {
      filesProcessed: converted.length,
      originalSize: formatBytes(totalOriginalSize),
      processedSize: formatBytes(totalProcessedSize),
      sizeSaved: formatBytes(sizeSaved),
      compressionRatio: `${Math.max(0, compressionRatio).toFixed(1)}%`,
    };
  }, [converted, originalFiles]);

  const downloadImagesZip = () => {
    if (converted.length > 0) {
      toast.info(t("toast.downloadStarted"));
      generateZip(converted);
      toast.success(t("toast.downloadComplete"));
    }
  };

  const downloadSelected = () => {
    const selectedImages = convertedWithIds
      .filter((c) => selection.selectedIds.has(c.id))
      .map((c) => c.image);

    if (selectedImages.length > 0) {
      toast.info(t("toast.downloadStarted"));
      generateZip(selectedImages);
      toast.success(t("toast.downloadComplete"));
    }
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    saveToLocalStorage("downloadViewMode", mode);
  };

  // Get original file URL for comparison
  const getOriginalUrl = (index: number): string | null => {
    if (!originalFiles || !originalFiles[index]) return null;
    return URL.createObjectURL(originalFiles[index]);
  };

  return (
    <div className="w-full p-4 space-y-6">
      {converted.length > 0 ? (
        <>
          <h2 className="text-xl font-semibold text-center mb-4">
            {t("downloadResults.convertedFiles")}
          </h2>

          {/* Stats Dashboard */}
          {originalFiles && originalFiles.length > 0 && (
            <StatsDashboard {...stats} compact />
          )}

          {/* Comparison view */}
          {comparisonIndex !== null && originalFiles && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">
                  {t("comparison.title")}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setComparisonIndex(null)}
                >
                  Close
                </Button>
              </div>
              <BeforeAfterSlider
                beforeSrc={getOriginalUrl(comparisonIndex) || ""}
                afterSrc={converted[comparisonIndex]?.image_data || ""}
                beforeSize={originalFiles[comparisonIndex]?.size}
                afterSize={
                  converted[comparisonIndex]
                    ? Math.ceil(
                        ((converted[comparisonIndex].image_data.split(",")[1] ||
                          "").length *
                          3) /
                          4
                      )
                    : undefined
                }
                className="h-64 rounded-lg"
              />
            </div>
          )}

          {viewMode === "grid" ? (
            <ThumbnailGrid
              items={convertedWithIds.map((c) => ({
                id: c.id,
                name: c.image.image_name,
                size: Math.ceil(
                  ((c.image.image_data.split(",")[1] || "").length * 3) / 4
                ),
                thumbnail: c.image.image_data,
                downloadUrl: c.image.image_data,
              }))}
              viewMode={viewMode}
              onViewModeChange={handleViewModeChange}
              selectedIds={selection.selectedIds}
              onSelect={selection.handleClick}
              onSelectAll={selection.selectAll}
              onDeselectAll={selection.deselectAll}
              onPreview={(index) => setPreviewIndex(index)}
              onRemove={() => {}} // No removal for converted
              onRemoveSelected={() => {}}
              showSelectionControls
            />
          ) : (
            <>
              {/* View mode toggle + selection */}
              <ThumbnailGrid
                items={[]}
                viewMode={viewMode}
                onViewModeChange={handleViewModeChange}
                selectedIds={selection.selectedIds}
                onSelect={selection.handleClick}
                onSelectAll={selection.selectAll}
                onDeselectAll={selection.deselectAll}
                onPreview={(index) => setPreviewIndex(index)}
                onRemove={() => {}}
                onRemoveSelected={() => {}}
                showSelectionControls={selection.hasSelection}
              />

              {/* List of converted images */}
              <div className="border rounded-lg p-4 max-h-96 overflow-y-auto space-y-2 bg-card text-card-foreground">
                <ul className="space-y-2">
                  {converted.map((image, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md transition-colors"
                    >
                      <a
                        download={image.image_name}
                        href={image.image_data}
                        title={t("downloadResults.downloadTitle", {
                          fileName: image.image_name,
                        })}
                        className="flex items-center space-x-2 text-sm text-primary hover:underline truncate"
                      >
                        <FileText size={18} className="flex-shrink-0" />
                        <span className="truncate">{image.image_name}</span>
                      </a>
                      <div className="flex items-center space-x-1">
                        {/* Comparison button */}
                        {originalFiles && originalFiles[index] && (
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 p-1"
                            onClick={() =>
                              setComparisonIndex(
                                comparisonIndex === index ? null : index
                              )
                            }
                            title={t("comparison.toggle")}
                          >
                            <SplitSquareHorizontal size={16} />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 p-1 transition-colors duration-150 ease-in-out"
                          onClick={() => setPreviewIndex(index)}
                          title={t("downloadResults.previewTitle", {
                            fileName: image.image_name,
                          })}
                        >
                          <Eye size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 p-1 rounded-full transition-colors duration-150 ease-in-out"
                          asChild
                          title={t("downloadResults.downloadTitle", {
                            fileName: image.image_name,
                          })}
                        >
                          <a
                            download={image.image_name}
                            href={image.image_data}
                          >
                            <Download size={20} />
                          </a>
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {/* Download buttons */}
          <div className="flex gap-2">
            <Button
              onClick={downloadImagesZip}
              disabled={converted.length === 0}
              className="flex-1"
            >
              <Download size={18} className="mr-2" />
              {t("downloadResults.downloadAllZip")}
            </Button>
            {selection.hasSelection && (
              <Button onClick={downloadSelected} variant="outline">
                <Download size={18} className="mr-2" />
                {t("gallery.selected", { count: selection.selectedCount })}
              </Button>
            )}
          </div>

          {/* Preview Modal */}
          {previewIndex !== null && (
            <AdvancedImagePreviewModal
              isOpen={previewIndex !== null}
              onClose={() => setPreviewIndex(null)}
              images={converted.map(
                (img): ModalImageObject => ({
                  src: img.image_data,
                  alt: `Preview of ${img.image_name}`,
                  title: img.image_name,
                })
              )}
              currentIndex={previewIndex}
              onNavigate={(newIndex) => setPreviewIndex(newIndex)}
              onApplyEdit={onApplyEdit}
            />
          )}
        </>
      ) : (
        <div className="text-center text-muted-foreground p-8 border rounded-lg">
          <p>{t("downloadResults.noDownload")}</p>
          <p className="text-sm">{t("downloadResults.processFirst")}</p>
        </div>
      )}
    </div>
  );
};

export default FileRenderDownload;
