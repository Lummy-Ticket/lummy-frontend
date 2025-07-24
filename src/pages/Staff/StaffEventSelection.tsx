import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Badge,
  Icon,
  SimpleGrid,
  Skeleton,
} from "@chakra-ui/react";
import {
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaUsers,
  FaQrcode,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

// Mock data for events where user is staff
interface StaffEvent {
  eventId: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
  eventContract: string;
  totalAttendees: number;
  checkedIn: number;
  status: "upcoming" | "ongoing" | "completed";
  organizerName: string;
}

const mockStaffEvents: StaffEvent[] = [
  {
    eventId: "1",
    eventName: "Summer Music Festival",
    eventDate: "2025-06-15",
    eventLocation: "Jakarta Convention Center",
    eventContract: "0x1234567890abcdef1234567890abcdef12345678",
    totalAttendees: 500,
    checkedIn: 0,
    status: "upcoming",
    organizerName: "EventMaster Indonesia",
  },
  {
    eventId: "2",
    eventName: "Tech Conference 2025",
    eventDate: "2025-07-25",
    eventLocation: "Bali International Convention Centre",
    eventContract: "0xabcdef1234567890abcdef1234567890abcdef12",
    totalAttendees: 400,
    checkedIn: 280,
    status: "ongoing",
    organizerName: "TechTalks ID",
  },
  {
    eventId: "3",
    eventName: "Art Exhibition Opening",
    eventDate: "2025-05-10",
    eventLocation: "National Gallery Jakarta",
    eventContract: "0x567890abcdef1234567890abcdef1234567890ab",
    totalAttendees: 200,
    checkedIn: 200,
    status: "completed",
    organizerName: "Art Foundation",
  },
];

const StaffEventSelection: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [staffEvents, setStaffEvents] = useState<StaffEvent[]>([]);

  const cardBg = "white";
  const borderColor = "gray.200";

  useEffect(() => {
    // Simulate fetching events where current wallet is staff
    // TODO: Replace with actual contract calls to check staffWhitelist across events
    setTimeout(() => {
      setStaffEvents(mockStaffEvents);
      setIsLoading(false);
    }, 1500);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "blue";
      case "ongoing":
        return "green";
      case "completed":
        return "gray";
      default:
        return "blue";
    }
  };

  const handleEventSelect = (
    eventId: string,
    action: "dashboard" | "scanner"
  ) => {
    if (action === "dashboard") {
      navigate(`/staff/event/${eventId}`);
    } else {
      navigate(`/staff/event/${eventId}/scanner`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} align="stretch">
          <Skeleton height="60px" />
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} height="200px" borderRadius="lg" />
            ))}
          </SimpleGrid>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <Heading size="lg" mb={2}>
            Staff Dashboard
          </Heading>
          <Text color="gray.600" fontSize="lg">
            Select an event to manage check-ins and attendee verification
          </Text>
        </Box>

        {staffEvents.length > 0 ? (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {staffEvents.map((event) => (
              <Box
                key={event.eventId}
                bg={cardBg}
                p={6}
                borderRadius="lg"
                border="2px solid"
                borderColor={borderColor}
                boxShadow="none"
                _hover={{
                  borderColor: "purple.300",
                  transform: "translateY(-2px)",
                  transition: "all 0.2s",
                }}
              >
                <VStack align="stretch" spacing={4}>
                  {/* Event Header */}
                  <Box>
                    <HStack justify="space-between" mb={2}>
                      <Badge
                        colorScheme={getStatusColor(event.status)}
                        textTransform="capitalize"
                      >
                        {event.status}
                      </Badge>
                      <Text fontSize="xs" color="gray.500">
                        ID: {event.eventId}
                      </Text>
                    </HStack>
                    <Heading size="md" mb={2} noOfLines={2}>
                      {event.eventName}
                    </Heading>
                    <Text fontSize="sm" color="gray.600" mb={3}>
                      by {event.organizerName}
                    </Text>
                  </Box>

                  {/* Event Details */}
                  <VStack align="stretch" spacing={2}>
                    <HStack>
                      <Icon as={FaCalendarAlt} color="gray.500" boxSize={4} />
                      <Text fontSize="sm">{formatDate(event.eventDate)}</Text>
                    </HStack>
                    <HStack>
                      <Icon as={FaMapMarkerAlt} color="gray.500" boxSize={4} />
                      <Text fontSize="sm" noOfLines={1}>
                        {event.eventLocation}
                      </Text>
                    </HStack>
                    <HStack>
                      <Icon as={FaUsers} color="gray.500" boxSize={4} />
                      <Text fontSize="sm">
                        {event.checkedIn} / {event.totalAttendees} checked in
                      </Text>
                    </HStack>
                  </VStack>

                  {/* Action Buttons */}
                  <VStack spacing={2} pt={2}>
                    <Button
                      w="full"
                      colorScheme="purple"
                      onClick={() =>
                        handleEventSelect(event.eventId, "dashboard")
                      }
                      isDisabled={event.status === "completed"}
                      _hover={event.status === "completed" ? {} : undefined}
                    >
                      Check-in Dashboard
                    </Button>
                    <HStack w="full">
                      <Button
                        flex="1"
                        variant="outline"
                        colorScheme="purple"
                        leftIcon={<Icon as={FaQrcode} />}
                        onClick={() =>
                          handleEventSelect(event.eventId, "scanner")
                        }
                        isDisabled={event.status === "completed"}
                        _hover={event.status === "completed" ? {} : undefined}
                      >
                        Scanner
                      </Button>
                    </HStack>
                  </VStack>
                </VStack>
              </Box>
            ))}
          </SimpleGrid>
        ) : (
          <Box
            textAlign="center"
            py={12}
            px={8}
            bg={cardBg}
            borderRadius="lg"
            border="2px solid"
            borderColor={borderColor}
            boxShadow="none"
          >
            <Icon as={FaUsers} boxSize={12} color="gray.400" mb={4} />
            <Heading size="md" color="gray.600" mb={2}>
              No Events Assigned
            </Heading>
            <Text color="gray.500" mb={4}>
              You are not currently assigned as staff to any events.
            </Text>
            <Text fontSize="sm" color="gray.400">
              Contact event organizers to be added as staff for their events.
            </Text>
          </Box>
        )}
      </VStack>
    </Container>
  );
};

export default StaffEventSelection;
