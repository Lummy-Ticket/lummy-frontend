// src/hooks/useStaffEventListener.ts
import { useState, useEffect, useCallback } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { CONTRACT_ADDRESSES, DEVELOPMENT_CONFIG } from "../constants";
import { useSmartContract } from "./useSmartContract";

/**
 * Staff member interface for event-based system
 */
export interface StaffMember {
  address: string;
  role: number; // 1=SCANNER (simplified to single role)
  assignedBy: string;
  assignedDate: Date;
  canScanTickets: boolean;
  blockNumber?: bigint; // For deduplication
  transactionHash?: string;
}

/**
 * Staff events cache structure
 */
interface StaffEventsCache {
  staffList: StaffMember[];
  lastSyncBlock: number; // Store as number for JSON serialization
  organizer: string;
  timestamp: number;
}

/**
 * Hook for real-time staff management using contract events
 * Provides efficient event-based staff tracking with caching
 */
export const useStaffEventListener = () => {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { isEventOrganizer } = useSmartContract();

  // Staff state management
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSyncBlock, setLastSyncBlock] = useState<bigint>(0n);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cache key for localStorage
  const getCacheKey = useCallback((organizer: string) => {
    return `staff_events_cache_${organizer}_${CONTRACT_ADDRESSES.DiamondLummy}`;
  }, []);

  /**
   * Load cached staff events from localStorage
   */
  const loadCachedStaffEvents = useCallback((organizer: string): StaffEventsCache | null => {
    try {
      const cacheKey = getCacheKey(organizer);
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as StaffEventsCache;
        // Check if cache is recent (less than 1 hour old)
        const isRecent = Date.now() - parsed.timestamp < 60 * 60 * 1000;
        if (isRecent && parsed.organizer === organizer) {
          return parsed;
        }
      }
      return null;
    } catch (error) {
      console.warn("Failed to load cached staff events:", error);
      return null;
    }
  }, [getCacheKey]);

  /**
   * Save staff events to localStorage
   */
  const saveCachedStaffEvents = useCallback((organizer: string, staffList: StaffMember[], lastBlock: bigint) => {
    try {
      const cacheKey = getCacheKey(organizer);
      const cache: StaffEventsCache = {
        staffList: staffList.map(staff => ({
          ...staff,
          blockNumber: undefined, // Remove blockNumber for serialization
        })),
        lastSyncBlock: Number(lastBlock), // Convert BigInt to number
        organizer,
        timestamp: Date.now(),
      };
      localStorage.setItem(cacheKey, JSON.stringify(cache));
    } catch (error) {
      console.warn("Failed to save staff events cache:", error);
    }
  }, [getCacheKey]);

  /**
   * Load historical staff events from blockchain
   */
  const loadHistoricalStaffEvents = useCallback(
    async (organizer: string, fromBlock: bigint = 0n): Promise<StaffMember[]> => {
      if (!publicClient) {
        throw new Error("Public client not available");
      }

      console.log(`📅 Loading historical staff events for organizer ${organizer}...`);

      try {
        // Get current block for reference
        const currentBlock = await publicClient.getBlockNumber();
        const searchFromBlock = fromBlock > 0n ? fromBlock : currentBlock - 10000n;

        // Fetch StaffAdded events
        const addedEvents = await publicClient.getLogs({
          address: CONTRACT_ADDRESSES.DiamondLummy as `0x${string}`,
          event: {
            type: 'event',
            name: 'StaffAdded',
            inputs: [
              { name: 'staff', type: 'address', indexed: true },
              { name: 'organizer', type: 'address', indexed: true }
            ],
          },
          args: {
            organizer: organizer as `0x${string}`,
          },
          fromBlock: searchFromBlock,
          toBlock: 'latest',
        });

        // Fetch StaffRemoved events
        const removedEvents = await publicClient.getLogs({
          address: CONTRACT_ADDRESSES.DiamondLummy as `0x${string}`,
          event: {
            type: 'event',
            name: 'StaffRemoved',
            inputs: [
              { name: 'staff', type: 'address', indexed: true },
              { name: 'organizer', type: 'address', indexed: true }
            ],
          },
          args: {
            organizer: organizer as `0x${string}`,
          },
          fromBlock: searchFromBlock,
          toBlock: 'latest',
        });

        if (DEVELOPMENT_CONFIG.LOG_CONTRACT_CALLS) {
          console.log(`📊 Found ${addedEvents.length} StaffAdded and ${removedEvents.length} StaffRemoved events`);
        }

        // Process events chronologically
        const allEvents = [
          ...addedEvents.map(event => ({ ...event, type: 'added' as const })),
          ...removedEvents.map(event => ({ ...event, type: 'removed' as const }))
        ].sort((a, b) => {
          // Sort by block number, then by transaction index
          if (a.blockNumber !== b.blockNumber) {
            return Number(a.blockNumber - b.blockNumber);
          }
          return (a.transactionIndex || 0) - (b.transactionIndex || 0);
        });

        // Build staff list from events
        const staffMap = new Map<string, StaffMember>();
        let maxBlockNumber = 0n;

        for (const event of allEvents) {
          const staffAddress = event.args?.staff;
          if (!staffAddress) continue;

          maxBlockNumber = event.blockNumber > maxBlockNumber ? event.blockNumber : maxBlockNumber;

          if (event.type === 'added') {
            staffMap.set(staffAddress.toLowerCase(), {
              address: staffAddress,
              role: 1, // All staff get SCANNER role
              assignedBy: organizer,
              assignedDate: new Date(), // In real implementation, get from block timestamp
              canScanTickets: true,
              blockNumber: event.blockNumber,
              transactionHash: event.transactionHash,
            });
          } else if (event.type === 'removed') {
            staffMap.delete(staffAddress.toLowerCase());
          }
        }

        const currentStaffList = Array.from(staffMap.values());
        
        // Update sync block
        setLastSyncBlock(maxBlockNumber);

        console.log(`✅ Loaded ${currentStaffList.length} current staff members from events`);
        return currentStaffList;

      } catch (error) {
        console.error("❌ Error loading historical staff events:", error);
        throw error;
      }
    },
    [publicClient]
  );

  /**
   * Start real-time event listening
   */
  const startEventListening = useCallback(
    async (organizer: string) => {
      if (!publicClient || isListening) {
        return;
      }

      console.log("🎯 Starting real-time staff event listening...");
      setIsListening(true);

      try {
        // Listen for StaffAdded events
        const unsubscribeAdded = publicClient.watchEvent({
          address: CONTRACT_ADDRESSES.DiamondLummy as `0x${string}`,
          event: {
            type: 'event',
            name: 'StaffAdded',
            inputs: [
              { name: 'staff', type: 'address', indexed: true },
              { name: 'organizer', type: 'address', indexed: true }
            ],
          },
          args: {
            organizer: organizer as `0x${string}`,
          },
          onLogs: (logs) => {
            console.log("📥 New StaffAdded event received:", logs);
            for (const log of logs) {
              const staffAddress = log.args?.staff;
              if (staffAddress) {
                const newStaff: StaffMember = {
                  address: staffAddress,
                  role: 1, // SCANNER role
                  assignedBy: organizer,
                  assignedDate: new Date(),
                  canScanTickets: true,
                  blockNumber: log.blockNumber,
                  transactionHash: log.transactionHash,
                };

                setStaffList(prev => {
                  const updated = [...prev.filter(s => s.address.toLowerCase() !== staffAddress.toLowerCase()), newStaff];
                  // Update cache
                  saveCachedStaffEvents(organizer, updated, log.blockNumber);
                  return updated;
                });
              }
            }
          },
        });

        // Listen for StaffRemoved events
        const unsubscribeRemoved = publicClient.watchEvent({
          address: CONTRACT_ADDRESSES.DiamondLummy as `0x${string}`,
          event: {
            type: 'event',
            name: 'StaffRemoved',
            inputs: [
              { name: 'staff', type: 'address', indexed: true },
              { name: 'organizer', type: 'address', indexed: true }
            ],
          },
          args: {
            organizer: organizer as `0x${string}`,
          },
          onLogs: (logs) => {
            console.log("📤 New StaffRemoved event received:", logs);
            for (const log of logs) {
              const staffAddress = log.args?.staff;
              if (staffAddress) {
                setStaffList(prev => {
                  const updated = prev.filter(s => s.address.toLowerCase() !== staffAddress.toLowerCase());
                  // Update cache
                  saveCachedStaffEvents(organizer, updated, log.blockNumber);
                  return updated;
                });
              }
            }
          },
        });

        // Store unsubscribe functions for cleanup
        return () => {
          unsubscribeAdded();
          unsubscribeRemoved();
          setIsListening(false);
        };

      } catch (error) {
        console.error("❌ Error starting event listening:", error);
        setError("Failed to start real-time event listening");
        setIsListening(false);
      }
    },
    [publicClient, isListening, saveCachedStaffEvents]
  );

  /**
   * Initialize staff event system
   */
  const initializeStaffEvents = useCallback(async () => {
    if (!address || !publicClient) {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      setIsLoading(true);

      // Check if current user is organizer
      const isOrganizer = await isEventOrganizer();
      if (!isOrganizer) {
        console.log("👤 User is not organizer, skipping staff event loading");
        setStaffList([]);
        setIsLoading(false);
        return;
      }

      const organizer = address;

      // 1. Try to load from cache first
      const cached = loadCachedStaffEvents(organizer);
      if (cached) {
        console.log("📦 Loaded staff list from cache:", cached.staffList.length, "members");
        setStaffList(cached.staffList);
        setLastSyncBlock(BigInt(cached.lastSyncBlock));
      }

      // 2. Load recent events (from last sync or recent blocks)  
      const fromBlock = cached?.lastSyncBlock ? BigInt(cached.lastSyncBlock) : 0n;
      const historicalStaff = await loadHistoricalStaffEvents(organizer, fromBlock);
      
      // 3. Use cached data if fresh events are empty (smart merge)
      const finalStaffList = historicalStaff.length > 0 ? historicalStaff : (cached?.staffList || []);
      setStaffList(finalStaffList);
      console.log(`🔄 Updated staff list: ${finalStaffList.length} members (${historicalStaff.length} from blockchain, ${cached?.staffList.length || 0} from cache)`);
      
      // Get the actual last sync block from the loading process
      const currentBlock = await publicClient?.getBlockNumber() || 0n;
      setLastSyncBlock(currentBlock);
      saveCachedStaffEvents(organizer, finalStaffList, currentBlock);

      // 4. Start real-time listening
      const unsubscribe = await startEventListening(organizer);

      // Cleanup function
      return unsubscribe;

    } catch (error) {
      console.error("❌ Error initializing staff events:", error);
      setError(error instanceof Error ? error.message : "Failed to initialize staff events");
    } finally {
      setIsLoading(false);
    }
  }, [address, publicClient, isEventOrganizer, loadCachedStaffEvents, loadHistoricalStaffEvents, saveCachedStaffEvents, startEventListening]);

  /**
   * Manual refresh of staff events
   */
  const refreshStaffEvents = useCallback(async () => {
    if (!address) return;

    try {
      setError(null);
      const isOrganizer = await isEventOrganizer();
      if (!isOrganizer) return;

      const historicalStaff = await loadHistoricalStaffEvents(address, 0n);
      setStaffList(historicalStaff);
      const currentBlock = await publicClient?.getBlockNumber() || 0n;
      saveCachedStaffEvents(address, historicalStaff, currentBlock);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to refresh staff events");
    }
  }, [address, isEventOrganizer, loadHistoricalStaffEvents, saveCachedStaffEvents, publicClient]);

  // Initialize when component mounts or address changes
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    initializeStaffEvents().then((cleanup) => {
      unsubscribe = cleanup;
    });

    // Cleanup on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [initializeStaffEvents]);

  return {
    // State
    staffList,
    isLoading,
    isListening,
    error,
    lastSyncBlock,

    // Actions
    refreshStaffEvents,
    
    // Utilities
    getCacheKey: () => address ? getCacheKey(address) : '',
  };
};