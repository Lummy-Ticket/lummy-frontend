import React, { useState } from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  IconButton,
  Input,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Textarea,
  Divider,
  Flex,
  Badge,
  useToast,
} from "@chakra-ui/react";
import { DeleteIcon, AddIcon } from "@chakra-ui/icons";
import { isValidTokenAmount, isValidUint256, parseTokenAmount } from "../../utils/contractUtils";
import NFTImageUpload from "./NFTImageUpload";

export interface TicketTierInput {
  id: string;
  name: string;
  description: string;
  price: number;  // Keep as number for UI input
  quantity: number;  // Keep as number for UI input
  maxPerPurchase: number;  // Keep as number for UI input
  benefits: string[];
  // NFT Image properties
  nftImage?: File | null;
  nftImageUrl?: string; // For preview/mock
  nftDescription?: string;
  // Contract-compatible fields
  active?: boolean;
  sold?: number;
}

// Validation errors type
interface ValidationErrors {
  [key: string]: {
    name?: string;
    price?: string;
    quantity?: string;
    maxPerPurchase?: string;
  };
}

interface TicketTierCreatorProps {
  tiers: TicketTierInput[];
  onChange: (tiers: TicketTierInput[]) => void;
  currency?: string;
  eventTitle?: string; // For NFT metadata
}

