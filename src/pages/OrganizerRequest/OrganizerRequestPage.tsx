import React, { useState } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Button,
  FormControl,
  FormLabel,
  Input,
  SimpleGrid,
  useToast,
  Divider,
  Alert,
  AlertIcon,
  Badge,
  Icon,
  HStack,
  useColorModeValue,
  Card,
  CardBody,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Link,
  Code,
  Textarea,
} from "@chakra-ui/react";
import { 
  ExternalLinkIcon, 
  CheckIcon,
  CopyIcon,
} from "@chakra-ui/icons";
import { FaGoogle, FaWallet, FaFileAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";

interface WhitelistRequest {
  walletAddress: string;
  organizerName: string;
  email: string;
  additionalNotes: string;
}

const OrganizerRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { address } = useAccount();
  
  const [whitelistData, setWhitelistData] = useState<WhitelistRequest>({
    walletAddress: address || "",
    organizerName: "",
    email: "",
    additionalNotes: "",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<"idle" | "submitted">("idle");

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  // Update wallet address when account changes
  React.useEffect(() => {
    if (address) {
      setWhitelistData(prev => ({ ...prev, walletAddress: address }));
    }
  }, [address]);

  const handleInputChange = (field: keyof WhitelistRequest, value: string) => {
    setWhitelistData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleWhitelistSubmit = async () => {
    if (!whitelistData.walletAddress || !whitelistData.organizerName || !whitelistData.email) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in wallet address, organizer name, and email",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmissionStatus("submitted");
      
      toast({
        title: "Whitelist Request Submitted!",
        description: "Your wallet address has been submitted for whitelisting review.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    }, 2000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      status: "success",
      duration: 2000,
      isClosable: true,
    });
  };

  const handleGoogleDocsClick = () => {
    // Open Google Docs template in new tab
    window.open("https://docs.google.com", "_blank");
    
    toast({
      title: "Template Opened",
      description: "Fill out the template and send it via email to get approved for organizer status.",
      status: "info",
      duration: 5000,
      isClosable: true,
    });
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="lg">
            Become an Event Organizer
          </Heading>
          <Text color="gray.600">
            Join Lummy's network of verified event organizers. Follow our simple 2-step process to get started.
          </Text>
        </Box>

        {/* Process Overview */}
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <Box bg={cardBg} p={6} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
            <VStack align="start" spacing={3}>
              <HStack>
                <Box w={8} h={8} bg="purple.100" color="purple.600" borderRadius="full" display="flex" alignItems="center" justifyContent="center" fontWeight="bold">1</Box>
                <Text fontWeight="semibold">Submit Application</Text>
              </HStack>
              <Text fontSize="sm" color="gray.600">
                Fill out Google Docs template with your details and send via email. Takes ~5 minutes.
              </Text>
            </VStack>
          </Box>

          <Box bg={cardBg} p={6} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
            <VStack align="start" spacing={3}>
              <HStack>
                <Box w={8} h={8} bg="green.100" color="green.600" borderRadius="full" display="flex" alignItems="center" justifyContent="center" fontWeight="bold">2</Box>
                <Text fontWeight="semibold">Get Wallet Whitelisted</Text>
              </HStack>
              <Text fontSize="sm" color="gray.600">
                Once approved, submit your wallet address for immediate organizer access.
              </Text>
            </VStack>
          </Box>
        </SimpleGrid>

        {/* Main Content Tabs */}
        <Tabs variant="enclosed">
          <TabList>
            <Tab>
              <HStack>
                <Icon as={FaFileAlt} />
                <Text>Submit Application</Text>
              </HStack>
            </Tab>
            <Tab>
              <HStack>
                <Icon as={FaWallet} />
                <Text>Wallet Whitelist</Text>
              </HStack>
            </Tab>
          </TabList>

          <TabPanels>
            {/* Application Tab */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Box bg={cardBg} p={6} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                  <VStack spacing={4} align="stretch">
                    <Heading size="md">Application Template</Heading>
                    <Text fontSize="sm" color="gray.600">
                      Fill out our Google Docs template with your business information and send via email.
                    </Text>

                    <Alert status="info" borderRadius="md">
                      <AlertIcon />
                      <VStack align="start" spacing={1} flex="1">
                        <Text fontWeight="medium" fontSize="sm">What you'll need:</Text>
                        <Text fontSize="sm">
                          Business info, event experience, wallet address, bank details, portfolio (optional)
                        </Text>
                      </VStack>
                    </Alert>

                    <VStack spacing={4}>
                      <Button
                        colorScheme="blue"
                        leftIcon={<Icon as={FaGoogle} />}
                        rightIcon={<ExternalLinkIcon />}
                        onClick={handleGoogleDocsClick}
                        w="full"
                      >
                        Open Application Template
                      </Button>

                      <Divider />

                      <VStack spacing={2}>
                        <Text fontWeight="medium" fontSize="sm">Send completed application to:</Text>
                        <HStack>
                          <Code colorScheme="purple" p={2}>lummyticket@gmail.com</Code>
                          <Button
                            size="sm"
                            variant="ghost"
                            leftIcon={<CopyIcon />}
                            onClick={() => copyToClipboard("lummyticket@gmail.com")}
                          >
                            Copy
                          </Button>
                        </HStack>
                        <Text fontSize="sm" color="gray.500">Review time: 3-5 business days</Text>
                      </VStack>
                    </VStack>
                  </VStack>
                </Box>
              </VStack>
            </TabPanel>

            {/* Wallet Whitelist Tab */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                {submissionStatus === "submitted" ? (
                  <Card bg={cardBg} borderColor={borderColor}>
                    <CardBody textAlign="center">
                      <VStack spacing={4}>
                        <Box
                          w={16}
                          h={16}
                          bg="green.100"
                          color="green.600"
                          borderRadius="full"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Icon as={CheckIcon} boxSize={8} />
                        </Box>
                        <VStack spacing={2}>
                          <Heading size="md" color="green.600">
                            Whitelist Request Submitted!
                          </Heading>
                          <Text color="gray.600">
                            Your wallet address has been submitted for review. You'll gain organizer 
                            access immediately upon admin approval.
                          </Text>
                        </VStack>
                        <Badge colorScheme="green" p={2}>
                          Wallet: {whitelistData.walletAddress.slice(0, 6)}...{whitelistData.walletAddress.slice(-4)}
                        </Badge>
                        <Button variant="outline" onClick={() => navigate("/")}>
                          Back to Home
                        </Button>
                      </VStack>
                    </CardBody>
                  </Card>
                ) : (
                  <Box bg={cardBg} p={6} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                    <VStack spacing={4} align="stretch">
                      <Heading size="md">Wallet Whitelist Request</Heading>
                      <Text fontSize="sm" color="gray.600">
                        Already approved via email? Submit your wallet address to get immediate organizer access.
                      </Text>

                      <Alert status="info" borderRadius="md">
                        <AlertIcon />
                        <VStack align="start" spacing={1} flex="1">
                          <Text fontWeight="medium" fontSize="sm">Important:</Text>
                          <Text fontSize="sm">
                            Only submit if you've received approval confirmation via email.
                          </Text>
                        </VStack>
                      </Alert>

                      <VStack spacing={4}>
                        <HStack spacing={4} align="start" w="full">
                          <FormControl isRequired flex="1">
                            <FormLabel>Wallet Address</FormLabel>
                            <Input
                              value={whitelistData.walletAddress}
                              onChange={(e) => handleInputChange("walletAddress", e.target.value)}
                              placeholder="0x..."
                              fontFamily="monospace"
                              isReadOnly={!!address}
                              bg={address ? "gray.50" : "white"}
                            />
                            {address && (
                              <Text fontSize="xs" color="gray.500" mt={1}>
                                Auto-filled from connected wallet
                              </Text>
                            )}
                          </FormControl>

                          <FormControl isRequired flex="1">
                            <FormLabel>Organizer Name</FormLabel>
                            <Input
                              value={whitelistData.organizerName}
                              onChange={(e) => handleInputChange("organizerName", e.target.value)}
                              placeholder="Your name or company name"
                            />
                          </FormControl>
                        </HStack>

                        <FormControl isRequired>
                          <FormLabel>Email Address</FormLabel>
                          <Input
                            type="email"
                            value={whitelistData.email}
                            onChange={(e) => handleInputChange("email", e.target.value)}
                            placeholder="Email used in your application"
                          />
                        </FormControl>

                        <FormControl>
                          <FormLabel>Additional Notes</FormLabel>
                          <Textarea
                            value={whitelistData.additionalNotes}
                            onChange={(e) => handleInputChange("additionalNotes", e.target.value)}
                            placeholder="Any additional information or reference to your email approval"
                            rows={3}
                          />
                        </FormControl>

                        <Button
                          colorScheme="purple"
                          onClick={handleWhitelistSubmit}
                          isLoading={isSubmitting}
                          loadingText="Submitting..."
                          leftIcon={<Icon as={FaWallet} />}
                          w="full"
                        >
                          Submit Whitelist Request
                        </Button>
                      </VStack>
                    </VStack>
                  </Box>
                )}

                {!address && submissionStatus !== "submitted" && (
                  <Alert status="warning" borderRadius="md">
                    <AlertIcon />
                    <Text fontSize="sm">
                      Connect your wallet to auto-fill your wallet address and ensure accurate submission.
                    </Text>
                  </Alert>
                )}
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>

        {/* Contact Support */}
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <VStack align="start" spacing={1} flex="1">
            <Text fontWeight="medium" fontSize="sm">Need Help?</Text>
            <Text fontSize="sm">
              Contact our support team: <Link href="mailto:support@lummy.com" color="purple.500">support@lummy.com</Link>
            </Text>
          </VStack>
        </Alert>
      </VStack>
    </Container>
  );
};

export default OrganizerRequestPage;