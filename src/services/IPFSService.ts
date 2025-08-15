// src/services/IPFSService.ts
/**
 * IPFS Service untuk upload file ke IPFS menggunakan Pinata
 * Enhanced for Phase 2 - Real Pinata integration with JSON metadata support
 */

import { DEVELOPMENT_CONFIG, IPFS_CONFIG } from '../constants';
import { IPFSImageMetadata, IPFSMetadataUploadResult } from '../types/IPFSMetadata';

// Pinata configuration
const PINATA_API_URL = IPFS_CONFIG.API_URL;
const PINATA_GATEWAY = IPFS_CONFIG.GATEWAY_URL;

// Get Pinata credentials from environment
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;

export interface IPFSUploadResult {
  success: boolean;
  hash?: string;
  url?: string;
  error?: string;
}

/**
 * Upload file ke IPFS menggunakan Pinata
 * @param file File yang akan di-upload
 * @param filename Optional custom filename
 * @returns Promise dengan result hash dan URL
 */
export const uploadToIPFS = async (
  file: File,
  filename?: string
): Promise<IPFSUploadResult> => {
  try {
    console.log('📤 Uploading to IPFS:', file.name, 'Size:', file.size);
    
    // Validate file type dan size
    if (!file.type.startsWith('image/')) {
      return {
        success: false,
        error: 'File must be an image'
      };
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB max
      return {
        success: false,
        error: 'File size must be less than 10MB'
      };
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    // Add metadata
    const metadata = JSON.stringify({
      name: filename || file.name,
      keyvalues: {
        type: 'event-image',
        uploadedAt: new Date().toISOString(),
        originalName: file.name,
        size: file.size.toString()
      }
    });
    formData.append('pinataMetadata', metadata);
    
    // Add options
    const options = JSON.stringify({
      cidVersion: 1, // Use CIDv1 for better compatibility
    });
    formData.append('pinataOptions', options);
    
    // Check if real IPFS is enabled
    if (DEVELOPMENT_CONFIG.ENABLE_REAL_IPFS && PINATA_JWT) {
      // Real Pinata upload
      const response = await fetch(PINATA_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PINATA_JWT}`,
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Upload failed: ${response.statusText} - ${errorData}`);
      }
      
      const result = await response.json();
      const hash = result.IpfsHash;
      
      console.log('✅ Real IPFS upload successful!', hash);
      
      const url = `${PINATA_GATEWAY}${hash}`;
      
      return {
        success: true,
        hash,
        url
      };
    } else {
      // Demo simulation - generate fake hash
      console.log('🧪 Mock IPFS upload (ENABLE_REAL_IPFS=false or missing credentials)');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate upload delay
      const hash = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      
      const url = `${PINATA_GATEWAY}${hash}`;
      
      console.log('✅ Mock IPFS upload successful!');
      console.log('Hash:', hash);
      console.log('URL:', url);
      
      return {
        success: true,
        hash,
        url
      };
    }
    
  } catch (error) {
    console.error('❌ IPFS upload failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
};

/**
 * Generate IPFS URL dari hash
 * @param hash IPFS hash
 * @returns Full IPFS URL
 */
export const getIPFSUrl = (hash: string): string => {
  if (!hash) return '';
  
  // Handle different hash formats
  if (hash.startsWith('Qm') || hash.startsWith('ba')) {
    return `${PINATA_GATEWAY}${hash}`;
  }
  
  // If already full URL, return as is
  if (hash.startsWith('http')) {
    return hash;
  }
  
  return `${PINATA_GATEWAY}${hash}`;
};

/**
 * Fetch JSON content from IPFS hash
 * @param hash IPFS hash containing JSON data
 * @returns Promise dengan JSON content
 */
export const fetchIPFSJson = async (hash: string): Promise<any> => {
  if (!hash) {
    throw new Error('IPFS hash is required');
  }

  const url = getIPFSUrl(hash);
  console.log('🌐 Fetching JSON from IPFS:', url);

  try {
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Accept': 'application/json,text/plain,*/*',
        'Content-Type': 'application/json',
      },
      credentials: 'omit', // Don't send credentials for CORS
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    console.log('📄 Response Content-Type:', contentType);

    const jsonData = await response.json();
    console.log('✅ IPFS JSON fetched successfully:', jsonData);
    
    return jsonData;
  } catch (error) {
    console.error('❌ Failed to fetch IPFS JSON:', error);
    
    // Try alternative gateway if Pinata fails
    if (url.includes('gateway.pinata.cloud')) {
      console.log('🔄 Trying alternative IPFS gateway...');
      const altUrl = `https://ipfs.io/ipfs/${hash}`;
      
      try {
        const altResponse = await fetch(altUrl, {
          method: 'GET',
          mode: 'cors',
          headers: {
            'Accept': 'application/json,text/plain,*/*',
          },
        });

        if (altResponse.ok) {
          const altJsonData = await altResponse.json();
          console.log('✅ Alternative gateway success:', altJsonData);
          return altJsonData;
        }
      } catch (altError) {
        console.error('❌ Alternative gateway also failed:', altError);
      }
    }
    
    throw error;
  }
};

