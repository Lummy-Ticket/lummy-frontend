import React, { useState } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Icon,
  useColorModeValue,
  Input,
  Select,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Divider,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useToast,
} from "@chakra-ui/react";
import {
  MdVisibility,
  MdCancel,
  MdBlock,
  MdSearch,
  MdFilterList,
} from "react-icons/md";

interface Event {
  id: number;
  name: string;
  organizer: string;
  organizerAddress: string;
  date: string;
  venue: string;
  ticketsSold: number;
  totalTickets: number;
  revenue: string;
  platformFee: string;
  status: "active" | "completed" | "cancelled" | "suspended";
  createdAt: string;
  categories: string[];
}

const AdminEventManagement: React.FC = () => {
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const toast = useToast();

  // Modal states
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();
  const { isOpen: isCancelOpen, onOpen: onCancelOpen, onClose: onCancelClose } = useDisclosure();
  const { isOpen: isSuspendOpen, onOpen: onSuspendOpen, onClose: onSuspendClose } = useDisclosure();

  // States
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Mock data synchronized with customer events - in real app this would come from smart contracts
  const events: Event[] = [
    {
      id: 1,
      name: "Summer Music Festival",
      organizer: "EventMaster Indonesia",
      organizerAddress: "0x1234...5678",
      date: "2025-06-15",
      venue: "Jakarta Convention Center Main Arena",
      ticketsSold: 50,
      totalTickets: 500,
      revenue: "15,000,000",
      platformFee: "150,000",
      status: "active",
      createdAt: "2025-01-10",
      categories: ["Music", "Festival"]
    },
    {
      id: 2,
      name: "Tech Conference 2025",
      organizer: "TechTalks ID", 
      organizerAddress: "0xabcd...efgh",
      date: "2025-07-25",
      venue: "Digital Hub Conference Center",
      ticketsSold: 250,
      totalTickets: 300,
      revenue: "42,500,000",
      platformFee: "425,000",
      status: "active",
      createdAt: "2024-12-15",
      categories: ["Technology", "Conference"]
    },
    {
      id: 3,
      name: "Blockchain Workshop",
      organizer: "Blockchain Indonesia",
      organizerAddress: "0xfed0...ba09",
      date: "2025-08-10",
      venue: "Blockchain Center Jakarta",
      ticketsSold: 20,
      totalTickets: 100,
      revenue: "2,000,000",
      platformFee: "20,000",
      status: "active",
      createdAt: "2024-12-20",
      categories: ["Blockchain", "Workshop"]
    },
    {
      id: 4,
      name: "Rock Concert: Thunder Night",
      organizer: "RockFest Indonesia",
      organizerAddress: "0x9876...5432",
      date: "2025-09-20",
      venue: "Gelora Bung Karno Main Stadium",
      ticketsSold: 0,
      totalTickets: 800,
      revenue: "0",
      platformFee: "0",
      status: "active",
      createdAt: "2025-01-15",
      categories: ["Music", "Concert"]
    }
  ];

  // Filter events based on search and status
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.organizer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || event.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const stats = {
    totalEvents: events.length,
    activeEvents: events.filter(e => e.status === "active").length,
    completedEvents: events.filter(e => e.status === "completed").length,
    totalRevenue: events.reduce((sum, e) => sum + parseInt(e.revenue.replace(/,/g, "")), 0),
    totalPlatformFees: events.reduce((sum, e) => sum + parseInt(e.platformFee.replace(/,/g, "")), 0)
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "green";
      case "completed": return "blue";
      case "cancelled": return "red";
      case "suspended": return "orange";
      default: return "gray";
    }
  };

  const handleViewDetails = (event: Event) => {
    setSelectedEvent(event);
    onDetailOpen();
  };

  const handleCancelEvent = (event: Event) => {
    setSelectedEvent(event);
    onCancelOpen();
  };

  const handleSuspendEvent = (event: Event) => {
    setSelectedEvent(event);
    onSuspendOpen();
  };

  const confirmCancelEvent = () => {
    // In real app, this would call smart contract function
    toast({
      title: "Event Cancelled",
      description: `${selectedEvent?.name} has been cancelled and refunds will be processed.`,
      status: "success",
      duration: 5000,
      isClosable: true,
    });
    onCancelClose();
  };

  const confirmSuspendEvent = () => {
    // In real app, this would call smart contract function
    toast({
      title: "Event Suspended",
      description: `${selectedEvent?.name} has been temporarily suspended.`,
      status: "warning",
      duration: 5000,
      isClosable: true,
    });
    onSuspendClose();
  };

  const cancelRef = React.useRef<any>(null);

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="lg">Event Management</Heading>
          <Text color="gray.600">
            Manage and monitor all events on the Lummy platform
          </Text>
        </Box>

        {/* Statistics */}
        <SimpleGrid columns={{ base: 2, md: 5 }} spacing={4}>
          <Stat bg={cardBg} p={4} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
            <StatLabel>Total Events</StatLabel>
            <StatNumber>{stats.totalEvents}</StatNumber>
          </Stat>
          <Stat bg={cardBg} p={4} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
            <StatLabel>Active Events</StatLabel>
            <StatNumber color="green.500">{stats.activeEvents}</StatNumber>
          </Stat>
          <Stat bg={cardBg} p={4} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
            <StatLabel>Completed</StatLabel>
            <StatNumber color="blue.500">{stats.completedEvents}</StatNumber>
          </Stat>
          <Stat bg={cardBg} p={4} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
            <StatLabel>Total Revenue</StatLabel>
            <StatNumber fontSize="md">IDR {stats.totalRevenue.toLocaleString()}</StatNumber>
          </Stat>
          <Stat bg={cardBg} p={4} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
            <StatLabel>Platform Fees</StatLabel>
            <StatNumber fontSize="md">IDR {stats.totalPlatformFees.toLocaleString()}</StatNumber>
          </Stat>
        </SimpleGrid>

        {/* Filters */}
        <Box bg={cardBg} p={6} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
          <HStack spacing={4}>
            <Box flex="1">
              <HStack>
                <Icon as={MdSearch} color="gray.400" />
                <Input
                  placeholder="Search events or organizers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  variant="unstyled"
                />
              </HStack>
            </Box>
            <HStack>
              <Icon as={MdFilterList} color="gray.400" />
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                w="200px"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="suspended">Suspended</option>
              </Select>
            </HStack>
          </HStack>
        </Box>

        {/* Events Table */}
        <Box bg={cardBg} borderRadius="lg" borderWidth="1px" borderColor={borderColor} overflow="hidden">
          <Table variant="simple">
            <Thead bg="gray.50">
              <Tr>
                <Th>Event Details</Th>
                <Th>Organizer</Th>
                <Th>Date & Venue</Th>
                <Th>Tickets</Th>
                <Th>Revenue</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredEvents.map((event) => (
                <Tr key={event.id}>
                  <Td>
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="medium">{event.name}</Text>
                      <HStack>
                        {event.categories.map((category) => (
                          <Badge key={category} size="sm" colorScheme="gray">
                            {category}
                          </Badge>
                        ))}
                      </HStack>
                    </VStack>
                  </Td>
                  <Td>
                    <VStack align="start" spacing={1}>
                      <Text fontSize="sm">{event.organizer}</Text>
                      <Text fontSize="xs" color="gray.500" fontFamily="monospace">
                        {event.organizerAddress}
                      </Text>
                    </VStack>
                  </Td>
                  <Td>
                    <VStack align="start" spacing={1}>
                      <Text fontSize="sm">{event.date}</Text>
                      <Text fontSize="xs" color="gray.500">{event.venue}</Text>
                    </VStack>
                  </Td>
                  <Td>
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="medium">
                        {event.ticketsSold.toLocaleString()}/{event.totalTickets.toLocaleString()}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {Math.round((event.ticketsSold / event.totalTickets) * 100)}% sold
                      </Text>
                    </VStack>
                  </Td>
                  <Td>
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="medium">IDR {event.revenue}</Text>
                      <Text fontSize="xs" color="purple.500">
                        Fee: IDR {event.platformFee}
                      </Text>
                    </VStack>
                  </Td>
                  <Td>
                    <Badge colorScheme={getStatusColor(event.status)} size="sm">
                      {event.status}
                    </Badge>
                  </Td>
                  <Td>
                    <HStack spacing={2}>
                      <Button
                        size="xs"
                        leftIcon={<Icon as={MdVisibility} />}
                        onClick={() => handleViewDetails(event)}
                      >
                        View
                      </Button>
                      {event.status === "active" && (
                        <>
                          <Button
                            size="xs"
                            colorScheme="orange"
                            leftIcon={<Icon as={MdBlock} />}
                            onClick={() => handleSuspendEvent(event)}
                          >
                            Suspend
                          </Button>
                          <Button
                            size="xs"
                            colorScheme="red"
                            leftIcon={<Icon as={MdCancel} />}
                            onClick={() => handleCancelEvent(event)}
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </VStack>

      {/* Event Details Modal */}
      <Modal isOpen={isDetailOpen} onClose={onDetailClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Event Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedEvent && (
              <VStack spacing={4} align="stretch">
                <SimpleGrid columns={2} spacing={4}>
                  <Box>
                    <Text fontSize="sm" color="gray.500">Event Name</Text>
                    <Text fontWeight="medium">{selectedEvent.name}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.500">Status</Text>
                    <Badge colorScheme={getStatusColor(selectedEvent.status)}>
                      {selectedEvent.status}
                    </Badge>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.500">Organizer</Text>
                    <Text>{selectedEvent.organizer}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.500">Organizer Address</Text>
                    <Text fontFamily="monospace" fontSize="sm">{selectedEvent.organizerAddress}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.500">Event Date</Text>
                    <Text>{selectedEvent.date}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.500">Venue</Text>
                    <Text>{selectedEvent.venue}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.500">Tickets Sold</Text>
                    <Text>{selectedEvent.ticketsSold.toLocaleString()} / {selectedEvent.totalTickets.toLocaleString()}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.500">Revenue</Text>
                    <Text>IDR {selectedEvent.revenue}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.500">Platform Fee (1%)</Text>
                    <Text color="purple.500">IDR {selectedEvent.platformFee}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.500">Created</Text>
                    <Text>{selectedEvent.createdAt}</Text>
                  </Box>
                </SimpleGrid>
                <Divider />
                <Box>
                  <Text fontSize="sm" color="gray.500" mb={2}>Categories</Text>
                  <HStack>
                    {selectedEvent.categories.map((category) => (
                      <Badge key={category} colorScheme="blue">{category}</Badge>
                    ))}
                  </HStack>
                </Box>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Cancel Event Dialog */}
      <AlertDialog
        isOpen={isCancelOpen}
        leastDestructiveRef={cancelRef}
        onClose={onCancelClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Cancel Event
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to cancel "{selectedEvent?.name}"? This action will:
              <br />• Stop all ticket sales immediately
              <br />• Process automatic refunds to all ticket holders
              <br />• Cannot be undone
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onCancelClose}>
                Keep Event
              </Button>
              <Button colorScheme="red" onClick={confirmCancelEvent} ml={3}>
                Cancel Event
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Suspend Event Dialog */}
      <AlertDialog
        isOpen={isSuspendOpen}
        leastDestructiveRef={cancelRef}
        onClose={onSuspendClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Suspend Event
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to suspend "{selectedEvent?.name}"? This action will:
              <br />• Temporarily stop all ticket sales
              <br />• Hide the event from public listings
              <br />• Can be reversed by contacting the organizer
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onSuspendClose}>
                Cancel
              </Button>
              <Button colorScheme="orange" onClick={confirmSuspendEvent} ml={3}>
                Suspend Event
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Container>
  );
};

export default AdminEventManagement;