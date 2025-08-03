export type EventStatus = "available" | "limited" | "soldout" | "cancelled" | "completed";

// Contract-compatible types
export interface ContractTicketTier {
  name: string;
  price: bigint;        // Contract uses uint256
  available: bigint;    // Contract uses uint256
  sold: bigint;         // Contract field
  maxPerPurchase: bigint; // Contract uses uint256
  active: boolean;      // Contract field
}

export interface ContractEvent {
  eventId: bigint;      // Contract field (uint256)
  name: string;         // Contract field
  description: string;  // Contract field
  date: bigint;         // Contract field (uint256 timestamp)
  venue: string;        // Contract field
  ipfsMetadata: string; // Contract field
  organizer: string;    // Contract field (address)
  cancelled: boolean;   // Contract field
  completed: boolean;   // Contract field (Diamond Pattern)
  ticketNFT: string;    // Contract field (address)
  idrxToken: string;    // Contract field (address)
  platformFeeReceiver: string; // Contract field (address)
  tierCount: bigint;    // Contract field
}

export interface ContractResaleRules {
  maxMarkupPercentage: bigint;     // Max 50% (5000 basis points)
  organizerFeePercentage: bigint;  // Max 10% (1000 basis points)
  restrictResellTiming: boolean;   // Enable timing restrictions
  minDaysBeforeEvent: bigint;      // Minimum days before event
}

export interface ContractListingInfo {
  seller: string;       // address
  price: bigint;        // uint256
  active: boolean;
  listingDate: bigint;  // uint256
}

// Legacy UI types (for backward compatibility)
export interface TicketTier {
  id: string;
  name: string;
  price: number;
  currency: string;
  description: string;
  available: number;
  maxPerPurchase: number;
  benefits?: string[];
  // NFT Image properties
  nftImage?: File | null;
  nftImageUrl?: string; // For preview/mock
  nftDescription?: string;
  // Contract fields (converted)
  sold?: number;
  active?: boolean;
}

export interface Organizer {
  id: string;
  name: string;
  imageUrl?: string;
  verified: boolean;
  description?: string;
  website?: string;
  eventsHosted?: number;
  // Contract fields
  address?: string;     // Organizer wallet address
}

export interface Event {
  id: string;
  title: string;
  description: string;
  longDescription?: string;
  date: string;
  time: string;
  endTime?: string;
  location: string;
  venue?: string;
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  imageUrl: string;
  bannerUrl?: string;
  price: number;
  currency: string;
  category: string;
  status: EventStatus;
  organizer: Organizer;
  ticketsAvailable: number;
  ticketTiers?: TicketTier[];
  tags?: string[];
  // Contract fields (converted)
  eventId?: string;     // Converted from bigint
  ipfsMetadata?: string;
  cancelled?: boolean;
  completed?: boolean;
}

// Type conversion utilities
export type ContractToUI = {
  id: string;
  eventId: string;
  title: string;
  description: string;
  date: string;
  venue: string;
  organizer: Organizer;
  cancelled: boolean;
  completed: boolean;
  ipfsMetadata: string;
} & Omit<Event, 'id' | 'eventId' | 'title' | 'description' | 'date' | 'venue' | 'organizer' | 'cancelled' | 'completed' | 'ipfsMetadata'>;

export type UIToContract = {
  eventId: bigint;
  name: string;
  description: string;
  date: bigint;
  venue: string;
  organizer: string;
  cancelled: boolean;
  completed: boolean;
  ipfsMetadata: string;
} & Omit<ContractEvent, 'eventId' | 'name' | 'description' | 'date' | 'venue' | 'organizer' | 'cancelled' | 'completed' | 'ipfsMetadata'>;
