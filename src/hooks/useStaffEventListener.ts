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
        // Get current block for reference and use appropriate range
        const currentBlock = await publicClient.getBlockNumber();
        
        // Use a much larger range to ensure we capture all events
        // If no fromBlock specified, search from last 100k blocks or contract deployment
        let searchFromBlock: bigint;
        if (fromBlock > 0n) {
          searchFromBlock = fromBlock;
        } else {
          // Use larger range to ensure we don't miss events
          searchFromBlock = currentBlock > 100000n ? currentBlock - 100000n : 0n;
        }

        console.log(`🔍 Searching staff events from block ${searchFromBlock} to latest (current: ${currentBlock})`);

        // Add timeout wrapper for event fetching
        const fetchWithTimeout = async <T>(promise: Promise<T>, timeoutMs: number = 30000): Promise<T> => {
          return Promise.race([
            promise,
            new Promise<T>((_, reject) => 
              setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
            )
          ]);
        };

        // Fetch StaffAdded events with timeout
        const addedEvents = await fetchWithTimeout(
          publicClient.getLogs({
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
          }),
          15000 // 15 second timeout for each call
        );

        // Fetch StaffRemoved events with timeout
        const removedEvents = await fetchWithTimeout(
          publicClient.getLogs({
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
          }),
          15000 // 15 second timeout for each call
        );

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
                  return prev.filter(s => s.address.toLowerCase() !== staffAddress.toLowerCase());
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
    [publicClient, isListening]
  );


  /**
   * Manual refresh of staff events
   */
  const refreshStaffEvents = useCallback(async () => {
    if (!address || !publicClient) return;

    try {
      setError(null);
      setIsLoading(true);
      
      const isOrganizer = await isEventOrganizer();
      if (!isOrganizer) {
        setStaffList([]);
        return;
      }

      const currentBlock = await publicClient.getBlockNumber();
      const fromBlock = currentBlock > 50000n ? currentBlock - 50000n : 0n;
      
      const historicalStaff = await loadHistoricalStaffEvents(address, fromBlock);
      setStaffList(historicalStaff);
      setLastSyncBlock(currentBlock);
      
      // Update cache
      const cacheKey = `staff_events_cache_${address}_${CONTRACT_ADDRESSES.DiamondLummy}`;
      const cache = {
        staffList: historicalStaff.map(staff => ({ ...staff, blockNumber: undefined })),
        lastSyncBlock: Number(currentBlock),
        organizer: address,
        timestamp: Date.now(),
      };
      localStorage.setItem(cacheKey, JSON.stringify(cache));
      
      console.log(`🔄 Refreshed staff list: ${historicalStaff.length} members`);
    } catch (error) {
      console.error("Error refreshing staff events:", error);
      setError(error instanceof Error ? error.message : "Failed to refresh staff events");
    } finally {
      setIsLoading(false);
    }
  }, [address, publicClient]);


  // Initialize when component mounts or address changes - fixed dependencies
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initialize = async () => {
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
        console.log("🔄 Loading staff events for organizer:", organizer);

        // Load historical events from larger block range
        const currentBlock = await publicClient.getBlockNumber();
        const fromBlock = currentBlock > 50000n ? currentBlock - 50000n : 0n;
        
        const historicalStaff = await loadHistoricalStaffEvents(organizer, fromBlock);
        console.log(`✅ Loaded ${historicalStaff.length} staff members from blockchain`);
        
        setStaffList(historicalStaff);
        setLastSyncBlock(currentBlock);
        
        // Save to cache inline to avoid dependency issues
        try {
          const cacheKey = `staff_events_cache_${organizer}_${CONTRACT_ADDRESSES.DiamondLummy}`;
          const cache = {
            staffList: historicalStaff.map(staff => ({ ...staff, blockNumber: undefined })),
            lastSyncBlock: Number(currentBlock),
            organizer,
            timestamp: Date.now(),
          };
          localStorage.setItem(cacheKey, JSON.stringify(cache));
        } catch (cacheError) {
          console.warn("Failed to save staff cache:", cacheError);
        }

        // Start real-time listening
        const cleanup = await startEventListening(organizer);
        unsubscribe = cleanup;

      } catch (error) {
        console.error("❌ Error initializing staff events:", error);
        setError(error instanceof Error ? error.message : "Failed to initialize staff events");
        
        // Try to load from cache as fallback
        if (address) {
          try {
            const cacheKey = `staff_events_cache_${address}_${CONTRACT_ADDRESSES.DiamondLummy}`;
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
              const parsed = JSON.parse(cached);
              const isRecent = Date.now() - parsed.timestamp < 60 * 60 * 1000;
              if (isRecent && parsed.organizer === address) {
                console.log("📦 Using cached staff data as fallback");
                setStaffList(parsed.staffList);
                setLastSyncBlock(BigInt(parsed.lastSyncBlock));
              }
            }
          } catch (cacheError) {
            console.warn("Failed to load cached staff events:", cacheError);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    initialize();

    // Cleanup on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [address, publicClient]); // Only depend on address and publicClient to prevent loops

  return {
    // State
    staffList,
    isLoading,
    isListening,
    error,
    lastSyncBlock,

    // Actions
    refreshStaffEvents,
  };
};