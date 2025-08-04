import React, { useState, useEffect } from "react";
import {
  Box,
  VStack,
  Text,
  Button,
  Flex,
  Badge,
  List,
  ListItem,
  ListIcon,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useColorModeValue,
  Image,
  HStack,
} from "@chakra-ui/react";
import { CheckIcon } from "@chakra-ui/icons";
import { TicketTier } from "../../../types/Event";
import { formatPrice, formatNumber } from "../../../utils/contractUtils";

interface TicketTierCardProps {
  tier: TicketTier;
  onSelect: (tierId: string, quantity: number) => void;
  isSelected?: boolean;
  selectedQuantity?: number;
  onCheckout?: () => void;
}

export const TicketTierCard: React.FC<TicketTierCardProps> = ({
  tier,
  onSelect,
  isSelected = false,
  selectedQuantity = 0,
}) => {
  const [quantity, setQuantity] = useState<number>(0);
  const [, setTotalPrice] = useState<number>(tier.price * quantity);
  // Handle both active field and available > 0 for tier availability
  const isAvailable = (tier.active !== false) && tier.available > 0;
  const totalSold = tier.sold || 0;
  const totalAvailable = tier.available + totalSold;

  // Update local quantity when selected quantity changes from parent
  useEffect(() => {
    setQuantity(selectedQuantity);
  }, [isSelected, selectedQuantity]);

  // Calculate total price whenever quantity changes
  useEffect(() => {
    setTotalPrice(tier.price * quantity);
  }, [tier.price, quantity]);

  const handleQuantityChange = (
    _valueAsString: string,
    valueAsNumber: number
  ) => {
    setQuantity(valueAsNumber);
    if (isSelected) {
      onSelect(tier.id, valueAsNumber);
    }
  };

  const handleSelect = () => {
    // If not already selected, set quantity to 1 when selecting
    const newQuantity = !isSelected ? 1 : quantity;
    setQuantity(newQuantity);
    onSelect(tier.id, newQuantity);
  };

  // Enhanced styles for selected state
  const borderColor = useColorModeValue(
    isSelected ? "purple.300" : "gray.200",
    isSelected ? "purple.600" : "gray.600"
  );

  const bgColor = useColorModeValue(
    isSelected ? "purple.50" : "white",
    isSelected ? "purple.900" : "gray.800"
  );

  return (
    <Box
      borderWidth="2px"
      borderRadius="lg"
      overflow="hidden"
      borderColor={borderColor}
      bg={bgColor}
      boxShadow={isSelected ? "md" : "sm"}
      position="relative"
      transition="all 0.3s"
    >
      {/* Status Badge */}
      {tier.available < 10 && tier.available > 0 && tier.active !== false && (
        <Badge
          position="absolute"
          top={3}
          right={3}
          colorScheme="orange"
          variant="solid"
          fontSize="sm"
          px={2}
          py={1}
          borderRadius="md"
        >
          Only {formatNumber(tier.available)} left
        </Badge>
      )}

      {(tier.available === 0 || tier.active === false) && (
        <Badge
          position="absolute"
          top={3}
          right={3}
          colorScheme="red"
          variant="solid"
          fontSize="sm"
          px={2}
          py={1}
          borderRadius="md"
        >
          {tier.active === false ? "Inactive" : "Sold Out"}
        </Badge>
      )}

      <Flex direction={{ base: "column", md: "row" }}>
        {/* Tier Info */}
        <Box flex="1" p={6}>
          <VStack align="start" spacing={3}>
            <HStack spacing={4} align="center" width="100%">
              <VStack align="start" flex="1" spacing={1}>
                <Text
                  fontWeight="bold"
                  fontSize="xl"
                  color={isSelected ? "purple.700" : "gray.800"}
                >
                  {tier.name}
                </Text>
                <Text fontWeight="bold" fontSize="2xl" color="purple.600">
                  {formatPrice(tier.price, tier.currency)}
                </Text>
              </VStack>
              
              {/* NFT Image Placeholder - 1x1 aspect ratio */}
              <Box
                width="80px"
                height="80px"
                borderRadius="md"
                border="2px solid"
                borderColor={isSelected ? "purple.300" : "gray.200"}
                overflow="hidden"
                bg="gray.50"
                display="flex"
                alignItems="center"
                justifyContent="center"
                flexShrink={0}
              >
                <Image
                  src={tier.nftImageUrl || "/assets/images/nft-preview.png"}
                  alt={`NFT preview for ${tier.name}`}
                  width="100%"
                  height="100%"
                  objectFit="cover"
                  fallback={
                    <Text fontSize="xs" color="gray.400" textAlign="center" px={2}>
                      NFT
                      <br />
                      Preview
                    </Text>
                  }
                />
              </Box>
            </HStack>

            <Text color="gray.600" fontSize="md">
              {tier.description}
            </Text>

            {/* Show sold count if available */}
            {totalSold > 0 && (
              <Text color="gray.500" fontSize="sm">
                {formatNumber(totalSold)} / {formatNumber(totalAvailable)} sold
              </Text>
            )}

            {/* Show max per purchase info */}
            <Text color="gray.500" fontSize="sm">
              Max {formatNumber(tier.maxPerPurchase)} per purchase
            </Text>

            {/* Benefits List */}
            {tier.benefits && tier.benefits.length > 0 && (
              <Box width="100%" mt={2}>
                <Text fontWeight="medium" mb={2}>
                  This ticket includes:
                </Text>
                <List spacing={2}>
                  {tier.benefits.map((benefit, index) => (
                    <ListItem
                      key={index}
                      display="flex"
                      alignItems="flex-start"
                    >
                      <ListIcon as={CheckIcon} color="green.500" mt={1} />
                      <Text>{benefit}</Text>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </VStack>
        </Box>

        {/* Selection Controls */}
        <Box
          p={6}
          bg={isSelected ? "purple.100" : "gray.50"}
          display="flex"
          flexDirection="column"
          justifyContent="center"
          minWidth={{ base: "full", md: "250px" }}
          borderLeftWidth={{ base: "0", md: "1px" }}
          borderTopWidth={{ base: "1px", md: "0" }}
          borderColor="gray.200"
        >
          {isAvailable ? (
            <VStack spacing={4} align="stretch">
              <Box>
                <Text fontWeight="medium" mb={2}>
                  Quantity
                </Text>
                <NumberInput
                  size="md"
                  min={0}
                  max={Math.min(tier.maxPerPurchase, tier.available)}
                  value={quantity}
                  onChange={handleQuantityChange}
                  isDisabled={!isAvailable}
                >
                  <NumberInputField borderRadius="md" bg="white" />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </Box>

              <Button
                colorScheme="purple"
                size="md"
                onClick={handleSelect}
                isDisabled={!isAvailable}
                mt={2}
              >
                Select Ticket
              </Button>
            </VStack>
          ) : (
            <Button width="100%" isDisabled size="md" colorScheme="gray">
              {tier.active === false ? "Inactive" : "Sold Out"}
            </Button>
          )}
        </Box>
      </Flex>
    </Box>
  );
};

export default TicketTierCard;
