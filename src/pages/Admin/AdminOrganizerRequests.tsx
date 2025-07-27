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
} from "@chakra-ui/icons";

// Simplified organizer request interface (matches customer form)
interface OrganizerRequest {
  id: string;
  walletAddress: string;      // Wallet address from customer form
  organizerName: string;      // Organizer name from customer form
  email: string;              // Email from customer form
  additionalNotes: string;    // Additional notes from customer form
  status: "under_review" | "need_more_info" | "approved" | "rejected";
  submittedDate: string;
}

const mockRequests: OrganizerRequest[] = [
  {
    id: "org-req-1",
    walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
    organizerName: "Jakarta Music Productions",
    email: "info@jakartamusic.com",
    additionalNotes: "We are a music production company specializing in live concerts and music festivals in Jakarta area. We have organized Jakarta Music Festival 2024 and Rock Concert Series with successful track record.",
    status: "under_review",
    submittedDate: "2025-01-10T09:30:00",
  },
  {
    id: "org-req-2",
    walletAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
    organizerName: "TechHub Indonesia",
    email: "organizer@techhub.id",
    additionalNotes: "Leading technology event organizer focused on startup and innovation conferences. We have 5+ years experience organizing tech events with 13-24 events per year.",
    status: "under_review",
    submittedDate: "2025-01-08T14:20:00",
  },
  {
    id: "org-req-3",
    walletAddress: "0x9876543210fedcba9876543210fedcba98765432",
    organizerName: "Sarah Wijaya",
    email: "sarah.wijaya@email.com",
    additionalNotes: "Individual organizer specializing in creative workshops and educational seminars. Looking to expand my event organizing business with 1-3 years experience.",
    status: "need_more_info",
    submittedDate: "2025-01-05T11:45:00",
  },
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
          req.organizerName.toLowerCase().includes(query) ||
          req.email.toLowerCase().includes(query) ||
          req.walletAddress.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((req) => req.status === statusFilter);
    }

    setFilteredRequests(filtered);
  }, [requests, searchQuery, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "under_review": return "orange";
      case "need_more_info": return "yellow";
      case "approved": return "green";
      case "rejected": return "red";
      default: return "gray";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
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
              status: newStatus as any
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
    const underReviewCount = filteredRequests.filter(r => r.status === "under_review").length;
    
    if (action === "approve_all_under_review") {
      setRequests(prev => 
        prev.map(req => 
          req.status === "under_review" 
            ? { ...req, status: "approved" }
            : req
        )
      );
      toast({
        title: "Bulk Action Completed",
        description: `${underReviewCount} under review requests approved`,
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
    const underReview = requests.filter(r => r.status === "under_review").length;
    const approved = requests.filter(r => r.status === "approved").length;
    const rejected = requests.filter(r => r.status === "rejected").length;
    
    return { total, underReview, approved, rejected };
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
          <StatLabel fontSize="sm">Under Review</StatLabel>
          <StatNumber color="orange.600">{stats.underReview}</StatNumber>
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
            <MenuItem onClick={() => handleBulkAction("approve_all_under_review")}>
              Approve All Under Review
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
              <Th>Wallet Address</Th>
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
                      <Text fontWeight="medium">{request.organizerName}</Text>
                      <Text fontSize="sm" color="gray.500">
                        {request.email}
                      </Text>
                    </VStack>
                  </Td>
                  <Td>
                    <Text fontFamily="monospace" fontSize="sm" color="gray.600">
                      {request.walletAddress.slice(0, 6)}...{request.walletAddress.slice(-4)}
                    </Text>
                  </Td>
                  <Td>
                    <Badge colorScheme={getStatusColor(request.status)}>
                      {getStatusLabel(request.status)}
                    </Badge>
                  </Td>
                  <Td>
                    <Text fontSize="sm">
                      {formatDate(request.submittedDate)}
                    </Text>
                  </Td>
                  <Td>
                    <IconButton
                      icon={<ViewIcon />}
                      aria-label="View Details"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetails(request)}
                    />
                  </Td>
                </Tr>
              ))
            ) : (
              <Tr>
                <Td colSpan={5} textAlign="center" py={8}>
                  <Text color="gray.500">No requests found</Text>
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </Box>

      {/* Detail Modal */}
      {selectedRequest && (
        <Modal isOpen={isOpen} onClose={onClose} size="2xl">
          <ModalOverlay />
          <ModalContent maxH="90vh" overflowY="auto">
            <ModalHeader>
              <HStack align="center" spacing={3}>
                <Text>{selectedRequest.organizerName}</Text>
                <Badge colorScheme={getStatusColor(selectedRequest.status)}>
                  {getStatusLabel(selectedRequest.status)}
                </Badge>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />

            <ModalBody>
              <VStack spacing={6} align="stretch">
                {/* Request Information */}
                <Box>
                  <Heading size="md" mb={4}>
                    Organizer Request Details
                  </Heading>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <Box>
                      <Text fontSize="sm" color="gray.600">
                        Organizer Name
                      </Text>
                      <Text fontWeight="medium">{selectedRequest.organizerName}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.600">
                        Email Address
                      </Text>
                      <Text fontWeight="medium">{selectedRequest.email}</Text>
                    </Box>
                    <Box gridColumn={{ base: 1, md: "1 / 3" }}>
                      <Text fontSize="sm" color="gray.600">
                        Wallet Address
                      </Text>
                      <Text fontWeight="medium" fontFamily="monospace" fontSize="sm">
                        {selectedRequest.walletAddress}
                      </Text>
                    </Box>
                    <Box gridColumn={{ base: 1, md: "1 / 3" }}>
                      <Text fontSize="sm" color="gray.600">
                        Submitted Date
                      </Text>
                      <Text fontWeight="medium">
                        {formatDate(selectedRequest.submittedDate)}
                      </Text>
                    </Box>
                  </SimpleGrid>
                </Box>

                {/* Additional Notes */}
                {selectedRequest.additionalNotes && (
                  <Box>
                    <Text fontSize="sm" color="gray.600" mb={2}>
                      Additional Notes
                    </Text>
                    <Box 
                      p={4} 
                      bg="gray.50" 
                      borderRadius="md" 
                      borderWidth="1px"
                    >
                      <Text>{selectedRequest.additionalNotes}</Text>
                    </Box>
                  </Box>
                )}

                {/* Admin Actions */}
                <Box>
                  <Heading size="sm" mb={3}>
                    Admin Actions
                  </Heading>

                  <VStack spacing={3} align="stretch">
                    <Textarea
                      placeholder="Add a note or message to the organizer..."
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                      rows={3}
                    />

                    {selectedRequest.status !== "approved" &&
                      selectedRequest.status !== "rejected" && (
                        <Alert status="info" borderRadius="md">
                          <AlertIcon />
                          <Text fontSize="sm">
                            Review the application details and update the
                            status accordingly.
                          </Text>
                        </Alert>
                      )}
                  </VStack>
                </Box>
              </VStack>
            </ModalBody>

            <ModalFooter pt={0} pb={4}>
              <Flex w="100%" justify="flex-end" gap={2} flexWrap="wrap">
                <Button variant="ghost" onClick={onClose}>
                  Close
                </Button>
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
                      Approve
                    </Button>
                  </>
                )}
                {selectedRequest.status === "need_more_info" && (
                  <>
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
                      Approve
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