const TicketTierCreator: React.FC<TicketTierCreatorProps> = ({
  tiers,
  onChange,
  currency = "IDRX",
  eventTitle = "",
}) => {
  const toast = useToast();
  const [benefitInput, setBenefitInput] = useState<{ [key: string]: string }>(
    {}
  );
  const [errors, setErrors] = useState<ValidationErrors>({});

  const bgColor = "white";
  const borderColor = "gray.200";

  const handleAddTier = () => {
    const newTier: TicketTierInput = {
      id: `tier-${Date.now()}`,
      name: "",
      description: "",
      price: 0,
      quantity: 100,
      maxPerPurchase: 4,
      benefits: [],
      active: true,
      sold: 0,
    };
    onChange([...tiers, newTier]);
  };

  const handleRemoveTier = (id: string) => {
    onChange(tiers.filter((tier) => tier.id !== id));
  };

  const validateTier = (tier: TicketTierInput): { [key: string]: string } => {
    const tierErrors: { [key: string]: string } = {};
    
    if (!tier.name.trim()) {
      tierErrors.name = "Tier name is required";
    }
    
    if (tier.price <= 0) {
      tierErrors.price = "Price must be greater than 0";
    } else if (!isValidTokenAmount(tier.price.toString())) {
      tierErrors.price = "Invalid price format";
    } else {
      try {
        const priceInWei = parseTokenAmount(tier.price.toString());
        if (!isValidUint256(priceInWei)) {
          tierErrors.price = "Price is too large";
        }
      } catch {
        tierErrors.price = "Invalid price format";
      }
    }
    
    if (tier.quantity <= 0) {
      tierErrors.quantity = "Quantity must be greater than 0";
    } else if (!isValidUint256(BigInt(tier.quantity))) {
      tierErrors.quantity = "Quantity is too large";
    }
    
    if (tier.maxPerPurchase <= 0) {
      tierErrors.maxPerPurchase = "Max per purchase must be greater than 0";
    } else if (tier.maxPerPurchase > tier.quantity) {
      tierErrors.maxPerPurchase = "Max per purchase cannot exceed quantity";
    } else if (!isValidUint256(BigInt(tier.maxPerPurchase))) {
      tierErrors.maxPerPurchase = "Max per purchase is too large";
    }
    
    return tierErrors;
  };

  const handleTierChange = (
    id: string,
    field: keyof TicketTierInput,
    value: any
  ) => {
    const updatedTiers = tiers.map((tier) => {
      if (tier.id === id) {
        return { ...tier, [field]: value };
      }
      return tier;
    });
    
    // Validate the updated tier
    const updatedTier = updatedTiers.find(t => t.id === id);
    if (updatedTier) {
      const tierErrors = validateTier(updatedTier);
      setErrors(prev => ({
        ...prev,
        [id]: tierErrors
      }));
    }
    
    onChange(updatedTiers);
  };

  const handleAddBenefit = (id: string) => {
    if (!benefitInput[id] || benefitInput[id].trim() === "") {
      toast({
        title: "Empty benefit",
        description: "Please enter a benefit description",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const tier = tiers.find((t) => t.id === id);
    if (tier) {
      const updatedTier = {
        ...tier,
        benefits: [...tier.benefits, benefitInput[id]],
      };

      handleTierChange(id, "benefits", updatedTier.benefits);
      setBenefitInput({ ...benefitInput, [id]: "" });
    }
  };

  const handleRemoveBenefit = (tierId: string, index: number) => {
    const tier = tiers.find((t) => t.id === tierId);
    if (tier) {
      const updatedBenefits = [...tier.benefits];
      updatedBenefits.splice(index, 1);
      handleTierChange(tierId, "benefits", updatedBenefits);
    }
  };

  return (
    <VStack spacing={6} align="stretch">
      <Flex justify="space-between" align="center">
        <Text fontSize="xl" fontWeight="bold">
          Ticket Tiers
        </Text>
        <Button
          leftIcon={<AddIcon />}
          colorScheme="purple"
          size="sm"
          onClick={handleAddTier}
        >
          Add Tier
        </Button>
      </Flex>

      {tiers.length === 0 ? (
        <Box
          p={8}
          borderWidth="1px"
          borderRadius="md"
          borderStyle="dashed"
          borderColor={borderColor}
          textAlign="center"
        >
          <Text color="gray.500">
            No ticket tiers added yet. Click "Add Tier" to create your first
            ticket tier.
          </Text>
        </Box>
      ) : (
        <VStack spacing={6} align="stretch">
          {tiers.map((tier, index) => (
            <Box
              key={tier.id}
              p={6}
              borderWidth="1px"
              borderRadius="md"
              bg={bgColor}
              shadow="sm"
            >
              <Flex justify="space-between" mb={4}>
                <Badge colorScheme="purple" fontSize="sm" px={2} py={1}>
                  Tier {index + 1}
                </Badge>
                <IconButton
                  aria-label="Remove tier"
                  icon={<DeleteIcon />}
                  size="sm"
                  colorScheme="red"
                  variant="ghost"
                  onClick={() => handleRemoveTier(tier.id)}
                />
              </Flex>

              <VStack spacing={4} align="stretch">
                <FormControl isInvalid={!!errors[tier.id]?.name}>
                  <FormLabel>Tier Name</FormLabel>
                  <Input
                    value={tier.name}
                    onChange={(e) =>
                      handleTierChange(tier.id, "name", e.target.value)
                    }
                    placeholder="e.g. General Admission, VIP, Early Bird"
                  />
                  <FormErrorMessage>{errors[tier.id]?.name}</FormErrorMessage>
                </FormControl>

                <FormControl>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    value={tier.description}
                    onChange={(e) =>
                      handleTierChange(tier.id, "description", e.target.value)
                    }
                    placeholder="Describe what this ticket tier offers"
                    rows={2}
                  />
                </FormControl>

                <HStack spacing={4}>
                  <FormControl isInvalid={!!errors[tier.id]?.price}>
                    <FormLabel>Price ({currency})</FormLabel>
                    <NumberInput
                      min={0}
                      max={1000000}  // Max 1M tokens
                      precision={6}  // Allow up to 6 decimal places
                      value={tier.price}
                      onChange={(_, value) =>
                        handleTierChange(tier.id, "price", value || 0)
                      }
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                    <FormErrorMessage>{errors[tier.id]?.price}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors[tier.id]?.quantity}>
                    <FormLabel>Quantity Available</FormLabel>
                    <NumberInput
                      min={1}
                      max={1000000}  // Reasonable max for ticket quantity
                      value={tier.quantity}
                      onChange={(_, value) =>
                        handleTierChange(tier.id, "quantity", value || 1)
                      }
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                    <FormErrorMessage>{errors[tier.id]?.quantity}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors[tier.id]?.maxPerPurchase}>
                    <FormLabel>Max Per Purchase</FormLabel>
                    <NumberInput
                      min={1}
                      max={Math.min(tier.quantity, 100)}  // Max 100 or quantity, whichever is smaller
                      value={tier.maxPerPurchase}
                      onChange={(_, value) =>
                        handleTierChange(tier.id, "maxPerPurchase", value || 1)
                      }
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                    <FormErrorMessage>{errors[tier.id]?.maxPerPurchase}</FormErrorMessage>
                  </FormControl>
                </HStack>

                <Divider />

                {/* NFT Image Upload Section */}
                <NFTImageUpload
                  tierId={tier.id}
                  tierName={tier.name}
                  eventTitle={eventTitle}
                  currentImage={tier.nftImage}
                  currentImageUrl={tier.nftImageUrl}
                  onImageChange={(image, imageUrl) => {
                    handleTierChange(tier.id, "nftImage", image);
                    handleTierChange(tier.id, "nftImageUrl", imageUrl);
                  }}
                  onMetadataReady={(metadataUrl) => {
                    // Store metadata URL for contract integration
                    console.log('🎨 NFT Metadata ready:', { tierId: tier.id, metadataUrl });
                  }}
                  label={`NFT Background for ${tier.name || 'Tier'}`}
                />

                <Divider />

                <FormControl>
                  <FormLabel>Benefits (Optional)</FormLabel>
                  <VStack spacing={2} align="stretch">
                    {tier.benefits.map((benefit, idx) => (
                      <Flex key={idx} align="center">
                        <Text flex="1" fontSize="sm">
                          {benefit}
                        </Text>
                        <IconButton
                          aria-label="Remove benefit"
                          icon={<DeleteIcon />}
                          size="xs"
                          colorScheme="red"
                          variant="ghost"
                          onClick={() => handleRemoveBenefit(tier.id, idx)}
                        />
                      </Flex>
                    ))}

                    <HStack>
                      <Input
                        placeholder="Add a benefit (e.g. VIP access, merchandise)"
                        size="sm"
                        value={benefitInput[tier.id] || ""}
                        onChange={(e) =>
                          setBenefitInput({
                            ...benefitInput,
                            [tier.id]: e.target.value,
                          })
                        }
                      />
                      <Button
                        size="sm"
                        leftIcon={<AddIcon />}
                        onClick={() => handleAddBenefit(tier.id)}
                      >
                        Add
                      </Button>
                    </HStack>
                  </VStack>
                </FormControl>
              </VStack>
            </Box>
          ))}
        </VStack>
      )}
    </VStack>
  );
};

export default TicketTierCreator;
