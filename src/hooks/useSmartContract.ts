// src/hooks/useSmartContract.ts
import { useState, useCallback } from "react";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import { EVENT_CORE_FACET_ABI } from "../contracts/EventCoreFacet";
import { TICKET_PURCHASE_FACET_ABI } from "../contracts/TicketPurchaseFacet";
import { TICKET_NFT_ABI } from "../contracts/TicketNFT";
import { CONTRACT_ADDRESSES } from "../constants";
import { 
  parseTokenAmount, 
  parseContractDate,
  parseContractError 
} from "../utils/contractUtils";

/**
 * Interface for Event data returned from Diamond contracts
 */
export interface EventData {
  eventId: bigint;
  name: string;
  description: string;
  date: bigint;  // Unix timestamp
  venue: string;
  ipfsMetadata: string;
  organizer: string;
  cancelled: boolean;
  completed: boolean;
}

/**
 * Interface for Ticket Tier data from contracts (legacy - use ContractTicketTier)
 */
export interface TicketTierData {
  name: string;
  price: bigint;  // Price in Wei
  available: bigint;
  sold: bigint;
  maxPerPurchase: bigint;
  active: boolean;
}

/**
 * Interface for ticket purchase transaction
 */
export interface TicketPurchaseData {
  eventAddress: string;
  tierId: bigint;
  quantity: bigint;
  totalPrice: bigint;
  buyer: string;
}

/**
 * Interface for NFT ticket metadata
 */
export interface TicketNFTMetadata {
  tokenId: bigint;
  owner: string;
  eventAddress: string;
  tierId: bigint;
  originalPrice: bigint;
  used: boolean;
  transferred: boolean;
  qrCode?: string;
}

/**
 * Custom hook for interacting with smart contracts.
 * Provides functions for:
 * - Creating and managing events
 * - Handling ticket tiers
 * - Processing ticket purchases and transfers
 */
