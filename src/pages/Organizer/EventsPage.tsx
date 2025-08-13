import React, { useState } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  SimpleGrid,
  HStack,
  Icon,
  Badge,
  Flex,
  Select,
  VStack,
  Input,
  InputGroup,
  InputLeftElement,
} from "@chakra-ui/react";
import { AddIcon, CalendarIcon, SearchIcon } from "@chakra-ui/icons";
import { FaTicketAlt, FaUserCheck } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useSmartContract } from "../../hooks/useSmartContract";
import { DEVELOPMENT_CONFIG } from "../../constants";
import { useEffect } from "react";

// Mock Events Data (reusing from dashboard)
const mockEvents = [
  {
    eventId: "1",
    eventName: "Summer Music Festival",
    ticketsSold: 450,
    totalTickets: 500,
    revenue: 22500,
    currency: "IDRX",
    date: "2025-06-15",
    venue: "Jakarta Convention Center",
    category: "Music",
    daysUntilEvent: 45,
    ticketingSystem: "Diamond Pattern" as const,
  },
  {
    eventId: "2", 
    eventName: "Tech Conference 2025",
    ticketsSold: 280,
    totalTickets: 400,
    revenue: 42000,
    currency: "IDRX", 
    date: "2025-07-25",
    venue: "Digital Hub Bandung",
    category: "Technology",
    daysUntilEvent: 5,
    ticketingSystem: "Diamond Pattern" as const,
  },
  {
    eventId: "3",
    eventName: "Blockchain Workshop", 
    ticketsSold: 75,
    totalTickets: 100,
    revenue: 7500,
    currency: "IDRX",
    date: "2025-08-10", 
    venue: "Blockchain Center Jakarta",
    category: "Workshop",
    daysUntilEvent: -2,
    ticketingSystem: "Diamond Pattern" as const,
  },
];

// Helper Functions
const getEventStatus = (daysUntilEvent: number) => {
  if (daysUntilEvent > 0) return "Upcoming";
  if (daysUntilEvent === 0) return "Ongoing";
  return "Completed";
};

const getBadgeColor = (status: string) => {
  switch (status) {
    case "Upcoming":
      return "green";
    case "Ongoing":
      return "orange";
    case "Completed":
      return "gray";
    default:
      return "blue";
  }
};

const getTicketingSystemBadge = () => {
  return { label: "Diamond Pattern", color: "purple" };
};

const EventsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [events, setEvents] = useState(mockEvents);
  
  const { getEventInfo, getTicketTiers } = useSmartContract();
  const cardBg = "white";

  // Load blockchain event if enabled
  useEffect(() => {
    if (DEVELOPMENT_CONFIG.ENABLE_BLOCKCHAIN) {
      loadBlockchainEvent();
    }
  }, []);

  const loadBlockchainEvent = async () => {
    try {
      const eventInfo = await getEventInfo();
      
      if (eventInfo && eventInfo.name && eventInfo.name !== "") {
        // Convert blockchain event to UI format
        const blockchainEvent = {
          eventId: "blockchain-1",
          eventName: eventInfo.name,
          ticketsSold: 0, // Will be updated
          totalTickets: 0, // Will be updated
          revenue: 0,
          currency: "IDRX",
          date: new Date(Number(eventInfo.date) * 1000).toISOString().split('T')[0],
          venue: eventInfo.venue || "Venue TBD",
          category: "Blockchain",
          daysUntilEvent: Math.ceil((Number(eventInfo.date) * 1000 - Date.now()) / (1000 * 60 * 60 * 24)),
          ticketingSystem: "Diamond Pattern" as const,
        };

        // Try to get ticket tiers for real data
        try {
          const tiers = await getTicketTiers();
          if (tiers && tiers.length > 0) {
            blockchainEvent.totalTickets = tiers.reduce((sum, tier) => sum + Number(tier.available) + Number(tier.sold), 0);
            blockchainEvent.ticketsSold = tiers.reduce((sum, tier) => sum + Number(tier.sold), 0);
            // Calculate revenue properly (tier.price already in wei, convert to IDRX)
            blockchainEvent.revenue = tiers.reduce((sum, tier) => sum + (Number(tier.sold) * Number(tier.price) / 1e18), 0);
            
            if (DEVELOPMENT_CONFIG.LOG_CONTRACT_CALLS) {
              console.log('✅ Loaded real blockchain data:', {
                eventName: blockchainEvent.eventName,
                totalTickets: blockchainEvent.totalTickets,
                ticketsSold: blockchainEvent.ticketsSold,
                revenue: blockchainEvent.revenue,
                tiers: tiers.length
              });
            }
          } else {
            if (DEVELOPMENT_CONFIG.LOG_CONTRACT_CALLS) {
              console.log('⚠️ No tiers found, using 0 values');
            }
          }
        } catch (tierError) {
          if (DEVELOPMENT_CONFIG.LOG_CONTRACT_CALLS) {
            console.log("Could not load tiers:", tierError);
          }
        }

        // Replace mock events with blockchain event
        setEvents([blockchainEvent]);
        
        if (DEVELOPMENT_CONFIG.LOG_CONTRACT_CALLS) {
          console.log("✅ Organizer Events: Loaded blockchain event", blockchainEvent.eventName);
        }
      } else {
        if (DEVELOPMENT_CONFIG.LOG_CONTRACT_CALLS) {
          console.log("⚠️ No blockchain event found, using mock data");
        }
      }
    } catch (error) {
      if (DEVELOPMENT_CONFIG.LOG_CONTRACT_CALLS) {
        console.log("❌ Blockchain load failed, using mock events:", error);
      }
    }
  };

  const handleCreateEvent = () => {
    navigate("/organizer/events/create");
  };

  const handleManageEvent = (eventId: string) => {
    navigate(`/organizer/events/${eventId}`);
  };

  const handleCheckIn = (eventId: string) => {
    navigate(`/organizer/events/${eventId}/check-in`);
  };

  // Filter events based on search and filters
  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.venue.toLowerCase().includes(searchTerm.toLowerCase());
    
    const status = getEventStatus(event.daysUntilEvent);
    const matchesStatus = statusFilter === "all" || status.toLowerCase() === statusFilter;
    
    const matchesCategory = categoryFilter === "all" || event.category.toLowerCase() === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const renderEventCard = (event: typeof mockEvents[0]) => {
    const status = getEventStatus(event.daysUntilEvent);
    const ticketingSystemBadge = getTicketingSystemBadge();
    
    return (
      <Box
        key={event.eventId}
        p={6}
        borderWidth="1px"
        borderRadius="lg"
        bg={cardBg}
        shadow="sm"
        cursor="pointer"
        transition="all 0.2s"
        _hover={{
          shadow: "md",
          transform: "translateY(-2px)",
        }}
        onClick={() => handleManageEvent(event.eventId)}
      >
        <VStack align="stretch" spacing={4}>
          {/* Header with badges */}
          <Flex justify="space-between" align="flex-start">
            <VStack align="start" spacing={2} flex="1">
              <Heading size="md" noOfLines={1}>
                {event.eventName}
              </Heading>
              <HStack spacing={2}>
                <Badge colorScheme={getBadgeColor(status)}>{status}</Badge>
                <Badge colorScheme={ticketingSystemBadge.color}>{ticketingSystemBadge.label}</Badge>
              </HStack>
            </VStack>
          </Flex>

          {/* Event Details */}
          <VStack align="stretch" spacing={2}>
            <HStack color="gray.600">
              <Icon as={CalendarIcon} />
              <Text fontSize="sm">{new Date(event.date).toLocaleDateString()}</Text>
              <Text fontSize="sm">•</Text>
              <Text fontSize="sm" noOfLines={1}>{event.venue}</Text>
            </HStack>
            
            <HStack color="gray.600">
              <Icon as={FaTicketAlt} />
              <Text fontSize="sm">
                {event.ticketsSold} / {event.totalTickets} sold
              </Text>
              <Text fontSize="sm">•</Text>
              <Text fontSize="sm" fontWeight="medium" color="green.600">
                {event.currency} {event.revenue.toLocaleString()}
              </Text>
            </HStack>
          </VStack>

          {/* Actions */}
          <HStack spacing={2} pt={2}>
            <Button
              colorScheme="blue"
              variant="outline"
              size="sm"
              leftIcon={<Icon as={FaUserCheck} />}
              onClick={(e) => {
                e.stopPropagation();
                handleCheckIn(event.eventId);
              }}
              flex="1"
            >
              Check-in
            </Button>
            <Button
              colorScheme="purple"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleManageEvent(event.eventId);
              }}
              flex="1"
            >
              Manage
            </Button>
          </HStack>
        </VStack>
      </Box>
    );
  };

  return (
    <Container maxW="container.xl" py={8}>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={8}>
        <Box>
          <Heading size="lg">My Events</Heading>
          <Text color="gray.600">Manage and track all your events</Text>
        </Box>
        <Button
          colorScheme="purple"
          leftIcon={<AddIcon />}
          onClick={handleCreateEvent}
        >
          Create Event
        </Button>
      </Flex>

      {/* Filters */}
      <Box
        p={6}
        borderWidth="1px"
        borderRadius="lg"
        bg={cardBg}
        mb={6}
      >
        <VStack spacing={4}>
          <HStack spacing={4} width="full">
            <InputGroup flex="2">
              <InputLeftElement>
                <SearchIcon color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Search events by name or venue..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
            
            <Select
              flex="1"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </Select>
            
            <Select
              flex="1"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="music">Music</option>
              <option value="technology">Technology</option>
              <option value="workshop">Workshop</option>
            </Select>
          </HStack>
          
          <HStack justify="space-between" width="full" color="gray.600" fontSize="sm">
            <Text>
              Showing {filteredEvents.length} of {events.length} events
            </Text>
            <Text>
              Total Revenue: IDRX {events.reduce((sum, event) => sum + event.revenue, 0).toLocaleString()}
            </Text>
          </HStack>
        </VStack>
      </Box>

      {/* Events Grid */}
      {filteredEvents.length > 0 ? (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {filteredEvents.map(renderEventCard)}
        </SimpleGrid>
      ) : (
        <Box
          textAlign="center"
          py={12}
          borderWidth="1px"
          borderRadius="lg"
          bg={cardBg}
          borderStyle="dashed"
        >
          <Heading size="md" color="gray.500" mb={2}>
            No events found
          </Heading>
          <Text color="gray.500" mb={4}>
            {searchTerm || statusFilter !== "all" || categoryFilter !== "all"
              ? "Try adjusting your filters or search terms"
              : "Create your first event to get started"}
          </Text>
          <Button colorScheme="purple" onClick={handleCreateEvent}>
            Create Event
          </Button>
        </Box>
      )}
    </Container>
  );
};

export default EventsPage;