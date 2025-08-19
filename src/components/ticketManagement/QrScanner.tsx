import React, { useState, useRef } from "react";
import {
  Box,
  Button,
  VStack,
  Text,
  Flex,
  Icon,
  useToast,
} from "@chakra-ui/react";
import { CheckIcon, CloseIcon } from "@chakra-ui/icons";
import { FaQrcode } from "react-icons/fa";
import { DEVELOPMENT_CONFIG } from "../../constants";
import { useSmartContract } from "../../hooks/useSmartContract";

interface QrScannerProps {
  onScan: (ticketData: any) => void;
  isLoading?: boolean;
  eventId?: string; // Current event context for validation
}

// Contract-compatible ticket status values
type TicketStatus = 'valid' | 'used' | 'refunded';

// Mock scanner result data with Diamond pattern deterministic token IDs
const mockScanResults = [
  {
    valid: true,
    ticketId: "1001010001",        // Diamond format: 1[eventId][tier][sequential] 
    eventId: "event-1",
    ticketType: "VIP Pass",
    eventName: "Summer Music Festival",
    ownerName: "John Doe",
    ownerAddress: "0x1234567890abcdef1234567890abcdef12345678",
    status: "valid" as TicketStatus,
    canMarkUsed: true,             // Based on staff role
  },
  {
    valid: false,
    ticketId: "1000100002", 
    eventId: "event-1",
    error: "Ticket has already been used",
    ticketType: "General Admission",
    eventName: "Summer Music Festival",
    ownerName: "Jane Smith",
    ownerAddress: "0x2345678901bcdef2345678901bcdef23456789",
    status: "used" as TicketStatus,
    canMarkUsed: false,
  },
  {
    valid: false,
    ticketId: "1001020001",
    eventId: "event-1",
    error: "Ticket has been refunded",
    ticketType: "Weekend Pass",
    eventName: "Summer Music Festival",
    ownerAddress: "0x3456789012cdef3456789012cdef3456789012",
    status: "refunded" as TicketStatus,
    canMarkUsed: false,
  },
  {
    valid: true,
    ticketId: "1001100001",        // Different event, same Diamond format
    eventId: "event-2",
    ticketType: "General Admission",
    eventName: "Tech Conference 2025",
    ownerName: "Alice Chen",
    ownerAddress: "0x4567890123def4567890123def4567890123de",
    status: "valid" as TicketStatus,
    canMarkUsed: true,
  },
];

