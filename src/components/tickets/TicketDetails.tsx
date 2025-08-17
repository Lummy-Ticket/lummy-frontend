import React, { useState, useEffect } from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Icon,
  Image,
  Grid,
  GridItem,
  Flex,
  Divider,
  useDisclosure,
} from "@chakra-ui/react";
import {
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaTicketAlt,
  FaExchangeAlt,
  FaShoppingCart,
  FaLink,
  FaUser,
  FaClock,
} from "react-icons/fa";
import { QRCode } from "./QRCode";
import { TransferTicket } from "./TransferTicket";
import { ResellTicket } from "./ResellTicket";
import { Ticket } from "./TicketCard";
import { getNFTBackgroundUrl } from "../../utils/ipfsMetadata";
import { useSmartContract } from "../../hooks/useSmartContract";

interface TicketDetailsProps {
  ticket: Ticket;
}

export const TicketDetails: React.FC<TicketDetailsProps> = ({ ticket }) => {
  const { getNFTImageFromTokenId } = useSmartContract();
  
  const {
    isOpen: isTransferOpen,
    onOpen: onTransferOpen,
    onClose: onTransferClose,
  } = useDisclosure();

  const {
    isOpen: isResellOpen,
    onOpen: onResellOpen,
    onClose: onResellClose,
  } = useDisclosure();

  const [nftImageUrl, setNftImageUrl] = useState<string>("/assets/images/nft-preview.png");

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Load NFT background image from contract tier images
  useEffect(() => {
    const loadNftImage = async () => {
      try {
        if (ticket.tokenId) {
          // Use new contract-based approach
          const tokenIdNum = typeof ticket.tokenId === 'string' ? parseInt(ticket.tokenId) : ticket.tokenId;
          const imageUrl = await getNFTImageFromTokenId(tokenIdNum);
          if (imageUrl) {
            setNftImageUrl(imageUrl);
          } else {
            setNftImageUrl("/assets/images/nft-preview.png");
          }
        } else {
          // Fallback to old approach if no tokenId
          const metadataSource = ticket.nftImageUrl || ticket.eventImageUrl || '';
          const tierId = ticket.ticketType;
          
          if (metadataSource) {
            const nftUrl = await getNFTBackgroundUrl(metadataSource, tierId);
            if (nftUrl) {
              setNftImageUrl(nftUrl);
            } else {
              setNftImageUrl("/assets/images/nft-preview.png");
            }
          } else {
            setNftImageUrl("/assets/images/nft-preview.png");
          }
        }
      } catch (error) {
        console.error('Error loading NFT image:', error);
        setNftImageUrl("/assets/images/nft-preview.png");
      }
    };

    loadNftImage();
  }, [ticket.tokenId, ticket.nftImageUrl, ticket.eventImageUrl, ticket.ticketType, getNFTImageFromTokenId]);

  const getStatusColor = (status: Ticket["status"]) => {
    switch (status) {
      case "valid":
        return "green";
      case "used":
        return "gray";
      case "refunded":
        return "orange";
      case "expired":
        return "red";
      case "transferred":
        return "blue";
      default:
        return "gray";
    }
  };

  const isActive = ticket.status === "valid";

  return (
    <>
      <Box
        borderWidth="1px"
        borderRadius="lg"
        overflow="hidden"
        bg="white"
        boxShadow="md"
      >
        <Box bg="lummy.purple.500" color="white" py={3} px={6}>
          <HStack justify="space-between">
            <Box>
              <HStack mb={1}>
                <Icon as={FaTicketAlt} />
                <Text fontWeight="medium">Ticket Details</Text>
              </HStack>
              <Text fontSize="xl" fontWeight="bold">
                {ticket.eventName}
              </Text>
            </Box>
            <Badge
              colorScheme={getStatusColor(ticket.status)}
              variant="solid"
              borderRadius="full"
              px={3}
              py={1}
              fontSize="md"
            >
              {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
            </Badge>
          </HStack>
        </Box>

        <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6} p={6}>
          <GridItem>
            <VStack align="start" spacing={4}>
              <Box width="100%">
                <Text fontWeight="medium" mb={2}>
                  Event Information
                </Text>
                <VStack align="start" spacing={3}>
                  <HStack>
                    <Icon as={FaCalendarAlt} color="gray.500" />
                    <Box>
                      <Text fontWeight="medium">Date</Text>
                      <Text color="gray.600">
                        {formatDate(ticket.eventDate)}
                      </Text>
                    </Box>
                  </HStack>

                  <HStack>
                    <Icon as={FaClock} color="gray.500" />
                    <Box>
                      <Text fontWeight="medium">Time</Text>
                      <Text color="gray.600">
                        {formatTime(ticket.eventDate)}
                      </Text>
                    </Box>
                  </HStack>

                  <HStack>
                    <Icon as={FaMapMarkerAlt} color="gray.500" />
                    <Box>
                      <Text fontWeight="medium">Location</Text>
                      <Text color="gray.600">{ticket.eventLocation}</Text>
                    </Box>
                  </HStack>
                </VStack>
              </Box>

              <Divider />

              <Box width="100%">
                <Text fontWeight="medium" mb={2}>
                  Ticket Information
                </Text>
                <VStack align="start" spacing={3}>
                  <HStack>
                    <Icon as={FaTicketAlt} color="gray.500" />
                    <Box>
                      <Text fontWeight="medium">Type</Text>
                      <Text color="gray.600">{ticket.ticketType}</Text>
                    </Box>
                  </HStack>

                  <HStack>
                    <Icon as={FaUser} color="gray.500" />
                    <Box>
                      <Text fontWeight="medium">Owner</Text>
                      <Text color="gray.600">
                        {ticket.ownerAddress
                          ? `${ticket.ownerAddress.substring(
                              0,
                              6
                            )}...${ticket.ownerAddress.substring(38)}`
                          : "You"}
                      </Text>
                    </Box>
                  </HStack>

                  <HStack>
                    <Icon as={FaLink} color="gray.500" />
                    <Box>
                      <Text fontWeight="medium">Token ID</Text>
                      <Text color="gray.600">
                        {ticket.tokenId || `NFT-${ticket.id.substring(0, 8)}`}
                      </Text>
                    </Box>
                  </HStack>

                  <HStack>
                    <Icon as={FaClock} color="gray.500" />
                    <Box>
                      <Text fontWeight="medium">Purchase Date</Text>
                      <Text color="gray.600">
                        {formatDate(ticket.purchaseDate)}
                      </Text>
                    </Box>
                  </HStack>
                </VStack>
              </Box>
            </VStack>
          </GridItem>

          <GridItem>
            <VStack spacing={4} align="center" justify="center" height="100%">
              {/* NFT Image */}
              <Box
                borderWidth="1px"
                borderRadius="lg"
                overflow="hidden"
                width="100%"
                maxW="300px"
              >
                <Image
                  src={nftImageUrl}
                  alt={`NFT for ${ticket.eventName} - ${ticket.ticketType}`}
                  width="100%"
                  height="200px"
                  objectFit="cover"
                  fallbackSrc="/assets/images/nft-preview.png"
                />
              </Box>

              {/* QR Code Section */}
              <Box
                borderWidth="1px"
                borderRadius="lg"
                p={6}
                bg={isActive ? "white" : "gray.100"}
                width="100%"
                textAlign="center"
              >
                {isActive ? (
                  <>
                    <Text fontWeight="medium" mb={4} color="green.700">
                      🎫 Show this QR to event staff for check-in
                    </Text>
                    <Flex justify="center">
                      <QRCode
                        ticketId={ticket.id}
                        eventId={ticket.eventId}
                        size={180}
                      />
                    </Flex>
                    <VStack spacing={2} mt={3}>
                      <Text fontSize="sm" color="gray.600">
                        Token ID: {ticket.tokenId}
                      </Text>
                      <Text fontSize="xs" color="orange.600" fontWeight="medium">
                        🔒 For security: Do not share or screenshot this QR code
                      </Text>
                      <Text fontSize="xs" color="blue.600">
                        ✅ Staff-only scanner • Secure blockchain verification
                      </Text>
                    </VStack>
                  </>
                ) : (
                  <Text color="gray.600" py={8}>
                    This ticket is {ticket.status}.
                    {(ticket.status === "transferred" || ticket.status === "used" || ticket.status === "refunded") &&
                      " QR code is no longer valid."}
                  </Text>
                )}
              </Box>

              <VStack spacing={3} width="100%">
                {/* Public NFT View Button - Always visible */}
                <Button
                  leftIcon={<Icon as={FaLink} />}
                  colorScheme="blue"
                  variant="outline"
                  onClick={() => window.open(`/ticket/${ticket.tokenId}`, '_blank')}
                  width="100%"
                >
                  View Public NFT Page
                </Button>

                {/* Transfer & Resell buttons - Only for active tickets */}
                {isActive && (
                  <HStack spacing={4} width="100%">
                    <Button
                      leftIcon={<Icon as={FaExchangeAlt} />}
                      colorScheme="purple"
                      variant="outline"
                      onClick={onTransferOpen}
                      flex={1}
                    >
                      Transfer
                    </Button>
                    <Button
                      leftIcon={<Icon as={FaShoppingCart} />}
                      colorScheme="green"
                      onClick={onResellOpen}
                      flex={1}
                    >
                      Resell
                    </Button>
                  </HStack>
                )}
              </VStack>

              <Box
                borderWidth="1px"
                borderRadius="md"
                p={4}
                bg="blue.50"
                width="100%"
              >
                <Text fontSize="sm" color="blue.700">
                  This ticket is an NFT on the Lisk blockchain, ensuring
                  authenticity and preventing counterfeiting. You can transfer
                  it to another wallet or resell it through the marketplace.
                </Text>
              </Box>
            </VStack>
          </GridItem>
        </Grid>
      </Box>

      <TransferTicket
        isOpen={isTransferOpen}
        onClose={onTransferClose}
        ticket={ticket}
      />

      <ResellTicket
        isOpen={isResellOpen}
        onClose={onResellClose}
        ticket={ticket}
      />
    </>
  );
};

export default TicketDetails;
