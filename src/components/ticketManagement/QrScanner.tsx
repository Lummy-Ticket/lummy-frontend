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

interface QrScannerProps {
  onScan: (ticketData: any) => void;
  isLoading?: boolean;
}

// Contract-compatible ticket status values
type TicketStatus = 'valid' | 'used' | 'refunded';

// Mock scanner result data with Diamond pattern deterministic token IDs
const mockScanResults = [
  {
    valid: true,
    ticketId: "1000100001",        // Diamond format: 1[eventId][tier][sequential] 
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
    ticketId: "1000200001",
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

// This will simulate the active camera view
const QrScanner: React.FC<QrScannerProps> = ({ onScan, isLoading = false }) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const toast = useToast();

  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const borderColor = "gray.200";

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
      // Simulate scanning with random results for demo
      scanIntervalRef.current = setInterval(() => {
        // Only simulate a successful scan occasionally
        if (Math.random() > 0.7) {
          const mockResult =
            mockScanResults[Math.floor(Math.random() * mockScanResults.length)];
          setScanResult(mockResult);
          onScan(mockResult);

          const statusMessage = mockResult.valid 
            ? `${mockResult.ticketType} for ${mockResult.eventName}` 
            : `${mockResult.error} (Status: ${mockResult.status})`;
          
          toast({
            title: mockResult.valid ? "Valid Ticket" : "Invalid Ticket",
            description: statusMessage,
            status: mockResult.valid ? "success" : "error",
            duration: 5000,
            isClosable: true,
          });

          // Stop camera after successful scan
          setIsCameraActive(false);
          clearInterval(scanIntervalRef.current!);
          scanIntervalRef.current = null;
        }
      }, 2000); // Check every 2 seconds
    }
  };

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
                  <HStack>
                    <Text fontWeight="medium">Wallet:</Text>
                    <Text fontSize="sm" fontFamily="monospace">
                      {scanResult.ownerAddress.substring(0, 8)}...
                      {scanResult.ownerAddress.substring(
                        scanResult.ownerAddress.length - 6
                      )}
                    </Text>
                  </HStack>
                  {scanResult.valid && scanResult.canMarkUsed && (
                    <Box mt={3} p={3} bg="blue.50" borderRadius="md" width="100%">
                      <Text fontSize="sm" color="blue.700">
                        ✓ Ready to mark as used by staff
                      </Text>
                    </Box>
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
      >
        {isCameraActive ? "Stop Camera" : "Start Camera"}
      </Button>

      <Text fontSize="sm" color="gray.500" textAlign="center">
        Position the QR code within the frame to scan
      </Text>
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
