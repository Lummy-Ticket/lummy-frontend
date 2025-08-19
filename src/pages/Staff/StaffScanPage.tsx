import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Badge,
  Alert,
  AlertIcon,
  Spinner,
  Icon,
  Grid,
  GridItem,
  Flex,
  Divider,
  useToast,
} from "@chakra-ui/react";
import {
  ArrowBackIcon,
  CheckIcon,
  CloseIcon,
} from "@chakra-ui/icons";
import {
  FaTicketAlt,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaUser,
  FaLink,
  FaClock,
} from "react-icons/fa";
import { useParams, useNavigate } from "react-router-dom";
import { useSmartContract } from "../../hooks/useSmartContract";
import { useAccount } from "wagmi";

interface TicketMetadata {
  tokenId: string;
  eventName: string;
  eventVenue: string;
  eventDate: string;
  tierName: string;
  organizerName: string;
  ownerAddress: string;
  status: string;
  originalPrice: string;
  serialNumber: string;
  isValid: boolean;
  canMarkAsUsed: boolean;
}

export const StaffScanPage: React.FC = () => {
  const { tokenId } = useParams<{ tokenId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { address, isConnected } = useAccount();
  const isMountedRef = useRef(true);

  const {
    validateTicketAsStaff,
    updateTicketStatus,
    hasStaffRole,
  } = useSmartContract();

  // Cleanup ref on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const [ticketData, setTicketData] = useState<TicketMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [staffRole, setStaffRole] = useState<number | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  // Extract pure token ID from URL parameter (remove "ticket-" prefix if present)
  const extractTokenId = (rawTokenId: string): string => {
    if (rawTokenId.startsWith('ticket-')) {
      return rawTokenId.replace('ticket-', '');
    }
    return rawTokenId;
  };

  // Check staff access and load ticket data
  useEffect(() => {
    const loadTicketAndCheckAccess = async () => {
      if (!tokenId || !isConnected || !address) {
        if (isMountedRef.current) {
          setError("Please connect your wallet to access this page");
          setIsLoading(false);
        }
        return;
      }

      // Prevent concurrent executions
      if (isLoading) {
        console.log("⏸️ Already loading, skipping execution");
        return;
      }

      // Extract clean token ID for contract calls
      const cleanTokenId = extractTokenId(tokenId);
      console.log(`🎯 Token ID conversion: ${tokenId} → ${cleanTokenId}`);

      try {
        if (isMountedRef.current) {
          setIsLoading(true);
          setError(null);
        }

        // Check staff role first
        console.log("🔍 Checking staff access for:", address);
        const hasScanner = await hasStaffRole(1); // SCANNER role
        const hasCheckin = await hasStaffRole(2); // CHECKIN role
        const hasManager = await hasStaffRole(3); // MANAGER role

        const roleLevel = hasManager ? 3 : hasCheckin ? 2 : hasScanner ? 1 : 0;
        
        if (isMountedRef.current) {
          setStaffRole(roleLevel);
        }

        if (roleLevel === 0) {
          console.log("❌ No staff access - redirecting to public page");
          if (isMountedRef.current) {
            setHasAccess(false);
            
            toast({
              title: "Staff Access Required",
              description: "You need SCANNER role or higher to scan tickets. Redirecting to public view...",
              status: "warning",
              duration: 5000,
              isClosable: true,
            });
          }

          // Redirect to public NFT page after 2 seconds
          setTimeout(() => {
            if (isMountedRef.current) {
              navigate(`/ticket/${tokenId}`);
            }
          }, 2000);
          return;
        }

        if (isMountedRef.current) {
          setHasAccess(true);
        }
        console.log(`✅ Staff access granted - Role level: ${roleLevel}`);

        // Load ticket metadata using contract functions
        console.log("📋 Loading ticket metadata for:", cleanTokenId);
        
        try {
          // Validate ticket with staff privileges first to get full data
          console.log("🔄 Starting ticket validation...");
          
          // Add retry logic for temporary network issues
          let validation = null;
          let retryCount = 0;
          const maxRetries = 3;
          
          while (retryCount < maxRetries && !validation) {
            try {
              console.log(`🔄 Validation attempt ${retryCount + 1}/${maxRetries}...`);
              validation = await validateTicketAsStaff(cleanTokenId);
              
              if (validation && typeof validation === 'object') {
                console.log(`✅ Validation successful on attempt ${retryCount + 1}:`, validation);
                break;
              } else {
                console.warn(`⚠️ Validation attempt ${retryCount + 1} returned:`, validation);
                retryCount++;
                if (retryCount < maxRetries) {
                  console.log(`🔄 Retrying in 1 second... (${retryCount}/${maxRetries})`);
                  await new Promise(resolve => setTimeout(resolve, 1000));
                }
              }
            } catch (attemptError) {
              console.error(`❌ Validation attempt ${retryCount + 1} failed:`, attemptError);
              retryCount++;
              if (retryCount < maxRetries) {
                console.log(`🔄 Retrying in 1 second after error... (${retryCount}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }
          }
          
          if (validation && typeof validation === 'object') {
            const ticketInfo: TicketMetadata = {
              tokenId: cleanTokenId,
              eventName: validation.eventName || "Unknown Event",
              eventVenue: validation.eventVenue || "Unknown Venue", 
              eventDate: "Event Date Available Soon", // Not available from validateTicketAsStaff
              tierName: validation.tierName || "Unknown Tier",
              organizerName: "Event Organizer", // Not available from validateTicketAsStaff
              ownerAddress: validation.owner || "Unknown Owner",
              status: validation.status || "unknown",
              originalPrice: validation.originalPrice ? `${Number(validation.originalPrice) / 1e18} IDRX` : "Unknown",
              serialNumber: validation.transferCount?.toString() || "Unknown",
              isValid: validation.isValid || false,
              canMarkAsUsed: validation.canMarkAsUsed || validation.status === "valid"
            };

            if (isMountedRef.current) {
              setTicketData(ticketInfo);
              console.log("✅ Final ticket data loaded:", ticketInfo);
            }

          } else {
            console.error("❌ All validation attempts failed. Final result:", validation);
            throw new Error(`Ticket validation failed after ${maxRetries} attempts - unable to load ticket data`);
          }

        } catch (metadataError) {
          console.error("❌ Error in ticket validation process:", metadataError);
          if (isMountedRef.current) {
            setError(`Failed to load ticket metadata: ${(metadataError as Error).message}`);
          }
        }

      } catch (err) {
        console.error("Error loading ticket data:", err);
        if (isMountedRef.current) {
          setError(`Failed to validate ticket: ${(err as Error).message}`);
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    // Prevent multiple concurrent executions
    if (!isLoading) {
      loadTicketAndCheckAccess();
    }
  }, [tokenId, address, isConnected]); // Remove function dependencies that cause re-execution

  const handleMarkAsUsed = async () => {
    if (!tokenId || !ticketData) return;

    try {
      setIsUpdating(true);
      
      const cleanTokenId = extractTokenId(tokenId);
      console.log(`🎯 Marking ticket ${cleanTokenId} as used by staff`);
      const hash = await updateTicketStatus(cleanTokenId);
      
      if (hash) {
        // Update local state
        setTicketData({
          ...ticketData,
          status: "used",
          isValid: false,
          canMarkAsUsed: false
        });

        toast({
          title: "✅ Ticket Marked as Used",
          description: `Ticket ${cleanTokenId.substring(0, 8)}... has been successfully marked as used`,
          status: "success",
          duration: 7000,
          isClosable: true,
        });

        console.log(`✅ SUCCESS: Ticket marked as used. Transaction: ${hash}`);
      }

    } catch (error) {
      console.error("❌ Error marking ticket as used:", error);
      toast({
        title: "Failed to Mark as Used",
        description: `Error: ${(error as Error).message}`,
        status: "error",
        duration: 7000,
        isClosable: true,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "valid":
        return "green";
      case "used":
        return "gray";
      case "refunded":
        return "orange";
      case "expired":
        return "red";
      default:
        return "gray";
    }
  };

  const getRoleText = (level: number) => {
    switch (level) {
      case 3: return "MANAGER";
      case 2: return "CHECKIN";
      case 1: return "SCANNER";
      default: return "NONE";
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Container maxW="container.md" py={8}>
        <Box textAlign="center">
          <Spinner size="xl" color="purple.500" />
          <Text mt={4} color="gray.600">
            Verifying staff access and loading ticket data...
          </Text>
        </Box>
      </Container>
    );
  }

  // No access state
  if (hasAccess === false) {
    return (
      <Container maxW="container.md" py={8}>
        <Alert status="warning" borderRadius="md">
          <AlertIcon />
          <VStack align="start" spacing={2}>
            <Text fontWeight="medium">
              Staff Access Required
            </Text>
            <Text fontSize="sm">
              You need SCANNER role or higher to scan tickets. Redirecting to public view...
            </Text>
          </VStack>
        </Alert>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container maxW="container.md" py={8}>
        <VStack spacing={6}>
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <VStack align="start">
              <Text fontWeight="medium">
                Error Loading Ticket
              </Text>
              <Text fontSize="sm">
                {error}
              </Text>
            </VStack>
          </Alert>

          <HStack spacing={4}>
            <Button
              leftIcon={<ArrowBackIcon />}
              onClick={() => navigate(-1)}
              variant="outline"
            >
              Go Back
            </Button>
            <Button
              colorScheme="blue"
              onClick={() => navigate(`/ticket/${tokenId}`)}
            >
              View Public Page
            </Button>
          </HStack>
        </VStack>
      </Container>
    );
  }

  // Main scanner interface
  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={8} align="stretch">
        
        {/* Header */}
        <Flex justify="space-between" align="center">
          <HStack>
            <Button
              leftIcon={<ArrowBackIcon />}
              variant="ghost"
              onClick={() => navigate(-1)}
            >
              Back
            </Button>
            <Box>
              <Heading size="lg">Staff Ticket Scanner</Heading>
              <Text color="gray.600">
                Scan and validate NFT tickets
              </Text>
            </Box>
          </HStack>

          <VStack align="end" spacing={1}>
            <Badge
              colorScheme="purple"
              variant="solid"
              borderRadius="full"
              px={3}
              py={1}
            >
              {getRoleText(staffRole || 0)} Access
            </Badge>
            <Text fontSize="xs" color="gray.500">
              Token ID: {tokenId}
            </Text>
          </VStack>
        </Flex>

        {/* Ticket Validation Result */}
        <Box
          borderWidth="2px"
          borderRadius="lg"
          overflow="hidden"
          bg="white"
          borderColor={ticketData?.isValid ? "green.200" : "red.200"}
          boxShadow="lg"
        >
          {/* Status Header */}
          <Box 
            bg={ticketData?.isValid ? "green.500" : "red.500"} 
            color="white" 
            py={4} 
            px={6}
          >
            <HStack justify="space-between">
              <HStack>
                <Icon 
                  as={ticketData?.isValid ? CheckIcon : CloseIcon} 
                  fontSize="xl" 
                />
                <Text fontSize="xl" fontWeight="bold">
                  {ticketData?.isValid ? "Valid Ticket ✅" : "Invalid Ticket ❌"}
                </Text>
              </HStack>
              
              <Badge
                colorScheme={getStatusColor(ticketData?.status || "")}
                variant="solid"
                borderRadius="full"
                px={3}
                py={1}
                fontSize="md"
                textTransform="uppercase"
              >
                {ticketData?.status || "unknown"}
              </Badge>
            </HStack>
          </Box>

          {/* Ticket Details */}
          <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={8} p={6}>
            
            {/* Event Information */}
            <GridItem>
              <VStack align="start" spacing={4}>
                <Box width="100%">
                  <Text fontWeight="bold" fontSize="lg" mb={3} color="purple.600">
                    📅 Event Information
                  </Text>
                  
                  <VStack align="start" spacing={3}>
                    <HStack>
                      <Icon as={FaTicketAlt} color="gray.500" />
                      <Box>
                        <Text fontWeight="medium">Event</Text>
                        <Text color="gray.700">{ticketData?.eventName}</Text>
                      </Box>
                    </HStack>

                    <HStack>
                      <Icon as={FaMapMarkerAlt} color="gray.500" />
                      <Box>
                        <Text fontWeight="medium">Venue</Text>
                        <Text color="gray.700">{ticketData?.eventVenue}</Text>
                      </Box>
                    </HStack>

                    <HStack>
                      <Icon as={FaCalendarAlt} color="gray.500" />
                      <Box>
                        <Text fontWeight="medium">Date & Time</Text>
                        <Text color="gray.700">{ticketData?.eventDate}</Text>
                      </Box>
                    </HStack>

                    <HStack>
                      <Icon as={FaUser} color="gray.500" />
                      <Box>
                        <Text fontWeight="medium">Organizer</Text>
                        <Text color="gray.700">{ticketData?.organizerName}</Text>
                      </Box>
                    </HStack>
                  </VStack>
                </Box>
              </VStack>
            </GridItem>

            {/* Ticket Information */}
            <GridItem>
              <VStack align="start" spacing={4}>
                <Box width="100%">
                  <Text fontWeight="bold" fontSize="lg" mb={3} color="purple.600">
                    🎫 Ticket Details
                  </Text>
                  
                  <VStack align="start" spacing={3}>
                    <HStack>
                      <Icon as={FaTicketAlt} color="gray.500" />
                      <Box>
                        <Text fontWeight="medium">Tier</Text>
                        <Text color="gray.700">{ticketData?.tierName}</Text>
                      </Box>
                    </HStack>

                    <HStack>
                      <Icon as={FaLink} color="gray.500" />
                      <Box>
                        <Text fontWeight="medium">Token ID</Text>
                        <Text color="gray.700" fontFamily="mono" fontSize="sm">
                          {ticketData?.tokenId}
                        </Text>
                      </Box>
                    </HStack>

                    <HStack>
                      <Icon as={FaClock} color="gray.500" />
                      <Box>
                        <Text fontWeight="medium">Serial Number</Text>
                        <Text color="gray.700">{ticketData?.serialNumber}</Text>
                      </Box>
                    </HStack>

                    <HStack>
                      <Icon as={FaUser} color="gray.500" />
                      <Box>
                        <Text fontWeight="medium">Original Price</Text>
                        <Text color="gray.700">{ticketData?.originalPrice}</Text>
                      </Box>
                    </HStack>

                    <HStack>
                      <Icon as={FaUser} color="gray.500" />
                      <Box>
                        <Text fontWeight="medium">Owner</Text>
                        <Text color="gray.700" fontFamily="mono" fontSize="sm">
                          {ticketData?.ownerAddress.substring(0, 8)}...
                          {ticketData?.ownerAddress.substring(ticketData?.ownerAddress.length - 6)}
                        </Text>
                      </Box>
                    </HStack>
                  </VStack>
                </Box>
              </VStack>
            </GridItem>

          </Grid>

          {/* Action Buttons */}
          <Box px={6} pb={6}>
            <Divider mb={4} />
            
            {ticketData?.isValid && ticketData?.canMarkAsUsed ? (
              <VStack spacing={4}>
                <Alert status="success" borderRadius="md">
                  <AlertIcon />
                  <Text>
                    ✅ This ticket is valid and ready to be marked as used for event entry.
                  </Text>
                </Alert>
                
                <Button
                  colorScheme="green"
                  size="lg"
                  width="100%"
                  onClick={handleMarkAsUsed}
                  isLoading={isUpdating}
                  loadingText="Marking as Used..."
                  leftIcon={<CheckIcon />}
                >
                  Mark as Used - Allow Entry ✓
                </Button>
              </VStack>
            ) : (
              <Alert 
                status={ticketData?.status === "used" ? "info" : "error"} 
                borderRadius="md"
              >
                <AlertIcon />
                <Text>
                  {ticketData?.status === "used" 
                    ? "🎫 This ticket has already been used for event entry." 
                    : `❌ This ticket cannot be used. Status: ${ticketData?.status || "unknown"}`
                  }
                </Text>
              </Alert>
            )}

            <HStack mt={4} justify="center" spacing={4}>
              <Button
                variant="outline"
                onClick={() => navigate(`/ticket/${tokenId}`)}
                leftIcon={<Icon as={FaLink} />}
              >
                View Public Page
              </Button>
              
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                leftIcon={<Icon as={FaClock} />}
              >
                Refresh Data
              </Button>
            </HStack>
          </Box>
        </Box>

        {/* Footer Info */}
        <Box 
          bg="blue.50" 
          borderRadius="md" 
          p={4} 
          borderWidth="1px" 
          borderColor="blue.200"
        >
          <Text fontSize="sm" color="blue.700" textAlign="center">
            🔒 This page requires staff privileges. Your role: <strong>{getRoleText(staffRole || 0)}</strong>
            <br />
            Powered by Lummy Protocol - Blockchain-verified ticket scanning
          </Text>
        </Box>

      </VStack>
    </Container>
  );
};

export default StaffScanPage;