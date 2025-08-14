import React from "react";
import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Icon,
  Image,
  useDisclosure,
} from "@chakra-ui/react";
import {
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaTicketAlt,
  FaExchangeAlt,
  FaShoppingCart,
  FaInfoCircle,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { TransferTicket } from "./TransferTicket";
import { ResellTicket } from "./ResellTicket";

export interface Ticket {
  id: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
  ticketType: string;
  price: number;
  currency: string;
  status: "valid" | "used" | "refunded" | "expired" | "transferred";  // Contract-compatible status values
  purchaseDate: string;
  tokenId?: string;
  ownerAddress?: string;
  nftImageUrl?: string;
  eventImageUrl?: string;
}

interface TicketCardProps {
  ticket: Ticket;
  onShowDetails?: (ticketId: string) => void;
}

export const TicketCard: React.FC<TicketCardProps> = ({
  ticket,
  onShowDetails,
}) => {
  const navigate = useNavigate();
  const {
    isOpen: isTransferOpen,
    onOpen: onTransferOpen,
    onClose: onTransferClose,
  } = useDisclosure();

  const {
    isOpen: isResellOpen,
    onOpen: onResellOpen,
    onClose: onResellClose,
  } = useDisclosure();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (status: Ticket["status"]) => {
    switch (status) {
      case "valid":
        return "green";
      case "used":
        return "gray";
      case "refunded":
        return "orange";
      case "expired":
        return "red";
      case "transferred":
        return "blue";
      default:
        return "gray";
    }
  };

  const getStatusLabel = (status: Ticket["status"]) => {
    switch (status) {
      case "valid":
        return "Active";
      case "used":
        return "Used";
      case "refunded":
        return "Refunded";
      case "expired":
        return "Expired";
      case "transferred":
        return "Transferred";
      default:
        return status;
    }
  };


  const isActive = ticket.status === "valid";

  const handleShowDetails = () => {
    if (onShowDetails) {
      onShowDetails(ticket.id);
    } else {
      navigate(`/tickets/${ticket.id}`);
    }
  };

  return (
    <>
      <Box
        borderWidth="1px"
        borderRadius="lg"
        overflow="hidden"
        bg="white"
        boxShadow="sm"
        transition="all 0.3s"
        _hover={{ transform: "translateY(-2px)", boxShadow: "md" }}
        height="100%"
        display="flex"
        flexDirection="column"
      >
        <Box
          bg="lummy.purple.500"
          color="white"
          py={1}
          px={4}
          borderBottomWidth="1px"
          borderBottomColor="lummy.purple.600"
        >
          <Flex justify="space-between" align="center">
            <HStack>
              <Icon as={FaTicketAlt} />
              <Text fontWeight="medium">{ticket.ticketType}</Text>
            </HStack>
            <Badge
              colorScheme={getStatusColor(ticket.status)}
              variant="solid"
              borderRadius="full"
              px={2}
            >
              {getStatusLabel(ticket.status)}
            </Badge>
          </Flex>
        </Box>

        <Box p={4} display="flex" flexDirection="column" flex="1">
          <Text fontSize="lg" fontWeight="bold" noOfLines={1}>
            {ticket.eventName}
          </Text>

          <VStack mt={2} spacing={2} align="flex-start" color="gray.600">
            <HStack>
              <Icon as={FaCalendarAlt} size="sm" />
              <Text fontSize="sm" noOfLines={1} maxW="100%">
                {formatDate(ticket.eventDate)}
              </Text>
            </HStack>

            <HStack>
              <Icon as={FaMapMarkerAlt} size="sm" />
              <Text fontSize="sm" noOfLines={1} maxW="100%">
                {ticket.eventLocation}
              </Text>
            </HStack>
          </VStack>

          {/* NFT Image container */}
          <Flex
            justify="center"
            my={4}
            flex="1"
            minHeight="150px"
            alignItems="center"
          >
            <Box
              position="relative"
              borderRadius="md"
              overflow="hidden"
              width="150px"
              height="150px"
            >
              <Image
                src="/assets/images/nft-preview.png"
                alt={`NFT for ${ticket.eventName}`}
                width="100%"
                height="100%"
                objectFit="cover"
                borderRadius="md"
              />
              {!isActive && (
                <Box
                  position="absolute"
                  top="0"
                  left="0"
                  right="0"
                  bottom="0"
                  bg="blackAlpha.600"
                  display="flex"
                  flexDirection="column"
                  justifyContent="center"
                  alignItems="center"
                  borderRadius="md"
                >
                  <Icon
                    as={FaInfoCircle}
                    color="white"
                    boxSize="24px"
                    mb={2}
                  />
                  <Text fontSize="xs" color="white" textAlign="center" px={2}>
                    {getStatusLabel(ticket.status)}
                  </Text>
                </Box>
              )}
            </Box>
          </Flex>

          {/* Footer actions with improved layout */}
          <VStack mt="auto" spacing={2} width="100%">
            {/* Ticket Details button - full width */}
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Icon as={FaInfoCircle} />}
              onClick={handleShowDetails}
              width="100%"
            >
              Ticket Details
            </Button>

            {/* Transfer & Resell buttons - side by side */}
            {isActive && (
              <HStack spacing={2} width="100%">
                <Button
                  size="sm"
                  colorScheme="purple"
                  variant="outline"
                  leftIcon={<Icon as={FaExchangeAlt} />}
                  onClick={onTransferOpen}
                  flex="1"
                >
                  Transfer
                </Button>
                <Button
                  size="sm"
                  colorScheme="green"
                  leftIcon={<Icon as={FaShoppingCart} />}
                  onClick={onResellOpen}
                  flex="1"
                >
                  Resell
                </Button>
              </HStack>
            )}
          </VStack>
        </Box>
      </Box>

      <TransferTicket
        isOpen={isTransferOpen}
        onClose={onTransferClose}
        ticket={ticket}
      />

      <ResellTicket
        isOpen={isResellOpen}
        onClose={onResellClose}
        ticket={ticket}
      />
    </>
  );
};

export default TicketCard;
