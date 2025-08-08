import React from "react";
import {
  Box,
  VStack,
  Checkbox,
  Text,
  Heading,
  Link,
  useColorModeValue,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";

export interface ConsentState {
  documentProcessingConsent: boolean;
  identityVerificationConsent: boolean;
  dataRetentionAcknowledged: boolean;
  communicationConsent: boolean;
}

export interface ConsentCheckboxesProps {
  consent: ConsentState;
  onChange: (field: keyof ConsentState, value: boolean) => void;
  showValidationError?: boolean;
}

const ConsentCheckboxes: React.FC<ConsentCheckboxesProps> = ({
  consent,
  onChange,
  showValidationError = false,
}) => {
  const bgColor = useColorModeValue("blue.50", "blue.900");
  const borderColor = useColorModeValue("blue.200", "blue.700");

  const allRequiredConsentsGiven = 
    consent.documentProcessingConsent &&
    consent.identityVerificationConsent &&
    consent.dataRetentionAcknowledged;

  return (
    <Box
      border="1px solid"
      borderColor={borderColor}
      borderRadius="md"
      p={6}
      bg={bgColor}
    >
      <VStack spacing={4} align="stretch">
        <Heading size="sm" color="blue.800">
          Data Processing Consent
        </Heading>

        <Text fontSize="sm" color="gray.600" lineHeight={1.6}>
          In accordance with data protection regulations, we need your consent 
          to process your personal information and documents for organizer verification.
        </Text>

        <VStack spacing={4} align="stretch">
          {/* Required Consents */}
          <Box>
            <Text fontSize="xs" fontWeight="bold" color="red.600" mb={2}>
              REQUIRED CONSENTS:
            </Text>
            
            <VStack spacing={3} align="stretch">
              <Checkbox
                isChecked={consent.documentProcessingConsent}
                onChange={(e) => onChange('documentProcessingConsent', e.target.checked)}
                colorScheme="blue"
                size="sm"
              >
                <Text fontSize="sm" lineHeight={1.5}>
                  I consent to Lummy processing my uploaded documents (NPWP, KTP, 
                  business license) for organizer verification purposes.
                </Text>
              </Checkbox>

              <Checkbox
                isChecked={consent.identityVerificationConsent}
                onChange={(e) => onChange('identityVerificationConsent', e.target.checked)}
                colorScheme="blue"
                size="sm"
              >
                <Text fontSize="sm" lineHeight={1.5}>
                  I consent to identity and business verification using the 
                  information and documents I provide.
                </Text>
              </Checkbox>

              <Checkbox
                isChecked={consent.dataRetentionAcknowledged}
                onChange={(e) => onChange('dataRetentionAcknowledged', e.target.checked)}
                colorScheme="blue"
                size="sm"
              >
                <Text fontSize="sm" lineHeight={1.5}>
                  I understand that my documents and data will be retained for 
                  2 years after approval for compliance purposes, and I can request 
                  deletion at any time via{" "}
                  <Link 
                    href="mailto:privacy@lummy.app" 
                    color="blue.600" 
                    textDecoration="underline"
                  >
                    privacy@lummy.app
                  </Link>
                </Text>
              </Checkbox>
            </VStack>
          </Box>

          {/* Optional Consents */}
          <Box pt={3} borderTop="1px solid" borderColor="gray.200">
            <Text fontSize="xs" fontWeight="bold" color="gray.600" mb={2}>
              OPTIONAL CONSENTS:
            </Text>
            
            <Checkbox
              isChecked={consent.communicationConsent}
              onChange={(e) => onChange('communicationConsent', e.target.checked)}
              colorScheme="blue"
              size="sm"
            >
              <Text fontSize="sm" lineHeight={1.5}>
                I would like to receive updates about new features, platform improvements, 
                and organizer resources via email (you can unsubscribe at any time).
              </Text>
            </Checkbox>
          </Box>

          {/* Data Rights Information */}
          <Box pt={3} borderTop="1px solid" borderColor="gray.200">
            <Text fontSize="xs" color="gray.500" lineHeight={1.4}>
              <strong>Your Rights:</strong> You have the right to access, correct, delete, 
              or port your data. You can withdraw consent at any time by contacting{" "}
              <Link 
                href="mailto:privacy@lummy.app" 
                color="blue.600" 
                textDecoration="underline"
              >
                privacy@lummy.app
              </Link>
              . For full details, see our{" "}
              <Link 
                href="/privacy-policy" 
                color="blue.600" 
                textDecoration="underline"
                isExternal
              >
                Privacy Policy
              </Link>
            </Text>
          </Box>
        </VStack>

        {/* Validation Error */}
        {showValidationError && !allRequiredConsentsGiven && (
          <Alert status="error" size="sm">
            <AlertIcon />
            <Text fontSize="sm">
              Please provide all required consents to proceed with your application.
            </Text>
          </Alert>
        )}

        {/* Success Message */}
        {allRequiredConsentsGiven && (
          <Alert status="success" size="sm">
            <AlertIcon />
            <Text fontSize="sm">
              Thank you for providing the required consents. You can now submit your application.
            </Text>
          </Alert>
        )}
      </VStack>
    </Box>
  );
};

// Helper function to check if all required consents are given
export const areRequiredConsentsGiven = (consent: ConsentState): boolean => {
  return (
    consent.documentProcessingConsent &&
    consent.identityVerificationConsent &&
    consent.dataRetentionAcknowledged
  );
};

// Default consent state
export const defaultConsentState: ConsentState = {
  documentProcessingConsent: false,
  identityVerificationConsent: false,
  dataRetentionAcknowledged: false,
  communicationConsent: false,
};

export default ConsentCheckboxes;