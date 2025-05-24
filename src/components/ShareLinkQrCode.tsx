import React from 'react';
import { QRCodeCanvas } from 'qrcode.react'; // Using Canvas for easier download
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface ShareLinkQrCodeProps {
  shareLink: string;
  fileName: string; // To suggest a download name for the QR code
}

const ShareLinkQrCode: React.FC<ShareLinkQrCodeProps> = ({ shareLink, fileName }) => {
  // Sanitize fileName for use in id and download attributes
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const canvasId = `qr-canvas-${sanitizedFileName}`;

  const downloadQrCode = () => {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas
        .toDataURL('image/png')
        .replace('image/png', 'image/octet-stream'); // Force download
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `QR_for_${sanitizedFileName}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  if (!shareLink) return null;

  return (
    <div className="mt-2 p-3 border rounded-md bg-muted/20 space-y-2 flex flex-col items-center"> {/* Adjusted background and centering */}
      <p className="text-xs font-medium text-center text-foreground/80" title={fileName}> {/* Added title for full name if truncated */}
        Scan for: {sanitizedFileName.length > 20 ? `${sanitizedFileName.substring(0, 17)}...` : sanitizedFileName} {/* Basic truncation */}
      </p>
      <div className="p-2 bg-white rounded-sm inline-block"> {/* Added white background for QR code itself */}
        <QRCodeCanvas 
          id={canvasId} // Unique ID for canvas
          value={shareLink} 
          size={128} 
          bgColor={"#ffffff"} 
          fgColor={"#000000"} 
          level={"L"} 
          includeMargin={true} 
        />
      </div>
      <Button onClick={downloadQrCode} variant="outline" size="sm" className="w-full max-w-[128px] mt-2"> {/* Max width similar to QR */}
        <Download size={16} className="mr-2" />
        Download QR
      </Button>
    </div>
  );
};

export default ShareLinkQrCode;
