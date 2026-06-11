import { FC, ChangeEvent } from 'react';
import { compressImage } from '../../utils/imageCompression';

interface ImageUploadInputProps {
  onUpload: (base64: string) => void;
  maxWidth?: number;
  quality?: number;
}

export const ImageUploadInput: FC<ImageUploadInputProps> = ({ onUpload, maxWidth = 800, quality = 0.8 }) => {
  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file, maxWidth, quality);
        onUpload(compressedBase64);
      } catch (err) {
        console.error('Image compression failed:', err);
      }
    }
  };

  return <input type="file" accept="image/*" className="hidden" onChange={handleChange} />;
};