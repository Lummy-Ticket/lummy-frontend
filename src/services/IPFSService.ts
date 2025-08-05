// src/services/IPFSService.ts
/**
 * IPFS Service untuk upload file ke IPFS menggunakan Pinata
 * Simple implementation untuk event image upload
 */

// Untuk demo purposes, kita gunakan public Pinata endpoint
// Dalam production, sebaiknya pakai backend proxy untuk hide API key
// const PINATA_API_URL = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
const PINATA_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';

// Demo JWT - dalam production sebaiknya dari environment variable
// const PINATA_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiIxMjM0NSIsImVtYWlsIjoiZGVtb0BsdW1teS5pbyIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImlkIjoiRlJBMSIsImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxfV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9.fakeJWTTokenForDemo';

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
    
    // For demo purposes, kita simulasi upload berhasil
    // Dalam production, uncomment kode di bawah untuk real upload
    
    /*
    const response = await fetch(PINATA_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`,
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    const hash = result.IpfsHash;
    */
    
    // Demo simulation - generate fake hash
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate upload delay
    const hash = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    
    const url = `${PINATA_GATEWAY}${hash}`;
    
    console.log('✅ IPFS upload successful!');
    console.log('Hash:', hash);
    console.log('URL:', url);
    
    return {
      success: true,
      hash,
      url
    };
    
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