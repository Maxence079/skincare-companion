/**
 * Face Detection & Photo Validation for Database Quality
 * Using TensorFlow.js BlazeFace for technical validation
 * NO cosmetic analysis - only technical quality checks
 */

import * as blazeface from '@tensorflow-models/blazeface';
import * as tf from '@tensorflow/tfjs';

let model: blazeface.BlazeFaceModel | null = null;

/**
 * Load BlazeFace model (call once on app init)
 */
export async function loadFaceDetectionModel(): Promise<void> {
  if (model) return;

  try {
    await tf.ready();
    model = await blazeface.load();
    console.log('[BlazeFace] Model loaded successfully');
  } catch (error) {
    console.error('[BlazeFace] Failed to load model:', error);
    throw new Error('Failed to load face detection model');
  }
}

export interface FaceValidationResult {
  valid: boolean;
  confidence: number;
  issues: string[];
  metrics: {
    faceDetected: boolean;
    faceCount: number;
    faceCoverage: number; // % of image
    isCentered: boolean;
    horizontalPosition: number; // -1 to 1 (left to right)
    verticalPosition: number; // -1 to 1 (top to bottom)
    faceSize: { width: number; height: number };
    imageSize: { width: number; height: number };
  };
  recommendations: string[];
}

/**
 * Validate photo for database quality
 * Checks: face present, single face, proper framing, centering
 */
export async function validatePhotoForDatabase(
  imageSource: HTMLImageElement | HTMLCanvasElement | string
): Promise<FaceValidationResult> {
  // Ensure model is loaded
  if (!model) {
    await loadFaceDetectionModel();
  }

  const issues: string[] = [];
  const recommendations: string[] = [];

  try {
    // Convert dataURL to image element if needed
    let imageElement: HTMLImageElement | HTMLCanvasElement;

    if (typeof imageSource === 'string') {
      imageElement = await loadImageFromDataUrl(imageSource);
    } else {
      imageElement = imageSource;
    }

    // Run face detection
    const predictions = await model!.estimateFaces(imageElement, false);

    const imageWidth = imageElement.width;
    const imageHeight = imageElement.height;
    const imageArea = imageWidth * imageHeight;

    // Check 1: Face detected
    if (predictions.length === 0) {
      issues.push('No face detected');
      recommendations.push('Ensure your face is clearly visible');
      recommendations.push('Check lighting conditions');

      return {
        valid: false,
        confidence: 0,
        issues,
        recommendations,
        metrics: {
          faceDetected: false,
          faceCount: 0,
          faceCoverage: 0,
          isCentered: false,
          horizontalPosition: 0,
          verticalPosition: 0,
          faceSize: { width: 0, height: 0 },
          imageSize: { width: imageWidth, height: imageHeight },
        },
      };
    }

    // Check 2: Single face only
    if (predictions.length > 1) {
      issues.push(`Multiple faces detected (${predictions.length})`);
      recommendations.push('Ensure only one person is in frame');

      return {
        valid: false,
        confidence: 0,
        issues,
        recommendations,
        metrics: {
          faceDetected: true,
          faceCount: predictions.length,
          faceCoverage: 0,
          isCentered: false,
          horizontalPosition: 0,
          verticalPosition: 0,
          faceSize: { width: 0, height: 0 },
          imageSize: { width: imageWidth, height: imageHeight },
        },
      };
    }

    const face = predictions[0];
    const confidence = Array.isArray(face.probability)
      ? face.probability[0]
      : face.probability;

    // Extract face bounding box
    const [x1, y1] = face.topLeft as [number, number];
    const [x2, y2] = face.bottomRight as [number, number];

    const faceWidth = x2 - x1;
    const faceHeight = y2 - y1;
    const faceArea = faceWidth * faceHeight;

    // Calculate face coverage (% of image)
    const faceCoverage = (faceArea / imageArea) * 100;

    // Check 3: Face size (should be 15-60% of image)
    if (faceCoverage < 15) {
      issues.push('Face too small');
      recommendations.push('Move closer to camera');
    }
    if (faceCoverage > 60) {
      issues.push('Face too large');
      recommendations.push('Move slightly back from camera');
    }

    // Calculate face center position
    const faceCenterX = (x1 + x2) / 2;
    const faceCenterY = (y1 + y2) / 2;
    const imageCenterX = imageWidth / 2;
    const imageCenterY = imageHeight / 2;

    // Normalized position (-1 to 1)
    const horizontalPosition = (faceCenterX - imageCenterX) / (imageWidth / 2);
    const verticalPosition = (faceCenterY - imageCenterY) / (imageHeight / 2);

    // Check 4: Face centering (should be within 20% of center)
    const horizontalOffset = Math.abs(horizontalPosition);
    const verticalOffset = Math.abs(verticalPosition);

    const isCentered = horizontalOffset < 0.2 && verticalOffset < 0.2;

    if (horizontalOffset > 0.3) {
      if (horizontalPosition > 0) {
        issues.push('Face too far right');
        recommendations.push('Move left to center face');
      } else {
        issues.push('Face too far left');
        recommendations.push('Move right to center face');
      }
    }

    if (verticalOffset > 0.3) {
      if (verticalPosition > 0) {
        issues.push('Face too low');
        recommendations.push('Raise camera or lower chin');
      } else {
        issues.push('Face too high');
        recommendations.push('Lower camera or raise chin');
      }
    }

    // Check 5: Aspect ratio (face should be roughly portrait)
    const faceAspectRatio = faceWidth / faceHeight;
    if (faceAspectRatio > 1.2) {
      issues.push('Face appears too wide');
      recommendations.push('Ensure you\'re facing camera directly');
    }

    // Overall validation
    const valid = issues.length === 0 &&
                  confidence > 0.8 &&
                  faceCoverage >= 15 &&
                  faceCoverage <= 60 &&
                  isCentered;

    return {
      valid,
      confidence,
      issues,
      recommendations,
      metrics: {
        faceDetected: true,
        faceCount: 1,
        faceCoverage,
        isCentered,
        horizontalPosition,
        verticalPosition,
        faceSize: { width: faceWidth, height: faceHeight },
        imageSize: { width: imageWidth, height: imageHeight },
      },
    };

  } catch (error) {
    console.error('[Face Validation] Error:', error);
    return {
      valid: false,
      confidence: 0,
      issues: ['Failed to analyze photo'],
      recommendations: ['Please try again'],
      metrics: {
        faceDetected: false,
        faceCount: 0,
        faceCoverage: 0,
        isCentered: false,
        horizontalPosition: 0,
        verticalPosition: 0,
        faceSize: { width: 0, height: 0 },
        imageSize: { width: 0, height: 0 },
      },
    };
  }
}

/**
 * Load image from data URL
 */
function loadImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

/**
 * Get standardization guidelines for consistent database photos
 */
export function getPhotoStandardizationGuidelines() {
  return {
    required: [
      'Single face clearly visible',
      'Face fills 15-60% of frame',
      'Face centered horizontally and vertically',
      'Direct frontal view (no angles)',
      'Neutral expression',
      'Eyes clearly visible',
      'Good, even lighting',
    ],
    forbidden: [
      'Makeup or heavy cosmetics',
      'Glasses or sunglasses',
      'Hats or head coverings',
      'Hair covering face',
      'Hands or objects in frame',
      'Filters or editing',
      'Multiple people',
    ],
    technical: [
      'Resolution: minimum 800x600px',
      'Format: JPEG, PNG, or WebP',
      'File size: under 10MB',
      'Portrait orientation preferred',
      'Natural lighting (no flash)',
      'Plain background preferred',
    ],
  };
}
