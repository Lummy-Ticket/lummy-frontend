import React, { useState, useEffect } from "react";
import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  Button,
  Icon,
  Divider,
  useDisclosure,
  useToast,
  Image,
} from "@chakra-ui/react";
import {
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaTicketAlt,
  FaShoppingCart,
  FaUserAlt,
  FaTags,
  FaTimes,
} from "react-icons/fa";
import { BuyResaleTicket } from "./BuyResaleTicket";
import { PriceComparison } from "./PriceComparison";
import { useSmartContract } from "../../hooks/useSmartContract";
import { useAccount } from "wagmi";
import { mockEvents } from "../../data/mockEvents";
import { getPosterImageUrl } from "../../utils/ipfsMetadata";
import { getIPFSUrl, isValidIPFSHash } from "../../services/IPFSService";

export interface ResaleTicket {
  id: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
  ticketType: string;
  originalPrice: number;
  resalePrice: number;
  currency: string;
  listedDate: string;
  sellerAddress: string;
  sellerRating?: number;
  tokenId: string;
  originalOwner?: string;
  transferCount?: number;
  imageUrl?: string;
}

interface ResaleTicketCardProps {
  ticket: ResaleTicket;
  onShowDetails?: (ticketId: string) => void;
  onCancelSuccess?: () => void;
}

