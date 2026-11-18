import type { ConvertedImage } from "@/types";

const CARD_WIDTH = 1200;
const CARD_HEIGHT = 630;

const BRAND_FONT =
  "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/**
 * Converts a base64 data URL into a File so it can be handed to the Web Share API.
 */
export function dataUrlToFile(dataUrl: string, fileName: string): File {
  const [header, payload = ""] = dataUrl.split(",");
  const mime = /data:([^;]+);/.exec(`${header},`)?.[1] ?? "image/png";
  const binary = atob(payload);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new File([bytes], fileName, {
    type: mime,
    lastModified: Date.now(),
  });
}

export function convertedImagesToFiles(images: ConvertedImage[]): File[] {
  return images.map((image) => dataUrlToFile(image.image_data, image.image_name));
}

export type ShareOutcome = "shared" | "cancelled" | "unsupported";

/**
 * Share-level capability check. `canShare` must be probed with the actual payload,
 * because a browser can support `share()` while rejecting file sharing.
 */
export function canShareFiles(files: File[]): boolean {
  if (typeof navigator === "undefined" || typeof navigator.canShare !== "function") {
    return false;
  }
  try {
    return navigator.canShare({ files });
  } catch {
    return false;
  }
}

export async function shareFiles(
  files: File[],
  title: string,
  text?: string
): Promise<ShareOutcome> {
  if (!canShareFiles(files)) return "unsupported";

  try {
    await navigator.share({ files, title, text });
    return "shared";
  } catch (error) {
    // Cancelling the share sheet is a normal user choice, not a failure.
    if (error instanceof DOMException && error.name === "AbortError") {
      return "cancelled";
    }
    return "unsupported";
  }
}

export interface SavingsCardInput {
  ratioPercent: number;
  originalSize: string;
  processedSize: string;
  origin: string;
  tagline: string;
}

/**
 * Renders a 1200x630 share card summarising a compression run, the standard
 * large-card aspect ratio, so it can be posted directly to social feeds.
 */
export async function buildSavingsCard({
  ratioPercent,
  originalSize,
  processedSize,
  origin,
  tagline,
}: SavingsCardInput): Promise<File> {
  const canvas = document.createElement("canvas");
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  const gradient = ctx.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT);
  gradient.addColorStop(0, "#4f46e5");
  gradient.addColorStop(1, "#9333ea");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  const glow = ctx.createRadialGradient(
    CARD_WIDTH * 0.82,
    CARD_HEIGHT * 0.12,
    0,
    CARD_WIDTH * 0.82,
    CARD_HEIGHT * 0.12,
    540
  );
  glow.addColorStop(0, "rgba(255, 255, 255, 0.22)");
  glow.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  ctx.fillStyle = "rgba(255, 255, 255, 0.86)";
  ctx.font = `600 34px ${BRAND_FONT}`;
  ctx.fillText("ImageProx", 72, 96);

  ctx.fillStyle = "#ffffff";
  ctx.font = `800 196px ${BRAND_FONT}`;
  ctx.fillText(`-${Math.max(0, Math.round(ratioPercent))}%`, 60, 328);

  ctx.fillStyle = "rgba(255, 255, 255, 0.94)";
  ctx.font = `500 50px ${BRAND_FONT}`;
  ctx.fillText(`${originalSize} → ${processedSize}`, 72, 418);

  ctx.fillStyle = "rgba(255, 255, 255, 0.82)";
  ctx.font = `400 32px ${BRAND_FONT}`;
  ctx.fillText(tagline, 72, 498);

  ctx.fillStyle = "rgba(255, 255, 255, 0.68)";
  ctx.font = `500 28px ${BRAND_FONT}`;
  ctx.fillText(origin, 72, 566);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/png");
  });
  if (!blob) throw new Error("Failed to encode the savings card");

  return new File([blob], "imageprox-savings.png", {
    type: "image/png",
    lastModified: Date.now(),
  });
}
