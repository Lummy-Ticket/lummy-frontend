import React from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  VStack,
  HStack,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Icon,
  useColorModeValue,
  Flex,
  Progress,
} from "@chakra-ui/react";
import {
  MdPeople,
  MdEvent,
  MdAttachMoney,
  MdTrendingUp,
  MdVisibility,
} from "react-icons/md";
import { useNavigate } from "react-router-dom";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: any;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  isPositive,
  icon,
  color,
}) => {
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  return (
    <Box
      bg={cardBg}
      p={6}
      borderRadius="lg"
      borderWidth="1px"
      borderColor={borderColor}
      position="relative"
      overflow="hidden"
    >
      <Flex justify="space-between" align="start">
        <Stat>
          <StatLabel color="gray.500" fontSize="sm" fontWeight="medium">
            {title}
          </StatLabel>
          <StatNumber fontSize="2xl" fontWeight="bold" color={`${color}.600`}>
            {value}
          </StatNumber>
          <StatHelpText m={0}>
            <StatArrow type={isPositive ? "increase" : "decrease"} />
            {change}
          </StatHelpText>
        </Stat>
        <Box p={3} borderRadius="lg" bg={`${color}.100`} color={`${color}.600`}>
          <Icon as={icon} boxSize={6} />
        </Box>
      </Flex>
    </Box>
  );
};

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  // Mock data
  const recentEvents = [
    {
      id: 1,
      name: "Jakarta Music Festival 2025",
      organizer: "Jakarta Music Productions",
      date: "2025-02-15",
      tickets: 1250,
      revenue: "625,000,000",
      status: "active",
    },
    {
      id: 2,
      name: "TechTalk: AI Revolution",
      organizer: "TechHub Indonesia",
      date: "2025-01-25",
      tickets: 500,
      revenue: "125,000,000",
      status: "active",
    },
    {
      id: 3,
      name: "Startup Pitch Competition",
      organizer: "Startup Community",
      date: "2025-01-20",
      tickets: 300,
      revenue: "75,000,000",
      status: "completed",
    },
  ];

  const pendingRequests = [
    {
      id: 1,
      name: "Creative Workshop Studio",
      email: "info@creativeworkshop.id",
      date: "2025-01-19",
      type: "Individual",
    },
    {
      id: 2,
      name: "Bali Event Organizers",
      email: "contact@balievents.com",
      date: "2025-01-18",
      type: "PT",
    },
    {
      id: 3,
      name: "Youth Community Jakarta",
      email: "admin@youthjakarta.org",
      date: "2025-01-17",
      type: "Komunitas",
    },
  ];

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="lg" mb={2}>
            Dashboard Overview
          </Heading>
          <Text color="gray.600">
            Welcome to Lummy Admin Panel. Here's what's happening on your
            platform.
          </Text>
        </Box>

        {/* Stats Grid */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          <StatCard
            title="Total Organizers"
            value="47"
            change="12% from last month"
            isPositive={true}
            icon={MdPeople}
            color="blue"
          />
          <StatCard
            title="Active Events"
            value="23"
            change="8% from last month"
            isPositive={true}
            icon={MdEvent}
            color="green"
          />
          <StatCard
            title="Total Revenue"
            value="₹2.5M"
            change="23% from last month"
            isPositive={true}
            icon={MdAttachMoney}
            color="purple"
          />
          <StatCard
            title="Platform Growth"
            value="89%"
            change="5% from last month"
            isPositive={true}
            icon={MdTrendingUp}
            color="orange"
          />
        </SimpleGrid>

        {/* Two Column Layout */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
          {/* Recent Events */}
          <Box
            bg={cardBg}
            p={6}
            borderRadius="lg"
            borderWidth="1px"
            borderColor={borderColor}
          >
            <Flex justify="space-between" align="center" mb={4}>
              <Heading size="md">Recent Events</Heading>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate("/admin/events")}
              >
                View All
              </Button>
            </Flex>

            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th>Event</Th>
                  <Th>Tickets Sold</Th>
                  <Th>Status</Th>
                </Tr>
              </Thead>
              <Tbody>
                {recentEvents.map((event) => (
                  <Tr key={event.id}>
                    <Td>
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="medium" fontSize="sm">
                          {event.name}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          by {event.organizer}
                        </Text>
                      </VStack>
                    </Td>
                    <Td>
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="medium">
                          {event.tickets.toLocaleString()}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          IDR {event.revenue}
                        </Text>
                      </VStack>
                    </Td>
                    <Td>
                      <Badge
                        colorScheme={
                          event.status === "active" ? "green" : "gray"
                        }
                        size="sm"
                      >
                        {event.status}
                      </Badge>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>

          {/* Pending Organizer Requests */}
          <Box
            bg={cardBg}
            p={6}
            borderRadius="lg"
            borderWidth="1px"
            borderColor={borderColor}
          >
            <Flex justify="space-between" align="center" mb={4}>
              <Heading size="md">Pending Requests</Heading>
              <Button
                size="sm"
                colorScheme="purple"
                onClick={() => navigate("/admin/organizers")}
              >
                Review All
              </Button>
            </Flex>

            <VStack spacing={3} align="stretch">
              {pendingRequests.map((request) => (
                <Box
                  key={request.id}
                  p={4}
                  borderWidth="1px"
                  borderColor={borderColor}
                  borderRadius="md"
                  _hover={{ bg: "gray.50" }}
                >
                  <Flex justify="space-between" align="center">
                    <VStack align="start" spacing={1} flex="1">
                      <HStack>
                        <Text fontWeight="medium" fontSize="sm">
                          {request.name}
                        </Text>
                        <Badge size="sm" colorScheme="blue">
                          {request.type}
                        </Badge>
                      </HStack>
                      <Text fontSize="xs" color="gray.500">
                        {request.email}
                      </Text>
                      <Text fontSize="xs" color="gray.400">
                        Submitted {request.date}
                      </Text>
                    </VStack>
                    <Button
                      size="xs"
                      leftIcon={<Icon as={MdVisibility} />}
                      variant="outline"
                      onClick={() => navigate("/admin/organizers")}
                    >
                      Review
                    </Button>
                  </Flex>
                </Box>
              ))}
            </VStack>
          </Box>
        </SimpleGrid>

        {/* Platform Health */}
        <Box
          bg={cardBg}
          p={6}
          borderRadius="lg"
          borderWidth="1px"
          borderColor={borderColor}
        >
          <Heading size="md" mb={4}>
            Platform Health
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
            <VStack align="start" spacing={2}>
              <Text fontSize="sm" fontWeight="medium">
                Server Status
              </Text>
              <HStack>
                <Box w={3} h={3} bg="green.500" borderRadius="full" />
                <Text fontSize="sm" color="gray.600">
                  All systems operational
                </Text>
              </HStack>
            </VStack>

            <VStack align="start" spacing={2}>
              <Text fontSize="sm" fontWeight="medium">
                Storage Usage
              </Text>
              <Box w="full">
                <Flex justify="space-between" mb={1}>
                  <Text fontSize="xs" color="gray.500">
                    Database
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    67%
                  </Text>
                </Flex>
                <Progress value={67} colorScheme="blue" size="sm" />
              </Box>
            </VStack>

            <VStack align="start" spacing={2}>
              <Text fontSize="sm" fontWeight="medium">
                API Response Time
              </Text>
              <HStack>
                <Text fontSize="sm" fontWeight="bold" color="green.600">
                  127ms
                </Text>
                <Text fontSize="xs" color="gray.500">
                  avg response time
                </Text>
              </HStack>
            </VStack>
          </SimpleGrid>
        </Box>
      </VStack>
    </Container>
  );
};

export default AdminDashboard;
