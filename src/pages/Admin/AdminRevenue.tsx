import React, { useState } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  useColorModeValue,
  Button,
  Input,
  FormControl,
  FormLabel,
  Card,
  CardBody,
  CardHeader,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Icon,
  Flex,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  useDisclosure,
  useToast,
  Progress,
} from "@chakra-ui/react";
import {
  MdSettings,
  MdDownload,
  MdSync,
  MdReceipt,
} from "react-icons/md";

interface RevenueData {
  totalFeesCollected: number;
  pendingWithdrawals: number;
  monthlyRevenue: number;
  avgDailyRevenue: number;
  totalTransactions: number;
  feeReceiverAddress: string;
  withdrawalHistory: Array<{
    id: string;
    amount: number;
    timestamp: string;
    txHash: string;
    status: "completed" | "pending" | "failed";
  }>;
  revenueBreakdown: Array<{
    source: string;
    amount: number;
    percentage: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    fees: number;
    growth: number;
  }>;
}

const AdminRevenue: React.FC = () => {
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const toast = useToast();

  // Modal states
  const { isOpen: isWithdrawOpen, onOpen: onWithdrawOpen, onClose: onWithdrawClose } = useDisclosure();
  const { isOpen: isUpdateReceiverOpen, onOpen: onUpdateReceiverOpen, onClose: onUpdateReceiverClose } = useDisclosure();

  // Form states
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [newReceiverAddress, setNewReceiverAddress] = useState("");

  // Mock data - in real app this would come from smart contracts
  const revenueData: RevenueData = {
    totalFeesCollected: 25750000, // IDR
    pendingWithdrawals: 8250000,
    monthlyRevenue: 8250000,
    avgDailyRevenue: 275000,
    totalTransactions: 342,
    feeReceiverAddress: "0x1234567890abcdef1234567890abcdef12345678",
    withdrawalHistory: [
      {
        id: "w_001",
        amount: 15000000,
        timestamp: "2025-01-20 10:30",
        txHash: "0xabc123...",
        status: "completed"
      },
      {
        id: "w_002", 
        amount: 2500000,
        timestamp: "2025-01-15 14:15",
        txHash: "0xdef456...",
        status: "completed"
      },
      {
        id: "w_003",
        amount: 5000000,
        timestamp: "2025-01-22 16:45",
        txHash: "0x789ghi...",
        status: "pending"
      }
    ],
    revenueBreakdown: [
      { source: "Primary Ticket Sales", amount: 18500000, percentage: 72 },
      { source: "Resale Fees", amount: 5750000, percentage: 22 },
      { source: "Event Cancellation Fees", amount: 1500000, percentage: 6 }
    ],
    monthlyTrend: [
      { month: "Oct 2024", fees: 4500000, growth: 0 },
      { month: "Nov 2024", fees: 3200000, growth: -29 },
      { month: "Dec 2024", fees: 5800000, growth: 81 },
      { month: "Jan 2025", fees: 8250000, growth: 42 }
    ]
  };

  const formatCurrency = (amount: number) => {
    return `IDR ${amount.toLocaleString()}`;
  };

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (amount <= 0 || amount > revenueData.pendingWithdrawals) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid withdrawal amount.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // In real app, this would call smart contract function
    toast({
      title: "Withdrawal Initiated",
      description: `${formatCurrency(amount)} withdrawal has been submitted to blockchain.`,
      status: "success",
      duration: 5000,
      isClosable: true,
    });
    setWithdrawAmount("");
    onWithdrawClose();
  };

  const handleUpdateReceiver = () => {
    if (!newReceiverAddress || newReceiverAddress.length !== 42) {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid Ethereum address.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // In real app, this would call setPlatformFeeReceiver()
    toast({
      title: "Fee Receiver Updated",
      description: "Platform fee receiver address has been updated successfully.",
      status: "success",
      duration: 5000,
      isClosable: true,
    });
    setNewReceiverAddress("");
    onUpdateReceiverClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "green";
      case "pending": return "yellow";
      case "failed": return "red";
      default: return "gray";
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="lg">Revenue Management</Heading>
          <Text color="gray.600">
            Monitor platform fees, manage withdrawals, and track financial performance
          </Text>
        </Box>

        {/* Key Revenue Metrics */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          <Stat bg={cardBg} p={6} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
            <StatLabel>Total Fees Collected</StatLabel>
            <StatNumber color="green.500">{formatCurrency(revenueData.totalFeesCollected)}</StatNumber>
            <StatHelpText>Lifetime platform fees</StatHelpText>
          </Stat>

          <Stat bg={cardBg} p={6} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
            <StatLabel>Available for Withdrawal</StatLabel>
            <StatNumber color="blue.500">{formatCurrency(revenueData.pendingWithdrawals)}</StatNumber>
            <StatHelpText>Ready to withdraw</StatHelpText>
          </Stat>

          <Stat bg={cardBg} p={6} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
            <StatLabel>Monthly Revenue</StatLabel>
            <StatNumber color="purple.500">{formatCurrency(revenueData.monthlyRevenue)}</StatNumber>
            <StatHelpText>
              <StatArrow type="increase" />
              42% from last month
            </StatHelpText>
          </Stat>

          <Stat bg={cardBg} p={6} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
            <StatLabel>Avg Daily Revenue</StatLabel>
            <StatNumber color="orange.500">{formatCurrency(revenueData.avgDailyRevenue)}</StatNumber>
            <StatHelpText>{revenueData.totalTransactions} transactions</StatHelpText>
          </Stat>
        </SimpleGrid>

        {/* Platform Fee Info Alert */}
        <Alert status="info" borderRadius="lg">
          <AlertIcon />
          <Box>
            <AlertTitle>Platform Fee Rate: 1%</AlertTitle>
            <AlertDescription>
              Fee percentage is hardcoded in smart contract and cannot be modified. Only the fee receiver address can be updated.
            </AlertDescription>
          </Box>
        </Alert>

        {/* Revenue Management Actions & Fee Receiver */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
          {/* Withdrawal Actions */}
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} boxShadow="none">
            <CardHeader>
              <Heading size="md">Revenue Actions</Heading>
              <Text color="gray.600" fontSize="sm">Manage platform revenue withdrawals</Text>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Button
                  colorScheme="green" 
                  size="lg"
                  leftIcon={<Icon as={MdDownload} />}
                  onClick={onWithdrawOpen}
                  isDisabled={revenueData.pendingWithdrawals === 0}
                >
                  Withdraw Fees ({formatCurrency(revenueData.pendingWithdrawals)})
                </Button>
                
                <HStack>
                  <Button
                    variant="outline"
                    leftIcon={<Icon as={MdSync} />}
                    size="sm"
                  >
                    Sync Blockchain Data
                  </Button>
                  <Button
                    variant="outline"
                    leftIcon={<Icon as={MdReceipt} />}
                    size="sm"
                  >
                    Generate Report
                  </Button>
                </HStack>
              </VStack>
            </CardBody>
          </Card>

          {/* Fee Receiver Management */}
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} boxShadow="none">
            <CardHeader>
              <Heading size="md">Fee Receiver Settings</Heading>
              <Text color="gray.600" fontSize="sm">Current platform fee recipient address</Text>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Box>
                  <Text fontSize="sm" color="gray.500" mb={2}>Current Fee Receiver</Text>
                  <Text fontFamily="monospace" fontSize="sm" bg="gray.100" p={2} borderRadius="md">
                    {revenueData.feeReceiverAddress}
                  </Text>
                </Box>
                <Button
                  colorScheme="blue"
                  leftIcon={<Icon as={MdSettings} />}
                  onClick={onUpdateReceiverOpen}
                >
                  Update Receiver Address
                </Button>
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Revenue Breakdown & Monthly Trend */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
          {/* Revenue Sources */}
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} boxShadow="none">
            <CardHeader>
              <Heading size="md">Revenue Breakdown</Heading>
              <Text color="gray.600" fontSize="sm">Sources of platform fees</Text>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                {revenueData.revenueBreakdown.map((source) => (
                  <Box key={source.source}>
                    <Flex justify="space-between" align="center" mb={2}>
                      <Text fontSize="sm" fontWeight="medium">{source.source}</Text>
                      <VStack align="end" spacing={0}>
                        <Text fontSize="sm" fontWeight="bold">{formatCurrency(source.amount)}</Text>
                        <Text fontSize="xs" color="gray.500">{source.percentage}%</Text>
                      </VStack>
                    </Flex>
                    <Progress value={source.percentage} colorScheme="blue" size="sm" />
                  </Box>
                ))}
              </VStack>
            </CardBody>
          </Card>

          {/* Monthly Trend */}
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} boxShadow="none">
            <CardHeader>
              <Heading size="md">Monthly Fee Trend</Heading>
              <Text color="gray.600" fontSize="sm">Platform fee collection over time</Text>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                {revenueData.monthlyTrend.map((data) => (
                  <Box key={data.month}>
                    <Flex justify="space-between" align="center" mb={2}>
                      <Text fontSize="sm" fontWeight="medium">{data.month}</Text>
                      <VStack align="end" spacing={0}>
                        <Text fontSize="sm" fontWeight="bold">{formatCurrency(data.fees)}</Text>
                        {data.growth !== 0 && (
                          <Text fontSize="xs" color={data.growth > 0 ? "green.500" : "red.500"}>
                            {data.growth > 0 ? "↗" : "↘"} {Math.abs(data.growth)}%
                          </Text>
                        )}
                      </VStack>
                    </Flex>
                    <Progress 
                      value={(data.fees / Math.max(...revenueData.monthlyTrend.map(d => d.fees))) * 100} 
                      colorScheme="purple" 
                      size="sm"
                    />
                  </Box>
                ))}
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Withdrawal History */}
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} boxShadow="none">
          <CardHeader>
            <Heading size="md">Withdrawal History</Heading>
            <Text color="gray.600" fontSize="sm">Recent platform fee withdrawals</Text>
          </CardHeader>
          <CardBody>
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th>Withdrawal ID</Th>
                  <Th>Amount</Th>
                  <Th>Timestamp</Th>
                  <Th>Transaction Hash</Th>
                  <Th>Status</Th>
                </Tr>
              </Thead>
              <Tbody>
                {revenueData.withdrawalHistory.map((withdrawal) => (
                  <Tr key={withdrawal.id}>
                    <Td>
                      <Text fontFamily="monospace" fontSize="sm">{withdrawal.id}</Text>
                    </Td>
                    <Td>
                      <Text fontWeight="medium" color="green.600">
                        {formatCurrency(withdrawal.amount)}
                      </Text>
                    </Td>
                    <Td>
                      <Text fontSize="sm" color="gray.600">{withdrawal.timestamp}</Text>
                    </Td>
                    <Td>
                      <Text fontFamily="monospace" fontSize="sm" color="blue.500">
                        {withdrawal.txHash}
                      </Text>
                    </Td>
                    <Td>
                      <Badge size="sm" colorScheme={getStatusColor(withdrawal.status)}>
                        {withdrawal.status}
                      </Badge>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </CardBody>
        </Card>
      </VStack>

      {/* Withdrawal Modal */}
      <Modal isOpen={isWithdrawOpen} onClose={onWithdrawClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Withdraw Platform Fees</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="info" size="sm">
                <AlertIcon />
                <Text fontSize="sm">Available balance: {formatCurrency(revenueData.pendingWithdrawals)}</Text>
              </Alert>
              
              <FormControl>
                <FormLabel>Withdrawal Amount (IDR)</FormLabel>
                <Input
                  type="number"
                  placeholder="Enter amount to withdraw"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                />
              </FormControl>

              <Box p={3} bg="gray.50" borderRadius="md">
                <Text fontSize="sm" color="gray.600">
                  Fees will be transferred to: {revenueData.feeReceiverAddress}
                </Text>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onWithdrawClose}>
              Cancel
            </Button>
            <Button colorScheme="green" onClick={handleWithdraw}>
              Withdraw Funds
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Update Fee Receiver Modal */}
      <Modal isOpen={isUpdateReceiverOpen} onClose={onUpdateReceiverClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Update Fee Receiver Address</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="warning" size="sm">
                <AlertIcon />
                <Text fontSize="sm">This will call setPlatformFeeReceiver() on the smart contract.</Text>
              </Alert>
              
              <Box>
                <Text fontSize="sm" color="gray.500" mb={2}>Current Address</Text>
                <Text fontSize="sm" fontFamily="monospace" bg="gray.100" p={2} borderRadius="md">
                  {revenueData.feeReceiverAddress}
                </Text>
              </Box>

              <FormControl>
                <FormLabel>New Fee Receiver Address</FormLabel>
                <Input
                  placeholder="0x..."
                  value={newReceiverAddress}
                  onChange={(e) => setNewReceiverAddress(e.target.value)}
                  fontFamily="monospace"
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onUpdateReceiverClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleUpdateReceiver}>
              Update Address
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default AdminRevenue;