export const ResaleTicketCard: React.FC<ResaleTicketCardProps> = ({
  ticket,
  onShowDetails,
  onCancelSuccess,
}) => {
  const toast = useToast();
  const { address } = useAccount();
  const { cancelResaleListing, loading } = useSmartContract();
  const { isOpen: isBuyOpen, onOpen: onBuyOpen, onClose: onBuyClose } = useDisclosure();
  const [posterImageUrl, setPosterImageUrl] = useState<string>("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTEwIiBoZWlnaHQ9IjExMCIgdmlld0JveD0iMCAwIDExMCAxMTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMTAiIGhlaWdodD0iMTEwIiBmaWxsPSIjNkI0NkMxIi8+Cjx0ZXh0IHg9IjU1IiB5PSI1NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iIGZpbGw9IndoaXRlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTBweCI+RXZlbnQ8L3RleHQ+Cjwvc3ZnPgo=");
  
  // Check if current user is the seller
  const isOwnListing = address?.toLowerCase() === ticket.sellerAddress.toLowerCase();

  // Load poster image from IPFS metadata (same logic as EventCard and OrderSummary)
  useEffect(() => {
    const loadPosterImage = async () => {
      // First try to use imageUrl from ticket if available
      if (ticket.imageUrl) {
        try {
          console.log('🔍 ResaleTicketCard - Loading poster from ticket.imageUrl:', ticket.imageUrl);
          
          // Try to get poster image from JSON metadata first
          const posterUrl = await getPosterImageUrl(ticket.imageUrl);
          if (posterUrl) {
            setPosterImageUrl(posterUrl);
            return;
          }
          
          // Fallback: Legacy format - direct IPFS hash
          if (isValidIPFSHash(ticket.imageUrl)) {
            setPosterImageUrl(getIPFSUrl(ticket.imageUrl));
            return;
          }
          
          // If already full URL, use as is
          setPosterImageUrl(ticket.imageUrl);
          
        } catch (error) {
          console.error('❌ ResaleTicketCard - Error loading poster from ticket.imageUrl:', error);
        }
      }
      
      // Fallback: try to get from mockEvents
      const event = mockEvents.find((e) => e.id === ticket.eventId);
      if (event?.imageUrl) {
        console.log('🔄 ResaleTicketCard - Using fallback from mockEvents:', event.imageUrl);
        setPosterImageUrl(event.imageUrl);
      }
    };

    loadPosterImage();
  }, [ticket.imageUrl, ticket.eventId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleShowDetails = () => {
    if (onShowDetails) {
      onShowDetails(ticket.id);
    }
  };

  const handleCancelListing = async () => {
    if (!ticket.tokenId) {
      toast({
        title: "Cancel Error",
        description: "Invalid ticket - token ID not found",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      const result = await cancelResaleListing(ticket.tokenId);
      if (result) {
        toast({
          title: "Listing Cancelled",
          description: "Your ticket listing has been removed from the marketplace",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        
        // Call success callback to refresh marketplace
        onCancelSuccess?.();
      }
    } catch (err: any) {
      toast({
        title: "Cancel Failed",
        description: err.message || "Failed to cancel listing. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // posterImageUrl is now managed by useState and useEffect above

  return (
    <>
      <Box
        borderWidth="1px"
        borderRadius="lg"
        overflow="hidden"
        bg="white"
        boxShadow="sm"
        transition="all 0.3s"
        _hover={{ transform: "translateY(-2px)", boxShadow: "md" }}
        height="100%"
        display="flex"
        flexDirection="column"
        cursor="default"
      >
        <Box
          bg="lummy.purple.500"
          color="white"
          py={1}
          px={4}
          borderBottomWidth="1px"
          borderBottomColor="lummy.purple.600"
        >
          <Flex justify="space-between" align="center">
            <HStack>
              <Icon as={FaTags} />
              <Text fontWeight="medium">Resale</Text>
            </HStack>
          </Flex>
        </Box>

        <Box p={4} display="flex" flexDirection="column" flex="1">
          <Flex justify="space-between" alignItems="flex-start" mb={1}>
            <Box flex="1" mr={2}>
              <Text fontSize="lg" fontWeight="bold" noOfLines={1} mb={1}>
                {ticket.eventName}
              </Text>

              <VStack mt={2} spacing={2} align="flex-start" color="gray.600">
                <HStack>
                  <Icon as={FaCalendarAlt} boxSize={3.5} />
                  <Text fontSize="sm" noOfLines={1}>
                    {formatDate(ticket.eventDate)}
                  </Text>
                </HStack>

                <HStack>
                  <Icon as={FaMapMarkerAlt} boxSize={3.5} />
                  <Text fontSize="sm" noOfLines={1}>
                    {ticket.eventLocation}
                  </Text>
                </HStack>

                <HStack>
                  <Icon as={FaTicketAlt} color="blue.500" boxSize={3.5} />
                  <Text fontSize="sm" fontWeight="medium">
                    {ticket.ticketType}
                  </Text>
                </HStack>
              </VStack>
            </Box>

            <Box width="110px" height="110px" flexShrink={0}>
              <Image
                src={posterImageUrl}
                alt={`${ticket.eventName}`}
                borderRadius="md"
                objectFit="cover"
                width="150%"
                height="100%"
                fallbackSrc="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTEwIiBoZWlnaHQ9IjExMCIgdmlld0JveD0iMCAwIDExMCAxMTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMTAiIGhlaWdodD0iMTEwIiBmaWxsPSIjNkI0NkMxIi8+Cjx0ZXh0IHg9IjU1IiB5PSI1NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iIGZpbGw9IndoaXRlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTBweCI+RXZlbnQ8L3RleHQ+Cjwvc3ZnPgo="
                onError={(e) => {
                  console.warn('Failed to load resale ticket image:', posterImageUrl);
                  e.currentTarget.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTEwIiBoZWlnaHQ9IjExMCIgdmlld0JveD0iMCAwIDExMCAxMTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMTAiIGhlaWdodD0iMTEwIiBmaWxsPSIjNkI0NkMxIi8+Cjx0ZXh0IHg9IjU1IiB5PSI1NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iIGZpbGw9IndoaXRlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTBweCI+RXZlbnQ8L3RleHQ+Cjwvc3ZnPgo=";
                }}
              />
            </Box>
          </Flex>

          <Divider my={3} />

          <PriceComparison
            originalPrice={ticket.originalPrice}
            resalePrice={ticket.resalePrice}
            currency={ticket.currency}
          />

          <HStack mt={2} spacing={2} fontSize="xs" color="gray.500">
            <Icon as={FaUserAlt} boxSize={3} />
            <Text>
              Seller: {ticket.sellerAddress.substring(0, 6)}...
              {ticket.sellerAddress.substring(ticket.sellerAddress.length - 4)}
            </Text>
          </HStack>

          <Flex mt="auto" pt={4} justify="space-between">
            <Button size="sm" variant="outline" onClick={handleShowDetails}>
              View Details
            </Button>

            {isOwnListing ? (
              <Button
                size="sm"
                colorScheme="red"
                variant="outline"
                leftIcon={<Icon as={FaTimes} />}
                onClick={handleCancelListing}
                isLoading={loading}
                loadingText="Cancelling..."
              >
                Cancel Listing
              </Button>
            ) : (
              <Button
                size="sm"
                colorScheme="blue"
                leftIcon={<Icon as={FaShoppingCart} />}
                onClick={onBuyOpen}
              >
                Buy Now
              </Button>
            )}
          </Flex>
        </Box>
      </Box>

      <BuyResaleTicket 
        isOpen={isBuyOpen} 
        onClose={onBuyClose} 
        ticket={ticket} 
        onPurchaseSuccess={onCancelSuccess}
      />
    </>
  );
};

export default ResaleTicketCard;
