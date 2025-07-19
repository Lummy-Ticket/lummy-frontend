import { IDRX_DECIMALS } from "../constants";
import { ContractEvent, ContractTicketTier, Event, TicketTier, Organizer } from "../types/Event";

/**
 * Utility functions for converting between frontend types and smart contract types
 */

// ============================================================================
// BIGINT CONVERSION UTILITIES
// ============================================================================

/**
 * Convert Wei (bigint) to IDRX token amount (string)
 * @param wei - Amount in Wei (bigint)
 * @param decimals - Token decimals (default: 18)
 * @returns Formatted token amount as string
 */
export const formatTokenAmount = (wei: bigint, decimals: number = IDRX_DECIMALS): string => {
  const divisor = BigInt(10 ** decimals);
  const quotient = wei / divisor;
  const remainder = wei % divisor;
  
  if (remainder === 0n) {
    return quotient.toString();
  }
  
  const remainderStr = remainder.toString().padStart(decimals, '0');
  const trimmedRemainder = remainderStr.replace(/0+$/, '');
  
  return trimmedRemainder ? `${quotient}.${trimmedRemainder}` : quotient.toString();
};

/**
 * Convert IDRX token amount (string) to Wei (bigint)
 * @param amount - Token amount as string
 * @param decimals - Token decimals (default: 18)
 * @returns Amount in Wei as bigint
 */
export const parseTokenAmount = (amount: string, decimals: number = IDRX_DECIMALS): bigint => {
  const [wholePart, fractionalPart = ''] = amount.split('.');
  const paddedFractional = fractionalPart.padEnd(decimals, '0').slice(0, decimals);
  const fullAmount = wholePart + paddedFractional;
  return BigInt(fullAmount);
};

/**
 * Convert number to Wei (bigint) - useful for mock data
 * @param amount - Amount as number
 * @param decimals - Token decimals (default: 18)
 * @returns Amount in Wei as bigint
 */
export const numberToWei = (amount: number, decimals: number = IDRX_DECIMALS): bigint => {
  return BigInt(Math.floor(amount * Math.pow(10, decimals)));
};

/**
 * Convert Wei (bigint) to number - useful for UI display
 * @param wei - Amount in Wei (bigint)
 * @param decimals - Token decimals (default: 18)
 * @returns Amount as number
 */
export const weiToNumber = (wei: bigint, decimals: number = IDRX_DECIMALS): number => {
  return Number(wei) / Math.pow(10, decimals);
};

// ============================================================================
// DATE CONVERSION UTILITIES
// ============================================================================

/**
 * Convert Unix timestamp (bigint) to ISO date string
 * @param timestamp - Unix timestamp as bigint
 * @returns ISO date string
 */
export const formatContractDate = (timestamp: bigint): string => {
  return new Date(Number(timestamp) * 1000).toISOString();
};

/**
 * Convert ISO date string to Unix timestamp (bigint)
 * @param date - ISO date string
 * @returns Unix timestamp as bigint
 */
export const parseContractDate = (date: string): bigint => {
  return BigInt(Math.floor(new Date(date).getTime() / 1000));
};

/**
 * Format contract timestamp for display
 * @param timestamp - Unix timestamp as bigint
 * @returns Formatted date string
 */
