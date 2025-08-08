import React, { useState, useMemo } from "react";
import {
  Box,
  Flex,
  VStack,
  HStack,
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
  Divider,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Checkbox,
  Tag,
  TagLabel,
  useToast,
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
  TriangleUpIcon,
  TriangleDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@chakra-ui/icons";
import { AttendeeData } from "./AttendeeList";

// Event analytics interface
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

// Sorting functionality
type SortField = 'walletAddress' | 'tierName' | 'displayStatus' | 'purchaseDate' | 'checkInTime' | 'email';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

interface EnhancedAttendeeListTableProps {
  attendees: AttendeeData[];
  analytics: EventAnalytics;
  onCheckIn: (tokenId: string) => Promise<void>;
  onSendEmail: (attendee: AttendeeData) => Promise<void>;
  onExport: () => void;
  onRefreshData: () => Promise<void>;
  onBulkCheckIn?: (tokenIds: string[]) => Promise<void>;
  onBulkEmail?: (attendees: AttendeeData[]) => Promise<void>;
}

const EnhancedAttendeeListTable: React.FC<EnhancedAttendeeListTableProps> = ({
  attendees,
  analytics,
  onCheckIn,
  onSendEmail,
  onExport,
  onRefreshData,
  onBulkCheckIn,
  onBulkEmail,
}) => {
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [emailFilter, setEmailFilter] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'purchaseDate',
    direction: 'desc'
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  
  // Bulk selection state
  const [selectedAttendees, setSelectedAttendees] = useState<Set<string>>(new Set());

  // Get unique tiers for filter
  const tiers = [...new Set(attendees.map((a) => a.tierName))];

  // Sorting function
  const sortAttendees = (attendees: AttendeeData[], config: SortConfig) => {
    return [...attendees].sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (config.field) {
        case 'walletAddress':
          aValue = a.walletAddress.toLowerCase();
          bValue = b.walletAddress.toLowerCase();
          break;
        case 'tierName':
          aValue = a.tierName;
          bValue = b.tierName;
          break;
        case 'displayStatus':
          aValue = a.displayStatus;
          bValue = b.displayStatus;
          break;
        case 'purchaseDate':
          aValue = a.purchaseDate.getTime();
          bValue = b.purchaseDate.getTime();
          break;
        case 'checkInTime':
          aValue = a.checkInData?.timestamp.getTime() || 0;
          bValue = b.checkInData?.timestamp.getTime() || 0;
          break;
        case 'email':
          aValue = a.email || '';
          bValue = b.email || '';
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return config.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return config.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // Filter and sort attendees
  const filteredAndSortedAttendees = useMemo(() => {
    let filtered = attendees.filter((attendee) => {
      // Search filter
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

    return sortAttendees(filtered, sortConfig);
  }, [attendees, searchQuery, statusFilter, tierFilter, emailFilter, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedAttendees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAttendees = filteredAndSortedAttendees.slice(startIndex, startIndex + itemsPerPage);

  // Handle sorting
  const handleSort = (field: SortField) => {
    setSortConfig(prevConfig => ({
      field,
      direction: prevConfig.field === field && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Handle bulk selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAttendees(new Set(paginatedAttendees.map(a => a.tokenId)));
    } else {
      setSelectedAttendees(new Set());
    }
  };

  const handleSelectAttendee = (tokenId: string, checked: boolean) => {
    const newSelected = new Set(selectedAttendees);
    if (checked) {
      newSelected.add(tokenId);
    } else {
      newSelected.delete(tokenId);
    }
    setSelectedAttendees(newSelected);
  };

  // Format functions
  const formatWalletAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDateTime = (date: Date): string => {
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Status info
  const getStatusInfo = (attendee: AttendeeData) => {
    switch (attendee.displayStatus) {
      case "Checked In":
        return { color: "green", icon: "✅" };
      case "Valid":
        return { color: "blue", icon: "⏳" };
      case "Transferred":
        return { color: "orange", icon: "🔄" };
      case "Refunded":
        return { color: "red", icon: "💰" };
      default:
        return { color: "gray", icon: "❓" };
    }
  };

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

  // Bulk actions
  const handleBulkCheckIn = async () => {
    if (selectedAttendees.size === 0) return;
    
    const selectedTokenIds = Array.from(selectedAttendees);
    const eligibleTokenIds = selectedTokenIds.filter(tokenId => {
      const attendee = attendees.find(a => a.tokenId === tokenId);
      return attendee?.canCheckIn;
    });
    
    if (eligibleTokenIds.length === 0) {
      toast({
        title: "No eligible attendees",
        description: "Selected attendees are already checked in or transferred",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    if (onBulkCheckIn) {
      await onBulkCheckIn(eligibleTokenIds);
      setSelectedAttendees(new Set());
      toast({
        title: "Bulk check-in completed",
        description: `${eligibleTokenIds.length} attendees checked in successfully`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleBulkEmail = async () => {
    if (selectedAttendees.size === 0) return;
    
    const selectedAttendeesData = attendees.filter(a => 
      selectedAttendees.has(a.tokenId) && a.canReceiveEmails
    );
    
    if (selectedAttendeesData.length === 0) {
      toast({
        title: "No verified emails",
        description: "Selected attendees don't have verified email addresses",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    if (onBulkEmail) {
      await onBulkEmail(selectedAttendeesData);
      toast({
        title: "Bulk emails sent",
        description: `Emails sent to ${selectedAttendeesData.length} attendees`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortConfig.field !== field) return null;
    return sortConfig.direction === 'asc' ? <TriangleUpIcon /> : <TriangleDownIcon />;
  };

  return (
    <VStack spacing={6} align="stretch">
      {/* Compact Analytics Summary */}
      <Box
        p={4}
        borderWidth="2px"
        borderRadius="md"
        borderColor="gray.200"
        bg="white"
        shadow="sm"
      >
          <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
            <HStack spacing={6} wrap="wrap">
              <Stat size="sm">
                <StatLabel fontSize="xs">Total</StatLabel>
                <StatNumber fontSize="lg">{analytics.totalTickets}</StatNumber>
              </Stat>
              
              <Stat size="sm">
                <StatLabel fontSize="xs">Checked In</StatLabel>
                <StatNumber fontSize="lg" color="green.500">{analytics.checkedIn}</StatNumber>
              </Stat>
              
              <Stat size="sm">
                <StatLabel fontSize="xs">Rate</StatLabel>
                <StatNumber fontSize="lg" color="purple.500">{analytics.checkInRate}%</StatNumber>
              </Stat>
              
              <Divider orientation="vertical" h="40px" />
              
              <HStack spacing={2} wrap="wrap">
                {analytics.tierBreakdown.map((tier) => (
                  <Tag key={tier.tierName} size="sm" colorScheme="purple" variant="outline">
                    <TagLabel>
                      {tier.tierName}: {tier.checkedIn}/{tier.total} ({tier.rate}%)
                    </TagLabel>
                  </Tag>
                ))}
              </HStack>
            </HStack>

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
      </Box>

      {/* Search and Filters */}
      <Box
        p={4}
        borderWidth="2px"
        borderRadius="md"
        borderColor="gray.200"
        bg="white"
        shadow="sm"
      >
          <VStack spacing={4}>
            <Flex justify="space-between" w="full" wrap="wrap" gap={4}>
              <InputGroup maxW="300px">
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.400" />
                </InputLeftElement>
                <Input
                  size="sm"
                  placeholder="Search wallet, email, or token ID"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </InputGroup>

              <HStack spacing={2} wrap="wrap">
                <Select
                  size="sm"
                  placeholder="All Statuses"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  maxW="120px"
                >
                  <option value="all">All Statuses</option>
                  <option value="valid">Valid</option>
                  <option value="checked in">Checked In</option>
                  <option value="transferred">Transferred</option>
                  <option value="refunded">Refunded</option>
                </Select>

                <Select
                  size="sm"
                  placeholder="All Tiers"
                  value={tierFilter}
                  onChange={(e) => setTierFilter(e.target.value)}
                  maxW="120px"
                >
                  <option value="all">All Tiers</option>
                  {tiers.map((tier) => (
                    <option key={tier} value={tier}>
                      {tier}
                    </option>
                  ))}
                </Select>

                <Select
                  size="sm"
                  placeholder="Email Status"
                  value={emailFilter}
                  onChange={(e) => setEmailFilter(e.target.value)}
                  maxW="120px"
                >
                  <option value="all">All Emails</option>
                  <option value="verified">Verified</option>
                  <option value="unverified">Unverified</option>
                  <option value="no-email">No Email</option>
                </Select>

                <Button
                  size="sm"
                  leftIcon={<DownloadIcon />}
                  onClick={onExport}
                  colorScheme="purple"
                  variant="outline"
                >
                  Export
                </Button>
              </HStack>
            </Flex>

            {/* Bulk Actions */}
            {selectedAttendees.size > 0 && (
              <Flex justify="space-between" w="full" p={3} bg="blue.50" borderRadius="md">
                <Text fontSize="sm" color="blue.700">
                  {selectedAttendees.size} attendees selected
                </Text>
                <HStack spacing={2}>
                  <Button
                    size="xs"
                    colorScheme="green"
                    onClick={handleBulkCheckIn}
                    isDisabled={!onBulkCheckIn}
                  >
                    Bulk Check-in ({selectedAttendees.size})
                  </Button>
                  <Button
                    size="xs"
                    colorScheme="blue"
                    onClick={handleBulkEmail}
                    isDisabled={!onBulkEmail}
                  >
                    Bulk Email ({selectedAttendees.size})
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => setSelectedAttendees(new Set())}
                  >
                    Clear Selection
                  </Button>
                </HStack>
              </Flex>
            )}
          </VStack>
      </Box>

      {/* Professional Data Table */}
      <Box
        borderWidth="2px"
        borderRadius="md"
        borderColor="gray.200"
        bg="white"
        shadow="sm"
        p={2}
      >
          <Box overflowX="auto">
            <Table variant="simple" size="sm">
              <Thead bg="gray.50" position="sticky" top={0} zIndex={1}>
                <Tr>
                  <Th w="40px" p={2}>
                    <Checkbox
                      isChecked={selectedAttendees.size === paginatedAttendees.length && paginatedAttendees.length > 0}
                      isIndeterminate={selectedAttendees.size > 0 && selectedAttendees.size < paginatedAttendees.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </Th>
                  <Th 
                    cursor="pointer" 
                    onClick={() => handleSort('walletAddress')}
                    _hover={{ bg: "gray.100" }}
                  >
                    <HStack spacing={1}>
                      <Text>Wallet Address</Text>
                      {getSortIcon('walletAddress')}
                    </HStack>
                  </Th>
                  <Th 
                    cursor="pointer" 
                    onClick={() => handleSort('tierName')}
                    _hover={{ bg: "gray.100" }}
                  >
                    <HStack spacing={1}>
                      <Text>Tier</Text>
                      {getSortIcon('tierName')}
                    </HStack>
                  </Th>
                  <Th 
                    cursor="pointer" 
                    onClick={() => handleSort('displayStatus')}
                    _hover={{ bg: "gray.100" }}
                  >
                    <HStack spacing={1}>
                      <Text>Status</Text>
                      {getSortIcon('displayStatus')}
                    </HStack>
                  </Th>
                  <Th 
                    cursor="pointer" 
                    onClick={() => handleSort('email')}
                    _hover={{ bg: "gray.100" }}
                  >
                    <HStack spacing={1}>
                      <Text>Email</Text>
                      {getSortIcon('email')}
                    </HStack>
                  </Th>
                  <Th 
                    cursor="pointer" 
                    onClick={() => handleSort('purchaseDate')}
                    _hover={{ bg: "gray.100" }}
                  >
                    <HStack spacing={1}>
                      <Text>Purchase</Text>
                      {getSortIcon('purchaseDate')}
                    </HStack>
                  </Th>
                  <Th 
                    cursor="pointer" 
                    onClick={() => handleSort('checkInTime')}
                    _hover={{ bg: "gray.100" }}
                  >
                    <HStack spacing={1}>
                      <Text>Check-in</Text>
                      {getSortIcon('checkInTime')}
                    </HStack>
                  </Th>
                  <Th w="100px">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {paginatedAttendees.length > 0 ? (
                  paginatedAttendees.map((attendee) => {
                    const { hasCopied, onCopy } = useClipboard(attendee.walletAddress);
                    const statusInfo = getStatusInfo(attendee);
                    const emailInfo = getEmailStatusInfo(attendee);

                    return (
                      <Tr
                        key={attendee.tokenId}
                        _hover={{ bg: "gray.50" }}
                        bg={selectedAttendees.has(attendee.tokenId) ? "blue.25" : undefined}
                      >
                        <Td p={2}>
                          <Checkbox
                            isChecked={selectedAttendees.has(attendee.tokenId)}
                            onChange={(e) => handleSelectAttendee(attendee.tokenId, e.target.checked)}
                          />
                        </Td>
                        
                        <Td>
                          <HStack spacing={2}>
                            <Text fontSize="sm" fontFamily="mono">
                              {formatWalletAddress(attendee.walletAddress)}
                            </Text>
                            <Tooltip label={hasCopied ? "Copied!" : "Copy full address"}>
                              <IconButton
                                icon={<CopyIcon />}
                                aria-label="Copy address"
                                size="xs"
                                variant="ghost"
                                onClick={onCopy}
                              />
                            </Tooltip>
                          </HStack>
                          <Text fontSize="xs" color="gray.500">
                            #{attendee.tokenId}
                          </Text>
                        </Td>
                        
                        <Td>
                          <VStack align="start" spacing={0}>
                            <Badge colorScheme="purple" size="sm">
                              {attendee.tierName}
                            </Badge>
                            <Text fontSize="xs" color="gray.500">
                              IDRX {attendee.originalPrice}
                            </Text>
                          </VStack>
                        </Td>
                        
                        <Td>
                          <Badge 
                            colorScheme={statusInfo.color} 
                            size="sm"
                            variant="subtle"
                          >
                            {statusInfo.icon} {attendee.displayStatus}
                          </Badge>
                          {attendee.transferCount > 0 && (
                            <Text fontSize="xs" color="orange.500">
                              Transferred {attendee.transferCount}x
                            </Text>
                          )}
                        </Td>
                        
                        <Td>
                          {attendee.email ? (
                            <VStack align="start" spacing={0}>
                              <Text fontSize="sm">{attendee.email}</Text>
                              <Badge 
                                size="xs" 
                                colorScheme={emailInfo.color}
                                variant="subtle"
                              >
                                {emailInfo.icon} {emailInfo.text}
                              </Badge>
                            </VStack>
                          ) : (
                            <Text fontSize="sm" color="gray.400">
                              No email
                            </Text>
                          )}
                        </Td>
                        
                        <Td>
                          <Text fontSize="sm">
                            {formatDateTime(attendee.purchaseDate)}
                          </Text>
                        </Td>
                        
                        <Td>
                          {attendee.checkInData ? (
                            <VStack align="start" spacing={0}>
                              <Text fontSize="sm" color="green.600">
                                {formatDateTime(attendee.checkInData.timestamp)}
                              </Text>
                              <Text fontSize="xs" color="gray.500">
                                by {formatWalletAddress(attendee.checkInData.staffAddress)} ({attendee.checkInData.staffRole})
                              </Text>
                            </VStack>
                          ) : (
                            <Text fontSize="sm" color="gray.400">
                              Not checked in
                            </Text>
                          )}
                        </Td>
                        
                        <Td>
                          <Menu>
                            <MenuButton
                              as={IconButton}
                              icon={<ChevronDownIcon />}
                              size="sm"
                              variant="ghost"
                              aria-label="Actions"
                            />
                            <MenuList>
                              {attendee.canCheckIn && (
                                <MenuItem
                                  icon={<CheckIcon />}
                                  onClick={() => onCheckIn(attendee.tokenId)}
                                >
                                  Check In
                                </MenuItem>
                              )}
                              {attendee.canReceiveEmails && (
                                <MenuItem
                                  icon={<EmailIcon />}
                                  onClick={() => onSendEmail(attendee)}
                                >
                                  Send Email
                                </MenuItem>
                              )}
                              <MenuItem icon={<ViewIcon />}>
                                View NFT Details
                              </MenuItem>
                              <MenuItem icon={<TimeIcon />}>
                                Transaction History
                              </MenuItem>
                            </MenuList>
                          </Menu>
                        </Td>
                      </Tr>
                    );
                  })
                ) : (
                  <Tr>
                    <Td colSpan={8} textAlign="center" py={8}>
                      <VStack spacing={2}>
                        <Text color="gray.500">No attendees found</Text>
                        <Text fontSize="sm" color="gray.400">
                          Try adjusting your search or filters
                        </Text>
                      </VStack>
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </Box>
      </Box>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box
          py={3}
          px={4}
          borderWidth="2px"
          borderRadius="md"
          borderColor="gray.200"
          bg="white"
          shadow="sm"
        >
            <Flex justify="space-between" align="center">
              <Text fontSize="sm" color="gray.600">
                Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredAndSortedAttendees.length)} of{" "}
                {filteredAndSortedAttendees.length} attendees
                {filteredAndSortedAttendees.length !== attendees.length && (
                  <span> (filtered from {attendees.length} total)</span>
                )}
              </Text>
              
              <HStack spacing={2}>
                <IconButton
                  icon={<ChevronLeftIcon />}
                  aria-label="Previous page"
                  size="sm"
                  variant="outline"
                  isDisabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                />
                
                <HStack spacing={1}>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        size="sm"
                        variant={currentPage === pageNum ? "solid" : "outline"}
                        colorScheme={currentPage === pageNum ? "purple" : "gray"}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  {totalPages > 5 && (
                    <>
                      <Text>...</Text>
                      <Button
                        size="sm"
                        variant={currentPage === totalPages ? "solid" : "outline"}
                        colorScheme={currentPage === totalPages ? "purple" : "gray"}
                        onClick={() => setCurrentPage(totalPages)}
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                </HStack>
                
                <IconButton
                  icon={<ChevronRightIcon />}
                  aria-label="Next page"
                  size="sm"
                  variant="outline"
                  isDisabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                />
              </HStack>
            </Flex>
        </Box>
      )}

      {/* Footer Summary */}
      <Text fontSize="sm" color="gray.500" textAlign="center">
        📊 Total: {attendees.length} attendees • 
        📧 {attendees.filter(a => a.canReceiveEmails).length} verified emails • 
        ✅ {attendees.filter(a => a.used).length} checked in • 
        🔄 {attendees.filter(a => a.transferCount > 0).length} transferred
      </Text>
    </VStack>
  );
};

export default EnhancedAttendeeListTable;