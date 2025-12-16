/**
 * Resizes an image file to ensure its maximum dimension does not exceed the limit.
 * Returns the base64 data string (without the data URL prefix).
 */
export const processImageForGemini = (file: File, maxDimension: number = 1536): Promise<{ base64: string, mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height *= maxDimension / width;
            width = maxDimension;
          } else {
            width *= maxDimension / height;
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        
        // Determine mime type (prefer JPEG for photos to save size, keep PNG if original was PNG)
        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, 0.85); // 0.85 quality
        const base64 = dataUrl.split(',')[1];
        
        resolve({ base64, mimeType });
      };
      
      img.onerror = (err) => reject(new Error("Failed to load image"));
    };
    reader.onerror = (err) => reject(new Error("Failed to read file"));
  });
};