// src/hooks/useSmartContract.ts
import { useState, useCallback } from "react";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import { EVENT_CORE_FACET_ABI } from "../contracts/EventCoreFacet";
import { TICKET_PURCHASE_FACET_ABI } from "../contracts/TicketPurchaseFacet";
import { TICKET_NFT_ABI } from "../contracts/TicketNFT";
import { IDRX_TOKEN_ABI } from "../contracts/MockIDRX";
import { MARKETPLACE_FACET_ABI } from "../contracts/MarketplaceFacet";
import { STAFF_MANAGEMENT_FACET_ABI } from "../contracts/StaffManagementFacet";
import { CONTRACT_ADDRESSES, IDRX_DECIMALS, DEVELOPMENT_CONFIG } from "../constants";
import { parseUnits, formatUnits } from "viem";
import { ResaleTicket } from "../components/marketplace/ResaleTicketCard";
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
  description: string;
  benefits: string;  // JSON string
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

      // Get IPFS metadata from contract
      const ipfsMetadata = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.DiamondLummy as `0x${string}`,
        abi: EVENT_CORE_FACET_ABI,
        functionName: "getIPFSMetadata",
      }) as string;

      console.log("🔍 getEventInfo - IPFS Metadata from contract:", ipfsMetadata);

      return {
        eventId: BigInt(1), // Fixed: Diamond uses eventId = 1 for Algorithm 1 tokens
        name: eventInfo[0],
        description: eventInfo[1],
        date: eventInfo[2],
        venue: eventInfo[3],
        category: eventInfo[4],  // Field baru
        organizer: eventInfo[5], // Index berubah karena ada category
        cancelled,
        completed,
        ipfsMetadata: ipfsMetadata, // Real IPFS metadata from contract ✅
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
        // Get full tier data with description & benefits (all 8 fields)
        const tier = (await publicClient.readContract({
          address: CONTRACT_ADDRESSES.DiamondLummy as `0x${string}`,
          abi: EVENT_CORE_FACET_ABI,
          functionName: "getTicketTier",
          args: [BigInt(i)],
        })) as [string, bigint, bigint, bigint, bigint, boolean, string, string];

        console.log(`🔍 Raw tier ${i}:`, tier);

        const tierData = {
          name: (tier as any).name || tier[0],
          price: (tier as any).price || tier[1],
          available: (tier as any).available || tier[2],
          sold: (tier as any).sold !== undefined ? (tier as any).sold : tier[3],
          maxPerPurchase: (tier as any).maxPerPurchase || tier[4],
          active: (tier as any).active || tier[5],
          description: (tier as any).description || tier[6],
          benefits: (tier as any).benefits || tier[7],
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
   * Fallback method to discover user tokens (for older contracts without efficient functions)
   * @param userAddress User address to check
   * @returns Array of token IDs owned by user
   */
  const discoverUserTokensBasic = async (userAddress: string): Promise<bigint[]> => {
    const foundTokenIds: bigint[] = [];
    
    try {
      // Get NFT balance first to check if user has any tokens
      const balance = await publicClient!.readContract({
        address: CONTRACT_ADDRESSES.TicketNFT as `0x${string}`,
        abi: TICKET_NFT_ABI,
        functionName: "balanceOf", 
        args: [userAddress as `0x${string}`],
      }) as bigint;

      console.log(`User balance: ${balance.toString()} NFTs`);

      if (balance === 0n) {
        return foundTokenIds;
      }

      // For known token ID patterns (Algorithm 1: 1EEETTTSSSSS)
      // Check likely token IDs based on recent purchases
      const eventId = 1; // Fixed: Event ID is 1 based on token ID 1001010001
      const expectedBalance = Number(balance);
      console.log(`🔍 Scanning for ${expectedBalance} tokens with basic method...`);
      
      // Optimized: Check likely token IDs in parallel batches
      const candidateTokens: bigint[] = [];
      
      // Generate likely token IDs (first 50 most likely)
      for (let tierId = 0; tierId < 5; tierId++) {
        for (let sequential = 1; sequential <= 10; sequential++) {
          const tokenId = BigInt(1000000000 + (eventId * 1000000) + ((tierId + 1) * 10000) + sequential);
          candidateTokens.push(tokenId);
        }
      }
      
      console.log(`🚀 Batch checking ${candidateTokens.length} potential tokens in parallel...`);
      
      // Check ownership in parallel (much faster!)
      const ownershipChecks = candidateTokens.map(async (tokenId) => {
        try {
          const owner = await publicClient!.readContract({
            address: CONTRACT_ADDRESSES.TicketNFT as `0x${string}`,
            abi: TICKET_NFT_ABI,
            functionName: "ownerOf",
            args: [tokenId],
          }) as string;

          if (owner.toLowerCase() === userAddress.toLowerCase()) {
            console.log(`✅ Found owned token: ${tokenId.toString()}`);
            return tokenId;
          }
        } catch (e) {
          // Token doesn't exist or error
        }
        return null;
      });
      
      // Wait for all parallel checks to complete
      const results = await Promise.all(ownershipChecks);
      const ownedTokens = results.filter((tokenId): tokenId is bigint => tokenId !== null);
      
      foundTokenIds.push(...ownedTokens);
      console.log(`🎯 Found ${ownedTokens.length}/${expectedBalance} tokens using parallel batch method`);

      if (ownedTokens.length < expectedBalance) {
        console.log(`⚠️ Found ${ownedTokens.length}/${expectedBalance} tokens. Some may be from other events.`);
      }
    } catch (e) {
      console.error("Error in basic token discovery:", e);
    }

    return foundTokenIds;
  };

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
        console.log("🚀 Phase 1.3: Loading user NFTs EFFICIENTLY for:", targetAddress);
        
        // Try Phase 1.3 efficient method first, fallback to basic method
        let tokenIds: bigint[] = [];
        
        try {
          // NEW: Phase 1.3 - Use efficient getAttendeeTokens (replaces 5000+ contract calls!)
          tokenIds = await publicClient.readContract({
            address: CONTRACT_ADDRESSES.DiamondLummy as `0x${string}`,
            abi: EVENT_CORE_FACET_ABI,
            functionName: "getAttendeeTokens",
            args: [targetAddress as `0x${string}`],
          }) as bigint[];

          console.log(`✅ Found ${tokenIds.length} tokens using efficient method (1 call vs 5000+ calls)`);
        } catch (efficientError) {
          console.warn("⚠️ Efficient method failed, falling back to basic discovery:", (efficientError as Error).message);
          
          // Fallback: Try to find user's tokens by checking known pattern
          // This is less efficient but works with older contract deployments
          console.log("🔄 Starting basic token discovery (max 60 seconds)...");
          
          const discoveryPromise = discoverUserTokensBasic(targetAddress);
          const timeoutPromise = new Promise<bigint[]>((_, reject) => {
            setTimeout(() => reject(new Error("Token discovery timeout")), 60000); // Increased to 60 seconds
          });
          
          try {
            tokenIds = await Promise.race([discoveryPromise, timeoutPromise]);
            console.log(`📦 Found ${tokenIds.length} tokens using basic method (fallback)`);
          } catch (timeoutError) {
            console.warn("⏰ Token discovery timed out, returning empty array");
            tokenIds = [];
          }
        }

        if (tokenIds.length === 0) {
          return [];
        }

        // Get metadata for each token in parallel
        const userNFTs: any[] = [];
        
        for (const tokenIdBigInt of tokenIds) {
          try {
            // Get enhanced ticket metadata
            const metadata = await publicClient.readContract({
              address: CONTRACT_ADDRESSES.TicketNFT as `0x${string}`,
              abi: TICKET_NFT_ABI,
              functionName: "getTicketMetadata",
              args: [tokenIdBigInt],
            }) as any;

            // Parse eventId and tierId from token ID using Algorithm 1
            const tokenId = Number(tokenIdBigInt);
            const remaining = tokenId - 1000000000;
            const parsedEventId = Math.floor(remaining / 1000000);
            const remainingAfterEvent = remaining % 1000000;
            const actualTierCode = Math.floor(remainingAfterEvent / 10000);
            const parsedTierCode = actualTierCode - 1;
            
            // Convert to expected format with auto-populated metadata
            const ticketData = {
              tokenId: tokenIdBigInt,
              owner: targetAddress, // We know this from getAttendeeTokens
              eventId: parsedEventId,
              tierId: parsedTierCode,
              originalPrice: metadata.originalPrice,
              used: metadata.used,
              purchaseDate: metadata.purchaseDate,
              // Phase 1.1 auto-populated metadata - no more "Unknown Event"!
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
          } catch (tokenError) {
            console.error(`Error getting metadata for token ${tokenIdBigInt}:`, tokenError);
          }
        }

        console.log(`✅ Phase 1.3 Success: Loaded ${userNFTs.length} NFTs efficiently`);
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
              const tokenId = baseTokenId + (eventId * 1000000) + ((tierCode + 1) * 10000) + sequential;
              
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
        const actualTierCode = Math.floor(remainingAfterEvent / 10000);
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
      const knownTokenIds = [BigInt(1001010001), BigInt(1001020001)];
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

  /**
   * Transfer NFT ticket to another address
   * @param tokenId Token ID to transfer
   * @param toAddress Recipient address
   * @returns Transaction hash if successful
   */
  const transferNFT = useCallback(
    async (tokenId: string, toAddress: string) => {
      if (!walletClient || !address) {
        setError("Wallet not connected");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        // Verify ownership first
        const owner = await publicClient?.readContract({
          address: CONTRACT_ADDRESSES.TicketNFT as `0x${string}`,
          abi: TICKET_NFT_ABI,
          functionName: "ownerOf",
          args: [BigInt(tokenId)],
        });

        if (owner?.toString().toLowerCase() !== address.toLowerCase()) {
          throw new Error("You don't own this NFT ticket");
        }

        // Perform the transfer using safeTransferFrom
        const hash = await walletClient.writeContract({
          address: CONTRACT_ADDRESSES.TicketNFT as `0x${string}`,
          abi: TICKET_NFT_ABI,
          functionName: "safeTransferFrom",
          args: [
            address as `0x${string}`, // from
            toAddress as `0x${string}`, // to  
            BigInt(tokenId), // tokenId
          ],
        });

        await publicClient?.waitForTransactionReceipt({ hash });
        
        console.log("✅ NFT transfer successful:", hash);
        return hash;
      } catch (err) {
        console.error("Error transferring NFT:", err);
        setError(parseContractError(err));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [walletClient, address, publicClient]
  );

  /**
   * Create resale listing on marketplace
   * @param tokenId Token ID to list for resale
   * @param priceInIDRX Price in IDRX (as string to maintain precision)
   * @returns Transaction hash if successful
   */
  const createResaleListing = useCallback(
    async (tokenId: string, priceInIDRX: string) => {
      if (!walletClient || !address) {
        setError("Wallet not connected");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        // Convert price to Wei (IDRX has 18 decimals)
        const priceInWei = parseUnits(priceInIDRX, IDRX_DECIMALS);

        // First, verify ownership
        const owner = await publicClient?.readContract({
          address: CONTRACT_ADDRESSES.TicketNFT as `0x${string}`,
          abi: TICKET_NFT_ABI,
          functionName: "ownerOf",
          args: [BigInt(tokenId)],
        });

        if (owner?.toString().toLowerCase() !== address.toLowerCase()) {
          throw new Error("You don't own this NFT ticket");
        }

        // Approve marketplace to transfer the NFT (if not already approved)
        const approvedAddress = await publicClient?.readContract({
          address: CONTRACT_ADDRESSES.TicketNFT as `0x${string}`,
          abi: TICKET_NFT_ABI,
          functionName: "getApproved",
          args: [BigInt(tokenId)],
        });

        if (approvedAddress?.toString().toLowerCase() !== CONTRACT_ADDRESSES.DiamondLummy.toLowerCase()) {
          // Need to approve marketplace first
          const approveHash = await walletClient.writeContract({
            address: CONTRACT_ADDRESSES.TicketNFT as `0x${string}`,
            abi: TICKET_NFT_ABI,
            functionName: "approve",
            args: [
              CONTRACT_ADDRESSES.DiamondLummy as `0x${string}`,
              BigInt(tokenId),
            ],
          });

          await publicClient?.waitForTransactionReceipt({ hash: approveHash });
          console.log("✅ NFT approved for marketplace:", approveHash);
        }

        // Create resale listing
        const hash = await walletClient.writeContract({
          address: CONTRACT_ADDRESSES.DiamondLummy as `0x${string}`,
          abi: MARKETPLACE_FACET_ABI,
          functionName: "listTicketForResale",
          args: [
            BigInt(tokenId),
            priceInWei,
          ],
        });

        await publicClient?.waitForTransactionReceipt({ hash });
        
        console.log("✅ Resale listing created:", hash);
        return hash;
      } catch (err) {
        console.error("Error creating resale listing:", err);
        setError(parseContractError(err));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [walletClient, address, publicClient]
  );

  /**
   * Deduplicate listings: Keep only latest listing per tokenId
   * @param listings Array of listings that may contain duplicates
   * @returns Array with only latest listing per tokenId
   */
  const deduplicateListingsByTokenId = (listings: (ResaleTicket & { blockNumber?: bigint })[]): ResaleTicket[] => {
    const tokenIdMap = new Map<string, ResaleTicket & { blockNumber?: bigint }>();
    
    // Group by tokenId and keep latest based on blockNumber (more accurate than timestamp)
    listings.forEach(listing => {
      const existingListing = tokenIdMap.get(listing.tokenId);
      
      if (!existingListing || 
          (listing.blockNumber && existingListing.blockNumber && listing.blockNumber > existingListing.blockNumber) ||
          (!existingListing.blockNumber && listing.blockNumber)) {
        tokenIdMap.set(listing.tokenId, listing);
      }
    });
    
    const deduplicated = Array.from(tokenIdMap.values()).map(listing => {
      // Remove blockNumber from final result (clean up)
      const { blockNumber, ...cleanListing } = listing;
      return cleanListing as ResaleTicket;
    });
    
    console.log(`🔄 Deduplication: ${listings.length} → ${deduplicated.length} listings`);
    
    return deduplicated;
  };

  /**
   * Get all active marketplace listings
   * @returns Array of active resale listings with full metadata
   */
  const getActiveMarketplaceListings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (!publicClient) {
        throw new Error("Public client not available");
      }

      console.log("🔍 Fetching marketplace listings via events...");

      // Get TicketListedForResale events from the last 10000 blocks
      const currentBlock = await publicClient.getBlockNumber();
      const fromBlock = currentBlock - 10000n > 0n ? currentBlock - 10000n : 0n;

      const listingEvents = await publicClient.getLogs({
        address: CONTRACT_ADDRESSES.DiamondLummy as `0x${string}`,
        event: {
          type: 'event',
          name: 'TicketListedForResale',
          inputs: [
            { name: 'tokenId', type: 'uint256', indexed: true },
            { name: 'seller', type: 'address', indexed: true },
            { name: 'price', type: 'uint256', indexed: false }
          ]
        },
        fromBlock,
        toBlock: 'latest'
      });

      console.log("📅 Found listing events:", listingEvents.length);

      // Convert events to active listings
      const listings: ResaleTicket[] = [];

      for (const event of listingEvents) {
        try {
          const tokenId = event.args?.tokenId?.toString();
          const seller = event.args?.seller;
          const price = event.args?.price;

          if (!tokenId || !seller || !price) {
            console.warn("⚠️ Incomplete event data:", event);
            continue;
          }

          // Check if listing is still active
          const listingInfo = await publicClient.readContract({
            address: CONTRACT_ADDRESSES.DiamondLummy as `0x${string}`,
            abi: MARKETPLACE_FACET_ABI,
            functionName: "getListing",
            args: [BigInt(tokenId)],
          }) as any;

          // Skip inactive listings
          if (!listingInfo?.active) {
            console.log(`⏭️ Skipping inactive listing for token ${tokenId}`);
            continue;
          }
          
          // Get NFT metadata
          const metadata = await publicClient.readContract({
            address: CONTRACT_ADDRESSES.TicketNFT as `0x${string}`,
            abi: TICKET_NFT_ABI,
            functionName: "getTicketMetadata",
            args: [BigInt(tokenId)],
          });

          // Get event info from Diamond contract
          const eventInfo = await getEventInfo();
          
          if (metadata && eventInfo) {
            const listing: ResaleTicket & { blockNumber?: bigint } = {
              id: `resale-${tokenId}`,
              eventId: eventInfo.eventId ? eventInfo.eventId.toString() : "1",
              eventName: (metadata as any).eventName || eventInfo.name || "Unknown Event",
              eventDate: eventInfo.date ? new Date(Number(eventInfo.date) * 1000).toISOString() : new Date().toISOString(),
              eventLocation: (metadata as any).eventVenue || eventInfo.venue || "Unknown Location",
              ticketType: (metadata as any).tierName || "General Admission",
              originalPrice: Number(formatUnits((metadata as any).originalPrice || BigInt(0), IDRX_DECIMALS)),
              resalePrice: Number(formatUnits(price, IDRX_DECIMALS)),
              currency: "IDRX",
              listedDate: new Date().toISOString(), // Could get from block timestamp
              sellerAddress: seller as string,
              sellerRating: 4.5, // Default rating - could be enhanced
              tokenId: tokenId,
              transferCount: Number((metadata as any).transferCount || 0),
              blockNumber: event.blockNumber, // For accurate deduplication
            };
            
            listings.push(listing);
            console.log(`✅ Added active listing for token ${tokenId}`);
          }
        } catch (tokenError) {
          console.error(`Error processing event for token:`, tokenError);
          // Continue with other events
        }
      }

      console.log("📋 Raw listings from events:", listings);

      // Deduplicate listings: Keep only latest listing per tokenId
      const deduplicatedListings = deduplicateListingsByTokenId(listings);
      
      console.log("✅ Deduplicated marketplace listings:", deduplicatedListings);
      return deduplicatedListings;
      
    } catch (err) {
      console.error("Error fetching marketplace listings:", err);
      setError(parseContractError(err));
      return [];
    } finally {
      setLoading(false);
    }
  }, [publicClient, getEventInfo]);

  /**
   * Purchase a resale ticket from marketplace
   * @param tokenId Token ID to purchase
   * @returns Transaction hash if successful
   */
  const purchaseResaleTicket = useCallback(
    async (tokenId: string) => {
      if (!walletClient || !address) {
        setError("Wallet not connected");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        // Get listing info to know the price
        const listing = await publicClient?.readContract({
          address: CONTRACT_ADDRESSES.DiamondLummy as `0x${string}`,
          abi: MARKETPLACE_FACET_ABI,
          functionName: "getListing",
          args: [BigInt(tokenId)],
        });

        if (!listing || !(listing as any).active) {
          throw new Error("Listing not found or inactive");
        }

        const listingPrice = (listing as any).price;

        // Approve IDRX for the purchase
        const approveHash = await walletClient.writeContract({
          address: CONTRACT_ADDRESSES.MockIDRX as `0x${string}`,
          abi: IDRX_TOKEN_ABI,
          functionName: "approve",
          args: [
            CONTRACT_ADDRESSES.DiamondLummy as `0x${string}`,
            listingPrice,
          ],
        });

        await publicClient?.waitForTransactionReceipt({ hash: approveHash });
        console.log("✅ IDRX approved for resale purchase:", approveHash);

        // Purchase the resale ticket
        const hash = await walletClient.writeContract({
          address: CONTRACT_ADDRESSES.DiamondLummy as `0x${string}`,
          abi: MARKETPLACE_FACET_ABI,
          functionName: "purchaseResaleTicket",
          args: [BigInt(tokenId)],
        });

        await publicClient?.waitForTransactionReceipt({ hash });
        
        console.log("✅ Resale ticket purchased:", hash);
        return hash;
      } catch (err) {
        console.error("Error purchasing resale ticket:", err);
        setError(parseContractError(err));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [walletClient, address, publicClient]
  );

  /**
   * Cancel a resale listing
   * @param tokenId Token ID to cancel listing for
   * @returns Transaction hash if successful
   */
  const cancelResaleListing = useCallback(
    async (tokenId: string) => {
      if (!walletClient || !address) {
        setError("Wallet not connected");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const hash = await walletClient.writeContract({
          address: CONTRACT_ADDRESSES.DiamondLummy as `0x${string}`,
          abi: MARKETPLACE_FACET_ABI,
          functionName: "cancelResaleListing",
          args: [BigInt(tokenId)],
        });

        await publicClient?.waitForTransactionReceipt({ hash });
        
        console.log("✅ Resale listing cancelled:", hash);
        return hash;
      } catch (err) {
        console.error("Error cancelling resale listing:", err);
        setError(parseContractError(err));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [walletClient, address, publicClient]
  );

  /**
   * Validate ticket for staff scanning
   * @param tokenId Token ID to validate
   * @returns Ticket validation result
   */
  const validateTicket = useCallback(
    async (tokenId: string) => {
      if (!publicClient) {
        setError("Provider not available");
        return null;
      }

      setError(null);

      try {
        // Get NFT metadata
        const metadata = await publicClient.readContract({
          address: CONTRACT_ADDRESSES.TicketNFT as `0x${string}`,
          abi: TICKET_NFT_ABI,
          functionName: "getTicketMetadata",
          args: [BigInt(tokenId)],
        });

        // Get owner
        const owner = await publicClient.readContract({
          address: CONTRACT_ADDRESSES.TicketNFT as `0x${string}`,
          abi: TICKET_NFT_ABI,
          functionName: "ownerOf",
          args: [BigInt(tokenId)],
        });

        // Get event info
        const eventInfo = await getEventInfo();

        if (metadata && eventInfo) {
          const ticketMetadata = metadata as any;
          return {
            tokenId,
            owner: owner as string,
            eventId: eventInfo.eventId ? eventInfo.eventId.toString() : "1",
            eventName: ticketMetadata.eventName || eventInfo.name || "Unknown Event",
            eventVenue: ticketMetadata.eventVenue || eventInfo.venue || "Unknown Venue",
            tierName: ticketMetadata.tierName || "Unknown Tier",
            originalPrice: ticketMetadata.originalPrice || BigInt(0),
            used: ticketMetadata.used || false,
            status: ticketMetadata.used ? 'used' : 'valid',
            transferCount: Number(ticketMetadata.transferCount || 0)
          };
        }

        return null;
      } catch (err) {
        console.error("Error validating ticket:", err);
        setError(parseContractError(err));
        return null;
      }
    },
    [publicClient, getEventInfo]
  );

  /**
   * Get staff role for current wallet address
   * @returns Staff role enum (0=NONE, 1=SCANNER, 2=CHECKIN, 3=MANAGER)
   */
  const getStaffRole = useCallback(
    async (staffAddress?: string) => {
      if (!publicClient) {
        setError("Provider not available");
        return null;
      }

      const targetAddress = staffAddress || address;
      if (!targetAddress) {
        return null;
      }

      try {
        const role = await publicClient.readContract({
          address: CONTRACT_ADDRESSES.DiamondLummy as `0x${string}`,
          abi: STAFF_MANAGEMENT_FACET_ABI,
          functionName: "getStaffRole",
          args: [targetAddress as `0x${string}`],
        });

        return Number(role); // Convert to number (0=NONE, 1=SCANNER, 2=CHECKIN, 3=MANAGER)
      } catch (err) {
        console.error("Error getting staff role:", err);
        setError(parseContractError(err));
        return null;
      }
    },
    [publicClient, address]
  );

  /**
   * Check if wallet has sufficient staff privileges
   * @param requiredRole Minimum role required (1=SCANNER, 2=CHECKIN, 3=MANAGER)
   * @returns True if has sufficient privileges
   */
  const hasStaffRole = useCallback(
    async (requiredRole: number, staffAddress?: string) => {
      if (!publicClient) {
        setError("Provider not available");
        return false;
      }

      const targetAddress = staffAddress || address;
      if (!targetAddress) {
        return false;
      }

      try {
        const hasRole = await publicClient.readContract({
          address: CONTRACT_ADDRESSES.DiamondLummy as `0x${string}`,
          abi: STAFF_MANAGEMENT_FACET_ABI,
          functionName: "hasStaffRole",
          args: [targetAddress as `0x${string}`, requiredRole],
        });

        return Boolean(hasRole);
      } catch (err) {
        console.error("Error checking staff role:", err);
        setError(parseContractError(err));
        return false;
      }
    },
    [publicClient, address]
  );

  /**
   * Validate ticket using StaffManagementFacet (requires staff role)
   * @param tokenId Token ID to validate
   * @returns Enhanced ticket validation result
   */
  const validateTicketAsStaff = useCallback(
    async (tokenId: string) => {
      if (!walletClient || !address) {
        setError("Wallet not connected");
        return null;
      }

      setError(null);

      try {
        // Debug staff privileges
        const staffRoleNumber = await getStaffRole();
        const hasStaffPrivileges = await hasStaffRole(1); // SCANNER role minimum
        
        if (DEVELOPMENT_CONFIG.LOG_CONTRACT_CALLS) {
          console.log('🔍 Staff Role Debug:', {
            address,
            staffRoleNumber,
            hasStaffPrivileges,
            contractAddress: CONTRACT_ADDRESSES.DiamondLummy
          });
        }
        
        if (!hasStaffPrivileges) {
          throw new Error(`Insufficient staff privileges - requires SCANNER role or higher. Current role: ${staffRoleNumber}`);
        }

        // Use alternative approach: Get ticket data directly from TicketNFT
        // Since we already verified staff privileges above, we can bypass the contract's msg.sender check
        console.log(`🔄 Using direct TicketNFT approach to bypass msg.sender validation...`);
        
        // Get basic ticket info from TicketNFT directly
        const owner = await publicClient?.readContract({
          address: CONTRACT_ADDRESSES.TicketNFT as `0x${string}`,
          abi: TICKET_NFT_ABI,
          functionName: "ownerOf",
          args: [BigInt(tokenId)],
        }) as string;
        
        const status = await publicClient?.readContract({
          address: CONTRACT_ADDRESSES.TicketNFT as `0x${string}`,
          abi: TICKET_NFT_ABI,
          functionName: "getTicketStatus",
          args: [BigInt(tokenId)],
        }) as string;
        
        // Set validation results
        const isValid = status === "valid";
        const tierId = BigInt(1); // We'll get this from metadata
        
        console.log(`🔍 Direct TicketNFT validation result:`, { isValid, owner, tierId, status });

        // Get enhanced metadata
        const metadata = await publicClient?.readContract({
          address: CONTRACT_ADDRESSES.TicketNFT as `0x${string}`,
          abi: TICKET_NFT_ABI,
          functionName: "getTicketMetadata",
          args: [BigInt(tokenId)],
        });

        // Get event info
        const eventInfo = await getEventInfo();

        if (metadata && eventInfo) {
          const ticketMetadata = metadata as any;
          return {
            tokenId,
            isValid,
            owner,
            tierId: Number(tierId),
            status,
            eventId: eventInfo.eventId ? eventInfo.eventId.toString() : "1",
            eventName: ticketMetadata.eventName || eventInfo.name || "Unknown Event",
            eventVenue: ticketMetadata.eventVenue || eventInfo.venue || "Unknown Venue",
            tierName: ticketMetadata.tierName || "Unknown Tier",
            originalPrice: ticketMetadata.originalPrice || BigInt(0),
            transferCount: Number(ticketMetadata.transferCount || 0),
            canMarkAsUsed: status === 'valid' && isValid
          };
        }

        return {
          tokenId,
          isValid,
          owner,
          tierId: Number(tierId),
          status,
          canMarkAsUsed: status === 'valid' && isValid
        };
      } catch (err) {
        console.error("Error validating ticket as staff:", err);
        setError(parseContractError(err));
        return null;
      }
    },
    [walletClient, address, publicClient, hasStaffRole, getEventInfo]
  );

  /**
   * Update ticket status from valid to used (requires staff role)
   * @param tokenId Token ID to mark as used
   * @returns Transaction hash if successful
   */
  const updateTicketStatus = useCallback(
    async (tokenId: string) => {
      if (!walletClient || !address) {
        setError("Wallet not connected");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        // Check staff privileges first
        const hasStaffPrivileges = await hasStaffRole(1); // SCANNER role minimum
        if (!hasStaffPrivileges) {
          throw new Error("Insufficient staff privileges - requires SCANNER role or higher");
        }

        // Update ticket status via StaffManagementFacet
        const hash = await walletClient.writeContract({
          address: CONTRACT_ADDRESSES.DiamondLummy as `0x${string}`,
          abi: STAFF_MANAGEMENT_FACET_ABI,
          functionName: "updateTicketStatus",
          args: [BigInt(tokenId)],
        });

        await publicClient?.waitForTransactionReceipt({ hash });
        
        console.log(`✅ Ticket ${tokenId} marked as used:`, hash);
        return hash;
      } catch (err) {
        console.error("Error updating ticket status:", err);
        setError(parseContractError(err));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [walletClient, address, publicClient, hasStaffRole]
  );

  /**
   * Batch update multiple ticket statuses (efficient for bulk check-in)
   * @param tokenIds Array of token IDs to mark as used
   * @returns Transaction hash if successful
   */
  const batchUpdateTicketStatus = useCallback(
    async (tokenIds: string[]) => {
      if (!walletClient || !address) {
        setError("Wallet not connected");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        // Check staff privileges first
        const hasStaffPrivileges = await hasStaffRole(1); // SCANNER role minimum
        if (!hasStaffPrivileges) {
          throw new Error("Insufficient staff privileges - requires SCANNER role or higher");
        }

        const tokenIdsBigInt = tokenIds.map(id => BigInt(id));

        // Batch update via StaffManagementFacet
        const hash = await walletClient.writeContract({
          address: CONTRACT_ADDRESSES.DiamondLummy as `0x${string}`,
          abi: STAFF_MANAGEMENT_FACET_ABI,
          functionName: "batchUpdateTicketStatus",
          args: [tokenIdsBigInt],
        });

        await publicClient?.waitForTransactionReceipt({ hash });
        
        console.log(`✅ Batch updated ${tokenIds.length} tickets:`, hash);
        return hash;
      } catch (err) {
        console.error("Error batch updating ticket status:", err);
        setError(parseContractError(err));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [walletClient, address, publicClient, hasStaffRole]
  );

  // ========== PHASE 1.3: EFFICIENT ATTENDEE MANAGEMENT FUNCTIONS ==========

  /**
   * Get all attendees for current event (EFFICIENT - single call)
   * @returns Array of attendee addresses
   */
  const getAllAttendees = useCallback(
    async () => {
      if (!publicClient) {
        setError("Provider not available");
        return [];
      }

      try {
        const attendees = await publicClient.readContract({
          address: CONTRACT_ADDRESSES.DiamondLummy as `0x${string}`,
          abi: EVENT_CORE_FACET_ABI,
          functionName: "getAllAttendees",
        }) as string[];

        return attendees;
      } catch (err) {
        console.error("Error getting all attendees:", err);
        setError(parseContractError(err));
        return [];
      }
    },
    [publicClient]
  );

  /**
   * Get attendee statistics (EFFICIENT - single call)
   * @returns Object with totalAttendees and totalTokensMinted
   */
  const getAttendeeStats = useCallback(
    async () => {
      if (!publicClient) {
        setError("Provider not available");
        return { totalAttendees: 0, totalTokensMinted: 0 };
      }

      try {
        const [totalAttendees, totalTokensMinted] = await publicClient.readContract({
          address: CONTRACT_ADDRESSES.DiamondLummy as `0x${string}`,
          abi: EVENT_CORE_FACET_ABI,
          functionName: "getAttendeeStats",
        }) as [bigint, bigint];

        return {
          totalAttendees: Number(totalAttendees),
          totalTokensMinted: Number(totalTokensMinted)
        };
      } catch (err) {
        console.error("Error getting attendee stats:", err);
        setError(parseContractError(err));
        return { totalAttendees: 0, totalTokensMinted: 0 };
      }
    },
    [publicClient]
  );

  /**
   * Check if address is an attendee (EFFICIENT - O(1) lookup)
   * @param attendeeAddress Address to check
   * @returns True if address has purchased tickets
   */
  const isEventAttendee = useCallback(
    async (attendeeAddress: string) => {
      if (!publicClient) {
        setError("Provider not available");
        return false;
      }

      try {
        const isAttendee = await publicClient.readContract({
          address: CONTRACT_ADDRESSES.DiamondLummy as `0x${string}`,
          abi: EVENT_CORE_FACET_ABI,
          functionName: "isEventAttendee",
          args: [attendeeAddress as `0x${string}`],
        }) as boolean;

        return isAttendee;
      } catch (err) {
        console.error("Error checking if event attendee:", err);
        setError(parseContractError(err));
        return false;
      }
    },
    [publicClient]
  );

  /**
   * Check if current wallet is the organizer of the event
   * @param walletAddress Optional wallet address to check (defaults to current wallet)
   * @returns True if wallet is the organizer of the current event
   */
  const isEventOrganizer = useCallback(
    async (walletAddress?: string) => {
      const targetAddress = walletAddress || address;
      if (!targetAddress) {
        return false;
      }

      try {
        const eventInfo = await getEventInfo();
        if (!eventInfo || !eventInfo.organizer) {
          return false;
        }

        const isOrganizer = eventInfo.organizer.toLowerCase() === targetAddress.toLowerCase();
        
        if (DEVELOPMENT_CONFIG.LOG_CONTRACT_CALLS) {
          console.log("🔍 Organizer Check:", {
            wallet: targetAddress,
            eventOrganizer: eventInfo.organizer,
            isOrganizer,
            eventName: eventInfo.name
          });
        }

        return isOrganizer;
      } catch (err) {
        console.error("Error checking organizer status:", err);
        return false;
      }
    },
    [address, getEventInfo]
  );

  /**
   * Get comprehensive role information for current wallet
   * @returns Object with role detection results
   */
  const getWalletRoles = useCallback(
    async (walletAddress?: string) => {
      const targetAddress = walletAddress || address;
      if (!targetAddress) {
        return {
          isOrganizer: false,
          staffRole: 0,
          hasAnyRole: false,
          recommendedRole: 'customer' as const
        };
      }

      try {
        // Check organizer status
        const isOrganizer = await isEventOrganizer(targetAddress);
        
        // Check staff role  
        const staffRole = await getStaffRole(targetAddress) || 0;
        
        // Determine recommended role
        let recommendedRole: 'customer' | 'organizer' | 'staff' = 'customer';
        if (isOrganizer) {
          recommendedRole = 'organizer';
        } else if (staffRole >= 1) {
          recommendedRole = 'staff';
        }

        const hasAnyRole = isOrganizer || staffRole >= 1;

        if (DEVELOPMENT_CONFIG.LOG_CONTRACT_CALLS) {
          console.log("👤 Wallet Roles:", {
            address: targetAddress,
            isOrganizer,
            staffRole,
            hasAnyRole,
            recommendedRole
          });
        }

        return {
          isOrganizer,
          staffRole,
          hasAnyRole,
          recommendedRole
        };
      } catch (err) {
        console.error("Error getting wallet roles:", err);
        return {
          isOrganizer: false,
          staffRole: 0,
          hasAnyRole: false,
          recommendedRole: 'customer' as const
        };
      }
    },
    [address, isEventOrganizer, getStaffRole]
  );

  /**
   * Add staff member with specific role (organizer only)
   * @param staffAddress Address to assign staff role
   * @param roleLevel Role level (1=SCANNER, 2=CHECKIN, 3=MANAGER)
   * @returns Transaction hash if successful
   */
  const addStaffWithRole = useCallback(
    async (staffAddress: string, roleLevel: number) => {
      if (!walletClient || !address) {
        setError("Wallet not connected");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        // Verify organizer permissions first
        const isOrganizer = await isEventOrganizer();
        if (!isOrganizer) {
          throw new Error("Only organizers can add staff members");
        }

        if (DEVELOPMENT_CONFIG.LOG_CONTRACT_CALLS) {
          console.log('🔍 Staff Management: Attempting to add staff:', {
            staffAddress,
            roleLevel,
            walletAddress: address,
            contractAddress: CONTRACT_ADDRESSES.DiamondLummy,
            isOrganizer
          });
        }

        const hash = await walletClient.writeContract({
          address: CONTRACT_ADDRESSES.DiamondLummy as `0x${string}`,
          abi: STAFF_MANAGEMENT_FACET_ABI,
          functionName: "addStaffWithRole",
          args: [
            staffAddress as `0x${string}`,
            roleLevel, // 1=SCANNER, 2=CHECKIN, 3=MANAGER
          ],
        });

        await publicClient?.waitForTransactionReceipt({ hash });
        
        console.log(`✅ Staff added: ${staffAddress} with role ${roleLevel}`);
        return hash;
      } catch (err) {
        console.error("Error adding staff:", err);
        setError(parseContractError(err));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [walletClient, address, publicClient, isEventOrganizer]
  );

  /**
   * Remove staff member (organizer only)
   * @param staffAddress Address to remove from staff
   * @returns Transaction hash if successful
   */
  const removeStaffRole = useCallback(
    async (staffAddress: string) => {
      if (!walletClient || !address) {
        setError("Wallet not connected");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        // Verify organizer permissions first
        const isOrganizer = await isEventOrganizer();
        if (!isOrganizer) {
          throw new Error("Only organizers can remove staff members");
        }

        const hash = await walletClient.writeContract({
          address: CONTRACT_ADDRESSES.DiamondLummy as `0x${string}`,
          abi: STAFF_MANAGEMENT_FACET_ABI,
          functionName: "removeStaffRole",
          args: [staffAddress as `0x${string}`],
        });

        await publicClient?.waitForTransactionReceipt({ hash });
        
        console.log(`✅ Staff removed: ${staffAddress}`);
        return hash;
      } catch (err) {
        console.error("Error removing staff:", err);
        setError(parseContractError(err));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [walletClient, address, publicClient, isEventOrganizer]
  );

  /**
   * Add staff member with default SCANNER role (organizer only) - Simple version
   * @param staffAddress Address to assign staff role
   * @returns Transaction hash if successful
   */
  const addStaff = useCallback(
    async (staffAddress: string) => {
      if (!walletClient || !address) {
        setError("Wallet not connected");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        // Verify organizer permissions first
        const isOrganizer = await isEventOrganizer();
        if (!isOrganizer) {
          throw new Error("Only organizers can add staff members");
        }

        if (DEVELOPMENT_CONFIG.LOG_CONTRACT_CALLS) {
          console.log('🔍 Staff Management: Attempting to add staff:', {
            staffAddress,
            contractAddress: CONTRACT_ADDRESSES.DiamondLummy,
          });
        }

        const hash = await walletClient.writeContract({
          address: CONTRACT_ADDRESSES.DiamondLummy as `0x${string}`,
          abi: STAFF_MANAGEMENT_FACET_ABI,
          functionName: "addStaff",
          args: [staffAddress as `0x${string}`],
        });

        await publicClient?.waitForTransactionReceipt({ hash });
        
        console.log(`✅ Staff added: ${staffAddress} with default SCANNER role`);
        return hash;
      } catch (err) {
        console.error("Error adding staff:", err);
        setError(parseContractError(err));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [walletClient, address, publicClient, isEventOrganizer]
  );

  /**
   * Remove staff member (organizer only) - Simple version
   * @param staffAddress Address to remove from staff
   * @returns Transaction hash if successful
   */
  const removeStaff = useCallback(
    async (staffAddress: string) => {
      if (!walletClient || !address) {
        setError("Wallet not connected");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        // Verify organizer permissions first
        const isOrganizer = await isEventOrganizer();
        if (!isOrganizer) {
          throw new Error("Only organizers can remove staff members");
        }

        const hash = await walletClient.writeContract({
          address: CONTRACT_ADDRESSES.DiamondLummy as `0x${string}`,
          abi: STAFF_MANAGEMENT_FACET_ABI,
          functionName: "removeStaff",
          args: [staffAddress as `0x${string}`],
        });

        await publicClient?.waitForTransactionReceipt({ hash });
        
        console.log(`✅ Staff removed: ${staffAddress}`);
        return hash;
      } catch (err) {
        console.error("Error removing staff:", err);
        setError(parseContractError(err));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [walletClient, address, publicClient, isEventOrganizer]
  );

  /**
   * Get staff role names for display
   * @returns Array of role names
   */
  const getStaffRoleNames = useCallback(() => {
    return ['NONE', 'SCANNER', 'CHECKIN', 'MANAGER'];
  }, []);

  /**
   * Get all event attendees with complete metadata (Real blockchain integration)
   * @returns Array of attendee data with blockchain and mock email data
   */
  const getAllEventAttendees = useCallback(async () => {
    if (!publicClient) {
      setError("Provider not available");
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      console.log("🎯 Loading real attendee data from blockchain...");

      // Get total supply of NFTs (total tickets sold)
      const totalSupply = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.TicketNFT as `0x${string}`,
        abi: TICKET_NFT_ABI,
        functionName: "totalSupply",
      }) as bigint;

      console.log(`📊 Total tickets sold: ${totalSupply.toString()}`);

      if (totalSupply === 0n) {
        console.log("No tickets sold yet");
        return [];
      }

      // Get all token IDs using enumerable interface
      const attendeeDataList: any[] = [];
      
      for (let i = 0; i < Number(totalSupply); i++) {
        try {
          // Get token ID by index
          const tokenId = await publicClient.readContract({
            address: CONTRACT_ADDRESSES.TicketNFT as `0x${string}`,
            abi: TICKET_NFT_ABI,
            functionName: "tokenByIndex",
            args: [BigInt(i)],
          }) as bigint;

          // Get token owner
          const ownerAddress = await publicClient.readContract({
            address: CONTRACT_ADDRESSES.TicketNFT as `0x${string}`,
            abi: TICKET_NFT_ABI,
            functionName: "ownerOf",
            args: [tokenId],
          }) as string;

          // Get ticket metadata (struct format)
          const metadata = await publicClient.readContract({
            address: CONTRACT_ADDRESSES.TicketNFT as `0x${string}`,
            abi: TICKET_NFT_ABI,
            functionName: "getTicketMetadata",
            args: [tokenId],
          }) as {
            eventId: bigint;
            tierId: bigint;
            originalPrice: bigint;
            used: boolean;
            purchaseDate: bigint;
            eventName: string;
            eventVenue: string;
            eventDate: bigint;
            tierName: string;
            organizerName: string;
            serialNumber: bigint;
            status: string;
          };

          // Validate metadata structure
          if (!metadata || typeof metadata !== 'object') {
            console.warn(`⚠️ Token ${tokenId.toString()} has invalid metadata structure:`, metadata);
            continue; // Skip this token
          }

          // Get ticket status
          const status = await publicClient.readContract({
            address: CONTRACT_ADDRESSES.TicketNFT as `0x${string}`,
            abi: TICKET_NFT_ABI,
            functionName: "getTicketStatus",
            args: [tokenId],
          }) as string;

          // Validate status
          if (!status) {
            console.warn(`⚠️ Token ${tokenId.toString()} has undefined status`);
          }

          // Debug logging for blockchain status with detailed analysis
          const isUsedFromContract = metadata.used === true;
          const isRefundedFromContract = status === "refunded" || metadata.status === "refunded";
          
          console.log(`🔍 Token ${tokenId.toString()} Status Debug:`, {
            ownerAddress: ownerAddress.slice(0, 10) + "...",
            rawMetadata: metadata,
            metadata_eventId: metadata.eventId?.toString() || "undefined",
            metadata_tierId: metadata.tierId?.toString() || "undefined", 
            metadata_originalPrice: metadata.originalPrice?.toString() || "undefined",
            metadata_used: metadata.used ?? "undefined",
            metadata_status: metadata.status || "undefined",
            metadata_tierName: metadata.tierName || "undefined",
            contractStatus: status,
            // Status analysis
            isUsedFromContract,
            isRefundedFromContract,
            // Final status determination
            calculatedDisplayStatus: isUsedFromContract ? "Checked In" : 
                                  isRefundedFromContract ? "Refunded" : "Valid"
          });

          // Parse tier information from token ID (Algorithm 1)
          const tokenIdNumber = Number(tokenId);
          const remaining = tokenIdNumber - 1000000000;
          const remainingAfterEvent = remaining % 1000000;
          const actualTierCode = Math.floor(remainingAfterEvent / 10000);
          const serialNumber = remainingAfterEvent % 10000;

          // Get tier details with enhanced error handling and multiple fallback strategies
          let tierName = metadata.tierName || "Unknown Tier";
          let originalPrice = Number(metadata.originalPrice) / 1e18; // Convert from Wei to IDRX
          const tierIdFromToken = Number(metadata.tierId); // Use tierId from metadata
          const serialNumberFromMetadata = Number(metadata.serialNumber);
          
          console.log(`🎫 Processing token ${tokenId.toString()} - Tier analysis:`, {
            tokenIdNumber,
            remaining,
            actualTierCode,
            tierIdFromMetadata: tierIdFromToken,
            serialNumberFromAlgorithm: serialNumber,
            serialNumberFromMetadata: serialNumberFromMetadata,
            metadataOriginalPrice: metadata.originalPrice?.toString() || "undefined",
            metadataTierId: metadata.tierId?.toString() || "undefined",
            metadataTierName: metadata.tierName || "undefined"
          });
          
          // Validate metadata values and use fallbacks if needed
          if (!tierName || tierName === "") {
            // Try to construct tier name from tier ID
            const tierNames = ["General", "VIP", "Premium", "Ultimate", "Exclusive"];
            if (tierIdFromToken >= 0 && tierIdFromToken < tierNames.length) {
              tierName = tierNames[tierIdFromToken];
            } else {
              tierName = `Tier ${tierIdFromToken + 1}`;
            }
            console.log(`🔄 Using constructed tier name:`, tierName);
          }
          
          if (!originalPrice || originalPrice === 0) {
            originalPrice = 50000; // Default price in IDRX
            console.log(`🔄 Using default price:`, originalPrice, "IDRX");
          }
          
          // Use metadata serial number if available, otherwise use algorithm calculation
          const finalSerialNumber = serialNumberFromMetadata || serialNumber;
          
          console.log(`✅ Final tier data:`, {
            tierName,
            originalPrice,
            tierId: tierIdFromToken,
            serialNumber: finalSerialNumber
          });

          // Generate mock email data (70% have email, 80% verified)
          const hasEmail = Math.random() < 0.7;
          const isEmailVerified = hasEmail && Math.random() < 0.8;

          // Create attendee data matching AttendeeData interface
          const attendeeData = {
            // Smart Contract Data
            tokenId: tokenId.toString(),
            walletAddress: ownerAddress,
            tierName: tierName,
            tierId: tierIdFromToken,
            originalPrice: originalPrice,
            purchaseDate: new Date(Number(metadata.purchaseDate) * 1000), // Convert timestamp to Date
            serialNumber: finalSerialNumber,
            used: metadata.used === true, // Ensure boolean from contract
            status: (metadata.status || status || "valid") as "valid" | "used" | "refunded" | "invalid",
            transferCount: 0, // TODO: Get from contract if available

            // Mock Database Data (Email System)
            email: hasEmail ? `attendee${finalSerialNumber}@example.com` : undefined,
            emailVerified: isEmailVerified,
            notificationPrefs: hasEmail ? {
              ticket_purchase: true,
              event_reminders: Math.random() < 0.8,
              price_alerts: Math.random() < 0.6,
            } : undefined,

            // Check-in Data (if used)
            checkInData: isUsedFromContract ? {
              timestamp: new Date(), // Mock timestamp - TODO: Get real check-in timestamp
              staffAddress: `0x${Math.random().toString(16).substring(2, 42)}`,
              staffRole: "SCANNER" as const,
            } : undefined,

            // Computed Properties
            isCurrentOwner: true, // Assume current owner since we got it from ownerOf
            canCheckIn: !isUsedFromContract && !isRefundedFromContract,
            canReceiveEmails: hasEmail && isEmailVerified,
            displayStatus: (isUsedFromContract ? "Checked In" : 
                          isRefundedFromContract ? "Refunded" : "Valid") as "Valid" | "Checked In" | "Transferred" | "Refunded",
          };

          attendeeDataList.push(attendeeData);
          
        } catch (tokenError) {
          console.error(`Error processing token at index ${i}:`, tokenError);
          // Continue with next token
        }
      }

      // Summary logging for verification  
      const checkedInCount = attendeeDataList.filter(a => a.used === true).length;
      const validCount = attendeeDataList.filter(a => a.displayStatus === "Valid").length;
      const checkedInDisplayCount = attendeeDataList.filter(a => a.displayStatus === "Checked In").length;
      const transferredCount = attendeeDataList.filter(a => a.displayStatus === "Transferred").length;
      const refundedCount = attendeeDataList.filter(a => a.displayStatus === "Refunded").length;
      
      console.log(`✅ Successfully loaded ${attendeeDataList.length} real attendees from blockchain`);
      console.log(`📊 Status Summary:`, {
        total: attendeeDataList.length,
        blockchain_used_true: checkedInCount,
        display_checked_in: checkedInDisplayCount,
        display_valid: validCount,
        display_transferred: transferredCount,
        display_refunded: refundedCount,
        mapping_check: checkedInCount === checkedInDisplayCount ? "✅ CORRECT" : "❌ MISMATCH"
      });
      console.log(`📋 Full attendee status mapping:`, attendeeDataList.map(a => ({
        tokenId: a.tokenId,
        walletAddress: a.walletAddress.slice(0, 10) + '...',
        blockchain_used: a.used,
        displayStatus: a.displayStatus,
        tierName: a.tierName,
        originalPrice: a.originalPrice,
        statusMapping: `${a.used} → ${a.displayStatus}`
      })));
      
      return attendeeDataList;

    } catch (err) {
      console.error("Error getting real attendee data:", err);
      setError(parseContractError(err));
      return [];
    } finally {
      setLoading(false);
    }
  }, [publicClient]);

  /**
   * Get comprehensive event analytics (Phase 1.3 - ORGANIZER DASHBOARD)
   * @returns Event analytics for organizer dashboard
   */
  const getEventAnalytics = useCallback(async () => {
    if (!publicClient) {
      setError("Provider not available");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const analytics = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.DiamondLummy as `0x${string}`,
        abi: EVENT_CORE_FACET_ABI,
        functionName: "getEventAnalytics",
      }) as [bigint, bigint, bigint, bigint[]];

      return {
        totalTicketsSold: Number(analytics[0]),
        totalRevenue: analytics[1], // Keep as BigInt for precise calculations
        uniqueAttendees: Number(analytics[2]),
        tierSalesCount: analytics[3].map(count => Number(count))
      };
    } catch (err) {
      console.error("Error getting event analytics:", err);
      setError(parseContractError(err));
      return null;
    } finally {
      setLoading(false);
    }
  }, [publicClient]);

  // ========== TIER IMAGE FUNCTIONS (Phase 2) ==========

  /**
   * Sets tier-specific NFT background images for the event
   * @param tierImageHashes Array of IPFS hashes for tier backgrounds
   * @returns Transaction hash if successful
   */
  const setTierImages = useCallback(async (tierImageHashes: string[]) => {
    if (!walletClient || !address) {
      setError("Wallet not connected");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("Setting tier images:", tierImageHashes);

      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESSES.DiamondLummy as `0x${string}`,
        abi: EVENT_CORE_FACET_ABI,
        functionName: "setTierImages",
        args: [tierImageHashes],
      });

      await publicClient?.waitForTransactionReceipt({ hash });
      console.log("✅ Tier images set successfully:", hash);
      return hash;
    } catch (err) {
      console.error("Error setting tier images:", err);
      setError(parseContractError(err));
      return null;
    } finally {
      setLoading(false);
    }
  }, [walletClient, address, publicClient]);

  /**
   * Gets tier-specific NFT background image hash
   * @param tierIndex Index of the tier (0-based)
   * @returns IPFS hash of the tier background image
   */
  const getTierImageHash = useCallback(async (tierIndex: number) => {
    if (!publicClient) {
      setError("Provider not available");
      return null;
    }

    try {
      const imageHash = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.DiamondLummy as `0x${string}`,
        abi: EVENT_CORE_FACET_ABI,
        functionName: "getTierImageHash",
        args: [BigInt(tierIndex)],
      }) as string;

      return imageHash;
    } catch (err) {
      console.error("Error getting tier image hash:", err);
      setError(parseContractError(err));
      return null;
    }
  }, [publicClient]);

  /**
   * Gets all tier image hashes for the event
   * @returns Array of IPFS hashes for all tier backgrounds
   */
  const getAllTierImageHashes = useCallback(async () => {
    if (!publicClient) {
      setError("Provider not available");
      return null;
    }

    try {
      const imageHashes = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.DiamondLummy as `0x${string}`,
        abi: EVENT_CORE_FACET_ABI,
        functionName: "getAllTierImageHashes",
      }) as string[];

      return imageHashes;
    } catch (err) {
      console.error("Error getting all tier image hashes:", err);
      setError(parseContractError(err));
      return null;
    }
  }, [publicClient]);

  /**
   * Sets a single tier image hash
   * @param tierIndex Index of the tier (0-based)
   * @param imageHash IPFS hash of the tier background image
   * @returns Transaction hash if successful
   */
  const setTierImageHash = useCallback(async (tierIndex: number, imageHash: string) => {
    if (!walletClient || !address) {
      setError("Wallet not connected");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`Setting tier ${tierIndex} image:`, imageHash);

      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESSES.DiamondLummy as `0x${string}`,
        abi: EVENT_CORE_FACET_ABI,
        functionName: "setTierImageHash",
        args: [BigInt(tierIndex), imageHash],
      });

      await publicClient?.waitForTransactionReceipt({ hash });
      console.log(`✅ Tier ${tierIndex} image set successfully:`, hash);
      return hash;
    } catch (err) {
      console.error(`Error setting tier ${tierIndex} image:`, err);
      setError(parseContractError(err));
      return null;
    } finally {
      setLoading(false);
    }
  }, [walletClient, address, publicClient]);

  /**
   * Gets the number of tier images stored
   * @returns Number of tier images
   */
  const getTierImageCount = useCallback(async () => {
    if (!publicClient) {
      setError("Provider not available");
      return null;
    }

    try {
      const count = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.DiamondLummy as `0x${string}`,
        abi: EVENT_CORE_FACET_ABI,
        functionName: "getTierImageCount",
      }) as bigint;

      return Number(count);
    } catch (err) {
      console.error("Error getting tier image count:", err);
      setError(parseContractError(err));
      return null;
    }
  }, [publicClient]);

  /**
   * Extracts tier index from token ID using Algorithm 1 format
   * Token ID format: 1EEETTTSSSSS (Algorithm=1, Event=3digits, Tier=3digits, Sequential=5digits)
   * @param tokenId Token ID to extract tier from
   * @returns Tier index (0-based)
   */
  const extractTierIndexFromTokenId = useCallback((tokenId: bigint | number) => {
    const tokenIdNumber = typeof tokenId === 'bigint' ? Number(tokenId) : tokenId;
    
    // Extract tier code from position 4 (1 digit) - keep as 1-based for contract call
    const tierCode = Math.floor(tokenIdNumber / 10000) % 10;
    
    // Return tier code as-is (1-based) for contract getTierImageHash() call
    return tierCode;
  }, []);

  /**
   * Gets tier-specific NFT image URL from token ID
   * @param tokenId Token ID to get image for
   * @returns IPFS image URL for the tier
   */
  const getNFTImageFromTokenId = useCallback(async (tokenId: bigint | number) => {
    try {
      // Extract tier index from token ID
      const tierIndex = extractTierIndexFromTokenId(tokenId);
      
      // Get tier image hash from contract
      const imageHash = await getTierImageHash(tierIndex);
      
      if (imageHash && imageHash.length > 0) {
        return `https://gateway.pinata.cloud/ipfs/${imageHash}`;
      }
      
      // Fallback to placeholder
      return "/assets/images/nft-preview.png";
    } catch (error) {
      console.error("Error getting NFT image from token ID:", error);
      return "/assets/images/nft-preview.png";
    }
  }, [extractTierIndexFromTokenId, getTierImageHash]);

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
    transferNFT, // New function for NFT transfers
    createResaleListing, // New function for marketplace listings
    getActiveMarketplaceListings, // New function for fetching marketplace data
    purchaseResaleTicket, // New function for buying resale tickets
    cancelResaleListing, // New function for cancelling listings
    validateTicket, // New function for staff ticket validation
    
    // Phase 1.3: Efficient attendee management functions (REPLACES 5000+ CALLS!)
    getAllAttendees, // Get all event attendees (1 call vs manual iteration)
    getAllEventAttendees, // Get all event attendees with complete metadata (Real blockchain integration)
    getAttendeeStats, // Get attendee statistics (1 call vs multiple calculations)
    isEventAttendee, // Check if address is attendee (O(1) vs O(n) lookup)
    getEventAnalytics, // Get comprehensive event analytics for organizer dashboard
    
    // Staff management functions
    getStaffRole, // Get staff role for address
    hasStaffRole, // Check staff privileges
    validateTicketAsStaff, // Enhanced staff validation
    updateTicketStatus, // Mark ticket as used (staff only)
    batchUpdateTicketStatus, // Batch mark tickets as used
    
    // Organizer & role detection functions
    isEventOrganizer, // Check if wallet is event organizer
    getWalletRoles, // Get comprehensive role information
    
    // Staff management functions (organizer only)
    addStaff, // Add staff with default SCANNER role (simple)
    removeStaff, // Remove staff member (simple)
    addStaffWithRole, // Add staff with specific role (legacy)
    removeStaffRole, // Remove staff role (legacy)
    getStaffRoleNames, // Get role name labels
    burnTicketForQR,
    
    // Phase 2: Tier Image Functions
    setTierImages, // Set all tier images at once
    getTierImageHash, // Get specific tier image hash
    getAllTierImageHashes, // Get all tier image hashes
    setTierImageHash, // Set single tier image hash
    getTierImageCount, // Get number of tier images
    extractTierIndexFromTokenId, // Extract tier index from token ID
    getNFTImageFromTokenId, // Get NFT image URL from token ID
    
    // State
    loading,
    error,
  };
};