// src/components/FileUpload.tsx (or your preferred path)
import React, { useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button"; // For the remove button
import { Label } from "@/components/ui/label"; // Optional: for Shadcn styled label
import { UploadCloud, XCircle, FileImage } from "lucide-react"; // Icons

// Assuming ConvertedImage is defined elsewhere (e.g. in a shared types file or FileRenderDownload.tsx)
// If not, define it or import it. This prop is used to clear previous results.
export interface ConvertedImage {
  image_name: string;
  image_data: string;
}

interface FileUploadProps {
  setImages: (images: File[]) => void;
  setConverted: (convertedImages: ConvertedImage[]) => void; // To clear previous conversions
}

const FileUpload: React.FC<FileUploadProps> = ({ setImages, setConverted }) => {
  // We'll store the File objects directly. The `name` is a property of File.
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFilesArray = Array.from(event.target.files);
      setSelectedFiles(newFilesArray);
      setImages(newFilesArray);
      setConverted([]); // Clear any previously converted images
    }
  };

  const handleRemoveFile = (fileNameToRemove: string) => {
    const updatedFiles = selectedFiles.filter(
      (file) => file.name !== fileNameToRemove
    );
    setSelectedFiles(updatedFiles);
    setImages(updatedFiles);
    if (updatedFiles.length === 0) {
      setConverted([]); // Also clear converted if no files are left
    }
  };

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
                  className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50"
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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive/80 h-7 w-7"
                    onClick={() => handleRemoveFile(file.name)}
                    title={`Remove ${file.name}`}
                  >
                    <XCircle size={18} />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
