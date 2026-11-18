const HEIC_TYPES = new Set([
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
]);

/** HEIC detection by MIME type, falling back to the extension (many OSes report "".) */
export function isHeicFile(file: File): boolean {
  return (
    HEIC_TYPES.has(file.type.toLowerCase().split(";")[0]) ||
    /\.(heic|heif)$/i.test(file.name)
  );
}

export function heicToJpegName(name: string): string {
  return name.replace(/\.(heic|heif)$/i, ".jpg");
}

/**
 * Decodes a HEIC/HEIF file to JPEG. The decoder is imported on demand so the
 * ~1MB WASM payload is only downloaded when someone actually uploads a HEIC.
 */
export async function decodeHeic(file: File): Promise<File> {
  const { default: heic2any } = await import("heic2any");

  const converted = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.92,
  });

  const blob = Array.isArray(converted) ? converted[0] : converted;

  return new File([blob], heicToJpegName(file.name), {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}
