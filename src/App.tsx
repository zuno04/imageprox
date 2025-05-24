import { useState } from "react";

// Import your custom components
import FileRenderDownload, {
  type ConvertedImage as ConvertedImageType,
} from "./components/FileRenderDownload"; // Assuming ConvertedImage is exported
import FileUpload from "./components/FileUpload";
import ConvertAction from "./components/ConvertAction";
// Ensure ConvertedImage type is consistently defined or imported if used by ConvertAction too.
// If ConvertAction also defines/exports it, pick one source of truth.
// import { ThemeToggle } from "./components/ui/ThemeToggle"; // Removed ThemeToggle import
import { Header } from "./components/layout/Header"; // Added Header import
import { Footer } from "./components/layout/Footer"; // Added Footer import
import CloudUploadActions from "./components/CloudUploadActions"; // Import CloudUploadActions

function App() {
  const [imagesToProcess, setImagesToProcess] = useState<File[]>([]);
  const [convertedImages, setConvertedImages] = useState<ConvertedImageType[]>(
    []
  );
  const [
    previousConvertedImagesState,
    setPreviousConvertedImagesState,
  ] = useState<ConvertedImageType[] | null>(null);

  const handleSetConvertedWithHistory = (
    newlyProcessedImages: ConvertedImageType[]
  ) => {
    setPreviousConvertedImagesState(convertedImages); // Save current state before updating
    setConvertedImages(newlyProcessedImages);
  };

  const handleUndoConversion = () => {
    if (previousConvertedImagesState !== null) {
      setConvertedImages(previousConvertedImagesState);
      setPreviousConvertedImagesState(null); // Only one level of undo
    }
  };

  const handleNewFileUpload = (newFiles: File[]) => {
    setImagesToProcess(newFiles);
    setConvertedImages([]); // Clear converted images
    setPreviousConvertedImagesState(null); // Clear undo history
  };

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
          // Optionally, modify the name to indicate it's been edited
          // image_name: `${updatedConverted[originalIndex].image_name}_edited`
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
    let newFileName = originalFile.name;
    // Optionally, modify the name to indicate it's been edited, e.g., prepend "edited_"
    // Ensure to handle potential name collisions or keep it simple.
    newFileName = `edited_${originalFile.name}`;

    try {
      const response = await fetch(newSrc);
      const blob = await response.blob();
      const newFile = new File([blob], newFileName, {
        type: blob.type || originalFile.type, // Use blob's type, fallback to original
        lastModified: new Date().getTime(),
      });

      setImagesToProcess((prevFiles) => {
        const updatedFiles = [...prevFiles];
        updatedFiles[originalIndex] = newFile;
        return updatedFiles;
      });
    } catch (error) {
      console.error("Error converting edited image back to File:", error);
      // Potentially show an error to the user
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center selection:bg-primary selection:text-primary-foreground">
      <Header />
      {/* Main container for content */}
      <div className="container mx-auto max-w-7xl w-full flex-grow p-4 md:p-8 space-y-10">
        <header className="text-center py-4 md:py-8 space-y-4">
          {" "}
          {/* Removed relative positioning and ThemeToggle div */}
          {/* ThemeToggle removed from here */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-primary">
            Client-Side Image Optimizer
          </h1>
          <p className="mt-3 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Upload your images, reduce their size directly in your browser, and
            download them individually or as a ZIP!
          </p>
        </header>

        {/* Main application layout: three columns on larger screens, stacked on smaller */}
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
          {/* Column 1: File Upload */}
          <section className="bg-card text-card-foreground p-6 rounded-lg shadow-lg lg:sticky lg:top-8 space-y-4">
            {" "}
            {/* Changed rounded-xl to rounded-lg */}
            <h2 className="text-2xl font-semibold text-center border-b border-border pb-3 mb-4">
              1. Upload Files
            </h2>
            <FileUpload
              setImages={handleNewFileUpload} // Use the new handler
              // setConverted is not directly called by FileUpload for new uploads in a way that affects history here
              // FileUpload calls setConverted([]) directly, which is fine.
              onApplyEdit={handleApplyEditToUploadFile}
            />
          </section>

          {/* Column 2: Convert Action */}
          <section className="bg-card text-card-foreground p-6 rounded-lg shadow-lg lg:sticky lg:top-8 space-y-4">
            {" "}
            {/* Changed rounded-xl to rounded-lg */}
            <h2 className="text-2xl font-semibold text-center border-b border-border pb-3 mb-4">
              2. Process Images
            </h2>
            {imagesToProcess.length > 0 ? (
              <ConvertAction
                images={imagesToProcess}
                setConverted={handleSetConvertedWithHistory} // Use the history-aware handler
                onUndo={handleUndoConversion}
                canUndo={previousConvertedImagesState !== null}
              />
            ) : (
              <div className="text-center py-10">
                <p className="text-muted-foreground">
                  Upload some images to start processing.
                </p>
              </div>
            )}
          </section>

          {/* Column 3: Download Area */}
          <section className="bg-card text-card-foreground p-6 rounded-lg shadow-lg lg:sticky lg:top-8 space-y-4">
            {" "}
            {/* Changed rounded-xl to rounded-lg */}
            <h2 className="text-2xl font-semibold text-center border-b border-border pb-3 mb-4">
              3. Download Results
            </h2>
            <FileRenderDownload
              converted={convertedImages}
              onApplyEdit={handleApplyEditToConvertedImage} // Pass the handler
            />
          </section>
        </main>

        {/* Section 4: Cloud Upload Actions */}
        {convertedImages.length > 0 && (
          <section className="mt-10">
            <CloudUploadActions convertedImages={convertedImages} />
          </section>
        )}

        {/* Footer removed from here */}
      </div>
      <Footer /> {/* Added Footer component here */}
    </div>
  );
}

export default App;