/**
 * Validate IPFS hash format
 * @param hash IPFS hash to validate
 * @returns boolean
 */
export const isValidIPFSHash = (hash: string): boolean => {
  if (!hash) return false;
  
  // CIDv0 (Qm...)
  if (hash.startsWith('Qm') && hash.length === 46) {
    return true;
  }
  
  // CIDv1 (ba...)
  if (hash.startsWith('ba') && hash.length > 46) {
    return true;
  }
  
  return false;
};

/**
 * Upload multiple files ke IPFS
 * @param files Array of files to upload
 * @returns Promise dengan array of results
 */
export const uploadMultipleToIPFS = async (
  files: File[]
): Promise<IPFSUploadResult[]> => {
  console.log(`📤 Uploading ${files.length} files to IPFS...`);
  
  const results = await Promise.all(
    files.map(file => uploadToIPFS(file))
  );
  
  const successful = results.filter(r => r.success).length;
  console.log(`✅ ${successful}/${files.length} files uploaded successfully`);
  
  return results;
};

/**
 * Helper function untuk resize image sebelum upload (optional)
 * @param file Original image file
 * @param maxWidth Maximum width
 * @param maxHeight Maximum height
 * @param quality Image quality (0.1 to 1)
 * @returns Promise dengan resized file
 */
export const resizeImage = async (
  file: File,
  maxWidth: number = 800,
  maxHeight: number = 600,
  quality: number = 0.8
): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw resized image
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(resizedFile);
          } else {
            resolve(file); // Fallback to original if resize fails
          }
        },
        file.type,
        quality
      );
    };
    
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Upload JSON metadata to IPFS
 * @param metadata JSON metadata object
 * @param name Optional name for the metadata file
 * @returns Promise with upload result
 */
