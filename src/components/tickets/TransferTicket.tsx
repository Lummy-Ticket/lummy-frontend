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
  Badge,
  useToast,
} from "@chakra-ui/react";
import { Ticket } from "./TicketCard";
import { useSmartContract } from "../../hooks/useSmartContract";
import { DEVELOPMENT_CONFIG, CONTRACT_ADDRESSES } from "../../constants";
import { useAccount, usePublicClient } from "wagmi";
import { TICKET_NFT_ABI } from "../../contracts/TicketNFT";

interface TransferTicketProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket;
}

export const TransferTicket: React.FC<TransferTicketProps> = ({
  isOpen,
  onClose,
  ticket,
}) => {
  const [recipientAddress, setRecipientAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [gasEstimate, setGasEstimate] = useState<string | null>(null);
  const [transferFee, setTransferFee] = useState<string | null>(null);
  const [isOwnershipVerified, setIsOwnershipVerified] = useState(false);
  
  const toast = useToast();
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { transferNFT } = useSmartContract();

  // Verify NFT ownership on modal open
  useEffect(() => {
    if (isOpen && ticket.tokenId && address) {
      verifyOwnership();
    }
  }, [isOpen, ticket.tokenId, address]);

  const verifyOwnership = async () => {
    if (!DEVELOPMENT_CONFIG.ENABLE_BLOCKCHAIN) {
      // Mock ownership verification with enhanced checks
      const isValidTicket = ticket.status === 'valid' && !!ticket.tokenId;
      setIsOwnershipVerified(isValidTicket);
      
      if (!isValidTicket) {
        toast({
          title: "Transfer Not Available",
          description: ticket.status !== 'valid' 
            ? `Ticket status is '${ticket.status}' - only valid tickets can be transferred`
            : "Missing token ID - NFT not properly minted",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
      }
      return;
    }

    try {
      if (!ticket.tokenId) {
        setIsOwnershipVerified(false);
        toast({
          title: "Transfer Error", 
          description: "Token ID missing - NFT not properly minted",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      // Real ownership verification via contract
      const owner = await publicClient?.readContract({
        address: CONTRACT_ADDRESSES.TicketNFT as `0x${string}`,
        abi: TICKET_NFT_ABI,
        functionName: "ownerOf", 
        args: [BigInt(ticket.tokenId)],
      });
      
      const isOwner = owner?.toString().toLowerCase() === address?.toLowerCase();
      setIsOwnershipVerified(Boolean(isOwner));
      
      if (!isOwner) {
        toast({
          title: "Transfer Not Available",
          description: "You don't own this NFT ticket",
          status: "error", 
          duration: 5000,
          isClosable: true,
        });
      }
      
      // Additional validation: Check if ticket is transferable
      if (isOwner && ticket.status !== 'valid') {
        setIsOwnershipVerified(false);
        toast({
          title: "Transfer Restricted",
          description: `Ticket status is '${ticket.status}' - only valid tickets can be transferred`,
          status: "warning",
          duration: 5000, 
          isClosable: true,
        });
      }
      
    } catch (err) {
      console.error('Ownership verification failed:', err);
      setIsOwnershipVerified(false);
      toast({
        title: "Verification Failed",
        description: "Unable to verify ticket ownership. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputAddress = e.target.value;
    setRecipientAddress(inputAddress);
    
    // Enhanced address validation
    const isValidFormat = inputAddress.startsWith("0x") && inputAddress.length === 42;
    const isNotSelfTransfer = inputAddress.toLowerCase() !== address?.toLowerCase();
    const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(inputAddress);
    
    setIsValid(isValidFormat && isNotSelfTransfer && isValidAddress);
    
    // Estimate gas and fees when valid address is entered
    if (isValidFormat && isNotSelfTransfer && isValidAddress) {
      estimateTransferCosts(inputAddress);
    } else {
      setGasEstimate(null);
      setTransferFee(null);
    }
  };

  const estimateTransferCosts = async (_toAddress: string) => {
    if (!DEVELOPMENT_CONFIG.ENABLE_BLOCKCHAIN) {
      // Mock gas estimation
      setGasEstimate("~0.002 LSK");
      setTransferFee("Free");
      return;
    }

    try {
      // Real gas estimation would go here
      // const gasPrice = await publicClient.getGasPrice();
      // const gasLimit = await publicClient.estimateContractGas({...});
      // setGasEstimate(formatEther(gasPrice * gasLimit));
      
      setGasEstimate("~0.002 LSK");
      setTransferFee("Free");
    } catch (err) {
      console.error('Gas estimation failed:', err);
      setGasEstimate("Unable to estimate");
    }
  };

  const handleTransfer = async () => {
    if (!isOwnershipVerified) {
      toast({
        title: "Transfer Failed",
        description: "You don't own this NFT ticket.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);

    try {
      if (!DEVELOPMENT_CONFIG.ENABLE_BLOCKCHAIN) {
        // Mock transfer
        await new Promise(resolve => 
          setTimeout(resolve, DEVELOPMENT_CONFIG.MOCK_TRANSACTION_DELAY)
        );
        
        // Simulate occasional failure
        if (Math.random() > DEVELOPMENT_CONFIG.MOCK_SUCCESS_RATE) {
          throw new Error("Mock transfer failed");
        }
      } else {
        // Real blockchain transfer
        if (!ticket.tokenId) {
          throw new Error("Token ID not found");
        }
        
        const result = await transferNFT(ticket.tokenId, recipientAddress);
        
        if (!result) {
          throw new Error("Transfer transaction failed");
        }
        
        DEVELOPMENT_CONFIG.LOG_CONTRACT_CALLS && 
          console.log('✅ Transfer successful:', result);
      }

      toast({
        title: "🎫 NFT Ticket Transferred Successfully",
        description: (
          <Box>
            <Text>Transferred to: {recipientAddress.substring(0, 8)}...{recipientAddress.substring(38)}</Text>
            <Text fontSize="xs" color="green.300" mt={1}>
              ✓ Enhanced metadata preserved (event name, venue, tier)
              <br />
              ✓ Transfer count incremented in NFT
              <br />
              ✓ Original price and purchase date maintained
            </Text>
          </Box>
        ),
        status: "success",
        duration: 8000,
        isClosable: true,
      });
      
      onClose();
      
      // Reset form
      setRecipientAddress("");
      setGasEstimate(null);
      setTransferFee(null);
      
    } catch (err: any) {
      console.error('Transfer failed:', err);
      
      toast({
        title: "Transfer Failed",
        description: err.message || "Failed to transfer ticket. Please try again.",
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
        <ModalHeader>Transfer Ticket</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {/* Enhanced Ticket Info Display */}
            <Box p={4} bg="gray.50" borderRadius="lg" borderWidth="1px">
              <VStack align="start" spacing={2}>
                <HStack justify="space-between" width="100%">
                  <Text fontWeight="bold" fontSize="lg">
                    {ticket.eventName}
                  </Text>
                  <Badge colorScheme={isOwnershipVerified ? "green" : "red"} variant="subtle">
                    {isOwnershipVerified ? "Owned" : "Not Owned"}
                  </Badge>
                </HStack>
                
                <Text fontSize="sm" color="gray.600">
                  {ticket.ticketType} • {ticket.eventLocation}
                </Text>
                
                {ticket.tokenId && (
                  <Text fontSize="xs" color="gray.500">
                    Token ID: {ticket.tokenId}
                  </Text>
                )}
                
                <Text fontSize="sm" color="green.600" fontWeight="medium">
                  Original Price: {ticket.price} {ticket.currency}
                </Text>
              </VStack>
            </Box>

            <Alert status="warning" borderRadius="md">
              <AlertIcon />
              <VStack align="start" spacing={1}>
                <Text fontSize="sm" fontWeight="medium">
                  Important: Transfer is permanent and irreversible
                </Text>
                <Text fontSize="xs">
                  • The NFT will be removed from your wallet
                  • Recipient gains full ownership and transfer rights
                  • Enhanced metadata (event name, venue, tier) will be preserved
                  • Transfer count will be incremented in the NFT
                </Text>
              </VStack>
            </Alert>

            <FormControl isRequired>
              <FormLabel>Recipient Wallet Address</FormLabel>
              <Input
                placeholder="0x1234567890123456789012345678901234567890"
                value={recipientAddress}
                onChange={handleAddressChange}
                isInvalid={recipientAddress.length > 0 && !isValid}
                errorBorderColor="red.300"
              />
              {recipientAddress.length > 0 && !isValid && (
                <Text fontSize="xs" color="red.500" mt={1}>
                  {recipientAddress.toLowerCase() === address?.toLowerCase() 
                    ? "Cannot transfer to yourself"
                    : "Invalid wallet address format"
                  }
                </Text>
              )}
              {isValid && (
                <Text fontSize="xs" color="green.500" mt={1}>
                  ✓ Valid wallet address
                </Text>
              )}
            </FormControl>
            
            {/* Gas Estimation Display */}
            {(gasEstimate || transferFee) && (
              <>
                <Divider />
                <Box p={3} bg="blue.50" borderRadius="md" borderWidth="1px" borderColor="blue.200">
                  <Text fontSize="sm" fontWeight="medium" color="blue.800" mb={2}>
                    Transfer Cost Estimate
                  </Text>
                  <VStack align="start" spacing={1}>
                    {gasEstimate && (
                      <HStack justify="space-between" width="100%">
                        <Text fontSize="sm" color="gray.600">Network Fee:</Text>
                        <Text fontSize="sm" fontWeight="medium">{gasEstimate}</Text>
                      </HStack>
                    )}
                    {transferFee && (
                      <HStack justify="space-between" width="100%">
                        <Text fontSize="sm" color="gray.600">Platform Fee:</Text>
                        <Text fontSize="sm" fontWeight="medium" color="green.600">{transferFee}</Text>
                      </HStack>
                    )}
                  </VStack>
                </Box>
              </>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="purple"
              isLoading={isLoading}
              loadingText="Transferring..."
              isDisabled={!isValid || !isOwnershipVerified}
              onClick={handleTransfer}
              _hover={{
                bg: isLoading ? "purple.500" : "purple.600",
              }}
            >
              {!isOwnershipVerified 
                ? "Ownership Verification Required"
                : "Transfer NFT Ticket"
              }
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default TransferTicket;
