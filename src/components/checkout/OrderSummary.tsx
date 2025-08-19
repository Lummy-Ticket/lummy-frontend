import React, { useState, useEffect } from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Image,
  Divider,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Flex,
  Badge,
} from "@chakra-ui/react";
import { Event, TicketTier } from "../../types/Event";
import { FaCalendarAlt, FaMapMarkerAlt } from "react-icons/fa";
import { FeeDisplay } from "../common";
import { getPosterImageUrl } from "../../utils/ipfsMetadata";
import { getIPFSUrl, isValidIPFSHash } from "../../services/IPFSService";

interface OrderSummaryProps {
  event: Event;
  tier: TicketTier;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
}

// Format date for display
const formatDate = (dateString: string): string => {
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return new Date(dateString).toLocaleDateString("en-US", options);
};

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  event,
  tier,
  quantity,
  onQuantityChange,
}) => {
  const [posterImageUrl, setPosterImageUrl] = useState<string>("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjkwIiB2aWV3Qm94PSIwIDAgMTIwIDkwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjkwIiBmaWxsPSIjNkI0NkMxIi8+Cjx0ZXh0IHg9IjYwIiB5PSI0NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iIGZpbGw9IndoaXRlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTJweCI+RXZlbnQ8L3RleHQ+Cjwvc3ZnPgo=");

  const handleQuantityChange = (
    _valueAsString: string,
    valueAsNumber: number
  ) => {
    onQuantityChange(valueAsNumber);
  };

  const subtotal = tier.price * quantity;

  // Load poster image from IPFS metadata (same logic as EventCard)
  useEffect(() => {
    const loadPosterImage = async () => {
      console.log('🔍 OrderSummary - Loading poster image, event.imageUrl:', event.imageUrl);
      
      if (!event.imageUrl) {
        console.log('⚠️ OrderSummary - No imageUrl provided, using placeholder');
        setPosterImageUrl("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjkwIiB2aWV3Qm94PSIwIDAgMTIwIDkwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjkwIiBmaWxsPSIjNkI0NkMxIi8+Cjx0ZXh0IHg9IjYwIiB5PSI0NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iIGZpbGw9IndoaXRlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTJweCI+RXZlbnQ8L3RleHQ+Cjwvc3ZnPgo=");
        return;
      }

      try {
        console.log('🌐 OrderSummary - Calling getPosterImageUrl...');
        // Try to get poster image from JSON metadata first
        const posterUrl = await getPosterImageUrl(event.imageUrl);
        console.log('✅ OrderSummary - getPosterImageUrl result:', posterUrl);
        
        if (posterUrl) {
          setPosterImageUrl(posterUrl);
          console.log('✅ OrderSummary - Poster image set:', posterUrl);
          return;
        }
        
        // Fallback: Legacy format - direct IPFS hash
        if (isValidIPFSHash(event.imageUrl)) {
          const fallbackUrl = getIPFSUrl(event.imageUrl);
          console.log('🔄 OrderSummary - Using legacy IPFS hash:', fallbackUrl);
          setPosterImageUrl(fallbackUrl);
          return;
        }
        
        // If already full URL, use as is
        console.log('🔄 OrderSummary - Using imageUrl as is:', event.imageUrl);
        setPosterImageUrl(event.imageUrl);
        
      } catch (error) {
        console.error('❌ OrderSummary - Error loading poster image:', error);
        setPosterImageUrl("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjkwIiB2aWV3Qm94PSIwIDAgMTIwIDkwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjkwIiBmaWxsPSIjNkI0NkMxIi8+Cjx0ZXh0IHg9IjYwIiB5PSI0NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iIGZpbGw9IndoaXRlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTJweCI+RXZlbnQ8L3RleHQ+Cjwvc3ZnPgo=");
      }
    };

    loadPosterImage();
  }, [event.imageUrl]);

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      bg="white"
      boxShadow="sm"
    >
      {/* Event info with image */}
      <Flex p={4} borderBottomWidth="1px" borderColor="gray.100">
        <Box
          width="120px"
          height="90px"
          overflow="hidden"
          borderRadius="md"
          mr={4}
          flexShrink={0}
        >
          <Image
            src={posterImageUrl}
            alt={event.title}
            objectFit="cover"
            width="100%"
            height="100%"
            fallbackSrc="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjkwIiB2aWV3Qm94PSIwIDAgMTIwIDkwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjkwIiBmaWxsPSIjNkI0NkMxIi8+Cjx0ZXh0IHg9IjYwIiB5PSI0NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iIGZpbGw9IndoaXRlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTJweCI+RXZlbnQ8L3RleHQ+Cjwvc3ZnPgo="
            onError={(e) => {
              console.warn('Failed to load poster image:', posterImageUrl);
              e.currentTarget.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjkwIiB2aWV3Qm94PSIwIDAgMTIwIDkwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjkwIiBmaWxsPSIjNkI0NkMxIi8+Cjx0ZXh0IHg9IjYwIiB5PSI0NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iIGZpbGw9IndoaXRlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTJweCI+RXZlbnQ8L3RleHQ+Cjwvc3ZnPgo=";
            }}
          />
        </Box>

        <VStack align="start" spacing={1} flex="1">
          <Text fontWeight="bold" fontSize="md">
            {event.title}
          </Text>
          <HStack fontSize="sm" color="gray.600">
            <FaCalendarAlt />
            <Text>{formatDate(event.date)}</Text>
          </HStack>
          <HStack fontSize="sm" color="gray.600">
            <FaMapMarkerAlt />
            <Text>{event.location}</Text>
          </HStack>
        </VStack>
      </Flex>

      {/* Ticket details */}
      <VStack spacing={4} p={4} align="stretch">
        <Flex justify="space-between" align="center">
          <VStack align="start" spacing={0}>
            <Text fontWeight="medium">{tier.name}</Text>
            <Text fontSize="sm" color="gray.600">
              {tier.description}
            </Text>
          </VStack>
          <Text fontWeight="medium">
            {tier.currency} {tier.price.toLocaleString()}
          </Text>
        </Flex>

        <HStack justify="space-between" align="center">
          <Text>Quantity</Text>
          <NumberInput
            size="sm"
            maxW={28}
            min={1}
            max={Math.min(tier.maxPerPurchase, tier.available)}
            value={quantity}
            onChange={handleQuantityChange}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </HStack>

        <Divider />

        <HStack justify="space-between">
          <Text>Subtotal</Text>
          <Text fontWeight="medium">
            {tier.currency} {subtotal.toLocaleString()}
          </Text>
        </HStack>

        <HStack justify="space-between">
          <Text>Platform Fee</Text>
          <Badge colorScheme="green" size="sm" variant="subtle">
            Already included
          </Badge>
        </HStack>

        <HStack justify="space-between">
          <Text>Blockchain fee</Text>
          <Text fontSize="sm" color="gray.600">
            Free
          </Text>
        </HStack>

        <Divider />

        <HStack justify="space-between">
          <Text fontWeight="bold">Total</Text>
          <Text fontWeight="bold" fontSize="lg" color="lummy.purple.600">
            {tier.currency} {subtotal.toLocaleString()}
          </Text>
        </HStack>

        {/* Fee Transparency Display */}
        <Box
          p={3}
          borderRadius="md"
          bg="green.50"
          borderWidth="1px"
          borderColor="green.200"
        >
          <FeeDisplay
            price={tier.price}
            showBreakdown={false}
            size="sm"
          />
        </Box>
      </VStack>
    </Box>
  );
};

export default OrderSummary;
