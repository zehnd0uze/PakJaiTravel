export const uploadToCloudinary = async (file: File): Promise<string> => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary environment variables are not set.');
  }

  // Only real raster images (blocks SVG, which can carry scripts)
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif', 'image/avif'];
  if (!ALLOWED_TYPES.includes(file.type) && !(file.type === '' && /\.(jpe?g|png|webp|gif|heic|heif|avif)$/i.test(file.name))) {
    throw new Error('Unsupported file type. Please upload a JPG, PNG, WEBP, GIF, HEIC or AVIF image.');
  }

  // Enforce 10MB limit for unsigned Cloudinary uploads
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('File size is too large. Maximum size allowed is 10MB.');
  }

  const formData = new FormData();
  formData.append('file', file);
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
  return data.secure_url;
};
