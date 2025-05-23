import React from "react";

import { Button } from "@/components/ui/button"; // Adjust path if needed
import { Download, FileText } from "lucide-react"; // Icons
import { generateZip } from "@/lib/jzip";

// Assuming ConvertedImage type is defined elsewhere (e.g., in ConvertAction.tsx or a shared types file)
// If not, define it here or import it:
export interface ConvertedImage {
  image_name: string;
  image_data: string; // Base64 string
}

interface FileRenderDownloadProps {
  converted: ConvertedImage[];
}

const FileRenderDownload: React.FC<FileRenderDownloadProps> = ({
  converted,
}) => {
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
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild // Allows the Button to act as the <a> tag for download
                    title={`Download ${image.image_name}`}
                  >
                    <a download={image.image_name} href={image.image_data}>
                      <Download size={16} />
                    </a>
                  </Button>
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