export const useSmartContract = () => {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Initializes a new event using Diamond pattern (replaces createEvent)
   * @param name Event name
   * @param description Event description
   * @param date Event date
   * @param venue Event venue
   * @param ipfsMetadata Additional metadata in IPFS
   * @returns Transaction hash if successful, null otherwise
   */
  const initializeEvent = useCallback(
    async (
      name: string,
      description: string,
      date: Date,
      venue: string,
      ipfsMetadata: string = ""
    ) => {
      if (!walletClient || !address || !publicClient) {
        setError("Wallet not connected or provider not available");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        // Convert date to unix timestamp in seconds
        const dateTimestamp = parseContractDate(date.toISOString());

        // Call initialize function on Diamond contract (EventCoreFacet)
        const hash = await walletClient.writeContract({
          address: CONTRACT_ADDRESSES.DiamondLummy as `0x${string}`,
          abi: EVENT_CORE_FACET_ABI,
          functionName: "initialize",
          args: [address, name, description, dateTimestamp, venue, ipfsMetadata],
        });

        // Wait for receipt
        await publicClient.waitForTransactionReceipt({ hash });
        return hash;
      } catch (err) {
        console.error("Error initializing event:", err);
        setError(parseContractError(err));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [walletClient, address, publicClient]
  );

  /**
   * Gets event information from Diamond contract
   * @returns Event information or null if not initialized
   */
  const getEventInfo = useCallback(async () => {
    if (!publicClient) {
      setError("Provider not available");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const eventInfo = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.DiamondLummy as `0x${string}`,
        abi: EVENT_CORE_FACET_ABI,
        functionName: "getEventInfo",
      }) as [string, string, bigint, string, string];

      const [cancelled, completed] = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.DiamondLummy as `0x${string}`,
        abi: EVENT_CORE_FACET_ABI,
        functionName: "getEventStatus",
      }) as [boolean, boolean];

      return {
        eventId: BigInt(0), // Diamond uses single event instance
        name: eventInfo[0],
        description: eventInfo[1],
        date: eventInfo[2],
        venue: eventInfo[3],
        organizer: eventInfo[4],
        cancelled,
        completed,
        ipfsMetadata: "", // Need to get from storage
      } as EventData;
    } catch (err) {
      console.error("Error getting event info:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      return null;
    } finally {
      setLoading(false);
    }
  }, [publicClient]);


  /**
   * Gets all ticket tiers from Diamond contract
   * @returns Array of ticket tiers
   */
  const getTicketTiers = useCallback(async () => {
    if (!publicClient) {
      setError("Provider not available");
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      // Get tier count from Diamond contract
      const tierCount = (await publicClient.readContract({
        address: CONTRACT_ADDRESSES.DiamondLummy as `0x${string}`,
        abi: EVENT_CORE_FACET_ABI,
        functionName: "getTierCount",
      })) as bigint;

      // Get tier details for each tier
      const tiers: TicketTierData[] = [];
      for (let i = 0; i < Number(tierCount); i++) {
        const tier = (await publicClient.readContract({
          address: CONTRACT_ADDRESSES.DiamondLummy as `0x${string}`,
          abi: EVENT_CORE_FACET_ABI,
          functionName: "getTicketTier",
          args: [BigInt(i)],
        })) as [string, bigint, bigint, bigint, bigint, boolean];

        tiers.push({
          name: tier[0],
          price: tier[1],
          available: tier[2],
          sold: tier[3],
          maxPerPurchase: tier[4],
          active: tier[5],
        });
      }

      return tiers;
    } catch (err) {
      console.error("Error getting ticket tiers:", err);
      setError(parseContractError(err));
      return [];
    } finally {
      setLoading(false);
    }
  }, [publicClient]);

  /**
   * Adds a new ticket tier to the Diamond contract
   * @param name Tier name
   * @param price Price in IDRX tokens (will be converted to Wei)
   * @param available Number of tickets available
   * @param maxPerPurchase Maximum tickets per purchase
   * @returns Transaction hash if successful
   */
  const addTicketTier = useCallback(
    async (
      name: string,
      price: number,
      available: number,
      maxPerPurchase: number
    ) => {
      if (!walletClient || !address) {
        setError("Wallet not connected");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const priceInWei = parseTokenAmount(price.toString());
        
        const hash = await walletClient.writeContract({
          address: CONTRACT_ADDRESSES.DiamondLummy as `0x${string}`,
          abi: EVENT_CORE_FACET_ABI,
          functionName: "addTicketTier",
          args: [name, priceInWei, BigInt(available), BigInt(maxPerPurchase)],
        });

        await publicClient?.waitForTransactionReceipt({ hash });
        return hash;
      } catch (err) {
        console.error("Error adding ticket tier:", err);
        setError(parseContractError(err));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [walletClient, address, publicClient]
  );

  /**
   * Purchases tickets using Diamond contract (TicketPurchaseFacet)
   * @param tierId Tier ID to purchase
   * @param quantity Number of tickets to purchase
   * @returns Transaction hash if successful
   */
  const purchaseTickets = useCallback(
    async (tierId: number, quantity: number) => {
      if (!walletClient || !address) {
        setError("Wallet not connected");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const hash = await walletClient.writeContract({
          address: CONTRACT_ADDRESSES.DiamondLummy as `0x${string}`,
          abi: TICKET_PURCHASE_FACET_ABI,
          functionName: "purchaseTicket",
          args: [BigInt(tierId), BigInt(quantity)],
        });

        await publicClient?.waitForTransactionReceipt({ hash });
        return hash;
      } catch (err) {
        console.error("Error purchasing tickets:", err);
        setError(parseContractError(err));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [walletClient, address, publicClient]
  );

  /**
   * Gets ticket NFT metadata for a specific token
   * @param nftAddress NFT contract address
   * @param tokenId Token ID
   * @returns Ticket metadata
   */
  const getTicketMetadata = useCallback(
    async (nftAddress: string, tokenId: bigint) => {
      if (!publicClient) {
        setError("Provider not available");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const metadata = await publicClient.readContract({
          address: nftAddress as `0x${string}`,
          abi: TICKET_NFT_ABI,
          functionName: "getTicketMetadata",
          args: [tokenId],
        }) as [string, bigint, bigint, boolean, boolean];

        const owner = await publicClient.readContract({
          address: nftAddress as `0x${string}`,
          abi: TICKET_NFT_ABI,
          functionName: "ownerOf",
          args: [tokenId],
        }) as string;

        return {
          tokenId,
          owner,
          eventAddress: metadata[0],
          tierId: metadata[1],
          originalPrice: metadata[2],
          used: metadata[3],
          transferred: metadata[4],
        } as TicketNFTMetadata;
      } catch (err) {
        console.error("Error getting ticket metadata:", err);
        setError(parseContractError(err));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [publicClient]
  );

  /**
   * Burns a ticket NFT to generate QR code (Algorithm 1)
   * @param nftAddress NFT contract address
   * @param tokenId Token ID to burn
   * @returns QR code data if successful
   */
  const burnTicketForQR = useCallback(
    async (nftAddress: string, tokenId: bigint) => {
      if (!walletClient || !address) {
        setError("Wallet not connected");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const hash = await walletClient.writeContract({
          address: nftAddress as `0x${string}`,
          abi: TICKET_NFT_ABI,
          functionName: "burn",
          args: [tokenId],
        });

        await publicClient?.waitForTransactionReceipt({ hash });
        
        // Get QR code from burn event
        const qrCode = await publicClient?.readContract({
          address: nftAddress as `0x${string}`,
          abi: TICKET_NFT_ABI,
          functionName: "getQRCode",
          args: [tokenId],
        }) as string;

        return qrCode;
      } catch (err) {
        console.error("Error burning ticket:", err);
        setError(parseContractError(err));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [walletClient, address, publicClient]
  );

  return {
    // Event management (Diamond pattern)
    initializeEvent,
    getEventInfo,
    getTicketTiers,
    addTicketTier,
    
    // Ticket operations
    purchaseTickets,
    getTicketMetadata,
    burnTicketForQR,
    
    // State
    loading,
    error,
  };
};