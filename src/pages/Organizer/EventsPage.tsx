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
    algorithm: "algorithm1" as const,
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
    algorithm: "algorithm2" as const,
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
    algorithm: "algorithm3" as const,
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

const getAlgorithmBadge = (algorithm: string) => {
  switch (algorithm) {
    case "algorithm1":
      return { label: "Algorithm 1", color: "blue" };
    case "algorithm2": 
      return { label: "Algorithm 2", color: "green" };
    case "algorithm3":
      return { label: "Algorithm 3", color: "purple" };
    default:
      return { label: "Default", color: "gray" };
  }
};

const EventsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  
  const cardBg = "white";

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
  const filteredEvents = mockEvents.filter((event) => {
    const matchesSearch = event.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.venue.toLowerCase().includes(searchTerm.toLowerCase());
    
    const status = getEventStatus(event.daysUntilEvent);
    const matchesStatus = statusFilter === "all" || status.toLowerCase() === statusFilter;
    
    const matchesCategory = categoryFilter === "all" || event.category.toLowerCase() === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const renderEventCard = (event: typeof mockEvents[0]) => {
    const status = getEventStatus(event.daysUntilEvent);
    const algorithmBadge = getAlgorithmBadge(event.algorithm);
    
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
                <Badge colorScheme={algorithmBadge.color}>{algorithmBadge.label}</Badge>
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
              Showing {filteredEvents.length} of {mockEvents.length} events
            </Text>
            <Text>
              Total Revenue: IDRX {mockEvents.reduce((sum, event) => sum + event.revenue, 0).toLocaleString()}
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