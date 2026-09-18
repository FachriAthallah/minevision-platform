export const MAX_MEDIA_BYTES = 10 * 1024 * 1024;

export function detectImageMime(bytes: Uint8Array | ArrayBuffer): string | null {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);

  if (view.length >= 8 && view[0] === 0x89 && view[1] === 0x50 && view[2] === 0x4e && view[3] === 0x47) {
    return "image/png";
  }
  if (view.length >= 3 && view[0] === 0xff && view[1] === 0xd8 && view[2] === 0xff) {
    return "image/jpeg";
  }
  if (view.length >= 12 && view[0] === 0x52 && view[1] === 0x49 && view[2] === 0x46 && view[3] === 0x46 && view[8] === 0x57 && view[9] === 0x45 && view[10] === 0x42 && view[11] === 0x50) {
    return "image/webp";
  }
  return null;
}