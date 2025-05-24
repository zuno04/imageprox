// src/components/FileUpload.tsx (or your preferred path)
import React, { useState, type ChangeEvent, useEffect } from "react"; 
import { Button } from "@/components/ui/button"; 
import { Label } from "@/components/ui/label"; 
import { UploadCloud, XCircle, FileImage, Eye } from "lucide-react"; 
import AdvancedImagePreviewModal, { type ImageObject as ModalImageObject } from '@/components/modals/AdvancedImagePreviewModal'; // Import type

// Assuming ConvertedImage is defined elsewhere (e.g. in a shared types file or FileRenderDownload.tsx)
// If not, define it or import it. This prop is used to clear previous results.
export interface ConvertedImage {
  image_name: string;
  image_data: string;
}

interface FileUploadProps {
  setImages: (images: File[]) => void;
  setConverted: (convertedImages: ConvertedImage[]) => void; 
  onApplyEdit?: (editedImage: { newSrc: string; originalIndex: number }) => void; // Add this
}

const FileUpload: React.FC<FileUploadProps> = ({ setImages, setConverted, onApplyEdit }) => { // Destructure onApplyEdit
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null); 
  const [previewUrl, setPreviewUrl] = useState<string>(""); 

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFilesArray = Array.from(event.target.files);
      setSelectedFiles(newFilesArray);
      setImages(newFilesArray);
      setConverted([]); // Clear any previously converted images
    }
  };

  const handleRemoveFile = (indexToRemove: number) => {
    const fileNameToRemove = selectedFiles[indexToRemove]?.name;
    
    if (previewIndex !== null) {
      if (indexToRemove === previewIndex) {
        // Closing preview if the currently previewed item is removed
        handlePreviewClose(); 
      } else if (indexToRemove < previewIndex) {
        // Adjust previewIndex if an item before it is removed
        setPreviewIndex(prev => (prev !== null ? prev - 1 : null));
      }
    }

    const updatedFiles = selectedFiles.filter((_, index) => index !== indexToRemove);
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
              (file): ModalImageObject => ({
                src: '', // Placeholder, actual src is via imageOverrideSrc
                alt: `Preview of ${file.name}`,
                title: file.name,
              })
            )}
            currentIndex={previewIndex}
            onNavigate={(newIndex) => handlePreviewOpen(newIndex)}
            imageOverrideSrc={previewUrl}
            onApplyEdit={onApplyEdit} // Pass down the prop
          />
      )}
    </div>
  );
};

export default FileUpload;
