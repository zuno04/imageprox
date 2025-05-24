import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { Download, FileText, Eye } from "lucide-react";
import { generateZip } from "@/lib/jzip";
import AdvancedImagePreviewModal, {
  type ModalImageDisplayInfo,
} from "@/components/modals/AdvancedImagePreviewModal"; // Updated import

// Assuming ConvertedImage type is defined elsewhere (e.g., in ConvertAction.tsx or a shared types file)
// If not, define it here or import it:
export interface ConvertedImage {
  image_name: string;
  image_data: string; // Base64 string
}

interface FileRenderDownloadProps {
  converted: ConvertedImage[];
  onApplyEdit: (editedImage: { newSrc: string; originalIndex: number }) => void; // Made required
}

const FileRenderDownload: React.FC<FileRenderDownloadProps> = ({
  converted,
  onApplyEdit, // Destructure the prop
}) => {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  // Removed temporary handleApplyEditToList

  const downloadImagesZip = () => {
    if (converted.length > 0) {
      generateZip(converted);
    }
  };

  return (
    <div className="w-full md:max-w-md p-4 space-y-6">
      {" "}
      {/* Responsive width and spacing */}
      {converted.length > 0 ? (
        <>
          <h2 className="text-xl font-semibold text-center mb-4">
            Converted Files
          </h2>
          <div className="border rounded-lg p-4 max-h-96 overflow-y-auto space-y-2 bg-card text-card-foreground">
            {/* List of converted images */}
            <ul className="space-y-2">
              {converted.map((image, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md transition-colors"
                >
                  <a
                    download={image.image_name}
                    href={image.image_data}
                    title={`Download ${image.image_name}`}
                    className="flex items-center space-x-2 text-sm text-primary hover:underline truncate"
                  >
                    <FileText size={18} className="flex-shrink-0" />
                    <span className="truncate">{image.image_name}</span>
                  </a>
                  <div className="flex items-center space-x-1"> 
                    {/* DialogTrigger removed */}
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 p-1 transition-colors duration-150 ease-in-out" // Added transition
                      onClick={() => setPreviewIndex(index)} 
                      title={`Preview ${image.image_name}`}
                    >
                      <Eye size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 p-1 rounded-full transition-colors duration-150 ease-in-out" // Added rounded-full and transition
                      asChild
                      title={`Download ${image.image_name}`}
                    >
                      <a download={image.image_name} href={image.image_data}>
                        <Download size={20} />
                      </a>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Download All Button */}
          <Button
            onClick={downloadImagesZip}
            disabled={converted.length === 0}
            className="w-full mt-4" // Ensure it's below the list
          >
            <Download size={18} className="mr-2" />
            Download All as ZIP
          </Button>

          {/* Advanced Image Preview Modal with Navigation */}
          {previewIndex !== null && (
            <AdvancedImagePreviewModal
              isOpen={previewIndex !== null}
              onClose={() => setPreviewIndex(null)}
              images={converted.map(
                (img): ModalImageDisplayInfo => {
                  // For FileRenderDownload, if original details aren't passed,
                  // we use processed for both, and comparison won't show a diff.
                  // Size approximation from base64 length (very rough)
                  const approxSize = img.image_data.length * (3 / 4); // Base64 string length to approximate byte size
                  return {
                    originalSrc: img.image_data,
                    processedSrc: img.image_data,
                    alt: `Preview of ${img.image_name}`,
                    title: img.image_name,
                    originalSize: approxSize,
                    processedSize: approxSize,
                  };
                }
              )}
              currentIndex={previewIndex}
              onNavigate={(newIndex) => setPreviewIndex(newIndex)}
              onApplyEdit={onApplyEdit}
            />
          )}
        </>
      ) : (
        <div className="text-center text-muted-foreground p-8 border rounded-lg">
          <p>No converted images to display or download yet.</p>
          <p className="text-sm">Process some images first!</p>
        </div>
      )}
    </div>
  );
};

export default FileRenderDownload;
