import JSZip from "jszip";
import { saveAs } from "file-saver";

// Define the expected structure for the image objects
// This should match the ConvertedImage interface used elsewhere
export interface ImageToZip {
  image_name: string;
  image_data: string; // Base64 string (e.g., "data:image/png;base64,iVBORw0KGgo...")
}

export const generateZip = (images: ImageToZip[]): void => {
  if (!images || images.length === 0) {
    console.warn("No images provided to generate ZIP.");
    return;
  }

  const zip = new JSZip();

  const downloadZip = () => {
    zip
      .generateAsync({ type: "blob" })
      .then((blob) => {
        saveAs(blob, "converted_images.zip");
      })
      .catch((error) => {
        console.error("Error generating ZIP file:", error);
        // Optionally, display an error to the user here
      });
  };

  for (const image of images) {
    if (!image.image_name || typeof image.image_data !== "string") {
      console.warn("Skipping invalid image object:", image);
      continue;
    }

    // Remove the Base64 prefix (e.g., "data:image/png;base64,")
    const base64Data = image.image_data.replace(/^data:image\/\w+;base64,/, "");

    try {
      // Decode Base64 string to binary data
      // atob can throw an error if the string is not correctly Base64 encoded
      const binaryData = atob(base64Data);

      // Add file to zip
      // Note: JSZip's .file() method can take binary string directly,
      // but it's often better to convert to Uint8Array for broader compatibility
      // and to avoid potential encoding issues with atob's output directly.
      const arrayBuffer = new ArrayBuffer(binaryData.length);
      const uint8Array = new Uint8Array(arrayBuffer);
      for (let i = 0; i < binaryData.length; i++) {
        uint8Array[i] = binaryData.charCodeAt(i);
      }

      zip.file(image.image_name, uint8Array, { binary: true });
    } catch (error) {
      console.error(
        `Error processing image ${image.image_name} for ZIP:`,
        error
      );
      // Optionally, skip this file or notify the user
    }
  }

  // It's generally not the responsibility of this utility function to clear the input array.
  // The calling component should manage its own state.
  // If you intend for `images` to be cleared, the caller should do it.
  // For example:
  // generateZip(myImages);
  // setMyImages([]); // Caller clears its state

  downloadZip();
};
