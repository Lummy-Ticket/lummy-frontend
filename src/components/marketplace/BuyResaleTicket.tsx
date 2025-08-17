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
  VStack,
  HStack,
  Text,
  Box,
  Divider,
  Flex,
  Badge,
  Icon,
  Alert,
  AlertIcon,
  Image,
  useToast,
} from "@chakra-ui/react";
import {
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaTicketAlt,
  FaCheck,
  FaExclamationTriangle,
  FaExternalLinkAlt,
} from "react-icons/fa";
import { ResaleTicket } from "./ResaleTicketCard";
import { PriceComparison } from "./PriceComparison";
import { useSmartContract } from "../../hooks/useSmartContract";
import { DEVELOPMENT_CONFIG, CHAIN_CONFIG } from "../../constants";
import { useAccount } from "wagmi";

interface BuyResaleTicketProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: ResaleTicket;
  onPurchaseSuccess?: () => void;
}

export const BuyResaleTicket: React.FC<BuyResaleTicketProps> = ({
  isOpen,
  onClose,
  ticket,
  onPurchaseSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPurchaseComplete, setIsPurchaseComplete] = useState(false);
  const [transactionHash, setTransactionHash] = useState("");
  
  const toast = useToast();
  const { address } = useAccount();
  const { purchaseResaleTicket, getNFTImageFromTokenId } = useSmartContract();
  const [nftImageUrl, setNftImageUrl] = useState<string>("/assets/images/nft-preview.png");

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

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

  const handleBuyTicket = async () => {
    if (!address) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to purchase tickets",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (!ticket.tokenId) {
      toast({
        title: "Purchase Error",
        description: "Invalid ticket - token ID not found",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);

    try {
      if (!DEVELOPMENT_CONFIG.ENABLE_BLOCKCHAIN) {
        // Mock purchase
        await new Promise(resolve => 
          setTimeout(resolve, DEVELOPMENT_CONFIG.MOCK_TRANSACTION_DELAY)
        );
        
        // Simulate occasional failure
        if (Math.random() > DEVELOPMENT_CONFIG.MOCK_SUCCESS_RATE) {
          throw new Error("Mock purchase failed");
        }
        
        setTransactionHash("0x4a8e7591fb9384e46ce0fc35f37f1379158ed0baa19e22bf9ffdf396dce47db5");
      } else {
        // Real blockchain purchase
        const result = await purchaseResaleTicket(ticket.tokenId);
        if (!result) {
          throw new Error("Purchase transaction failed");
        }
        
        setTransactionHash(result);
        DEVELOPMENT_CONFIG.LOG_CONTRACT_CALLS && 
          console.log('✅ Purchase successful:', result);
      }

      setIsPurchaseComplete(true);
      
      toast({
        title: "🎫 Purchase Successful!",
        description: (
          <Box>
            <Text>NFT ticket transferred to your wallet</Text>
            <Text fontSize="xs" color="green.300" mt={1}>
              ✓ Ownership transferred successfully
              <br />
              ✓ Enhanced metadata preserved
              <br />
              ✓ Ready for event entry
            </Text>
          </Box>
        ),
        status: "success",
        duration: 8000,
        isClosable: true,
      });

      // Call success callback to refresh marketplace
      onPurchaseSuccess?.();
      
    } catch (err: any) {
      console.error('Purchase failed:', err);
      
      toast({
        title: "Purchase Failed",
        description: err.message || "Failed to purchase ticket. Please try again.",
        status: "error",
        duration: 7000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewTickets = () => {
    onClose();
    // In a real app, we would redirect to the tickets page here
    window.location.href = "/tickets";
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
      <ModalOverlay />
      <ModalContent>
        {!isPurchaseComplete ? (
          <>
            <ModalHeader>Purchase Resale Ticket</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                {/* Enhanced Ticket Preview with NFT */}
                <Box p={4} bg="gray.50" borderRadius="lg" borderWidth="1px">
                  <HStack spacing={4}>
                    {/* NFT Preview */}
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
                    
                    {/* Ticket Info */}
                    <VStack align="start" flex="1" spacing={1}>
                      <Text fontSize="lg" fontWeight="bold">
                        {ticket.eventName}
                      </Text>
                      <HStack>
                        <Badge colorScheme="purple" variant="subtle">
                          {ticket.ticketType}
                        </Badge>
                        <Badge colorScheme="orange" variant="subtle">
                          Resale
                        </Badge>
                      </HStack>
                      <HStack color="gray.600" fontSize="sm">
                        <Icon as={FaCalendarAlt} />
                        <Text>{formatDate(ticket.eventDate)}</Text>
                      </HStack>
                      <HStack color="gray.600" fontSize="sm">
                        <Icon as={FaMapMarkerAlt} />
                        <Text>{ticket.eventLocation}</Text>
                      </HStack>
                    </VStack>
                  </HStack>
                </Box>

                <Divider />

                <Box>
                  <HStack>
                    <Icon as={FaTicketAlt} color="blue.500" />
                    <Text fontWeight="medium">{ticket.ticketType}</Text>
                  </HStack>

                  <Box mt={3}>
                    <PriceComparison
                      originalPrice={ticket.originalPrice}
                      resalePrice={ticket.resalePrice}
                      currency={ticket.currency}
                      showDetail={true}
                    />
                  </Box>
                </Box>

                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  <Box fontSize="sm">
                    <Text>
                      This is a resale ticket. The NFT will be transferred
                      directly to your wallet upon purchase.
                    </Text>
                    <Text mt={1}>
                      All transactions are verified on the Lisk blockchain
                      ensuring authenticity.
                    </Text>
                  </Box>
                </Alert>

                {ticket.transferCount && ticket.transferCount > 0 && (
                  <Alert status="warning" borderRadius="md">
                    <AlertIcon as={FaExclamationTriangle} />
                    <Text fontSize="sm">
                      This ticket has been transferred {ticket.transferCount}{" "}
                      time
                      {ticket.transferCount > 1 ? "s" : ""} before.
                    </Text>
                  </Alert>
                )}

                <Divider />

                <Box>
                  <Text fontWeight="medium" mb={2}>
                    Total Price
                  </Text>
                  <Text fontSize="2xl" fontWeight="bold" color="purple.600">
                    {ticket.currency} {ticket.resalePrice.toLocaleString()}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    What you see is what you pay - no hidden fees
                  </Text>
                </Box>
              </VStack>
            </ModalBody>

            <ModalFooter>
              <HStack spacing={3}>
                <Button
                  variant="ghost"
                  onClick={onClose}
                  isDisabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  colorScheme="blue"
                  onClick={handleBuyTicket}
                  isLoading={isLoading}
                  loadingText="Processing..."
                  _hover={{
                    bg: isLoading ? "purple.500" : "purple.600",
                  }}
                >
                  Confirm Purchase
                </Button>
              </HStack>
            </ModalFooter>
          </>
        ) : (
          <>
            <ModalHeader>🎫 Purchase Complete!</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={6} align="center" py={4}>
                <Flex
                  width="80px"
                  height="80px"
                  borderRadius="full"
                  bg="green.100"
                  align="center"
                  justify="center"
                >
                  <Icon as={FaCheck} color="green.500" boxSize="40px" />
                </Flex>

                <VStack spacing={2} textAlign="center">
                    <Text fontSize="xl" fontWeight="bold" color="green.600">
                      Ticket Purchased Successfully!
                    </Text>

                    <VStack spacing={1} align="center">
                      <Text>{ticket.eventName}</Text>
                      <Badge colorScheme="blue">{ticket.ticketType}</Badge>
                    </VStack>
                  </VStack>

                {transactionHash && (
                  <Box width="100%" bg="blue.50" p={4} borderRadius="md" borderWidth="1px" borderColor="blue.200">
                    <HStack justify="space-between" mb={2}>
                      <Text fontSize="sm" fontWeight="medium" color="blue.800">
                        📋 Transaction Details
                      </Text>
                      <Button
                        size="xs"
                        variant="ghost"
                        colorScheme="blue"
                        rightIcon={<Icon as={FaExternalLinkAlt} />}
                        onClick={() => window.open(`${CHAIN_CONFIG.blockExplorer}/tx/${transactionHash}`, '_blank')}
                      >
                        View on Explorer
                      </Button>
                    </HStack>
                    <Box
                      p={2}
                      bg="white"
                      borderRadius="md"
                      fontFamily="monospace"
                      fontSize="xs"
                      wordBreak="break-all"
                      borderWidth="1px"
                      borderColor="blue.200"
                    >
                      {transactionHash}
                    </Box>
                  </Box>
                )}

                <Alert status="success" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <Text fontWeight="medium">
                      The ticket has been transferred to your wallet
                    </Text>
                    <Text fontSize="sm">
                      You can view and manage your tickets in the My Tickets
                      section
                    </Text>
                  </Box>
                </Alert>
              </VStack>
            </ModalBody>

            <ModalFooter>
              <Button colorScheme="blue" onClick={handleViewTickets}>
                View My Tickets
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default BuyResaleTicket;
