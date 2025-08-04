// src/hooks/useContractQueries.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { useSmartContract } from "./useSmartContract";
import { DEVELOPMENT_CONFIG } from "../constants";

/**
 * Query keys for contract data caching
 */
export const CONTRACT_QUERY_KEYS = {
  eventInfo: ['contract', 'eventInfo'] as const,
  ticketTiers: ['contract', 'ticketTiers'] as const,
  userNFTs: (address?: string) => ['contract', 'userNFTs', address] as const,
  contractValidation: ['contract', 'validation'] as const,
} as const;

/**
 * Hook for cached event info data
 */
export const useEventInfoQuery = () => {
  const { getEventInfo } = useSmartContract();
  
  return useQuery({
    queryKey: CONTRACT_QUERY_KEYS.eventInfo,
    queryFn: getEventInfo,
    enabled: DEVELOPMENT_CONFIG.ENABLE_BLOCKCHAIN,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
  });
};

/**
 * Hook for cached ticket tiers data
 */
export const useTicketTiersQuery = () => {
  const { getTicketTiers } = useSmartContract();
  
  return useQuery({
    queryKey: CONTRACT_QUERY_KEYS.ticketTiers,
    queryFn: getTicketTiers,
    enabled: DEVELOPMENT_CONFIG.ENABLE_BLOCKCHAIN,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });
};

/**
 * Hook for cached user NFTs data
 */
export const useUserNFTsQuery = (userAddress?: string) => {
  const { address } = useAccount();
  const { getUserTicketNFTs } = useSmartContract();
  
  const targetAddress = userAddress || address;
  
  return useQuery({
    queryKey: CONTRACT_QUERY_KEYS.userNFTs(targetAddress),
    queryFn: () => getUserTicketNFTs(targetAddress),
    enabled: DEVELOPMENT_CONFIG.ENABLE_BLOCKCHAIN && !!targetAddress,
    staleTime: 30 * 1000, // 30 seconds (NFTs change frequently)
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

/**
 * Hook for contract validation with caching
 */
export const useContractValidationQuery = () => {
  const { validateContractState } = useSmartContract();
  
  return useQuery({
    queryKey: CONTRACT_QUERY_KEYS.contractValidation,
    queryFn: validateContractState,
    enabled: DEVELOPMENT_CONFIG.ENABLE_BLOCKCHAIN,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
};

/**
 * Mutation for event initialization with cache invalidation
 */
export const useInitializeEventMutation = () => {
  const queryClient = useQueryClient();
  const { initializeEvent } = useSmartContract();
  
  return useMutation({
    mutationFn: ({
      name,
      description,
      date,
      venue,
      ipfsMetadata = ""
    }: {
      name: string;
      description: string;
      date: Date;
      venue: string;
      ipfsMetadata?: string;
    }) => initializeEvent(name, description, date, venue, ipfsMetadata),
    onSuccess: () => {
      // Invalidate related queries when event is created
      queryClient.invalidateQueries({ queryKey: CONTRACT_QUERY_KEYS.eventInfo });
      queryClient.invalidateQueries({ queryKey: CONTRACT_QUERY_KEYS.contractValidation });
    },
  });
};

/**
 * Mutation for adding ticket tiers with cache invalidation
 */
export const useAddTicketTierMutation = () => {
  const queryClient = useQueryClient();
  const { addTicketTier } = useSmartContract();
  
  return useMutation({
    mutationFn: ({
      name,
      price,
      available,
      maxPerPurchase
    }: {
      name: string;
      price: number;
      available: number;
      maxPerPurchase: number;
    }) => addTicketTier(name, price, available, maxPerPurchase),
    onSuccess: () => {
      // Invalidate tier queries when new tier is added
      queryClient.invalidateQueries({ queryKey: CONTRACT_QUERY_KEYS.ticketTiers });
      queryClient.invalidateQueries({ queryKey: CONTRACT_QUERY_KEYS.contractValidation });
    },
  });
};

/**
 * Mutation for ticket purchases with cache invalidation
 */
export const usePurchaseTicketsMutation = () => {
  const queryClient = useQueryClient();
  const { address } = useAccount();
  const { purchaseTickets } = useSmartContract();
  
  return useMutation({
    mutationFn: ({
      tierId,
      quantity,
      eventData
    }: {
      tierId: number;
      quantity: number;
      eventData?: {
        eventName: string;
        tierName: string;
        totalPrice: number;
        currency: string;
        eventDate: string;
        venue: string;
        eventId?: string;
      };
    }) => purchaseTickets(tierId, quantity, eventData),
    onSuccess: () => {
      // Invalidate user NFTs and tier data after purchase
      queryClient.invalidateQueries({ queryKey: CONTRACT_QUERY_KEYS.userNFTs(address) });
      queryClient.invalidateQueries({ queryKey: CONTRACT_QUERY_KEYS.ticketTiers });
    },
  });
};

/**
 * Mutation for IDRX approval
 */
export const useApproveIDRXMutation = () => {
  const { approveIDRX } = useSmartContract();
  
  return useMutation({
    mutationFn: (amount: number) => approveIDRX(amount),
  });
};

/**
 * Hook to refresh all contract data
 */
export const useRefreshContractData = () => {
  const queryClient = useQueryClient();
  const { address } = useAccount();

  return () => {
    // Invalidate all contract-related queries
    queryClient.invalidateQueries({ queryKey: ['contract'] });
    
    // Specifically refetch commonly used data
    queryClient.refetchQueries({ queryKey: CONTRACT_QUERY_KEYS.eventInfo });
    queryClient.refetchQueries({ queryKey: CONTRACT_QUERY_KEYS.ticketTiers });
    queryClient.refetchQueries({ queryKey: CONTRACT_QUERY_KEYS.userNFTs(address) });
  };
};

/**
 * Hook to get all contract data loading states
 */
export const useContractLoadingState = () => {
  const { address } = useAccount();
  const eventInfoQuery = useEventInfoQuery();
  const ticketTiersQuery = useTicketTiersQuery();
  const userNFTsQuery = useUserNFTsQuery(address);
  
  return {
    isLoading: eventInfoQuery.isLoading || ticketTiersQuery.isLoading || userNFTsQuery.isLoading,
    isFetching: eventInfoQuery.isFetching || ticketTiersQuery.isFetching || userNFTsQuery.isFetching,
    hasError: eventInfoQuery.isError || ticketTiersQuery.isError || userNFTsQuery.isError,
    errors: {
      eventInfo: eventInfoQuery.error,
      ticketTiers: ticketTiersQuery.error,
      userNFTs: userNFTsQuery.error,
    }
  };
};