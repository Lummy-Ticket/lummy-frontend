import React, { useState, useEffect, useCallback } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  VStack,
  Text,
  Input,
  Button,
  HStack,
  PinInput,
  PinInputField,
  useToast,
  Box,
  Icon,
  Heading,
} from "@chakra-ui/react";
import { FaEnvelope, FaCheckCircle } from "react-icons/fa";

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEmailVerified: (email: string) => void;
}

type ModalStep = "email" | "otp" | "success";

export const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  isOpen,
  onClose,
  onEmailVerified,
}) => {
  const [step, setStep] = useState<ModalStep>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const toast = useToast();

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleEmailSubmit = useCallback(async () => {
    console.log("handleEmailSubmit called with email:", email);
    if (!email || !email.includes("@")) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call to send OTP
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      setStep("otp");
      setCountdown(60); // 60 second countdown
      
      // For demo: auto-fill OTP after 1 second
      setTimeout(() => {
        setOtp("123456"); // Mock OTP
        toast({
          title: "Demo: OTP Auto-filled",
          description: "Code auto-filled for demo",
          status: "info",
          duration: 1500,
          isClosable: true,
        });
      }, 1000);
      
      toast({
        title: "Demo: OTP Simulation",
        description: `Demo code will auto-fill in 1 second (Frontend Only)`,
        status: "info",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send verification code",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [email, toast]);

  const handleOTPSubmit = useCallback(async () => {
    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the 6-digit verification code",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);

    try {
      // Simulate OTP verification
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // For demo, accept any 6-digit code
      setStep("success");
      
      // Save email to localStorage
      localStorage.setItem("userEmail", email);
      
      // Dispatch custom event for real-time sync
      window.dispatchEvent(new CustomEvent("emailVerified", { detail: { email } }));
      
      setTimeout(() => {
        onEmailVerified(email);
        onClose();
      }, 2000);

    } catch (error) {
      toast({
        title: "Invalid Code",
        description: "The verification code is incorrect",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [otp, email, onEmailVerified, onClose, toast]);

  const handleResendOTP = async () => {
    if (countdown > 0) return;

    setIsLoading(true);
    try {
      // Simulate resend
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setCountdown(60);
      toast({
        title: "Code Resent",
        description: `New verification code sent to ${email}`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resend verification code",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Reset state when modal opens and auto-fill demo email
  useEffect(() => {
    if (isOpen) {
      setStep("email");
      setEmail("test@gmail.com"); // Auto-fill demo email
      setOtp("");
      setCountdown(0);
      
      // Auto-click send button after 1 second
      const timer = setTimeout(() => {
        console.log("Auto-submitting email...");
        handleEmailSubmit();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, handleEmailSubmit]);

  // Auto-submit OTP when it's filled (for auto-fill scenario)
  useEffect(() => {
    if (otp.length === 6 && step === "otp") {
      // Auto-submit after a brief delay
      const timer = setTimeout(() => {
        handleOTPSubmit();
      }, 500); // Faster auto-submit
      return () => clearTimeout(timer);
    }
  }, [otp, step, handleOTPSubmit]);

  const renderEmailStep = () => (
    <VStack spacing={6} align="stretch">
      <Box textAlign="center">
        <Icon as={FaEnvelope} boxSize={12} color="purple.500" mb={4} />
        <Heading size="md" mb={2}>
          Verify Your Email
        </Heading>
        <Text color="gray.600">
          Demo: Email verification (Frontend Only)
        </Text>
        <Text fontSize="sm" color="orange.500" textAlign="center">
          ⏳ Auto-submitting in 1 second...
        </Text>
      </Box>

      <VStack spacing={4} align="stretch">
        <Input
          type="email"
          placeholder="Enter your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          size="lg"
          focusBorderColor="purple.500"
        />
        
        <Button
          colorScheme="purple"
          size="lg"
          onClick={handleEmailSubmit}
          isLoading={isLoading}
          loadingText="Sending..."
          _hover={{
            bg: isLoading ? "purple.500" : "purple.600",
            opacity: isLoading ? 1 : undefined,
          }}
          _focus={{
            bg: isLoading ? "purple.500" : "purple.600",
            opacity: isLoading ? 1 : undefined,
          }}
        >
          Send Verification Code
        </Button>
      </VStack>

      <Text fontSize="sm" color="gray.500" textAlign="center">
        This email will be used for ticket confirmations and event notifications
      </Text>
    </VStack>
  );

  const renderOTPStep = () => (
    <VStack spacing={6} align="stretch">
      <Box textAlign="center">
        <Icon as={FaEnvelope} boxSize={12} color="purple.500" mb={4} />
        <Heading size="md" mb={2}>
          Enter Verification Code
        </Heading>
        <Text color="gray.600">
          Demo: Code will auto-fill to <strong>{email}</strong>
        </Text>
        <Text fontSize="sm" color="orange.500" textAlign="center">
          (Frontend demo - no real OTP sent)
        </Text>
      </Box>

      <VStack spacing={4}>
        <HStack justify="center">
          <PinInput
            size="lg"
            value={otp}
            onChange={setOtp}
            onComplete={handleOTPSubmit}
            focusBorderColor="purple.500"
          >
            <PinInputField />
            <PinInputField />
            <PinInputField />
            <PinInputField />
            <PinInputField />
            <PinInputField />
          </PinInput>
        </HStack>

        <Button
          colorScheme="purple"
          size="lg"
          onClick={handleOTPSubmit}
          isLoading={isLoading}
          loadingText="Verifying..."
          isDisabled={otp.length !== 6}
          _hover={{
            bg: isLoading ? "purple.500" : "purple.600",
            opacity: isLoading ? 1 : undefined,
          }}
          _focus={{
            bg: isLoading ? "purple.500" : "purple.600",
            opacity: isLoading ? 1 : undefined,
          }}
        >
          Verify Code
        </Button>
      </VStack>

      <VStack spacing={2}>
        <Text fontSize="sm" color="gray.500">
          Didn't receive the code?
        </Text>
        <Button
          variant="link"
          colorScheme="purple"
          onClick={handleResendOTP}
          isDisabled={countdown > 0 || isLoading}
          size="sm"
          _hover={{
            opacity: (countdown > 0 || isLoading) ? 0.4 : 0.8,
          }}
        >
          {countdown > 0 ? `Resend in ${countdown}s` : "Resend Code"}
        </Button>
        <Button
          variant="link"
          size="sm"
          onClick={() => setStep("email")}
          color="gray.500"
        >
          Change Email
        </Button>
      </VStack>
    </VStack>
  );

  const renderSuccessStep = () => (
    <VStack spacing={6} align="stretch" textAlign="center">
      <Box display="flex" justifyContent="center">
      <Icon as={FaCheckCircle} boxSize={16} color="green.500" />
      </Box>
      <Heading size="md" color="green.600">
      Demo Email Verified!
      </Heading>
      <Text color="gray.600">
      Demo email <strong>{email}</strong> saved for frontend demo.
      </Text>
      <Text fontSize="sm" color="orange.500" textAlign="center">
      (No real verification - Frontend demo only)
      </Text>
    </VStack>
  );

  const getStepContent = () => {
    switch (step) {
      case "email":
        return renderEmailStep();
      case "otp":
        return renderOTPStep();
      case "success":
        return renderSuccessStep();
      default:
        return renderEmailStep();
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={() => {}} // Prevent closing completely
      closeOnOverlayClick={false}
      closeOnEsc={false}
      size="md"
      isCentered
    >
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent mx={4}>
        <ModalHeader>
          {/* No close button - modal must be completed */}
        </ModalHeader>
        <ModalBody pb={6}>
          {getStepContent()}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default EmailVerificationModal;