import React, { useState } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  VStack,
  HStack,
  Badge,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Icon,
  Select,
  Flex,
  Button,
  FormControl,
  FormLabel,
  Input,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  InputGroup,
  InputRightElement,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
} from "@chakra-ui/react";
import { FaWallet, FaChartLine, FaHistory, FaDownload, FaArrowDown } from "react-icons/fa";
import { useAccount, useBalance } from "wagmi";
import { formatUnits } from "viem";
import { IDRX_SEPOLIA } from "../../constants";

// Contract-compatible fee structure (matches smart contract specs)
const CONTRACT_FEES = {
  platformFeePercentage: 100,     // 1% in basis points (100/10000)
  organizerFeePercentage: 250,    // 2.5% for resale in basis points
  maxMarkupPercentage: 5000,      // 50% max markup in basis points
  baseFeePoints: 10000            // 100% = 10000 basis points
};

// Mock financial data with contract-compatible calculations
const mockFinanceData = {
  totalRevenue: 72000,
  totalWithdrawn: 60000,
  availableBalance: 12000,  // Will be updated with escrow logic
  platformFeePaid: 720,     // 1% of 72000 (updated from 5% to 1%)
  
  // Escrow system simulation (Diamond Pattern)
  escrowData: {
    organizerEscrow: 60000,        // Funds held until event completion
    eventCompleted: false,         // Mock: event not completed yet
    gracePeriodEnd: new Date(Date.now() + 24 * 60 * 60 * 1000), // +1 day
    canWithdraw: false,            // Based on completion + grace period
    lastEventDate: new Date('2025-08-10'),
  },
  
  // Revenue by event with contract-compatible fee calculations
  eventRevenue: [
    {
      eventId: "1",
      eventName: "Summer Music Festival", 
      revenue: 22500,
      platformFee: 225,    // 1% of 22500 (was 1125)
      netRevenue: 22275,   // Updated calculation
      status: "completed",
      date: "2025-06-15",
      ticketingSystem: "Diamond Pattern", // Enhanced NFT + Escrow
      escrowAmount: 0,     // Released after completion + grace period
    },
    {
      eventId: "2",
      eventName: "Tech Conference 2025",
      revenue: 42000,
      platformFee: 420,    // 1% of 42000 (was 2100)
      netRevenue: 41580,   // Updated calculation
      status: "ongoing",
      date: "2025-07-25",
      ticketingSystem: "Diamond Pattern", // Enhanced NFT + Escrow
      escrowAmount: 41580, // Held in escrow until completion
    },
    {
      eventId: "3", 
      eventName: "Blockchain Workshop",
      revenue: 7500,
      platformFee: 75,     // 1% of 7500 (was 375)
      netRevenue: 7425,    // Updated calculation
      status: "completed",
      date: "2025-08-10",
      ticketingSystem: "Diamond Pattern", // Enhanced NFT + Escrow
      escrowAmount: 0,     // Released after completion + grace period
    },
  ],

  // Transaction history with contract-compatible fees
  transactions: [
    {
      id: "tx-001",
      type: "revenue",
      description: "Ticket sales - Summer Music Festival (Diamond Pattern + Escrow)",
      amount: 22500,
      fee: 225,       // 1% platform fee
      netAmount: 22275,
      date: "2025-06-15T10:30:00",
      txHash: "0x1234567890abcdef...",
      ticketingSystem: "Diamond Pattern",
      escrowStatus: "released_after_completion",
    },
    {
      id: "tx-002", 
      type: "withdrawal",
      description: "Withdrawal to wallet (Post-Escrow Release)",
      amount: -22000,
      fee: 0,
      netAmount: -22000,
      date: "2025-06-16T14:20:00",
      txHash: "0xabcdef1234567890...",
      ticketingSystem: "Diamond Pattern",
      escrowStatus: "withdrawal_completed",
    },
    {
      id: "tx-003",
      type: "escrow", 
      description: "Escrow deposit - Tech Conference 2025 (Diamond Pattern)",
      amount: 42000,
      fee: 420,       // 1% platform fee
      netAmount: 41580,
      date: "2025-07-25T09:15:00",
      txHash: "0x5678901234abcdef...",
      ticketingSystem: "Diamond Pattern",
      escrowStatus: "held_until_completion",
    },
    {
      id: "tx-004",
      type: "escrow",
      description: "Escrow deposit - Blockchain Workshop (Diamond Pattern)", 
      amount: 7500,
      fee: 75,        // 1% platform fee
      netAmount: 7425,
      date: "2025-08-10T11:00:00",
      txHash: "0x9876543210fedcba...",
      ticketingSystem: "Diamond Pattern",
      escrowStatus: "held_until_completion",
    },
    {
      id: "tx-005",
      type: "escrow_release",
      description: "Escrow release - Blockchain Workshop (Grace period ended)",
      amount: 7425,
      fee: 0,
      netAmount: 7425,
      date: "2025-08-12T00:00:00",
      txHash: "0xescrow123456789...",
      ticketingSystem: "Diamond Pattern",
      escrowStatus: "released_after_grace_period",
    },
  ],
};

