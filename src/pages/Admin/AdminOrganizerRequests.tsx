import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  Flex,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  SimpleGrid,
  useToast,
  Textarea,
  IconButton,
  Alert,
  AlertIcon,
  useColorModeValue,
  Stat,
  StatLabel,
  StatNumber,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from "@chakra-ui/react";
import { 
  SearchIcon, 
  ViewIcon, 
  ChevronDownIcon,
  CheckIcon,
  CloseIcon,
} from "@chakra-ui/icons";

interface OrganizerRequest {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  organizerType: string;
  eventCategories: string[];
  experience: string;
  status: "pending" | "under_review" | "need_more_info" | "approved" | "rejected";
  submittedDate: string;
  lastUpdate: string;
  description: string;
  estimatedBudget: string;
  estimatedEventsPerYear: string;
  walletAddress?: string;
  website?: string;
  address: string;
  previousEvents?: string;
  references?: string;
}

// Enhanced mock data with Indonesian context
const mockRequests: OrganizerRequest[] = [
  {
    id: "org-req-001",
    fullName: "Jakarta Music Productions PT",
    email: "admin@jakartamusic.id",
    phone: "+62 821 1234 5678",
    organizerType: "PT",
    eventCategories: ["Music", "Art", "Entertainment"],
    experience: "5+ years",
    status: "pending",
    submittedDate: "2025-01-19T09:30:00",
    lastUpdate: "2025-01-19T09:30:00",
    description: "Established music production company specializing in large-scale concerts and music festivals across Indonesia. We have organized major events in Jakarta, Bandung, and Surabaya with attendance ranging from 5,000 to 50,000 people.",
    estimatedBudget: "500M+",
    estimatedEventsPerYear: "25+",
    walletAddress: "0x742d35Cc8639C9532EB738c1A7F5E2a4B23C8d91",
    website: "https://jakartamusic.id",
    address: "Jl. Sudirman Kav. 45, Jakarta Pusat, DKI Jakarta 10210",
    previousEvents: "Jakarta Music Festival 2024 (45k attendees), Rock in Solo 2024 (25k attendees), Jazz Night Series 2023-2024",
    references: "PT Venue Management Indonesia (+62 811 2233 4455), Bank BCA Event Financing Dept."
  },
  {
    id: "org-req-002", 
    fullName: "TechHub Indonesia",
    email: "organizer@techhub-id.com",
    phone: "+62 812 9876 5432",
    organizerType: "CV",
    eventCategories: ["Technology", "Education", "Conference"],
    experience: "3-5 years",
    status: "under_review",
    submittedDate: "2025-01-18T14:20:00",
    lastUpdate: "2025-01-19T10:15:00",
    description: "Leading technology event organizer focused on startup ecosystem, developer conferences, and innovation showcases. Strong network with tech companies and startup communities across Southeast Asia.",
    estimatedBudget: "100M - 500M",
    estimatedEventsPerYear: "13-24",
    walletAddress: "0x8f3Cf7ad23Cd3CaDbD9735AAF958023239c6A063", 
    website: "https://techhub-indonesia.com",
    address: "Jl. Gatot Subroto Kav. 18, Jakarta Selatan, DKI Jakarta 12950",
    previousEvents: "Startup Summit Jakarta 2024, DevFest Indonesia 2024, AI Innovation Conference 2023",
    references: "Google Developer Groups Jakarta, Microsoft Indonesia"
  },
  {
    id: "org-req-003",
    fullName: "Sarah Wijaya Creative Studio",
    email: "sarah.wijaya@creativestudio.id",
    phone: "+62 856 1111 2222", 
    organizerType: "Individual",
    eventCategories: ["Workshop", "Education", "Art"],
    experience: "1-3 years",
    status: "need_more_info",
    submittedDate: "2025-01-17T11:45:00",
    lastUpdate: "2025-01-18T16:30:00",
    description: "Individual creative entrepreneur specializing in art workshops, creative writing seminars, and cultural events. Focus on empowering young artists and building creative communities.",
    estimatedBudget: "10M - 50M",
    estimatedEventsPerYear: "6-12",
    walletAddress: "0xA0b86a33E6Fa7e1B7e62C4A8dBC3e8F1234567890",
    address: "Jl. Kemang Raya No. 125, Jakarta Selatan, DKI Jakarta 12560",
    previousEvents: "Creative Writing Workshop Series 2024, Young Artists Exhibition 2024",
  },
  {
    id: "org-req-004",
    fullName: "Bali Event Organizers",
    email: "contact@balievents.co.id",
    phone: "+62 361 123 4567",
    organizerType: "PT",
    eventCategories: ["Tourism", "Culture", "Food", "Music"],
    experience: "5+ years",
    status: "approved", 
    submittedDate: "2025-01-15T08:00:00",
    lastUpdate: "2025-01-16T14:20:00",
    description: "Premier event management company in Bali specializing in cultural festivals, culinary events, and tourism experiences. Strong partnerships with local government and tourism boards.",
    estimatedBudget: "100M - 500M",
    estimatedEventsPerYear: "13-24",
    walletAddress: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    website: "https://balievents.co.id",
    address: "Jl. Raya Seminyak No. 88, Badung, Bali 80361",
    previousEvents: "Bali Cultural Festival 2024, Ubud Food Festival 2024, Sunset Music Series 2023-2024",
    references: "Bali Tourism Board, Seminyak Village Management"
  },
  {
    id: "org-req-005",
    fullName: "Youth Community Jakarta",
    email: "admin@youthjakarta.org",
    phone: "+62 813 5555 6666",
    organizerType: "Komunitas",
    eventCategories: ["Education", "Social", "Sports"],
    experience: "1-3 years",
    status: "rejected",
    submittedDate: "2025-01-12T13:30:00",
    lastUpdate: "2025-01-14T09:45:00",
    description: "Non-profit youth organization focused on social impact events, educational programs, and community building activities for young people in Jakarta metropolitan area.",
    estimatedBudget: "< 10M",
    estimatedEventsPerYear: "6-12",
    walletAddress: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    address: "Jl. Cikini Raya No. 45, Jakarta Pusat, DKI Jakarta 10330",
    previousEvents: "Youth Leadership Summit 2024, Community Service Day 2024"
  }
];

