import React, { useEffect, useState } from "react";
import { Box, VStack, Text, Spinner, Alert, AlertIcon, Image } from "@chakra-ui/react";
import { useTicketQRGenerator } from "../../utils/qrGenerator";
import { CONTRACT_ADDRESSES } from "../../constants";

interface QRCodeProps {
  ticketId: string;
  eventId: string;
  eventName?: string;
  eventDate?: string;
  venue?: string;
  tierName?: string;
  ownerAddress?: string;
  size?: number;
}

export const QRCode: React.FC<QRCodeProps> = ({
  ticketId,
  eventId,
  eventName,
  eventDate,
  venue,
  tierName,
  ownerAddress,
  size = 200,
}) => {
  const { generateTicketQR } = useTicketQRGenerator();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeKey, setTimeKey] = useState<number>(Date.now());

  // Generate QR code
  useEffect(() => {
    const generateQR = async () => {
      if (!eventName || !eventDate || !venue || !tierName || !ownerAddress) {
        // Use placeholder if missing required data
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await generateTicketQR(
          ticketId,
          {
            id: eventId,
            name: eventName,
            date: eventDate,
            venue: venue,
          },
          tierName,
          ownerAddress,
          CONTRACT_ADDRESSES.TicketNFT,
          { width: size, height: size }
        );

        setQrCode(result.qrCode);
      } catch (err) {
        console.error('Failed to generate QR code:', err);
        setError('Failed to generate QR code');
      } finally {
        setIsLoading(false);
      }
    };

    generateQR();
  }, [ticketId, eventId, eventName, eventDate, venue, tierName, ownerAddress, size, generateTicketQR]);

  // Regenerate QR every 5 minutes for security (dynamic QR)
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeKey(Date.now());
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  // If we have incomplete data, show placeholder
  if (!eventName || !eventDate || !venue || !tierName || !ownerAddress) {
    return (
      <VStack spacing={2}>
        <Box
          width={`${size}px`}
          height={`${size}px`}
          bg="gray.100"
          borderRadius="md"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Text fontSize="xs" color="gray.500" textAlign="center">
            QR Code Placeholder
            <br />
            ID: {ticketId.substring(0, 8)}
          </Text>
        </Box>
        <Text fontSize="xs" color="gray.500">
          Incomplete ticket data
        </Text>
      </VStack>
    );
  }

  if (error) {
    return (
      <VStack spacing={2}>
        <Alert status="error" borderRadius="md" maxWidth={`${size}px`}>
          <AlertIcon />
          <Text fontSize="xs">{error}</Text>
        </Alert>
      </VStack>
    );
  }

  if (isLoading) {
    return (
      <VStack spacing={2}>
        <Box
          width={`${size}px`}
          height={`${size}px`}
          bg="gray.50"
          borderRadius="md"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Spinner color="blue.500" />
        </Box>
        <Text fontSize="xs" color="gray.500">
          Generating QR code...
        </Text>
      </VStack>
    );
  }

  return (
    <VStack spacing={2}>
      <Box
        width={`${size}px`}
        height={`${size}px`}
        borderRadius="md"
        overflow="hidden"
        border="1px solid"
        borderColor="gray.200"
        bg="white"
      >
        {qrCode ? (
          <Image
            src={qrCode}
            alt={`QR Code for ticket ${ticketId}`}
            width="100%"
            height="100%"
            objectFit="contain"
          />
        ) : (
          <Box
            width="100%"
            height="100%"
            bg="gray.100"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Text fontSize="xs" color="gray.500">
              QR Code
            </Text>
          </Box>
        )}
      </Box>
      <Text fontSize="xs" color="gray.500" textAlign="center">
        Secure ticket validation
        <br />
        Updated: {new Date(timeKey).toLocaleTimeString()}
      </Text>
    </VStack>
  );
};

export default QRCode;
