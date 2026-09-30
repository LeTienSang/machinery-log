import imageCompression from 'browser-image-compression';

export async function compressForOCR(file: File): Promise<File> {
  const options = {
    maxSizeMB: 1.0,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: 'image/jpeg',
  };

  try {
    const compressedFile = await imageCompression(file, options);
    // ponytail: rename keeps .jpg consistent with fileType jpeg; upgrade to canvas path when HEIC worker fails
    const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
    return new File([compressedFile], name, { type: 'image/jpeg' });
  } catch (error) {
    console.error('Failed to compress image:', error);
    throw error;
  }
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Strip base64 metadata prefix for Gemini API payload
      const base64Data = result.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = (error) => reject(error);
  });
}
