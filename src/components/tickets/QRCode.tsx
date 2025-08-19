import React from "react";
import { Box, VStack, Text } from "@chakra-ui/react";
import { QRCodeSVG } from "qrcode.react";
import { DEVELOPMENT_CONFIG } from "../../constants";

interface QRCodeProps {
  ticketId: string;
  eventId?: string; // Optional - defaults to event ID 1 for current implementation
  size?: number;
}

export const QRCode: React.FC<QRCodeProps> = ({
  ticketId,
  eventId = "1", // Default to event ID 1 for current single-event setup
  size = 200,
}) => {
  // Extract clean token ID (remove "ticket-" prefix if present)
  const cleanTokenId = ticketId.startsWith('ticket-') ? ticketId.replace('ticket-', '') : ticketId;
  
  // Generate QR code data for staff scanner access
  const generateQRData = () => {
    if (DEVELOPMENT_CONFIG.ENABLE_BLOCKCHAIN) {
      // Real implementation: Direct to local development staff scanner with event context
      return `http://localhost:5173/staff/event/${eventId}/scanner/${cleanTokenId}`;
    } else {
      // Mock implementation: Use event context for testing
      return `http://localhost:5173/staff/event/${eventId}/scanner/${cleanTokenId}`;
    }
  };

  const qrData = generateQRData();

  // Real QR code implementation
  return (
    <VStack spacing={2}>
      <Box
        p={4}
        bg="white"
        borderRadius="md"
        border="1px solid"
        borderColor="gray.200"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <QRCodeSVG
          value={qrData}
          size={size}
          level="M"
          includeMargin={true}
          fgColor="#000000"
          bgColor="#FFFFFF"
        />
      </Box>
      <VStack spacing={1} textAlign="center">
        <Text fontSize="xs" color="gray.600" fontWeight="medium">
          Ticket QR Code
        </Text>
        <Text fontSize="xs" color="gray.500" fontFamily="mono">
          {ticketId.substring(0, 8)}...{ticketId.substring(ticketId.length - 4)}
        </Text>
        <Text fontSize="xs" color="gray.400">
          Staff Scanner - Event {eventId}
        </Text>
        {DEVELOPMENT_CONFIG.LOG_CONTRACT_CALLS && (
          <Text fontSize="xs" color="blue.500" mt={1}>
            URL: {qrData}
          </Text>
        )}
      </VStack>
    </VStack>
  );
};

export default QRCode;
