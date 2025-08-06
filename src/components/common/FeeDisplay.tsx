import React from "react";
import {
  Box,
  Text,
  VStack,
  HStack,
  Divider,
  Badge,
  Tooltip,
  Icon,
} from "@chakra-ui/react";
import { InfoIcon } from "@chakra-ui/icons";
import { formatFeeDisplay, calculateOrganizerRevenue, calculateResaleFeeBreakdown } from "../../utils/contractUtils";

interface FeeDisplayProps {
  price: number;
  isResale?: boolean;
  isOrganizerView?: boolean;
  organizerFeePercentage?: number;
  showBreakdown?: boolean;
  size?: "sm" | "md" | "lg";
}

/**
 * FeeDisplay Component - Shows transparent fee breakdown for ticket pricing
 * Supports both primary sales (7% platform fee) and resale (3% platform fee)
 */
const FeeDisplay: React.FC<FeeDisplayProps> = ({
  price,
  isResale = false,
  isOrganizerView = false,
  organizerFeePercentage = 0,
  showBreakdown = true,
  size = "md",
}) => {
  const feeDisplay = formatFeeDisplay(price, isResale);
  const resaleBreakdown = isResale ? calculateResaleFeeBreakdown(price, organizerFeePercentage) : null;
  const organizerRevenue = !isResale ? calculateOrganizerRevenue(price) : null;

  const textSizes = {
    sm: { base: "sm", price: "md", fee: "xs" },
    md: { base: "md", price: "lg", fee: "sm" },
    lg: { base: "lg", price: "xl", fee: "md" },
  };

  const currentSizes = textSizes[size];

  if (isOrganizerView && !isResale) {
    // Organizer view for primary sales - show revenue after platform fee
    return (
      <Box>
        <VStack spacing={2} align="stretch">
          <HStack justify="space-between">
            <Text fontSize={currentSizes.base} color="gray.600">
              Ticket Price:
            </Text>
            <Text fontSize={currentSizes.price} fontWeight="bold">
              {price} IDRX
            </Text>
          </HStack>
          
          {showBreakdown && (
            <>
              <HStack justify="space-between">
                <HStack>
                  <Text fontSize={currentSizes.fee} color="red.500">
                    Platform Fee (7%):
                  </Text>
                  <Tooltip label="Platform fee supports secure transactions and platform maintenance">
                    <Icon as={InfoIcon} boxSize="3" color="gray.400" />
                  </Tooltip>
                </HStack>
                <Text fontSize={currentSizes.fee} color="red.500">
                  -{feeDisplay.platformFee}
                </Text>
              </HStack>
              
              <Divider />
              
              <HStack justify="space-between">
                <Text fontSize={currentSizes.base} fontWeight="bold" color="green.600">
                  You'll Receive:
                </Text>
                <Text fontSize={currentSizes.price} fontWeight="bold" color="green.600">
                  {organizerRevenue?.toFixed(2)} IDRX
                </Text>
              </HStack>
            </>
          )}
          
          <Badge colorScheme="blue" size="sm" textAlign="center">
            💡 Platform fee deducted immediately - you get 93% per ticket
          </Badge>
        </VStack>
      </Box>
    );
  }

  if (isResale && resaleBreakdown) {
    // Resale transaction view - simplified without fee breakdown
    return (
      <Box>
        <VStack spacing={2} align="stretch">
          <HStack justify="space-between">
            <Text fontSize={currentSizes.base} color="gray.600">
              Resale Price:
            </Text>
            <Text fontSize={currentSizes.price} fontWeight="bold">
              {price} IDRX
            </Text>
          </HStack>
          
          <Badge colorScheme="purple" size="sm" textAlign="center">
            ✅ Secure blockchain transaction
          </Badge>
        </VStack>
      </Box>
    );
  }

  // Standard user view for primary sales
  return (
    <Box>
      <VStack spacing={2} align="stretch">
        <HStack justify="space-between">
          <Text fontSize={currentSizes.base} color="gray.600">
            Ticket Price:
          </Text>
          <Text fontSize={currentSizes.price} fontWeight="bold">
            {price} IDRX
          </Text>
        </HStack>
        
        {showBreakdown && (
          <HStack justify="center">
            <Badge colorScheme="green" size="sm" textAlign="center">
              ✅ {feeDisplay.transparencyMessage}
            </Badge>
          </HStack>
        )}
        
        <Text fontSize="xs" color="gray.500" textAlign="center">
          What you see is what you pay - no surprises at checkout
        </Text>
      </VStack>
    </Box>
  );
};

export default FeeDisplay;