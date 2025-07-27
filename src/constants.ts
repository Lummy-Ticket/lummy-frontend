// IDRX Token on Lisk Sepolia
export const IDRX_LISK_SEPOLIA = "0xD63029C1a3dA68b51c67c6D1DeC3DEe50D681661";
// Legacy naming for compatibility
export const IDRX_SEPOLIA = IDRX_LISK_SEPOLIA;

// Contract addresses - UPDATE THESE WITH ACTUAL DEPLOYED ADDRESSES
export const CONTRACT_ADDRESSES = {
  EventFactory: "0x0000000000000000000000000000000000000000", // PLACEHOLDER - UPDATE WITH DEPLOYED ADDRESS
  MockIDRX: IDRX_LISK_SEPOLIA,    // IDRX token on Lisk Sepolia
  TrustedForwarder: "0x0000000000000000000000000000000000000000", // PLACEHOLDER - UPDATE WITH FORWARDER ADDRESS
} as const;

// Contract constants (from smart contract)
export const PLATFORM_FEE_PERCENTAGE = 100; // 1% (100 basis points)
export const BASIS_POINTS = 10000;
export const DEFAULT_MAX_MARKUP_PERCENTAGE = 2000; // 20% (2000 basis points)

// Token decimals
export const IDRX_DECIMALS = 18;

// Development configuration
export const DEVELOPMENT_CONFIG = {
  // Feature flags for hybrid development
  ENABLE_BLOCKCHAIN: false, // Toggle untuk development vs production
  ENABLE_REAL_IPFS: false,  // Toggle untuk IPFS vs mock storage
  ENABLE_CONTRACT_DEPLOYMENT: false, // Toggle untuk contract calls
  
  // Mock behavior configurations
  MOCK_TRANSACTION_DELAY: 2000, // Simulate blockchain delay
  MOCK_SUCCESS_RATE: 0.95, // 95% success rate untuk mock transactions
  
  // Development helpers
  LOG_CONTRACT_CALLS: true, // Log semua contract calls ke console
  SHOW_DEV_NOTICES: true,   // Show development notices
};

// IPFS configuration
export const IPFS_CONFIG = {
  GATEWAY_URL: "https://gateway.pinata.cloud/ipfs/",
  API_URL: "https://api.pinata.cloud/pinning/pinFileToIPFS",
  // Mock IPFS URLs untuk development
  MOCK_BASE_URL: "https://images.unsplash.com/",
};

// UI Configuration
export const UI_CONFIG = {
  SUPPORTED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp"],
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  NFT_IMAGE_DIMENSIONS: {
    RECOMMENDED: { width: 512, height: 512 },
    MIN: { width: 256, height: 256 },
    MAX: { width: 1024, height: 1024 },
  },
};