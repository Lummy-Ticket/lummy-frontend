import React, { useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  VStack,
  HStack,
  Text,
  Button,
  Icon,
  Box,
  Heading,
  Divider,
  useToast,
  Badge,
  Flex,
  FormControl,
  FormLabel,
  FormHelperText,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from "@chakra-ui/react";
import { FaPlus, FaCreditCard, FaUniversity, FaMobile, FaCoins } from "react-icons/fa";

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: string;
}

type PaymentMethod = "bank" | "ewallet" | "card";

// Quick amount suggestions
const quickAmounts = [50000, 100000, 250000, 500000, 1000000];

const paymentMethods = [
  {
    id: "bank" as PaymentMethod,
    name: "Bank Transfer",
    icon: FaUniversity,
    description: "BCA, Mandiri, BNI, BRI",
    fee: "Free",
    time: "1-3 minutes",
    color: "blue",
  },
  {
    id: "ewallet" as PaymentMethod,
    name: "E-Wallet",
    icon: FaMobile,
    description: "OVO, GoPay, DANA, ShopeePay",
    fee: "Free",
    time: "Instant",
    color: "green",
  },
  {
    id: "card" as PaymentMethod,
    name: "Credit/Debit Card",
    icon: FaCreditCard,
    description: "Visa, Mastercard",
    fee: "2.9%",
    time: "Instant",
    color: "purple",
  },
];

