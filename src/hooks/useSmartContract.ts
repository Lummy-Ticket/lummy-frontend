// src/hooks/useSmartContract.ts
import { useState, useCallback } from "react";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import {
  EVENT_FACTORY_ADDRESS,
  EVENT_FACTORY_ABI,
} from "../contracts/EventFactory";
import { EVENT_ABI } from "../contracts/Event";
import { TICKET_NFT_ABI } from "../contracts/TicketNFT";
import { 
  parseTokenAmount, 
  parseContractDate,
  parseContractError 
} from "../utils/contractUtils";

/**
 * Interface for Event data returned from contracts (legacy - use ContractEvent)
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
  useAlgorithm1: boolean;
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
   * Creates a new event on the blockchain
   * @param name Event name
   * @param description Event description
   * @param date Event date
   * @param venue Event venue
   * @param ipfsMetadata Additional metadata in IPFS
   * @returns Event contract address if successful, null otherwise
   */
  const createEvent = useCallback(
    async (
      name: string,
      description: string,
      date: Date,
      venue: string,
      ipfsMetadata: string = "",
      useAlgorithm1: boolean = false
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

        // Choose the appropriate function based on algorithm preference
        const functionName = useAlgorithm1 ? "createEvent" : "createEvent";
        const args = useAlgorithm1 
          ? [name, description, dateTimestamp, venue, ipfsMetadata, true]
          : [name, description, dateTimestamp, venue, ipfsMetadata];

        // Prepare transaction
        const hash = await walletClient.writeContract({
          address: EVENT_FACTORY_ADDRESS as `0x${string}`,
          abi: EVENT_FACTORY_ABI,
          functionName,
          args,
        });

        // Wait for receipt
        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        // Find EventCreated event from receipt
        const logs = receipt.logs;

        // Manually find EventCreated event
        for (const log of logs) {
          // EventCreated has signature 'EventCreated(uint256,address)'
          // topic[0] is the event signature hash
          if (
            log.topics[0] ===
            "0x7a74ea23c916c344aa7bb079fa7db0cdb4964ade3d70c7f1c8694f9efa0b8abe"
          ) {
            // Decode eventId and eventContract from log
            // topics[1] is eventId (indexed)
            // topics[2] is eventContract (indexed)
            const eventAddress =
              (`0x${log.topics[2]?.slice(26)}` as `0x${string}`) || "";
            return eventAddress;
          }
        }

        return null;
      } catch (err) {
        console.error("Error creating event:", err);
        setError(parseContractError(err));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [walletClient, address, publicClient]
  );

  /**
   * Retrieves all events from the factory contract
   * @returns Array of event contract addresses
   */
  const getEvents = useCallback(async () => {
    if (!publicClient) {
      setError("Provider not available");
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const events = (await publicClient.readContract({
        address: EVENT_FACTORY_ADDRESS as `0x${string}`,
        abi: EVENT_FACTORY_ABI,
        functionName: "getEvents",
      })) as `0x${string}`[];

      return events;
    } catch (err) {
      console.error("Error getting events:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      return [];
    } finally {
      setLoading(false);
    }
  }, [publicClient]);

  /**
   * Gets the details of a specific event
   * @param eventAddress Contract address of the event
   * @returns Event details or null if error
   */
  const getEventDetails = useCallback(
    async (eventAddress: string) => {
      if (!publicClient) {
        setError("Provider not available");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        // Read event details directly from the event contract
        const [name, description, date, venue, ipfsMetadata, organizer, cancelled, useAlgorithm1] = await Promise.all([
          publicClient.readContract({
            address: eventAddress as `0x${string}`,
            abi: EVENT_ABI,
            functionName: "name",
          }),
          publicClient.readContract({
            address: eventAddress as `0x${string}`,
            abi: EVENT_ABI,
            functionName: "description",
          }),
          publicClient.readContract({
            address: eventAddress as `0x${string}`,
            abi: EVENT_ABI,
            functionName: "date",
          }),
          publicClient.readContract({
            address: eventAddress as `0x${string}`,
            abi: EVENT_ABI,
            functionName: "venue",
          }),
          publicClient.readContract({
            address: eventAddress as `0x${string}`,
            abi: EVENT_ABI,
            functionName: "ipfsMetadata",
          }),
          publicClient.readContract({
            address: eventAddress as `0x${string}`,
            abi: EVENT_ABI,
            functionName: "organizer",
          }),
          publicClient.readContract({
            address: eventAddress as `0x${string}`,
            abi: EVENT_ABI,
            functionName: "cancelled",
          }),
          publicClient.readContract({
            address: eventAddress as `0x${string}`,
            abi: EVENT_ABI,
            functionName: "useAlgorithm1",
          }),
        ]);

        // Get eventId from factory
        const eventId = await publicClient.readContract({
          address: EVENT_FACTORY_ADDRESS as `0x${string}`,
          abi: EVENT_FACTORY_ABI,
          functionName: "eventAddressToId",
          args: [eventAddress as `0x${string}`],
        });

        const details: EventData = {
          eventId: eventId as bigint,
          name: name as string,
          description: description as string,
          date: date as bigint,
          venue: venue as string,
          ipfsMetadata: ipfsMetadata as string,
          organizer: organizer as string,
          cancelled: cancelled as boolean,
          useAlgorithm1: useAlgorithm1 as boolean,
        };

        return details;
      } catch (err) {
        console.error("Error getting event details:", err);
        setError(err instanceof Error ? err.message : "Unknown error occurred");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [publicClient]
  );

  /**
   * Gets all ticket tiers for an event
   * @param eventAddress Contract address of the event
   * @returns Array of ticket tiers
   */
  const getTicketTiers = useCallback(
    async (eventAddress: string) => {
      if (!publicClient) {
        setError("Provider not available");
        return [];
      }

      setLoading(true);
      setError(null);

      try {
        // Get tier count
        const tierCount = (await publicClient.readContract({
          address: eventAddress as `0x${string}`,
          abi: EVENT_ABI,
          functionName: "tierCount",
        })) as bigint;

        // Get tier details for each tier
        const tiers: TicketTierData[] = [];
        for (let i = 0; i < Number(tierCount); i++) {
          const tier = (await publicClient.readContract({
            address: eventAddress as `0x${string}`,
            abi: EVENT_ABI,
            functionName: "ticketTiers",
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
    },
    [publicClient]
  );

  /**
   * Adds a new ticket tier to an event
   * @param eventAddress Contract address of the event
   * @param name Tier name
   * @param price Price in IDRX tokens (will be converted to Wei)
   * @param available Number of tickets available
   * @param maxPerPurchase Maximum tickets per purchase
   * @returns Transaction hash if successful
   */
  const addTicketTier = useCallback(
    async (
      eventAddress: string,
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
          address: eventAddress as `0x${string}`,
          abi: EVENT_ABI,
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
   * Purchases tickets for a specific tier
   * @param eventAddress Contract address of the event
   * @param tierId Tier ID to purchase
   * @param quantity Number of tickets to purchase
   * @returns Transaction hash if successful
   */
  const purchaseTickets = useCallback(
    async (
      eventAddress: string,
      tierId: number,
      quantity: number
    ) => {
      if (!walletClient || !address) {
        setError("Wallet not connected");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const hash = await walletClient.writeContract({
          address: eventAddress as `0x${string}`,
          abi: EVENT_ABI,
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
    // Event management
    createEvent,
    getEvents,
    getEventDetails,
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