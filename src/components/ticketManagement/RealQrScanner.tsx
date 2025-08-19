import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Button,
  VStack,
  Text,
  HStack,
  Badge,
  useToast,
} from "@chakra-ui/react";
import { FaCamera, FaStop } from "react-icons/fa";
import jsQR from "jsqr";
import { useSmartContract } from "../../hooks/useSmartContract";
import { useEmailService } from "../../hooks/useEmailService";

interface RealQrScannerProps {
  onScan: (ticketData: any) => void;
  isLoading?: boolean;
  eventId?: string;
}

const RealQrScanner: React.FC<RealQrScannerProps> = ({ 
  onScan, 
  isLoading = false 
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef<boolean>(false);
  
  const { validateTicketAsStaff } = useSmartContract();
  const { getUserEmailByWallet } = useEmailService();
  const toast = useToast();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    try {
      setError(null);
      setIsScanning(true);
      scanningRef.current = true;

      // Get camera stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "environment",
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();

        // Start scanning loop
        setTimeout(() => {
          scanForQR();
        }, 1000);
      }

    } catch (err) {
      console.error("Error starting camera:", err);
      setError("Failed to start camera. Please check permissions.");
      setIsScanning(false);
      scanningRef.current = false;
    }
  };

  const stopScanning = () => {
    scanningRef.current = false;
    setIsScanning(false);

    // Stop video stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Clear video
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const scanForQR = async () => {
    if (!scanningRef.current || !videoRef.current || !canvasRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) {
      // Try again in 100ms
      setTimeout(scanForQR, 100);
      return;
    }

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      // Try to detect QR codes using BarcodeDetector if available
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new (window as any).BarcodeDetector({
          formats: ['qr_code']
        });

        const barcodes = await barcodeDetector.detect(canvas);
        
        if (barcodes.length > 0) {
          const qrData = barcodes[0].rawValue;
          await handleQRDetected(qrData);
          return;
        }
      } else {
        // Fallback: use jsQR library
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const qrCode = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (qrCode) {
          await handleQRDetected(qrCode.data);
          return;
        }
      }
    } catch (err) {
      console.warn("QR detection error:", err);
    }

    // Continue scanning if still active
    if (scanningRef.current) {
      setTimeout(scanForQR, 100);
    }
  };


  const handleQRDetected = async (qrData: string) => {
    console.log(`🎯 QR Detected: ${qrData}`);
    
    // Stop scanning immediately
    stopScanning();
    
    try {
      // Simple QR parsing - extract token ID
      let tokenId = qrData;
      
      if (qrData.includes('/scanner/')) {
        const parts = qrData.split('/scanner/');
        if (parts[1]) {
          tokenId = parts[1];
        }
      }
      
      console.log(`🔍 Processing token ID: ${tokenId}`);
      
      // Validate ticket
      const validationResult = await validateTicketAsStaff(tokenId);
      
      if (validationResult) {
        // Get email for the ticket owner
        let ownerEmail = "holder@example.com";
        let displayName = "Ticket Holder";
        
        if (validationResult.owner && validationResult.owner !== "Unknown Owner") {
          try {
            const emailData = await getUserEmailByWallet(validationResult.owner);
            if (emailData && emailData.email) {
              ownerEmail = emailData.email;
              displayName = validationResult.owner.substring(0, 6) + "..." + validationResult.owner.substring(validationResult.owner.length - 4);
            }
          } catch (error) {
            console.warn('Failed to fetch email for owner:', validationResult.owner, error);
          }
        }
        
        const scanResult = {
          valid: validationResult.isValid,
          ticketId: tokenId,
          eventName: validationResult.eventName || 'Unknown Event',
          ticketType: validationResult.tierName || 'Unknown Tier',
          status: validationResult.status,
          ownerAddress: validationResult.owner,
          // Map to expected format
          id: `ticket-${tokenId}`,
          name: displayName,
          email: ownerEmail,
          eventDate: new Date().toISOString(),
          eventLocation: validationResult.eventVenue || "Unknown Location",
          walletAddress: validationResult.owner,
          // Additional fields from validation
          transferCount: validationResult.transferCount || 0,
          purchaseDate: (validationResult as any).purchaseDate ? new Date(Number((validationResult as any).purchaseDate) * 1000).toISOString() : undefined,
        };

        console.log(`✅ Scan result:`, scanResult);
        onScan(scanResult);
        
        toast({
          title: scanResult.valid ? "Valid Ticket!" : "Invalid Ticket",
          description: `${scanResult.eventName} - ${scanResult.ticketType}`,
          status: scanResult.valid ? "success" : "error",
          duration: 3000,
        });
      }
      
    } catch (error) {
      console.error('❌ Validation error:', error);
      toast({
        title: "Validation Error",
        description: "Failed to validate ticket",
        status: "error",
        duration: 3000,
      });
    }
  };

  return (
    <Box bg="white" p={6} borderRadius="lg" shadow="sm">
      <VStack spacing={4} align="stretch">
        
        {/* Header */}
        <HStack justify="space-between">
          <Text fontWeight="bold" fontSize="lg">
            QR Code Scanner
          </Text>
          <Badge colorScheme={isScanning ? "green" : "gray"}>
            {isScanning ? "Scanning" : "Stopped"}
          </Badge>
        </HStack>

        {/* Video Area */}
        <Box 
          position="relative"
          minHeight="300px"
          border="2px dashed gray"
          borderRadius="md"
          overflow="hidden"
          display="flex"
          alignItems="center"
          justifyContent="center"
          bg="black"
        >
          <video
            ref={videoRef}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: isScanning ? 'block' : 'none'
            }}
            playsInline
            muted
          />
          
          {/* Hidden canvas for QR detection */}
          <canvas
            ref={canvasRef}
            style={{ display: 'none' }}
          />

          {!isScanning && (
            <Text color="gray.500" textAlign="center">
              Click "Start Camera" to begin scanning
            </Text>
          )}

          {/* Scanning overlay */}
          {isScanning && (
            <Box
              position="absolute"
              top="50%"
              left="50%"
              transform="translate(-50%, -50%)"
              width="200px"
              height="200px"
              border="2px solid"
              borderColor="blue.400"
              borderRadius="md"
              pointerEvents="none"
            />
          )}
        </Box>

        {/* Simple Controls */}
        <HStack spacing={3}>
          {!isScanning ? (
            <Button
              leftIcon={<FaCamera />}
              colorScheme="blue"
              onClick={startScanning}
              isLoading={isLoading}
              flex={1}
            >
              Start Camera
            </Button>
          ) : (
            <Button
              leftIcon={<FaStop />}
              colorScheme="red"
              variant="outline"
              onClick={stopScanning}
              flex={1}
            >
              Stop Scanning
            </Button>
          )}
        </HStack>

        {/* Error Display */}
        {error && (
          <Text color="red.500" fontSize="sm" textAlign="center">
            {error}
          </Text>
        )}

        {/* Instructions */}
        <Text fontSize="sm" color="gray.600" textAlign="center">
          {isScanning 
            ? "Point your camera at a QR code" 
            : "Make sure to allow camera permissions when prompted"
          }
        </Text>
        
      </VStack>
    </Box>
  );
};

export default RealQrScanner;