/**
 * World-Class Photo Upload Utilities
 * Handles native camera, web camera, compression, and validation
 */

import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

// Detect if running in native app
const isNative = () => {
  if (typeof window === 'undefined') return false;
  return (window as any).Capacitor !== undefined;
};

export interface PhotoUploadOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  quality?: number;
  useNativeCamera?: boolean;
}

export interface PhotoResult {
  file: File;
  dataUrl: string;
  width: number;
  height: number;
  size: number;
  quality?: PhotoQualityAnalysis;
  faceValidation?: import('@/lib/ml/face-detection').FaceValidationResult;
}

export interface PhotoQualityAnalysis {
  brightness: 'too_dark' | 'too_bright' | 'good';
  sharpness: 'blurry' | 'acceptable' | 'sharp';
  aspectRatio: 'portrait' | 'landscape' | 'square';
  overallScore: number; // 0-100
  recommendations: string[];
}

/**
 * Capture photo from camera (native or web)
 */
export async function capturePhoto(options: PhotoUploadOptions = {}): Promise<PhotoResult> {
  const {
    maxSizeMB = 5,
    maxWidthOrHeight = 1920,
    quality = 0.9,
    useNativeCamera = true,
  } = options;

  // Try native camera first if available
  if (useNativeCamera && isNative()) {
    return captureNativePhoto({ maxWidthOrHeight, quality });
  }

  // Fallback to web camera/file picker
  return captureWebPhoto({ maxSizeMB, maxWidthOrHeight, quality });
}

/**
 * Capture using native camera (Capacitor)
 */
async function captureNativePhoto(options: {
  maxWidthOrHeight: number;
  quality: number;
}): Promise<PhotoResult> {
  try {
    const image = await Camera.getPhoto({
      quality: Math.round(options.quality * 100),
      allowEditing: true,
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera,
      width: options.maxWidthOrHeight,
      height: options.maxWidthOrHeight,
      correctOrientation: true,
    });

    if (!image.base64String) {
      throw new Error('No image data received');
    }

    // Convert base64 to File
    const dataUrl = `data:image/${image.format};base64,${image.base64String}`;
    const blob = await fetch(dataUrl).then(r => r.blob());
    const file = new File([blob], `photo_${Date.now()}.${image.format}`, {
      type: `image/${image.format}`,
    });

    // Get dimensions
    const dimensions = await getImageDimensions(dataUrl);

    // Analyze quality
    const quality = await analyzePhotoQuality(dataUrl);

    // Validate face detection (for database quality)
    let faceValidation;
    try {
      const { validatePhotoForDatabase } = await import('@/lib/ml/face-detection');
      faceValidation = await validatePhotoForDatabase(dataUrl);
    } catch (error) {
      console.warn('[Photo Capture] Face validation failed:', error);
      // Continue without face validation if ML fails
    }

    return {
      file,
      dataUrl,
      width: dimensions.width,
      height: dimensions.height,
      size: file.size,
      quality,
      faceValidation,
    };
  } catch (error) {
    console.error('[Native Camera] Error:', error);
    throw new Error('Failed to capture photo with native camera');
  }
}

/**
 * Capture using web camera or file picker
 */
async function captureWebPhoto(options: {
  maxSizeMB: number;
  maxWidthOrHeight: number;
  quality: number;
}): Promise<PhotoResult> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Use back camera on mobile

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }

      try {
        // Compress and resize
        const compressed = await compressImage(file, options);
        resolve(compressed);
      } catch (error) {
        reject(error);
      }
    };

    input.oncancel = () => {
      reject(new Error('Photo capture cancelled'));
    };

    input.click();
  });
}

/**
 * Compress and resize image
 */
async function compressImage(
  file: File,
  options: { maxSizeMB: number; maxWidthOrHeight: number; quality: number }
): Promise<PhotoResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      const img = new Image();

      img.onload = async () => {
        // Calculate new dimensions
        let { width, height } = img;
        const maxDim = options.maxWidthOrHeight;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = (height / width) * maxDim;
            width = maxDim;
          } else {
            width = (width / height) * maxDim;
            height = maxDim;
          }
        }

        // Create canvas for resizing
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          async (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            // Check if size is acceptable
            const sizeMB = blob.size / (1024 * 1024);
            if (sizeMB > options.maxSizeMB) {
              console.warn(`[Compress] Image still ${sizeMB.toFixed(2)}MB after compression`);
            }

            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });

            const dataUrl = canvas.toDataURL('image/jpeg', options.quality);

            // Analyze quality and validate face
            Promise.all([
              analyzePhotoQuality(dataUrl),
              import('@/lib/ml/face-detection')
                .then(({ validatePhotoForDatabase }) => validatePhotoForDatabase(dataUrl))
                .catch(() => undefined), // Graceful fallback if ML fails
            ]).then(([quality, faceValidation]) => {
              resolve({
                file: compressedFile,
                dataUrl,
                width,
                height,
                size: compressedFile.size,
                quality,
                faceValidation,
              });
            });
          },
          'image/jpeg',
          options.quality
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Get image dimensions
 */
function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    img.src = dataUrl;
  });
}

/**
 * Upload photo to server
 */
