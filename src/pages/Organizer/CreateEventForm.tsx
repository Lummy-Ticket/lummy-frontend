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
  useDisclosure,
} from "@chakra-ui/react";
import { ArrowBackIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";
import TicketTierCreator, {
  TicketTierInput,
} from "../../components/organizer/TicketTierCreator";
import ResellSettings, {
  ResellSettingsData,
} from "../../components/organizer/ResellSettings";
import ImageCropModal from "../../components/common/ImageCropModal";
import { useSmartContract } from "../../hooks/useSmartContract";
import { uploadToIPFS, uploadJSONMetadata } from "../../services/IPFSService";
import { TwoImageUploadState, ImageType, IMAGE_SPECS } from "../../types/IPFSMetadata";
import { formatFileSize, createIPFSMetadata } from "../../utils/ipfsMetadata";

const CreateEventForm: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  
  // Image crop modal state
  const { isOpen: isCropModalOpen, onOpen: onCropModalOpen, onClose: onCropModalClose } = useDisclosure();
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [pendingImageType, setPendingImageType] = useState<ImageType>('POSTER');

  const cardBg = "white";

  // Form state
  const [eventData, setEventData] = useState({
    title: "",
    description: "",
    venue: "",
    date: "",
    time: "",
    endTime: "",
    category: "",
    eventImageHash: "", // Final IPFS metadata hash for contract
  });

  // Phase 2.1: 2-image upload state with IPFS hash tracking
  const [imageUploads, setImageUploads] = useState<TwoImageUploadState>({
    posterImage: null,
    bannerImage: null,
  });

  // Individual IPFS upload results for immediate preview
  const [ipfsResults, setIpfsResults] = useState<{
    posterHash?: string;
    bannerHash?: string;
  }>({});

  // Note: Tier NFT uploads are handled directly by TicketTierCreator component

  // Note: Individual auto-uploads replaced batch upload state

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

  // Handle file selection - opens crop modal instead of direct upload
  const handleImageSelection = (imageType: ImageType, file: File) => {
    // Basic file validation
    if (!file.type.startsWith('image/')) {
      toast({
        title: `Invalid ${IMAGE_SPECS[imageType].name}`,
        description: 'File must be an image',
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (file.size > IMAGE_SPECS[imageType].maxSize) {
      toast({
        title: `File Too Large`,
        description: `File size (${formatFileSize(file.size)}) exceeds maximum ${formatFileSize(IMAGE_SPECS[imageType].maxSize)}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    // Open crop modal
    setPendingImageFile(file);
    setPendingImageType(imageType);
    onCropModalOpen();
  };

  // Handle cropped image from modal - Auto-upload after crop
  const handleCroppedImage = async (croppedFile: File) => {
    console.log(`📤 ${IMAGE_SPECS[pendingImageType].name} cropped:`, croppedFile.name, formatFileSize(croppedFile.size));

    // Only POSTER and BANNER supported for event images
    if (pendingImageType !== 'POSTER' && pendingImageType !== 'BANNER') {
      toast({
        title: "Unsupported Image Type",
        description: `${pendingImageType} is not supported for event images`,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    const imageKey = pendingImageType === 'POSTER' ? 'posterImage' : 'bannerImage';
    
    // Set uploading state
    setImageUploads(prev => ({
      ...prev,
      [imageKey]: {
        file: croppedFile,
        uploaded: false,
        uploading: true,
        error: undefined
      }
    }));

    try {
      // Auto-upload to IPFS immediately after crop
      console.log(`🚀 Auto-uploading ${IMAGE_SPECS[pendingImageType].name} to IPFS...`);
      
      const uploadResult = await uploadToIPFS(croppedFile);
      
      if (uploadResult.success && uploadResult.hash) {
        // Update upload state with success
        setImageUploads(prev => ({
          ...prev,
          [imageKey]: {
            file: croppedFile,
            uploaded: true,
            uploading: false,
            error: undefined
          }
        }));

        // Store IPFS hash for preview
        setIpfsResults(prev => ({
          ...prev,
          [pendingImageType === 'POSTER' ? 'posterHash' : 'bannerHash']: uploadResult.hash
        }));

        const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${uploadResult.hash}`;
        
        toast({
          title: `${IMAGE_SPECS[pendingImageType].name} Uploaded!`,
          description: `Successfully uploaded to IPFS. Click to view: ${uploadResult.hash.substring(0, 8)}...`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });

        console.log(`✅ ${IMAGE_SPECS[pendingImageType].name} auto-upload successful:`, {
          hash: uploadResult.hash,
          url: ipfsUrl,
          fileSize: formatFileSize(croppedFile.size)
        });

      } else {
        throw new Error(uploadResult.error || 'Upload failed');
      }

    } catch (error) {
      console.error(`❌ Auto-upload failed for ${IMAGE_SPECS[pendingImageType].name}:`, error);
      
      // Update upload state with error
      setImageUploads(prev => ({
        ...prev,
        [imageKey]: {
          file: croppedFile,
          uploaded: false,
          uploading: false,
          error: error instanceof Error ? error.message : 'Upload failed'
        }
      }));

      toast({
        title: `${IMAGE_SPECS[pendingImageType].name} Upload Failed`,
        description: error instanceof Error ? error.message : "Failed to upload to IPFS",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Note: Individual auto-uploads now handle IPFS uploads

  const { initializeEvent, addTicketTier, setResaleRules, clearTiers, loading, error } = useSmartContract();

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Small delay to ensure state is fully updated from recent NFT uploads
    await new Promise(resolve => setTimeout(resolve, 100));

    // Phase 2: Enhanced form validation with image requirements
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

    // Phase 2.1: Validate that event images are uploaded (auto-uploaded)
    if (!ipfsResults.posterHash || !ipfsResults.bannerHash) {
      toast({
        title: "Images Required",
        description: "Please upload and crop both Event Poster and Event Banner before creating the event",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Check if all tiers have NFT images
    console.log('🔍 Debug - All tiers before validation:', ticketTiers.map(t => ({ 
      id: t.id, 
      name: t.name, 
      hasNFTImage: !!t.nftImage,
      hasNFTImageUrl: !!t.nftImageUrl,
      nftImageType: typeof t.nftImage
    })));
    
    // Check for either nftImage (File) or nftImageUrl (string) as fallback
    const tiersWithoutNFT = ticketTiers.filter(tier => !tier.nftImage && !tier.nftImageUrl);
    if (tiersWithoutNFT.length > 0) {
      console.log('❌ Tiers without NFT:', tiersWithoutNFT.map(t => ({ id: t.id, name: t.name })));
      toast({
        title: "Missing Tier NFT Backgrounds",
        description: `Please add NFT background images for: ${tiersWithoutNFT.map(t => t.name).join(', ')}`,
        status: "error",
        duration: 4000,
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

      // Step 1: Create final JSON metadata combining all IPFS images
      console.log("📦 Step 1: Creating final JSON metadata...");
      
      // Validate that we have required event images
      if (!ipfsResults.posterHash || !ipfsResults.bannerHash) {
        throw new Error('Missing required event images. Please ensure both Event Poster and Event Banner are uploaded.');
      }
      
      // Collect tier NFT background URLs from ticketTiers state
      const tierBackgrounds: Record<string, string> = {};
      ticketTiers.forEach(tier => {
        if (tier.nftImageUrl) {
          // Extract hash from full IPFS URL
          const hashMatch = tier.nftImageUrl.match(/\/ipfs\/(.+)$/);
          if (hashMatch) {
            tierBackgrounds[tier.id] = hashMatch[1];
          }
        }
      });
      
      console.log('🎯 Collected IPFS data:', {
        posterHash: ipfsResults.posterHash,
        bannerHash: ipfsResults.bannerHash,
        tierBackgrounds: Object.keys(tierBackgrounds),
        totalImages: 2 + Object.keys(tierBackgrounds).length
      });
      
      // Create JSON metadata object
      const jsonMetadata = createIPFSMetadata(
        ipfsResults.posterHash || '',
        ipfsResults.bannerHash || '',
        tierBackgrounds,
        {
          eventTitle: eventData.title,
          description: eventData.description,
          createdBy: 'organizer-dashboard',
          tierCount: String(ticketTiers.length)
        }
      );
      
      // Upload JSON metadata to IPFS
      console.log("📤 Uploading final JSON metadata to IPFS...");
      const metadataResult = await uploadJSONMetadata(jsonMetadata, `${eventData.title}-metadata-${Date.now()}.json`);
      
      if (!metadataResult.success || !metadataResult.metadataHash) {
        throw new Error(`JSON metadata upload failed: ${metadataResult.error}`);
      }
      
      console.log("✅ Final JSON metadata uploaded successfully:", metadataResult.metadataHash);
      
      // Step 2: Initialize the event with JSON metadata hash
      console.log("🚀 Step 2: Initializing event with JSON metadata...");
      const eventResult = await initializeEvent(
        eventData.title,
        eventData.description,
        eventDate,
        eventData.venue,
        metadataResult.metadataHash, // Pass JSON metadata hash ke contract
        eventData.category // Pass category ke contract
      );

      if (!eventResult) {
        throw new Error("Event initialization failed");
      }

      console.log("✅ Event initialized successfully:", eventResult);

      // Step 3: Create ticket tiers
      console.log("🎫 Step 3: Creating ticket tiers...");
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

            {/* Phase 2.1: Event Images (2 Required) - NFT Backgrounds moved to Tier Creator */}
            <FormControl>
              <FormLabel>Event Images (2 Required)</FormLabel>
              <VStack spacing={4} align="stretch">
                <Text fontSize="sm" color="gray.600" mb={2}>
                  Upload 2 event images. NFT backgrounds are configured per-tier in the ticket section below:
                </Text>

                {/* Poster Image - 16:9 */}
                <Box border="1px solid" borderColor="gray.200" borderRadius="md" p={4}>
                  <FormLabel fontSize="sm" fontWeight="semibold" color="blue.600">
                    1. Event Poster (16:9 ratio)
                  </FormLabel>
                  <Text fontSize="xs" color="gray.500" mb={2}>
                    Used in event cards and listings. Recommended: 1200×675px
                  </Text>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleImageSelection('POSTER', e.target.files[0]);
                      }
                    }}
                    disabled={false}
                    size="sm"
                  />
                  {imageUploads.posterImage?.file && (
                    <VStack mt={2} spacing={2} align="stretch">
                      <HStack spacing={2}>
                        <Badge colorScheme={imageUploads.posterImage.uploaded ? "green" : imageUploads.posterImage.uploading ? "yellow" : "gray"} size="sm">
                          {imageUploads.posterImage.uploading ? "Uploading..." : 
                           imageUploads.posterImage.uploaded ? "✅ Uploaded" : 
                           imageUploads.posterImage.file.name}
                        </Badge>
                        <Text fontSize="xs" color="gray.500">
                          {formatFileSize(imageUploads.posterImage.file.size)}
                        </Text>
                      </HStack>
                      {ipfsResults.posterHash && (
                        <HStack spacing={2}>
                          <Badge colorScheme="purple" size="xs">IPFS</Badge>
                          <Text fontSize="xs" color="blue.600" as="a" 
                                href={`https://gateway.pinata.cloud/ipfs/${ipfsResults.posterHash}`}
                                target="_blank" _hover={{ textDecoration: 'underline' }}>
                            {ipfsResults.posterHash.substring(0, 12)}...
                          </Text>
                        </HStack>
                      )}
                      {imageUploads.posterImage.error && (
                        <Text fontSize="xs" color="red.500">
                          ❌ {imageUploads.posterImage.error}
                        </Text>
                      )}
                    </VStack>
                  )}
                </Box>

                {/* Banner Image - 21:9 */}
                <Box border="1px solid" borderColor="gray.200" borderRadius="md" p={4}>
                  <FormLabel fontSize="sm" fontWeight="semibold" color="green.600">
                    2. Event Banner (21:9 ratio)
                  </FormLabel>
                  <Text fontSize="xs" color="gray.500" mb={2}>
                    Used as hero image on event detail pages. Recommended: 1920×823px
                  </Text>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleImageSelection('BANNER', e.target.files[0]);
                      }
                    }}
                    disabled={false}
                    size="sm"
                  />
                  {imageUploads.bannerImage?.file && (
                    <VStack mt={2} spacing={2} align="stretch">
                      <HStack spacing={2}>
                        <Badge colorScheme={imageUploads.bannerImage.uploaded ? "green" : imageUploads.bannerImage.uploading ? "yellow" : "gray"} size="sm">
                          {imageUploads.bannerImage.uploading ? "Uploading..." : 
                           imageUploads.bannerImage.uploaded ? "✅ Uploaded" : 
                           imageUploads.bannerImage.file.name}
                        </Badge>
                        <Text fontSize="xs" color="gray.500">
                          {formatFileSize(imageUploads.bannerImage.file.size)}
                        </Text>
                      </HStack>
                      {ipfsResults.bannerHash && (
                        <HStack spacing={2}>
                          <Badge colorScheme="purple" size="xs">IPFS</Badge>
                          <Text fontSize="xs" color="blue.600" as="a" 
                                href={`https://gateway.pinata.cloud/ipfs/${ipfsResults.bannerHash}`}
                                target="_blank" _hover={{ textDecoration: 'underline' }}>
                            {ipfsResults.bannerHash.substring(0, 12)}...
                          </Text>
                        </HStack>
                      )}
                      {imageUploads.bannerImage.error && (
                        <Text fontSize="xs" color="red.500">
                          ❌ {imageUploads.bannerImage.error}
                        </Text>
                      )}
                    </VStack>
                  )}
                </Box>

                {/* Auto-upload Status Info */}
                <Alert status="info" variant="subtle">
                  <AlertIcon />
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="medium">Auto-Upload Enabled</Text>
                    <Text fontSize="sm">
                      Images automatically upload to IPFS after cropping. 
                      Check individual IPFS links above for verification.
                    </Text>
                    {ipfsResults.posterHash && ipfsResults.bannerHash && (
                      <Badge colorScheme="green" mt={1}>
                        ✅ Event images ready for deployment
                      </Badge>
                    )}
                  </VStack>
                </Alert>

                <FormHelperText>
                  Upload event images first, then configure NFT backgrounds per tier below. All images will be combined into final metadata.
                </FormHelperText>
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
        </Box>

{/* Phase 2: Event Image section removed - now handled by 3-image upload system above */}

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
              onChange={(newTiers) => {
                console.log('🔄 TicketTiers updated in CreateEventForm:', newTiers.map(t => ({ 
                  id: t.id, 
                  name: t.name, 
                  hasNFTImage: !!t.nftImage, 
                  hasNFTImageUrl: !!t.nftImageUrl 
                })));
                setTicketTiers(newTiers);
              }}
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
                {loading ? "Creating Event & Tiers..." : "Create Event & Tiers"}
              </Button>
            </HStack>
          </Flex>
        </form>

        {/* Image Crop Modal */}
        <ImageCropModal
          isOpen={isCropModalOpen}
          onClose={onCropModalClose}
          imageFile={pendingImageFile}
          imageType={pendingImageType}
          onCropComplete={handleCroppedImage}
        />
      </VStack>
    </Container>
  );
};
export default CreateEventForm;
