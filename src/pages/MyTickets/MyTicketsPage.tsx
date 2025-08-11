import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Flex,
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
import { useSmartContract } from "../../hooks/useSmartContract";
import { useAccount } from "wagmi";
import { DEVELOPMENT_CONFIG, CONTRACT_ADDRESSES } from "../../constants";

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
 * Converts NFT metadata to Ticket interface format
 * Note: Metadata is now auto-populated by contract, so fallbacks should rarely be needed
 */
const convertNFTToTicket = (nft: any): Ticket => {
  return {
    id: `ticket-${nft.tokenId.toString()}`,
    eventId: nft.eventId.toString(),
    eventName: nft.eventName || "Unknown Event", // Contract auto-populates, fallback for safety
    eventDate: nft.eventDate ? new Date(Number(nft.eventDate) * 1000).toISOString() : new Date().toISOString(),
    eventLocation: nft.eventVenue || "Unknown Venue", // Contract auto-populates, fallback for safety
    ticketType: nft.tierName || `Tier ${nft.tierId.toString()}`, // Contract auto-populates, fallback for safety
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
  
  // Smart contract hooks
  const { 
    getUserTicketNFTs,
    loading 
  } = useSmartContract();

  // State
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [usingMockData, setUsingMockData] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Load user's ticket NFTs on component mount
  useEffect(() => {
    const loadUserTickets = async () => {
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

      setIsLoadingTickets(true);
      
      try {
        console.log("🎫 Loading user's ticket NFTs...");
        
        // Get user's NFT tickets with auto-populated metadata
        console.log("📞 Calling getUserTicketNFTs for address:", address);
        const userNFTs = await getUserTicketNFTs();
        console.log("📦 getUserTicketNFTs returned:", userNFTs.length, "NFTs with complete metadata");
        
        if (userNFTs.length === 0) {
          console.log("🔍 Debug info:");
          console.log("- Contract address:", CONTRACT_ADDRESSES.DiamondLummy);
          console.log("- User address:", address);
          console.log("- Blockchain enabled:", DEVELOPMENT_CONFIG.ENABLE_BLOCKCHAIN);
        }
        
        if (userNFTs.length === 0) {
          console.log("No NFT tickets found");
          setTickets([]);
          setFilteredTickets([]);
          setUsingMockData(false);
          setIsLoadingTickets(false); // Explicitly set loading to false
          return;
        }

        // Convert NFT metadata to Ticket format - metadata now auto-populated by contract
        const convertedTickets: Ticket[] = userNFTs.map(nft => {
          // Direct conversion - no workaround needed since contract auto-populates metadata
          const ticket = convertNFTToTicket(nft);
          console.log("✅ NFT to ticket (auto-populated metadata):", ticket);
          return ticket;
        });

        setTickets(convertedTickets);
        setFilteredTickets(convertedTickets);
        setUsingMockData(false);
        
        console.log("✅ Loaded", convertedTickets.length, "ticket(s)");
        console.log("🏁 Setting isLoadingTickets to false in success case");
        
      } catch (err) {
        console.error("Error loading user tickets:", err);
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
      } finally {
        setIsLoadingTickets(false);
      }
    };

    loadUserTickets();
  }, [isConnected, address, toast]); // Remove getUserTicketNFTs from dependency to prevent infinite loops

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


  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Flex justify="space-between" align="center" mb={0}>
          <Box>
            <Heading size="lg">My Tickets</Heading>
            <Text color="gray.600">
              {usingMockData ? "Demo tickets (connect wallet for real NFTs)" : "Your blockchain NFT tickets"}
            </Text>
          </Box>

          <HStack spacing={4}>
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
        </Flex>

        {/* Loading State */}
        {(isLoadingTickets || loading) && (
          <Box textAlign="center" py={10}>
            <Spinner size="xl" color="purple.500" />
            <Text mt={4} color="gray.600">Loading your NFT tickets...</Text>
          </Box>
        )}

        {/* Status Messages */}

        {!isLoadingTickets && !loading && !usingMockData && tickets.length === 0 && isConnected && (
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

        {!isLoadingTickets && !loading && (
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
