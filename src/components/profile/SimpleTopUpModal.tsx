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
import { FaPlus, FaCoins, FaUniversity, FaMobile, FaCreditCard } from "react-icons/fa";

interface SimpleTopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: string;
}

type PaymentMethod = "bank" | "ewallet" | "card";

const paymentMethods = [
  {
    id: "bank" as PaymentMethod,
    name: "Bank Transfer",
    icon: FaUniversity,
    description: "BCA, Mandiri, BNI, BRI",
    fee: "Free",
    time: "1-3 minutes",
  },
  {
    id: "ewallet" as PaymentMethod,
    name: "E-Wallet",
    icon: FaMobile,
    description: "OVO, GoPay, DANA, ShopeePay",
    fee: "Free",
    time: "Instant",
  },
  {
    id: "card" as PaymentMethod,
    name: "Credit/Debit Card",
    icon: FaCreditCard,
    description: "Visa, Mastercard",
    fee: "2.9%",
    time: "Instant",
  },
];

export const SimpleTopUpModal: React.FC<SimpleTopUpModalProps> = ({
  isOpen,
  onClose,
  currentBalance,
}) => {
  const [amount, setAmount] = useState<string>("100000");
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>("bank");
  const [isProcessing, setIsProcessing] = useState(false);
  const toast = useToast();

  const numericAmount = parseFloat(amount) || 0;
  const selectedMethod = paymentMethods.find(pm => pm.id === selectedPayment);
  const finalAmount = selectedMethod?.fee === "Free" ? numericAmount : Math.round(numericAmount * 1.029);

  const handleTopUp = async () => {
    if (numericAmount < 10000) {
      toast({
        title: "Minimum top-up is 10,000 IDRX",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast({
        title: "Top-up Successful!",
        description: `Successfully added ${numericAmount.toLocaleString()} IDRX to your wallet`,
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

  const quickAmounts = [50000, 100000, 250000, 500000, 1000000];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
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
            {/* Current Balance */}
            <Box bg="purple.50" p={4} borderRadius="md" textAlign="center">
              <Text fontSize="sm" color="gray.600" mb={1}>
                Current Balance
              </Text>
              <Heading size="lg" color="purple.600">
                {parseFloat(currentBalance).toLocaleString()} IDRX
              </Heading>
              <Text fontSize="xs" color="gray.500" mt={1}>
                On Lisk Network
              </Text>
            </Box>

            {/* Amount Input */}
            <FormControl>
              <FormLabel fontWeight="semibold">
                Top-up Amount (IDRX)
              </FormLabel>
              <NumberInput
                value={amount}
                onChange={(valueString) => setAmount(valueString)}
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
                {quickAmounts.map((quickAmount) => (
                  <Button
                    key={quickAmount}
                    size="sm"
                    variant="outline"
                    colorScheme="purple"
                    onClick={() => setAmount(quickAmount.toString())}
                  >
                    {quickAmount.toLocaleString()}
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
                    borderColor={selectedPayment === method.id ? "purple.300" : "gray.200"}
                    borderRadius="md"
                    p={3}
                    cursor="pointer"
                    onClick={() => setSelectedPayment(method.id)}
                    bg={selectedPayment === method.id ? "purple.50" : "white"}
                    w="full"
                    _hover={{ borderColor: "purple.300" }}
                  >
                    <HStack spacing={3}>
                      <Icon as={method.icon} boxSize={5} color="purple.500" />
                      <Box flex="1">
                        <Text fontWeight="medium" fontSize="sm">{method.name}</Text>
                        <Text fontSize="xs" color="gray.600">
                          {method.description}
                        </Text>
                      </Box>
                      <VStack spacing={0} align="end">
                        <Text fontSize="xs" fontWeight="medium" color={method.fee === "Free" ? "green.500" : "orange.500"}>
                          {method.fee}
                        </Text>
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
            <Box bg="gray.50" p={4} borderRadius="md">
              <Text fontWeight="semibold" mb={2}>Transaction Summary</Text>
              <VStack spacing={2} align="stretch">
                <Flex justify="space-between">
                  <Text>Amount:</Text>
                  <Text fontWeight="medium">{numericAmount.toLocaleString()} IDRX</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text>Payment Method:</Text>
                  <Text fontWeight="medium">{selectedMethod?.name}</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text>Fee:</Text>
                  <Text fontWeight="medium" color={selectedMethod?.fee === "Free" ? "green.500" : "orange.500"}>
                    {selectedMethod?.fee}
                  </Text>
                </Flex>
                <Divider />
                <Flex justify="space-between" fontWeight="bold">
                  <Text>Total to Pay:</Text>
                  <Text>{finalAmount.toLocaleString()} IDR</Text>
                </Flex>
              </VStack>
            </Box>
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
            isDisabled={numericAmount < 10000}
            leftIcon={<Icon as={FaCoins} />}
            _hover={{
              bg: isProcessing ? "purple.500" : "purple.600",
              opacity: isProcessing ? 1 : undefined,
            }}
            _focus={{
              bg: isProcessing ? "purple.500" : "purple.600",
              opacity: isProcessing ? 1 : undefined,
            }}
            opacity={isProcessing ? 1 : undefined}
          >
            Top Up {numericAmount >= 10000 ? numericAmount.toLocaleString() : ""} IDRX
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default SimpleTopUpModal;