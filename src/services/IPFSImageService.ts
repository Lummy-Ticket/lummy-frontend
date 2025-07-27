import { DEVELOPMENT_CONFIG, IPFS_CONFIG, UI_CONFIG } from '../constants';

export interface IPFSUploadResult {
  success: boolean;
  ipfsHash?: string;
  ipfsUrl?: string;
  error?: string;
}

class IPFSImageService {
  /**
   * Validate image file
   */
  validateImage(file: File): { valid: boolean; error?: string } {
    // Check file type
    if (!UI_CONFIG.SUPPORTED_IMAGE_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `Unsupported file type. Please use: ${UI_CONFIG.SUPPORTED_IMAGE_TYPES.join(', ')}`
      };
    }

    // Check file size
    if (file.size > UI_CONFIG.MAX_IMAGE_SIZE) {
      return {
        valid: false,
        error: `File too large. Maximum size: ${UI_CONFIG.MAX_IMAGE_SIZE / (1024 * 1024)}MB`
      };
    }

    return { valid: true };
  }

  /**
   * Mock IPFS upload for development
   */
  private async mockUpload(file: File): Promise<IPFSUploadResult> {
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, DEVELOPMENT_CONFIG.MOCK_TRANSACTION_DELAY));

    // Simulate occasional failures
    if (Math.random() > DEVELOPMENT_CONFIG.MOCK_SUCCESS_RATE) {
      return {
        success: false,
        error: 'Mock IPFS upload failed (simulated network error)'
      };
    }

    // Generate mock IPFS hash
    const mockHashes = [
      "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG",
      "QmZfpdpYjwKKnbfnTJ5GwKxHr5MhYWWkGdqnNFx5LV4KrX",
      "QmXoypajVPgwPBvQHqaxZvLhJNBPPL7p7L9o4xfwKgJ2VL",
      "QmNLei78zWmzUdbeRB3CiUfAizWUrbeeZh5K1rhAQKCh51"
    ];
    
    const mockHash = mockHashes[Math.floor(Math.random() * mockHashes.length)];
    const ipfsUrl = `${IPFS_CONFIG.GATEWAY_URL}${mockHash}`;

    if (DEVELOPMENT_CONFIG.LOG_CONTRACT_CALLS) {
      console.log('🔄 Mock IPFS Upload:', {
        fileName: file.name,
        fileSize: file.size,
        mockHash,
        ipfsUrl
      });
    }

    return {
      success: true,
      ipfsHash: mockHash,
      ipfsUrl
    };
  }

  /**
   * Real IPFS upload using Pinata
   */
  private async realUpload(file: File): Promise<IPFSUploadResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const metadata = JSON.stringify({
        name: file.name,
        keyvalues: {
          uploadedBy: 'Lummy Platform',
          fileType: 'event-image',
          uploadDate: new Date().toISOString()
        }
      });
      formData.append('pinataMetadata', metadata);

      const options = JSON.stringify({
        cidVersion: 0,
      });
      formData.append('pinataOptions', options);

      const response = await fetch(IPFS_CONFIG.API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_PINATA_JWT}`,
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`IPFS upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      const ipfsUrl = `${IPFS_CONFIG.GATEWAY_URL}${result.IpfsHash}`;

      if (DEVELOPMENT_CONFIG.LOG_CONTRACT_CALLS) {
        console.log('✅ Real IPFS Upload:', {
          fileName: file.name,
          ipfsHash: result.IpfsHash,
          ipfsUrl
        });
      }

      return {
        success: true,
        ipfsHash: result.IpfsHash,
        ipfsUrl
      };

    } catch (error) {
      console.error('IPFS upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'IPFS upload failed'
      };
    }
  }

  /**
   * Upload image to IPFS (hybrid: mock or real)
   */
  async uploadImage(file: File): Promise<IPFSUploadResult> {
    // Validate image first
    const validation = this.validateImage(file);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error
      };
    }

    // Choose upload method based on configuration
    if (DEVELOPMENT_CONFIG.ENABLE_REAL_IPFS) {
      return await this.realUpload(file);
    } else {
      return await this.mockUpload(file);
    }
  }

  /**
   * Upload multiple images concurrently
   */
  async uploadMultipleImages(files: File[]): Promise<IPFSUploadResult[]> {
    const uploadPromises = files.map(file => this.uploadImage(file));
    return await Promise.all(uploadPromises);
  }

  /**
   * Generate IPFS metadata JSON for event
   */
  generateEventMetadata(
    eventData: any,
    bannerImageUrl?: string,
    ticketTiers?: any[]
  ) {
    return {
      // Core contract data
      name: eventData.title,
      description: eventData.description,
      venue: eventData.venue,
      
      // Extended metadata
      address: eventData.address,
      category: eventData.category,
      endTime: eventData.endTime,
      bannerImage: bannerImageUrl,
      
      // Ticket tiers with NFT data
      ticketTiers: ticketTiers?.map(tier => ({
        id: tier.id,
        name: tier.name,
        description: tier.description,
        price: tier.price,
        quantity: tier.quantity,
        maxPerPurchase: tier.maxPerPurchase,
        benefits: tier.benefits,
        nftImageUrl: tier.nftImageUrl
      })) || [],
      
      // Platform metadata
      platform: 'Lummy',
      version: '1.0',
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Upload event metadata to IPFS
   */
  async uploadMetadata(metadata: any): Promise<IPFSUploadResult> {
    const jsonBlob = new Blob([JSON.stringify(metadata, null, 2)], {
      type: 'application/json'
    });
    
    const jsonFile = new File([jsonBlob], 'event-metadata.json', {
      type: 'application/json'
    });

    if (DEVELOPMENT_CONFIG.ENABLE_REAL_IPFS) {
      return await this.realUpload(jsonFile);
    } else {
      // Mock metadata upload
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockHash = `meta_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const ipfsUrl = `${IPFS_CONFIG.GATEWAY_URL}${mockHash}`;

      if (DEVELOPMENT_CONFIG.LOG_CONTRACT_CALLS) {
        console.log('📋 Mock Metadata Upload:', {
          metadata,
          mockHash,
          ipfsUrl
        });
      }

      return {
        success: true,
        ipfsHash: mockHash,
        ipfsUrl
      };
    }
  }
}

export const ipfsImageService = new IPFSImageService();