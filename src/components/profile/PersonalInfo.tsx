import React, { useState, useEffect } from "react";
import {
  Box,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Flex,
  Text,
  useToast,
  HStack,
  IconButton,
} from "@chakra-ui/react";
import { EditIcon, CloseIcon, CheckIcon } from "@chakra-ui/icons";
import { ConnectButton } from "@xellar/kit";

interface PersonalInfoProps {
  initialData: {
    name: string;
    email: string;
    phone: string;
    walletAddress: string;
  };
  onSave: (data: any) => void;
}

const PersonalInfo: React.FC<PersonalInfoProps> = ({ initialData, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(initialData);
  const toast = useToast();

  // Sync verified email from localStorage
  useEffect(() => {
    const verifiedEmail = localStorage.getItem("userEmail");
    if (verifiedEmail && !formData.email) {
      setFormData((prev) => ({ ...prev, email: verifiedEmail }));
    }
  }, [formData.email]);

  // Listen for storage changes (when email is verified in another tab/component)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "userEmail" && e.newValue) {
        setFormData((prev) => ({ ...prev, email: e.newValue || "" }));
      }
    };

    // Listen for custom emailVerified event for real-time sync
    const handleEmailVerified = (e: CustomEvent) => {
      const { email } = e.detail;
      setFormData((prev) => ({ ...prev, email }));
      toast({
        title: "Email Verified",
        description: "Your email has been verified and auto-filled",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("emailVerified", handleEmailVerified as EventListener);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("emailVerified", handleEmailVerified as EventListener);
    };
  }, [toast]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };


  const handleSave = () => {
    onSave(formData);
    setIsEditing(false);
    toast({
      title: "Profile Updated",
      description: "Your personal information has been saved.",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  const handleCancel = () => {
    setFormData(initialData);
    setIsEditing(false);
  };

  return (
    <Box borderWidth="1px" borderRadius="lg" overflow="hidden" bg="white" p={6}>
      <Flex justify="space-between" align="center" mb={6}>
        <Text fontSize="xl" fontWeight="bold">
          Personal Information
        </Text>
        {!isEditing ? (
          <Button
            leftIcon={<EditIcon />}
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </Button>
        ) : (
          <HStack>
            <IconButton
              aria-label="Cancel"
              icon={<CloseIcon />}
              size="sm"
              onClick={handleCancel}
            />
            <IconButton
              aria-label="Save"
              icon={<CheckIcon />}
              size="sm"
              colorScheme="green"
              onClick={handleSave}
            />
          </HStack>
        )}
      </Flex>

      <Flex direction={{ base: "column", md: "row" }} gap={6}>
        <VStack spacing={4} flex="1" align="stretch">
          {/* Wallet Address */}
          <FormControl>
            <FormLabel>Wallet Address</FormLabel>

            <ConnectButton.Custom>
              {({
                openConnectModal,
                isConnected,
                openProfileModal,
                account,
              }) => {
                const address = account?.address || "";

                return (
                  <Flex
                    bg={isConnected ? "gray.50" : "white"}
                    border="1px solid"
                    borderColor="gray.200"
                    borderRadius="md"
                    fontSize="sm"
                    py={2}
                    px={3}
                    mt={1}
                    align="center"
                    height="40px"
                  >
                    <Text flex="1" color={isConnected ? "black" : "gray.500"}>
                      {isConnected ? address : "Not connected"}
                    </Text>
                    <Button
                      size="sm"
                      ml={2}
                      variant="ghost"
                      bg="transparent"
                      colorScheme="purple"
                      onClick={
                        isConnected ? openProfileModal : openConnectModal
                      }
                    >
                      {isConnected ? "Manage" : "Connect"}
                    </Button>
                  </Flex>
                );
              }}
            </ConnectButton.Custom>
          </FormControl>
          {/* Full Name */}
          <FormControl>
            <FormLabel>
              Full Name{" "}
              <Text as="span" color="gray.500" fontSize="sm" ml={2}>
                (Optional)
              </Text>
            </FormLabel>
            <Input
              name="name"
              value={formData.name}
              onChange={handleChange}
              isReadOnly={!isEditing}
              bg={isEditing ? "white" : "gray.50"}
              placeholder="Enter your name"
            />
            <Text fontSize="xs" color="gray.500" mt={1}>
              Only required for major event registration
            </Text>
          </FormControl>

          {/* Email */}
          <FormControl>
            <FormLabel>
              Email Address
              {localStorage.getItem("userEmail") && (
                <Text as="span" color="green.500" fontSize="sm" ml={2}>
                  ✓ Verified
                </Text>
              )}
            </FormLabel>
            <Input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              isReadOnly={!isEditing || !!localStorage.getItem("userEmail")}
              bg={localStorage.getItem("userEmail") ? "green.50" : isEditing ? "white" : "gray.50"}
              placeholder="Enter your email"
              borderColor={localStorage.getItem("userEmail") ? "green.200" : "gray.200"}
            />
            <Text fontSize="xs" color={localStorage.getItem("userEmail") ? "green.600" : "gray.500"} mt={1}>
              {localStorage.getItem("userEmail") 
                ? "✓ This email has been verified and will receive notifications"
                : "Email address for event notifications and receipts"
              }
            </Text>
          </FormControl>
        </VStack>
      </Flex>
    </Box>
  );
};

export default PersonalInfo;
