import { useState } from "react";

// Import your custom components
import FileRenderDownload, {
  type ConvertedImage as ConvertedImageType,
} from "./components/FileRenderDownload"; // Assuming ConvertedImage is exported
import FileUpload from "./components/FileUpload";
import ConvertAction from "./components/ConvertAction";
// Ensure ConvertedImage type is consistently defined or imported if used by ConvertAction too.
// If ConvertAction also defines/exports it, pick one source of truth.

function App() {
  const [imagesToProcess, setImagesToProcess] = useState<File[]>([]);
  const [convertedImages, setConvertedImages] = useState<ConvertedImageType[]>(
    []
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center p-4 md:p-8 selection:bg-primary selection:text-primary-foreground">
      {/* Main container for content */}
      <div className="container mx-auto max-w-5xl w-full space-y-10">
        <header className="text-center py-8">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-primary">
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
          <section className="bg-card text-card-foreground p-6 rounded-xl shadow-lg lg:sticky lg:top-8 space-y-4">
            <h2 className="text-2xl font-semibold text-center border-b border-border pb-3 mb-4">
              1. Upload Files
            </h2>
            <FileUpload
              setImages={setImagesToProcess}
              setConverted={setConvertedImages}
            />
          </section>

          {/* Column 2: Convert Action */}
          <section className="bg-card text-card-foreground p-6 rounded-xl shadow-lg lg:sticky lg:top-8 space-y-4">
            <h2 className="text-2xl font-semibold text-center border-b border-border pb-3 mb-4">
              2. Process Images
            </h2>
            {imagesToProcess.length > 0 ? (
              <ConvertAction
                images={imagesToProcess}
                setConverted={setConvertedImages}
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
          <section className="bg-card text-card-foreground p-6 rounded-xl shadow-lg lg:sticky lg:top-8 space-y-4">
            <h2 className="text-2xl font-semibold text-center border-b border-border pb-3 mb-4">
              3. Download Results
            </h2>
            <FileRenderDownload converted={convertedImages} />
          </section>
        </main>

        <footer className="text-center py-8 mt-10 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Image Optimizer © {new Date().getFullYear()}. Built with React,
            Vite, TypeScript & Shadcn/ui.
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
