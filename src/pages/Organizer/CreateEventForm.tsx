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
  RadioGroup,
  Radio,
  Stack,
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
    algorithm: "algorithm1" as "algorithm1" | "algorithm2" | "algorithm3", // Algorithm selection
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

  const { createEvent, loading, error } = useSmartContract();

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
      const eventAddress = await createEvent(
        eventData.title,
        eventData.description,
        eventDate,
        eventData.venue || eventData.address,
        "" // ipfsMetadata (empty for now)
      );

      if (eventAddress) {
        toast({
          title: "Event created",
          description: `Your event has been created successfully at ${eventAddress}`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });

        // For demo, directly redirect to dashboard
        navigate("/organizer");
      } else {
        toast({
          title: "Error creating event",
          description: "There was an error creating your event",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (err) {
      console.error("Error creating event:", err);
      toast({
        title: "Transaction failed",
        description: error || "There was an error processing your transaction",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }

    // Would handle actual form submission to API in real application
    toast({
      title: "Event created",
      description: "Your event has been created successfully",
      status: "success",
      duration: 3000,
      isClosable: true,
    });

    console.log("Event Data:", eventData);
    console.log("Ticket Tiers:", ticketTiers);
    console.log("Resell Settings:", resellSettings);

    // Redirect to organizer dashboard
    navigate("/organizer");
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
                <option value="arts">Arts & Theater</option>
                <option value="education">Education</option>
                <option value="other">Other</option>
              </Select>
            </FormControl>
          </VStack>
        </Box>

        {/* Algorithm Selection */}
        <Box
          bg={cardBg}
          p={6}
          borderRadius="lg"
          border="2px solid"
          borderColor={
            eventData.algorithm === "algorithm1" ? "blue.300" : 
            eventData.algorithm === "algorithm2" ? "green.300" : 
            "purple.300"
          }
        >
          <Heading size="md" mb={4}>
            Ticket Algorithm Selection
          </Heading>
          <Text color="gray.600" mb={4}>
            Choose the ticketing algorithm that best fits your event type and audience
          </Text>
          
          {/* Universal Escrow Notice */}
          <Alert status="success" mb={6}>
            <AlertIcon />
            <VStack align="start" spacing={1}>
              <Text fontWeight="medium" fontSize="sm">
                🔒 Universal Escrow Protection
              </Text>
              <Text fontSize="xs">
                All algorithms use escrow-based payments. Funds are held securely until event completion + grace period for maximum buyer protection.
              </Text>
            </VStack>
          </Alert>
          
          <RadioGroup
            value={eventData.algorithm}
            onChange={(value: "algorithm1" | "algorithm2" | "algorithm3") => 
              handleInputChange("algorithm", value)
            }
          >
            <Stack spacing={4}>
              {/* Algorithm 1: Pure Web3 NFT */}
              <Box
                p={4}
                border="2px solid"
                borderColor={eventData.algorithm === "algorithm1" ? "blue.300" : "gray.200"}
                borderRadius="md"
                bg={eventData.algorithm === "algorithm1" ? "blue.50" : "gray.50"}
                cursor="pointer"
                onClick={() => handleInputChange("algorithm", "algorithm1")}
              >
                <Radio value="algorithm1" size="lg">
                  <VStack align="start" spacing={2} ml={3}>
                    <HStack>
                      <Text fontWeight="bold" fontSize="lg">
                        Algorithm 1: Pure Web3 NFT
                      </Text>
                      <Badge colorScheme="blue">Recommended</Badge>
                    </HStack>
                    <Text fontSize="sm" color="gray.600">
                      100% blockchain-based with updatable NFT status + Escrow Protection
                    </Text>
                    <VStack align="start" spacing={1} fontSize="sm" color="gray.600">
                      <Text>• Staff scan QR → User approve → Status "valid" → "used"</Text>
                      <Text>• Pure Web3 architecture, no database needed</Text>
                      <Text>• Gasless transactions with ERC-2771</Text>
                      <Text>• Escrow payment with buyer protection</Text>
                      <Text>• Best for tech-savvy audience (up to 500 attendees)</Text>
                    </VStack>
                  </VStack>
                </Radio>
              </Box>

              {/* Algorithm 2: Dynamic QR */}
              <Box
                p={4}
                border="2px solid"
                borderColor={eventData.algorithm === "algorithm2" ? "green.300" : "gray.200"}
                borderRadius="md"
                bg={eventData.algorithm === "algorithm2" ? "green.50" : "gray.50"}
                cursor="pointer"
                onClick={() => handleInputChange("algorithm", "algorithm2")}
              >
                <Radio value="algorithm2" size="lg">
                  <VStack align="start" spacing={2} ml={3}>
                    <HStack>
                      <Text fontWeight="bold" fontSize="lg">
                        Algorithm 2: Dynamic QR Code
                      </Text>
                      <Badge colorScheme="green">Mass Events</Badge>
                    </HStack>
                    <Text fontSize="sm" color="gray.600">
                      Hybrid Web2/Web3 with time-based QR validation + Escrow Protection
                    </Text>
                    <VStack align="start" spacing={1} fontSize="sm" color="gray.600">
                      <Text>• QR code changes every 30 minutes for security</Text>
                      <Text>• Database validation for fast entry processing</Text>
                      <Text>• No wallet approval needed at venue entry</Text>
                      <Text>• Escrow payment with buyer protection</Text>
                      <Text>• Best for large events with general audience (500+ attendees)</Text>
                    </VStack>
                  </VStack>
                </Radio>
              </Box>

              {/* Algorithm 3: Zero Knowledge */}
              <Box
                p={4}
                border="2px solid"
                borderColor={eventData.algorithm === "algorithm3" ? "purple.300" : "gray.200"}
                borderRadius="md"
                bg={eventData.algorithm === "algorithm3" ? "purple.50" : "gray.50"}
                cursor="pointer"
                onClick={() => handleInputChange("algorithm", "algorithm3")}
              >
                <Radio value="algorithm3" size="lg">
                  <VStack align="start" spacing={2} ml={3}>
                    <HStack>
                      <Text fontWeight="bold" fontSize="lg">
                        Algorithm 3: Zero-Knowledge Proof
                      </Text>
                      <Badge colorScheme="purple">Privacy First</Badge>
                    </HStack>
                    <Text fontSize="sm" color="gray.600">
                      Anonymous verification with complete privacy protection + Escrow Protection
                    </Text>
                    <VStack align="start" spacing={1} fontSize="sm" color="gray.600">
                      <Text>• Anonymous entry without revealing identity</Text>
                      <Text>• Local proof validation, no network calls needed</Text>
                      <Text>• Privacy-preserving analytics and reporting</Text>
                      <Text>• Escrow payment with buyer protection</Text>
                      <Text>• Best for premium and international events</Text>
                    </VStack>
                  </VStack>
                </Radio>
              </Box>
            </Stack>
          </RadioGroup>

          {/* Algorithm-specific information */}
          <Alert status="info" mt={4}>
            <AlertIcon />
            <VStack align="start" spacing={1}>
              <Text fontWeight="medium">
                {eventData.algorithm === "algorithm1" && "Algorithm 1 Selected: Pure Web3 Experience + Escrow"}
                {eventData.algorithm === "algorithm2" && "Algorithm 2 Selected: Mass Event Optimized + Escrow"}
                {eventData.algorithm === "algorithm3" && "Algorithm 3 Selected: Privacy-First Approach + Escrow"}
              </Text>
              <Text fontSize="sm">
                {eventData.algorithm === "algorithm1" && "Tech-savvy audience required. Users approve transactions at entry. All payments held in escrow until event completion."}
                {eventData.algorithm === "algorithm2" && "No wallet interaction at venue. QR codes refresh automatically. All payments secured with escrow protection."}
                {eventData.algorithm === "algorithm3" && "Complete anonymity guaranteed. Advanced cryptography for privacy. All payments protected with escrow system."}
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
          <TicketTierCreator
            tiers={ticketTiers}
            onChange={setTicketTiers}
            currency="IDRX"
          />
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
            onSave={setResellSettings}
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
                Create Event
              </Button>
            </HStack>
          </Flex>
        </form>
      </VStack>
    </Container>
  );
};
export default CreateEventForm;