// QR Scanner with real data extraction support
const QrScanner: React.FC<QrScannerProps> = ({ onScan, isLoading = false, eventId }) => {
  const { validateTicketAsStaff, updateTicketStatus, hasStaffRole } = useSmartContract();
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [staffPrivileges, setStaffPrivileges] = useState<number | null>(null);
  const toast = useToast();

  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const borderColor = "gray.200";

  // QR Data extraction utility
  const extractQRData = (qrString: string) => {
    try {
      // Handle deep link format: lummy-ticket://scan/{tokenId}/{eventId}
      if (qrString.startsWith('lummy-ticket://scan/') || qrString.startsWith('mock://scan/')) {
        const parts = qrString.split('/');
        if (parts.length >= 4) {
          return {
            tokenId: parts[3],
            eventId: parts[4] || 'unknown',
            source: 'deeplink'
          };
        }
      }
      
      // Handle fallback URL format: https://lummy-ticket.vercel.app/scanner?token={tokenId}&event={eventId}
      if (qrString.includes('lummy-ticket.vercel.app/scanner')) {
        const url = new URL(qrString);
        const tokenId = url.searchParams.get('token');
        const eventIdParam = url.searchParams.get('event');
        if (tokenId) {
          return {
            tokenId,
            eventId: eventIdParam || 'unknown',
            source: 'url'
          };
        }
      }
      
      // Handle legacy or direct token format
      if (/^\d{10,}$/.test(qrString)) {
        return {
          tokenId: qrString,
          eventId: 'unknown',
          source: 'direct'
        };
      }
      
      return null;
    } catch (error) {
      console.error('QR data extraction error:', error);
      return null;
    }
  };

  // Real ticket validation via blockchain
  const validateRealTicket = async (tokenId: string) => {
    try {
      // Force real blockchain validation when user has staff privileges
      const shouldUseBlockchain = DEVELOPMENT_CONFIG.ENABLE_BLOCKCHAIN || (staffPrivileges && staffPrivileges >= 1);
      
      if (!shouldUseBlockchain) {
        // Return mock data only when blockchain disabled AND no staff privileges
        const mockResult = mockScanResults.find(r => r.ticketId === tokenId) || mockScanResults[0];
        return { ...mockResult, tokenId };
      }

      // Real blockchain validation with staff privileges
      const ticketData = await validateTicketAsStaff(tokenId);
      if (!ticketData) {
        return {
          valid: false,
          error: "Ticket not found or invalid",
          tokenId: tokenId,
          ownerAddress: 'Unknown Owner',
          status: 'invalid' as TicketStatus
        };
      }

      return {
        valid: ticketData.isValid || ticketData.status === 'valid',
        ticketId: tokenId,
        eventId: ticketData.eventId,
        ticketType: ticketData.tierName || 'Unknown Tier',
        eventName: ticketData.eventName || 'Unknown Event',
        ownerAddress: ticketData.owner || 'Unknown Owner',
        status: ticketData.status as TicketStatus,
        canMarkUsed: ticketData.canMarkAsUsed || false,
        error: !ticketData.isValid ? `Ticket is ${ticketData.status}` : undefined
      };
    } catch (error) {
      console.error('Ticket validation error:', error);
      return {
        valid: false,
        error: "Validation failed: " + (error as Error).message,
        tokenId: tokenId,
        ownerAddress: 'Unknown Owner',
        status: 'error' as TicketStatus
      };
    }
  };

  // Simulate QR code scanning with real data extraction
  const simulateQRScan = async () => {
    // Include real NFT token IDs from your blockchain
    // These should match the actual NFTs you own
    const realTokenIds = [
      '1001010001', // Your confirmed real NFT token ID
      '1000100002', 
      '1000100003',
      '1000100004',
      '1000100005',
    ];
    
    // Simulate different QR code formats being scanned with real token IDs
    const mockQRCodes = realTokenIds.map(tokenId => 
      `lummy-ticket://scan/${tokenId}/${eventId || '1'}`
    ).concat([
      // Also include some formats for variety  
      `mock://scan/1001010001/${eventId || '1'}`,
      `https://lummy-ticket.vercel.app/scanner?token=1001010001&event=${eventId || '1'}`,
      '1001010001' // Direct token ID
    ]);

    // For testing: Always prioritize real token ID first
    const randomQR = mockQRCodes[0]; // This will be your real NFT token ID
    
    if (DEVELOPMENT_CONFIG.LOG_CONTRACT_CALLS) {
      console.log('🎲 Available QR codes:', mockQRCodes.length);
      console.log('🎯 Selected QR:', randomQR);
    }
    
    // Extract token and event data
    const qrData = extractQRData(randomQR);
    if (!qrData) {
      return {
        valid: false,
        error: "Invalid QR code format",
        qrContent: randomQR,
        tokenId: 'unknown',
        ownerAddress: 'Unknown Owner',
        qrData: null
      };
    }

    // Validate event context if provided
    if (eventId && qrData.eventId !== 'unknown' && qrData.eventId !== eventId) {
      return {
        valid: false,
        error: `Ticket is for different event: ${qrData.eventId}`,
        tokenId: qrData.tokenId,
        ownerAddress: 'Unknown Owner',
        eventMismatch: true,
        qrData,
        qrContent: randomQR
      };
    }

    // Validate the ticket
    const validationResult = await validateRealTicket(qrData.tokenId);
    return {
      ...validationResult,
      qrData,
      qrContent: randomQR
    };
  };

  // Handle marking ticket as used
  const handleMarkAsUsed = async (tokenId: string) => {
    try {
      const hash = await updateTicketStatus(tokenId);
      if (hash) {
        // Success! Update the scan result to show new status
        setScanResult({
          ...scanResult,
          status: 'used',
          valid: false,
          canMarkUsed: false,
          error: undefined
        });

        toast({
          title: "Ticket Marked as Used ✅",
          description: `Ticket ${tokenId.substring(0, 8)}... is now marked as used`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });

        // Notify parent component
        if (onScan) {
          onScan({
            ...scanResult,
            status: 'used',
            valid: false,
            canMarkUsed: false
          });
        }

        if (DEVELOPMENT_CONFIG.LOG_CONTRACT_CALLS) {
          console.log("✅ Ticket marked as used:", { tokenId, hash });
        }
      }
    } catch (error) {
      console.error("Error marking ticket as used:", error);
      toast({
        title: "Failed to Mark as Used",
        description: "Could not update ticket status. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Direct function to mark real NFT as used - bypass validation
  const handleDirectMarkAsUsed = async (tokenId: string) => {
    try {
      console.log(`🎯 Direct Mark as Used: ${tokenId}`);
      
      const hash = await updateTicketStatus(tokenId);
      if (hash) {
        toast({
          title: "Success! 🎉",
          description: `Token ${tokenId} marked as used! Transaction: ${hash.substring(0, 10)}...`,
          status: "success",
          duration: 10000,
          isClosable: true,
        });

        console.log(`✅ SUCCESS: Token ${tokenId} marked as used:`, hash);
      } else {
        throw new Error("Transaction failed");
      }
    } catch (error) {
      console.error("❌ Error marking token as used:", error);
      toast({
        title: "Failed to Mark as Used",
        description: `Error: ${(error as Error).message}`,
        status: "error",
        duration: 10000,
        isClosable: true,
      });
    }
  };

  const handleToggleCamera = () => {
    if (isCameraActive) {
      setIsCameraActive(false);
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
      setScanResult(null);
    } else {
      setIsCameraActive(true);
      // Real QR scanning simulation with extraction logic
      scanIntervalRef.current = setInterval(async () => {
        // Only simulate a successful scan occasionally
        if (Math.random() > 0.7) {
          const scanResult = await simulateQRScan();
          setScanResult(scanResult);
          onScan(scanResult);

          // Enhanced toast with QR extraction info
          const statusMessage = scanResult.valid 
            ? `${(scanResult as any).ticketType || 'Ticket'} for ${(scanResult as any).eventName || 'Event'}` 
            : scanResult.error || 'Invalid ticket';

          const qrSource = (scanResult as any).qrData?.source ? ` (${(scanResult as any).qrData.source})` : '';
          
          toast({
            title: scanResult.valid ? "Valid Ticket ✅" : "Invalid Ticket ❌",
            description: `${statusMessage}${qrSource}`,
            status: scanResult.valid ? "success" : "error",
            duration: 6000,
            isClosable: true,
          });

          if (DEVELOPMENT_CONFIG.LOG_CONTRACT_CALLS && (scanResult as any).qrContent) {
            console.log('🔍 QR Scanned:', (scanResult as any).qrContent);
            console.log('📊 Extracted Data:', (scanResult as any).qrData);
            console.log('✅ Validation Result:', {
              valid: scanResult.valid,
              tokenId: (scanResult as any).tokenId,
              error: scanResult.error
            });
          }

          // Stop camera after successful scan
          setIsCameraActive(false);
          clearInterval(scanIntervalRef.current!);
          scanIntervalRef.current = null;
        }
      }, 2000); // Check every 2 seconds
    }
  };

  // Check staff privileges when component mounts
  React.useEffect(() => {
    const checkStaffPrivileges = async () => {
      if (DEVELOPMENT_CONFIG.ENABLE_BLOCKCHAIN) {
        try {
          const hasPrivileges = await hasStaffRole(1); // Check SCANNER role
          setStaffPrivileges(hasPrivileges ? 1 : 0);
          
          if (!hasPrivileges) {
            toast({
              title: "Staff Access Required",
              description: "You need SCANNER role or higher to use this scanner",
              status: "warning",
              duration: 5000,
              isClosable: true,
            });
          }
        } catch (error) {
          console.error("Error checking staff privileges:", error);
          setStaffPrivileges(0);
        }
      } else {
        // Mock mode - allow access for testing
        setStaffPrivileges(1);
      }
    };

    checkStaffPrivileges();
  }, [hasStaffRole, toast]);

  // Clean up on unmount
  React.useEffect(() => {
    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, []);

  return (
    <VStack spacing={4} align="stretch" width="100%">
      <Box
        width="100%"
        height="350px"
        borderWidth="1px"
        borderRadius="lg"
        borderColor={borderColor}
        overflow="hidden"
        bg={isCameraActive ? "black" : "gray.100"}
        display="flex"
        alignItems="center"
        justifyContent="center"
        position="relative"
      >
        {isCameraActive ? (
          <>
            <Text color="white">Camera Feed (Simulated)</Text>
            {/* Overlay scanner UI frame */}
            <Box
              position="absolute"
              width="200px"
              height="200px"
              border="2px solid white"
              borderRadius="md"
              opacity={0.7}
            />
            {/* Corner brackets */}
            {[
              { top: 0, left: 0 },
              { top: 0, right: 0 },
              { bottom: 0, left: 0 },
              { bottom: 0, right: 0 },
            ].map((pos, idx) => (
              <Box
                key={idx}
                position="absolute"
                width="30px"
                height="30px"
                {...pos}
                borderTop={pos.top === 0 ? "3px solid purple" : undefined}
                borderBottom={pos.bottom === 0 ? "3px solid purple" : undefined}
                borderLeft={pos.left === 0 ? "3px solid purple" : undefined}
                borderRight={pos.right === 0 ? "3px solid purple" : undefined}
              />
            ))}

            {/* Scanning animation */}
            <Box
              position="absolute"
              width="200px"
              height="2px"
              bg="purple.500"
              top="50%"
              animation="scanMove 2s infinite"
              sx={{
                "@keyframes scanMove": {
                  "0%": { transform: "translateY(-100px)" },
                  "50%": { transform: "translateY(100px)" },
                  "100%": { transform: "translateY(-100px)" },
                },
              }}
            />
          </>
        ) : (
          <>
            {!scanResult ? (
              <Flex direction="column" align="center">
                <Icon as={FaQrcode} fontSize="5xl" color="gray.400" mb={4} />
                <Text color="gray.500">
                  Press Start Camera to scan a ticket QR code
                </Text>
              </Flex>
            ) : (
              <Flex
                direction="column"
                align="center"
                justify="center"
                p={6}
                bg={scanResult.valid ? "green.50" : "red.50"}
                borderRadius="md"
                width="80%"
              >
                <Icon
                  as={scanResult.valid ? CheckIcon : CloseIcon}
                  color={scanResult.valid ? "green.500" : "red.500"}
                  fontSize="3xl"
                  mb={2}
                />
                <Text
                  fontSize="xl"
                  fontWeight="bold"
                  color={scanResult.valid ? "green.700" : "red.700"}
                >
                  {scanResult.valid ? "Ticket Valid" : "Ticket Invalid"}
                </Text>
                {!scanResult.valid && (
                  <Text color="red.600" mt={1}>
                    {scanResult.error}
                  </Text>
                )}
                <Divider my={4} />
                <VStack align="start" spacing={2} width="100%">
                  <HStack>
                    <Text fontWeight="medium">Ticket ID:</Text>
                    <Text fontFamily="mono">{scanResult.ticketId}</Text>
                  </HStack>
                  <HStack>
                    <Text fontWeight="medium">Type:</Text>
                    <Text>{scanResult.ticketType}</Text>
                  </HStack>
                  <HStack>
                    <Text fontWeight="medium">Event:</Text>
                    <Text>{scanResult.eventName}</Text>
                  </HStack>
                  <HStack>
                    <Text fontWeight="medium">Status:</Text>
                    <Box
                      px={2}
                      py={1}
                      borderRadius="md"
                      bg={scanResult.status === 'valid' ? 'green.100' : 
                          scanResult.status === 'used' ? 'orange.100' : 'red.100'}
                      color={scanResult.status === 'valid' ? 'green.800' : 
                             scanResult.status === 'used' ? 'orange.800' : 'red.800'}
                    >
                      <Text fontSize="sm" fontWeight="medium" textTransform="uppercase">
                        {scanResult.status}
                      </Text>
                    </Box>
                  </HStack>
                  {scanResult.ownerName && (
                    <HStack>
                      <Text fontWeight="medium">Name:</Text>
                      <Text>{scanResult.ownerName}</Text>
                    </HStack>
                  )}
                  {scanResult.ownerAddress && (
                    <HStack>
                      <Text fontWeight="medium">Wallet:</Text>
                      <Text fontSize="sm" fontFamily="monospace">
                        {scanResult.ownerAddress.substring(0, 8)}...
                        {scanResult.ownerAddress.substring(
                          scanResult.ownerAddress.length - 6
                        )}
                      </Text>
                    </HStack>
                  )}
                  {scanResult.valid && scanResult.canMarkUsed && (
                    <VStack mt={3} spacing={2} width="100%">
                      <Box p={3} bg="blue.50" borderRadius="md" width="100%">
                        <Text fontSize="sm" color="blue.700">
                          ✓ Ready to mark as used by staff
                        </Text>
                      </Box>
                      {staffPrivileges && staffPrivileges >= 1 && (
                        <Button
                          colorScheme="green"
                          size="md"
                          width="100%"
                          onClick={() => handleMarkAsUsed(scanResult.ticketId)}
                          isLoading={isLoading}
                          loadingText="Marking as Used..."
                        >
                          Mark as Used ✓
                        </Button>
                      )}
                    </VStack>
                  )}
                </VStack>
              </Flex>
            )}
          </>
        )}
      </Box>

      <Button
        colorScheme={isCameraActive ? "red" : "green"}
        leftIcon={<Icon as={isCameraActive ? CloseIcon : FaQrcode} />}
        onClick={handleToggleCamera}
        isLoading={isLoading}
        width="100%"
        isDisabled={DEVELOPMENT_CONFIG.ENABLE_BLOCKCHAIN && staffPrivileges === 0}
      >
        {isCameraActive ? "Stop Camera" : "Start Camera"}
      </Button>

      <Text fontSize="sm" color="gray.500" textAlign="center">
        {DEVELOPMENT_CONFIG.ENABLE_BLOCKCHAIN && staffPrivileges === 0 
          ? "Staff access required to use scanner" 
          : "Position the QR code within the frame to scan"
        }
      </Text>

      {DEVELOPMENT_CONFIG.ENABLE_BLOCKCHAIN && staffPrivileges !== null && (
        <Text fontSize="xs" color="blue.500" textAlign="center">
          Staff Privileges: {staffPrivileges >= 1 ? "✅ SCANNER+" : "❌ None"}
          {staffPrivileges >= 2 && " | CHECKIN+"}
          {staffPrivileges >= 3 && " | MANAGER"}
        </Text>
      )}

      {/* Direct Test Button - Mark Real NFT as Used */}
      {staffPrivileges && staffPrivileges >= 1 && (
        <Box mt={6} p={4} bg="yellow.50" borderRadius="lg" border="2px dashed" borderColor="yellow.300">
          <VStack spacing={3}>
            <Text fontSize="sm" fontWeight="bold" color="yellow.800" textAlign="center">
              🧪 Direct Test: Mark Real NFT as Used
            </Text>
            <Button
              colorScheme="orange"
              size="lg"
              width="100%"
              onClick={() => handleDirectMarkAsUsed('1001010001')}
              isLoading={isLoading}
              loadingText="Marking as Used..."
            >
              Mark Token 1001010001 as Used 🎫
            </Button>
            <Text fontSize="xs" color="yellow.700" textAlign="center">
              This will directly call blockchain updateTicketStatus() for your real NFT
            </Text>
          </VStack>
        </Box>
      )}
    </VStack>
  );
};

// Helper component for the scanning frame
const Divider = ({ my = 2 }: { my?: number }) => (
  <Box my={my} height="1px" width="100%" bg="gray.200" />
);

const HStack = ({ children }: { children: React.ReactNode }) => (
  <Flex align="center" gap={2}>
    {children}
  </Flex>
);

export default QrScanner;
