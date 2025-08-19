// IDRX Token on Lisk Sepolia (FINAL DEPLOYMENT)
export const IDRX_LISK_SEPOLIA = "0x856556a82ab2685ac9838837290Ea5b2D5C5b8DB";
// Legacy naming for compatibility
export const IDRX_SEPOLIA = IDRX_LISK_SEPOLIA;

// Contract addresses - DEPLOYED ON LISK SEPOLIA (FINAL DEPLOYMENT WITH ALL NEW FEATURES)
export const CONTRACT_ADDRESSES = {
  DiamondLummy: "0xb92EB204d7B0a808750883b1148b060f8ceDe1ad",     // Main Diamond contract (FINAL)
  MockIDRX: "0x856556a82ab2685ac9838837290Ea5b2D5C5b8DB",        // IDRX token on Lisk Sepolia (FINAL)
  TrustedForwarder: "0x9faC9fD3cA564FBb6A19BeA5fa0A219d97199a6A", // SimpleForwarder for gasless txs (FINAL)
  TicketNFT: "0x022B9b20FB07a7374c5d37A17186F59E11F5104B",        // TicketNFT contract (FINAL)
  
  // Diamond Facets (for reference - all integrated into DiamondLummy)
  EventCoreFacet: "0x2Fa1FDFFA8d88d3f080621F151A19f0085b284Ed",     // Contains clearAllTiers() & getIPFSMetadata()
  TicketPurchaseFacet: "0x2427d2F3048Bf7ab10Cb1460e08E15e7D90d1CE4",  // Ticket purchasing logic
  MarketplaceFacet: "0x1dD7B11Dbe6BbDD30D32c58CdD1CE9813308aD56",    // Marketplace & resale logic
  StaffManagementFacet: "0x1b126B7aDF3ceed119148DD816C0232d5b616a8a", // Staff management
} as const;

// Contract constants (from smart contract - UPDATED FOR 7%/3% FEE STRUCTURE)
export const PLATFORM_PRIMARY_FEE_PERCENTAGE = 700; // 7% primary sales (700 basis points)
export const PLATFORM_RESALE_FEE_PERCENTAGE = 300; // 3% resale (300 basis points)
export const BASIS_POINTS = 10000;
export const DEFAULT_MAX_MARKUP_PERCENTAGE = 2000; // 20% (2000 basis points)

// Token decimals
export const IDRX_DECIMALS = 18;

// Development configuration
export const DEVELOPMENT_CONFIG = {
  // Feature flags for hybrid development
  ENABLE_BLOCKCHAIN: true, // Toggle untuk development vs production
  ENABLE_REAL_IPFS: true,   // ✅ Phase 2: Enable real IPFS integration
  ENABLE_CONTRACT_DEPLOYMENT: false, // Toggle untuk contract calls
  
  // Organizer system flags
  ENABLE_ORGANIZER_BACKEND: false, // Toggle untuk real API vs mock
  ENABLE_DOCUMENT_UPLOAD: false,   // Toggle untuk real file upload vs mock
  ENABLE_ADMIN_BLOCKCHAIN_CALLS: false, // Toggle untuk admin contract calls
  
  // Mock behavior configurations
  MOCK_TRANSACTION_DELAY: 2000, // Simulate blockchain delay
  MOCK_SUCCESS_RATE: 0.95, // 95% success rate untuk mock transactions
  MOCK_UPLOAD_DELAY: 1500, // Simulate document upload delay
  MOCK_ADMIN_PROCESSING_TIME: 5000, // Simulate admin review processing
  
  // Development helpers
  LOG_CONTRACT_CALLS: true, // Log semua contract calls ke console
  LOG_API_CALLS: true, // Log organizer API calls
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
  // Document upload configuration
  SUPPORTED_DOCUMENT_TYPES: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  MAX_DOCUMENT_SIZE: 10 * 1024 * 1024, // 10MB for DOCX files
  ORGANIZER_APPLICATION_TEMPLATE_URL: "/assets/templates/organizer-application-template.docx",
};

// Chain Configuration
export const CHAIN_CONFIG = {
  chainId: 4202,
  name: "Lisk Sepolia",
  rpcUrl: "https://rpc.sepolia-api.lisk.com",
  blockExplorer: "https://sepolia-blockscout.lisk.com",
} as const;

