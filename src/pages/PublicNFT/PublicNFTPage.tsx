import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Image,
  Badge,
  Icon,
  Grid,
  GridItem,
  Flex,
  Divider,
  Alert,
  AlertIcon,
  Button,
  useToast,
} from "@chakra-ui/react";
import {
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaTicketAlt,
  FaLink,
  FaUser,
  FaClock,
  FaExternalLinkAlt,
  FaShare,
} from "react-icons/fa";
import { useParams, useNavigate } from "react-router-dom";
import { QRCode } from "../../components/tickets/QRCode";
import { useSmartContract } from "../../hooks/useSmartContract";
import { Ticket } from "../../components/tickets/TicketCard";

export const PublicNFTPage: React.FC = () => {
  const { tokenId } = useParams<{ tokenId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  
  const { 
    getEventInfo,
    getTicketTiers,
    } = useSmartContract();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadNFTData = async () => {
      if (!tokenId) {
        setError("Invalid token ID");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Parse token ID to get event and tier info
        const tokenIdNum = parseInt(tokenId);
        if (tokenIdNum < 1000000000) {
          setError("Invalid token ID format");
          return;
        }

        const remaining = tokenIdNum - 1000000000;
        const parsedEventId = Math.floor(remaining / 1000000);
        const remainingAfterEvent = remaining % 1000000;
        const actualTierCode = Math.floor(remainingAfterEvent / 100000);
        const parsedTierCode = actualTierCode - 1;

        // Get event info and tiers
        const eventInfo = await getEventInfo();
        const tiers = await getTicketTiers();

        if (!eventInfo || !tiers) {
          setError("Could not load event information");
          return;
        }

        const tierData = tiers[parsedTierCode] || tiers[0];
        
        // Create ticket object for display
        const ticketData: Ticket = {
          id: `ticket-${tokenId}`,
          eventId: parsedEventId.toString(),
          eventName: eventInfo.name || "Unknown Event",
          eventDate: eventInfo.date ? new Date(Number(eventInfo.date) * 1000).toISOString() : new Date().toISOString(),
          eventLocation: eventInfo.venue || "Unknown Venue",
          ticketType: tierData?.name || `Tier ${parsedTierCode}`,
          price: tierData ? Number(tierData.price) / 1e18 : 0,
          currency: "IDRX",
          status: "valid", // Public view assumes valid
          purchaseDate: new Date().toISOString(), // Mock purchase date
          tokenId: tokenId,
          ownerAddress: "Public View"
        };

        setTicket(ticketData);
        
      } catch (err) {
        console.error("Error loading NFT data:", err);
        setError("Failed to load NFT information");
      } finally {
        setIsLoading(false);
      }
    };

    loadNFTData();
  }, [tokenId, getEventInfo, getTicketTiers]);

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

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${ticket?.eventName} - NFT Ticket`,
          text: `Check out this NFT ticket for ${ticket?.eventName}!`,
          url: url,
        });
      } catch (err) {
        // User cancelled share
      }
    } else {
      // Fallback - copy to clipboard
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied!",
        description: "The NFT link has been copied to your clipboard",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (isLoading) {
    return null;
  }

  if (error || !ticket) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <VStack align="start">
            <Text fontWeight="medium">
              {error || "NFT not found"}
            </Text>
            <Button
              size="sm"
              colorScheme="purple"
              onClick={() => navigate("/")}
            >
              Back to Home
            </Button>
          </VStack>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxW="container.sm" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <HStack justify="space-between" align="start">
          <Box>
            <Heading size="lg">NFT Ticket</Heading>
            <Text color="gray.600">
              Public view for Token ID: {tokenId}
            </Text>
          </Box>
          
          <HStack spacing={3}>
            <Button
              leftIcon={<Icon as={FaShare} />}
              colorScheme="purple"
              variant="outline"
              size="sm"
              onClick={handleShare}
            >
              Share
            </Button>
            <Button
              leftIcon={<Icon as={FaExternalLinkAlt} />}
              colorScheme="blue"
              size="sm"
              onClick={() => window.open(`https://sepolia-blockscout.lisk.com/token/0x7076657b501EDA89f43682df965bE50eD209F5A5/instance/${tokenId}`, '_blank')}
            >
              View on Explorer
            </Button>
          </HStack>
        </HStack>

        {/* Main Content */}
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
                  <Text fontWeight="medium">Lummy NFT Ticket</Text>
                </HStack>
                <Text fontSize="xl" fontWeight="bold">
                  {ticket.eventName}
                </Text>
              </Box>
              <Badge
                colorScheme="green"
                variant="solid"
                borderRadius="full"
                px={3}
                py={1}
                fontSize="md"
              >
                NFT
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
                    NFT Information
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
                      <Icon as={FaLink} color="gray.500" />
                      <Box>
                        <Text fontWeight="medium">Token ID</Text>
                        <Text color="gray.600">{ticket.tokenId}</Text>
                      </Box>
                    </HStack>

                    <HStack>
                      <Icon as={FaUser} color="gray.500" />
                      <Box>
                        <Text fontWeight="medium">Original Price</Text>
                        <Text color="gray.600">
                          {ticket.price} {ticket.currency}
                        </Text>
                      </Box>
                    </HStack>
                  </VStack>
                </Box>
              </VStack>
            </GridItem>

            <GridItem>
              <VStack spacing={4} align="center" justify="center" height="100%">
                {/* NFT Image - 1:1 aspect ratio */}
                <Box
                  borderWidth="1px"
                  borderRadius="lg"
                  overflow="hidden"
                  width="100%"
                  maxW="200px"
                  aspectRatio="1/1"
                >
                  <Image
                    src="/assets/images/nft-preview.png"
                    alt={`NFT for ${ticket.eventName}`}
                    width="100%"
                    height="100%"
                    objectFit="cover"
                  />
                </Box>

                {/* QR Code Section */}
                <Box
                  borderWidth="1px"
                  borderRadius="lg"
                  p={6}
                  bg="white"
                  width="100%"
                  textAlign="center"
                >
                  <Text fontWeight="medium" mb={4}>
                    Blockchain Verification QR
                  </Text>
                  <Flex justify="center">
                    <QRCode
                      ticketId={ticket.id}
                      eventId={ticket.eventId}
                      size={180}
                    />
                  </Flex>
                  <Text fontSize="sm" color="gray.600" mt={2}>
                    Token ID: {ticket.tokenId}
                  </Text>
                </Box>

                <Box
                  borderWidth="1px"
                  borderRadius="md"
                  p={4}
                  bg="blue.50"
                  width="100%"
                >
                  <Text fontSize="sm" color="blue.700">
                    This ticket is an NFT on the Lisk blockchain, ensuring
                    authenticity and preventing counterfeiting.
                  </Text>
                </Box>
              </VStack>
            </GridItem>
          </Grid>
        </Box>
      </VStack>
    </Container>
  );
};

export default PublicNFTPage;