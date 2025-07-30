import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  VStack,
  Text,
  Alert,
  AlertIcon,
  FormControl,
  FormLabel,
  FormErrorMessage,
  PinInput,
  PinInputField,
  HStack,
  Badge,
  Box,
  Divider,
  Switch,
  FormHelperText,
  useToast,
  Spinner,
  Icon,
} from '@chakra-ui/react';
import { FaEnvelope, FaCheck, FaCog } from 'react-icons/fa';
import { useAccount } from 'wagmi';
import { useEmailService } from '../../hooks/useEmailService';

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerificationComplete?: () => void;
}

type Step = 'submit' | 'verify' | 'preferences' | 'complete';

const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  isOpen,
  onClose,
  onVerificationComplete,
}) => {
  const { address } = useAccount();
  const {
    loading,
    error,
    checkEmailExists,
    submitEmail,
    verifyEmail,
    updateNotificationPreferences,
    resendVerificationCode,
  } = useEmailService();
  
  const toast = useToast();
  const [currentStep, setCurrentStep] = useState<Step>('submit');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [emailError, setEmailError] = useState('');
  const [preferences, setPreferences] = useState({
    ticket_purchase: true,
    ticket_resale: true, 
    event_reminders: true,
    price_alerts: false,
    marketing: false,
  });

  // Check existing email on modal open
  useEffect(() => {
    if (isOpen && address) {
      checkEmailExists().then((existingEmail) => {
        if (existingEmail) {
          setEmail(existingEmail.email);
          setPreferences(existingEmail.notification_preferences);
          
          if (existingEmail.email_verified) {
            setCurrentStep('complete');
          } else {
            setCurrentStep('verify');
          }
        } else {
          setCurrentStep('submit');
        }
      });
    }
  }, [isOpen, address, checkEmailExists]);

  // Handle verification
  const handleVerification = async () => {
    if (verificationCode.length !== 6) {
      return;
    }

    const success = await verifyEmail(verificationCode);
    if (success) {
      setCurrentStep('preferences');
      toast({
        title: 'Email verified successfully!',
        description: 'Now you can customize your notification preferences.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Listen for auto-fill verification code event (development mode)
  useEffect(() => {
    const handleAutoFill = (event: CustomEvent) => {
      const { code } = event.detail;
      console.log('🎯 Auto-filling verification code:', code, 'Current step:', currentStep);
      
      // Only auto-fill if we're in verify step and not loading
      if (currentStep === 'verify' && !loading) {
        console.log('✨ Auto-filling code and setting up auto-submit');
        setVerificationCode(code);
        
        // Auto-submit after a brief delay (only if still not loading)
        setTimeout(() => {
          if (!loading && currentStep === 'verify') {
            console.log('🚀 Auto-submitting verification...');
            handleVerification();
          } else {
            console.log('⏳ Conditions changed, skipping auto-submit. Loading:', loading, 'Step:', currentStep);
          }
        }, 1500); // Increased delay to 1.5 seconds
      } else {
        console.log('⚠️ Not ready for auto-fill. Step:', currentStep, 'Loading:', loading);
      }
    };

    console.log('👂 Setting up auto-fill listener. Current step:', currentStep);
    window.addEventListener('devVerificationCode', handleAutoFill as EventListener);

    return () => {
      window.removeEventListener('devVerificationCode', handleAutoFill as EventListener);
    };
  }, [handleVerification, currentStep, loading]);

  // Handle email submission
  const handleEmailSubmit = async () => {
    setEmailError('');
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    const success = await submitEmail(email);
    if (success) {
      setCurrentStep('verify');
      toast({
        title: 'Verification code sent!',
        description: 'Please check your email for the 6-digit verification code.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Handle preferences update
  const handlePreferencesUpdate = async () => {
    const success = await updateNotificationPreferences(preferences);
    if (success) {
      setCurrentStep('complete');
      toast({
        title: 'Preferences saved!',
        description: 'You will receive notifications based on your preferences.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Auto-close modal after 3 seconds on complete
      setTimeout(() => {
        handleClose();
      }, 3000);
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (currentStep === 'complete' && onVerificationComplete) {
      onVerificationComplete();
    }
    onClose();
  };

  // Resend code
  const handleResendCode = async () => {
    const success = await resendVerificationCode();
    if (success) {
      toast({
        title: 'Verification code resent!',
        description: 'Please check your email for the new code.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'submit':
        return (
          <VStack spacing={6} align="stretch">
            <Box textAlign="center">
              <Icon as={FaEnvelope} boxSize={12} color="purple.500" mb={4} />
              <Text fontSize="lg" fontWeight="medium" mb={2}>
                Set up Email Notifications
              </Text>
              <Text color="gray.600" fontSize="sm">
                Get notified about your ticket purchases, resales, and event updates.
              </Text>
            </Box>

            <FormControl isInvalid={!!emailError}>
              <FormLabel>Email Address</FormLabel>
              <Input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError('');
                }}
                placeholder="Enter your email address"
                size="lg"
              />
              <FormErrorMessage>{emailError}</FormErrorMessage>
              <FormHelperText>
                We'll send a verification code to this email address.
              </FormHelperText>
            </FormControl>

            {address && (
              <Box p={3} bg="gray.50" borderRadius="md" fontSize="sm">
                <Text fontWeight="medium" mb={1}>Wallet Address:</Text>
                <Text fontFamily="mono" color="gray.600">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </Text>
              </Box>
            )}
          </VStack>
        );

      case 'verify':
        return (
          <VStack spacing={6} align="stretch">
            <Box textAlign="center">
              <Icon as={FaEnvelope} boxSize={12} color="green.500" mb={4} />
              <Text fontSize="lg" fontWeight="medium" mb={2}>
                Check Your Email
              </Text>
              <Text color="gray.600" fontSize="sm" mb={4}>
                We sent a 6-digit verification code to:
              </Text>
              <Badge colorScheme="green" fontSize="sm" px={3} py={1}>
                {email}
              </Badge>
            </Box>

            <FormControl>
              <FormLabel textAlign="center">Enter Verification Code</FormLabel>
              <HStack justify="center" spacing={2}>
                <PinInput
                  value={verificationCode}
                  onChange={setVerificationCode}
                  onComplete={handleVerification}
                  size="lg"
                  colorScheme="purple"
                >
                  <PinInputField />
                  <PinInputField />
                  <PinInputField />
                  <PinInputField />
                  <PinInputField />
                  <PinInputField />
                </PinInput>
              </HStack>
              <FormHelperText textAlign="center">
                Code expires in 24 hours
              </FormHelperText>
            </FormControl>

            <Button
              variant="link"
              size="sm"
              onClick={handleResendCode}
              isLoading={loading}
              alignSelf="center"
            >
              Didn't receive the code? Resend
            </Button>
          </VStack>
        );

      case 'preferences':
        return (
          <VStack spacing={6} align="stretch">
            <Box textAlign="center">
              <Icon as={FaCog} boxSize={12} color="blue.500" mb={4} />
              <Text fontSize="lg" fontWeight="medium" mb={2}>
                Notification Preferences
              </Text>
              <Text color="gray.600" fontSize="sm">
                Choose which notifications you'd like to receive.
              </Text>
            </Box>

            <VStack spacing={4} align="stretch">
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="ticket-purchase" mb="0" flex="1">
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="medium">Ticket Purchases</Text>
                    <Text fontSize="sm" color="gray.600">
                      Confirmation emails when you buy tickets
                    </Text>
                  </VStack>
                </FormLabel>
                <Switch
                  id="ticket-purchase"
                  isChecked={preferences.ticket_purchase}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    ticket_purchase: e.target.checked
                  }))}
                  colorScheme="purple"
                />
              </FormControl>

              <Divider />

              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="ticket-resale" mb="0" flex="1">
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="medium">Ticket Resales</Text>
                    <Text fontSize="sm" color="gray.600">
                      Notifications when you sell or buy resale tickets
                    </Text>
                  </VStack>
                </FormLabel>
                <Switch
                  id="ticket-resale"
                  isChecked={preferences.ticket_resale}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    ticket_resale: e.target.checked
                  }))}
                  colorScheme="purple"
                />
              </FormControl>

              <Divider />

              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="event-reminders" mb="0" flex="1">
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="medium">Event Reminders</Text>
                    <Text fontSize="sm" color="gray.600">
                      Reminders before your events start
                    </Text>
                  </VStack>
                </FormLabel>
                <Switch
                  id="event-reminders"
                  isChecked={preferences.event_reminders}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    event_reminders: e.target.checked
                  }))}
                  colorScheme="purple"
                />
              </FormControl>

              <Divider />

              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="price-alerts" mb="0" flex="1">
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="medium">Price Alerts</Text>
                    <Text fontSize="sm" color="gray.600">
                      Notify when ticket prices drop in marketplace
                    </Text>
                  </VStack>
                </FormLabel>
                <Switch
                  id="price-alerts"
                  isChecked={preferences.price_alerts}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    price_alerts: e.target.checked
                  }))}
                  colorScheme="purple"
                />
              </FormControl>
            </VStack>
          </VStack>
        );

      case 'complete':
        return (
          <VStack spacing={6} align="stretch" textAlign="center">
            <Box>
              <Icon as={FaCheck} boxSize={16} color="green.500" mb={4} />
              <Text fontSize="xl" fontWeight="bold" color="green.600" mb={2}>
                All Set! 🎉
              </Text>
              <Text color="gray.600" mb={4}>
                Your email has been verified and preferences saved.
              </Text>
            </Box>

            <Box p={4} bg="green.50" borderRadius="md" border="1px solid" borderColor="green.200">
              <Text fontSize="sm" fontWeight="medium" mb={2}>
                You'll receive notifications for:
              </Text>
              <VStack spacing={1} fontSize="sm">
                {preferences.ticket_purchase && <Text>✅ Ticket purchases</Text>}
                {preferences.ticket_resale && <Text>✅ Ticket resales</Text>}
                {preferences.event_reminders && <Text>✅ Event reminders</Text>}
                {preferences.price_alerts && <Text>✅ Price alerts</Text>}
              </VStack>
            </Box>

            <Text fontSize="sm" color="gray.500">
              You can change these preferences anytime in your profile settings.
            </Text>
          </VStack>
        );
    }
  };

  const getModalTitle = () => {
    switch (currentStep) {
      case 'submit': return 'Email Setup';
      case 'verify': return 'Email Verification';
      case 'preferences': return 'Notification Settings';
      case 'complete': return 'Setup Complete';
    }
  };

  const getActionButton = () => {
    switch (currentStep) {
      case 'submit':
        return (
          <Button
            colorScheme="purple"
            onClick={handleEmailSubmit}
            isLoading={loading}
            isDisabled={!email}
          >
            Send Verification Code
          </Button>
        );
      case 'verify':
        return (
          <Button
            colorScheme="purple"
            onClick={handleVerification}
            isLoading={loading}
            isDisabled={verificationCode.length !== 6}
          >
            Verify Email
          </Button>
        );
      case 'preferences':
        return (
          <Button
            colorScheme="purple"
            onClick={handlePreferencesUpdate}
            isLoading={loading}
          >
            Save Preferences
          </Button>
        );
      case 'complete':
        return (
          <Button colorScheme="green" onClick={handleClose}>
            Continue to App
          </Button>
        );
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md" closeOnOverlayClick={false}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{getModalTitle()}</ModalHeader>
        
        <ModalBody>
          {error && (
            <Alert status="error" mb={4} borderRadius="md">
              <AlertIcon />
              <Text fontSize="sm">{error}</Text>
            </Alert>
          )}
          
          {loading && currentStep !== 'verify' && (
            <Box textAlign="center" mb={4}>
              <Spinner size="sm" mr={2} />
              <Text fontSize="sm" display="inline">Processing...</Text>
            </Box>
          )}
          
          {renderStepContent()}
        </ModalBody>

        <ModalFooter>
          <VStack spacing={3} width="100%">
            {getActionButton()}
            
            {currentStep !== 'complete' && (
              <Button variant="ghost" size="sm" onClick={handleClose}>
                Skip for now
              </Button>
            )}
          </VStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EmailVerificationModal;