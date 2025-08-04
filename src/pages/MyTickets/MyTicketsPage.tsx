import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Spinner,
  Alert,
  AlertIcon,
  useToast,
} from "@chakra-ui/react";
import { FaTicketAlt, FaSearch, FaCalendarAlt } from "react-icons/fa";
import { TicketCard, Ticket } from "../../components/tickets/TicketCard";
import { TicketDetails } from "../../components/tickets/TicketDetails";
import { useUserNFTsQuery } from "../../hooks/useContractQueries";
import { useSmartContract } from "../../hooks/useSmartContract";
import { useAccount } from "wagmi";
import { DEVELOPMENT_CONFIG } from "../../constants";

// Mock data for tickets
export const mockTickets: Ticket[] = [
  {
    id: "ticket-1",
    eventId: "event-1",
    eventName: "Summer Music Festival",
    eventDate: "2025-06-15T12:00:00",
    eventLocation: "Jakarta Convention Center",
    ticketType: "VIP Pass",
    price: 500,
    currency: "IDRX",
    status: "valid",
    purchaseDate: "2025-03-15T09:48:23",
    tokenId: "NFT-12345678",
    ownerAddress: "0x1234567890abcdef1234567890abcdef12345678",
  },
  {
    id: "ticket-2",
    eventId: "event-2",
    eventName: "Tech Conference 2025",
    eventDate: "2025-07-25T09:00:00",
    eventLocation: "Digital Hub Bandung",
    ticketType: "Premium Access",
    price: 300,
    currency: "IDRX",
    status: "valid",
    purchaseDate: "2025-04-02T14:32:10",
    tokenId: "NFT-87654321",
    ownerAddress: "0x1234567890abcdef1234567890abcdef12345678",
  },
  {
    id: "ticket-3",
    eventId: "event-3",
    eventName: "Blockchain Workshop",
    eventDate: "2025-05-10T10:00:00",
    eventLocation: "Blockchain Center Jakarta",
    ticketType: "Workshop Ticket",
    price: 100,
    currency: "IDRX",
    status: "used",
    purchaseDate: "2025-04-28T16:42:39",
    tokenId: "NFT-23456789",
    ownerAddress: "0x1234567890abcdef1234567890abcdef12345678",
  },
  {
    id: "ticket-4",
    eventId: "event-4",
    eventName: "Art Exhibition: Future Visions",
    eventDate: "2025-06-05T11:00:00",
    eventLocation: "Modern Gallery Surabaya",
    ticketType: "Standard Entry",
    price: 75,
    currency: "IDRX",
    status: "refunded",
    purchaseDate: "2025-04-15T11:23:45",
    tokenId: "NFT-34567890",
    ownerAddress: "0x2345678901bcdef2345678901bcdef23456789",
  },
];

/**
 * Converts enhanced NFT metadata to Ticket interface format
 */
const convertNFTToTicket = (nft: any): Ticket => {
  return {
    id: `ticket-${nft.tokenId.toString()}`,
    eventId: nft.eventId.toString(),
    eventName: nft.eventName || "Unknown Event",
    eventDate: nft.eventDate ? new Date(Number(nft.eventDate) * 1000).toISOString() : new Date().toISOString(),
    eventLocation: nft.eventVenue || "Unknown Venue",
    ticketType: nft.tierName || `Tier ${nft.tierId.toString()}`,
    price: Number(nft.originalPrice) / 1e18, // Convert from Wei to IDRX
    currency: "IDRX",
    status: nft.used ? "used" : (nft.status === "valid" ? "valid" : nft.status || "valid"),
    purchaseDate: nft.purchaseDate ? new Date(Number(nft.purchaseDate) * 1000).toISOString() : new Date().toISOString(),
    tokenId: nft.tokenId.toString(),
    ownerAddress: nft.owner,
  };
};