export const TopUpModal: React.FC<TopUpModalProps> = ({
  isOpen,
  onClose,
  currentBalance,
}) => {
  const [customAmount, setCustomAmount] = useState<string>("100000");
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>("bank");
  const [isProcessing, setIsProcessing] = useState(false);
  const toast = useToast();

  // Parse custom amount to number
  const selectedAmount = parseFloat(customAmount) || 0;

  const handleTopUp = async () => {
    if (!selectedAmount || selectedAmount < 10000 || !selectedPayment) {
      toast({
        title: selectedAmount < 10000 ? "Minimum top-up is 10,000 IDRX" : "Please enter amount and select payment method",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 3000));

      toast({
        title: "Top-up Successful!",
        description: `Successfully added ${selectedAmount.toLocaleString()} IDRX to your wallet`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      onClose();
    } catch (error) {
      toast({
        title: "Top-up Failed",
        description: "Please try again or contact support",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedPaymentMethod = paymentMethods.find(pm => pm.id === selectedPayment);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent>
        <ModalHeader>
          <Flex align="center">
            <Icon as={FaPlus} mr={3} color="purple.500" />
            Top Up IDRX
          </Flex>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* Current Balance & Preview */}
            <Box bg="purple.50" p={4} borderRadius="md">
              <Flex justify="space-between" align="center">
                <Box textAlign="center" flex="1">
                  <Text fontSize="sm" color="gray.600" mb={1}>
                    Current Balance
                  </Text>
                  <Heading size="lg" color="purple.600">
                    {parseFloat(currentBalance).toLocaleString()} IDRX
                  </Heading>
                </Box>
                
                {selectedAmount >= 10000 && (
                  <>
                    <Icon as={FaPlus} color="gray.400" mx={3} />
                    <Box textAlign="center" flex="1">
                      <Text fontSize="sm" color="gray.600" mb={1}>
                        New Balance
                      </Text>
                      <Heading size="lg" color="green.600">
                        {(parseFloat(currentBalance) + selectedAmount).toLocaleString()} IDRX
                      </Heading>
                    </Box>
                  </>
                )}
              </Flex>
              <Text fontSize="xs" color="gray.500" mt={2} textAlign="center">
                On Lisk Network
              </Text>
            </Box>

            {/* Custom Amount Input */}
            <FormControl>
              <FormLabel fontWeight="semibold">
                Top-up Amount (IDRX)
              </FormLabel>
              <NumberInput
                value={customAmount}
                onChange={(valueString) => setCustomAmount(valueString)}
                min={10000}
                max={10000000}
                step={1000}
                size="lg"
              >
                <NumberInputField 
                  placeholder="Enter amount"
                  fontSize="lg"
                  textAlign="center"
                  fontWeight="medium"
                />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              <FormHelperText>
                Minimum: 10,000 IDRX • Maximum: 10,000,000 IDRX
              </FormHelperText>
            </FormControl>

            {/* Quick Amount Buttons */}
            <Box>
              <Text fontSize="sm" color="gray.600" mb={2}>
                Quick amounts:
              </Text>
              <HStack spacing={2} flexWrap="wrap">
                {quickAmounts.map((amount) => (
                  <Button
                    key={amount}
                    size="sm"
                    variant="outline"
                    colorScheme="purple"
                    onClick={() => setCustomAmount(amount.toString())}
                    _hover={{ bg: "purple.50" }}
                  >
                    {amount.toLocaleString()}
                  </Button>
                ))}
              </HStack>
            </Box>

            <Divider />

            {/* Payment Method Selection */}
            <Box>
              <Text fontWeight="semibold" mb={3}>
                Payment Method
              </Text>
              <VStack spacing={3}>
                {paymentMethods.map((method) => (
                  <Box
                    key={method.id}
                    borderWidth="2px"
                    borderColor={selectedPayment === method.id ? `${method.color}.300` : "gray.200"}
                    borderRadius="md"
                    p={4}
                    cursor="pointer"
                    onClick={() => setSelectedPayment(method.id)}
                    bg={selectedPayment === method.id ? `${method.color}.50` : "white"}
                    w="full"
                    _hover={{ borderColor: `${method.color}.300` }}
                  >
                    <HStack spacing={4}>
                      <Icon as={method.icon} boxSize={6} color={`${method.color}.500`} />
                      <Box flex="1">
                        <Text fontWeight="medium">{method.name}</Text>
                        <Text fontSize="sm" color="gray.600">
                          {method.description}
                        </Text>
                      </Box>
                      <VStack spacing={0} align="end">
                        <Badge colorScheme={method.color} variant="subtle">
                          {method.fee}
                        </Badge>
                        <Text fontSize="xs" color="gray.500">
                          {method.time}
                        </Text>
                      </VStack>
                    </HStack>
                  </Box>
                ))}
              </VStack>
            </Box>

            {/* Transaction Summary */}
            {selectedAmount && selectedPaymentMethod && (
              <Box bg="gray.50" p={4} borderRadius="md">
                <Text fontWeight="semibold" mb={2}>Transaction Summary</Text>
                <VStack spacing={2} align="stretch">
                  <Flex justify="space-between">
                    <Text>Amount:</Text>
                    <Text fontWeight="medium">{selectedAmount.toLocaleString()} IDRX</Text>
                  </Flex>
                  <Flex justify="space-between">
                    <Text>Payment Method:</Text>
                    <Text fontWeight="medium">{selectedPaymentMethod.name}</Text>
                  </Flex>
                  <Flex justify="space-between">
                    <Text>Fee:</Text>
                    <Text fontWeight="medium" color={selectedPaymentMethod.fee === "Free" ? "green.500" : "orange.500"}>
                      {selectedPaymentMethod.fee}
                    </Text>
                  </Flex>
                  <Divider />
                  <Flex justify="space-between" fontWeight="bold">
                    <Text>Total to Pay:</Text>
                    <Text>
                      {selectedPaymentMethod.fee === "Free" 
                        ? selectedAmount.toLocaleString()
                        : Math.round(selectedAmount * 1.029).toLocaleString()
                      } IDR
                    </Text>
                  </Flex>
                </VStack>
              </Box>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="purple"
            onClick={handleTopUp}
            isLoading={isProcessing}
            loadingText="Processing..."
            isDisabled={!selectedAmount || selectedAmount < 10000 || !selectedPayment}
            leftIcon={<Icon as={FaCoins} />}
          >
            Top Up {selectedAmount >= 10000 ? selectedAmount.toLocaleString() : ""} IDRX
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default TopUpModal;