export async function uploadPhoto(
  photo: PhotoResult,
  metadata: {
    sessionId: string;
    userId?: string;
    photoType?: 'baseline' | 'progress' | 'after';
    mlConsent?: boolean;
  }
): Promise<{
  success: boolean;
  photoId?: string;
  photoUrl?: string;
  error?: string;
}> {
  try {
    const formData = new FormData();
    formData.append('photo', photo.file);
    formData.append('sessionId', metadata.sessionId);
    formData.append('photoType', metadata.photoType || 'baseline');
    formData.append('mlConsent', metadata.mlConsent ? 'true' : 'false');

    if (metadata.userId) {
      formData.append('userId', metadata.userId);
    }

    const response = await fetch('/api/photos/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Upload failed');
    }

    return {
      success: true,
      photoId: data.photoId,
      photoUrl: data.photoUrl,
    };
  } catch (error: any) {
    console.error('[Upload Photo] Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload photo',
    };
  }
}

/**
 * Validate photo (basic checks)
 */
export function validatePhoto(photo: PhotoResult): { valid: boolean; error?: string } {
  // Check size
  const sizeMB = photo.size / (1024 * 1024);
  if (sizeMB > 10) {
    return { valid: false, error: 'Photo is too large (max 10MB)' };
  }

  // Check dimensions
  if (photo.width < 200 || photo.height < 200) {
    return { valid: false, error: 'Photo resolution too low (min 200x200)' };
  }

  return { valid: true };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Analyze photo quality (brightness, sharpness, composition)
 */
export async function analyzePhotoQuality(dataUrl: string): Promise<PhotoQualityAnalysis> {
  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(getDefaultQualityAnalysis());
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Brightness analysis
      let totalBrightness = 0;
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        totalBrightness += avg;
      }
      const avgBrightness = totalBrightness / (data.length / 4);

      let brightness: 'too_dark' | 'too_bright' | 'good';
      if (avgBrightness < 60) brightness = 'too_dark';
      else if (avgBrightness > 200) brightness = 'too_bright';
      else brightness = 'good';

      // Sharpness analysis (using Laplacian variance)
      const sharpnessScore = calculateSharpness(imageData);
      let sharpness: 'blurry' | 'acceptable' | 'sharp';
      if (sharpnessScore < 50) sharpness = 'blurry';
      else if (sharpnessScore < 150) sharpness = 'acceptable';
      else sharpness = 'sharp';

      // Aspect ratio
      const ratio = img.width / img.height;
      let aspectRatio: 'portrait' | 'landscape' | 'square';
      if (ratio < 0.9) aspectRatio = 'portrait';
      else if (ratio > 1.1) aspectRatio = 'landscape';
      else aspectRatio = 'square';

      // Overall score
      let score = 70;
      if (brightness === 'good') score += 15;
      else score -= 10;
      if (sharpness === 'sharp') score += 15;
      else if (sharpness === 'blurry') score -= 20;

      // Recommendations
      const recommendations: string[] = [];
      if (brightness === 'too_dark') recommendations.push('Find better lighting');
      if (brightness === 'too_bright') recommendations.push('Reduce direct light');
      if (sharpness === 'blurry') recommendations.push('Hold camera steady');
      if (aspectRatio === 'landscape') recommendations.push('Use portrait orientation');

      resolve({
        brightness,
        sharpness,
        aspectRatio,
        overallScore: Math.max(0, Math.min(100, score)),
        recommendations,
      });
    };

    img.onerror = () => {
      resolve(getDefaultQualityAnalysis());
    };

    img.src = dataUrl;
  });
}

/**
 * Calculate image sharpness using Laplacian variance
 */
function calculateSharpness(imageData: ImageData): number {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;

  // Convert to grayscale and calculate Laplacian
  let variance = 0;
  let mean = 0;
  let count = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;

      // Sample every 10th pixel for performance
      if (count % 10 === 0) {
        const laplacian = Math.abs(
          -4 * gray +
          (data[((y - 1) * width + x) * 4] + data[((y - 1) * width + x) * 4 + 1] + data[((y - 1) * width + x) * 4 + 2]) / 3 +
          (data[((y + 1) * width + x) * 4] + data[((y + 1) * width + x) * 4 + 1] + data[((y + 1) * width + x) * 4 + 2]) / 3 +
          (data[(y * width + (x - 1)) * 4] + data[(y * width + (x - 1)) * 4 + 1] + data[(y * width + (x - 1)) * 4 + 2]) / 3 +
          (data[(y * width + (x + 1)) * 4] + data[(y * width + (x + 1)) * 4 + 1] + data[(y * width + (x + 1)) * 4 + 2]) / 3
        );
        mean += laplacian;
        count++;
      }
    }
  }

  mean /= count;

  // Calculate variance
  count = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (count % 10 === 0) {
        const idx = (y * width + x) * 4;
        const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        const laplacian = Math.abs(
          -4 * gray +
          (data[((y - 1) * width + x) * 4] + data[((y - 1) * width + x) * 4 + 1] + data[((y - 1) * width + x) * 4 + 2]) / 3 +
          (data[((y + 1) * width + x) * 4] + data[((y + 1) * width + x) * 4 + 1] + data[((y + 1) * width + x) * 4 + 2]) / 3 +
          (data[(y * width + (x - 1)) * 4] + data[(y * width + (x - 1)) * 4 + 1] + data[(y * width + (x - 1)) * 4 + 2]) / 3 +
          (data[(y * width + (x + 1)) * 4] + data[(y * width + (x + 1)) * 4 + 1] + data[(y * width + (x + 1)) * 4 + 2]) / 3
        );
        variance += Math.pow(laplacian - mean, 2);
      }
      count++;
    }
  }

  return variance / count;
}

/**
 * Default quality analysis fallback
 */
function getDefaultQualityAnalysis(): PhotoQualityAnalysis {
  return {
    brightness: 'good',
    sharpness: 'acceptable',
    aspectRatio: 'portrait',
    overallScore: 70,
    recommendations: [],
  };
}
