export type EventStatus = "available" | "limited" | "soldout";

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
  useAlgorithm1: boolean; // Contract field
  factory: string;      // Contract field (address)
  ticketNFT: string;    // Contract field (address)
  idrxToken: string;    // Contract field (address)
  platformFeeReceiver: string; // Contract field (address)
  tierCount: bigint;    // Contract field
}

export interface ContractResaleRules {
  allowResell: boolean;
  maxMarkupPercentage: bigint;
  organizerFeePercentage: bigint;
  restrictResellTiming: boolean;
  minDaysBeforeEvent: bigint;
  requireVerification: boolean;
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
  useAlgorithm1?: boolean;
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
  useAlgorithm1: boolean;
  ipfsMetadata: string;
} & Omit<Event, 'id' | 'eventId' | 'title' | 'description' | 'date' | 'venue' | 'organizer' | 'cancelled' | 'useAlgorithm1' | 'ipfsMetadata'>;

export type UIToContract = {
  eventId: bigint;
  name: string;
  description: string;
  date: bigint;
  venue: string;
  organizer: string;
  cancelled: boolean;
  useAlgorithm1: boolean;
  ipfsMetadata: string;
} & Omit<ContractEvent, 'eventId' | 'name' | 'description' | 'date' | 'venue' | 'organizer' | 'cancelled' | 'useAlgorithm1' | 'ipfsMetadata'>;
