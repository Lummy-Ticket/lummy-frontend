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
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Progress,
  Icon,
  Flex,
  Card,
  CardBody,
  CardHeader,
} from "@chakra-ui/react";
import {
  MdPeople,
  MdEvent,
  MdAttachMoney,
  MdShoppingCart,
  MdAnalytics,
  MdAccountBalance,
  MdSwapHoriz,
} from "react-icons/md";

interface AnalyticsData {
  period: string;
  totalRevenue: number;
  platformFees: number;
  totalTicketsSold: number;
  totalEvents: number;
  activeUsers: number;
  newUsers: number;
  avgTicketPrice: number;
  topEvents: Array<{
    name: string;
    organizer: string;
    revenue: number;
    ticketsSold: number;
    performance: number;
  }>;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    fees: number;
  }>;
  userGrowth: Array<{
    month: string;
    totalUsers: number;
    newUsers: number;
  }>;
  transactionHistory: Array<{
    id: string;
    type: "purchase" | "resale" | "refund" | "fee_collection";
    event: string;
    amount: number;
    fee: number;
    timestamp: string;
    status: "completed" | "pending" | "failed";
  }>;
}

const AdminAnalytics: React.FC = () => {
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  
  const [selectedPeriod, setSelectedPeriod] = useState("30d");

  // Mock analytics data - in real app this would come from indexed blockchain data
  const analyticsData: AnalyticsData = {
    period: selectedPeriod,
    totalRevenue: 59500000, // IDR (sum of current events)
    platformFees: 595000, // 1% of revenue  
    totalTicketsSold: 270,
    totalEvents: 4,
    activeUsers: 1543,
    newUsers: 287,
    avgTicketPrice: 402439, // IDR
    topEvents: [
      {
        name: "Tech Conference 2025",
        organizer: "TechTalks ID",
        revenue: 42500000,
        ticketsSold: 250,
        performance: 83
      },
      {
        name: "Summer Music Festival",
        organizer: "EventMaster Indonesia",
        revenue: 15000000,
        ticketsSold: 50,
        performance: 10
      },
      {
        name: "Blockchain Workshop",
        organizer: "Blockchain Indonesia",
        revenue: 2000000,
        ticketsSold: 20,
        performance: 20
      },
      {
        name: "Rock Concert: Thunder Night",
        organizer: "RockFest Indonesia",
        revenue: 0,
        ticketsSold: 0,
        performance: 0
      }
    ],
    revenueByMonth: [
      { month: "Oct 2024", revenue: 450000000, fees: 4500000 },
      { month: "Nov 2024", revenue: 320000000, fees: 3200000 },
      { month: "Dec 2024", revenue: 580000000, fees: 5800000 },
      { month: "Jan 2025", revenue: 825000000, fees: 8250000 }
    ],
    userGrowth: [
      { month: "Oct 2024", totalUsers: 1024, newUsers: 234 },
      { month: "Nov 2024", totalUsers: 1186, newUsers: 162 },
      { month: "Dec 2024", totalUsers: 1398, newUsers: 212 },
      { month: "Jan 2025", totalUsers: 1543, newUsers: 287 }
    ],
    transactionHistory: [
      {
        id: "tx_001",
        type: "purchase",
        event: "Tech Conference 2025",
        amount: 150000,
        fee: 1500,
        timestamp: "2025-01-22 14:30",
        status: "completed"
      },
      {
        id: "tx_002", 
        type: "purchase",
        event: "Summer Music Festival",
        amount: 250000,
        fee: 2500,
        timestamp: "2025-01-22 13:15",
        status: "completed"
      },
      {
        id: "tx_003",
        type: "fee_collection",
        event: "Blockchain Workshop",
        amount: 100000,
        fee: 1000,
        timestamp: "2025-01-22 12:00",
        status: "completed"
      },
      {
        id: "tx_004",
        type: "purchase",
        event: "Rock Concert: Thunder Night",
        amount: 350000,
        fee: 3500,
        timestamp: "2025-01-22 11:45",
        status: "pending"
      }
    ]
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case "purchase": return "green";
      case "resale": return "blue";
      case "refund": return "orange";
      case "fee_collection": return "purple";
      default: return "gray";
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "purchase": return MdShoppingCart;
      case "resale": return MdSwapHoriz;
      case "refund": return MdAccountBalance;
      case "fee_collection": return MdAttachMoney;
      default: return MdAnalytics;
    }
  };

  const formatCurrency = (amount: number) => {
    return `IDR ${amount.toLocaleString()}`;
  };

  const calculateGrowthRate = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  // Calculate growth rates from previous period
  const revenueGrowth = calculateGrowthRate(
    analyticsData.revenueByMonth[3].revenue,
    analyticsData.revenueByMonth[2].revenue
  );
  const userGrowth = calculateGrowthRate(
    analyticsData.userGrowth[3].newUsers,
    analyticsData.userGrowth[2].newUsers
  );

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <Box>
            <Heading size="lg">Analytics Dashboard</Heading>
            <Text color="gray.600">
              Platform performance and revenue insights
            </Text>
          </Box>
          <Select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)} w="200px">
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </Select>
        </Flex>

        {/* Key Metrics */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          <Stat bg={cardBg} p={6} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
            <Flex justify="space-between" align="center">
              <Box>
                <StatLabel>Total Platform Revenue</StatLabel>
                <StatNumber color="green.500">{formatCurrency(analyticsData.totalRevenue)}</StatNumber>
                <StatHelpText>
                  <StatArrow type={revenueGrowth > 0 ? "increase" : "decrease"} />
                  {Math.abs(revenueGrowth)}% from last month
                </StatHelpText>
              </Box>
              <Icon as={MdAttachMoney} boxSize={8} color="green.500" />
            </Flex>
          </Stat>

          <Stat bg={cardBg} p={6} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
            <Flex justify="space-between" align="center">
              <Box>
                <StatLabel>Platform Fees Collected</StatLabel>
                <StatNumber color="purple.500">{formatCurrency(analyticsData.platformFees)}</StatNumber>
                <StatHelpText>
                  1% of total revenue
                </StatHelpText>
              </Box>
              <Icon as={MdAccountBalance} boxSize={8} color="purple.500" />
            </Flex>
          </Stat>

          <Stat bg={cardBg} p={6} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
            <Flex justify="space-between" align="center">
              <Box>
                <StatLabel>Total Tickets Sold</StatLabel>
                <StatNumber color="blue.500">{analyticsData.totalTicketsSold.toLocaleString()}</StatNumber>
                <StatHelpText>
                  Across {analyticsData.totalEvents} events
                </StatHelpText>
              </Box>
              <Icon as={MdEvent} boxSize={8} color="blue.500" />
            </Flex>
          </Stat>

          <Stat bg={cardBg} p={6} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
            <Flex justify="space-between" align="center">
              <Box>
                <StatLabel>Active Users</StatLabel>
                <StatNumber color="orange.500">{analyticsData.activeUsers.toLocaleString()}</StatNumber>
                <StatHelpText>
                  <StatArrow type={userGrowth > 0 ? "increase" : "decrease"} />
                  {analyticsData.newUsers} new this month
                </StatHelpText>
              </Box>
              <Icon as={MdPeople} boxSize={8} color="orange.500" />
            </Flex>
          </Stat>
        </SimpleGrid>

        {/* Revenue & User Growth */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
          {/* Revenue Trend */}
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} boxShadow="none">
            <CardHeader>
              <Heading size="md">Revenue Trend</Heading>
              <Text color="gray.600" fontSize="sm">Monthly revenue and platform fees</Text>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                {analyticsData.revenueByMonth.map((data) => (
                  <Box key={data.month}>
                    <Flex justify="space-between" align="center" mb={2}>
                      <Text fontSize="sm" fontWeight="medium">{data.month}</Text>
                      <VStack align="end" spacing={0}>
                        <Text fontSize="sm" fontWeight="bold">{formatCurrency(data.revenue)}</Text>
                        <Text fontSize="xs" color="purple.500">Fee: {formatCurrency(data.fees)}</Text>
                      </VStack>
                    </Flex>
                    <Progress 
                      value={(data.revenue / Math.max(...analyticsData.revenueByMonth.map(d => d.revenue))) * 100} 
                      colorScheme="green" 
                      size="sm"
                    />
                  </Box>
                ))}
              </VStack>
            </CardBody>
          </Card>

          {/* User Growth */}
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} boxShadow="none">
            <CardHeader>
              <Heading size="md">User Growth</Heading>
              <Text color="gray.600" fontSize="sm">Platform user acquisition</Text>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                {analyticsData.userGrowth.map((data) => (
                  <Box key={data.month}>
                    <Flex justify="space-between" align="center" mb={2}>
                      <Text fontSize="sm" fontWeight="medium">{data.month}</Text>
                      <VStack align="end" spacing={0}>
                        <Text fontSize="sm" fontWeight="bold">{data.totalUsers.toLocaleString()} total</Text>
                        <Text fontSize="xs" color="green.500">+{data.newUsers} new</Text>
                      </VStack>
                    </Flex>
                    <Progress 
                      value={(data.totalUsers / Math.max(...analyticsData.userGrowth.map(d => d.totalUsers))) * 100} 
                      colorScheme="blue" 
                      size="sm"
                    />
                  </Box>
                ))}
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Top Performing Events */}
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} boxShadow="none">
          <CardHeader>
            <Heading size="md">Top Performing Events</Heading>
            <Text color="gray.600" fontSize="sm">Events ranked by revenue and ticket sales</Text>
          </CardHeader>
          <CardBody>
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th>Event</Th>
                  <Th>Organizer</Th>
                  <Th>Revenue</Th>
                  <Th>Tickets Sold</Th>
                  <Th>Performance</Th>
                </Tr>
              </Thead>
              <Tbody>
                {analyticsData.topEvents.map((event, index) => (
                  <Tr key={index}>
                    <Td>
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="medium" fontSize="sm">{event.name}</Text>
                        <Badge size="xs" colorScheme="blue">#{index + 1}</Badge>
                      </VStack>
                    </Td>
                    <Td>
                      <Text fontSize="sm">{event.organizer}</Text>
                    </Td>
                    <Td>
                      <Text fontWeight="medium" color="green.600">
                        {formatCurrency(event.revenue)}
                      </Text>
                    </Td>
                    <Td>
                      <Text fontWeight="medium">{event.ticketsSold.toLocaleString()}</Text>
                    </Td>
                    <Td>
                      <HStack>
                        <Progress value={event.performance} colorScheme="green" size="sm" w="60px" />
                        <Text fontSize="sm">{event.performance}%</Text>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </CardBody>
        </Card>

        {/* Recent Transactions */}
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} boxShadow="none">
          <CardHeader>
            <Heading size="md">Recent Platform Transactions</Heading>
            <Text color="gray.600" fontSize="sm">Latest blockchain transactions and fee collections</Text>
          </CardHeader>
          <CardBody>
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th>Transaction</Th>
                  <Th>Event</Th>
                  <Th>Amount</Th>
                  <Th>Platform Fee</Th>
                  <Th>Time</Th>
                  <Th>Status</Th>
                </Tr>
              </Thead>
              <Tbody>
                {analyticsData.transactionHistory.map((tx) => (
                  <Tr key={tx.id}>
                    <Td>
                      <HStack>
                        <Icon as={getTransactionIcon(tx.type)} color={`${getTransactionTypeColor(tx.type)}.500`} />
                        <VStack align="start" spacing={0}>
                          <Text fontSize="sm" fontWeight="medium" textTransform="capitalize">
                            {tx.type.replace('_', ' ')}
                          </Text>
                          <Text fontSize="xs" color="gray.500" fontFamily="monospace">
                            {tx.id}
                          </Text>
                        </VStack>
                      </HStack>
                    </Td>
                    <Td>
                      <Text fontSize="sm">{tx.event}</Text>
                    </Td>
                    <Td>
                      <Text fontWeight="medium" color={tx.type === "refund" ? "orange.500" : "green.600"}>
                        {tx.type === "refund" ? "-" : ""}{formatCurrency(tx.amount)}
                      </Text>
                    </Td>
                    <Td>
                      <Text fontSize="sm" color="purple.500">
                        {tx.fee > 0 ? "+" : ""}{formatCurrency(tx.fee)}
                      </Text>
                    </Td>
                    <Td>
                      <Text fontSize="sm" color="gray.500">{tx.timestamp}</Text>
                    </Td>
                    <Td>
                      <Badge 
                        size="sm" 
                        colorScheme={tx.status === "completed" ? "green" : tx.status === "pending" ? "yellow" : "red"}
                      >
                        {tx.status}
                      </Badge>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </CardBody>
        </Card>

        {/* Platform Health */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} boxShadow="none">
            <CardHeader>
              <Heading size="sm">Average Ticket Price</Heading>
            </CardHeader>
            <CardBody>
              <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                {formatCurrency(analyticsData.avgTicketPrice)}
              </Text>
              <Text fontSize="sm" color="gray.500">
                Across all events
              </Text>
            </CardBody>
          </Card>

          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} boxShadow="none">
            <CardHeader>
              <Heading size="sm">Platform Fee Rate</Heading>
            </CardHeader>
            <CardBody>
              <Text fontSize="2xl" fontWeight="bold" color="purple.500">
                1.0%
              </Text>
              <Text fontSize="sm" color="gray.500">
                Standard rate
              </Text>
            </CardBody>
          </Card>

          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} boxShadow="none">
            <CardHeader>
              <Heading size="sm">Events Success Rate</Heading>
            </CardHeader>
            <CardBody>
              <Text fontSize="2xl" fontWeight="bold" color="green.500">
                92%
              </Text>
              <Text fontSize="sm" color="gray.500">
                Non-cancelled events
              </Text>
            </CardBody>
          </Card>
        </SimpleGrid>
      </VStack>
    </Container>
  );
};

export default AdminAnalytics;