export const uploadJSONMetadata = async (
  metadata: IPFSImageMetadata,
  name?: string
): Promise<IPFSMetadataUploadResult> => {
  try {
    console.log('📤 Uploading JSON metadata to IPFS...', metadata);
    
    // Convert metadata to JSON blob
    const jsonString = JSON.stringify(metadata, null, 2);
    const jsonBlob = new Blob([jsonString], { type: 'application/json' });
    const jsonFile = new File([jsonBlob], name || `event-metadata-${Date.now()}.json`, {
      type: 'application/json',
      lastModified: Date.now()
    });
    
    // Check if real IPFS is enabled
    if (DEVELOPMENT_CONFIG.ENABLE_REAL_IPFS && PINATA_JWT) {
      // Real Pinata upload for JSON metadata
      const formData = new FormData();
      formData.append('file', jsonFile);
      
      // Add metadata (simplified for Pinata compliance)
      const pinataMetadata = JSON.stringify({
        name: name || `Event Metadata ${Date.now()}`,
        keyvalues: {
          type: 'event-metadata',
          version: '2.1',
          uploadedAt: new Date().toISOString(),
          hasImages: 'true'
        }
      });
      formData.append('pinataMetadata', pinataMetadata);
      
      // Add options
      const options = JSON.stringify({
        cidVersion: 1,
      });
      formData.append('pinataOptions', options);
      
      const response = await fetch(PINATA_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PINATA_JWT}`,
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Metadata upload failed: ${response.statusText} - ${errorData}`);
      }
      
      const result = await response.json();
      const metadataHash = result.IpfsHash;
      
      console.log('✅ Real JSON metadata upload successful!', metadataHash);
      
      return {
        success: true,
        metadataHash,
        metadataUrl: `${PINATA_GATEWAY}${metadataHash}`
      };
    } else {
      // Mock simulation for JSON metadata
      console.log('🧪 Mock JSON metadata upload (ENABLE_REAL_IPFS=false or missing credentials)');
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate shorter delay for JSON
      const metadataHash = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}JSON`;
      
      console.log('✅ Mock JSON metadata upload successful!', metadataHash);
      
      return {
        success: true,
        metadataHash,
        metadataUrl: `${PINATA_GATEWAY}${metadataHash}`
      };
    }
  } catch (error) {
    console.error('❌ JSON metadata upload failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'JSON metadata upload failed'
    };
  }
};

/**
 * Upload event images + tier NFT backgrounds and create JSON metadata - Phase 2.1 workflow
 * @param posterFile Event poster image (16:9)
 * @param bannerFile Event banner image (21:9) 
 * @param tierNFTFiles Object with tier NFT background files { "tier-1": File, "tier-2": File }
 * @param additionalMetadata Optional additional metadata
 * @returns Promise with final metadata hash for contract storage
 */
export const uploadEventWithTierBackgrounds = async (
  posterFile: File,
  bannerFile: File,
  tierNFTFiles: Record<string, File>,
  additionalMetadata?: Partial<IPFSImageMetadata['eventMetadata']>
): Promise<IPFSMetadataUploadResult> => {
  try {
    console.log('🚀 Starting event + tier NFT upload workflow...');
    console.log('Tier NFT files:', Object.keys(tierNFTFiles));
    
    // Step 1: Upload event images (poster + banner)
    const [posterResult, bannerResult] = await Promise.all([
      uploadToIPFS(posterFile, `event-poster-${Date.now()}.${posterFile.name.split('.').pop()}`),
      uploadToIPFS(bannerFile, `event-banner-${Date.now()}.${bannerFile.name.split('.').pop()}`)
    ]);
    
    // Check if event images uploaded successfully
    if (!posterResult.success || !bannerResult.success) {
      const errors = [
        !posterResult.success ? `Poster: ${posterResult.error}` : null,
        !bannerResult.success ? `Banner: ${bannerResult.error}` : null
      ].filter(Boolean).join(', ');
      
      throw new Error(`Event image upload failed: ${errors}`);
    }
    
    console.log('✅ Event images uploaded successfully!');
    console.log('Poster:', posterResult.hash);
    console.log('Banner:', bannerResult.hash);
    
    // Step 2: Upload tier NFT backgrounds
    const tierUploadPromises = Object.entries(tierNFTFiles).map(async ([tierId, file]) => {
      const result = await uploadToIPFS(file, `nft-tier-${tierId}-${Date.now()}.${file.name.split('.').pop()}`);
      return { tierId, result };
    });
    
    const tierResults = await Promise.all(tierUploadPromises);
    
    // Check if all tier uploads succeeded
    const failedTiers = tierResults.filter(({ result }) => !result.success);
    if (failedTiers.length > 0) {
      const errors = failedTiers.map(({ tierId, result }) => `${tierId}: ${result.error}`).join(', ');
      throw new Error(`Tier NFT upload failed: ${errors}`);
    }
    
    // Create tierBackgrounds mapping
    const tierBackgrounds: Record<string, string> = {};
    tierResults.forEach(({ tierId, result }) => {
      tierBackgrounds[tierId] = result.hash!;
    });
    
    console.log('✅ All tier NFT backgrounds uploaded!');
    console.log('Tier backgrounds:', tierBackgrounds);
    
    // Step 3: Create JSON metadata
    const metadata: IPFSImageMetadata = {
      posterImage: posterResult.hash!,
      bannerImage: bannerResult.hash!,
      tierBackgrounds: tierBackgrounds,
      eventMetadata: {
        ...additionalMetadata,
        createdAt: new Date().toISOString(),
        version: '2.1', // Phase 2.1 - Per-tier NFT backgrounds
        uploadedBy: 'lummy-platform'
      }
    };
    
    // Step 4: Upload JSON metadata
    const metadataResult = await uploadJSONMetadata(metadata, `event-metadata-${Date.now()}`);
    
    if (!metadataResult.success) {
      throw new Error(`Metadata upload failed: ${metadataResult.error}`);
    }
    
    console.log('🎉 Complete event + tier upload workflow successful!');
    console.log('Final metadata hash:', metadataResult.metadataHash);
    
    return metadataResult;
    
  } catch (error) {
    console.error('❌ Event + tier upload workflow failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Complete workflow failed'
    };
  }
};

/**
 * Legacy: Upload 3 images and create JSON metadata - Complete workflow for Phase 2 (DEPRECATED)
 * @deprecated Use uploadEventWithTierBackgrounds instead
 */
export const uploadThreeImagesWithMetadata = async (
  posterFile: File,
  bannerFile: File,
  nftBackgroundFile: File,
  additionalMetadata?: Partial<IPFSImageMetadata['eventMetadata']>
): Promise<IPFSMetadataUploadResult> => {
  // Convert to new format for backward compatibility
  const tierNFTFiles = { 'default': nftBackgroundFile };
  return uploadEventWithTierBackgrounds(posterFile, bannerFile, tierNFTFiles, additionalMetadata);
};