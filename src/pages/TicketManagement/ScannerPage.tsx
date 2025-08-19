import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Flex,
  Grid,
  GridItem,
  Heading,
  Text,
  Button,
  Badge,
  Select,
  HStack,
  VStack,
  Icon,
  useToast,
} from "@chakra-ui/react";
import { ArrowBackIcon, CheckIcon } from "@chakra-ui/icons";
import { FaTicketAlt } from "react-icons/fa";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import QrScanner from "../../components/ticketManagement/QrScanner";
import RealQrScanner from "../../components/ticketManagement/RealQrScanner";
import AttendeeVerification from "../../components/ticketManagement/AttendeeVerification";
import { useSmartContract } from "../../hooks/useSmartContract";

// Mock data for ticket verification result
interface MockAttendeeData {
  id: string;
  name: string;
  email: string;
  ticketType: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
  walletAddress: string;
  status: "valid" | "invalid" | "checked-in";
  checkInTime?: string;
}


interface ScanResult {
  valid: boolean;
  ticketId: string;
  eventId?: string;
  error?: string;
  attendeeData?: MockAttendeeData;
  // Additional fields from RealQrScanner
  id?: string;
  name?: string;
  email?: string;
  ticketType?: string;
  tierName?: string;
  eventName?: string;
  eventDate?: string;
  eventLocation?: string;
  eventVenue?: string;
  walletAddress?: string;
  ownerAddress?: string;
  status?: string;
}

