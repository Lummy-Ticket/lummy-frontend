import React from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  SimpleGrid,
  Button,
  Icon,
  Flex,
  Heading,
} from "@chakra-ui/react";
import { FaCalendarAlt, FaMapMarkerAlt, FaUserTie, FaExternalLinkAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

interface StaffEvent {
  id: string;
  eventName: string;
  date: string;
  status: "upcoming" | "ongoing" | "completed";
  role: string;
  organizer: string;
  venue: string;
}

interface MyEventsProps {
  events: StaffEvent[];
}

const MyEvents: React.FC<MyEventsProps> = ({ events }) => {
  const navigate = useNavigate();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "upcoming":
        return <Badge colorScheme="blue">Upcoming</Badge>;
      case "ongoing":
        return <Badge colorScheme="orange">Ongoing</Badge>;
      case "completed":
        return <Badge colorScheme="gray">Completed</Badge>;
      default:
        return <Badge colorScheme="gray">Unknown</Badge>;
    }
  };

  const handleAccessEvent = (eventId: string) => {
    navigate(`/staff/event/${eventId}`);
  };

  if (events.length === 0) {
    return (
      <Box
        borderWidth="1px"
        borderRadius="lg"
        overflow="hidden"
        bg="white"
        p={8}
        textAlign="center"
      >
        <Text color="gray.500" mb={4}>
          You haven't been assigned to any events yet.
        </Text>
        <Text fontSize="sm" color="gray.400">
          Event organizers will add you as staff to their events.
        </Text>
      </Box>
    );
  }

  return (
    <Box borderWidth="1px" borderRadius="lg" overflow="hidden" bg="white" p={6}>
      <Heading size="md" mb={6}>
        My Events
      </Heading>
      
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        {events.map((event) => (
          <Box
            key={event.id}
            p={5}
            borderWidth="1px"
            borderRadius="md"
            bg="gray.50"
            transition="all 0.2s"
            _hover={{
              bg: "gray.100",
              transform: "translateY(-2px)",
              shadow: "md",
            }}
          >
            <VStack align="stretch" spacing={3}>
              {/* Header */}
              <Flex justify="space-between" align="flex-start">
                <VStack align="start" spacing={1} flex="1">
                  <Text fontWeight="bold" fontSize="lg" noOfLines={1}>
                    {event.eventName}
                  </Text>
                  {getStatusBadge(event.status)}
                </VStack>
              </Flex>

              {/* Event Details */}
              <VStack align="stretch" spacing={2}>
                <HStack>
                  <Icon as={FaCalendarAlt} color="gray.500" />
                  <Text fontSize="sm" color="gray.600">
                    {new Date(event.date).toLocaleDateString()}
                  </Text>
                </HStack>
                
                <HStack>
                  <Icon as={FaMapMarkerAlt} color="gray.500" />
                  <Text fontSize="sm" color="gray.600" noOfLines={1}>
                    {event.venue}
                  </Text>
                </HStack>
                
                <HStack>
                  <Icon as={FaUserTie} color="gray.500" />
                  <Text fontSize="sm" color="gray.600" noOfLines={1}>
                    {event.organizer}
                  </Text>
                </HStack>
              </VStack>

              {/* Role and Actions */}
              <Flex justify="space-between" align="center" pt={2}>
                <Badge colorScheme="green" variant="subtle">
                  {event.role}
                </Badge>
                
                {(event.status === "upcoming" || event.status === "ongoing") && (
                  <Button
                    size="sm"
                    colorScheme="purple"
                    rightIcon={<Icon as={FaExternalLinkAlt} />}
                    onClick={() => handleAccessEvent(event.id)}
                  >
                    Access
                  </Button>
                )}
              </Flex>
            </VStack>
          </Box>
        ))}
      </SimpleGrid>
      
      {/* Summary */}
      <Box mt={6} p={4} bg="purple.50" borderRadius="md">
        <HStack justify="space-between">
          <Text fontSize="sm" color="purple.700">
            Total Events: {events.length}
          </Text>
          <HStack spacing={4}>
            <Text fontSize="sm" color="blue.600">
              Upcoming: {events.filter(e => e.status === "upcoming").length}
            </Text>
            <Text fontSize="sm" color="orange.600">
              Ongoing: {events.filter(e => e.status === "ongoing").length}
            </Text>
            <Text fontSize="sm" color="gray.600">
              Completed: {events.filter(e => e.status === "completed").length}
            </Text>
          </HStack>
        </HStack>
      </Box>
    </Box>
  );
};

export default MyEvents;