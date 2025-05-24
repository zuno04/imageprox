# ImageProx - Client-Side Image Optimizer & Editor

ImageProx is a powerful, browser-based image optimization and editing tool. It allows users to upload images, compress them with configurable settings, perform basic edits, and download them individually or as a batch—all directly in the browser, ensuring privacy and speed.

## Features

- **Client-Side Processing:** All image manipulations happen directly in your browser. No data is sent to a server.
- **Multiple Image Upload:** Upload one or more images to process.
- **Image Compression:**
  - Reduce image file sizes significantly.
  - **Configurable Settings:** Adjust "Max Size (MB)" and "Max Width/Height (px)" to control the compression level. These settings are saved to LocalStorage.
- **Download Options:**
  - Download processed images individually.
  - Download all processed images as a single ZIP file.
- **Advanced Image Preview Modal:**
  - **Zoom:** Zoom in and out using buttons or the mouse wheel. Zoom level is saved to LocalStorage.
  - **View Rotation:** Rotate the image view by 90-degree increments.
  - **Image Navigation:** Navigate between multiple images in a set using "Next"/"Previous" buttons or keyboard arrow keys.
  - **Download from Preview:** Download the currently previewed image directly from the modal.
  - **Keyboard Shortcuts:**
    - `Esc`: Close the preview modal.
    - `ArrowRight`: View next image.
    - `ArrowLeft`: View previous image.
- **Basic Image Editing (In-Preview):**
  - **Rotate Image Data:** Permanently rotate the image data by 90 degrees clockwise.
  - **Grayscale Filter:** Apply a grayscale filter to the image data.
  - **Apply Edits:** Save these edits back to the image list (for both uploaded and converted images).
- **Theme Customization:**
  - **Light/Dark Mode:** Switch between light and dark themes. Theme preference is saved to LocalStorage.
- **Responsive UI:** Designed to work effectively across various screen sizes, from mobile to desktop.
- **User Feedback:** A "Send Feedback" link in the footer for easy communication.
- **Persistence:** User preferences for theme, zoom level (in preview), and compression settings are saved locally using LocalStorage.

## Tech Stack

- **Framework/Library:** React (with Vite)
- **Language:** TypeScript
- **UI Components:** Shadcn UI
- **Styling:** Tailwind CSS
- **Theming:** `next-themes`
- **Client-Side Compression:** `browser-image-compression`
- **ZIP Functionality:** `jszip`
- **Icons:** `lucide-react`
- **Build Tool:** Vite

## Setup and Usage

### Prerequisites

- Node.js (version 18.x or later recommended)
- pnpm (or npm/yarn)

### Installation

1.  **Clone the repository (if applicable):**

    ```bash
    # git clone <repository-url>
    # cd <repository-directory>
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

### Running the Development Server

1.  **Start the Vite dev server:**
    ```bash
    pnpm dev
    ```
2.  Open your browser and navigate to the URL provided (usually `http://localhost:5173`).

### How to Use

1.  **Upload Images:** Drag and drop images onto the designated area, or click to select files.
2.  **Preview Uploaded Images:** Click the "eye" icon next to an uploaded file to open the advanced preview modal.
    - Inside the modal, use controls for zoom, view rotation, or perform edits like data rotation and grayscale.
    - If edits are made, click the "Save" (Apply Edits) icon to update the file in the upload list.
3.  **Configure Compression (Optional):** Adjust the "Max Size (MB)" and "Max Width/Height (px)" settings in the "Process Images" section. These settings will be saved for your next session.
4.  **Process Images:** Click the "Convert" button.
5.  **Preview and Download Converted Images:**
    - Click the "eye" icon next to a converted file to preview it with zoom, rotation, and editing tools.
    - Edits made to converted images can also be "applied," updating the version in the download list.
    - Download individual images using the download icon next to each file or from within the preview modal.
    - Download all converted images as a ZIP file using the "Download All as ZIP" button.
6.  **Toggle Theme:** Use the theme switcher (sun/moon icon) in the header to change between light and dark modes.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests. (Further details can be added here if the project becomes open source).

## License

This project is currently under a private license. (Or specify MIT, Apache 2.0, etc., if applicable).
