import { FC, ChangeEvent, useState } from 'react';
import { createPortal } from 'react-dom';
import { compressImage } from '../../utils/imageCompression';

interface ImageUploadInputProps {
  onUpload: (url: string) => void;
  type?: 'profile' | 'journal';
  maxWidth?: number;
  quality?: number;
}

export const ImageUploadInput: FC<ImageUploadInputProps> = ({ onUpload, type = 'journal', maxWidth = 800, quality = 0.8 }) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsUploading(true);
        
        // 1. Compress image on client side first (returns base64)
        const compressedBase64 = await compressImage(file, maxWidth, quality);
        
        // 2. Convert the compressed base64 string back into a File Blob
        const res = await fetch(compressedBase64);
        const blob = await res.blob();
        
        // 3. Package it into FormData
        const formData = new FormData();
        formData.append('image', blob, file.name);
        formData.append('type', type); // Determines backend cropping rules

        // 4. Securely upload to backend
        const host = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
        const apiBase = ['5173', '5174', '5175'].includes(window.location.port) ? `${window.location.protocol}//${host}:5050` : '';
        const token = localStorage.getItem('florasync_token');

        const uploadRes = await fetch(`${apiBase}/api/upload/image`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });

        const data = await uploadRes.json();
        if (data.success) {
          // Return the Cloudinary (or local) URL back to the parent component
          onUpload(data.imageUrl);
        } else {
          console.error('Upload failed:', data.error);
          alert(`Upload failed: ${data.error}`);
        }
      } catch (err) {
        console.error('Image upload failed:', err);
        alert('A network error occurred while uploading the image.');
      } finally {
        setIsUploading(false);
        if (e.target) {
          e.target.value = ''; // Reset input so the same file can be selected again
        }
      }
    }
  };

  return (
    <>
      <input type="file" accept="image/*" className="hidden" onChange={handleChange} disabled={isUploading} />
      {isUploading && createPortal(
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-surface-900/80 backdrop-blur-sm" onClick={(e) => e.preventDefault()}>
          <img src="/images/icons/loader.apng.png" alt="Uploading" className="w-16 h-16 mb-4 animate-pulse" />
          <p className="text-primary-500 font-bold text-lg animate-pulse">Uploading to Cloud...</p>
        </div>
      , document.body)}
    </>
  );
};