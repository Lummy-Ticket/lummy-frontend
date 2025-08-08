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
  Alert,
  AlertIcon,
  useColorModeValue,
  Stat,
  StatLabel,
  StatNumber,
  Grid,
  Card,
  CardBody,
  CardHeader,
  Icon,
  Spinner,
} from "@chakra-ui/react";
import { 
  SearchIcon, 
  ViewIcon,
  DownloadIcon,
  CheckIcon,
  CloseIcon,
} from "@chakra-ui/icons";
import { FiFile, FiMail, FiUser, FiCalendar, FiShield } from "react-icons/fi";
import OrganizerService, { 
  OrganizerRequest, 
  DocumentInfo, 
  ConsentInfo 
} from "../../services/OrganizerService";

interface RequestDetailsModalProps {
  request: OrganizerRequest;
  documents: DocumentInfo[];
  consent: ConsentInfo;
  onClose: () => void;
  onApprove: (requestId: string, notes: string) => Promise<void>;
  onReject: (requestId: string, notes: string) => Promise<void>;
  isProcessing: boolean;
}

const RequestDetailsModal: React.FC<RequestDetailsModalProps> = ({
  request,
  documents,
  consent,
  onClose,
  onApprove,
  onReject,
  isProcessing,
}) => {
  const [adminNotes, setAdminNotes] = useState("");
  const cardBg = useColorModeValue("white", "gray.50");

  const handleDownloadDocument = async (documentId: string, fileName: string) => {
    try {
      const blob = await OrganizerService.downloadDocument(documentId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Modal isOpen={true} onClose={onClose} size="6xl">
      <ModalOverlay />
      <ModalContent maxH="90vh" overflow="hidden">
        <ModalHeader>
          <VStack align="start" spacing={2}>
            <Text>Review Organizer Application</Text>
            <Badge colorScheme={request.status === 'approved' ? 'green' : request.status === 'rejected' ? 'red' : 'orange'}>
              {request.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </VStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody overflow="auto">
          <Grid templateColumns="1fr 1fr" gap={6}>
            {/* Left Column: Application Details */}
            <VStack spacing={4} align="stretch">
              <Card bg={cardBg}>
                <CardHeader pb={2}>
                  <HStack>
                    <Icon as={FiUser} color="purple.500" />
                    <Heading size="sm">Application Information</Heading>
                  </HStack>
                </CardHeader>
                <CardBody>
                  <VStack spacing={3} align="stretch">
                    <Box>
                      <Text fontSize="sm" color="gray.500">Organizer Name</Text>
                      <Text fontWeight="semibold">{request.organizerName}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.500">Email Address</Text>
                      <Text fontWeight="semibold">{request.email}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.500">Wallet Address</Text>
                      <Text fontFamily="monospace" fontSize="sm">
                        {request.walletAddress}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.500">Submitted</Text>
                      <HStack>
                        <Icon as={FiCalendar} boxSize={3} />
                        <Text fontSize="sm">
                          {request.createdAt.toLocaleDateString()} at {request.createdAt.toLocaleTimeString()}
                        </Text>
                      </HStack>
                    </Box>
                  </VStack>
                </CardBody>
              </Card>

              <Card bg={cardBg}>
                <CardHeader pb={2}>
                  <HStack>
                    <Icon as={FiMail} color="blue.500" />
                    <Heading size="sm">Additional Notes</Heading>
                  </HStack>
                </CardHeader>
                <CardBody>
                  <Text fontSize="sm" lineHeight={1.6}>
                    {request.notes || "No additional notes provided."}
                  </Text>
                </CardBody>
              </Card>

              <Card bg={cardBg}>
                <CardHeader pb={2}>
                  <HStack>
                    <Icon as={FiShield} color="green.500" />
                    <Heading size="sm">GDPR Consent Status</Heading>
                  </HStack>
                </CardHeader>
                <CardBody>
                  <VStack spacing={2} align="stretch">
                    <HStack justify="space-between">
                      <Text fontSize="sm">Document Processing</Text>
                      <Badge colorScheme={consent.documentProcessingConsent ? "green" : "red"}>
                        {consent.documentProcessingConsent ? "Granted" : "Not Granted"}
                      </Badge>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm">Identity Verification</Text>
                      <Badge colorScheme={consent.identityVerificationConsent ? "green" : "red"}>
                        {consent.identityVerificationConsent ? "Granted" : "Not Granted"}
                      </Badge>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm">Data Retention</Text>
                      <Badge colorScheme={consent.dataRetentionAcknowledged ? "green" : "red"}>
                        {consent.dataRetentionAcknowledged ? "Acknowledged" : "Not Acknowledged"}
                      </Badge>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm">Communication</Text>
                      <Badge colorScheme={consent.communicationConsent ? "blue" : "gray"}>
                        {consent.communicationConsent ? "Opted In" : "Opted Out"}
                      </Badge>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            </VStack>

            {/* Right Column: Documents */}
            <VStack spacing={4} align="stretch">
              <Card bg={cardBg}>
                <CardHeader pb={2}>
                  <HStack>
                    <Icon as={FiFile} color="orange.500" />
                    <Heading size="sm">Uploaded Documents ({documents.length})</Heading>
                  </HStack>
                </CardHeader>
                <CardBody>
                  <VStack spacing={3} align="stretch">
                    {documents.length === 0 ? (
                      <Alert status="warning">
                        <AlertIcon />
                        <Text fontSize="sm">No documents uploaded yet.</Text>
                      </Alert>
                    ) : (
                      documents.map((doc) => (
                        <Box
                          key={doc.id}
                          p={3}
                          border="1px solid"
                          borderColor="gray.200"
                          borderRadius="md"
                          bg="white"
                        >
                          <VStack spacing={2} align="stretch">
                            <HStack justify="space-between" align="start">
                              <VStack align="start" spacing={1} flex={1}>
                                <Text fontWeight="semibold" fontSize="sm" noOfLines={1}>
                                  {doc.fileName}
                                </Text>
                                <Text fontSize="xs" color="gray.500">
                                  {doc.documentType.replace('_', ' ').toUpperCase()} • {formatFileSize(doc.fileSize)}
                                </Text>
                                <Text fontSize="xs" color="gray.400">
                                  Uploaded {doc.uploadedAt.toLocaleDateString()}
                                </Text>
                              </VStack>
                              <VStack spacing={2}>
                                <Button
                                  size="sm"
                                  leftIcon={<DownloadIcon />}
                                  colorScheme="blue"
                                  variant="outline"
                                  onClick={() => handleDownloadDocument(doc.id, doc.fileName)}
                                >
                                  Download
                                </Button>
                                {doc.verifiedAt && (
                                  <Badge colorScheme="green" fontSize="xs">
                                    ✓ Verified
                                  </Badge>
                                )}
                              </VStack>
                            </HStack>
                          </VStack>
                        </Box>
                      ))
                    )}
                  </VStack>
                </CardBody>
              </Card>

              <Card bg={cardBg}>
                <CardHeader pb={2}>
                  <Heading size="sm">Admin Review</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Box>
                      <Text fontSize="sm" mb={2} fontWeight="medium">Review Notes</Text>
                      <Textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Add notes about the application review (required for approval/rejection)..."
                        rows={4}
                        resize="vertical"
                      />
                    </Box>

                    {request.adminNotes && (
                      <Box>
                        <Text fontSize="sm" mb={2} fontWeight="medium">Previous Notes</Text>
                        <Box p={3} bg="gray.50" borderRadius="md">
                          <Text fontSize="sm" color="gray.600">
                            {request.adminNotes}
                          </Text>
                          {request.reviewedAt && (
                            <Text fontSize="xs" color="gray.500" mt={1}>
                              Reviewed on {request.reviewedAt.toLocaleDateString()}
                            </Text>
                          )}
                        </Box>
                      </Box>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            </VStack>
          </Grid>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button
              colorScheme="red"
              leftIcon={<CloseIcon />}
              onClick={() => onReject(request.id, adminNotes)}
              isLoading={isProcessing}
              isDisabled={!adminNotes.trim()}
            >
              Reject
            </Button>
            <Button
              colorScheme="green"
              leftIcon={<CheckIcon />}
              onClick={() => onApprove(request.id, adminNotes)}
              isLoading={isProcessing}
              isDisabled={!adminNotes.trim()}
            >
              Approve
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const EnhancedAdminOrganizerRequests: React.FC = () => {
  const [requests, setRequests] = useState<OrganizerRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<OrganizerRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRequests, setTotalRequests] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [selectedRequest, setSelectedRequest] = useState<OrganizerRequest | null>(null);
  const [requestDocuments, setRequestDocuments] = useState<DocumentInfo[]>([]);
  const [requestConsent, setRequestConsent] = useState<ConsentInfo | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [processingRequest, setProcessingRequest] = useState(false);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  // Load organizer requests
  const loadRequests = async () => {
    setLoading(true);
    try {
      const result = await OrganizerService.getOrganizerRequests({
        status: statusFilter === 'all' ? undefined : statusFilter,
        page: currentPage,
        limit: 10,
        search: searchQuery.trim() || undefined,
      });

      setRequests(result.requests);
      setFilteredRequests(result.requests);
      setTotalRequests(result.total);
      setTotalPages(Math.ceil(result.total / 10));
    } catch (error) {
      console.error("Failed to load organizer requests:", error);
      toast({
        title: "Failed to load requests",
        description: "Unable to fetch organizer requests. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Load requests when filters change
  useEffect(() => {
    loadRequests();
  }, [statusFilter, currentPage, searchQuery]);

  // Handle request details
  const handleViewRequest = async (request: OrganizerRequest) => {
    setSelectedRequest(request);
    setDetailsLoading(true);
    onOpen();

    try {
      const details = await OrganizerService.getOrganizerRequestDetails(request.id);
      setRequestDocuments(details.documents);
      setRequestConsent(details.consent);
    } catch (error) {
      console.error("Failed to load request details:", error);
      toast({
        title: "Failed to load details",
        description: "Unable to fetch request details.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setDetailsLoading(false);
    }
  };

  // Handle request approval
  const handleApproveRequest = async (requestId: string, adminNotes: string) => {
    setProcessingRequest(true);
    try {
      await OrganizerService.updateRequestStatus(requestId, "approved", adminNotes, "admin-wallet");
      
      toast({
        title: "Request Approved",
        description: "The organizer request has been approved successfully.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      onClose();
      loadRequests(); // Reload the list
    } catch (error) {
      console.error("Failed to approve request:", error);
      toast({
        title: "Approval Failed",
        description: "Failed to approve the request. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setProcessingRequest(false);
    }
  };

  // Handle request rejection
  const handleRejectRequest = async (requestId: string, adminNotes: string) => {
    setProcessingRequest(true);
    try {
      await OrganizerService.updateRequestStatus(requestId, "rejected", adminNotes, "admin-wallet");
      
      toast({
        title: "Request Rejected",
        description: "The organizer request has been rejected.",
        status: "info",
        duration: 5000,
        isClosable: true,
      });

      onClose();
      loadRequests(); // Reload the list
    } catch (error) {
      console.error("Failed to reject request:", error);
      toast({
        title: "Rejection Failed",
        description: "Failed to reject the request. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setProcessingRequest(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "blue";
      case "under_review": return "orange";
      case "approved": return "green";
      case "rejected": return "red";
      default: return "gray";
    }
  };

  const getStatusCount = (status: string) => {
    return requests.filter(req => req.status === status).length;
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="lg" mb={2}>
            Organizer Requests Management
          </Heading>
          <Text color="gray.600">
            Review and manage organizer applications with document verification.
          </Text>
        </Box>

        {/* Statistics */}
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
          <Stat>
            <StatLabel>Total Requests</StatLabel>
            <StatNumber>{totalRequests}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Pending Review</StatLabel>
            <StatNumber color="orange.500">{getStatusCount("pending") + getStatusCount("under_review")}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Approved</StatLabel>
            <StatNumber color="green.500">{getStatusCount("approved")}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Rejected</StatLabel>
            <StatNumber color="red.500">{getStatusCount("rejected")}</StatNumber>
          </Stat>
        </SimpleGrid>

        {/* Filters */}
        <Card bg={cardBg} borderColor={borderColor}>
          <CardBody>
            <HStack spacing={4}>
              <InputGroup maxW="400px">
                <InputLeftElement>
                  <SearchIcon color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search by name, email, or wallet address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </InputGroup>

              <Select
                maxW="200px"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </Select>

              <Button leftIcon={<ViewIcon />} onClick={loadRequests} isLoading={loading}>
                Refresh
              </Button>
            </HStack>
          </CardBody>
        </Card>

        {/* Requests Table */}
        <Card bg={cardBg} borderColor={borderColor}>
          <CardBody p={0}>
            {loading ? (
              <Box p={8} textAlign="center">
                <Spinner size="lg" color="purple.500" />
                <Text mt={4} color="gray.500">Loading organizer requests...</Text>
              </Box>
            ) : filteredRequests.length === 0 ? (
              <Box p={8} textAlign="center">
                <Alert status="info">
                  <AlertIcon />
                  <Text>No organizer requests found matching your criteria.</Text>
                </Alert>
              </Box>
            ) : (
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Organizer</Th>
                    <Th>Email</Th>
                    <Th>Wallet Address</Th>
                    <Th>Status</Th>
                    <Th>Submitted</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredRequests.map((request) => (
                    <Tr key={request.id}>
                      <Td>
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="semibold" fontSize="sm">
                            {request.organizerName}
                          </Text>
                        </VStack>
                      </Td>
                      <Td>
                        <Text fontSize="sm" color="gray.600">
                          {request.email}
                        </Text>
                      </Td>
                      <Td>
                        <Text fontFamily="monospace" fontSize="xs" color="gray.500">
                          {request.walletAddress.slice(0, 6)}...{request.walletAddress.slice(-4)}
                        </Text>
                      </Td>
                      <Td>
                        <Badge colorScheme={getStatusColor(request.status)}>
                          {request.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </Td>
                      <Td>
                        <VStack align="start" spacing={0}>
                          <Text fontSize="xs" color="gray.500">
                            {request.createdAt.toLocaleDateString()}
                          </Text>
                          <Text fontSize="xs" color="gray.400">
                            {request.createdAt.toLocaleTimeString()}
                          </Text>
                        </VStack>
                      </Td>
                      <Td>
                        <Button
                          size="sm"
                          leftIcon={<ViewIcon />}
                          colorScheme="purple"
                          variant="outline"
                          onClick={() => handleViewRequest(request)}
                        >
                          Review
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </CardBody>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <Flex justify="center" align="center" gap={4}>
            <Button
              isDisabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              Previous
            </Button>
            <Text>
              Page {currentPage} of {totalPages}
            </Text>
            <Button
              isDisabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              Next
            </Button>
          </Flex>
        )}

        {/* Request Details Modal */}
        {selectedRequest && isOpen && (
          detailsLoading ? (
            <Modal isOpen={isOpen} onClose={onClose}>
              <ModalOverlay />
              <ModalContent>
                <ModalBody p={8} textAlign="center">
                  <Spinner size="lg" color="purple.500" />
                  <Text mt={4}>Loading request details...</Text>
                </ModalBody>
              </ModalContent>
            </Modal>
          ) : requestConsent ? (
            <RequestDetailsModal
              request={selectedRequest}
              documents={requestDocuments}
              consent={requestConsent}
              onClose={onClose}
              onApprove={handleApproveRequest}
              onReject={handleRejectRequest}
              isProcessing={processingRequest}
            />
          ) : null
        )}
      </VStack>
    </Container>
  );
};

export default EnhancedAdminOrganizerRequests;