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
  Badge,
  Image,
  Icon,
  useToast,
} from "@chakra-ui/react";
import { FaEye, FaGasPump } from "react-icons/fa";
import { Ticket } from "./TicketCard";
import { useSmartContract } from "../../hooks/useSmartContract";
import { DEVELOPMENT_CONFIG } from "../../constants";
// import { useAccount } from "wagmi";

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
  const [feeBreakdown, setFeeBreakdown] = useState<{
    organizerFee: number;
    platformFee: number;
    sellerAmount: number;
  } | null>(null);
  const [gasEstimate, setGasEstimate] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
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
  const { getResaleRules, createResaleListing, getNFTImageFromTokenId } = useSmartContract();
  const [nftImageUrl, setNftImageUrl] = useState<string>("/assets/images/nft-preview.png");

  // Dynamic max resell percentage based on organizer settings
  const maxResellPercentage = 100 + resaleRules.maxMarkupPercentage;
  const maxPrice = (ticket.price * maxResellPercentage) / 100;

  // Fetch resale rules when modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchResaleRules = async () => {
        try {
          if (!DEVELOPMENT_CONFIG.ENABLE_BLOCKCHAIN) {
            // Mock resale rules with reasonable defaults
            const mockRules = {
              allowResell: true,
              maxMarkupPercentage: 50, // 50% max markup
              organizerFeePercentage: 5, // 5% organizer fee
              restrictResellTiming: true,
              minDaysBeforeEvent: 1, // 1 day minimum
            };
            setResaleRules(mockRules);
            return;
          }

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
              return;
            }

            // Check timing restrictions
            if (rules.restrictResellTiming) {
              const eventDate = new Date(ticket.eventDate);
              const now = new Date();
              const daysDifference = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              
              if (daysDifference < rules.minDaysBeforeEvent) {
                toast({
                  title: "Resale Deadline Passed",
                  description: `Resale is not allowed within ${rules.minDaysBeforeEvent} day(s) of the event.`,
                  status: "warning",
                  duration: 7000,
                  isClosable: true,
                });
                onClose();
                return;
              }
            }
          }
        } catch (error) {
          console.error("Error fetching resale rules:", error);
          // Keep default rules - no error message to user
        }
      };
      
      fetchResaleRules();
      
      // Calculate initial fees for default price
      calculateFees(ticket.price);
    }
  }, [isOpen, getResaleRules, toast, onClose, ticket.price]);

  // Load NFT image when modal opens
  useEffect(() => {
    const loadNftImage = async () => {
      try {
        if (ticket.tokenId && isOpen) {
          const tokenIdNum = typeof ticket.tokenId === 'string' ? parseInt(ticket.tokenId) : ticket.tokenId;
          const imageUrl = await getNFTImageFromTokenId(tokenIdNum);
          if (imageUrl) {
            setNftImageUrl(imageUrl);
          }
        }
      } catch (error) {
        console.error('Error loading NFT image:', error);
        setNftImageUrl("/assets/images/nft-preview.png");
      }
    };

    loadNftImage();
  }, [ticket.tokenId, isOpen, getNFTImageFromTokenId]);

  const handlePercentageChange = (val: number) => {
    setResellPercentage(val);
    const newPrice = (ticket.price * val) / 100;
    setResellPrice(newPrice);
    
    // Calculate fee breakdown
    calculateFees(newPrice);
  };

  const calculateFees = async (price: number) => {
    if (!DEVELOPMENT_CONFIG.ENABLE_BLOCKCHAIN) {
      // Mock fee calculation
      const organizerFee = (price * resaleRules.organizerFeePercentage) / 100;
      const platformFee = (price * 3) / 100; // 3% platform fee
      const sellerAmount = price - organizerFee - platformFee;
      
      setFeeBreakdown({
        organizerFee,
        platformFee,
        sellerAmount,
      });
      
      setGasEstimate("~0.003 LSK");
      return;
    }

    try {
      // Real fee calculation via contract
      // const fees = await calculateResaleFees(price);
      // setFeeBreakdown(fees);
      
      // For now, use mock calculation
      const organizerFee = (price * resaleRules.organizerFeePercentage) / 100;
      const platformFee = (price * 3) / 100;
      const sellerAmount = price - organizerFee - platformFee;
      
      setFeeBreakdown({ organizerFee, platformFee, sellerAmount });
      setGasEstimate("~0.003 LSK");
    } catch (err) {
      console.error('Fee calculation error:', err);
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const price = parseFloat(e.target.value);
    if (!isNaN(price)) {
      setResellPrice(price);
      const percentage = (price / ticket.price) * 100;
      setResellPercentage(Math.min(maxResellPercentage, percentage));
    }
  };

  const handleListForResale = async () => {
    if (!ticket.tokenId) {
      toast({
        title: "Listing Failed",
        description: "Token ID not found. Cannot list ticket for resale.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);

    try {
      if (!DEVELOPMENT_CONFIG.ENABLE_BLOCKCHAIN) {
        // Mock resale listing
        await new Promise(resolve => 
          setTimeout(resolve, DEVELOPMENT_CONFIG.MOCK_TRANSACTION_DELAY)
        );
        
        // Simulate occasional failure
        if (Math.random() > DEVELOPMENT_CONFIG.MOCK_SUCCESS_RATE) {
          throw new Error("Mock listing failed");
        }
      } else {
        // Real blockchain listing
        const result = await createResaleListing(ticket.tokenId, resellPrice.toString());
        if (!result) {
          throw new Error("Listing transaction failed");
        }
        
        DEVELOPMENT_CONFIG.LOG_CONTRACT_CALLS && 
          console.log('✅ Resale listing successful:', result);
      }

      toast({
        title: "🏪 Ticket Listed Successfully",
        description: (
          <Box>
            <Text>Listed for: {resellPrice} {ticket.currency}</Text>
            {feeBreakdown && (
              <Text fontSize="xs" color="green.300" mt={1}>
                ✓ You'll receive: {feeBreakdown.sellerAmount.toFixed(2)} {ticket.currency}
                <br />
                ✓ Organizer fee: {feeBreakdown.organizerFee.toFixed(2)} {ticket.currency}
                <br />
                ✓ Platform fee: {feeBreakdown.platformFee.toFixed(2)} {ticket.currency}
              </Text>
            )}
          </Box>
        ),
        status: "success",
        duration: 8000,
        isClosable: true,
      });
      
      onClose();
      
    } catch (err: any) {
      console.error('Resale listing failed:', err);
      
      toast({
        title: "Listing Failed",
        description: err.message || "Failed to list ticket for resale. Please try again.",
        status: "error",
        duration: 7000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>List Ticket for Resale</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {/* Enhanced Ticket Info with NFT Preview */}
            <Box p={4} bg="gray.50" borderRadius="lg" borderWidth="1px">
              <HStack spacing={4}>
                {/* NFT Preview Image */}
                <Box 
                  width="80px" 
                  height="80px" 
                  borderRadius="md" 
                  overflow="hidden"
                  borderWidth="1px"
                  borderColor="gray.200"
                >
                  <Image
                    src={nftImageUrl}
                    alt={`NFT for ${ticket.eventName}`}
                    width="100%"
                    height="100%"
                    objectFit="cover"
                  />
                </Box>
                
                {/* Ticket Details */}
                <VStack align="start" flex="1" spacing={1}>
                  <Text fontWeight="bold" fontSize="lg">
                    {ticket.eventName}
                  </Text>
                  <HStack>
                    <Badge colorScheme="purple" variant="subtle">
                      {ticket.ticketType}
                    </Badge>
                    <Badge colorScheme="green" variant="subtle">
                      Original: {ticket.price} {ticket.currency}
                    </Badge>
                  </HStack>
                  <Text fontSize="sm" color="gray.600">
                    📍 {ticket.eventLocation}
                  </Text>
                  {ticket.tokenId && (
                    <Text fontSize="xs" color="gray.500">
                      Token ID: {ticket.tokenId}
                    </Text>
                  )}
                </VStack>
              </HStack>
            </Box>

            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <VStack align="start" spacing={1}>
                <Text fontSize="sm" fontWeight="medium">
                  Marketplace Listing Terms
                </Text>
                <Text fontSize="xs">
                  • Your NFT will be transferred to marketplace escrow
                  <br />
                  • You can cancel listing anytime before purchase
                  <br />
                  • Enhanced metadata (event, venue, tier) preserved for buyer
                  <br />
                  • Organizer & platform fees deducted automatically
                </Text>
              </VStack>
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

            {/* Enhanced Fee Breakdown */}
            {feeBreakdown && (
              <Box p={4} bg="blue.50" borderRadius="lg" borderWidth="1px" borderColor="blue.200">
                <HStack justify="space-between" mb={3}>
                  <Text fontSize="sm" fontWeight="medium" color="blue.800">
                    💰 Fee Breakdown
                  </Text>
                  {gasEstimate && (
                    <HStack>
                      <Icon as={FaGasPump} color="blue.600" boxSize="12px" />
                      <Text fontSize="xs" color="blue.600">{gasEstimate}</Text>
                    </HStack>
                  )}
                </HStack>
                
                <VStack spacing={2}>
                  <HStack justify="space-between" width="100%">
                    <Text fontSize="sm" color="gray.600">Listing Price:</Text>
                    <Text fontSize="sm" fontWeight="medium">{resellPrice.toFixed(2)} {ticket.currency}</Text>
                  </HStack>
                  
                  <Divider />
                  
                  <HStack justify="space-between" width="100%">
                    <Text fontSize="xs" color="gray.500">Organizer Fee ({resaleRules.organizerFeePercentage}%):</Text>
                    <Text fontSize="xs" color="red.600">-{feeBreakdown.organizerFee.toFixed(2)} {ticket.currency}</Text>
                  </HStack>
                  
                  <HStack justify="space-between" width="100%">
                    <Text fontSize="xs" color="gray.500">Platform Fee (3%):</Text>
                    <Text fontSize="xs" color="red.600">-{feeBreakdown.platformFee.toFixed(2)} {ticket.currency}</Text>
                  </HStack>
                  
                  <Divider />
                  
                  <HStack justify="space-between" width="100%">
                    <Text fontSize="sm" fontWeight="bold" color="green.700">You'll Receive:</Text>
                    <Text fontSize="sm" fontWeight="bold" color="green.700">
                      {feeBreakdown.sellerAmount.toFixed(2)} {ticket.currency}
                    </Text>
                  </HStack>
                </VStack>
              </Box>
            )}

            {/* Organizer Rules Display */}
            <Alert status="info" borderRadius="md" size="sm">
              <AlertIcon />
              <VStack align="start" spacing={1}>
                <Text fontSize="sm" fontWeight="medium">
                  📋 Organizer Resale Rules
                </Text>
                <Text fontSize="xs" color="gray.600">
                  • Max markup: {resaleRules.maxMarkupPercentage}% above original price
                  <br />
                  • Organizer fee: {resaleRules.organizerFeePercentage}%
                  {resaleRules.restrictResellTiming && (
                    <><br />• Resale cutoff: {resaleRules.minDaysBeforeEvent} day(s) before event</>
                  )}
                </Text>
              </VStack>
            </Alert>

            {/* Marketplace Preview */}
            <Box p={4} bg="purple.50" borderRadius="lg" borderWidth="1px" borderColor="purple.200">
              <HStack justify="space-between" mb={3}>
                <Text fontSize="sm" fontWeight="medium" color="purple.800">
                  🔍 Marketplace Preview
                </Text>
                <Button size="xs" variant="ghost" colorScheme="purple" onClick={() => setShowPreview(!showPreview)}>
                  <Icon as={FaEye} mr={1} />
                  {showPreview ? 'Hide' : 'Show'}
                </Button>
              </HStack>
              
              {showPreview && (
                <Box p={3} bg="white" borderRadius="md" borderWidth="1px">
                  <HStack spacing={3}>
                    <Box width="60px" height="60px" borderRadius="md" overflow="hidden">
                      <Image
                        src={nftImageUrl}
                        alt="NFT Preview"
                        width="100%"
                        height="100%"
                        objectFit="cover"
                      />
                    </Box>
                    <VStack align="start" flex="1" spacing={1}>
                      <Text fontSize="sm" fontWeight="medium">{ticket.eventName}</Text>
                      <HStack>
                        <Badge size="sm" colorScheme="purple">{ticket.ticketType}</Badge>
                        <Badge size="sm" colorScheme="orange">Resale</Badge>
                      </HStack>
                      <HStack justify="space-between" width="100%">
                        <Text fontSize="xs" color="gray.500">Original: {ticket.price} {ticket.currency}</Text>
                        <Text fontSize="sm" fontWeight="bold" color="green.600">
                          {resellPrice.toFixed(2)} {ticket.currency}
                        </Text>
                      </HStack>
                    </VStack>
                  </HStack>
                </Box>
              )}
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
