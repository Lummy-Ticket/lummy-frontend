import React, { useState } from "react";
import {
  Box,
  VStack,
  Text,
  Switch,
  FormControl,
  FormLabel,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Flex,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
  HStack,
  Badge,
} from "@chakra-ui/react";

export interface ResellSettingsData {
  allowResell: boolean;             // Enable/disable resale completely
  maxMarkupPercentage: number;      // Max 50% (5000 basis points)
  organizerFeePercentage: number;   // Max 10% (1000 basis points)
  restrictResellTiming: boolean;    // Enable timing restrictions
  minDaysBeforeEvent: number;       // Minimum days before event
}

// Utility functions for contract compatibility
export const convertToContractFormat = (settings: ResellSettingsData) => ({
  allowResell: settings.allowResell,
  maxMarkupPercentage: Math.round(settings.maxMarkupPercentage * 100), // % to basis points
  organizerFeePercentage: Math.round(settings.organizerFeePercentage * 100), // % to basis points
  restrictResellTiming: settings.restrictResellTiming,
  minDaysBeforeEvent: settings.minDaysBeforeEvent,
});

export const convertFromContractFormat = (contractData: any): ResellSettingsData => ({
  allowResell: contractData.allowResell,
  maxMarkupPercentage: contractData.maxMarkupPercentage / 100, // basis points to %
  organizerFeePercentage: contractData.organizerFeePercentage / 100, // basis points to %
  restrictResellTiming: contractData.restrictResellTiming,
  minDaysBeforeEvent: contractData.minDaysBeforeEvent,
});

interface ResellSettingsProps {
  settings: ResellSettingsData;
  onSave: (settings: ResellSettingsData) => void; // Changed back to onSave for manual save
}

