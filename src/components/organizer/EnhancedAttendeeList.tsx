import React, { useState } from "react";
import {
  Flex,
  VStack,
  HStack,
  Card,
  CardBody,
  Input,
  InputGroup,
  InputLeftElement,
  Badge,
  Text,
  Button,
  Select,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tooltip,
  useClipboard,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Progress,
  Divider,
} from "@chakra-ui/react";
import {
  SearchIcon,
  ChevronDownIcon,
  CheckIcon,
  DownloadIcon,
  EmailIcon,
  CopyIcon,
  ViewIcon,
  TimeIcon,
  InfoIcon,
} from "@chakra-ui/icons";
import { AttendeeData } from "./AttendeeList";

// Event analytics interface (Mock contract enhancement)
export interface EventAnalytics {
  totalTickets: number;
  checkedIn: number;
  remaining: number;
  checkInRate: number;
  tierBreakdown: {
    tierName: string;
    total: number;
    checkedIn: number;
    rate: number;
  }[];
}

interface EnhancedAttendeeListProps {
  attendees: AttendeeData[];
  analytics: EventAnalytics;
  onCheckIn: (tokenId: string) => Promise<void>;
  onSendEmail: (attendee: AttendeeData) => Promise<void>;
  onExport: () => void;
  onRefreshData: () => Promise<void>;
  onBulkCheckIn?: (tokenIds: string[]) => Promise<void>;
  onBulkEmail?: (attendees: AttendeeData[]) => Promise<void>;
}



