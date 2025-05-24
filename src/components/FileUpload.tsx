// src/components/FileUpload.tsx (or your preferred path)
import React, { useState, type ChangeEvent, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { UploadCloud, XCircle, FileImage, Eye } from "lucide-react";
import AdvancedImagePreviewModal, {
  type ModalImageDisplayInfo,
} from "@/components/modals/AdvancedImagePreviewModal"; // Updated import

// Assuming ConvertedImage is defined elsewhere (e.g. in a shared types file or FileRenderDownload.tsx)
// If not, define it or import it. This prop is used to clear previous results.
export interface ConvertedImage {
  image_name: string;
  image_data: string;
}

interface FileUploadProps {
  setImages: (images: File[]) => void;
  setConverted: (convertedImages: ConvertedImage[]) => void;
  onApplyEdit?: (editedImage: {
    newSrc: string;
    originalIndex: number;
  }) => void; // Add this
}

const FileUpload: React.FC<FileUploadProps> = ({
  setImages,
  setConverted,
  onApplyEdit,
}) => {
  // Destructure onApplyEdit
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  // Function to recursively scan directory for image files
  // Function to recursively scan directory for image files
  const scanDirectoryFiles = async (
    directoryEntry: FileSystemDirectoryEntry
  ): Promise<File[]> => {
    const reader = directoryEntry.createReader();
    let allEntries: FileSystemEntry[] = [];

    // Read all entries from the directory
    await new Promise<void>((resolve, reject) => {
      const readBatch = () => {
        reader.readEntries((entries) => {
          if (entries.length === 0) {
            resolve();
          } else {
            allEntries = allEntries.concat(entries);
            readBatch(); // Read next batch
          }
        }, reject);
      };
      readBatch();
    });

    const filePromises: Promise<File | null>[] = [];
    const directoryPromises: Promise<File[]>[] = [];

    for (const entry of allEntries) {
      if (entry.isFile) {
        filePromises.push(
          new Promise<File | null>((resolve, reject) => {
            (entry as FileSystemFileEntry).file((file) => {
              if (file.type.startsWith("image/")) {
                resolve(file);
              } else {
                resolve(null); // Not an image file
              }
            }, reject);
          })
        );
      } else if (entry.isDirectory) {
        directoryPromises.push(
          scanDirectoryFiles(entry as FileSystemDirectoryEntry)
        );
      }
    }

    const files = (await Promise.all(filePromises)).filter(
      (file): file is File => file !== null
    );
    const filesFromSubdirectories = (await Promise.all(directoryPromises)).flat();

    return [...files, ...filesFromSubdirectories];
  };

  // Helper function to update state with new files
  const addFilesToState = (newFiles: File[]) => {
    if (newFiles.length > 0) {
      const uniqueNewFiles = newFiles.filter(
        (newFile) =>
          !selectedFiles.some(
            (existingFile) =>
              existingFile.name === newFile.name &&
              existingFile.size === newFile.size &&
              existingFile.lastModified === newFile.lastModified
          )
      );

      if (uniqueNewFiles.length > 0) {
        setSelectedFiles((prevFiles) => [...prevFiles, ...uniqueNewFiles]);
        setImages((prevFiles) => [...prevFiles, ...uniqueNewFiles]);
        setConverted([]); // Clear any previously converted images
      }
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFilesArray = Array.from(event.target.files).filter((file) =>
        file.type.startsWith("image/")
      );
      addFilesToState(newFilesArray);
    }
  };

  const handleDrop = async (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const items = event.dataTransfer.items;
    let collectedFiles: File[] = [];

    if (items) {
      const filePromises: Promise<File | null>[] = [];
      const directoryScanPromises: Promise<File[]>[] = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === "file") {
          const entry = item.webkitGetAsEntry();
          if (entry) {
            if (entry.isFile) {
              filePromises.push(
                new Promise<File | null>((resolve, reject) => {
                  (entry as FileSystemFileEntry).file((file) => {
                    if (file.type.startsWith("image/")) {
                      resolve(file);
                    } else {
                      resolve(null);
                    }
                  }, reject);
                })
              );
            } else if (entry.isDirectory) {
              directoryScanPromises.push(
                scanDirectoryFiles(entry as FileSystemDirectoryEntry)
              );
            }
          } else {
            // Fallback for browsers that don't support webkitGetAsEntry
            const file = item.getAsFile();
            if (file && file.type.startsWith("image/")) {
              collectedFiles.push(file); // Add directly if it's a file
            }
          }
        }
      }

      const regularFiles = (await Promise.all(filePromises)).filter(
        (file): file is File => file !== null
      );
      const filesFromDirectories = (
        await Promise.all(directoryScanPromises)
      ).flat();
      collectedFiles = [
        ...collectedFiles,
        ...regularFiles,
        ...filesFromDirectories,
      ];
    } else {
      // Fallback for browsers that don't support items (e.g., older Firefox)
      const files = event.dataTransfer.files;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Note: Cannot check for directories here with DataTransfer.files
        if (file.type.startsWith("image/")) {
          collectedFiles.push(file);
        }
      }
    }

    if (collectedFiles.length > 0) {
      addFilesToState(collectedFiles);
    }
  };

  const handleRemoveFile = (indexToRemove: number) => {
    // const fileNameToRemove = selectedFiles[indexToRemove]?.name;

    if (previewIndex !== null) {
      if (indexToRemove === previewIndex) {
        // Closing preview if the currently previewed item is removed
        handlePreviewClose();
      } else if (indexToRemove < previewIndex) {
        // Adjust previewIndex if an item before it is removed
        setPreviewIndex((prev) => (prev !== null ? prev - 1 : null));
      }
    }

    const updatedFiles = selectedFiles.filter(
      (_, index) => index !== indexToRemove
    );
    setSelectedFiles(updatedFiles);
    setImages(updatedFiles);
    if (updatedFiles.length === 0) {
      setConverted([]);
    }
  };

  const handlePreviewOpen = (index: number) => {
    if (index < 0 || index >= selectedFiles.length) {
      handlePreviewClose(); // Close if index is out of bounds
      return;
    }
    const fileToPreview = selectedFiles[index];
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

  // Effect for cleanup on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className="w-full md:max-w-md p-4 space-y-6">
      {" "}
      {/* Responsive width and spacing */}
      {/* Custom File Upload Input */}
      <div>
        <Label
          htmlFor="file-upload"
          className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted/50 transition-colors"
          onDrop={handleDrop}
          onDragOver={(event) => event.preventDefault()}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
            <p className="mb-2 text-sm text-muted-foreground">
              <span className="font-semibold text-primary">
                Click to upload
              </span>{" "}
              or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">
              Images (PNG, JPG, GIF, WEBP etc.)
            </p>
          </div>
          <input
            id="file-upload"
            type="file"
            className="hidden" // Hide the default input
            onChange={handleFileChange}
            multiple
            accept="image/*" // Specify that only image files are accepted
          />
        </Label>
      </div>
      {/* Uploaded image area */}
      {selectedFiles.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-center text-foreground">
            Selected files ({selectedFiles.length}):
          </p>
          <div className="border rounded-lg p-3 max-h-60 overflow-y-auto bg-card">
            <ul className="space-y-2">
              {selectedFiles.map((file, index) => (
                <li
                  key={`${file.name}-${index}`} // More unique key
                  className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors duration-150 ease-in-out" // Added transition
                >
                  <div className="flex items-center space-x-2 truncate">
                    <FileImage
                      size={18}
                      className="text-muted-foreground flex-shrink-0"
                    />
                    <span
                      className="text-sm truncate text-foreground"
                      title={file.name}
                    >
                      {file.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {/* DialogTrigger removed */}
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 p-1 transition-colors duration-150 ease-in-out" // Added transition
                      onClick={() => handlePreviewOpen(index)}
                      title={`Preview ${file.name}`}
                    >
                      <Eye size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive/80 h-8 w-8 p-1 rounded-full transition-colors duration-150 ease-in-out" // Added rounded-full and transition
                      onClick={() => handleRemoveFile(index)}
                      title={`Remove ${file.name}`}
                    >
                      <XCircle size={20} />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {/* Advanced Image Preview Modal with Navigation for Uploaded Files */}
      {previewIndex !== null && selectedFiles[previewIndex] && (
        <AdvancedImagePreviewModal
          isOpen={previewIndex !== null && !!previewUrl}
          onClose={handlePreviewClose}
          images={selectedFiles.map(
            (file, index): ModalImageDisplayInfo => {
              // For the currently active preview, its URL is already in previewUrl
              // For others, we might need to create them on-demand if modal preloads,
              // but for now, only the current one needs a guaranteed immediate src.
              // The modal itself will use currentImage.originalSrc.
              // If previewUrl is specifically for selectedFiles[previewIndex], use it.
              const src = (index === previewIndex && previewUrl) ? previewUrl : URL.createObjectURL(file);
              // In FileUpload, original and processed are the same before conversion.
              return {
                originalSrc: src,
                processedSrc: src, // Same as original before any processing
                alt: `Preview of ${file.name}`,
                title: file.name,
                originalSize: file.size,
                processedSize: file.size, // Same as original before any processing
              };
            }
          )}
          currentIndex={previewIndex}
          onNavigate={(newIndex) => {
            // When navigating, the new previewUrl will be set by handlePreviewOpen
            handlePreviewOpen(newIndex);
          }}
          // imageOverrideSrc={previewUrl} // Removed, handled by ModalImageDisplayInfo
          onApplyEdit={onApplyEdit}
        />
      )}
    </div>
  );
};

export default FileUpload;