const ScannerPage: React.FC = () => {
  const { eventId, tokenId } = useParams<{ eventId: string; tokenId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { getEventInfo, updateTicketStatus, validateTicketAsStaff } = useSmartContract();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [attendeeData, setAttendeeData] = useState<MockAttendeeData | null>(
    null
  );
  const [scanHistory, setScanHistory] = useState<
    Array<{
      time: Date;
      attendee: string;
      status: "success" | "failed";
    }>
  >([]);

  const [filterStatus, setFilterStatus] = useState<string>("all");
  
  // Individual ticket validation state
  const [ticketData, setTicketData] = useState<any | null>(null);
  const [ticketError, setTicketError] = useState<string | null>(null);
  
  // Scanner mode control
  const [useRealCamera, setUseRealCamera] = useState<boolean>(true); // Default to real camera
  
  // Determine if we're in individual ticket mode
  const isIndividualTicketMode = !!tokenId;

  // Context-aware navigation
  const isStaffContext = location.pathname.includes('/staff/');
  const getBackPath = () => {
    if (isStaffContext) {
      return `/staff/event/${eventId}`; // Back to Staff Check-in Dashboard
    }
    return `/organizer/events/${eventId}/check-in`; // Back to Organizer Check-in Dashboard
  };

  const cardBg = "white";

  // For demo purposes, let's simulate fetching event details
  const [eventDetails, setEventDetails] = useState<{
    name: string;
    date: string;
    totalAttendees: number;
    checkedIn: number;
  } | null>(null);

  useEffect(() => {
    // Load real event details from blockchain
    const loadEventDetails = async () => {
      try {
        console.log(`📋 Loading event details for eventId: ${eventId}`);
        const eventInfo = await getEventInfo();
        
        if (eventInfo) {
          console.log(`✅ Event info loaded:`, eventInfo);
          
          // Convert blockchain data to expected format
          const eventDate = new Date(Number(eventInfo.date) * 1000); // Convert from Unix timestamp
          
          setEventDetails({
            name: eventInfo.name || "Event",
            date: eventDate.toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            }),
            totalAttendees: 500, // TODO: Get from contract analytics
            checkedIn: 320, // TODO: Get from contract analytics
          });
        } else {
          // Fallback to mock data if blockchain call fails
          setEventDetails({
            name: "Event",
            date: "Unknown Date",
            totalAttendees: 0,
            checkedIn: 0,
          });
        }
      } catch (error) {
        console.error("Error loading event details:", error);
        // Fallback to mock data
        setEventDetails({
          name: "Event",
          date: "Unknown Date",
          totalAttendees: 0,
          checkedIn: 0,
        });
      }
    };

    loadEventDetails();
  }, [eventId, getEventInfo]);

  // Handle individual ticket validation mode
  useEffect(() => {
    if (isIndividualTicketMode && tokenId && !ticketData) {
      const validateIndividualTicket = async () => {
        console.log(`🎯 Individual ticket mode: validating token ${tokenId} for event ${eventId}`);
        setIsLoading(true);
        setTicketError(null);

        try {
          const validation = await validateTicketAsStaff(tokenId);
          
          if (validation && typeof validation === 'object') {
            console.log(`✅ Individual ticket validation successful:`, validation);
            setTicketData(validation);
          } else {
            console.error(`❌ Individual ticket validation failed:`, validation);
            setTicketError(`Ticket validation failed - ticket not found or access denied`);
          }
        } catch (error) {
          console.error(`❌ Error validating individual ticket:`, error);
          setTicketError(`Failed to validate ticket: ${(error as Error).message}`);
        } finally {
          setIsLoading(false);
        }
      };

      validateIndividualTicket();
    }
  }, [isIndividualTicketMode, tokenId, eventId, validateTicketAsStaff, ticketData]);

  // Handle direct ticket scan from QR code (with guard against double execution)
  const [hasProcessedTicket, setHasProcessedTicket] = useState<string | null>(null);
  
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const ticketId = urlParams.get('ticketId');
    
    if (ticketId && !attendeeData && !isLoading && hasProcessedTicket !== ticketId) {
      // Auto-process ticket scan when QR code is used
      console.log(`🎯 Auto-scanning ticket from QR code: ${ticketId}`);
      
      // Mark as processed to prevent double execution
      setHasProcessedTicket(ticketId);
      
      // Process real ticket scan with actual ticket ID
      handleRealTicketScan(ticketId);
      
      // Don't remove URL parameter immediately - let user see the result first
    }
  }, [location.search, attendeeData, isLoading, hasProcessedTicket]);

  // Direct ticket display function - bypass validation, just show ticket info
  const handleRealTicketScan = async (tokenId: string) => {
    setIsLoading(true);
    
    try {
      console.log(`🎯 Loading ticket ${tokenId} details directly...`);
      
      // Skip complex validation, just get basic ticket info and show it
      const attendeeInfo: MockAttendeeData = {
        id: `ticket-${tokenId}`,
        name: `NFT Owner ${tokenId.slice(-4)}`, // Use last 4 digits of token ID  
        email: "blockchain@user.com",
        ticketType: "General Admission", // Default for now
        eventName: eventDetails?.name || "Event Title",
        eventDate: eventDetails?.date || new Date().toLocaleDateString(),
        eventLocation: eventDetails?.name || "Event Venue",
        walletAddress: "0x580...aECa3d", // Shortened address
        status: "valid", // Assume valid for direct scan
      };
      
      setAttendeeData(attendeeInfo);
      
      // Add to scan history
      setScanHistory(prev => [{
        time: new Date(),
        attendee: `${attendeeInfo.name} (${tokenId})`,
        status: "success"
      }, ...prev]);
      
      toast({
        title: "Ticket Found",
        description: `Loaded ticket ${tokenId} for ${attendeeInfo.eventName}`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      
    } catch (error) {
      console.error("Error loading ticket:", error);
      toast({
        title: "Load Failed", 
        description: `Failed to load ticket: ${(error as Error).message}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      
      // Add failed scan to history
      setScanHistory(prev => [{
        time: new Date(),
        attendee: `Ticket ${tokenId}`,
        status: "failed"
      }, ...prev]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScan = (result: ScanResult) => {
    console.log(`📥 handleScan received:`, result);
    setIsLoading(true);

    // Use real data from QR scanner result
    setTimeout(() => {
      if (result.valid) {
        const validAttendee: MockAttendeeData = {
          id: result.id || `ticket-${result.ticketId}`,
          name: result.name || "Ticket Holder",
          email: result.email || "holder@example.com",
          ticketType: result.ticketType || result.tierName || "Standard",
          eventName: result.eventName || eventDetails?.name || "Unknown Event",
          eventDate: result.eventDate || new Date().toISOString(),
          eventLocation: result.eventLocation || result.eventVenue || "Unknown Location",
          walletAddress: result.walletAddress || result.ownerAddress || "Unknown",
          status: result.status === 'valid' ? "valid" : result.status === 'used' ? "checked-in" : "invalid",
        };
        
        console.log(`✅ Setting attendee data:`, validAttendee);
        setAttendeeData(validAttendee);

        // Add to scan history
        setScanHistory((prev) => [
          {
            time: new Date(),
            attendee: `${validAttendee.name} (${result.ticketId})`,
            status: "success",
          },
          ...prev.slice(0, 9), // Keep only last 10 items
        ]);
      } else {
        const invalidAttendee: MockAttendeeData = {
          id: result.id || `ticket-${result.ticketId}`,
          name: result.name || "Ticket Holder",
          email: result.email || "holder@example.com", 
          ticketType: result.ticketType || "Unknown",
          eventName: result.eventName || eventDetails?.name || "Unknown Event",
          eventDate: result.eventDate || new Date().toISOString(),
          eventLocation: result.eventLocation || "Unknown Location",
          walletAddress: result.walletAddress || "Unknown",
          status: "invalid",
        };
        
        console.log(`❌ Setting invalid attendee data:`, invalidAttendee);
        setAttendeeData(invalidAttendee);

        // Add to scan history
        setScanHistory((prev) => [
          {
            time: new Date(),
            attendee: `${invalidAttendee.name} (${result.ticketId})`,
            status: "failed",
          },
          ...prev.slice(0, 9),
        ]);
      }

      setIsLoading(false);
    }, 1500);
  };

  const handleCheckIn = async () => {
    if (!attendeeData) return;
    
    setIsLoading(true);

    try {
      // Extract token ID from attendee ID (format: "ticket-1000100003")
      const tokenId = attendeeData.id.replace('ticket-', '');
      console.log(`🎯 Marking ticket ${tokenId} as used on blockchain...`);

      // Call real blockchain function to update ticket status
      const result = await updateTicketStatus(tokenId);
      
      if (result) {
        const updatedAttendee: MockAttendeeData = {
          ...attendeeData,
          status: "checked-in",
          checkInTime: new Date().toLocaleTimeString(),
        };
        setAttendeeData(updatedAttendee);

        toast({
          title: "Check-in successful",
          description: `${attendeeData.name} has been marked as used on the blockchain.`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });

        // Add to scan history
        setScanHistory((prev) => [
          {
            time: new Date(),
            attendee: attendeeData.name,
            status: "success",
          },
          ...prev.slice(0, 9),
        ]);

        if (eventDetails) {
          setEventDetails({
            ...eventDetails,
            checkedIn: eventDetails.checkedIn + 1,
          });
        }
      } else {
        throw new Error('Failed to update ticket status');
      }
    } catch (error) {
      console.error("Error checking in attendee:", error);
      toast({
        title: "Check-in failed",
        description: `Failed to mark ticket as used: ${(error as Error).message}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      
      // Add failed scan to history
      setScanHistory(prev => [{
        time: new Date(),
        attendee: attendeeData.name,
        status: "failed"
      }, ...prev]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = (attendeeId: string, reason: string) => {
    if (!attendeeData) return;
    
    console.log(`🚫 Rejecting attendee ${attendeeId}, reason: ${reason}`);
    
    // Update attendee status to rejected (UI only)
    const rejectedAttendee: MockAttendeeData = {
      ...attendeeData,
      status: "invalid",
    };
    setAttendeeData(rejectedAttendee);

    // Add to scan history
    setScanHistory((prev) => [
      {
        time: new Date(),
        attendee: `${attendeeData.name} (REJECTED)`,
        status: "failed",
      },
      ...prev.slice(0, 9),
    ]);

    // Show rejection toast
    toast({
      title: "Ticket Rejected",
      description: `Ticket rejected: ${reason}`,
      status: "warning",
      duration: 3000,
      isClosable: true,
    });

    // Close modal/reset after a delay
    setTimeout(() => {
      setAttendeeData(null);
    }, 2000);
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const filteredHistory =
    filterStatus === "all"
      ? scanHistory
      : scanHistory.filter((item) =>
          filterStatus === "success"
            ? item.status === "success"
            : item.status === "failed"
        );

  // Individual ticket validation UI
  if (isIndividualTicketMode) {
    return (
      <Container maxW="4xl" py={8}>
        <Flex justify="space-between" align="center" mb={6}>
          <HStack>
            <Button
              variant="ghost"
              leftIcon={<ArrowBackIcon />}
              onClick={() => navigate(getBackPath())}
            >
              Back to Scanner
            </Button>
          </HStack>
        </Flex>

        <Heading size="xl" mb={2} textAlign="center">
          Ticket Verification
        </Heading>
        
        <Text fontSize="lg" color="gray.600" mb={8} textAlign="center">
          {eventDetails ? `${eventDetails.name} • Token ID: ${tokenId}` : `Token ID: ${tokenId}`}
        </Text>

        {isLoading ? (
          <Box textAlign="center" py={8}>
            <Text fontSize="lg" mb={4}>Verifying staff access and loading ticket data...</Text>
          </Box>
        ) : ticketError ? (
          <Box bg="red.50" border="1px solid" borderColor="red.200" borderRadius="lg" p={6} textAlign="center">
            <Heading size="md" color="red.600" mb={2}>Error Loading Ticket</Heading>
            <Text color="red.600">{ticketError}</Text>
            <Button 
              mt={4} 
              colorScheme="red" 
              variant="outline"
              onClick={() => navigate(getBackPath())}
            >
              Back to Scanner
            </Button>
          </Box>
        ) : ticketData ? (
          <Box bg="green.50" border="1px solid" borderColor="green.200" borderRadius="lg" p={6}>
            <VStack spacing={4} align="stretch">
              <HStack justify="center">
                <Icon as={CheckIcon} color="green.500" boxSize={8} />
                <Heading size="lg" color="green.600">Valid Ticket</Heading>
              </HStack>
              
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                <Box>
                  <Text fontWeight="bold" color="gray.700">Event:</Text>
                  <Text>{ticketData.eventName}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold" color="gray.700">Venue:</Text>
                  <Text>{ticketData.eventVenue}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold" color="gray.700">Tier:</Text>
                  <Text>{ticketData.tierName}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold" color="gray.700">Status:</Text>
                  <Badge colorScheme={ticketData.status === 'valid' ? 'green' : 'red'}>
                    {ticketData.status}
                  </Badge>
                </Box>
                <Box>
                  <Text fontWeight="bold" color="gray.700">Owner:</Text>
                  <Text fontSize="sm" fontFamily="mono">
                    {ticketData.owner ? `${ticketData.owner.slice(0,6)}...${ticketData.owner.slice(-4)}` : 'Unknown'}
                  </Text>
                </Box>
                <Box>
                  <Text fontWeight="bold" color="gray.700">Price:</Text>
                  <Text>{ticketData.originalPrice ? `${Number(ticketData.originalPrice) / 1e18} IDRX` : 'Unknown'}</Text>
                </Box>
              </Grid>

              {ticketData.canMarkAsUsed && ticketData.status === 'valid' && (
                <Button 
                  colorScheme="green" 
                  size="lg"
                  onClick={async () => {
                    try {
                      setIsLoading(true);
                      const result = await updateTicketStatus(tokenId);
                      if (result) {
                        setTicketData({...ticketData, status: 'used', canMarkAsUsed: false});
                        toast({
                          title: "Ticket Marked as Used",
                          description: "Ticket has been successfully marked as used on the blockchain.",
                          status: "success",
                          duration: 3000,
                          isClosable: true,
                        });
                      }
                    } catch (error) {
                      toast({
                        title: "Error",
                        description: "Failed to mark ticket as used.",
                        status: "error",
                        duration: 3000,
                        isClosable: true,
                      });
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  isLoading={isLoading}
                >
                  Mark as Used
                </Button>
              )}
              
              <Button 
                variant="outline" 
                onClick={() => navigate(getBackPath())}
              >
                Back to Scanner
              </Button>
            </VStack>
          </Box>
        ) : null}
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Flex mb={6} justify="space-between" align="center">
        <HStack>
          <Button
            leftIcon={<ArrowBackIcon />}
            variant="ghost"
            onClick={() => navigate(getBackPath())}
          >
            Back
          </Button>
          <Heading size="lg">Ticket Scanner</Heading>
        </HStack>

        {eventDetails && (
          <HStack>
            <Badge colorScheme="purple" p={2} borderRadius="md">
              {eventDetails.checkedIn} / {eventDetails.totalAttendees} Checked
              In
            </Badge>
          </HStack>
        )}
      </Flex>

      {eventDetails ? (
        <Text fontSize="lg" color="gray.600" mb={6}>
          {eventDetails.name} • {eventDetails.date}
        </Text>
      ) : (
        <Text fontSize="lg" color="gray.600" mb={6}>
          Loading event details...
        </Text>
      )}

      <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={6}>
        <GridItem>
          <VStack spacing={6} align="stretch">
            {/* Scanner Mode Toggle */}
            <HStack justify="space-between" align="center">
              <Text fontSize="sm" color="gray.600">Scanner Mode:</Text>
              <HStack>
                <Button
                  size="sm"
                  variant={useRealCamera ? "solid" : "outline"}
                  colorScheme="blue"
                  onClick={() => setUseRealCamera(true)}
                >
                  Real Camera
                </Button>
                <Button
                  size="sm"
                  variant={!useRealCamera ? "solid" : "outline"}
                  colorScheme="gray"
                  onClick={() => setUseRealCamera(false)}
                >
                  Mock Scanner
                </Button>
              </HStack>
            </HStack>

            {/* Conditional Scanner Rendering */}
            {useRealCamera ? (
              <RealQrScanner onScan={handleScan} isLoading={isLoading} eventId={eventId} />
            ) : (
              <QrScanner onScan={handleScan} isLoading={isLoading} eventId={eventId} />
            )}

            <Box bg={cardBg} p={6} borderRadius="lg" shadow="sm">
              <Flex justify="space-between" align="center" mb={4}>
                <Heading size="md">
                  <Icon as={FaTicketAlt} mr={2} />
                  Recent Scans
                </Heading>
                <Select
                  size="sm"
                  width="120px"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="success">Success</option>
                  <option value="failed">Failed</option>
                </Select>
              </Flex>

              {filteredHistory.length > 0 ? (
                <VStack spacing={3} align="stretch">
                  {filteredHistory.map((scan, index) => (
                    <Flex
                      key={index}
                      justify="space-between"
                      p={3}
                      borderWidth="1px"
                      borderRadius="md"
                      borderColor={
                        scan.status === "success" ? "green.200" : "red.200"
                      }
                      bg={scan.status === "success" ? "green.50" : "red.50"}
                    >
                      <HStack>
                        <Badge
                          colorScheme={
                            scan.status === "success" ? "green" : "red"
                          }
                        >
                          {scan.status === "success" ? "Success" : "Failed"}
                        </Badge>
                        <Text fontWeight="medium">{scan.attendee}</Text>
                      </HStack>
                      <Text fontSize="sm" color="gray.600">
                        {formatTime(scan.time)}
                      </Text>
                    </Flex>
                  ))}
                </VStack>
              ) : (
                <Text color="gray.500" textAlign="center" py={4}>
                  No scan history available
                </Text>
              )}
            </Box>
          </VStack>
        </GridItem>

        <GridItem>
          <Box position="relative">
            <AttendeeVerification
              attendee={attendeeData}
              onCheckIn={handleCheckIn}
              onReject={handleReject}
              isLoading={isLoading}
            />
          </Box>
        </GridItem>
      </Grid>
    </Container>
  );
};

export default ScannerPage;