const AdminOrganizerRequests: React.FC = () => {
  const [requests, setRequests] = useState<OrganizerRequest[]>(mockRequests);
  const [filteredRequests, setFilteredRequests] = useState<OrganizerRequest[]>(mockRequests);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<OrganizerRequest | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  // Filter requests
  useEffect(() => {
    let filtered = [...requests];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (req) =>
          req.fullName.toLowerCase().includes(query) ||
          req.email.toLowerCase().includes(query) ||
          req.organizerType.toLowerCase().includes(query) ||
          req.walletAddress?.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((req) => req.status === statusFilter);
    }

    setFilteredRequests(filtered);
  }, [requests, searchQuery, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "yellow";
      case "under_review": return "orange";
      case "need_more_info": return "blue";
      case "approved": return "green";
      case "rejected": return "red";
      default: return "gray";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return "Pending Review";
      case "under_review": return "Under Review";
      case "need_more_info": return "Need More Info";
      case "approved": return "Approved";
      case "rejected": return "Rejected";
      default: return status;
    }
  };

  const handleViewDetails = (request: OrganizerRequest) => {
    setSelectedRequest(request);
    setReviewNote("");
    onOpen();
  };

  const handleStatusUpdate = (newStatus: string) => {
    if (!selectedRequest) return;

    setRequests((prev) =>
      prev.map((req) =>
        req.id === selectedRequest.id
          ? { 
              ...req, 
              status: newStatus as any,
              lastUpdate: new Date().toISOString()
            }
          : req
      )
    );

    toast({
      title: "Status Updated",
      description: `Request ${selectedRequest.id} status changed to ${getStatusLabel(newStatus)}`,
      status: "success",
      duration: 3000,
      isClosable: true,
    });

    onClose();
  };

  const handleBulkAction = (action: string) => {
    const pendingCount = filteredRequests.filter(r => r.status === "pending").length;
    
    if (action === "approve_all_pending") {
      setRequests(prev => 
        prev.map(req => 
          req.status === "pending" 
            ? { ...req, status: "approved", lastUpdate: new Date().toISOString() }
            : req
        )
      );
      toast({
        title: "Bulk Action Completed",
        description: `${pendingCount} pending requests approved`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short", 
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStats = () => {
    const total = requests.length;
    const pending = requests.filter(r => r.status === "pending").length;
    const approved = requests.filter(r => r.status === "approved").length;
    const rejected = requests.filter(r => r.status === "rejected").length;
    
    return { total, pending, approved, rejected };
  };

  const stats = getStats();

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="lg">
            Organizer Requests
          </Heading>
          <Text color="gray.600">
            Review and manage organizer applications and wallet whitelisting requests
          </Text>
        </Box>

      {/* Stats */}
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
        <Stat
          bg={cardBg}
          p={4}
          borderRadius="md"
          borderWidth="1px"
          borderColor={borderColor}
        >
          <StatLabel fontSize="sm">Total Requests</StatLabel>
          <StatNumber color="blue.600">{stats.total}</StatNumber>
        </Stat>
        <Stat
          bg={cardBg}
          p={4}
          borderRadius="md"
          borderWidth="1px"
          borderColor={borderColor}
        >
          <StatLabel fontSize="sm">Pending</StatLabel>
          <StatNumber color="yellow.600">{stats.pending}</StatNumber>
        </Stat>
        <Stat
          bg={cardBg}
          p={4}
          borderRadius="md"
          borderWidth="1px"
          borderColor={borderColor}
        >
          <StatLabel fontSize="sm">Approved</StatLabel>
          <StatNumber color="green.600">{stats.approved}</StatNumber>
        </Stat>
        <Stat
          bg={cardBg}
          p={4}
          borderRadius="md"
          borderWidth="1px"
          borderColor={borderColor}
        >
          <StatLabel fontSize="sm">Rejected</StatLabel>
          <StatNumber color="red.600">{stats.rejected}</StatNumber>
        </Stat>
      </SimpleGrid>

      {/* Filters and Actions */}
      <Flex 
        gap={4} 
        direction={{ base: "column", md: "row" }}
        justify="space-between"
      >
        <Flex gap={4} direction={{ base: "column", sm: "row" }} flex="1">
          <InputGroup maxW="400px">
            <InputLeftElement>
              <SearchIcon color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Search by name, email, wallet address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </InputGroup>

          <Select
            maxW="200px"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
            <option value="need_more_info">Need More Info</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </Select>
        </Flex>

        <Menu>
          <MenuButton as={Button} rightIcon={<ChevronDownIcon />} size="sm">
            Bulk Actions
          </MenuButton>
          <MenuList>
            <MenuItem onClick={() => handleBulkAction("approve_all_pending")}>
              Approve All Pending
            </MenuItem>
          </MenuList>
        </Menu>
      </Flex>

      {/* Requests Table */}
      <Box 
        bg={cardBg}
        borderRadius="lg" 
        borderWidth="1px" 
        borderColor={borderColor}
        overflow="hidden"
      >
        <Table variant="simple">
          <Thead bg="gray.50">
            <Tr>
              <Th>Organizer</Th>
              <Th>Type</Th>
              <Th>Wallet Address</Th>
              <Th>Categories</Th>
              <Th>Status</Th>
              <Th>Submitted</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredRequests.length > 0 ? (
              filteredRequests.map((request) => (
                <Tr key={request.id} _hover={{ bg: "gray.50" }}>
                  <Td>
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="medium" fontSize="sm">
                        {request.fullName}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {request.email}
                      </Text>
                    </VStack>
                  </Td>
                  <Td>
                    <Badge colorScheme="blue" variant="subtle" size="sm">
                      {request.organizerType}
                    </Badge>
                  </Td>
                  <Td>
                    <Text 
                      fontSize="xs" 
                      fontFamily="monospace"
                      color="purple.600"
                    >
                      {request.walletAddress 
                        ? `${request.walletAddress.slice(0, 6)}...${request.walletAddress.slice(-4)}`
                        : "Not provided"
                      }
                    </Text>
                  </Td>
                  <Td>
                    <VStack align="start" spacing={1}>
                      {request.eventCategories.slice(0, 2).map((cat) => (
                        <Badge
                          key={cat}
                          colorScheme="purple"
                          variant="outline"
                          size="sm"
                        >
                          {cat}
                        </Badge>
                      ))}
                      {request.eventCategories.length > 2 && (
                        <Text fontSize="xs" color="gray.500">
                          +{request.eventCategories.length - 2} more
                        </Text>
                      )}
                    </VStack>
                  </Td>
                  <Td>
                    <Badge colorScheme={getStatusColor(request.status)} size="sm">
                      {getStatusLabel(request.status)}
                    </Badge>
                  </Td>
                  <Td>
                    <Text fontSize="sm">
                      {formatDate(request.submittedDate)}
                    </Text>
                  </Td>
                  <Td>
                    <HStack spacing={1}>
                      <IconButton
                        icon={<ViewIcon />}
                        aria-label="View Details"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(request)}
                      />
                      {request.status === "pending" && (
                        <>
                          <IconButton
                            icon={<CheckIcon />}
                            aria-label="Quick Approve"
                            variant="ghost"
                            size="sm"
                            colorScheme="green"
                            onClick={() => {
                              setSelectedRequest(request);
                              handleStatusUpdate("approved");
                            }}
                          />
                          <IconButton
                            icon={<CloseIcon />}
                            aria-label="Quick Reject"
                            variant="ghost"
                            size="sm"
                            colorScheme="red"
                            onClick={() => {
                              setSelectedRequest(request);
                              handleStatusUpdate("rejected");
                            }}
                          />
                        </>
                      )}
                    </HStack>
                  </Td>
                </Tr>
              ))
            ) : (
              <Tr>
                <Td colSpan={7} textAlign="center" py={8}>
                  <Text color="gray.500">No requests found</Text>
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </Box>

      {/* Detail Modal */}
      {selectedRequest && (
        <Modal isOpen={isOpen} onClose={onClose} size="6xl">
          <ModalOverlay />
          <ModalContent maxH="90vh" overflowY="auto">
            <ModalHeader>
              <HStack align="center" spacing={3}>
                <Text>{selectedRequest.fullName}</Text>
                <Badge colorScheme={getStatusColor(selectedRequest.status)}>
                  {getStatusLabel(selectedRequest.status)}
                </Badge>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />

            <ModalBody>
              <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
                {/* Left Column */}
                <VStack spacing={6} align="stretch">
                  {/* Basic Information */}
                  <Box>
                    <Heading size="sm" mb={3}>
                      Basic Information
                    </Heading>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <Box>
                        <Text fontSize="sm" color="gray.600">Email</Text>
                        <Text fontWeight="medium">{selectedRequest.email}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.600">Phone</Text>
                        <Text fontWeight="medium">{selectedRequest.phone}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.600">Type</Text>
                        <Badge colorScheme="blue">{selectedRequest.organizerType}</Badge>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.600">Experience</Text>
                        <Text fontWeight="medium">{selectedRequest.experience}</Text>
                      </Box>
                    </SimpleGrid>

                    <Box mt={4}>
                      <Text fontSize="sm" color="gray.600">Wallet Address</Text>
                      <Text fontWeight="medium" fontFamily="monospace" color="purple.600">
                        {selectedRequest.walletAddress || "Not provided"}
                      </Text>
                    </Box>

                    <Box mt={4}>
                      <Text fontSize="sm" color="gray.600">Address</Text>
                      <Text fontWeight="medium">{selectedRequest.address}</Text>
                    </Box>

                    {selectedRequest.website && (
                      <Box mt={4}>
                        <Text fontSize="sm" color="gray.600">Website</Text>
                        <Text fontWeight="medium" color="purple.500">
                          {selectedRequest.website}
                        </Text>
                      </Box>
                    )}
                  </Box>

                  {/* Business Information */}
                  <Box>
                    <Heading size="sm" mb={3}>Business Information</Heading>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <Box>
                        <Text fontSize="sm" color="gray.600">Event Categories</Text>
                        <HStack spacing={1} wrap="wrap">
                          {selectedRequest.eventCategories.map((cat) => (
                            <Badge key={cat} colorScheme="purple" variant="outline">
                              {cat}
                            </Badge>
                          ))}
                        </HStack>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.600">Events per Year</Text>
                        <Text fontWeight="medium">{selectedRequest.estimatedEventsPerYear}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.600">Budget Range</Text>
                        <Text fontWeight="medium">{selectedRequest.estimatedBudget}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.600">Submitted</Text>
                        <Text fontWeight="medium">{formatDate(selectedRequest.submittedDate)}</Text>
                      </Box>
                    </SimpleGrid>
                  </Box>
                </VStack>

                {/* Right Column */}
                <VStack spacing={6} align="stretch">
                  {/* Description */}
                  <Box>
                    <Heading size="sm" mb={3}>About</Heading>
                    <Text>{selectedRequest.description}</Text>
                  </Box>

                  {selectedRequest.previousEvents && (
                    <Box>
                      <Heading size="sm" mb={3}>Previous Events</Heading>
                      <Text>{selectedRequest.previousEvents}</Text>
                    </Box>
                  )}

                  {selectedRequest.references && (
                    <Box>
                      <Heading size="sm" mb={3}>References</Heading>
                      <Text>{selectedRequest.references}</Text>
                    </Box>
                  )}

                  {/* Admin Actions */}
                  <Box>
                    <Heading size="sm" mb={3}>Admin Actions</Heading>
                    <VStack spacing={3} align="stretch">
                      <Textarea
                        placeholder="Add a note or message..."
                        value={reviewNote}
                        onChange={(e) => setReviewNote(e.target.value)}
                        rows={3}
                      />

                      {selectedRequest.status !== "approved" && selectedRequest.status !== "rejected" && (
                        <Alert status="info" borderRadius="md">
                          <AlertIcon />
                          <Text fontSize="sm">
                            Review the application details and update the status accordingly.
                          </Text>
                        </Alert>
                      )}
                    </VStack>
                  </Box>
                </VStack>
              </SimpleGrid>
            </ModalBody>

            <ModalFooter pt={0} pb={4}>
              <Flex w="100%" justify="flex-end" gap={2} flexWrap="wrap">
                <Button variant="ghost" onClick={onClose}>
                  Close
                </Button>
                {selectedRequest.status === "pending" && (
                  <>
                    <Button
                      colorScheme="blue"
                      onClick={() => handleStatusUpdate("under_review")}
                    >
                      Start Review
                    </Button>
                    <Button
                      colorScheme="yellow"
                      onClick={() => handleStatusUpdate("need_more_info")}
                    >
                      Need More Info
                    </Button>
                    <Button
                      colorScheme="red"
                      onClick={() => handleStatusUpdate("rejected")}
                    >
                      Reject
                    </Button>
                    <Button
                      colorScheme="green"
                      onClick={() => handleStatusUpdate("approved")}
                    >
                      Approve & Whitelist
                    </Button>
                  </>
                )}
                {selectedRequest.status === "under_review" && (
                  <>
                    <Button
                      colorScheme="yellow"
                      onClick={() => handleStatusUpdate("need_more_info")}
                    >
                      Need More Info
                    </Button>
                    <Button
                      colorScheme="red"
                      onClick={() => handleStatusUpdate("rejected")}
                    >
                      Reject
                    </Button>
                    <Button
                      colorScheme="green"
                      onClick={() => handleStatusUpdate("approved")}
                    >
                      Approve & Whitelist
                    </Button>
                  </>
                )}
              </Flex>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
      </VStack>
    </Container>
  );
};

export default AdminOrganizerRequests;