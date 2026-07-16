export const compressImage = async (file: File): Promise<File> => {
  // If file is already small enough, just return it
  if (file.size <= 2 * 1024 * 1024) return file;

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Max dimensions for the compressed image
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1920;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file); // Fallback to original if canvas fails
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);

        // Compress to JPEG with 80% quality
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Check if compression actually made it smaller, if not, use original
              if (blob.size > file.size) {
                 resolve(file);
                 return;
              }
              const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(newFile);
            } else {
              resolve(file); // Fallback to original
            }
          },
          'image/jpeg',
          0.8 
        );
      };
      img.onerror = () => resolve(file); // Fallback to original
    };
    reader.onerror = () => resolve(file); // Fallback to original
  });
};
