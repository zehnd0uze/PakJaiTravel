/**
 * Facebook-style HD Photo Compression
 * - Preserves up to 2048px (2K HD) on the longest edge
 * - Uses multi-step high-quality downsampling to keep fine details sharp
 * - Targets ~350KB–650KB per photo using WebP (with JPEG fallback)
 */

export interface CompressOptions {
  /** Longest edge in pixels (Facebook HD standard is 2048px) */
  maxDimension?: number;
  /** Target maximum file size in bytes (default: 650 KB) */
  targetMaxBytes?: number;
  /** Initial encoder quality (0–1, default: 0.88) */
  initialQuality?: number;
}

type MarkedFile = File & { __pakjaiHdCompressed?: boolean };

const SKIP_BELOW_BYTES = 450 * 1024; // 450 KB
const DEFAULT_MAX_DIMENSION = 2048;
const DEFAULT_TARGET_MAX_BYTES = 650 * 1024; // 650 KB target (like Facebook HD)
const MIN_QUALITY = 0.68;

const canvasToBlob = (
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number
): Promise<Blob | null> =>
  new Promise(resolve => {
    try {
      canvas.toBlob(blob => resolve(blob), mimeType, quality);
    } catch {
      resolve(null);
    }
  });

/**
 * Progressive 2x halving downscale before final target draw.
 * Prevents aliasing/stair-stepping when shrinking 12MP–48MP phone photos to 2048px.
 */
const drawHighQualityScaled = (
  img: HTMLImageElement,
  targetWidth: number,
  targetHeight: number
): HTMLCanvasElement => {
  let curWidth = img.naturalWidth || img.width;
  let curHeight = img.naturalHeight || img.height;

  let stepCanvas = document.createElement('canvas');
  let stepCtx = stepCanvas.getContext('2d');

  if (curWidth > targetWidth * 2 || curHeight > targetHeight * 2) {
    let halfW = Math.max(targetWidth, Math.round(curWidth * 0.5));
    let halfH = Math.max(targetHeight, Math.round(curHeight * 0.5));
    stepCanvas.width = halfW;
    stepCanvas.height = halfH;
    if (stepCtx) {
      stepCtx.imageSmoothingEnabled = true;
      stepCtx.imageSmoothingQuality = 'high';
      stepCtx.drawImage(img, 0, 0, halfW, halfH);
    }
    curWidth = halfW;
    curHeight = halfH;

    while (curWidth > targetWidth * 2 || curHeight > targetHeight * 2) {
      halfW = Math.max(targetWidth, Math.round(curWidth * 0.5));
      halfH = Math.max(targetHeight, Math.round(curHeight * 0.5));
      const nextCanvas = document.createElement('canvas');
      nextCanvas.width = halfW;
      nextCanvas.height = halfH;
      const nextCtx = nextCanvas.getContext('2d');
      if (nextCtx) {
        nextCtx.imageSmoothingEnabled = true;
        nextCtx.imageSmoothingQuality = 'high';
        nextCtx.drawImage(stepCanvas, 0, 0, curWidth, curHeight, 0, 0, halfW, halfH);
      }
      stepCanvas = nextCanvas;
      stepCtx = nextCtx;
      curWidth = halfW;
      curHeight = halfH;
    }

    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = targetWidth;
    finalCanvas.height = targetHeight;
    const finalCtx = finalCanvas.getContext('2d');
    if (finalCtx) {
      finalCtx.imageSmoothingEnabled = true;
      finalCtx.imageSmoothingQuality = 'high';
      finalCtx.drawImage(stepCanvas, 0, 0, curWidth, curHeight, 0, 0, targetWidth, targetHeight);
    }
    return finalCanvas;
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
  }
  return canvas;
};

export const compressImage = async (
  file: File,
  options: CompressOptions = {}
): Promise<File> => {
  // Never double-compress an already-processed file
  if ((file as MarkedFile).__pakjaiHdCompressed) {
    return file;
  }

  // Animated GIFs should not be flattened to a static canvas
  if (file.type === 'image/gif' && file.size <= 2 * 1024 * 1024) {
    return file;
  }

  const maxDimension = options.maxDimension ?? DEFAULT_MAX_DIMENSION;
  const targetMaxBytes = options.targetMaxBytes ?? DEFAULT_TARGET_MAX_BYTES;
  const startQuality = options.initialQuality ?? 0.88;

  return new Promise(resolve => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = async () => {
      URL.revokeObjectURL(objectUrl);

      const origW = img.naturalWidth || img.width;
      const origH = img.naturalHeight || img.height;

      // If already compact and within 2048px HD bounds, keep original
      if (file.size <= SKIP_BELOW_BYTES && origW <= maxDimension && origH <= maxDimension) {
        const marked = file as MarkedFile;
        marked.__pakjaiHdCompressed = true;
        resolve(marked);
        return;
      }

      let width = origW;
      let height = origH;

      if (width > height) {
        if (width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        }
      } else if (height > maxDimension) {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }

      const canvas = drawHighQualityScaled(img, width, height);

      // Prefer WebP for sharper HD detail at smaller byte sizes; fall back to JPEG
      let mimeType = 'image/webp';
      let ext = '.webp';
      let quality = startQuality;
      let blob = await canvasToBlob(canvas, mimeType, quality);

      if (!blob || blob.type !== 'image/webp') {
        mimeType = 'image/jpeg';
        ext = '.jpg';
        blob = await canvasToBlob(canvas, mimeType, quality);
      }

      // Step down quality gently until under targetMaxBytes (~650 KB) while keeping HD clarity
      while (blob && blob.size > targetMaxBytes && quality > MIN_QUALITY) {
        quality = Number((quality - 0.06).toFixed(2));
        const nextBlob = await canvasToBlob(canvas, mimeType, quality);
        if (!nextBlob) break;
        blob = nextBlob;
      }

      if (!blob || (blob.size >= file.size && origW <= maxDimension && origH <= maxDimension)) {
        const marked = file as MarkedFile;
        marked.__pakjaiHdCompressed = true;
        resolve(marked);
        return;
      }

      const baseName = file.name.replace(/\.[^/.]+$/, '');
      const compressedFile = new File([blob], `${baseName}${ext}`, {
        type: mimeType,
        lastModified: Date.now(),
      }) as MarkedFile;
      compressedFile.__pakjaiHdCompressed = true;

      resolve(compressedFile);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
};
