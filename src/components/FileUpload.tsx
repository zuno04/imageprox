import React, { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { UploadCloud, XCircle, FileImage, Eye, Link } from "lucide-react";
import AdvancedImagePreviewModal, {
  type ImageObject as ModalImageObject,
} from "@/components/modals/AdvancedImagePreviewModal";
import ThumbnailGrid from "@/components/gallery/ThumbnailGrid";
import DropzoneOverlay from "@/components/upload/DropzoneOverlay";
import UrlImporter from "@/components/upload/UrlImporter";
import { useDropzone } from "@/hooks/useDropzone";
import { useSelection } from "@/hooks/useSelection";
import type { ConvertedImage, ViewMode } from "@/types";
import { loadFromLocalStorage, saveToLocalStorage } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";

interface FileUploadProps {
  setImages: (images: File[]) => void;
  setConverted: (convertedImages: ConvertedImage[]) => void;
  onApplyEdit?: (editedImage: {
    newSrc: string;
    originalIndex: number;
  }) => void;
}

interface FileWithId {
  id: string;
  file: File;
  thumbnail?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  setImages,
  setConverted,
  onApplyEdit,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<FileWithId[]>([]);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>(
    loadFromLocalStorage<ViewMode>("uploadViewMode") || "list"
  );
  const [urlImporterOpen, setUrlImporterOpen] = useState(false);
  const { t } = useTranslation();

  const selection = useSelection(selectedFiles);

  // Generate thumbnail for a file
  const generateThumbnail = useCallback((file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const maxSize = 200;
          let { width, height } = img;

          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL("image/jpeg", 0.7));
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
    });
  }, []);

  const addFiles = useCallback(
    async (newFiles: File[]) => {
      const filesWithIds: FileWithId[] = await Promise.all(
        newFiles.map(async (file) => ({
          id: uuidv4(),
          file,
          thumbnail: await generateThumbnail(file),
        }))
      );

      setSelectedFiles((prev) => {
        const updated = [...prev, ...filesWithIds];
        setImages(updated.map((f) => f.file));
        setConverted([]);
        return updated;
      });
    },
    [generateThumbnail, setImages, setConverted]
  );

  // Enhanced dropzone
  const { isDragActive, getRootProps, getInputProps } = useDropzone({
    onDrop: addFiles,
    accept: ["image/*"],
  });

  const handleUrlImport = useCallback(
    (file: File) => {
      addFiles([file]);
    },
    [addFiles]
  );

  const handleRemoveFile = (indexToRemove: number) => {
    if (previewIndex !== null) {
      if (indexToRemove === previewIndex) {
        handlePreviewClose();
      } else if (indexToRemove < previewIndex) {
        setPreviewIndex((prev) => (prev !== null ? prev - 1 : null));
      }
    }

    setSelectedFiles((prev) => {
      const updated = prev.filter((_, index) => index !== indexToRemove);
      setImages(updated.map((f) => f.file));
      if (updated.length === 0) {
        setConverted([]);
      }
      return updated;
    });
  };

  const handleRemoveSelected = () => {
    const idsToRemove = selection.selectedIds;
    setSelectedFiles((prev) => {
      const updated = prev.filter((f) => !idsToRemove.has(f.id));
      setImages(updated.map((f) => f.file));
      if (updated.length === 0) {
        setConverted([]);
      }
      return updated;
    });
    selection.deselectAll();
    if (previewIndex !== null) {
      handlePreviewClose();
    }
  };

  const handlePreviewOpen = (index: number) => {
    if (index < 0 || index >= selectedFiles.length) {
      handlePreviewClose();
      return;
    }
    const fileToPreview = selectedFiles[index].file;
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    const newPreviewUrl = URL.createObjectURL(fileToPreview);
    setPreviewUrl(newPreviewUrl);
    setPreviewIndex(index);
  };

  const handlePreviewClose = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
    }
    setPreviewIndex(null);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    saveToLocalStorage("uploadViewMode", mode);
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className="w-full p-4 space-y-6" {...getRootProps()}>
      {/* Full-page dropzone overlay */}
      <DropzoneOverlay isActive={isDragActive} />

      {/* Upload area */}
      <div>
        <Label
          htmlFor="file-upload"
          className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted/50 transition-colors"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
            <p className="mb-2 text-sm text-muted-foreground">
              <span className="font-semibold text-primary">
                {t("fileUpload.clickToUpload")}
              </span>{" "}
              {t("fileUpload.dragAndDrop")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("fileUpload.imageTypes")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("fileUpload.pasteHint")}
            </p>
          </div>
          <input
            {...getInputProps()}
            id="file-upload"
            className="hidden"
          />
        </Label>

        {/* URL import button */}
        <div className="flex justify-center mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setUrlImporterOpen(true);
            }}
            className="text-xs text-muted-foreground"
          >
            <Link size={14} className="mr-1" />
            {t("fileUpload.urlImport")}
          </Button>
        </div>
      </div>

      {/* File list / grid */}
      {selectedFiles.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-center text-foreground">
            {t("fileUpload.selectedFiles", {
              count: selectedFiles.length,
            })}
          </p>

          {viewMode === "grid" ? (
            <ThumbnailGrid
              items={selectedFiles.map((f) => ({
                id: f.id,
                name: f.file.name,
                size: f.file.size,
                thumbnail: f.thumbnail,
              }))}
              viewMode={viewMode}
              onViewModeChange={handleViewModeChange}
              selectedIds={selection.selectedIds}
              onSelect={selection.handleClick}
              onSelectAll={selection.selectAll}
              onDeselectAll={selection.deselectAll}
              onPreview={handlePreviewOpen}
              onRemove={handleRemoveFile}
              onRemoveSelected={handleRemoveSelected}
            />
          ) : (
            <>
              {/* View mode toggle */}
              <ThumbnailGrid
                items={[]}
                viewMode={viewMode}
                onViewModeChange={handleViewModeChange}
                selectedIds={selection.selectedIds}
                onSelect={selection.handleClick}
                onSelectAll={selection.selectAll}
                onDeselectAll={selection.deselectAll}
                onPreview={handlePreviewOpen}
                onRemove={handleRemoveFile}
                onRemoveSelected={handleRemoveSelected}
                showSelectionControls={selection.hasSelection}
              />

              {/* List view */}
              <div className="border rounded-lg p-3 max-h-60 overflow-y-auto bg-card">
                <ul className="space-y-2">
                  {selectedFiles.map((fileItem, index) => (
                    <li
                      key={fileItem.id}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors duration-150 ease-in-out"
                    >
                      <div className="flex items-center space-x-2 truncate">
                        {fileItem.thumbnail ? (
                          <img
                            src={fileItem.thumbnail}
                            alt={fileItem.file.name}
                            className="w-8 h-8 rounded object-cover flex-shrink-0"
                          />
                        ) : (
                          <FileImage
                            size={18}
                            className="text-muted-foreground flex-shrink-0"
                          />
                        )}
                        <span
                          className="text-sm truncate text-foreground"
                          title={fileItem.file.name}
                        >
                          {fileItem.file.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({(fileItem.file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 p-1 transition-colors duration-150 ease-in-out"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreviewOpen(index);
                          }}
                          title={t("fileUpload.previewTitle", {
                            fileName: fileItem.file.name,
                          })}
                        >
                          <Eye size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive/80 h-8 w-8 p-1 rounded-full transition-colors duration-150 ease-in-out"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFile(index);
                          }}
                          title={t("fileUpload.removeTitle", {
                            fileName: fileItem.file.name,
                          })}
                        >
                          <XCircle size={20} />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      )}

      {/* URL Importer Dialog */}
      <UrlImporter
        open={urlImporterOpen}
        onOpenChange={setUrlImporterOpen}
        onImport={handleUrlImport}
      />

      {/* Preview Modal */}
      {previewIndex !== null && selectedFiles[previewIndex] && (
        <AdvancedImagePreviewModal
          isOpen={previewIndex !== null && !!previewUrl}
          onClose={handlePreviewClose}
          images={selectedFiles.map(
            (fileItem): ModalImageObject => ({
              src: "",
              alt: t("fileUpload.previewAlt", {
                fileName: fileItem.file.name,
              }),
              title: fileItem.file.name,
            })
          )}
          currentIndex={previewIndex}
          onNavigate={(newIndex) => handlePreviewOpen(newIndex)}
          imageOverrideSrc={previewUrl}
          onApplyEdit={onApplyEdit}
        />
      )}
    </div>
  );
};

export default FileUpload;
