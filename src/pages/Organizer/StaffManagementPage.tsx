import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  Input,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  Flex,
} from "@chakra-ui/react";
import { AddIcon, DeleteIcon, ArrowBackIcon } from "@chakra-ui/icons";
import { useNavigate, useParams } from "react-router-dom";
import { useSmartContract } from "../../hooks/useSmartContract";
import { useStaffEventListener } from "../../hooks/useStaffEventListener";

const StaffManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const {
    isEventOrganizer,
    getEventInfo,
    addStaff, // Use simple addStaff instead of addStaffWithRole
    removeStaff, // Use removeStaff instead of removeStaffRole
  } = useSmartContract();

  // Event-based staff management
  const {
    staffList: eventBasedStaffList,
    isLoading: staffEventsLoading,
    isListening: staffEventsListening,
    error: staffEventsError,
    refreshStaffEvents,
  } = useStaffEventListener();

  const [isOrganizerVerified, setIsOrganizerVerified] = useState(false);
  const [newStaffAddress, setNewStaffAddress] = useState("");
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [eventInfo, setEventInfo] = useState<any>(null);

  // Verify organizer permissions on mount
  useEffect(() => {
    const verifyOrganizer = async () => {
      try {
        const isOrganizer = await isEventOrganizer();
        setIsOrganizerVerified(isOrganizer);
        
        if (!isOrganizer) {
          toast({
            title: "Access Denied",
            description: "Only organizers can manage staff",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
          navigate("/organizer");
          return;
        }

        // Get event info
        const eventData = await getEventInfo();
        setEventInfo(eventData);
        
        // Staff members are now loaded via useStaffEventListener hook
      } catch (error) {
        console.error("Error verifying organizer:", error);
        toast({
          title: "Error",
          description: "Failed to verify organizer permissions",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    };

    verifyOrganizer();
  }, [isEventOrganizer, getEventInfo, navigate, toast]);

  const handleAddStaff = async () => {
    if (!newStaffAddress.trim()) {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid wallet address",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Basic address validation
    if (!/^0x[a-fA-F0-9]{40}$/.test(newStaffAddress.trim())) {
      toast({
        title: "Invalid Address Format",
        description: "Please enter a valid Ethereum address",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsAddingStaff(true);
    
    try {
      const hash = await addStaff(newStaffAddress.trim());
      if (hash) {
        toast({
          title: "Staff Added Successfully",
          description: `Added ${newStaffAddress.substring(0, 8)}... as Staff (Scanner)`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });

        // Reset form - staff list will be updated via events
        setNewStaffAddress("");
        onClose();
      }
    } catch (error) {
      toast({
        title: "Failed to Add Staff",
        description: "Please try again",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsAddingStaff(false);
    }
  };

  const handleRemoveStaff = async (staffAddress: string) => {
    try {
      const hash = await removeStaff(staffAddress);
      if (hash) {
        toast({
          title: "Staff Removed",
          description: `Removed ${staffAddress.substring(0, 8)}... from staff`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });

        // Staff list will be updated automatically via events
      }
    } catch (error) {
      toast({
        title: "Failed to Remove Staff",
        description: "Please try again",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const getRoleBadgeColor = () => {
    return "blue"; // All staff are SCANNER role
  };

  if (!isOrganizerVerified) {
    return (
      <Container maxW="container.lg" py={8}>
        <VStack spacing={4}>
          <Spinner size="lg" color="purple.500" />
          <Text>Verifying organizer permissions...</Text>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <VStack align="start" spacing={1}>
            <Button
              leftIcon={<ArrowBackIcon />}
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/organizer/events/${eventId}`)}
            >
              Back to Event Management
            </Button>
            <Heading size="lg">Staff Management</Heading>
            {eventInfo && (
              <Text color="gray.600">
                Managing staff for: <strong>{eventInfo.name}</strong>
              </Text>
            )}
          </VStack>
          <Button
            leftIcon={<AddIcon />}
            colorScheme="purple"
            onClick={onOpen}
          >
            Add Staff
          </Button>
        </Flex>

        {/* Info Alert */}
        <Alert status="info" borderRadius="lg">
          <AlertIcon />
          <Box>
            <AlertTitle>Staff Access:</AlertTitle>
            <AlertDescription>
              Staff members can scan QR codes and validate tickets at your event. All staff get the same scanning permissions.
            </AlertDescription>
          </Box>
        </Alert>

        {/* Staff Table */}
        <Box bg="white" borderRadius="lg" overflow="hidden" border="1px solid" borderColor="gray.200">
          {staffEventsLoading ? (
            <Flex direction="column" align="center" justify="center" py={12}>
              <Spinner size="lg" color="purple.500" />
              <Text color="gray.500" mt={4}>Loading staff events...</Text>
            </Flex>
          ) : staffEventsError ? (
            <Flex direction="column" align="center" justify="center" py={12}>
              <Text color="red.500" fontSize="lg">❌ Error loading staff</Text>
              <Text color="gray.400" fontSize="sm" mt={2}>
                {staffEventsError}
              </Text>
              <Button mt={4} size="sm" onClick={refreshStaffEvents} colorScheme="blue">
                Try Again
              </Button>
            </Flex>
          ) : eventBasedStaffList.length === 0 ? (
            <Flex direction="column" align="center" justify="center" py={12}>
              <Text color="gray.500" fontSize="lg">No staff members added yet</Text>
              <Text color="gray.400" fontSize="sm" mt={2}>
                Add staff members to help manage your event
              </Text>
              {staffEventsListening && (
                <Badge colorScheme="green" size="sm" mt={3}>
                  🟢 Real-time updates enabled
                </Badge>
              )}
            </Flex>
          ) : (
            <Table variant="simple">
              <Thead bg="gray.50">
                <Tr>
                  <Th>Wallet Address</Th>
                  <Th>Access Level</Th>
                  <Th>Added</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {eventBasedStaffList.map((staff) => (
                  <Tr key={staff.address}>
                    <Td>
                      <Text fontFamily="mono" fontSize="sm">
                        {staff.address.substring(0, 8)}...{staff.address.substring(staff.address.length - 6)}
                      </Text>
                    </Td>
                    <Td>
                      <Badge colorScheme={getRoleBadgeColor()}>
                        Scanner Access
                      </Badge>
                    </Td>
                    <Td>
                      <Text fontSize="sm" color="gray.600">
                        {staff.assignedDate instanceof Date 
                          ? staff.assignedDate.toLocaleDateString() 
                          : new Date(staff.assignedDate).toLocaleDateString()}
                      </Text>
                    </Td>
                    <Td>
                      <IconButton
                        aria-label="Remove staff"
                        icon={<DeleteIcon />}
                        colorScheme="red"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveStaff(staff.address)}
                      />
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Box>

        {/* Add Staff Modal */}
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Add Staff Member</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <FormControl>
                  <FormLabel>Wallet Address</FormLabel>
                  <Input
                    placeholder="0x..."
                    value={newStaffAddress}
                    onChange={(e) => setNewStaffAddress(e.target.value)}
                    fontFamily="mono"
                  />
                </FormControl>
                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  <AlertDescription fontSize="sm">
                    Staff members will be able to scan QR codes and validate tickets at your event.
                  </AlertDescription>
                </Alert>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancel
              </Button>
              <Button
                colorScheme="purple"
                onClick={handleAddStaff}
                isLoading={isAddingStaff}
                loadingText="Adding..."
              >
                Add Staff
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </Container>
  );
};

export default StaffManagementPage;