// src/utils/ipfsMetadata.ts
/**
 * Helper functions for IPFS metadata parsing and validation
 * Supporting Phase 2 JSON metadata approach for 3-image system
 */

import { IPFSImageMetadata, ImageValidationResult, ImageType, IMAGE_SPECS } from '../types/IPFSMetadata';
import { getIPFSUrl, fetchIPFSJson } from '../services/IPFSService';

/**
 * Parse IPFS metadata from contract storage
 * Supports both old format (direct hash) and new format (JSON metadata)
 */
export const parseIPFSMetadata = async (ipfsMetadata: string): Promise<IPFSImageMetadata | null> => {
  if (!ipfsMetadata) return null;
  
  console.log('🔍 parseIPFSMetadata - Input:', ipfsMetadata);
  
  try {
    // First try to parse as direct JSON string (if already JSON)
    if (ipfsMetadata.startsWith('{') && ipfsMetadata.endsWith('}')) {
      console.log('📄 Parsing as direct JSON string');
      const metadata = JSON.parse(ipfsMetadata) as IPFSImageMetadata;
      
      if (metadata.posterImage && metadata.bannerImage) {
        console.log('✅ Direct JSON parsed successfully');
        return metadata;
      }
    }
    
    // Try to fetch as IPFS hash containing JSON
    if (ipfsMetadata.startsWith('Qm') || ipfsMetadata.startsWith('ba')) {
      console.log('🌐 Fetching JSON from IPFS hash');
      const metadata = await fetchIPFSJson(ipfsMetadata) as IPFSImageMetadata;
      
      if (metadata && metadata.posterImage && metadata.bannerImage) {
        console.log('✅ IPFS JSON fetched and parsed successfully');
        return metadata;
      }
    }
    
    // If neither worked, treat as legacy format
    throw new Error('Not valid JSON metadata');
    
  } catch (error) {
    console.log('🔄 Falling back to legacy format:', error);
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
export const getPosterImageUrl = async (ipfsMetadata: string): Promise<string> => {
  console.log('🖼️ getPosterImageUrl - Input ipfsMetadata:', ipfsMetadata);
  const metadata = await parseIPFSMetadata(ipfsMetadata);
  if (!metadata) {
    console.log('❌ getPosterImageUrl - Failed to parse metadata');
    return '';
  }
  
  const posterUrl = getIPFSUrl(metadata.posterImage);
  console.log('✅ getPosterImageUrl - Result:', posterUrl);
  return posterUrl;
};

/**
 * Get banner image URL from metadata (for EventDetailPage)
 */
export const getBannerImageUrl = async (ipfsMetadata: string): Promise<string> => {
  console.log('🎨 getBannerImageUrl - Input ipfsMetadata:', ipfsMetadata);
  const metadata = await parseIPFSMetadata(ipfsMetadata);
  if (!metadata) {
    console.log('❌ getBannerImageUrl - Failed to parse metadata');
    return '';
  }
  
  const bannerUrl = getIPFSUrl(metadata.bannerImage);
  console.log('✅ getBannerImageUrl - Result:', bannerUrl);
  return bannerUrl;
};

/**
 * Get NFT background image URL from metadata for specific tier (for TicketNFT)
 * @param ipfsMetadata IPFS metadata hash
 * @param tierId Tier ID (e.g., "tier-1", "vip", "regular")
 */
export const getNFTBackgroundUrl = async (ipfsMetadata: string, tierId?: string): Promise<string> => {
  console.log('🎯 getNFTBackgroundUrl - Input ipfsMetadata:', ipfsMetadata, 'tierId:', tierId);
  const metadata = await parseIPFSMetadata(ipfsMetadata);
  if (!metadata) {
    console.log('❌ getNFTBackgroundUrl - Failed to parse metadata');
    return '';
  }
  
  console.log('🎯 getNFTBackgroundUrl - Parsed metadata tierBackgrounds:', metadata.tierBackgrounds);
  console.log('🎯 Available tier IDs:', Object.keys(metadata.tierBackgrounds || {}));
  
  // If tierId provided and tier background exists, use it
  if (tierId && metadata.tierBackgrounds && metadata.tierBackgrounds[tierId]) {
    const nftUrl = getIPFSUrl(metadata.tierBackgrounds[tierId]);
    console.log('✅ getNFTBackgroundUrl - Found tier background:', nftUrl);
    return nftUrl;
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