const ResellSettings: React.FC<ResellSettingsProps> = ({
  settings,
  onSave,
}) => {
  const [currentSettings, setCurrentSettings] =
    useState<ResellSettingsData>(settings);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const cardBg = "white";

  const handleChange = (field: keyof ResellSettingsData, value: any) => {
    const newSettings = {
      ...currentSettings,
      [field]: value,
    };
    
    setCurrentSettings(newSettings);
    setHasUnsavedChanges(true);
    
    // Show contract values in console for debugging
    const contractFormat = convertToContractFormat(newSettings);
    console.log("Frontend settings updated:", newSettings);
    console.log("Contract format:", contractFormat);
  };

  const handleSave = () => {
    onSave(currentSettings);
    setHasUnsavedChanges(false);
  };

  return (
    <Box
      bg={cardBg}
      p={4}
      border="2px solid"
      borderColor="gray.200"
      borderRadius="md"
      shadow="sm"
    >
      <VStack spacing={6} align="stretch">
        <VStack spacing={2} align="stretch">
          <Text fontSize="xl" fontWeight="bold">
            Ticket Resale Settings
          </Text>
          <Text fontSize="sm" color="gray.600">
            Configure resale rules for your event tickets. These settings are enforced by smart contract.
          </Text>
          <Text fontSize="xs" color="orange.600" fontWeight="medium">
            ⚠️ Remember to save your changes before leaving this page
          </Text>
        </VStack>

        <Divider />

        {/* Master Toggle for Resale */}
        <FormControl display="flex" alignItems="center">
          <VStack align="start" flex={1} spacing={1}>
            <FormLabel mb="0" fontWeight="semibold">
              Enable Ticket Resale
            </FormLabel>
            <Text fontSize="sm" color="gray.500">
              Allow tickets for this event to be resold on the marketplace
            </Text>
          </VStack>
          <Switch
            colorScheme="purple"
            size="lg"
            isChecked={currentSettings.allowResell}
            onChange={(e) =>
              handleChange("allowResell", e.target.checked)
            }
          />
        </FormControl>

        {/* Show other settings only if resale is enabled */}
        {currentSettings.allowResell && (
          <>
            <Divider />

        <Box>
          <FormLabel>Maximum Markup Percentage</FormLabel>
          <Text fontSize="sm" color="gray.500" mb={2}>
            Set the maximum percentage above original price that tickets can
            be resold for. (Contract enforced - max 50%)
          </Text>
          <Flex>
            <Slider
              min={0}
              max={50}
              step={5}
              value={currentSettings.maxMarkupPercentage}
              onChange={(val) => handleChange("maxMarkupPercentage", val)}
              mr={4}
              flex={1}
              colorScheme="purple"
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb />
            </Slider>
            <NumberInput
              maxW="100px"
              min={0}
              max={50}
              value={currentSettings.maxMarkupPercentage}
              onChange={(_, val) =>
                handleChange("maxMarkupPercentage", val)
              }
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
            <Text ml={2} alignSelf="center">
              %
            </Text>
          </Flex>
        </Box>

        <Box>
          <FormLabel>Organizer Fee Percentage</FormLabel>
          <Text fontSize="sm" color="gray.500" mb={2}>
            Set the percentage fee you'll receive from each resale
            transaction. (Contract enforced - max 10%)
          </Text>
          <Flex>
            <Slider
              min={0}
              max={10}
              step={0.5}
              value={currentSettings.organizerFeePercentage}
              onChange={(val) =>
                handleChange("organizerFeePercentage", val)
              }
              mr={4}
              flex={1}
              colorScheme="purple"
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb />
            </Slider>
            <NumberInput
              maxW="100px"
              min={0}
              max={10}
              step={0.5}
              value={currentSettings.organizerFeePercentage}
              onChange={(_, val) =>
                handleChange("organizerFeePercentage", val)
              }
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
            <Text ml={2} alignSelf="center">
              %
            </Text>
          </Flex>
          <Text fontSize="xs" color="gray.500" mt={1}>
            Note: Lummy platform fee (1%) is applied automatically to all
            resales.
          </Text>
        </Box>

        <FormControl display="flex" alignItems="center">
          <VStack align="start" flex={1} spacing={1}>
            <FormLabel mb="0">Restrict resale timing</FormLabel>
            <Text fontSize="sm" color="gray.500">
              Prevent resales too close to the event date
            </Text>
          </VStack>
          <Switch
            colorScheme="purple"
            isChecked={currentSettings.restrictResellTiming}
            onChange={(e) =>
              handleChange("restrictResellTiming", e.target.checked)
            }
          />
        </FormControl>

        {currentSettings.restrictResellTiming && (
          <Box pl={4}>
            <FormLabel>Minimum Days Before Event</FormLabel>
            <Text fontSize="sm" color="gray.500" mb={2}>
              Prevent resales too close to the event date.
            </Text>
            <NumberInput
              maxW="100px"
              min={0}
              max={30}
              value={currentSettings.minDaysBeforeEvent}
              onChange={(_, val) => handleChange("minDaysBeforeEvent", val)}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </Box>
        )}

          </>
        )}

        {/* Warning when resale is disabled */}
        {!currentSettings.allowResell && (
          <Alert status="warning">
            <AlertIcon />
            <Box>
              <AlertTitle>Ticket resale is disabled!</AlertTitle>
              <AlertDescription>
                Attendees will not be able to resell their tickets on the marketplace. 
                This may reduce ticket sales flexibility but gives you more control over attendance.
              </AlertDescription>
            </Box>
          </Alert>
        )}

        {/* Save Button Section */}
        <Divider />
        <HStack justify="space-between" align="center" pt={2}>
          <HStack>
            {hasUnsavedChanges && (
              <Badge colorScheme="orange" variant="subtle">
                Unsaved Changes
              </Badge>
            )}
            <Text fontSize="sm" color="gray.500">
              Changes need to be saved manually
            </Text>
          </HStack>
          <Button
            colorScheme="purple"
            onClick={handleSave}
            isDisabled={!hasUnsavedChanges}
            size="md"
          >
            Save Settings
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};

export default ResellSettings;
