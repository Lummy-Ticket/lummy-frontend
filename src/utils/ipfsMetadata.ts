// src/utils/ipfsMetadata.ts
/**
 * Helper functions for IPFS metadata parsing and validation
 * Supporting Phase 2 JSON metadata approach for 3-image system
 */

import { IPFSImageMetadata, ImageValidationResult, ImageType, IMAGE_SPECS } from '../types/IPFSMetadata';
import { getIPFSUrl } from '../services/IPFSService';

/**
 * Parse IPFS metadata from contract storage
 * Supports both old format (direct hash) and new format (JSON metadata)
 */
export const parseIPFSMetadata = (ipfsMetadata: string): IPFSImageMetadata | null => {
  if (!ipfsMetadata) return null;
  
  try {
    // Try to parse as JSON (new format)
    const metadata = JSON.parse(ipfsMetadata) as IPFSImageMetadata;
    
    // Validate required fields (posterImage and bannerImage required, tierBackgrounds optional)
    if (metadata.posterImage && metadata.bannerImage) {
      return metadata;
    }
    
    // If missing required fields, treat as legacy format
    throw new Error('Invalid JSON structure');
    
  } catch {
    // Legacy format: direct IPFS hash
    // Use the same hash for all image types for backward compatibility
    return {
      posterImage: ipfsMetadata,
      bannerImage: ipfsMetadata,
      tierBackgrounds: {}, // No tier backgrounds in legacy format
      eventMetadata: {
        description: 'Legacy format - single image used for all contexts'
      }
    };
  }
};

/**
 * Get poster image URL from metadata (for EventCard)
 */
export const getPosterImageUrl = (ipfsMetadata: string): string => {
  const metadata = parseIPFSMetadata(ipfsMetadata);
  if (!metadata) return '';
  
  return getIPFSUrl(metadata.posterImage);
};

/**
 * Get banner image URL from metadata (for EventDetailPage)
 */
export const getBannerImageUrl = (ipfsMetadata: string): string => {
  const metadata = parseIPFSMetadata(ipfsMetadata);
  if (!metadata) return '';
  
  return getIPFSUrl(metadata.bannerImage);
};

/**
 * Get NFT background image URL from metadata for specific tier (for TicketNFT)
 * @param ipfsMetadata IPFS metadata hash
 * @param tierId Tier ID (e.g., "tier-1", "vip", "regular")
 */
export const getNFTBackgroundUrl = (ipfsMetadata: string, tierId?: string): string => {
  const metadata = parseIPFSMetadata(ipfsMetadata);
  if (!metadata) return '';
  
  // If tierId provided and tier background exists, use it
  if (tierId && metadata.tierBackgrounds && metadata.tierBackgrounds[tierId]) {
    return getIPFSUrl(metadata.tierBackgrounds[tierId]);
  }
  
  // Fallback: use default tier background (first available)
  if (metadata.tierBackgrounds && Object.keys(metadata.tierBackgrounds).length > 0) {
    const firstTierBg = Object.values(metadata.tierBackgrounds)[0];
    return getIPFSUrl(firstTierBg);
  }
  
  // Legacy fallback: use banner image as NFT background
  return getIPFSUrl(metadata.bannerImage);
};

/**
 * Create JSON metadata object from individual image hashes
 */
export const createIPFSMetadata = (
  posterHash: string,
  bannerHash: string,
  tierBackgrounds: Record<string, string>,
  additionalMetadata?: Partial<IPFSImageMetadata['eventMetadata']>
): IPFSImageMetadata => {
  return {
    posterImage: posterHash,
    bannerImage: bannerHash,
    tierBackgrounds: tierBackgrounds,
    // Flatten metadata to avoid nested objects for Pinata compliance
    eventMetadata: {
      eventTitle: additionalMetadata?.eventTitle || '',
      description: additionalMetadata?.description || '',
      createdBy: additionalMetadata?.createdBy || 'organizer-dashboard',
      tierCount: String(additionalMetadata?.tierCount || 0), // Convert to string for Pinata
      createdAt: new Date().toISOString(),
      version: '2.1' // Phase 2.1 - Per-tier NFT backgrounds
    }
  };
};

