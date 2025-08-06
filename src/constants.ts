// IDRX Token on Lisk Sepolia (FINAL DEPLOYMENT)
export const IDRX_LISK_SEPOLIA = "0x1B541Aa4fb31A4d7fd09eAb0eE1D10Bb659737f5";
// Legacy naming for compatibility
export const IDRX_SEPOLIA = IDRX_LISK_SEPOLIA;

// Contract addresses - DEPLOYED ON LISK SEPOLIA (FINAL DEPLOYMENT WITH ALL NEW FEATURES)
export const CONTRACT_ADDRESSES = {
  DiamondLummy: "0xE85dAB17A6BD23CFb75B9C3fB485F5907DFB0239",     // Main Diamond contract (FINAL)
  MockIDRX: "0x1B541Aa4fb31A4d7fd09eAb0eE1D10Bb659737f5",        // IDRX token on Lisk Sepolia (FINAL)
  TrustedForwarder: "0x6506b282Bd4e20683d93DAeaBD0Cbd877903e43b", // SimpleForwarder for gasless txs (FINAL)
  TicketNFT: "0x7076657b501EDA89f43682df965bE50eD209F5A5",        // TicketNFT contract (FINAL)
  
  // Diamond Facets (for reference - all integrated into DiamondLummy)
  EventCoreFacet: "0x51651A4D3Fa7C674f254F528941d9AbB171717b9",     // Contains clearAllTiers() & getIPFSMetadata()
  TicketPurchaseFacet: "0x51651A4D3Fa7C674f254F528941d9AbB171717b9",  // Ticket purchasing logic
  MarketplaceFacet: "0xC35d98ABc842Cff1a0EC2809d3F5c050C5746b6a",    // Marketplace & resale logic
  StaffManagementFacet: "0x62BC6B9A5ff552d259d9d5130d9855Edd0cb9FB4", // Staff management
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

// Chain Configuration
export const CHAIN_CONFIG = {
  chainId: 4202,
  name: "Lisk Sepolia",
  rpcUrl: "https://rpc.sepolia-api.lisk.com",
  blockExplorer: "https://sepolia-blockscout.lisk.com",
} as const;