export const formatDisplayDate = (timestamp: bigint): string => {
  return new Date(Number(timestamp) * 1000).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// ============================================================================
// TYPE CONVERSION UTILITIES
// ============================================================================

/**
 * Convert ContractEvent to frontend Event type
 * @param contractEvent - Contract event data
 * @returns Frontend Event object
 */
export const contractEventToUI = (contractEvent: ContractEvent): Event => {
  return {
    id: contractEvent.eventId.toString(),
    eventId: contractEvent.eventId.toString(),
    title: contractEvent.name,
    description: contractEvent.description,
    date: formatContractDate(contractEvent.date),
    time: new Date(Number(contractEvent.date) * 1000).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    location: contractEvent.venue,
    venue: contractEvent.venue,
    price: weiToNumber(0n), // Will be calculated from tiers
    currency: "IDRX",
    category: "Event", // Default category
    status: contractEvent.cancelled ? "soldout" : "available",
    organizer: {
      id: contractEvent.organizer,
      name: "Event Organizer", // Default name
      verified: true,
      address: contractEvent.organizer,
    } as Organizer,
    ticketsAvailable: 0, // Will be calculated from tiers
    ipfsMetadata: contractEvent.ipfsMetadata,
    cancelled: contractEvent.cancelled,
    useAlgorithm1: contractEvent.useAlgorithm1,
    imageUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3", // Default image
    tags: [],
  };
};

/**
 * Convert frontend Event to ContractEvent type
 * @param event - Frontend event data
 * @returns Contract event object
 */
export const uiEventToContract = (event: Event): ContractEvent => {
  return {
    eventId: BigInt(event.eventId || "0"),
    name: event.title,
    description: event.description,
    date: parseContractDate(event.date),
    venue: event.venue || event.location,
    ipfsMetadata: event.ipfsMetadata || "",
    organizer: event.organizer.address || "0x0000000000000000000000000000000000000000",
    cancelled: event.cancelled || false,
    useAlgorithm1: event.useAlgorithm1 || false,
    factory: "0x0000000000000000000000000000000000000000",
    ticketNFT: "0x0000000000000000000000000000000000000000",
    idrxToken: "0x0000000000000000000000000000000000000000",
    platformFeeReceiver: "0x0000000000000000000000000000000000000000",
    tierCount: BigInt(event.ticketTiers?.length || 0),
  };
};

/**
 * Convert ContractTicketTier to frontend TicketTier type
 * @param contractTier - Contract tier data
 * @param id - Tier ID
 * @returns Frontend TicketTier object
 */
export const contractTierToUI = (contractTier: ContractTicketTier, id: string): TicketTier => {
  return {
    id,
    name: contractTier.name,
    price: weiToNumber(contractTier.price),
    currency: "IDRX",
    description: `${contractTier.name} ticket`,
    available: Number(contractTier.available),
    maxPerPurchase: Number(contractTier.maxPerPurchase),
    sold: Number(contractTier.sold),
    active: contractTier.active,
  };
};

/**
 * Convert frontend TicketTier to ContractTicketTier type
 * @param tier - Frontend tier data
 * @returns Contract tier object
 */
export const uiTierToContract = (tier: TicketTier): ContractTicketTier => {
  return {
    name: tier.name,
    price: numberToWei(tier.price),
    available: BigInt(tier.available),
    sold: BigInt(tier.sold || 0),
    maxPerPurchase: BigInt(tier.maxPerPurchase),
    active: tier.active !== undefined ? tier.active : true,
  };
};

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validate if a string is a valid token amount
 * @param amount - Amount string to validate
 * @returns true if valid, false otherwise
 */
export const isValidTokenAmount = (amount: string): boolean => {
  try {
    const parsed = parseFloat(amount);
    return !isNaN(parsed) && parsed > 0 && parsed <= 1000000; // Max 1M tokens
  } catch {
    return false;
  }
};

/**
 * Validate if a string is a valid Ethereum address
 * @param address - Address string to validate
 * @returns true if valid, false otherwise
 */
export const isValidAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

/**
 * Validate if a bigint is within uint256 range
 * @param value - BigInt value to validate
 * @returns true if valid, false otherwise
 */
export const isValidUint256 = (value: bigint): boolean => {
  const maxUint256 = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
  return value >= 0n && value <= maxUint256;
};

// ============================================================================
// FORMATTING UTILITIES
// ============================================================================

/**
 * Format price for display with currency
 * @param price - Price in token amount (number or bigint)
 * @param currency - Currency symbol (default: "IDRX")
 * @returns Formatted price string
 */
export const formatPrice = (price: number | bigint, currency: string = "IDRX"): string => {
  const amount = typeof price === 'bigint' ? formatTokenAmount(price) : price.toString();
  return `${amount} ${currency}`;
};

/**
 * Format large numbers with commas
 * @param num - Number to format
 * @returns Formatted number string
 */
export const formatNumber = (num: number | bigint): string => {
  return num.toLocaleString('id-ID');
};

/**
 * Truncate address for display
 * @param address - Full address
 * @param startLength - Characters to show at start (default: 6)
 * @param endLength - Characters to show at end (default: 4)
 * @returns Truncated address
 */
export const truncateAddress = (address: string, startLength: number = 6, endLength: number = 4): string => {
  if (address.length <= startLength + endLength) {
    return address;
  }
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
};

// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================

/**
 * Parse contract error messages for user-friendly display
 * @param error - Error object or string
 * @returns User-friendly error message
 */
export const parseContractError = (error: any): string => {
  if (typeof error === 'string') {
    return error;
  }

  if (error?.message) {
    const message = error.message.toLowerCase();
    
    if (message.includes('insufficient funds')) {
      return 'Insufficient IDRX balance for this transaction';
    }
    if (message.includes('exceeds balance')) {
      return 'Amount exceeds your token balance';
    }
    if (message.includes('invalid purchase request')) {
      return 'Invalid ticket purchase request';
    }
    if (message.includes('tier does not exist')) {
      return 'Selected ticket tier is not available';
    }
    if (message.includes('event is cancelled')) {
      return 'This event has been cancelled';
    }
    if (message.includes('only organizer can call')) {
      return 'Only the event organizer can perform this action';
    }
    if (message.includes('user denied')) {
      return 'Transaction was cancelled by user';
    }
    
    return error.message;
  }

  return 'An unexpected error occurred';
};

// ============================================================================
// ALGORITHM-SPECIFIC UTILITIES
// ============================================================================

/**
 * Parse Algorithm 1 Token ID format: 1EEETTTSSSSS
 * @param tokenId - Token ID as bigint
 * @returns Parsed token ID components
 */
export const parseAlgorithm1TokenId = (tokenId: bigint): {
  algorithm: number;
  eventId: number;
  tierCode: number;
  sequential: number;
} => {
  const tokenIdStr = tokenId.toString();
  
  if (tokenIdStr.length !== 12 || !tokenIdStr.startsWith('1')) {
    throw new Error('Invalid Algorithm 1 Token ID format');
  }
  
  const algorithm = parseInt(tokenIdStr.slice(0, 1));
  const eventId = parseInt(tokenIdStr.slice(1, 4));
  const tierCode = parseInt(tokenIdStr.slice(4, 7));
  const sequential = parseInt(tokenIdStr.slice(7, 12));
  
  return { algorithm, eventId, tierCode, sequential };
};

/**
 * Generate Algorithm 1 Token ID format: 1EEETTTSSSSS
 * @param eventId - Event ID (0-999)
 * @param tierCode - Tier code (1-999, 1-indexed)
 * @param sequential - Sequential number (1-99999)
 * @returns Token ID as bigint
 */
export const generateAlgorithm1TokenId = (
  eventId: number,
  tierCode: number,
  sequential: number
): bigint => {
  if (eventId > 999) throw new Error('Event ID must be <= 999');
  if (tierCode > 999 || tierCode < 1) throw new Error('Tier code must be 1-999');
  if (sequential > 99999 || sequential < 1) throw new Error('Sequential must be 1-99999');
  
  const tokenIdStr = `1${eventId.toString().padStart(3, '0')}${tierCode.toString().padStart(3, '0')}${sequential.toString().padStart(5, '0')}`;
  return BigInt(tokenIdStr);
};

/**
 * Check if token ID follows Algorithm 1 format
 * @param tokenId - Token ID as bigint
 * @returns true if Algorithm 1 format, false otherwise
 */
export const isAlgorithm1TokenId = (tokenId: bigint): boolean => {
  const tokenIdStr = tokenId.toString();
  return tokenIdStr.length === 12 && tokenIdStr.startsWith('1');
};