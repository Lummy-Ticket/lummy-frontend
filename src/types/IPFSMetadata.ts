// src/types/IPFSMetadata.ts
/**
 * TypeScript interfaces for IPFS metadata structure
 * Supporting Phase 2 3-image system with JSON metadata approach
 */

export interface IPFSImageMetadata {
  /** Event poster image hash - 16:9 aspect ratio for EventCard display */
  posterImage: string;
  
  /** Event banner image hash - 21:9 aspect ratio for EventDetailPage hero */
  bannerImage: string;
  
  /** Per-tier NFT background images - 1:1 aspect ratio for TicketNFT per tier */
  tierBackgrounds: Record<string, string>; // { "tier-1": "QmHash...", "tier-2": "QmHash..." }
  
  /** Additional event metadata (flattened for Pinata compliance) */
  eventMetadata?: {
    description?: string;
    eventTitle?: string;
    createdAt?: string;
    version?: string;
    uploadedBy?: string;
    createdBy?: string;
    tierCount?: string; // Changed to string for Pinata compliance
    website?: string;
    twitter?: string;
    instagram?: string;
    facebook?: string;
  };
}

export interface ImageUploadData {
  file: File;
  hash?: string;
  url?: string;
  uploaded: boolean;
  uploading: boolean;
  error?: string;
}

export interface TwoImageUploadState {
  posterImage: ImageUploadData | null;
  bannerImage: ImageUploadData | null;
}

export interface TierNFTUploadState {
  [tierId: string]: ImageUploadData | null; // Per-tier NFT backgrounds
}

export interface IPFSMetadataUploadResult {
  success: boolean;
  metadataHash?: string;
  metadataUrl?: string;
  error?: string;
}

// Helper type for image validation
export interface ImageValidationResult {
  valid: boolean;
  aspectRatio?: number;
  width?: number;
  height?: number;
  error?: string;
  warning?: string;
}

// Image specifications for validation
export const IMAGE_SPECS = {
  POSTER: {
    name: 'Event Poster',
    aspectRatio: 16/9,
    recommendedSize: { width: 1200, height: 675 },
    tolerance: 0.05, // 5% tolerance for aspect ratio
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  BANNER: {
    name: 'Event Banner', 
    aspectRatio: 21/9,
    recommendedSize: { width: 1920, height: 823 },
    tolerance: 0.05,
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  NFT_BACKGROUND: {
    name: 'NFT Background',
    aspectRatio: 1/1,
    recommendedSize: { width: 1000, height: 1000 },
    tolerance: 0.05,
    maxSize: 10 * 1024 * 1024, // 10MB
  }
} as const;

export type ImageType = keyof typeof IMAGE_SPECS;