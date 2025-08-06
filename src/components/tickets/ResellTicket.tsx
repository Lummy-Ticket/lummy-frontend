import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Text,
  VStack,
  HStack,
  Box,
  Alert,
  AlertIcon,
  Divider,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  SliderMark,
  useToast,
} from "@chakra-ui/react";
import { Ticket } from "./TicketCard";
import { useSmartContract } from "../../hooks/useSmartContract";

interface ResellTicketProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket;
}

export const ResellTicket: React.FC<ResellTicketProps> = ({
  isOpen,
  onClose,
  ticket,
}) => {
  const [resellPrice, setResellPrice] = useState(ticket.price);
  const [resellPercentage, setResellPercentage] = useState(100);
  const [isLoading, setIsLoading] = useState(false);
  const [resaleRules, setResaleRules] = useState<{
    allowResell: boolean;
    maxMarkupPercentage: number;
    organizerFeePercentage: number;
    restrictResellTiming: boolean;
    minDaysBeforeEvent: number;
  }>({
    allowResell: true,
    maxMarkupPercentage: 20, // 20% default
    organizerFeePercentage: 2.5, // 2.5% default
    restrictResellTiming: false,
    minDaysBeforeEvent: 0,
  });
  
  const toast = useToast();
  const { getResaleRules } = useSmartContract();

  // Dynamic max resell percentage based on organizer settings
  const maxResellPercentage = 100 + resaleRules.maxMarkupPercentage;
  const maxPrice = (ticket.price * maxResellPercentage) / 100;

  // Fetch resale rules when modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchResaleRules = async () => {
        try {
          const rules = await getResaleRules();
          if (rules) {
            setResaleRules(rules);
            
            // Check if resale is allowed
            if (!rules.allowResell) {
              toast({
                title: "Resale Not Allowed",
                description: "The event organizer has disabled ticket resale for this event.",
                status: "error",
                duration: 5000,
                isClosable: true,
              });
              onClose();
            }
          }
        } catch (error) {
          console.error("Error fetching resale rules:", error);
          // Keep default rules - no error message to user
        }
      };
      
      fetchResaleRules();
    }
  }, [isOpen, getResaleRules, toast, onClose]);

  const handlePercentageChange = (val: number) => {
    setResellPercentage(val);
    setResellPrice((ticket.price * val) / 100);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const price = parseFloat(e.target.value);
    if (!isNaN(price)) {
      setResellPrice(price);
      const percentage = (price / ticket.price) * 100;
      setResellPercentage(Math.min(maxResellPercentage, percentage));
    }
  };

  const handleListForResale = () => {
    setIsLoading(true);

    // Simulate blockchain transaction
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Ticket Listed",
        description: `Your ticket is now listed for resale at ${ticket.currency} ${resellPrice}`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      onClose();
    }, 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>List Ticket for Resale</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Box>
              <Text fontWeight="bold">{ticket.eventName}</Text>
              <Text fontSize="sm" color="gray.600">
                {ticket.ticketType}
              </Text>
            </Box>

            <Alert status="error" borderRadius="md">
              <AlertIcon />
              <Text fontSize="sm">
                Your ticket will be listed on the marketplace for resale. You
                can cancel the listing anytime before someone buys it.
              </Text>
            </Alert>

            <Divider />

            <Box>
              <Text fontWeight="medium" mb={2}>
                Set Resale Price
              </Text>
              <Text fontSize="sm" color="gray.600" mb={4}>
                Original price: {ticket.currency} {ticket.price}
              </Text>

              <VStack spacing={5}>
                <FormControl>
                  <FormLabel>Price ({ticket.currency})</FormLabel>
                  <Input
                    type="number"
                    value={resellPrice}
                    onChange={handlePriceChange}
                    max={maxPrice}
                  />
                </FormControl>

                <Box width="100%">
                  <Text fontSize="sm" mb={2}>
                    Percentage of original price: {resellPercentage}%
                  </Text>
                  <Slider
                    aria-label="percentage-slider"
                    min={50}
                    max={maxResellPercentage}
                    value={resellPercentage}
                    onChange={handlePercentageChange}
                    colorScheme="purple"
                  >
                    <SliderTrack>
                      <SliderFilledTrack />
                    </SliderTrack>
                    <SliderThumb boxSize={6} />
                    <SliderMark
                      value={100}
                      textAlign="center"
                      bg="purple.500"
                      color="white"
                      mt="-10"
                      ml="-5"
                      w="12"
                      fontSize="xs"
                      borderRadius="md"
                    >
                      Original
                    </SliderMark>
                  </Slider>
                </Box>
              </VStack>
            </Box>

            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <Box>
                <Text fontSize="sm" fontWeight="medium">
                  Resale Settings (Set by Event Organizer)
                </Text>
                <Text fontSize="xs" color="gray.600" mt={1}>
                  Maximum markup: {resaleRules.maxMarkupPercentage}% above original price
                </Text>
              </Box>
            </Alert>

            <Box>
              <Text fontSize="sm" color="gray.600">
                Event organizer fee: {resaleRules.organizerFeePercentage}% ({ticket.currency}{" "}
                {(resellPrice * (resaleRules.organizerFeePercentage / 100)).toFixed(2)})
              </Text>
              <Text fontSize="sm" color="gray.600">
                Platform fee: 3% ({ticket.currency}{" "}
                {(resellPrice * 0.03).toFixed(2)})
              </Text>
              <Text fontWeight="medium" mt={2}>
                You'll receive: {ticket.currency}{" "}
                {(resellPrice * (1 - (resaleRules.organizerFeePercentage / 100) - 0.03)).toFixed(2)}
              </Text>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="green"
              isLoading={isLoading}
              loadingText="Listing..."
              onClick={handleListForResale}
              _hover={{
                bg: isLoading ? "purple.500" : "purple.600",
              }}
            >
              List for Resale
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ResellTicket;
