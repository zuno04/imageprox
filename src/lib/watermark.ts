import type { WatermarkSettings } from "@/types";

export const DEFAULT_WATERMARK: WatermarkSettings = {
  enabled: false,
  text: "ImageProx",
  position: "bottom-right",
  opacity: 0.7,
  fontSize: 5,
};

const FONT_STACK =
  "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image for watermarking"));
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Unexpected result while reading image"));
    };
    reader.readAsDataURL(blob);
  });

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not decode image for watermarking"));
    image.src = src;
  });

const outputType = (inputType: string): string => {
  if (inputType === "image/png") return "image/png";
  if (inputType === "image/webp") return "image/webp";
  return "image/jpeg";
};

/**
 * Draws a text watermark onto an already-compressed image and re-encodes it in
 * a format the canvas can write. Returns the original blob when disabled.
 */
export async function applyWatermark(
  blob: Blob,
  settings: WatermarkSettings
): Promise<Blob> {
  if (!settings.enabled || !settings.text.trim()) return blob;

  const image = await loadImage(await blobToDataUrl(blob));
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  ctx.drawImage(image, 0, 0);

  const fontSize = Math.max(
    12,
    Math.round((settings.fontSize / 100) * canvas.width)
  );
  const padding = Math.round(canvas.width * 0.03);

  ctx.font = `600 ${fontSize}px ${FONT_STACK}`;
  ctx.globalAlpha = Math.min(1, Math.max(0, settings.opacity));
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0, 0, 0, 0.55)";
  ctx.shadowBlur = Math.round(fontSize * 0.35);

  const textWidth = ctx.measureText(settings.text).width;

  let x = padding;
  let y = canvas.height - padding;

  switch (settings.position) {
    case "top-left":
      break;
    case "top-right":
      x = canvas.width - padding - textWidth;
      break;
    case "center":
      x = (canvas.width - textWidth) / 2;
      y = (canvas.height + fontSize) / 2;
      break;
    case "bottom-left":
      y = canvas.height - padding;
      break;
    case "bottom-right":
    default:
      x = canvas.width - padding - textWidth;
      y = canvas.height - padding;
      break;
  }

  if (settings.position === "top-left" || settings.position === "top-right") {
    y = padding + fontSize;
  }

  ctx.fillText(settings.text, x, y);

  const type = outputType(blob.type);
  const result = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, type, 0.92);
  });

  if (!result) throw new Error("Failed to encode watermarked image");
  return result;
}
