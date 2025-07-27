import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  VStack,
  HStack,
  Text,
  Progress,
  Box,
  Spinner,
  Icon,
  Badge,
  Flex
} from '@chakra-ui/react';
import { CheckCircleIcon, WarningIcon } from '@chakra-ui/icons';
import { FaUpload, FaImage, FaFileContract, FaRocket } from 'react-icons/fa';

interface ProgressStep {
  id: string;
  label: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  detail?: string;
  icon: React.ComponentType;
}

interface EventCreationProgressProps {
  isOpen: boolean;
  steps: ProgressStep[];
  currentStep?: string;
  onClose?: () => void;
}

const EventCreationProgress: React.FC<EventCreationProgressProps> = ({
  isOpen,
  steps,
  currentStep: _currentStep,
  onClose
}) => {
  const getStepProgress = () => {
    const completedSteps = steps.filter(step => step.status === 'completed').length;
    return (completedSteps / steps.length) * 100;
  };

  const getStatusIcon = (status: ProgressStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon w={5} h={5} color="green.500" />;
      case 'error':
        return <WarningIcon w={5} h={5} color="red.500" />;
      case 'in-progress':
        return <Spinner size="sm" color="purple.500" />;
      default:
        return <Box w={5} h={5} rounded="full" border="2px" borderColor="gray.300" />;
    }
  };

  const getStatusColor = (status: ProgressStep['status']) => {
    switch (status) {
      case 'completed':
        return 'green.500';
      case 'error':
        return 'red.500';
      case 'in-progress':
        return 'purple.500';
      default:
        return 'gray.400';
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose || (() => {})} 
      isCentered
      closeOnOverlayClick={false}
      closeOnEsc={false}
      size="md"
    >
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent>
        <ModalHeader>
          <VStack spacing={2} align="stretch">
            <Text>Creating Your Event</Text>
            <Progress 
              value={getStepProgress()} 
              colorScheme="purple" 
              size="sm" 
              rounded="full"
            />
            <Text fontSize="sm" color="gray.600">
              {Math.round(getStepProgress())}% Complete
            </Text>
          </VStack>
        </ModalHeader>
        
        <ModalBody pb={6}>
          <VStack spacing={4} align="stretch">
            {steps.map((step, index) => (
              <Box key={step.id}>
                <HStack spacing={4}>
                  {/* Step Icon */}
                  <Flex
                    w={12}
                    h={12}
                    rounded="full"
                    bg={step.status === 'in-progress' ? 'purple.50' : 'gray.50'}
                    border="2px"
                    borderColor={getStatusColor(step.status)}
                    align="center"
                    justify="center"
                    position="relative"
                  >
                    <Icon as={step.icon} w={5} h={5} color={getStatusColor(step.status)} />
                    <Box position="absolute" top="-1" right="-1">
                      {getStatusIcon(step.status)}
                    </Box>
                  </Flex>

                  {/* Step Content */}
                  <VStack align="start" flex="1" spacing={1}>
                    <HStack>
                      <Text fontWeight="medium" color={getStatusColor(step.status)}>
                        {step.label}
                      </Text>
                      {step.status === 'in-progress' && (
                        <Badge colorScheme="purple" variant="subtle" size="sm">
                          Processing...
                        </Badge>
                      )}
                    </HStack>
                    
                    {step.detail && (
                      <Text fontSize="sm" color="gray.600">
                        {step.detail}
                      </Text>
                    )}
                  </VStack>
                </HStack>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <Box
                    w="2px"
                    h={6}
                    bg={step.status === 'completed' ? 'green.200' : 'gray.200'}
                    ml={6}
                    mt={2}
                  />
                )}
              </Box>
            ))}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

// Default steps for event creation
export const createEventSteps = (): ProgressStep[] => [
  {
    id: 'banner-upload',
    label: 'Uploading Banner Image',
    status: 'pending',
    detail: 'Processing event banner image...',
    icon: FaImage
  },
  {
    id: 'nft-upload',
    label: 'Processing NFT Images',
    status: 'pending',
    detail: 'Uploading ticket tier NFT backgrounds...',
    icon: FaUpload
  },
  {
    id: 'metadata-upload',
    label: 'Generating Metadata',
    status: 'pending',
    detail: 'Creating event metadata and uploading to IPFS...',
    icon: FaFileContract
  },
  {
    id: 'contract-creation',
    label: 'Creating Event Contract',
    status: 'pending',
    detail: 'Deploying event to blockchain...',
    icon: FaRocket
  }
];

export default EventCreationProgress;