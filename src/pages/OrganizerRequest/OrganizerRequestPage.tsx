import React, { useState, useEffect } from "react";
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
  useToast,
  Alert,
  AlertIcon,
  Badge,
  Icon,
  HStack,
  useColorModeValue,
  Card,
  CardBody,
  Link,
  Textarea,
  Flex,
} from "@chakra-ui/react";
import { 
  CheckIcon,
  DownloadIcon,
} from "@chakra-ui/icons";
import { FiFileText, FiMail, FiUser, FiUpload } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";
import DocumentUploadField from "../../components/organizer/DocumentUploadField";
import ConsentCheckboxes, { 
  ConsentState, 
  areRequiredConsentsGiven, 
  defaultConsentState 
} from "../../components/organizer/ConsentCheckboxes";
import OrganizerService, { SubmitApplicationRequest } from "../../services/OrganizerService";
import { UI_CONFIG } from "../../constants";

interface OrganizerApplicationData {
  walletAddress: string;
  organizerName: string;
  email: string;
  notes: string;
}

interface UploadedDocument {
  documentType: string;
  file: {
    name: string;
    size: number;
    uploadedAt: Date;
  };
  progress: number;
}

type ApplicationStatus = "idle" | "submitting" | "submitted" | "error";

const OrganizerRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { address } = useAccount();
  
  // Application form state
  const [applicationData, setApplicationData] = useState<OrganizerApplicationData>({
    walletAddress: address || "",
    organizerName: "",
    email: "",
    notes: "",
  });
  
  // GDPR consent state
  const [consent, setConsent] = useState<ConsentState>(defaultConsentState);
  
  // Document upload state
  const [uploadedDocuments, setUploadedDocuments] = useState<Record<string, UploadedDocument>>({});
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  
  // Application status
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus>("idle");
  const [submittedRequestId, setSubmittedRequestId] = useState<string>("");
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  // Update wallet address when account changes
  useEffect(() => {
    if (address) {
      setApplicationData(prev => ({ ...prev, walletAddress: address }));
    }
  }, [address]);

  // Handle form input changes
  const handleInputChange = (field: keyof OrganizerApplicationData, value: string) => {
    setApplicationData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle consent changes
  const handleConsentChange = (field: keyof ConsentState, value: boolean) => {
    setConsent(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle document download
  const handleDownloadTemplate = () => {
    // In production, this would download the actual DOCX template
    const link = document.createElement('a');
    link.href = UI_CONFIG.ORGANIZER_APPLICATION_TEMPLATE_URL;
    link.download = 'organizer-application-template.docx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Template Downloaded",
      description: "Please fill out the template and upload it back to complete your application.",
      status: "success",
      duration: 4000,
      isClosable: true,
    });
  };

  // Handle document upload
  const handleDocumentUpload = async (documentType: string, file: File) => {
    try {
      setUploadProgress(prev => ({ ...prev, [documentType]: 0 }));

      // Simulate upload with progress
      await OrganizerService.uploadDocument(
        "temp-request-id", // This would be the actual request ID after submission
        file,
        documentType,
        (progress) => {
          setUploadProgress(prev => ({ ...prev, [documentType]: progress }));
        }
      );

      // Mark document as uploaded
      setUploadedDocuments(prev => ({
        ...prev,
        [documentType]: {
          documentType,
          file: {
            name: file.name,
            size: file.size,
            uploadedAt: new Date(),
          },
          progress: 100,
        }
      }));

      // Clear progress
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[documentType];
        return newProgress;
      });

    } catch (error) {
      console.error("Document upload failed:", error);
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[documentType];
        return newProgress;
      });
      throw error; // Re-throw to let DocumentUploadField handle the error
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const missingFields = [];
    
    if (!applicationData.walletAddress) missingFields.push("Wallet Address");
    if (!applicationData.organizerName) missingFields.push("Organizer Name");
    if (!applicationData.email) missingFields.push("Email");
    if (!areRequiredConsentsGiven(consent)) missingFields.push("Required Consents");

    if (missingFields.length > 0) {
      toast({
        title: "Required Fields Missing",
        description: `Please fill in: ${missingFields.join(", ")}`,
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      setShowValidationErrors(true);
      return false;
    }

    return true;
  };

  // Handle application submission
  const handleSubmitApplication = async () => {
    if (!validateForm()) {
      return;
    }

    setApplicationStatus("submitting");

    try {
      const submissionData: SubmitApplicationRequest = {
        walletAddress: applicationData.walletAddress,
        organizerName: applicationData.organizerName,
        email: applicationData.email,
        notes: applicationData.notes,
        consent: {
          documentProcessingConsent: consent.documentProcessingConsent,
          identityVerificationConsent: consent.identityVerificationConsent,
          dataRetentionAcknowledged: consent.dataRetentionAcknowledged,
          communicationConsent: consent.communicationConsent,
        },
      };

      const result = await OrganizerService.submitApplication(submissionData);
      
      setSubmittedRequestId(result.requestId);
      setApplicationStatus("submitted");

      toast({
        title: "Application Submitted Successfully!",
        description: "Your organizer application has been submitted for review. We'll notify you via email about the status.",
        status: "success",
        duration: 8000,
        isClosable: true,
      });

    } catch (error) {
      console.error("Application submission failed:", error);
      setApplicationStatus("error");
      
      toast({
        title: "Application Submission Failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        status: "error",
        duration: 6000,
        isClosable: true,
      });
    }
  };

  // Show success screen after submission
  if (applicationStatus === "submitted") {
    return (
      <Container maxW="container.md" py={8}>
        <Card bg={cardBg} borderColor={borderColor}>
          <CardBody textAlign="center">
            <VStack spacing={6}>
              <Box
                w={20}
                h={20}
                bg="green.100"
                color="green.600"
                borderRadius="full"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Icon as={CheckIcon} boxSize={10} />
              </Box>
              
              <VStack spacing={3}>
                <Heading size="lg" color="green.600">
                  Application Submitted Successfully!
                </Heading>
                <Text color="gray.600" textAlign="center" maxW="md">
                  Your organizer application has been submitted for review. We'll notify you 
                  via email about the status. Review typically takes 3-5 business days.
                </Text>
              </VStack>

              <VStack spacing={2}>
                <Badge colorScheme="green" p={3} fontSize="sm">
                  Request ID: {submittedRequestId}
                </Badge>
                <Text fontSize="sm" color="gray.500">
                  Save this ID for your records
                </Text>
              </VStack>

              <VStack spacing={3}>
                <Button colorScheme="purple" onClick={() => navigate("/")}>
                  Back to Home
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setApplicationStatus("idle");
                    setSubmittedRequestId("");
                  }}
                  size="sm"
                >
                  Submit Another Application
                </Button>
              </VStack>
            </VStack>
          </CardBody>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Box textAlign="center">
          <Heading size="xl" mb={3}>
            Become an Event Organizer
          </Heading>
          <Text color="gray.600" fontSize="lg">
            Join Lummy's network of verified event organizers with our streamlined application process.
          </Text>
        </Box>

        <Box bg={cardBg} p={8} borderRadius="xl" borderWidth="1px" borderColor={borderColor}>
          <VStack spacing={8} align="stretch">
            
            {/* Section 1: Application Template */}
            <Box>
              <Flex align="center" mb={4}>
                <Icon as={FiFileText} color="purple.500" boxSize={6} mr={3} />
                <Heading size="md">1. Application Template</Heading>
              </Flex>
              
              <Text color="gray.600" mb={4}>
                Download our application template, fill it out with your business information, 
                and upload the completed document.
              </Text>

              <Alert status="info" borderRadius="md" mb={4}>
                <AlertIcon />
                <VStack align="start" spacing={1} flex="1">
                  <Text fontWeight="medium" fontSize="sm">Template includes fields for:</Text>
                  <Text fontSize="sm">
                    NPWP (Tax ID), KTP (Identity), Business Registration, Event Experience, Contact Details
                  </Text>
                </VStack>
              </Alert>

              <Button
                leftIcon={<DownloadIcon />}
                colorScheme="blue"
                onClick={handleDownloadTemplate}
                size="lg"
                w={{ base: "100%", md: "auto" }}
              >
                Download Application Template
              </Button>
            </Box>

            {/* Section 2: Contact Information */}
            <Box>
              <Flex align="center" mb={4}>
                <Icon as={FiMail} color="purple.500" boxSize={6} mr={3} />
                <Heading size="md">2. Lummy Contact Email</Heading>
              </Flex>
              
              <Text color="gray.600" mb={3}>
                For any questions or support during the application process:
              </Text>
              
              <Box bg="gray.50" p={4} borderRadius="md" border="1px solid" borderColor="gray.200">
                <Text fontWeight="bold" color="purple.600" fontSize="lg">
                  organizer@lummy.app
                </Text>
                <Text fontSize="sm" color="gray.500" mt={1}>
                  Response time: Within 24 hours
                </Text>
              </Box>
            </Box>

            {/* Section 3: Application Details */}
            <Box>
              <Flex align="center" mb={4}>
                <Icon as={FiUser} color="purple.500" boxSize={6} mr={3} />
                <Heading size="md">3. Application Details</Heading>
              </Flex>

              <VStack spacing={4} align="stretch">
                <HStack spacing={4} align="start">
                  <FormControl isRequired>
                    <FormLabel>Wallet Address</FormLabel>
                    <Input
                      value={applicationData.walletAddress}
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

                  <FormControl isRequired>
                    <FormLabel>Organizer Name</FormLabel>
                    <Input
                      value={applicationData.organizerName}
                      onChange={(e) => handleInputChange("organizerName", e.target.value)}
                      placeholder="Your name or company name"
                    />
                  </FormControl>
                </HStack>

                <FormControl isRequired>
                  <FormLabel>Email Address</FormLabel>
                  <Input
                    type="email"
                    value={applicationData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="your.email@example.com"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Additional Notes</FormLabel>
                  <Textarea
                    value={applicationData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="Any additional information about your events or experience..."
                    rows={3}
                  />
                </FormControl>
              </VStack>
            </Box>

            {/* Section 4: Document Submission */}
            <Box>
              <Flex align="center" mb={4}>
                <Icon as={FiUpload} color="purple.500" boxSize={6} mr={3} />
                <Heading size="md">4. Document Submission</Heading>
              </Flex>

              <Text color="gray.600" mb={4}>
                Upload your completed application template (DOCX format only).
              </Text>

              <DocumentUploadField
                label="Completed Application Template"
                documentType="application_template"
                onUpload={handleDocumentUpload}
                progress={uploadProgress["application_template"]}
                uploadedFile={uploadedDocuments["application_template"]?.file}
                required
              />
            </Box>

            {/* Section 5: GDPR Consent */}
            <Box>
              <ConsentCheckboxes
                consent={consent}
                onChange={handleConsentChange}
                showValidationError={showValidationErrors}
              />
            </Box>

            {/* Submit Button */}
            <Box pt={4}>
              <Button
                colorScheme="purple"
                size="lg"
                w="full"
                onClick={handleSubmitApplication}
                isLoading={applicationStatus === "submitting"}
                loadingText="Submitting Application..."
                isDisabled={!areRequiredConsentsGiven(consent)}
              >
                Submit Application
              </Button>
            </Box>

            {/* Wallet Connection Warning */}
            {!address && (
              <Alert status="warning" borderRadius="md">
                <AlertIcon />
                <Text fontSize="sm">
                  Connect your wallet to auto-fill your wallet address and ensure accurate submission.
                </Text>
              </Alert>
            )}
          </VStack>
        </Box>

        {/* Contact Support */}
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <VStack align="start" spacing={1} flex="1">
            <Text fontWeight="medium" fontSize="sm">Need Help?</Text>
            <Text fontSize="sm">
              Contact our support team: <Link href="mailto:support@lummy.app" color="purple.500">support@lummy.app</Link>
            </Text>
          </VStack>
        </Alert>
      </VStack>
    </Container>
  );
};

export default OrganizerRequestPage;