import { compressImage } from './imageCompression';

/** Maximum raw input file size before client-side HD compression (25 MB) */
const MAX_RAW_FILE_BYTES = 25 * 1024 * 1024;

/** Maximum upload payload after Facebook-style 2048px HD compression (2 MB) */
const MAX_COMPRESSED_UPLOAD_BYTES = 2 * 1024 * 1024;

export const uploadToCloudinary = async (file: File): Promise<string> => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary environment variables are not set.');
  }

  // Only real raster images (blocks SVG, which can carry scripts)
  const ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/heic',
    'image/heif',
    'image/avif',
  ];
  if (
    !ALLOWED_TYPES.includes(file.type) &&
    !(file.type === '' && /\.(jpe?g|png|webp|gif|heic|heif|avif)$/i.test(file.name))
  ) {
    throw new Error('Unsupported file type. Please upload a JPG, PNG, WEBP, GIF, HEIC or AVIF image.');
  }

  if (file.size > MAX_RAW_FILE_BYTES) {
    throw new Error('Original photo is too large (max 25MB). Please choose a smaller photo.');
  }

  // Always run Facebook-style 2048px HD compression (idempotent if already compressed)
  const optimizedFile = await compressImage(file, {
    maxDimension: 2048,
    targetMaxBytes: 650 * 1024,
    initialQuality: 0.88,
  });

  if (optimizedFile.size > MAX_COMPRESSED_UPLOAD_BYTES) {
    throw new Error('Photo exceeds the 2MB HD upload limit even after compression.');
  }

  const formData = new FormData();
  formData.append('file', optimizedFile);
  formData.append('upload_preset', uploadPreset);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to upload image to Cloudinary');
  }

  const data = await response.json();
  const rawUrl: string = data.secure_url;

  // Inject Cloudinary HD auto-format & quality delivery params (`f_auto,q_auto:good,w_2048,c_limit`)
  if (rawUrl && rawUrl.includes('/image/upload/') && !rawUrl.includes('/image/upload/f_auto')) {
    return rawUrl.replace('/image/upload/', '/image/upload/f_auto,q_auto:good,w_2048,c_limit/');
  }

  return rawUrl;
};
