import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  Input,
  Select,
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
import { DEVELOPMENT_CONFIG } from "../../constants";

// Mock data for development
const mockStaffMembers = [
  {
    address: "0x1234567890abcdef1234567890abcdef12345678",
    role: 1,
    addedBy: "organizer",
    addedAt: new Date().toISOString(),
  },
  {
    address: "0x2345678901bcdef2345678901bcdef23456789ab",
    role: 2,
    addedBy: "organizer", 
    addedAt: new Date().toISOString(),
  },
];

const StaffManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const {
    isEventOrganizer,
    getEventInfo,
    addStaffWithRole,
    removeStaffRole,
    getStaffRoleNames,
  } = useSmartContract();

  const [isOrganizerVerified, setIsOrganizerVerified] = useState(false);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [newStaffAddress, setNewStaffAddress] = useState("");
  const [newStaffRole, setNewStaffRole] = useState(1);
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [eventInfo, setEventInfo] = useState<any>(null);

  const roleNames = getStaffRoleNames();

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
        
        // Load staff members (for now use mock data)
        if (DEVELOPMENT_CONFIG.ENABLE_BLOCKCHAIN) {
          // In real implementation, we'd get staff list from contract events
          setStaffMembers(mockStaffMembers);
        } else {
          setStaffMembers(mockStaffMembers);
        }
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
      const hash = await addStaffWithRole(newStaffAddress.trim(), newStaffRole);
      if (hash) {
        toast({
          title: "Staff Added Successfully",
          description: `Added ${newStaffAddress.substring(0, 8)}... as ${roleNames[newStaffRole]}`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });

        // Add to local state (in real app, refetch from contract)
        const newStaffMember = {
          address: newStaffAddress.trim(),
          role: newStaffRole,
          addedBy: "organizer",
          addedAt: new Date().toISOString(),
        };
        setStaffMembers([...staffMembers, newStaffMember]);

        // Reset form
        setNewStaffAddress("");
        setNewStaffRole(1);
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
      const hash = await removeStaffRole(staffAddress);
      if (hash) {
        toast({
          title: "Staff Removed",
          description: `Removed ${staffAddress.substring(0, 8)}... from staff`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });

        // Remove from local state
        setStaffMembers(staffMembers.filter(staff => staff.address !== staffAddress));
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

  const getRoleBadgeColor = (role: number) => {
    switch (role) {
      case 1: return "blue";    // SCANNER
      case 2: return "green";   // CHECKIN
      case 3: return "purple";  // MANAGER
      default: return "gray";
    }
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
            <AlertTitle>Staff Roles:</AlertTitle>
            <AlertDescription>
              <strong>SCANNER:</strong> Can scan QR codes and validate tickets • 
              <strong>CHECKIN:</strong> Can perform bulk check-ins • 
              <strong>MANAGER:</strong> Can assign and manage other staff
            </AlertDescription>
          </Box>
        </Alert>

        {/* Staff Table */}
        <Box bg="white" borderRadius="lg" overflow="hidden" border="1px solid" borderColor="gray.200">
          {staffMembers.length === 0 ? (
            <Flex direction="column" align="center" justify="center" py={12}>
              <Text color="gray.500" fontSize="lg">No staff members added yet</Text>
              <Text color="gray.400" fontSize="sm" mt={2}>
                Add staff members to help manage your event
              </Text>
            </Flex>
          ) : (
            <Table variant="simple">
              <Thead bg="gray.50">
                <Tr>
                  <Th>Wallet Address</Th>
                  <Th>Role</Th>
                  <Th>Added</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {staffMembers.map((staff) => (
                  <Tr key={staff.address}>
                    <Td>
                      <Text fontFamily="mono" fontSize="sm">
                        {staff.address.substring(0, 8)}...{staff.address.substring(staff.address.length - 6)}
                      </Text>
                    </Td>
                    <Td>
                      <Badge colorScheme={getRoleBadgeColor(staff.role)}>
                        {roleNames[staff.role]}
                      </Badge>
                    </Td>
                    <Td>
                      <Text fontSize="sm" color="gray.600">
                        {new Date(staff.addedAt).toLocaleDateString()}
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
                <FormControl>
                  <FormLabel>Role</FormLabel>
                  <Select
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(Number(e.target.value))}
                  >
                    <option value={1}>SCANNER - Can scan QR codes</option>
                    <option value={2}>CHECKIN - Can perform bulk check-ins</option>
                    <option value={3}>MANAGER - Can manage other staff</option>
                  </Select>
                </FormControl>
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