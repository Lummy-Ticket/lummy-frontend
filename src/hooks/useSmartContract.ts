// src/hooks/useSmartContract.ts
import { useState, useCallback } from "react";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import { EVENT_CORE_FACET_ABI } from "../contracts/EventCoreFacet";
import { TICKET_PURCHASE_FACET_ABI } from "../contracts/TicketPurchaseFacet";
import { TICKET_NFT_ABI } from "../contracts/TicketNFT";
import { IDRX_TOKEN_ABI } from "../contracts/MockIDRX";
import { CONTRACT_ADDRESSES } from "../constants";
import { useEmailService } from "./useEmailService";
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
  const { sendTicketPurchaseNotification } = useEmailService();
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

      console.log("🔍 useSmartContract - Tier count:", tierCount.toString());

      // Get tier details for each tier
      const tiers: TicketTierData[] = [];
      for (let i = 0; i < Number(tierCount); i++) {
        const tier = (await publicClient.readContract({
          address: CONTRACT_ADDRESSES.DiamondLummy as `0x${string}`,
          abi: EVENT_CORE_FACET_ABI,
          functionName: "getTicketTier",
          args: [BigInt(i)],
        })) as [string, bigint, bigint, bigint, bigint, boolean];

        console.log(`🔍 Raw tier ${i}:`, tier);

        const tierData = {
          name: (tier as any).name || tier[0],
          price: (tier as any).price || tier[1],
          available: (tier as any).available || tier[2],
          sold: (tier as any).sold || tier[3],
          maxPerPurchase: (tier as any).maxPerPurchase || tier[4],
          active: (tier as any).active || tier[5],
        };

        console.log(`🔍 Formatted tier ${i}:`, tierData);
        tiers.push(tierData);
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
   * Sets up the TicketNFT contract for the Diamond pattern
   * This must be called before adding ticket tiers
   * @param ticketNFTAddress Address of the TicketNFT contract
   * @param platformFeeReceiver Address to receive platform fees
   * @returns Transaction hash if successful
   */
  const setTicketNFT = useCallback(
    async (ticketNFTAddress?: string, platformFeeReceiver?: string) => {
      if (!walletClient || !address) {
        setError("Wallet not connected");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        // Use Diamond address as temporary NFT contract if not specified
        const nftAddress = ticketNFTAddress || CONTRACT_ADDRESSES.DiamondLummy;
        const feeReceiver = platformFeeReceiver || address;

        const hash = await walletClient.writeContract({
          address: CONTRACT_ADDRESSES.DiamondLummy as `0x${string}`,
          abi: EVENT_CORE_FACET_ABI,
          functionName: "setTicketNFT",
          args: [nftAddress, CONTRACT_ADDRESSES.MockIDRX, feeReceiver],
        });

        await publicClient?.waitForTransactionReceipt({ hash });
        return hash;
      } catch (err) {
        console.error("Error setting up TicketNFT:", err);
        setError(parseContractError(err));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [walletClient, address, publicClient]
  );

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
        
        console.log("🎫 ADD TIER DEBUG:");
        console.log("Name:", name);
        console.log("Price (IDRX):", price);
        console.log("Price (Wei):", priceInWei.toString());
        console.log("Available:", available);
        console.log("Max per purchase:", maxPerPurchase);
        console.log("Contract address:", CONTRACT_ADDRESSES.DiamondLummy);
        console.log("Wallet address:", address);
        
        const hash = await walletClient.writeContract({
          address: CONTRACT_ADDRESSES.DiamondLummy as `0x${string}`,
          abi: EVENT_CORE_FACET_ABI,
          functionName: "addTicketTier",
          args: [name, priceInWei, BigInt(available), BigInt(maxPerPurchase)],
        });

        console.log("✅ Transaction sent:", hash);
        
        const receipt = await publicClient?.waitForTransactionReceipt({ hash });
        console.log("✅ Transaction confirmed:", receipt);
        
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
   * Approves IDRX spending for the Diamond contract
   * @param amount Amount in IDRX to approve
   * @returns Transaction hash if successful
   */
  const approveIDRX = useCallback(
    async (amount: number) => {
      if (!walletClient || !address) {
        setError("Wallet not connected");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const amountInWei = parseTokenAmount(amount.toString());
        
        console.log("🔓 Approving IDRX spending...");
        console.log("Amount:", amount, "IDRX");
        console.log("Amount (Wei):", amountInWei.toString());
        console.log("Spender:", CONTRACT_ADDRESSES.DiamondLummy);
        
        const hash = await walletClient.writeContract({
          address: CONTRACT_ADDRESSES.MockIDRX as `0x${string}`,
          abi: IDRX_TOKEN_ABI,
          functionName: "approve",
          args: [CONTRACT_ADDRESSES.DiamondLummy, amountInWei],
        });

        await publicClient?.waitForTransactionReceipt({ hash });
        console.log("✅ IDRX approval successful:", hash);
        return hash;
      } catch (err) {
        console.error("Error approving IDRX:", err);
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
   * @param eventData Optional event data for email notifications
   * @returns Transaction hash if successful
   */
  const purchaseTickets = useCallback(
    async (tierId: number, quantity: number, eventData?: {
      eventName: string;
      tierName: string;
      totalPrice: number;
      currency: string;
      eventDate: string;
      venue: string;
      eventId?: string;
    }) => {
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
        
        // Send email notification if event data provided
        if (eventData) {
          try {
            await sendTicketPurchaseNotification({
              eventName: eventData.eventName,
              tierName: eventData.tierName,
              quantity,
              totalPrice: eventData.totalPrice,
              currency: eventData.currency,
              transactionHash: hash,
              eventDate: eventData.eventDate,
              venue: eventData.venue,
              eventId: eventData.eventId,
            });
          } catch (emailError) {
            // Email notification failure shouldn't block transaction success
            console.warn('Email notification failed:', emailError);
          }
        }
        
        return hash;
      } catch (err) {
        console.error("Error purchasing tickets:", err);
        setError(parseContractError(err));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [walletClient, address, publicClient, sendTicketPurchaseNotification]
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
   * Burns a ticket NFT to generate QR code (Diamond Pattern)
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

  /**
   * Gets user's ticket NFTs using Transfer events (since ERC721Enumerable is not available)
   * @param userAddress User's wallet address (optional, defaults to connected address)
   * @returns Array of user's ticket NFTs with enhanced metadata
   */
  const getUserTicketNFTs = useCallback(
    async (userAddress?: string) => {
      if (!publicClient) {
        setError("Provider not available");
        return [];
      }

      const targetAddress = userAddress || address;
      if (!targetAddress) {
        setError("User address not available");
        return [];
      }

      setLoading(true);
      setError(null);

      try {
        console.log("🎫 Loading user's ticket NFTs for:", targetAddress);
        console.log("TicketNFT contract:", CONTRACT_ADDRESSES.TicketNFT);

        // Get user's NFT balance first
        const balance = await publicClient.readContract({
          address: CONTRACT_ADDRESSES.TicketNFT as `0x${string}`,
          abi: TICKET_NFT_ABI,
          functionName: "balanceOf",
          args: [targetAddress as `0x${string}`],
        }) as bigint;

        console.log("User NFT balance:", balance.toString());

        if (balance === 0n) {
          return [];
        }

        // Since we don't have enumeration, we'll need to check recent token IDs
        // This is a temporary solution - ideally we'd query Transfer events
        const userNFTs: any[] = [];
        
        // Check a reasonable range of recent token IDs (based on purchase history)
        // In production, this should be done via event logs
        const maxTokensToCheck = 100; // Check last 100 minted tokens
        
        for (let tokenId = 1; tokenId <= maxTokensToCheck; tokenId++) {
          try {
            // Check if user owns this token
            const owner = await publicClient.readContract({
              address: CONTRACT_ADDRESSES.TicketNFT as `0x${string}`,
              abi: TICKET_NFT_ABI,
              functionName: "ownerOf",
              args: [BigInt(tokenId)],
            }) as string;

            if (owner.toLowerCase() === targetAddress.toLowerCase()) {
              console.log(`✅ User owns token ${tokenId}`);
              
              // Get enhanced ticket metadata
              const metadata = await publicClient.readContract({
                address: CONTRACT_ADDRESSES.TicketNFT as `0x${string}`,
                abi: TICKET_NFT_ABI,
                functionName: "getTicketMetadata",
                args: [BigInt(tokenId)],
              }) as any;

              // Convert to our expected format
              const ticketData = {
                tokenId: BigInt(tokenId),
                owner: owner,
                eventId: metadata.eventId,
                tierId: metadata.tierId,
                originalPrice: metadata.originalPrice,
                used: metadata.used,
                purchaseDate: metadata.purchaseDate,
                eventName: metadata.eventName,
                eventVenue: metadata.eventVenue,
                eventDate: metadata.eventDate,
                tierName: metadata.tierName,
                organizerName: metadata.organizerName,
                serialNumber: metadata.serialNumber,
                status: metadata.status,
                transferCount: metadata.transferCount,
              };

              userNFTs.push(ticketData);
              console.log(`✅ Loaded metadata for token ${tokenId}:`, ticketData);
            }
          } catch (tokenError: unknown) {
            // Token doesn't exist or we don't own it, continue
            if (!(tokenError as Error).toString().includes("ERC721: invalid token ID")) {
              console.log(`Token ${tokenId} not owned by user or doesn't exist`);
            }
          }
        }

        console.log("✅ Loaded user NFTs:", userNFTs);
        return userNFTs;
      } catch (err) {
        console.error("Error getting user ticket NFTs:", err);
        setError(parseContractError(err));
        return [];
      } finally {
        setLoading(false);
      }
    },
    [publicClient, address]
  );

  /**
   * Updates all user's NFTs with enhanced metadata from current event
   * @returns Number of NFTs updated successfully
   */
  const updateUserNFTsMetadata = useCallback(
    async () => {
      if (!publicClient || !walletClient || !address) {
        setError("Wallet not connected");
        return 0;
      }

      setLoading(true);
      setError(null);

      try {
        console.log("🔄 Updating user's NFT metadata...");
        
        // Get current event info
        const eventInfo = await getEventInfo();
        const tiers = await getTicketTiers();
        
        if (!eventInfo || !tiers) {
          throw new Error("Could not get event or tier information");
        }

        // Get user's NFT balance
        const balance = await publicClient.readContract({
          address: CONTRACT_ADDRESSES.TicketNFT as `0x${string}`,
          abi: TICKET_NFT_ABI,
          functionName: "balanceOf",
          args: [address as `0x${string}`],
        }) as bigint;

        if (balance === 0n) {
          console.log("No NFTs to update");
          return 0;
        }

        let updatedCount = 0;

        // Check token range for user's NFTs
        for (let tokenId = 1000100001; tokenId <= 1000100010; tokenId++) { // Check reasonable range
          try {
            const owner = await publicClient.readContract({
              address: CONTRACT_ADDRESSES.TicketNFT as `0x${string}`,
              abi: TICKET_NFT_ABI,
              functionName: "ownerOf",
              args: [BigInt(tokenId)],
            }) as string;

            if (owner.toLowerCase() === address.toLowerCase()) {
              console.log(`Updating metadata for token ${tokenId}...`);
              
              // Get tier info for this token (assume tier 0 for now)
              const tier = tiers[0];
              
              const hash = await walletClient.writeContract({
                address: CONTRACT_ADDRESSES.TicketNFT as `0x${string}`,
                abi: TICKET_NFT_ABI,
                functionName: "setEnhancedMetadata",
                args: [
                  BigInt(tokenId),
                  eventInfo.name,
                  eventInfo.venue,
                  eventInfo.date,
                  tier?.name || "General Admission",
                  eventInfo.organizer
                ],
              });
              
              await publicClient.waitForTransactionReceipt({ hash });
              
              updatedCount++;
              console.log(`✅ Updated token ${tokenId} with hash:`, hash);
            }
          } catch (tokenError) {
            // Token doesn't exist or not owned by user
            console.log(`Token ${tokenId} not owned by user or doesn't exist`);
          }
        }

        console.log(`✅ Updated ${updatedCount} NFT(s) with enhanced metadata`);
        return updatedCount;
      } catch (err) {
        console.error("Error updating NFT metadata:", err);
        setError(parseContractError(err));
        return 0;
      } finally {
        setLoading(false);
      }
    },
    [publicClient, walletClient, address, getEventInfo, getTicketTiers]
  );

  /**
   * Sets resale rules for the event
   * @param maxMarkupPercentage Maximum markup percentage (e.g., 20 for 20%)
   * @param organizerFeePercentage Organizer fee percentage (e.g., 2.5 for 2.5%)
   * @param restrictResellTiming Whether to restrict resale timing
   * @param minDaysBeforeEvent Minimum days before event for resale cutoff
   * @returns Transaction hash if successful
   */
  const setResaleRules = useCallback(
    async (
      maxMarkupPercentage: number,
      organizerFeePercentage: number,
      restrictResellTiming: boolean,
      minDaysBeforeEvent: number
    ) => {
      if (!walletClient || !address) {
        setError("Wallet not connected");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        // Convert percentages to basis points (e.g., 20% = 2000 basis points)
        const maxMarkupBasisPoints = Math.floor(maxMarkupPercentage * 100);
        const organizerFeeBasisPoints = Math.floor(organizerFeePercentage * 100);
        
        console.log("📋 SET RESALE RULES DEBUG:");
        console.log("Max markup %:", maxMarkupPercentage, "→", maxMarkupBasisPoints, "basis points");
        console.log("Organizer fee %:", organizerFeePercentage, "→", organizerFeeBasisPoints, "basis points");
        console.log("Restrict timing:", restrictResellTiming);
        console.log("Min days before:", minDaysBeforeEvent);
        
        const hash = await walletClient.writeContract({
          address: CONTRACT_ADDRESSES.DiamondLummy as `0x${string}`,
          abi: EVENT_CORE_FACET_ABI,
          functionName: "setResaleRules",
          args: [
            BigInt(maxMarkupBasisPoints),
            BigInt(organizerFeeBasisPoints),
            restrictResellTiming,
            BigInt(minDaysBeforeEvent)
          ],
        });

        console.log("✅ Resale rules transaction sent:", hash);
        
        const receipt = await publicClient?.waitForTransactionReceipt({ hash });
        console.log("✅ Resale rules transaction confirmed:", receipt);
        
        return hash;
      } catch (err) {
        console.error("Error setting resale rules:", err);
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
    setTicketNFT,
    addTicketTier,
    setResaleRules,
    
    // Ticket operations
    approveIDRX,
    purchaseTickets,
    getTicketMetadata,
    getUserTicketNFTs,
    updateUserNFTsMetadata,
    burnTicketForQR,
    
    // State
    loading,
    error,
  };
};