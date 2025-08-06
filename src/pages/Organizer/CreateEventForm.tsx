import React, { useState } from "react";
import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  useToast,
  FormHelperText,
  SimpleGrid,
  IconButton,
  Flex,
  Text,
  Badge,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import { ArrowBackIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";
import TicketTierCreator, {
  TicketTierInput,
} from "../../components/organizer/TicketTierCreator";
import ResellSettings, {
  ResellSettingsData,
} from "../../components/organizer/ResellSettings";
import { useSmartContract } from "../../hooks/useSmartContract";
import { uploadToIPFS, getIPFSUrl } from "../../services/IPFSService";

const CreateEventForm: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const cardBg = "white";

  // Form state
  const [eventData, setEventData] = useState({
    title: "",
    description: "",
    venue: "",
    address: "",
    date: "",
    time: "",
    endTime: "",
    category: "",
    eventImage: null as File | null,
    eventImageHash: "", // IPFS hash untuk event image
  });

  // Upload state
  const [uploadStatus, setUploadStatus] = useState({
    uploading: false,
    uploaded: false,
    error: null as string | null,
  });

  // Ticket tiers state
  const [ticketTiers, setTicketTiers] = useState<TicketTierInput[]>([
    {
      id: "tier-1",
      name: "General Admission",
      description: "Standard festival access",
      price: 50,
      quantity: 300,
      maxPerPurchase: 4,
      benefits: [],
    },
  ]);

  // Resell settings state
  const [resellSettings, setResellSettings] = useState<ResellSettingsData>({
    allowResell: true,                // Enable resale by default
    maxMarkupPercentage: 20,          // 20% markup (contract: 2000 basis points)
    organizerFeePercentage: 2.5,      // 2.5% fee (contract: 250 basis points)
    restrictResellTiming: false,      // No timing restrictions by default
    minDaysBeforeEvent: 1,            // 1 day minimum if timing is enabled
  });

  // Handle form input changes
  const handleInputChange = (field: string, value: string | File | null) => {
    setEventData({
      ...eventData,
      [field]: value,
    });
  };

  // Handle file uploads
  const handleFileChange = (
    field: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files[0]) {
      handleInputChange(field, e.target.files[0]);
    }
  };

  // Handle event image upload ke IPFS
  const handleEventImageUpload = async (file: File) => {
    setUploadStatus({
      uploading: true,
      uploaded: false,
      error: null,
    });

    try {
      console.log("📤 Uploading event image to IPFS...");
      const result = await uploadToIPFS(file, `event-${Date.now()}.${file.name.split('.').pop()}`);
      
      if (result.success && result.hash) {
        setEventData(prev => ({
          ...prev,
          eventImage: file,
          eventImageHash: result.hash!
        }));
        
        setUploadStatus({
          uploading: false,
          uploaded: true,
          error: null,
        });

        toast({
          title: "Image uploaded successfully!",
          description: `Event image uploaded to IPFS: ${result.hash}`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });

        console.log("✅ Event image uploaded:", result.hash);
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (error) {
      console.error("❌ Image upload failed:", error);
      
      setUploadStatus({
        uploading: false,
        uploaded: false,
        error: error instanceof Error ? error.message : "Upload failed",
      });

      toast({
        title: "Image upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const { initializeEvent, addTicketTier, setResaleRules, clearTiers, loading, error } = useSmartContract();

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Form validation
    if (
      !eventData.title ||
      !eventData.date ||
      !eventData.time ||
      ticketTiers.length === 0
    ) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const eventDate = new Date(`${eventData.date}T${eventData.time}`);

    // Call createEvent function from hook
    try {
      // Step 0: Clear existing tiers terlebih dahulu (fix untuk tier reset issue)
      console.log("🧹 Step 0: Clearing existing tiers...");
      const clearResult = await clearTiers();
      
      if (!clearResult) {
        console.warn("⚠️ Clear tiers failed, but continuing with event creation");
        // Tetap lanjut karena mungkin ini event pertama dan ga ada tier existing
      } else {
        console.log("✅ Tiers cleared successfully:", clearResult);
      }

      // Step 1: Initialize the event
      console.log("🚀 Step 1: Initializing event...");
      const eventResult = await initializeEvent(
        eventData.title,
        eventData.description,
        eventDate,
        eventData.venue || eventData.address,
        eventData.eventImageHash, // Pass IPFS hash ke contract
        eventData.category // Pass category ke contract
      );

      if (!eventResult) {
        throw new Error("Event initialization failed");
      }

      console.log("✅ Event initialized successfully:", eventResult);

      // Step 2: Create ticket tiers
      console.log("🎫 Step 2: Creating ticket tiers...");
      let successfulTiers = 0;
      
      for (const tier of ticketTiers) {
        try {
          console.log(`Creating tier: ${tier.name} - ${tier.price} IDRX`);
          
          // Convert benefits array ke JSON string untuk contract
          const benefitsJson = JSON.stringify(tier.benefits || []);
          
          const tierResult = await addTicketTier(
            tier.name,
            tier.price,
            tier.quantity,
            tier.maxPerPurchase,
            tier.description || "", // Pass description
            benefitsJson            // Pass benefits sebagai JSON string
          );
          
          if (tierResult) {
            successfulTiers++;
            console.log(`✅ Tier "${tier.name}" created successfully`);
          } else {
            console.log(`❌ Failed to create tier "${tier.name}"`);
          }
        } catch (tierError) {
          console.error(`Error creating tier "${tier.name}":`, tierError);
          // Continue with other tiers even if one fails
        }
      }

      // Step 4: Set resale rules
      console.log("📋 Step 4: Setting resale rules...");
      try {
        const resaleResult = await setResaleRules(
          resellSettings.maxMarkupPercentage,
          resellSettings.organizerFeePercentage,
          resellSettings.restrictResellTiming,
          resellSettings.minDaysBeforeEvent
        );

        if (resaleResult) {
          console.log("✅ Resale rules configured successfully");
        } else {
          console.warn("⚠️ Resale rules setup failed, but event creation succeeded");
        }
      } catch (resaleError) {
        console.error("Error setting resale rules:", resaleError);
        // Don't fail the entire event creation if resale rules fail
      }

      if (successfulTiers > 0) {
        toast({
          title: "Event created successfully!",
          description: `Event initialized with ${successfulTiers}/${ticketTiers.length} ticket tiers created`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });

        // Navigate to organizer dashboard
        navigate("/organizer");
      } else {
        toast({
          title: "Event created with warnings",
          description: "Event was created but no ticket tiers were added. You can add them later.",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
        
        navigate("/organizer");
      }
    } catch (err) {
      console.error("Error creating event:", err);
      toast({
        title: "Event creation failed",
        description: error || "There was an error creating your event",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return; // Don't proceed if event creation failed
    }

    // Log form data for debugging
    console.log("Event Data:", eventData);
    console.log("Ticket Tiers:", ticketTiers);
    console.log("Resell Settings:", resellSettings);
  };

  return (
    <Container maxW="container.md" py={10}>
      <VStack align="stretch" spacing={6}>
        <HStack>
          <IconButton
            aria-label="Go back"
            icon={<ArrowBackIcon />}
            variant="ghost"
            onClick={() => navigate("/organizer")}
          />
          <Heading size="lg">Create New Event</Heading>
        </HStack>

        {/* Event Info */}
        <Box
          bg={cardBg}
          p={6}
          borderRadius="lg"
          border="1px"
          borderColor="gray.300"
        >
          <Heading size="md" mb={4}>
            Event Info
          </Heading>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Title</FormLabel>
              <Input
                value={eventData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Enter event title"
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Description</FormLabel>
              <Textarea
                value={eventData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Event description"
                rows={4}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Category</FormLabel>
              <Select
                placeholder="Select category"
                value={eventData.category}
                onChange={(e) => handleInputChange("category", e.target.value)}
              >
                <option value="music">Music</option>
                <option value="technology">Technology</option>
                <option value="sport">Sport</option>
                <option value="arts">Arts</option>
                <option value="education">Education</option>
                <option value="other">Other</option>
              </Select>
            </FormControl>

            {/* Event Image Upload */}
            <FormControl>
              <FormLabel>Event Poster Image</FormLabel>
              <VStack spacing={3} align="stretch">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    if (e.target.files && e.target.files[0]) {
                      await handleEventImageUpload(e.target.files[0]);
                    }
                  }}
                  disabled={uploadStatus.uploading}
                />
                <FormHelperText>
                  Upload event poster image (PNG, JPG, etc.). Max 10MB.
                </FormHelperText>
                
                {uploadStatus.uploading && (
                  <Alert status="info">
                    <AlertIcon />
                    Uploading to IPFS...
                  </Alert>
                )}
                
                {uploadStatus.uploaded && eventData.eventImageHash && (
                  <Alert status="success">
                    <AlertIcon />
                    <VStack align="start" spacing={1}>
                      <Text>Image uploaded successfully!</Text>
                      <Text fontSize="sm" color="gray.600">
                        IPFS Hash: {eventData.eventImageHash}
                      </Text>
                      <Text fontSize="sm" color="blue.600">
                        URL: {getIPFSUrl(eventData.eventImageHash)}
                      </Text>
                    </VStack>
                  </Alert>
                )}
                
                {uploadStatus.error && (
                  <Alert status="error">
                    <AlertIcon />
                    Upload failed: {uploadStatus.error}
                  </Alert>
                )}
                
                {/* Image preview */}
                {eventData.eventImage && (
                  <Box>
                    <Text fontSize="sm" mb={2}>Preview:</Text>
                    <img
                      src={URL.createObjectURL(eventData.eventImage)}
                      alt="Event preview"
                      style={{
                        maxWidth: "200px",
                        maxHeight: "150px",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0"
                      }}
                    />
                  </Box>
                )}
              </VStack>
            </FormControl>
          </VStack>
        </Box>

        {/* Ticketing System Information */}
        <Box
          bg={cardBg}
          p={6}
          borderRadius="lg"
          border="2px solid"
          borderColor="blue.300"
        >
          <Heading size="md" mb={4}>
            Lummy Ticketing System
          </Heading>
          <Text color="gray.600" mb={4}>
            Your event uses Lummy's advanced Diamond smart contract system with escrow protection
          </Text>
          
          {/* Escrow Protection Notice */}
          <Alert status="success" mb={4}>
            <AlertIcon />
            <VStack align="start" spacing={1}>
              <Text fontWeight="medium" fontSize="sm">
                🔒 Built-in Escrow Protection
              </Text>
              <Text fontSize="xs">
                All ticket sales are held in escrow until event completion. Buyers get automatic refunds if events are cancelled.
              </Text>
            </VStack>
          </Alert>
          
          {/* System Features */}
          <Box
            p={4}
            border="2px solid"
            borderColor="blue.200"
            borderRadius="md"
            bg="blue.50"
          >
            <VStack align="start" spacing={2}>
              <HStack>
                <Text fontWeight="bold" fontSize="lg">
                  Diamond Pattern NFT Tickets
                </Text>
                <Badge colorScheme="blue">Enhanced Security</Badge>
              </HStack>
              <Text fontSize="sm" color="gray.600">
                Advanced smart contract architecture with deterministic token IDs and enhanced traceability
              </Text>
              <VStack align="start" spacing={1} fontSize="sm" color="gray.600">
                <Text>• ✅ Deterministic token IDs (1EEETTTSSSSS format)</Text>
                <Text>• ✅ Enhanced metadata with tier-based designs</Text>
                <Text>• ✅ Gasless transactions with ERC-2771</Text>
                <Text>• ✅ Escrow payment protection (7% platform fee)</Text>
                <Text>• ✅ Secure resale marketplace (3% platform fee)</Text>
                <Text>• ✅ Staff management and verification tools</Text>
              </VStack>
            </VStack>
          </Box>

          {/* Revenue Information */}
          <Alert status="info" mt={4}>
            <AlertIcon />
            <VStack align="start" spacing={1}>
              <Text fontWeight="medium">
                Revenue Structure: You receive 93% of ticket sales immediately
              </Text>
              <Text fontSize="sm">
                Platform fee (7%) is deducted at purchase time. No hidden fees or withdrawal charges. Escrow funds are released after event completion.
              </Text>
            </VStack>
          </Alert>
        </Box>

        {/* Date & Time */}
        <Box
          bg={cardBg}
          p={6}
          borderRadius="lg"
          border="1px"
          borderColor="gray.300"
        >
          <Heading size="md" mb={4}>
            Date & Time
          </Heading>
          <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={4}>
            <FormControl isRequired>
              <FormLabel>Date</FormLabel>
              <Input
                type="date"
                value={eventData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Start Time</FormLabel>
              <Input
                type="time"
                value={eventData.time}
                onChange={(e) => handleInputChange("time", e.target.value)}
              />
            </FormControl>
            <FormControl>
              <FormLabel>End Time</FormLabel>
              <Input
                type="time"
                value={eventData.endTime}
                onChange={(e) => handleInputChange("endTime", e.target.value)}
              />
            </FormControl>
          </SimpleGrid>
          <FormControl mt={4}>
            <FormLabel>Venue</FormLabel>
            <Input
              value={eventData.venue}
              onChange={(e) => handleInputChange("venue", e.target.value)}
            />
          </FormControl>
          <FormControl mt={2}>
            <FormLabel>Address</FormLabel>
            <Textarea
              value={eventData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              rows={2}
            />
          </FormControl>
        </Box>

        {/* Event Image */}
        <Box
          bg={cardBg}
          p={6}
          borderRadius="lg"
          border="1px"
          borderColor="gray.300"
        >
          <Heading size="md" mb={4}>
            Event Image
          </Heading>
          <FormControl>
            <FormLabel>Event Image</FormLabel>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange("eventImage", e)}
            />
            <FormHelperText>
              Upload high quality image (minimum 1200x800px). Will be automatically resized for different displays - banners, thumbnails, and event cards.
            </FormHelperText>
          </FormControl>
          
          {/* Image Preview */}
          {eventData.eventImage && (
            <Box mt={4}>
              <Text fontSize="sm" fontWeight="medium" mb={2} color="gray.700">
                Preview:
              </Text>
              <Box
                borderWidth="1px"
                borderRadius="md"
                overflow="hidden"
                maxW="400px"
              >
                <img
                  src={URL.createObjectURL(eventData.eventImage)}
                  alt="Event preview"
                  style={{
                    width: "100%",
                    height: "200px",
                    objectFit: "cover"
                  }}
                />
              </Box>
              <Text fontSize="xs" color="gray.500" mt={2}>
                ✓ This image will be used for event banners, thumbnails, and cards
              </Text>
            </Box>
          )}
        </Box>

        {/* Tickets */}
        <Box
          bg={cardBg}
          p={6}
          borderRadius="lg"
          border="1px"
          borderColor="gray.300"
        >
          <VStack spacing={4} align="stretch">
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <VStack align="start" spacing={1}>
                <Text fontWeight="medium" fontSize="sm">
                  ✨ Integrated Tier Creation
                </Text>
                <Text fontSize="xs">
                  Your ticket tiers will be created automatically when you submit this form. No need to add them later!
                </Text>
              </VStack>
            </Alert>
            
            <TicketTierCreator
              tiers={ticketTiers}
              onChange={setTicketTiers}
              currency="IDRX"
            />
          </VStack>
        </Box>

        {/* Resell Settings */}
        <Box
          bg={cardBg}
          p={6}
          borderRadius="lg"
          border="1px"
          borderColor="gray.300"
        >
          <ResellSettings
            settings={resellSettings}
            onChange={setResellSettings}
          />
        </Box>

        {/* Submit Buttons */}
        <form onSubmit={handleSubmit}>
          <Flex justify="flex-end">
            <HStack spacing={4}>
              <Button variant="outline" onClick={() => navigate("/organizer")}>
                Cancel
              </Button>
              <Button colorScheme="purple" type="submit" isLoading={loading}>
                {loading ? "Creating Event & Tiers..." : "Create Event & Tiers"}
              </Button>
            </HStack>
          </Flex>
        </form>
      </VStack>
    </Container>
  );
};
export default CreateEventForm;
