import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import FileRenderDownload from "./components/FileRenderDownload";
import FileUpload from "./components/FileUpload";
import ConvertAction from "./components/ConvertAction";
import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";
import ShortcutsDialog from "./components/help/ShortcutsDialog";
import ProcessingHistory from "./components/history/ProcessingHistory";
import BulkRenamer from "./components/rename/BulkRenamer";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { saveHistoryEntry, createHistoryEntry } from "./lib/storage";
import type { ConvertedImage, ProcessingOptions } from "./types";

function App() {
  const { t } = useTranslation();

  const [imagesToProcess, setImagesToProcess] = useState<File[]>([]);
  const [convertedImages, setConvertedImages] = useState<ConvertedImage[]>([]);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [renamerOpen, setRenamerOpen] = useState(false);

  const handleApplyEditToConvertedImage = ({
    newSrc,
    originalIndex,
  }: {
    newSrc: string;
    originalIndex: number;
  }) => {
    setConvertedImages((prevConverted) => {
      const updatedConverted = [...prevConverted];
      if (updatedConverted[originalIndex]) {
        updatedConverted[originalIndex] = {
          ...updatedConverted[originalIndex],
          image_data: newSrc,
        };
      }
      return updatedConverted;
    });
  };

  const handleApplyEditToUploadFile = async ({
    newSrc,
    originalIndex,
  }: {
    newSrc: string;
    originalIndex: number;
  }) => {
    if (!imagesToProcess[originalIndex]) return;

    const originalFile = imagesToProcess[originalIndex];
    const newFileName = `edited_${originalFile.name}`;

    try {
      const response = await fetch(newSrc);
      const blob = await response.blob();
      const newFile = new File([blob], newFileName, {
        type: blob.type || originalFile.type,
        lastModified: new Date().getTime(),
      });

      setImagesToProcess((prevFiles) => {
        const updatedFiles = [...prevFiles];
        updatedFiles[originalIndex] = newFile;
        return updatedFiles;
      });
    } catch (error) {
      console.error("Error converting edited image back to File:", error);
    }
  };

  const handleProcessingComplete = useCallback(
    (originalFiles: File[], converted: ConvertedImage[]) => {
      // Calculate stats for history
      const totalOriginalSize = originalFiles.reduce(
        (acc, f) => acc + f.size,
        0
      );
      const totalProcessedSize = converted.reduce((acc, img) => {
        const base64 = img.image_data.split(",")[1] || "";
        return acc + Math.ceil((base64.length * 3) / 4);
      }, 0);

      const sizeSaved = Math.max(0, totalOriginalSize - totalProcessedSize);
      const compressionRatio =
        totalOriginalSize > 0
          ? ((totalOriginalSize - totalProcessedSize) / totalOriginalSize) *
            100
          : 0;

      const options: ProcessingOptions = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        outputFormat: "original",
        compressionMode: "lossy",
        keepExif: false,
      };

      const entry = createHistoryEntry(converted.length, options, {
        filesProcessed: converted.length,
        totalOriginalSize,
        totalProcessedSize,
        compressionRatio: Math.max(0, compressionRatio),
        sizeSaved,
      });

      saveHistoryEntry(entry);
    },
    []
  );

  const handleBulkRename = useCallback(
    (renamedFiles: { original: string; renamed: string }[]) => {
      setConvertedImages((prev) =>
        prev.map((img) => {
          const renameInfo = renamedFiles.find(
            (r) => r.original === img.image_name
          );
          if (renameInfo) {
            return { ...img, image_name: renameInfo.renamed };
          }
          return img;
        })
      );
    },
    []
  );

  // Filenames for bulk renamer
  const convertedFilenames = useMemo(
    () => convertedImages.map((img) => img.image_name),
    [convertedImages]
  );

  // Keyboard shortcuts
  useKeyboardShortcuts({
    handlers: useMemo(
      () => ({
        showShortcuts: () => setShortcutsOpen(true),
        escape: () => {
          setShortcutsOpen(false);
          setRenamerOpen(false);
        },
      }),
      []
    ),
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center selection:bg-primary selection:text-primary-foreground">
      <Header />
      <div className="container mx-auto max-w-7xl w-full flex-grow p-4 md:p-8 space-y-10">
        <header className="text-center py-4 md:py-8 space-y-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-primary">
            {t("convertAction.title")}
          </h1>
          <p className="mt-3 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            {t("convertAction.subTitle")}
          </p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
          {/* Column 1: File Upload */}
          <section className="bg-card text-card-foreground p-6 rounded-lg shadow-lg lg:sticky lg:top-8 space-y-4">
            <h2 className="text-2xl font-semibold text-center border-b border-border pb-3 mb-4">
              1. {t("fileUpload.cardTitle")}
            </h2>
            <FileUpload
              setImages={setImagesToProcess}
              setConverted={setConvertedImages}
              onApplyEdit={handleApplyEditToUploadFile}
            />
          </section>

          {/* Column 2: Convert Action */}
          <section className="bg-card text-card-foreground p-6 rounded-lg shadow-lg lg:sticky lg:top-8 space-y-4">
            <h2 className="text-2xl font-semibold text-center border-b border-border pb-3 mb-4">
              2. {t("convertAction.cardTitle")}
            </h2>
            {imagesToProcess.length > 0 ? (
              <ConvertAction
                images={imagesToProcess}
                setConverted={setConvertedImages}
                onProcessingComplete={handleProcessingComplete}
              />
            ) : (
              <div className="text-center py-10">
                <p className="text-muted-foreground">
                  {t("convertAction.uploadImages")}
                </p>
              </div>
            )}

            {/* Processing History */}
            <ProcessingHistory className="mt-6" />
          </section>

          {/* Column 3: Download Area */}
          <section className="bg-card text-card-foreground p-6 rounded-lg shadow-lg lg:sticky lg:top-8 space-y-4">
            <h2 className="text-2xl font-semibold text-center border-b border-border pb-3 mb-4">
              3. {t("downloadResults.cardTitle")}
            </h2>
            <FileRenderDownload
              converted={convertedImages}
              originalFiles={imagesToProcess}
              onApplyEdit={handleApplyEditToConvertedImage}
            />
          </section>
        </main>
      </div>

      <Footer />

      {/* Keyboard Shortcuts Dialog */}
      <ShortcutsDialog
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
      />

      {/* Bulk Renamer Dialog */}
      <BulkRenamer
        open={renamerOpen}
        onOpenChange={setRenamerOpen}
        filenames={convertedFilenames}
        onApply={handleBulkRename}
      />
    </div>
  );
}

export default App;
