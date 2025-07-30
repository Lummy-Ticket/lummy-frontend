// src/components/profile/EmailPreferences.tsx
import React, { useState } from 'react';
import {
  Box,
  VStack,
  Text,
  Switch,
  FormControl,
  FormLabel,
  Divider,
  Button,
  useToast,
  Alert,
  AlertIcon,
  Badge,
  HStack,
  Spinner,
} from '@chakra-ui/react';
import { useEmailService } from '../../hooks/useEmailService';
import { useAccount } from 'wagmi';

const EmailPreferences: React.FC = () => {
  const { address } = useAccount();
  const {
    loading,
    error,
    userEmail,
    isEmailVerified,
    updateNotificationPreferences,
    checkEmailExists,
  } = useEmailService();

  const [preferences, setPreferences] = useState(
    userEmail?.notification_preferences || {
      ticket_purchase: true,
      ticket_resale: true,
      event_reminders: true,
      price_alerts: false,
      marketing: false,
    }
  );

  const [isUpdating, setIsUpdating] = useState(false);
  const toast = useToast();

  // Check for email when component mounts
  React.useEffect(() => {
    if (address) {
      checkEmailExists();
    }
  }, [address, checkEmailExists]);

  // Update local preferences when userEmail changes
  React.useEffect(() => {
    if (userEmail?.notification_preferences) {
      setPreferences(userEmail.notification_preferences);
    }
  }, [userEmail]);

  const handlePreferenceChange = (key: keyof typeof preferences, value: boolean) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSavePreferences = async () => {
    setIsUpdating(true);
    
    try {
      const success = await updateNotificationPreferences(preferences);
      
      if (success) {
        toast({
          title: 'Preferences Updated',
          description: 'Your notification preferences have been saved.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Update Failed',
          description: 'Failed to update preferences. Please try again.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (_err) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (!address) {
    return (
      <Box borderWidth="1px" borderRadius="lg" p={6} bg="white">
        <Text fontSize="xl" fontWeight="bold" mb={4}>
          Email Preferences
        </Text>
        <Alert status="info">
          <AlertIcon />
          Connect your wallet to view email preferences.
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box borderWidth="1px" borderRadius="lg" p={6} bg="white">
        <HStack mb={4}>
          <Text fontSize="xl" fontWeight="bold">
            Email Preferences
          </Text>
          <Spinner size="sm" />
        </HStack>
        <Text color="gray.600">Loading email preferences...</Text>
      </Box>
    );
  }

  // Check for email in development mode via localStorage
  const isDevelopment = import.meta.env.DEV;
  let hasEmail = !!userEmail;
  let emailAddress = userEmail?.email;
  let emailVerified = isEmailVerified;

  if (isDevelopment && address && !hasEmail) {
    const localData = localStorage.getItem(`email_${address.toLowerCase()}`);
    if (localData) {
      try {
        const data = JSON.parse(localData);
        hasEmail = true;
        emailAddress = data.email;
        emailVerified = data.email_verified;
      } catch (e) {
        console.warn('Failed to parse localStorage email data');
      }
    }
  }

  if (!hasEmail) {
    return (
      <Box borderWidth="1px" borderRadius="lg" p={6} bg="white">
        <Text fontSize="xl" fontWeight="bold" mb={4}>
          Email Preferences
        </Text>
        <Alert status="warning">
          <AlertIcon />
          <VStack align="start" spacing={1}>
            <Text fontWeight="medium">No email registered</Text>
            <Text fontSize="sm">
              Set up email notifications to receive updates about your tickets and events.
            </Text>
          </VStack>
        </Alert>
      </Box>
    );
  }

  if (!emailVerified) {
    return (
      <Box borderWidth="1px" borderRadius="lg" p={6} bg="white">
        <Text fontSize="xl" fontWeight="bold" mb={4}>
          Email Preferences
        </Text>
        <Alert status="warning">
          <AlertIcon />
          <VStack align="start" spacing={1}>
            <Text fontWeight="medium">Email not verified</Text>
            <Text fontSize="sm">
              Please verify your email address to manage notification preferences.
            </Text>
            <Text fontSize="sm" color="gray.600">
              Email: {emailAddress}
            </Text>
          </VStack>
        </Alert>
      </Box>
    );
  }

  return (
    <Box borderWidth="1px" borderRadius="lg" p={6} bg="white">
      <VStack align="stretch" spacing={6}>
        <HStack justify="space-between" align="center">
          <Text fontSize="xl" fontWeight="bold">
            Email Preferences
          </Text>
          <Badge colorScheme="green" size="sm">
            ✓ {emailAddress}
          </Badge>
        </HStack>

        {error && (
          <Alert status="error">
            <AlertIcon />
            <Text fontSize="sm">{error}</Text>
          </Alert>
        )}

        <VStack spacing={4} align="stretch">
          <FormControl display="flex" alignItems="center">
            <FormLabel htmlFor="ticket-purchase" mb="0" flex="1">
              <VStack align="start" spacing={1}>
                <Text fontWeight="medium">Ticket Purchase Confirmations</Text>
                <Text fontSize="sm" color="gray.600">
                  Get notified when you successfully purchase tickets
                </Text>
              </VStack>
            </FormLabel>
            <Switch
              id="ticket-purchase"
              isChecked={preferences.ticket_purchase}
              onChange={(e) => handlePreferenceChange('ticket_purchase', e.target.checked)}
              colorScheme="purple"
            />
          </FormControl>

          <Divider />

          <FormControl display="flex" alignItems="center">
            <FormLabel htmlFor="ticket-resale" mb="0" flex="1">
              <VStack align="start" spacing={1}>
                <Text fontWeight="medium">Ticket Resale Notifications</Text>
                <Text fontSize="sm" color="gray.600">
                  Get notified about resale transactions (buying or selling)
                </Text>
              </VStack>
            </FormLabel>
            <Switch
              id="ticket-resale"
              isChecked={preferences.ticket_resale}
              onChange={(e) => handlePreferenceChange('ticket_resale', e.target.checked)}
              colorScheme="purple"
            />
          </FormControl>

          <Divider />

          <FormControl display="flex" alignItems="center">
            <FormLabel htmlFor="event-reminders" mb="0" flex="1">
              <VStack align="start" spacing={1}>
                <Text fontWeight="medium">Event Reminders</Text>
                <Text fontSize="sm" color="gray.600">
                  Get reminded before your events start (24 hours before)
                </Text>
              </VStack>
            </FormLabel>
            <Switch
              id="event-reminders"
              isChecked={preferences.event_reminders}
              onChange={(e) => handlePreferenceChange('event_reminders', e.target.checked)}
              colorScheme="purple"
            />
          </FormControl>

          <Divider />

          <FormControl display="flex" alignItems="center">
            <FormLabel htmlFor="price-alerts" mb="0" flex="1">
              <VStack align="start" spacing={1}>
                <Text fontWeight="medium">Price Drop Alerts</Text>
                <Text fontSize="sm" color="gray.600">
                  Get notified when ticket prices drop in the marketplace
                </Text>
              </VStack>
            </FormLabel>
            <Switch
              id="price-alerts"
              isChecked={preferences.price_alerts}
              onChange={(e) => handlePreferenceChange('price_alerts', e.target.checked)}
              colorScheme="purple"
            />
          </FormControl>

          <Divider />

          <FormControl display="flex" alignItems="center">
            <FormLabel htmlFor="marketing" mb="0" flex="1">
              <VStack align="start" spacing={1}>
                <Text fontWeight="medium">Marketing & Updates</Text>
                <Text fontSize="sm" color="gray.600">
                  Receive news about new features and special offers
                </Text>
              </VStack>
            </FormLabel>
            <Switch
              id="marketing"
              isChecked={preferences.marketing}
              onChange={(e) => handlePreferenceChange('marketing', e.target.checked)}
              colorScheme="purple"
            />
          </FormControl>
        </VStack>

        <Button
          colorScheme="purple"
          onClick={handleSavePreferences}
          isLoading={isUpdating}
          loadingText="Saving..."
          size="lg"
        >
          Save Preferences
        </Button>

        <Text fontSize="xs" color="gray.500" textAlign="center">
          You can change these preferences anytime. Notifications will only be sent to your verified email address.
        </Text>
      </VStack>
    </Box>
  );
};

export default EmailPreferences;