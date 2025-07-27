import { DEVELOPMENT_CONFIG, IPFS_CONFIG, UI_CONFIG } from '../constants';

export interface NFTImageData {
  file: File;
  preview: string;
  ipfsHash?: string;
  ipfsUrl?: string;
}

export interface MockNFTImageUpload {
  success: boolean;
  ipfsHash: string;
  ipfsUrl: string;
  error?: string;
}

class MockNFTImageService {
  private mockHashes = [
    "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG",
    "QmZfpdpYjwKKnbfnTJ5GwKxHr5MhYWWkGdqnNFx5LV4KrX",
    "QmXoypajVPgwPBvQHqaxZvLhJNBPPL7p7L9o4xfwKgJ2VL",
    "QmNLei78zWmzUdbeRB3CiUfAizWUrbeeZh5K1rhAQKCh51",
    "QmPCLx8J7PJxQhvqnUMrPqZgvhkQtMdEo4j5aw5C5mNzgL"
  ];

  /**
   * Validate uploaded image file
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
   * Create preview URL for image
   */
  createPreview(file: File): string {
    return URL.createObjectURL(file);
  }

  /**
   * Mock IPFS upload simulation
   */
  async uploadToIPFS(file: File): Promise<MockNFTImageUpload> {
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, DEVELOPMENT_CONFIG.MOCK_TRANSACTION_DELAY));

    // Simulate occasional failures
    if (Math.random() > DEVELOPMENT_CONFIG.MOCK_SUCCESS_RATE) {
      return {
        success: false,
        ipfsHash: '',
        ipfsUrl: '',
        error: 'Mock IPFS upload failed (simulated network error)'
      };
    }

    // Generate mock IPFS hash
    const mockHash = this.mockHashes[Math.floor(Math.random() * this.mockHashes.length)];
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
   * Generate mock NFT metadata JSON
   */
  generateNFTMetadata(
    eventTitle: string,
    tierName: string,
    tierDescription: string,
    imageUrl: string,
    attributes: any = {}
  ) {
    return {
      name: `${eventTitle} - ${tierName}`,
      description: tierDescription || `Ticket for ${eventTitle}`,
      image: imageUrl,
      attributes: [
        {
          trait_type: "Event",
          value: eventTitle
        },
        {
          trait_type: "Tier",
          value: tierName
        },
        {
          trait_type: "Status",
          value: "Valid"
        },
        ...Object.entries(attributes).map(([key, value]) => ({
          trait_type: key,
          value: value
        }))
      ],
      external_url: `${window.location.origin}/events`, // Link back to platform
    };
  }

  /**
   * Mock metadata upload to IPFS
   */
  async uploadMetadataToIPFS(metadata: any): Promise<MockNFTImageUpload> {
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const mockHash = `meta_${this.mockHashes[Math.floor(Math.random() * this.mockHashes.length)]}`;
    const ipfsUrl = `${IPFS_CONFIG.GATEWAY_URL}${mockHash}`;

    if (DEVELOPMENT_CONFIG.LOG_CONTRACT_CALLS) {
      console.log('🔄 Mock Metadata Upload:', {
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

  /**
   * Process NFT image upload workflow
   */
  async processNFTImage(
    file: File,
    eventTitle: string,
    tierName: string,
    tierDescription: string
  ): Promise<{
    success: boolean;
    imageData?: NFTImageData;
    metadataUrl?: string;
    error?: string;
  }> {
    try {
      // Validate image
      const validation = this.validateImage(file);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Create preview
      const preview = this.createPreview(file);

      // Upload image to IPFS (mock)
      const imageUpload = await this.uploadToIPFS(file);
      if (!imageUpload.success) {
        return { success: false, error: imageUpload.error };
      }

      // Generate and upload metadata
      const metadata = this.generateNFTMetadata(
        eventTitle,
        tierName,
        tierDescription,
        imageUpload.ipfsUrl
      );
      
      const metadataUpload = await this.uploadMetadataToIPFS(metadata);
      if (!metadataUpload.success) {
        return { success: false, error: 'Failed to upload metadata' };
      }

      return {
        success: true,
        imageData: {
          file,
          preview,
          ipfsHash: imageUpload.ipfsHash,
          ipfsUrl: imageUpload.ipfsUrl
        },
        metadataUrl: metadataUpload.ipfsUrl
      };

    } catch (error) {
      console.error('NFT Image processing error:', error);
      return {
        success: false,
        error: 'Failed to process NFT image'
      };
    }
  }

  /**
   * Clean up preview URLs to prevent memory leaks
   */
  cleanupPreview(url: string) {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }
}

export const mockNFTImageService = new MockNFTImageService();