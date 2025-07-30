// src/components/debug/EmailSystemTest.tsx
// Debug component to test email system functionality
import React, { useState } from 'react';
import {
  Box,
  Button,
  VStack,
  Text,
  Input,
  Alert,
  AlertIcon,
  Heading,
  Code,
  Divider,
} from '@chakra-ui/react';
import { useAccount } from 'wagmi';
import { useEmailService } from '../../hooks/useEmailService';

const EmailSystemTest: React.FC = () => {
  const { address, isConnected } = useAccount();
  const {
    loading,
    error,
    userEmail,
    isEmailVerified,
    checkEmailExists,
    submitEmail,
    verifyEmail,
  } = useEmailService();

  const [testEmail, setTestEmail] = useState('test@example.com');
  const [testCode, setTestCode] = useState('');
  const [log, setLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleCheckEmail = async () => {
    addLog('🔍 Checking existing email...');
    const result = await checkEmailExists();
    addLog(`✅ Check result: ${result ? result.email : 'No email found'}`);
  };

  const handleSubmitEmail = async () => {
    addLog(`📧 Submitting email: ${testEmail}`);
    const success = await submitEmail(testEmail);
    addLog(`✅ Submit result: ${success ? 'Success' : 'Failed'}`);
    if (success) {
      addLog('🔐 Check browser console for verification code!');
    }
  };

  const handleVerifyEmail = async () => {
    addLog(`🔐 Verifying code: ${testCode}`);
    const success = await verifyEmail(testCode);
    addLog(`✅ Verify result: ${success ? 'Success' : 'Failed'}`);
  };

  const clearLog = () => setLog([]);

  if (!isConnected) {
    return (
      <Box p={6} borderWidth="1px" borderRadius="lg" bg="gray.50">
        <Text>Connect your wallet to test email system</Text>
      </Box>
    );
  }

  return (
    <Box p={6} borderWidth="2px" borderRadius="lg" bg="yellow.50" borderColor="yellow.200">
      <VStack spacing={4} align="stretch">
        <Heading size="md" color="yellow.800">
          🧪 Email System Debug Test
        </Heading>
        
        <Text fontSize="sm" color="yellow.700">
          Wallet: <Code>{address?.slice(0, 6)}...{address?.slice(-4)}</Code>
        </Text>

        {error && (
          <Alert status="error">
            <AlertIcon />
            <Text fontSize="sm">{error}</Text>
          </Alert>
        )}

        <Box>
          <Text fontWeight="bold" mb={2}>Current Email Status:</Text>
          <Text fontSize="sm">
            Email: {userEmail?.email || 'None'}
          </Text>
          <Text fontSize="sm">
            Verified: {isEmailVerified ? '✅ Yes' : '❌ No'}
          </Text>
        </Box>

        <Divider />

        <VStack spacing={3} align="stretch">
          <Button onClick={handleCheckEmail} isLoading={loading} size="sm">
            1. Check Existing Email
          </Button>

          <Box>
            <Input
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="Enter test email"
              size="sm"
              mb={2}
            />
            <Button onClick={handleSubmitEmail} isLoading={loading} size="sm" colorScheme="blue">
              2. Submit Email (Check Console!)
            </Button>
          </Box>

          <Box>
            <Input
              value={testCode}
              onChange={(e) => setTestCode(e.target.value)}
              placeholder="Enter 6-digit code from console"
              size="sm"
              mb={2}
              maxLength={6}
            />
            <Button onClick={handleVerifyEmail} isLoading={loading} size="sm" colorScheme="green">
              3. Verify Code
            </Button>
          </Box>
        </VStack>

        <Divider />

        <Box>
          <Text fontWeight="bold" mb={2}>Activity Log:</Text>
          <Button onClick={clearLog} size="xs" mb={2}>Clear Log</Button>
          <Box
            bg="gray.800"
            color="green.200"
            p={3}
            borderRadius="md"
            fontSize="xs"
            fontFamily="mono"
            maxH="200px"
            overflowY="auto"
          >
            {log.length === 0 ? (
              <Text color="gray.400">No activity yet...</Text>
            ) : (
              log.map((entry, i) => (
                <Text key={i}>{entry}</Text>
              ))
            )}
          </Box>
        </Box>

        <Text fontSize="xs" color="yellow.600">
          💡 In development mode, verification codes appear in browser console instead of email
        </Text>
      </VStack>
    </Box>
  );
};

export default EmailSystemTest;