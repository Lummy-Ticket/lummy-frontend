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