export const MyTicketsPage: React.FC = () => {
  const { address, isConnected } = useAccount();
  const toast = useToast();
  
  // React Query hook for user NFTs with caching
  const userNFTsQuery = useUserNFTsQuery(address);
  
  // Smart contract hook for updateUserNFTsMetadata function
  const { updateUserNFTsMetadata } = useSmartContract();

  // State
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Derive loading state from query
  const isLoadingTickets = userNFTsQuery.isLoading;

  // Process user NFTs data when query completes
  useEffect(() => {
    if (!isConnected || !address) {
      console.log("Wallet not connected, using mock data");
      setTickets(mockTickets);
      setFilteredTickets(mockTickets);
      setUsingMockData(true);
      return;
    }

    if (!DEVELOPMENT_CONFIG.ENABLE_BLOCKCHAIN) {
      console.log("Blockchain disabled, using mock data");
      setTickets(mockTickets);
      setFilteredTickets(mockTickets);
      setUsingMockData(true);
      return;
    }

    if (userNFTsQuery.data) {
      const userNFTs = userNFTsQuery.data;
      
      if (userNFTs.length === 0) {
        console.log("No NFT tickets found");
        setTickets([]);
        setFilteredTickets([]);
        setUsingMockData(false);
        return;
      }

      // Convert NFT metadata to Ticket format (enhanced metadata has all info)
      const convertedTickets: Ticket[] = userNFTs.map(nft => {
        const ticket = convertNFTToTicket(nft);
        console.log("✅ Converted NFT to ticket:", ticket);
        return ticket;
      });

      setTickets(convertedTickets);
      setFilteredTickets(convertedTickets);
      setUsingMockData(false);
      
      console.log("✅ Loaded", convertedTickets.length, "ticket(s)");
    } else if (userNFTsQuery.isError) {
      console.error("Error loading user tickets:", userNFTsQuery.error);
      toast({
        title: "Error loading tickets",
        description: "Using demo data instead",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      
      // Fallback to mock data
      setTickets(mockTickets);
      setFilteredTickets(mockTickets);
      setUsingMockData(true);
    }
  }, [isConnected, address, userNFTsQuery.data, userNFTsQuery.isError, userNFTsQuery.error, toast]);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value.toLowerCase();
    setSearchQuery(query);

    if (query.trim() === "") {
      setFilteredTickets(tickets);
    } else {
      const filtered = tickets.filter(
        (ticket) =>
          ticket.eventName.toLowerCase().includes(query) ||
          ticket.ticketType.toLowerCase().includes(query) ||
          ticket.eventLocation.toLowerCase().includes(query)
      );
      setFilteredTickets(filtered);
    }
  };

  const handleShowDetails = (ticketId: string) => {
    const ticket = tickets.find((t) => t.id === ticketId);
    if (ticket) {
      setSelectedTicket(ticket);
      onOpen();
    }
  };

  const filterByStatus = (status: Ticket["status"] | "all") => {
    if (status === "all") {
      setFilteredTickets(tickets);
    } else {
      const filtered = tickets.filter((ticket) => ticket.status === status);
      setFilteredTickets(filtered);
    }
  };

  // Handle updating NFT metadata
  const handleUpdateMetadata = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Connect your wallet to update NFT metadata",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setUpdateLoading(true);
    
    try {
      toast({
        title: "Updating NFT metadata...",
        description: "This may take a few moments",
        status: "info",
        duration: 3000,
        isClosable: true,
      });

      const updatedCount = await updateUserNFTsMetadata();

      if (updatedCount > 0) {
        toast({
          title: "NFT metadata updated!",
          description: `Updated ${updatedCount} NFT(s) with enhanced metadata`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });

        // Reload tickets to show updated data
        window.location.reload();
      } else {
        toast({
          title: "No NFTs updated",
          description: "No NFTs found to update or metadata already current",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (err) {
      console.error("Error updating metadata:", err);
      toast({
        title: "Update failed",
        description: "Could not update NFT metadata",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setUpdateLoading(false);
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <HStack justify="space-between">
          <Box>
            <Heading size="lg">My Tickets</Heading>
            <Text color="gray.600">
              {usingMockData ? "Demo tickets (connect wallet for real NFTs)" : "Your blockchain NFT tickets"}
            </Text>
          </Box>

          <HStack spacing={4}>
            <Button
              colorScheme="purple"
              variant="outline"
              size="sm"
              onClick={handleUpdateMetadata}
              isLoading={updateLoading}
              isDisabled={!isConnected || usingMockData}
            >
              Update NFT Metadata
            </Button>
            
            <InputGroup maxW="300px">
              <InputLeftElement pointerEvents="none">
                <Icon as={FaSearch} color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={handleSearch}
              />
            </InputGroup>
          </HStack>
        </HStack>

        {/* Loading State */}
        {isLoadingTickets && (
          <Box textAlign="center" py={10}>
            <Spinner size="xl" color="purple.500" />
            <Text mt={4} color="gray.600">Loading your NFT tickets...</Text>
          </Box>
        )}

        {/* Status Messages */}
        {!isLoadingTickets && usingMockData && (
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <VStack align="start" spacing={1}>
              <Text fontWeight="medium" fontSize="sm">
                Demo Mode
              </Text>
              <Text fontSize="xs">
                Connect your wallet to view your real NFT tickets from the blockchain.
              </Text>
            </VStack>
          </Alert>
        )}

        {!isLoadingTickets && !usingMockData && tickets.length === 0 && isConnected && (
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <VStack align="start" spacing={1}>
              <Text fontWeight="medium" fontSize="sm">
                No NFT Tickets Found
              </Text>
              <Text fontSize="xs">
                Purchase tickets from events to see them here as NFTs.
              </Text>
            </VStack>
          </Alert>
        )}

        {!isLoadingTickets && (
          <Tabs colorScheme="purple" variant="enclosed">
          <TabList>
            <Tab onClick={() => filterByStatus("all")}>All Tickets</Tab>
            <Tab onClick={() => filterByStatus("valid")}>
              <HStack>
                <Icon as={FaTicketAlt} />
                <Text>Active</Text>
              </HStack>
            </Tab>
            <Tab onClick={() => filterByStatus("used")}>Used</Tab>
            <Tab onClick={() => filterByStatus("refunded")}>Refunded</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              {filteredTickets.length > 0 ? (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                  {filteredTickets.map((ticket) => (
                    <TicketCard
                      key={ticket.id}
                      ticket={ticket}
                      onShowDetails={handleShowDetails}
                    />
                  ))}
                </SimpleGrid>
              ) : (
                <Box textAlign="center" py={10}>
                  <Icon as={FaTicketAlt} boxSize={10} color="gray.300" />
                  <Text mt={4} color="gray.500">
                    No tickets found
                  </Text>
                </Box>
              )}
            </TabPanel>

            <TabPanel>
              {filteredTickets.length > 0 ? (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                  {filteredTickets.map((ticket) => (
                    <TicketCard
                      key={ticket.id}
                      ticket={ticket}
                      onShowDetails={handleShowDetails}
                    />
                  ))}
                </SimpleGrid>
              ) : (
                <Box textAlign="center" py={10}>
                  <Icon as={FaCalendarAlt} boxSize={10} color="gray.300" />
                  <Text mt={4} color="gray.500">
                    No active tickets
                  </Text>
                </Box>
              )}
            </TabPanel>

            {/* Used Tickets Tab */}
            <TabPanel>
              {filteredTickets.length > 0 ? (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                  {filteredTickets.map((ticket) => (
                    <TicketCard
                      key={ticket.id}
                      ticket={ticket}
                      onShowDetails={handleShowDetails}
                    />
                  ))}
                </SimpleGrid>
              ) : (
                <Box textAlign="center" py={10}>
                  <Icon as={FaTicketAlt} boxSize={10} color="gray.300" />
                  <Text mt={4} color="gray.500">
                    No used tickets
                  </Text>
                </Box>
              )}
            </TabPanel>

            {/* Refunded Tickets Tab */}
            <TabPanel>
              {filteredTickets.length > 0 ? (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                  {filteredTickets.map((ticket) => (
                    <TicketCard
                      key={ticket.id}
                      ticket={ticket}
                      onShowDetails={handleShowDetails}
                    />
                  ))}
                </SimpleGrid>
              ) : (
                <Box textAlign="center" py={10}>
                  <Icon as={FaTicketAlt} boxSize={10} color="gray.300" />
                  <Text mt={4} color="gray.500">
                    No refunded tickets
                  </Text>
                </Box>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
        )}
      </VStack>

      {/* Ticket Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Ticket Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedTicket && <TicketDetails ticket={selectedTicket} />}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default MyTicketsPage;