const EnhancedAttendeeList: React.FC<EnhancedAttendeeListProps> = ({
  attendees,
  analytics,
  onCheckIn,
  onSendEmail,
  onExport,
  onRefreshData,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [emailFilter, setEmailFilter] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get unique tiers for filter
  const tiers = [...new Set(attendees.map((a) => a.tierName))];

  // Filter attendees based on search and filters
  const filteredAttendees = attendees.filter((attendee) => {
    // Search filter (wallet address, email, token ID)
    const matchesSearch =
      attendee.walletAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (attendee.email && attendee.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      attendee.tokenId.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    const matchesStatus =
      statusFilter === "all" || attendee.displayStatus.toLowerCase() === statusFilter.toLowerCase();

    // Tier filter
    const matchesTier =
      tierFilter === "all" || attendee.tierName === tierFilter;

    // Email filter
    const matchesEmail =
      emailFilter === "all" ||
      (emailFilter === "verified" && attendee.canReceiveEmails) ||
      (emailFilter === "unverified" && attendee.email && !attendee.emailVerified) ||
      (emailFilter === "no-email" && !attendee.email);

    return matchesSearch && matchesStatus && matchesTier && matchesEmail;
  });

  // Format date with time
  const formatDateTime = (date: Date): string => {
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format wallet address (truncated)
  const formatWalletAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Get status color and icon
  const getStatusInfo = (attendee: AttendeeData) => {
    switch (attendee.displayStatus) {
      case "Checked In":
        return { color: "green", icon: "✅", bg: "green.50" };
      case "Valid":
        return { color: "blue", icon: "⏳", bg: "blue.50" };
      case "Transferred":
        return { color: "orange", icon: "🔄", bg: "orange.50" };
      case "Refunded":
        return { color: "red", icon: "💰", bg: "red.50" };
      default:
        return { color: "gray", icon: "❓", bg: "gray.50" };
    }
  };

  // Get email status info
  const getEmailStatusInfo = (attendee: AttendeeData) => {
    if (!attendee.email) {
      return { color: "gray", text: "No email", icon: "📧" };
    }
    if (attendee.emailVerified) {
      return { color: "green", text: "Verified", icon: "✅" };
    }
    return { color: "orange", text: "Unverified", icon: "⚠️" };
  };

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefreshData();
    setIsRefreshing(false);
  };

  return (
    <VStack spacing={6} align="stretch">
      {/* Analytics Dashboard */}
      <Card>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Flex justify="space-between" align="center">
              <Text fontSize="lg" fontWeight="bold">
                📊 Event Analytics
              </Text>
              <Button
                size="sm"
                variant="outline"
                leftIcon={<InfoIcon />}
                onClick={handleRefresh}
                isLoading={isRefreshing}
                loadingText="Refreshing"
              >
                Refresh
              </Button>
            </Flex>

            <HStack spacing={6}>
              <Stat>
                <StatLabel>Total Tickets</StatLabel>
                <StatNumber>{analytics.totalTickets}</StatNumber>
                <StatHelpText>All event tickets</StatHelpText>
              </Stat>
              
              <Stat>
                <StatLabel>Checked In</StatLabel>
                <StatNumber color="green.500">{analytics.checkedIn}</StatNumber>
                <StatHelpText>
                  {analytics.checkInRate}% attendance rate
                </StatHelpText>
              </Stat>
              
              <Stat>
                <StatLabel>Remaining</StatLabel>
                <StatNumber color="blue.500">{analytics.remaining}</StatNumber>
                <StatHelpText>Not checked in yet</StatHelpText>
              </Stat>
            </HStack>

            <Progress
              value={analytics.checkInRate}
              colorScheme="green"
              bg="gray.200"
              borderRadius="full"
              h="8px"
            />

            <Divider />

            {/* Tier Breakdown */}
            <VStack align="start" spacing={2}>
              <Text fontSize="md" fontWeight="medium">Check-in by Tier:</Text>
              <HStack spacing={4} wrap="wrap">
                {analytics.tierBreakdown.map((tier) => (
                  <Badge
                    key={tier.tierName}
                    colorScheme="purple"
                    p={2}
                    borderRadius="md"
                  >
                    {tier.tierName}: {tier.checkedIn}/{tier.total} ({tier.rate}%)
                  </Badge>
                ))}
              </HStack>
            </VStack>
          </VStack>
        </CardBody>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Flex
              justify="space-between"
              direction={{ base: "column", md: "row" }}
              gap={4}
            >
              <InputGroup maxW={{ base: "100%", md: "300px" }}>
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search by wallet, email, or token ID"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </InputGroup>

              <HStack spacing={2} wrap="wrap">
                <Select
                  placeholder="All Statuses"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  maxW="120px"
                  size="sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="valid">Valid</option>
                  <option value="checked in">Checked In</option>
                  <option value="transferred">Transferred</option>
                  <option value="refunded">Refunded</option>
                </Select>

                <Select
                  placeholder="All Tiers"
                  value={tierFilter}
                  onChange={(e) => setTierFilter(e.target.value)}
                  maxW="120px"
                  size="sm"
                >
                  <option value="all">All Tiers</option>
                  {tiers.map((tier) => (
                    <option key={tier} value={tier}>
                      {tier}
                    </option>
                  ))}
                </Select>

                <Select
                  placeholder="Email Status"
                  value={emailFilter}
                  onChange={(e) => setEmailFilter(e.target.value)}
                  maxW="120px"
                  size="sm"
                >
                  <option value="all">All Emails</option>
                  <option value="verified">Verified</option>
                  <option value="unverified">Unverified</option>
                  <option value="no-email">No Email</option>
                </Select>

                <Button
                  leftIcon={<DownloadIcon />}
                  onClick={onExport}
                  colorScheme="purple"
                  variant="outline"
                  size="sm"
                >
                  Export
                </Button>
              </HStack>
            </Flex>
          </VStack>
        </CardBody>
      </Card>

      {/* Attendee Cards */}
      <VStack spacing={3} align="stretch">
        {filteredAttendees.length > 0 ? (
          filteredAttendees.map((attendee) => {
            const { hasCopied, onCopy } = useClipboard(attendee.walletAddress);
            const statusInfo = getStatusInfo(attendee);
            const emailInfo = getEmailStatusInfo(attendee);

            return (
              <Card
                key={attendee.tokenId}
                bg={statusInfo.bg}
                borderLeft="4px solid"
                borderLeftColor={`${statusInfo.color}.400`}
                _hover={{ shadow: "md", transform: "translateY(-1px)" }}
                transition="all 0.2s"
              >
                <CardBody>
                  <Flex justify="space-between" align="start">
                    <VStack align="start" spacing={3} flex="1">
                      {/* Header Info */}
                      <HStack spacing={4} align="center">
                        <Text fontSize="lg" fontWeight="bold">
                          {formatWalletAddress(attendee.walletAddress)}
                        </Text>
                        <Badge
                          colorScheme={statusInfo.color}
                          fontSize="sm"
                          px={2}
                          py={1}
                        >
                          {statusInfo.icon} {attendee.displayStatus}
                        </Badge>
                        <Tooltip label={hasCopied ? "Copied!" : "Copy full address"}>
                          <IconButton
                            icon={<CopyIcon />}
                            aria-label="Copy wallet address"
                            size="xs"
                            variant="ghost"
                            onClick={onCopy}
                          />
                        </Tooltip>
                      </HStack>

                      {/* Ticket Info */}
                      <HStack spacing={4} fontSize="sm">
                        <Badge colorScheme="purple" variant="outline">
                          {attendee.tierName}
                        </Badge>
                        <Text color="gray.600">
                          IDRX {attendee.originalPrice} • Token #{attendee.tokenId}
                        </Text>
                        <Text color="gray.500">
                          #{attendee.serialNumber} in tier
                        </Text>
                      </HStack>

                      {/* Email Info */}
                      <HStack spacing={2} fontSize="sm">
                        <Text color="gray.600">{emailInfo.icon}</Text>
                        {attendee.email ? (
                          <Text color={`${emailInfo.color}.600`}>
                            {attendee.email}
                          </Text>
                        ) : (
                          <Text color="gray.500">No email provided</Text>
                        )}
                        <Badge
                          colorScheme={emailInfo.color}
                          size="sm"
                          variant="subtle"
                        >
                          {emailInfo.text}
                        </Badge>
                      </HStack>

                      {/* Purchase & Check-in Info */}
                      <VStack align="start" spacing={1} fontSize="sm" color="gray.600">
                        <Text>
                          🛒 Purchased: {formatDateTime(attendee.purchaseDate)}
                        </Text>
                        {attendee.checkInData && (
                          <Text>
                            ✅ Checked in: {formatDateTime(attendee.checkInData.timestamp)} by{" "}
                            {formatWalletAddress(attendee.checkInData.staffAddress)} ({attendee.checkInData.staffRole})
                            ({attendee.checkInData.staffRole})
                          </Text>
                        )}
                        {attendee.transferCount > 0 && (
                          <Text color="orange.600">
                            🔄 Transferred {attendee.transferCount} time(s) - Not original owner
                          </Text>
                        )}
                      </VStack>
                    </VStack>

                    {/* Actions */}
                    <VStack spacing={2} ml={4}>
                      {attendee.canCheckIn && (
                        <Button
                          size="sm"
                          colorScheme="green"
                          leftIcon={<CheckIcon />}
                          onClick={() => onCheckIn(attendee.tokenId)}
                        >
                          Check In
                        </Button>
                      )}
                      
                      {attendee.canReceiveEmails && (
                        <Button
                          size="sm"
                          colorScheme="blue"
                          variant="outline"
                          leftIcon={<EmailIcon />}
                          onClick={() => onSendEmail(attendee)}
                        >
                          Send Email
                        </Button>
                      )}

                      <Menu>
                        <MenuButton
                          as={Button}
                          rightIcon={<ChevronDownIcon />}
                          size="sm"
                          variant="outline"
                        >
                          More
                        </MenuButton>
                        <MenuList>
                          <MenuItem icon={<ViewIcon />}>
                            View NFT Details
                          </MenuItem>
                          <MenuItem icon={<TimeIcon />}>
                            Transaction History
                          </MenuItem>
                          {!attendee.email && (
                            <MenuItem icon={<EmailIcon />}>
                              Request Email
                            </MenuItem>
                          )}
                        </MenuList>
                      </Menu>
                    </VStack>
                  </Flex>
                </CardBody>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardBody>
              <Text textAlign="center" color="gray.500" py={4}>
                No attendees found matching your criteria
              </Text>
            </CardBody>
          </Card>
        )}
      </VStack>

      {/* Footer Stats */}
      <Text fontSize="sm" color="gray.500" textAlign="center">
        Showing {filteredAttendees.length} of {attendees.length} attendees
        {attendees.length > 0 && (
          <span>
            {" • "}
            {attendees.filter(a => a.canReceiveEmails).length} with verified emails
            {" • "}
            {attendees.filter(a => a.used).length} checked in
          </span>
        )}
      </Text>
    </VStack>
  );
};

export default EnhancedAttendeeList;