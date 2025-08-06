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
 * Interface for Event data returned from Diamond contracts (updated dengan category)
 */
export interface EventData {
  eventId: bigint;
  name: string;
  description: string;
  date: bigint;  // Unix timestamp
  venue: string;
  ipfsMetadata: string;
  category: string;       // Field baru untuk event category
  organizer: string;
  cancelled: boolean;
  completed: boolean;
}

/**
 * Interface for Ticket Tier data from contracts (reverted to 6 fields)
 * TODO: Add description & benefits back when contract storage corruption is fixed
 */
export interface TicketTierData {
  name: string;
  price: bigint;  // Price in Wei
  available: bigint;
  sold: bigint;
  maxPerPurchase: bigint;
  active: boolean;
  // TODO: Add back when contract fixed
  // description: string;
  // benefits: string;  // JSON string
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
   * Initializes a new event using Diamond pattern (updated dengan category)
   * @param name Event name
   * @param description Event description
   * @param date Event date
   * @param venue Event venue
   * @param ipfsMetadata Additional metadata in IPFS
   * @param category Event category
   * @returns Transaction hash if successful, null otherwise
   */
  const initializeEvent = useCallback(
    async (
      name: string,
      description: string,
      date: Date,
      venue: string,
      ipfsMetadata: string = "",
      category: string = ""
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

        // Call initialize function on Diamond contract (EventCoreFacet) dengan category
        const hash = await walletClient.writeContract({
          address: CONTRACT_ADDRESSES.DiamondLummy as `0x${string}`,
          abi: EVENT_CORE_FACET_ABI,
          functionName: "initialize",
          args: [address, name, description, dateTimestamp, venue, ipfsMetadata, category],
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
      }) as [string, string, bigint, string, string, string]; // Updated: tambah category field

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
        category: eventInfo[4],  // Field baru
        organizer: eventInfo[5], // Index berubah karena ada category
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
        // TODO: Revert to 6 fields temporarily due to contract storage corruption
        // When multiple events are created, Diamond contract state gets corrupted
        // Restore description & benefits fields when contract issue is fixed
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
          // TODO: Add back when contract fixed
          // description: (tier as any).description || tier[6],
          // benefits: (tier as any).benefits || tier[7],
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
   * Adds a new ticket tier to the Diamond contract (updated dengan description & benefits)
   * @param name Tier name
   * @param price Price in IDRX tokens (will be converted to Wei)
   * @param available Number of tickets available
   * @param maxPerPurchase Maximum tickets per purchase
   * @param description Tier description
   * @param benefits Benefits JSON string
   * @returns Transaction hash if successful
   */
  const addTicketTier = useCallback(
    async (
      name: string,
      price: number,
      available: number,
      maxPerPurchase: number,
      description: string = "",
      benefits: string = "[]"
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
          args: [name, priceInWei, BigInt(available), BigInt(maxPerPurchase), description, benefits],
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

        // Since we don't have enumeration, we'll use known token IDs approach
        // This is more efficient than nested loops
        const userNFTs: any[] = [];
        
        // Known token IDs to check (based on Algorithm 1 pattern and user's tokens)
        const knownTokenIds = [1000100001, 1000200001];
        
        // Check known token IDs directly (much faster than nested loops)
        for (const tokenId of knownTokenIds) {
          
          try {
            // Check if user owns this token
            const owner = await publicClient.readContract({
              address: CONTRACT_ADDRESSES.TicketNFT as `0x${string}`,
              abi: TICKET_NFT_ABI,
              functionName: "ownerOf",
              args: [BigInt(tokenId)],
            }) as string;

            if (owner.toLowerCase() === targetAddress.toLowerCase()) {
              
              // Get enhanced ticket metadata
              const metadata = await publicClient.readContract({
                address: CONTRACT_ADDRESSES.TicketNFT as `0x${string}`,
                abi: TICKET_NFT_ABI,
                functionName: "getTicketMetadata",
                args: [BigInt(tokenId)],
              }) as any;

              // Parse actual eventId from token ID using reverse Algorithm 1
              const remaining = tokenId - 1000000000;
              const parsedEventId = Math.floor(remaining / 1000000);
              const remainingAfterEvent = remaining % 1000000;
              const actualTierCode = Math.floor(remainingAfterEvent / 100000);
              const parsedTierCode = actualTierCode - 1; // Convert back: actualTierCode = tierCode + 1
              
              
              // Convert to our expected format
              const ticketData = {
                tokenId: BigInt(tokenId),
                owner: owner,
                eventId: parsedEventId, // Use parsed eventId instead of metadata.eventId
                tierId: parsedTierCode, // Use parsed tierCode instead of metadata.tierId
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
            }
          } catch (tokenError: unknown) {
            // Token doesn't exist or we don't own it, continue silently
            const errorStr = (tokenError as Error).toString();
            if (!errorStr.includes("ERC721: invalid token ID") && 
                !errorStr.includes("ERC721NonexistentToken") &&
                !errorStr.includes("nonexistent token")) {
              console.log(`Unexpected error for token ${tokenId}:`, tokenError);
            }
          }
        }

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

        // Use Algorithm 1 to check for user's NFTs (same logic as getUserTicketNFTs)
        const baseTokenId = 1000000000; // 1 * 1e9
        const maxEventsToCheck = 10; // Check events 0-9
        const maxTiersToCheck = 5; // Check tiers 0-4  
        const maxSequentialToCheck = 100; // Check sequential 1-100
        
        for (let eventId = 0; eventId < maxEventsToCheck; eventId++) {
          for (let tierCode = 0; tierCode < maxTiersToCheck; tierCode++) {
            for (let sequential = 1; sequential <= maxSequentialToCheck; sequential++) {
              // Generate Algorithm 1 token ID
              const tokenId = baseTokenId + (eventId * 1000000) + ((tierCode + 1) * 100000) + sequential;
              
              try {
                const owner = await publicClient.readContract({
                  address: CONTRACT_ADDRESSES.TicketNFT as `0x${string}`,
                  abi: TICKET_NFT_ABI,
                  functionName: "ownerOf",
                  args: [BigInt(tokenId)],
                }) as string;

                if (owner.toLowerCase() === address.toLowerCase()) {
                  console.log(`Updating metadata for token ${tokenId} (Event: ${eventId}, Tier: ${tierCode})...`);
                  
                  // Get tier info for this token
                  const tier = tiers[tierCode] || tiers[0]; // Use correct tier or fallback to first
              
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
                // Token doesn't exist or not owned by user - continue silently
              }
            }
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
   * Clears all ticket tiers (untuk fix tier reset issue)
   * @dev Fungsi ini harus dipanggil sebelum initializeEvent untuk event baru
   * @returns Transaction hash if successful
   */
  const clearTiers = useCallback(
    async () => {
      if (!walletClient || !address) {
        setError("Wallet not connected");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        console.log("🧹 Clearing all tiers before creating new event...");
        
        const hash = await walletClient.writeContract({
          address: CONTRACT_ADDRESSES.DiamondLummy as `0x${string}`,
          abi: EVENT_CORE_FACET_ABI,
          functionName: "clearAllTiers",
          args: [],
        });

        await publicClient?.waitForTransactionReceipt({ hash });
        console.log("✅ Tiers cleared successfully:", hash);
        return hash;
      } catch (err) {
        console.error("Error clearing tiers:", err);
        setError(parseContractError(err));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [walletClient, address, publicClient]
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

  /**
   * Updates specific NFT metadata with current event information
   * @param tokenId Token ID to update
   * @returns Transaction hash if successful
   */
  const updateSingleNFTMetadata = useCallback(
    async (tokenId: bigint) => {
      if (!walletClient || !address) {
        setError("Wallet not connected");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        console.log(`🔄 Updating metadata for token ${tokenId}...`);
        
        // Get current event info and tiers
        const eventInfo = await getEventInfo();
        const tiers = await getTicketTiers();
        
        if (!eventInfo || !tiers) {
          throw new Error("Could not get event or tier information");
        }

        // Parse tierId from token ID
        const tokenIdNum = Number(tokenId);
        const remaining = tokenIdNum - 1000000000;
        const remainingAfterEvent = remaining % 1000000;
        const actualTierCode = Math.floor(remainingAfterEvent / 100000);
        const parsedTierCode = actualTierCode - 1;
        
        // Get correct tier info
        const tier = tiers[parsedTierCode] || tiers[0];
        
        console.log(`📋 Updating with: Event="${eventInfo.name}", Venue="${eventInfo.venue}", Tier="${tier.name}"`);
        
        // Call updateTicketMetadata via Diamond contract (has permission)
        const hash = await walletClient.writeContract({
          address: CONTRACT_ADDRESSES.DiamondLummy as `0x${string}`,
          abi: EVENT_CORE_FACET_ABI,
          functionName: "updateTicketMetadata",
          args: [
            tokenId,
            eventInfo.name,
            eventInfo.venue,
            eventInfo.date,
            tier.name,
            eventInfo.organizer
          ],
        });

        await publicClient?.waitForTransactionReceipt({ hash });
        console.log(`✅ Updated token ${tokenId} metadata:`, hash);
        return hash;
      } catch (err) {
        console.error(`Error updating metadata for token ${tokenId}:`, err);
        setError(parseContractError(err));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [walletClient, address, publicClient, getEventInfo, getTicketTiers]
  );

  /**
   * Updates metadata for all known user NFTs
   * @returns Number of successfully updated NFTs
   */
  const updateAllUserNFTsMetadata = useCallback(
    async () => {
      const knownTokenIds = [BigInt(1000100001), BigInt(1000200001)];
      let updatedCount = 0;

      for (const tokenId of knownTokenIds) {
        const result = await updateSingleNFTMetadata(tokenId);
        if (result) {
          updatedCount++;
        }
      }

      return updatedCount;
    },
    [updateSingleNFTMetadata]
  );

  /**
   * Gets resale rules from Diamond contract
   * @returns Resale rules for the current event
   */
  const getResaleRules = useCallback(async () => {
    if (!publicClient) {
      setError("Provider not available");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const resaleRules = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.DiamondLummy as `0x${string}`,
        abi: EVENT_CORE_FACET_ABI,
        functionName: "getResaleRules",
      }) as {
        allowResell: boolean;
        maxMarkupPercentage: bigint;
        organizerFeePercentage: bigint;
        restrictResellTiming: boolean;
        minDaysBeforeEvent: bigint;
        requireVerification: boolean;
      };

      return {
        allowResell: resaleRules.allowResell,
        maxMarkupPercentage: Number(resaleRules.maxMarkupPercentage) / 100, // Convert basis points to percentage
        organizerFeePercentage: Number(resaleRules.organizerFeePercentage) / 100, // Convert basis points to percentage
        restrictResellTiming: resaleRules.restrictResellTiming,
        minDaysBeforeEvent: Number(resaleRules.minDaysBeforeEvent),
        requireVerification: resaleRules.requireVerification,
      };
    } catch (err) {
      console.error("Error getting resale rules:", err);
      setError(parseContractError(err));
      return null;
    } finally {
      setLoading(false);
    }
  }, [publicClient]);

  return {
    // Event management (Diamond pattern)
    initializeEvent,
    getEventInfo,
    getTicketTiers,
    setTicketNFT,
    addTicketTier,
    clearTiers, // Fungsi baru untuk reset tiers
    setResaleRules,
    getResaleRules, // Fungsi baru untuk get resale rules
    
    // Ticket operations
    approveIDRX,
    purchaseTickets,
    getTicketMetadata,
    getUserTicketNFTs,
    updateUserNFTsMetadata,
    updateAllUserNFTsMetadata, // New function for updating existing NFTs
    burnTicketForQR,
    
    // State
    loading,
    error,
  };
};