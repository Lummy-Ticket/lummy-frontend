// IDRX Token on Lisk Sepolia (FINAL DEPLOYMENT)
export const IDRX_LISK_SEPOLIA = "0xcC15F5bD63BBE859b825ec7B06b2f3e7a059fb64";
// Legacy naming for compatibility
export const IDRX_SEPOLIA = IDRX_LISK_SEPOLIA;

// Contract addresses - DEPLOYED ON LISK SEPOLIA (FINAL DEPLOYMENT WITH ALL NEW FEATURES)
export const CONTRACT_ADDRESSES = {
  DiamondLummy: "0x4D561b1518B35416b14fdE95C7644151766Ba392",     // Main Diamond contract (FINAL)
  MockIDRX: "0xcC15F5bD63BBE859b825ec7B06b2f3e7a059fb64",        // IDRX token on Lisk Sepolia (FINAL)
  TrustedForwarder: "0xfF6750Aa52D879C303023f3339488F5c9bA1E133", // SimpleForwarder for gasless txs (FINAL)
  TicketNFT: "0xeCccb13a614423228991a4b385B16F557961B9F8",        // TicketNFT contract (FINAL)
  
  // Diamond Facets (for reference - all integrated into DiamondLummy)
  EventCoreFacet: "0x32c7059822294F2ce030E3353E879A1435771162",     // Contains clearAllTiers() & getIPFSMetadata()
  TicketPurchaseFacet: "0x83613E71ACCeC9Cd384F1cfC13fC801fA91d07a5",  // Ticket purchasing logic
  MarketplaceFacet: "0x6ad133Bdc59ae230Cfc600EFCB6Ff73D1620c03a",    // Marketplace & resale logic
  StaffManagementFacet: "0x793e59bB8E1B56F1E8500f17Fa5e16b5AAf8B5Ec", // Staff management
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
  ENABLE_REAL_IPFS: false,  // Toggle untuk IPFS vs mock storage
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