const FinancePage: React.FC = () => {
  const { address } = useAccount();
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState("all");
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0);
  const [withdrawAddress, setWithdrawAddress] = useState<string>("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const toast = useToast();
  
  const cardBg = "white";

  // Get IDRX balance
  const { data: balanceData } = useBalance({
    address,
    token: IDRX_SEPOLIA,
    query: { enabled: !!address },
  });

  const walletBalance = balanceData ? formatUnits(balanceData.value, 2) : "0";

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge colorScheme="green">Completed</Badge>;
      case "ongoing":
        return <Badge colorScheme="orange">Ongoing</Badge>;
      case "upcoming":
        return <Badge colorScheme="blue">Upcoming</Badge>;
      default:
        return <Badge colorScheme="gray">Unknown</Badge>;
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "revenue":
        return "↗️";
      case "withdrawal":
        return "↙️";
      default:
        return "💰";
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || withdrawAmount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid withdrawal amount",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (withdrawAmount > mockFinanceData.availableBalance) {
      toast({
        title: "Insufficient balance",
        description: "Withdrawal amount exceeds available balance",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!withdrawAddress.trim()) {
      toast({
        title: "Invalid address",
        description: "Please enter a valid wallet address",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsWithdrawing(true);

    // Simulate withdrawal process
    setTimeout(() => {
      setIsWithdrawing(false);
      toast({
        title: "Withdrawal successful",
        description: `IDRX ${withdrawAmount.toLocaleString()} has been sent to your wallet`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      
      // Reset form
      setWithdrawAmount(0);
      setWithdrawAddress("");
    }, 2000);
  };

  const handleMaxWithdraw = () => {
    setWithdrawAmount(mockFinanceData.availableBalance);
  };

  const StatCard = ({
    title,
    value,
    subtitle,
    icon,
    color = "purple",
  }: {
    title: string;
    value: string;
    subtitle?: string;
    icon: React.ElementType;
    color?: string;
  }) => (
    <Box p={6} borderWidth="1px" borderRadius="lg" bg={cardBg}>
      <HStack justify="space-between" mb={2}>
        <Text fontSize="sm" color="gray.600" fontWeight="medium">
          {title}
        </Text>
        <Icon as={icon} color={`${color}.500`} />
      </HStack>
      <Text fontSize="2xl" fontWeight="bold" mb={1}>
        {value}
      </Text>
      {subtitle && (
        <Text fontSize="sm" color="gray.500">
          {subtitle}
        </Text>
      )}
    </Box>
  );

  return (
    <Container maxW="container.xl" py={8}>
      {/* Header */}
      <Box mb={8}>
        <Heading size="lg">Finance Dashboard</Heading>
        <Text color="gray.600">Track your revenue, withdrawals, and financial performance</Text>
      </Box>

      {/* Overview Stats */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
        <StatCard
          title="Total Revenue"
          value={`IDRX ${mockFinanceData.totalRevenue.toLocaleString()}`}
          subtitle="All-time earnings"
          icon={FaChartLine}
          color="green"
        />
        <StatCard
          title="Available Balance"
          value={`IDRX ${mockFinanceData.availableBalance.toLocaleString()}`}
          subtitle="Ready to withdraw"
          icon={FaWallet}
          color="blue"
        />
        <StatCard
          title="Wallet Balance"
          value={`IDRX ${Number(walletBalance).toLocaleString()}`}
          subtitle="Current wallet balance"
          icon={FaWallet}
          color="purple"
        />
        <StatCard
          title="Platform Fees Paid"
          value={`IDRX ${mockFinanceData.platformFeePaid.toLocaleString()}`}
          subtitle="1% of total revenue"
          icon={FaHistory}
          color="orange"
        />
      </SimpleGrid>

      <Tabs colorScheme="purple" variant="enclosed">
        <TabList>
          <Tab>Event Revenue</Tab>
          <Tab>Transaction History</Tab>
          <Tab>Withdraw Funds</Tab>
        </TabList>

        <TabPanels>
          {/* Event Revenue Tab */}
          <TabPanel px={0} py={6}>
            <VStack align="stretch" spacing={4}>
              <Flex justify="space-between" align="center">
                <Heading size="md">Revenue by Event</Heading>
                <HStack>
                  <Select
                    maxW="200px"
                    value={selectedEvent}
                    onChange={(e) => setSelectedEvent(e.target.value)}
                  >
                    <option value="all">All Events</option>
                    {mockFinanceData.eventRevenue.map((event) => (
                      <option key={event.eventId} value={event.eventId}>
                        {event.eventName}
                      </option>
                    ))}
                  </Select>
                  <Button leftIcon={<Icon as={FaDownload} />} size="sm" variant="outline">
                    Export
                  </Button>
                </HStack>
              </Flex>

              <Box borderWidth="1px" borderRadius="lg" bg={cardBg} overflow="hidden">
                <TableContainer>
                  <Table variant="simple">
                    <Thead bg="gray.50">
                      <Tr>
                        <Th>Event</Th>
                        <Th>Date</Th>
                        <Th>Status</Th>
                        <Th isNumeric>Gross Revenue</Th>
                        <Th isNumeric>Platform Fee (1%)</Th>
                        <Th isNumeric>Net Revenue</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {mockFinanceData.eventRevenue
                        .filter((event) => selectedEvent === "all" || event.eventId === selectedEvent)
                        .map((event) => (
                          <Tr key={event.eventId}>
                            <Td>
                              <Text fontWeight="medium">{event.eventName}</Text>
                            </Td>
                            <Td>{new Date(event.date).toLocaleDateString()}</Td>
                            <Td>{getStatusBadge(event.status)}</Td>
                            <Td isNumeric>IDRX {event.revenue.toLocaleString()}</Td>
                            <Td isNumeric color="orange.600">
                              IDRX {event.platformFee.toLocaleString()}
                            </Td>
                            <Td isNumeric fontWeight="medium" color="green.600">
                              IDRX {event.netRevenue.toLocaleString()}
                            </Td>
                          </Tr>
                        ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              </Box>
            </VStack>
          </TabPanel>

          {/* Transaction History Tab */}
          <TabPanel px={0} py={6}>
            <VStack align="stretch" spacing={4}>
              <Flex justify="space-between" align="center">
                <Heading size="md">Transaction History</Heading>
                <HStack>
                  <Select
                    maxW="200px"
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                  >
                    <option value="all">All Time</option>
                    <option value="30d">Last 30 Days</option>
                    <option value="7d">Last 7 Days</option>
                  </Select>
                  <Button leftIcon={<Icon as={FaDownload} />} size="sm" variant="outline">
                    Export
                  </Button>
                </HStack>
              </Flex>

              <Box borderWidth="1px" borderRadius="lg" bg={cardBg} overflow="hidden">
                <TableContainer>
                  <Table variant="simple">
                    <Thead bg="gray.50">
                      <Tr>
                        <Th>Type</Th>
                        <Th>Description</Th>
                        <Th>Date</Th>
                        <Th isNumeric>Amount</Th>
                        <Th isNumeric>Fee</Th>
                        <Th isNumeric>Net Amount</Th>
                        <Th>Transaction</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {mockFinanceData.transactions.map((tx) => (
                        <Tr key={tx.id}>
                          <Td>
                            <HStack>
                              <Text fontSize="lg">{getTransactionIcon(tx.type)}</Text>
                              <Text
                                fontSize="sm"
                                fontWeight="medium"
                                color={tx.type === "revenue" ? "green.600" : "orange.600"}
                                textTransform="capitalize"
                              >
                                {tx.type}
                              </Text>
                            </HStack>
                          </Td>
                          <Td>
                            <Text fontSize="sm">{tx.description}</Text>
                          </Td>
                          <Td>
                            <Text fontSize="sm">
                              {new Date(tx.date).toLocaleDateString()}
                            </Text>
                          </Td>
                          <Td isNumeric>
                            <Text
                              color={tx.amount > 0 ? "green.600" : "red.600"}
                              fontWeight="medium"
                            >
                              IDRX {Math.abs(tx.amount).toLocaleString()}
                            </Text>
                          </Td>
                          <Td isNumeric>
                            <Text color="orange.600">
                              IDRX {tx.fee.toLocaleString()}
                            </Text>
                          </Td>
                          <Td isNumeric>
                            <Text
                              fontWeight="medium"
                              color={tx.netAmount > 0 ? "green.600" : "red.600"}
                            >
                              IDRX {Math.abs(tx.netAmount).toLocaleString()}
                            </Text>
                          </Td>
                          <Td>
                            <Text
                              fontSize="xs"
                              color="gray.500"
                              fontFamily="mono"
                              cursor="pointer"
                              _hover={{ color: "purple.600" }}
                            >
                              {tx.txHash.slice(0, 6)}...{tx.txHash.slice(-4)}
                            </Text>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              </Box>
            </VStack>
          </TabPanel>

          {/* Withdraw Funds Tab */}
          <TabPanel px={0} py={6}>
            <VStack align="stretch" spacing={6}>
              <Heading size="md">Withdraw Balance</Heading>
              
              {/* Escrow Status Alert */}
              <Alert 
                status={mockFinanceData.escrowData.canWithdraw ? "success" : "warning"} 
                borderRadius="lg"
              >
                <AlertIcon />
                <Box>
                  <AlertTitle>
                    {mockFinanceData.escrowData.canWithdraw ? "Funds Available" : "Escrow Protection Active"}
                  </AlertTitle>
                  <AlertDescription>
                    {mockFinanceData.escrowData.canWithdraw ? (
                      `You have IDRX ${mockFinanceData.availableBalance.toLocaleString()} available to withdraw.`
                    ) : (
                      `IDRX ${mockFinanceData.escrowData.organizerEscrow.toLocaleString()} is held in escrow. Funds will be available after event completion + 1 day grace period.`
                    )}
                  </AlertDescription>
                </Box>
              </Alert>
              
              {/* Grace Period Info for Diamond Pattern Events */}
              {!mockFinanceData.escrowData.canWithdraw && (
                <Box p={4} bg="blue.50" borderRadius="lg" borderLeft="4px" borderLeftColor="blue.400">
                  <Text fontSize="sm" fontWeight="medium" mb={2} color="blue.800">
                    Diamond Pattern Escrow Protection
                  </Text>
                  <VStack align="start" spacing={1}>
                    <Text fontSize="xs" color="blue.700">
                      • Event Status: {mockFinanceData.escrowData.eventCompleted ? 'Completed' : 'Pending Completion'}
                    </Text>
                    <Text fontSize="xs" color="blue.700">
                      • Grace Period: {mockFinanceData.escrowData.gracePeriodEnd.toLocaleDateString()}
                    </Text>
                    <Text fontSize="xs" color="blue.700">
                      • Escrow Amount: IDRX {mockFinanceData.escrowData.organizerEscrow.toLocaleString()}
                    </Text>
                    <Text fontSize="xs" color="blue.700">
                      • This protects buyers from event cancellation or issues
                    </Text>
                  </VStack>
                </Box>
              )}

              {/* Withdrawal Form */}
              <Box p={6} borderWidth="1px" borderRadius="lg" bg={cardBg}>
                <VStack spacing={4} align="stretch">
                  <FormControl isRequired>
                    <FormLabel>Withdrawal Amount</FormLabel>
                    <InputGroup>
                      <NumberInput
                        value={withdrawAmount}
                        onChange={(_, value) => setWithdrawAmount(value || 0)}
                        min={0}
                        max={mockFinanceData.availableBalance}
                        w="full"
                      >
                        <NumberInputField pr="16" />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                      <InputRightElement width="auto" px={2}>
                        <Button size="xs" onClick={handleMaxWithdraw}>
                          Max
                        </Button>
                      </InputRightElement>
                    </InputGroup>
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      Maximum: IDRX {mockFinanceData.availableBalance.toLocaleString()}
                    </Text>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Destination Address</FormLabel>
                    <Input
                      placeholder="Enter wallet address (0x...)"
                      value={withdrawAddress}
                      onChange={(e) => setWithdrawAddress(e.target.value)}
                      fontFamily="mono"
                    />
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      {address && (
                        <Text as="span" color="purple.600" cursor="pointer" onClick={() => setWithdrawAddress(address)}>
                          Use connected wallet: {address.slice(0, 6)}...{address.slice(-4)}
                        </Text>
                      )}
                    </Text>
                  </FormControl>

                  {/* Withdrawal Summary */}
                  {withdrawAmount > 0 && (
                    <Box p={4} bg="gray.50" borderRadius="md">
                      <Text fontSize="sm" fontWeight="medium" mb={2}>Withdrawal Summary</Text>
                      <HStack justify="space-between">
                        <Text fontSize="sm">Amount:</Text>
                        <Text fontSize="sm" fontWeight="medium">IDRX {withdrawAmount.toLocaleString()}</Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontSize="sm">Platform Fee (1%):</Text>
                        <Text fontSize="sm" color="orange.600">
                          IDRX {((withdrawAmount * CONTRACT_FEES.platformFeePercentage) / CONTRACT_FEES.baseFeePoints).toFixed(2)}
                        </Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontSize="sm">Gas Fee (estimated):</Text>
                        <Text fontSize="sm" color="orange.600">~0.001 LSK</Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontSize="sm">Network:</Text>
                        <Text fontSize="sm">Lisk Sepolia</Text>
                      </HStack>
                    </Box>
                  )}

                  <Button
                    leftIcon={<Icon as={FaArrowDown} />}
                    colorScheme="purple"
                    size="lg"
                    onClick={handleWithdraw}
                    isLoading={isWithdrawing}
                    loadingText="Processing Withdrawal..."
                    isDisabled={!withdrawAmount || !withdrawAddress || withdrawAmount > mockFinanceData.availableBalance}
                  >
                    Withdraw Funds
                  </Button>
                </VStack>
              </Box>

              {/* Withdrawal Instructions */}
              <Box p={4} bg="gray.50" borderRadius="lg">
                <Text fontSize="sm" fontWeight="medium" mb={2} color="gray.800">
                  Withdrawal Information
                </Text>
                <VStack align="start" spacing={1}>
                  <Text fontSize="xs" color="gray.700">• Withdrawals are processed on the Lisk Sepolia network</Text>
                  <Text fontSize="xs" color="gray.700">• Processing time: 1-5 minutes</Text>
                  <Text fontSize="xs" color="gray.700">• Platform fee: 1% of withdrawal amount</Text>
                  <Text fontSize="xs" color="gray.700">• Gas fees are paid from your LSK balance</Text>
                  <Text fontSize="xs" color="gray.700">• Minimum withdrawal: IDRX 1</Text>
                  <Text fontSize="xs" color="gray.700">• Diamond Pattern events: Funds held in escrow until completion + grace period</Text>
                </VStack>
              </Box>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Container>
  );
};

export default FinancePage;