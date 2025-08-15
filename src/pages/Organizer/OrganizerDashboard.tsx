import React, { useState } from "react";
import {
  Box,
  Flex,
  Container,
  Heading,
  Text,
  Button,
  Select,
  HStack,
} from "@chakra-ui/react";
import { AddIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";

import SalesStatistics from "../../components/organizer/SalesStatistics";
// import EventStats from "../../components/organizer/EventStats"; // optional if used later

// Mock Events Data
const mockEvents = [
  {
    eventId: "1",
    eventName: "Summer Music Festival",
    ticketsSold: 450,
    totalTickets: 500,
    revenue: 22500,
    currency: "IDRX",
    tierStats: [
      { tierName: "General Admission", sold: 300, total: 300, price: 50 },
      { tierName: "VIP Pass", sold: 120, total: 150, price: 100 },
      { tierName: "Backstage Experience", sold: 30, total: 50, price: 150 },
    ],
    daysUntilEvent: 45,
  },
  {
    eventId: "2",
    eventName: "Tech Conference 2025",
    ticketsSold: 280,
    totalTickets: 400,
    revenue: 42000,
    currency: "IDRX",
    tierStats: [
      { tierName: "Standard Access", sold: 200, total: 250, price: 150 },
      { tierName: "Premium Access", sold: 80, total: 150, price: 300 },
    ],
    daysUntilEvent: 5,
  },
  {
    eventId: "3",
    eventName: "Blockchain Workshop",
    ticketsSold: 75,
    totalTickets: 100,
    revenue: 7500,
    currency: "IDRX",
    tierStats: [
      { tierName: "Workshop Ticket", sold: 65, total: 80, price: 100 },
      { tierName: "Workshop + Certification", sold: 10, total: 20, price: 200 },
    ],
    daysUntilEvent: -2,
  },
];

// Mock Sales Data
const mockSalesData = {
  totalRevenue: 72000,
  soldTickets: 805,
  availableTickets: 195,
  totalTransactions: 610,
  averageTicketPrice: 89.44,

  // Grouped by event name and ticket tier
  revenueByEventAndTier: {
    "Summer Music Festival": {
      "General Admission": 15000,
      "VIP Pass": 12000,
      "Backstage Experience": 4500,
    },
    "Tech Conference 2025": {
      "Standard Access": 30000,
      "Premium Access": 24000,
    },
    "Blockchain Workshop": {
      "Workshop Ticket": 6500,
      "Workshop + Certification": 2000,
    },
  },

  // Flat version (for backward compatibility)
  revenueByTier: {
    "General Admission": 15000,
    "VIP Pass": 12000,
    "Backstage Experience": 4500,
    "Standard Access": 30000,
    "Premium Access": 24000,
    "Workshop Ticket": 6500,
    "Workshop + Certification": 2000,
  },

  salesByDay: [
    { date: "2025-03-01", sales: 20 },
    { date: "2025-03-02", sales: 35 },
    { date: "2025-03-03", sales: 42 },
    { date: "2025-03-04", sales: 28 },
    { date: "2025-03-05", sales: 15 },
    { date: "2025-03-06", sales: 30 },
    { date: "2025-03-07", sales: 25 },
  ],
  currency: "IDRX",
  percentChange: 12.5,
};

const OrganizerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [selectedEvent, setSelectedEvent] = useState<string>("all");

  // No longer need smart contract setup since TicketNFT is auto-configured

  const filteredSalesData =
    selectedEvent === "all" ? mockSalesData : { ...mockSalesData }; // Add real filter later

  const handleCreateEvent = () => {
    navigate("/organizer/events/create");
  };

  return (
    <Container maxW="container.xl" py={8}>
      <Flex justify="space-between" align="center" mb={8}>
        <Box>
          <Heading size="lg">Organizer Dashboard</Heading>
          <Text color="gray.600">Manage your events and track performance</Text>
        </Box>
        <HStack spacing={3}>
          <Button
            colorScheme="blue"
            onClick={() => navigate("/organizer/events")}
          >
            📋 My Events
          </Button>
          <Button
            colorScheme="purple"
            leftIcon={<AddIcon />}
            onClick={handleCreateEvent}
          >
            Create Event
          </Button>
        </HStack>
      </Flex>

      {/* Sales Overview Section */}
      <Box mb={8}>
        <HStack mb={4} justify="space-between">
          <Heading size="md">Sales Overview</Heading>
          <Select
            maxW="250px"
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
          >
            <option value="all">All Events</option>
            {mockEvents.map((event) => (
              <option key={event.eventId} value={event.eventId}>
                {event.eventName}
              </option>
            ))}
          </Select>
        </HStack>
        {filteredSalesData && (
          <SalesStatistics
            salesData={filteredSalesData}
            eventName={
              selectedEvent === "all"
                ? "All Events"
                : mockEvents.find((e) => e.eventId === selectedEvent)
                    ?.eventName || "Event"
            }
          />
        )}
      </Box>
    </Container>
  );
};

export default OrganizerDashboard;
