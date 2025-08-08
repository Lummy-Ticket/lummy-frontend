import React from "react";
import { Box, VStack, Text } from "@chakra-ui/react";
import { QRCodeSVG } from "qrcode.react";
import { DEVELOPMENT_CONFIG } from "../../constants";

interface QRCodeProps {
  ticketId: string;
  eventId: string;
  size?: number;
}

export const QRCode: React.FC<QRCodeProps> = ({
  ticketId,
  eventId,
  size = 200,
}) => {
  // Generate QR code data based on development configuration
  const generateQRData = () => {
    if (DEVELOPMENT_CONFIG.ENABLE_BLOCKCHAIN) {
      // Real implementation: Deep link to staff scanner
      return `lummy-ticket://scan/${ticketId}/${eventId}`;
    } else {
      // Mock implementation: Still use deep link format for testing
      return `mock://scan/${ticketId}/${eventId}`;
    }
  };

  const qrData = generateQRData();
  
  // Fallback URL for web browsers that don't handle deep links
  const fallbackUrl = `https://lummy-ticket.vercel.app/scanner?token=${ticketId}&event=${eventId}`;

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
          {DEVELOPMENT_CONFIG.ENABLE_BLOCKCHAIN 
            ? "Blockchain Mode" 
            : "Mock Mode"}
        </Text>
        {DEVELOPMENT_CONFIG.LOG_CONTRACT_CALLS && (
          <Text fontSize="xs" color="blue.500" mt={1}>
            QR: {qrData}
          </Text>
        )}
        <Text fontSize="xs" color="gray.400" mt={1}>
          Fallback: {fallbackUrl}
        </Text>
      </VStack>
    </VStack>
  );
};

export default QRCode;
