import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Text,
  HStack,
  Icon,
  useToast,
  Badge,
  Tooltip,
  Alert,
  AlertIcon,
  AlertDescription,
  VStack,
} from "@chakra-ui/react";
import { FaExchangeAlt, FaExclamationTriangle, FaCheckCircle } from "react-icons/fa";
import { useAccount, useChainId } from "wagmi";
import { 
  switchToLiskSepolia, 
  isOnLiskSepolia, 
  getCurrentNetworkName,
  onNetworkChange 
} from "../../utils/networkUtils";

interface NetworkSwitcherProps {
  showAlert?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "button" | "alert" | "compact";
}

export const NetworkSwitcher: React.FC<NetworkSwitcherProps> = ({
  showAlert = false,
  size = "md",
  variant = "button",
}) => {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const [isOnCorrectNetwork, setIsOnCorrectNetwork] = useState(false);
  const [currentNetwork, setCurrentNetwork] = useState("Unknown");
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  // Check current network
  useEffect(() => {
    const checkNetwork = async () => {
      if (!isConnected) return;
      
      const isCorrect = await isOnLiskSepolia();
      const networkName = await getCurrentNetworkName();
      
      setIsOnCorrectNetwork(isCorrect);
      setCurrentNetwork(networkName);
    };

    checkNetwork();
  }, [isConnected, chainId]);

  // Listen for network changes
  useEffect(() => {
    if (!isConnected) return;

    const cleanup = onNetworkChange(async () => {
      const isCorrect = await isOnLiskSepolia();
      const networkName = await getCurrentNetworkName();
      
      setIsOnCorrectNetwork(isCorrect);
      setCurrentNetwork(networkName);
      
      if (isCorrect) {
        toast({
          title: "Network Switched",
          description: "Successfully connected to Lisk Sepolia",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
    });

    return cleanup;
  }, [isConnected, toast]);

  const handleNetworkSwitch = async () => {
    setIsLoading(true);
    
    try {
      const success = await switchToLiskSepolia();
      
      if (success) {
        toast({
          title: "Network Switched",
          description: "Successfully switched to Lisk Sepolia",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: "Network Switch Failed",
          description: "Please manually switch to Lisk Sepolia in your wallet",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error("Network switch error:", error);
      toast({
        title: "Error",
        description: "Failed to switch network. Please try manually.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show if not connected
  if (!isConnected) return null;

  // Compact variant for navbar
  if (variant === "compact") {
    return (
      <Tooltip label={isOnCorrectNetwork ? `Connected to ${currentNetwork}` : "Switch to Lisk Sepolia"}>
        <Badge
          colorScheme={isOnCorrectNetwork ? "green" : "red"}
          variant="subtle"
          px={2}
          py={1}
          borderRadius="md"
          cursor={isOnCorrectNetwork ? "default" : "pointer"}
          onClick={!isOnCorrectNetwork ? handleNetworkSwitch : undefined}
          _hover={!isOnCorrectNetwork ? { bg: "red.100" } : undefined}
        >
          <HStack spacing={1}>
            <Icon 
              as={isOnCorrectNetwork ? FaCheckCircle : FaExclamationTriangle} 
              boxSize={3} 
            />
            <Text fontSize="xs">
              {isOnCorrectNetwork ? "Lisk" : "Wrong Network"}
            </Text>
          </HStack>
        </Badge>
      </Tooltip>
    );
  }

  // Alert variant for important notices
  if (variant === "alert" && !isOnCorrectNetwork) {
    return (
      <Alert status="warning" borderRadius="md">
        <AlertIcon />
        <VStack align="start" spacing={2} flex="1">
          <AlertDescription>
            <Text fontWeight="medium">
              Wrong Network Detected
            </Text>
            <Text fontSize="sm">
              You're on {currentNetwork}. Switch to Lisk Sepolia to see your IDRX balance and use Lummy features.
            </Text>
          </AlertDescription>
          <Button
            size="sm"
            colorScheme="orange"
            leftIcon={<Icon as={FaExchangeAlt} />}
            onClick={handleNetworkSwitch}
            isLoading={isLoading}
            loadingText="Switching..."
          >
            Switch to Lisk Sepolia
          </Button>
        </VStack>
      </Alert>
    );
  }

  // Button variant (default)
  if (!isOnCorrectNetwork) {
    return (
      <Box>
        {showAlert && (
          <Alert status="warning" mb={4} borderRadius="md">
            <AlertIcon />
            <AlertDescription>
              You're connected to {currentNetwork}. Switch to Lisk Sepolia to access your IDRX balance.
            </AlertDescription>
          </Alert>
        )}
        
        <Button
          leftIcon={<Icon as={FaExchangeAlt} />}
          colorScheme="orange"
          size={size}
          onClick={handleNetworkSwitch}
          isLoading={isLoading}
          loadingText="Switching Network..."
          _hover={{
            bg: isLoading ? "orange.500" : "orange.600",
          }}
        >
          Switch to Lisk Sepolia
        </Button>
      </Box>
    );
  }

  // Show success state
  return (
    <HStack spacing={2} color="green.600">
      <Icon as={FaCheckCircle} />
      <Text fontSize={size === "sm" ? "sm" : "md"} fontWeight="medium">
        Connected to Lisk Sepolia
      </Text>
    </HStack>
  );
};

export default NetworkSwitcher;