/**
 * Validate image file against specifications
 * Updated to be more lenient since we now have cropping functionality
 */
export const validateImage = (file: File, imageType: ImageType): Promise<ImageValidationResult> => {
  return new Promise((resolve) => {
    const spec = IMAGE_SPECS[imageType];
    
    // Check file size
    if (file.size > spec.maxSize) {
      resolve({
        valid: false,
        error: `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds maximum ${spec.maxSize / 1024 / 1024}MB`
      });
      return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      resolve({
        valid: false,
        error: 'File must be an image'
      });
      return;
    }
    
    // Create image element to check dimensions
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      
      const { width, height } = img;
      const aspectRatio = width / height;
      const expectedRatio = spec.aspectRatio;
      const tolerance = spec.tolerance;
      
      // With cropping, we're more lenient - just check if image is reasonable quality
      let warning: string | undefined;
      
      // Check if dimensions are too small (would result in poor quality after crop)
      const minDimension = Math.min(spec.recommendedSize.width, spec.recommendedSize.height);
      if (width < minDimension * 0.5 || height < minDimension * 0.5) {
        resolve({
          valid: false,
          aspectRatio,
          width,
          height,
          error: `Image resolution (${width}×${height}) is too low. Minimum dimension should be at least ${Math.round(minDimension * 0.5)}px`
        });
        return;
      }
      
      // Check aspect ratio and provide helpful guidance
      const ratioDiff = Math.abs(aspectRatio - expectedRatio) / expectedRatio;
      
      if (ratioDiff > tolerance) {
        // Instead of failing, we provide a warning since we have cropping
        const expectedRatioStr = expectedRatio === 16/9 ? '16:9' : expectedRatio === 21/9 ? '21:9' : '1:1';
        warning = `Image has ${aspectRatio.toFixed(2)} aspect ratio (expected ${expectedRatioStr}). You'll be able to crop it to the correct ratio.`;
      }
      
      // Check if dimensions could be better
      const { recommendedSize } = spec;
      if (width < recommendedSize.width * 0.8 || height < recommendedSize.height * 0.8) {
        const existingWarning = warning || '';
        warning = existingWarning + (existingWarning ? ' ' : '') + `Resolution (${width}×${height}) is lower than recommended (${recommendedSize.width}×${recommendedSize.height}) for best quality.`;
      }
      
      // Always valid now - cropping will handle aspect ratio issues
      resolve({
        valid: true,
        aspectRatio,
        width,
        height,
        warning
      });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({
        valid: false,
        error: 'Invalid image file'
      });
    };
    
    img.src = url;
  });
};

/**
 * Validate cropped image - stricter validation since it should match specs
 */
export const validateCroppedImage = (file: File, imageType: ImageType): Promise<ImageValidationResult> => {
  return new Promise((resolve) => {
    const spec = IMAGE_SPECS[imageType];
    
    // Check file size
    if (file.size > spec.maxSize) {
      resolve({
        valid: false,
        error: `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds maximum ${spec.maxSize / 1024 / 1024}MB`
      });
      return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      resolve({
        valid: false,
        error: 'File must be an image'
      });
      return;
    }
    
    // Create image element to check dimensions
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      
      const { width, height } = img;
      const aspectRatio = width / height;
      const expectedRatio = spec.aspectRatio;
      const tolerance = 0.01; // Much stricter tolerance for cropped images
      
      // Check aspect ratio with strict tolerance
      const ratioDiff = Math.abs(aspectRatio - expectedRatio) / expectedRatio;
      
      if (ratioDiff > tolerance) {
        resolve({
          valid: false,
          aspectRatio,
          width,
          height,
          error: `Cropped image aspect ratio ${aspectRatio.toFixed(3)} doesn't match required ${expectedRatio.toFixed(3)}`
        });
        return;
      }
      
      // Cropped images should be valid
      resolve({
        valid: true,
        aspectRatio,
        width,
        height
      });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({
        valid: false,
        error: 'Invalid cropped image file'
      });
    };
    
    img.src = url;
  });
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Generate image preview URL for display
 */
export const generateImagePreview = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error('Failed to generate preview'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};