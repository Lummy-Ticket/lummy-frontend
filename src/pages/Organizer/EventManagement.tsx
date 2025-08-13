import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  HStack,
  VStack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Icon,
  Flex,
  Badge,
  Divider,
  useToast,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  IconButton,
  Skeleton,
  Progress,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  InputGroup,
  InputLeftAddon,
  Stack,
} from "@chakra-ui/react";
import { ArrowBackIcon, EditIcon, DeleteIcon, AddIcon } from "@chakra-ui/icons";
import { FaTicketAlt, FaChartBar, FaUsers, FaCog, FaUserCheck } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import SalesStatistics, {
  SalesData,
} from "../../components/organizer/SalesStatistics";
import EventStats, {
  EventStatsData,
} from "../../components/organizer/EventStats";
import ResellSettings, {
  ResellSettingsData,
} from "../../components/organizer/ResellSettings";
import AttendeeList, {
  Attendee,
  AttendeeData,
} from "../../components/organizer/AttendeeList";
import EnhancedAttendeeListTable, {
  EventAnalytics,
} from "../../components/organizer/EnhancedAttendeeListTable";
import AttendeeService from "../../services/AttendeeService";
import { motion } from "framer-motion";
import { useSmartContract } from "../../hooks/useSmartContract";
import { useStaffEventListener } from "../../hooks/useStaffEventListener";
import { DEVELOPMENT_CONFIG } from "../../constants";

const MotionBox = motion.create(Box);

// Mock event data - would be fetched from API in real application
const mockEvent: EventStatsData = {
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
  daysUntilEvent: 45
};

// Mock sales data
const mockSalesData: SalesData = {
  totalRevenue: 22500,
  soldTickets: 450,
  availableTickets: 50,
  totalTransactions: 380,
  averageTicketPrice: 50,
  revenueByTier: {
    "General Admission": 15000,
    "VIP Pass": 12000,
    "Backstage Experience": 4500,
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

// Mock attendees data
const mockAttendees: Attendee[] = Array.from({ length: 30 }, (_, i) => ({
  id: `att-${i + 1}`,
  name: `Attendee ${i + 1}`,
  email: `attendee${i + 1}@example.com`,
  ticketType:
    i % 3 === 0
      ? "General Admission"
      : i % 3 === 1
      ? "VIP Pass"
      : "Backstage Experience",
  purchaseDate: new Date(2025, 2, Math.floor(i / 6) + 1).toISOString(),
  status:
    i % 10 === 0
      ? "checked-in"
      : i % 15 === 0
      ? "cancelled"
      : i % 20 === 0
      ? "refunded"
      : "confirmed",
  walletAddress: `0x${Math.random().toString(16).substring(2, 42)}`,
}));

// Mock resell settings (contract-compatible)
const mockResellSettings: ResellSettingsData = {
  allowResell: true,                // Enable resale
  maxMarkupPercentage: 20,          // 20% markup (contract: 2000 basis points)
  organizerFeePercentage: 2.5,      // 2.5% fee (contract: 250 basis points)
  restrictResellTiming: false,      // No timing restrictions
  minDaysBeforeEvent: 1,            // 1 day minimum
};

// Contract-compatible Staff Role enum (simplified to single role)
enum StaffRole {
  NONE = 0,
  SCANNER = 1, // All staff get SCANNER role
}

// Using StaffMember interface from useStaffEventListener

// Interface untuk Ticket Tier yang akan diedit (contract supports updateTicketTier)
interface EditableTier {
  id: string;
  tierId: number; // Contract tier index
  name: string;
  price: number;
  currency: string;
  description: string;
  available: number;
  maxPerPurchase: number;
  benefits?: string[];
}

const EventManagement: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const cancelRef = React.useRef<HTMLButtonElement>(null!);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { getEventInfo, getTicketTiers, addTicketTier, addStaff, removeStaff, getResaleRules, setResaleRules, getAllEventAttendees } = useSmartContract();
  
  // Event-based staff management
  const {
    staffList: eventBasedStaffList,
    isLoading: staffEventsLoading,
    isListening: staffEventsListening,
    error: staffEventsError,
    refreshStaffEvents,
  } = useStaffEventListener();

  // State
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<EventStatsData | null>(null);
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [resellSettings, setResellSettings] =
    useState<ResellSettingsData | null>(null);
    
  // Enhanced attendee management state
  const [enhancedAttendees, setEnhancedAttendees] = useState<AttendeeData[]>([]);
  const [eventAnalytics, setEventAnalytics] = useState<EventAnalytics>({
    totalTickets: 0,
    checkedIn: 0,
    remaining: 0,
    checkInRate: 0,
    tierBreakdown: [],
  });
  const [attendeeLoading, setAttendeeLoading] = useState(false);
  
  // Staff management state (now uses event-based system)
  const [newStaffAddress, setNewStaffAddress] = useState<string>("");
  const [newStaffRole, setNewStaffRole] = useState<StaffRole>(StaffRole.SCANNER);

  // State and handler for ticket tier modal form (contract supports updateTicketTier)
  const [editingTier, setEditingTier] = useState<EditableTier | null>(null);
  const [isNewTier, setIsNewTier] = useState(false);
  const [tierSaving, setTierSaving] = useState(false);
  const {
    isOpen: isTierModalOpen,
    onOpen: openTierModal,
    onClose: closeTierModal,
  } = useDisclosure();

  // Fetch event data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (DEVELOPMENT_CONFIG.ENABLE_BLOCKCHAIN) {
          // Get real event info from blockchain
          const eventInfo = await getEventInfo();
          if (eventInfo) {
            // Get real tier data
            let realTierStats = mockEvent.tierStats; // fallback
            let realTicketsSold = 0;
            let realTotalTickets = 0;
            let realRevenue = 0;

            try {
              const tiers = await getTicketTiers();
              if (DEVELOPMENT_CONFIG.LOG_CONTRACT_CALLS) {
                console.log('🔍 EventManagement: Raw tier data from contract:', tiers);
              }

              if (tiers && tiers.length > 0) {
                // Convert blockchain tiers to UI format with detailed logging
                realTierStats = tiers.map((tier, index) => {
                  const converted = {
                    tierName: tier.name,
                    sold: Number(tier.sold),
                    total: Number(tier.available) + Number(tier.sold),
                    price: Number(tier.price) / 1e18 // Convert from wei to IDRX
                  };
                  
                  if (DEVELOPMENT_CONFIG.LOG_CONTRACT_CALLS) {
                    console.log(`🔍 Tier ${index} conversion:`, {
                      raw: tier,
                      converted,
                      checks: {
                        nameValid: typeof tier.name === 'string' && tier.name.length > 0,
                        soldIsNumber: !isNaN(Number(tier.sold)),
                        availableIsNumber: !isNaN(Number(tier.available)),
                        priceIsNumber: !isNaN(Number(tier.price))
                      }
                    });
                  }
                  
                  return converted;
                });

                realTicketsSold = realTierStats.reduce((sum, tier) => sum + tier.sold, 0);
                realTotalTickets = realTierStats.reduce((sum, tier) => sum + tier.total, 0);
                realRevenue = realTierStats.reduce((sum, tier) => sum + (tier.sold * tier.price), 0);

                if (DEVELOPMENT_CONFIG.LOG_CONTRACT_CALLS) {
                  console.log('✅ Event Management: Processed tier data:', {
                    tierStats: realTierStats,
                    calculations: {
                      totalTickets: realTotalTickets,
                      ticketsSold: realTicketsSold,
                      revenue: realRevenue
                    },
                    validationChecks: {
                      totalTicketsIsNumber: !isNaN(realTotalTickets),
                      ticketsSoldIsNumber: !isNaN(realTicketsSold),
                      revenueIsNumber: !isNaN(realRevenue)
                    }
                  });
                }
              } else {
                if (DEVELOPMENT_CONFIG.LOG_CONTRACT_CALLS) {
                  console.log('⚠️ No tiers returned from contract');
                }
              }
            } catch (tierError) {
              if (DEVELOPMENT_CONFIG.LOG_CONTRACT_CALLS) {
                console.log("❌ Could not load tiers, using mock:", tierError);
              }
            }

            // Convert blockchain data to EventStatsData format
            const blockchainEvent: EventStatsData = {
              eventId: id || "1",
              eventName: eventInfo.name || "Unknown Event",
              ticketsSold: realTicketsSold,
              totalTickets: realTotalTickets,
              revenue: realRevenue,
              currency: "IDRX",
              tierStats: realTierStats,
              daysUntilEvent: Math.ceil((Number(eventInfo.date) * 1000 - Date.now()) / (1000 * 60 * 60 * 24))
            };
            setEvent(blockchainEvent);

            // Create real sales data based on blockchain data
            const realSalesData: SalesData = {
              totalRevenue: realRevenue,
              soldTickets: realTicketsSold,
              availableTickets: realTotalTickets - realTicketsSold,
              totalTransactions: realTicketsSold > 0 ? Math.floor(realTicketsSold * 0.8) : 0, // Estimate
              averageTicketPrice: realTicketsSold > 0 ? realRevenue / realTicketsSold : 0,
              revenueByTier: realTierStats.reduce((acc, tier) => {
                acc[tier.tierName] = tier.sold * tier.price;
                return acc;
              }, {} as { [tierName: string]: number }),
              salesByDay: mockSalesData.salesByDay, // Keep mock for now (would need transaction history)
              currency: "IDRX",
              percentChange: mockSalesData.percentChange // Keep mock for now
            };
            setSalesData(realSalesData);

            if (DEVELOPMENT_CONFIG.LOG_CONTRACT_CALLS) {
              console.log("✅ Event Management: Loaded blockchain event", blockchainEvent.eventName);
            }
          } else {
            // Fallback to mock data
            setEvent(mockEvent);
            setSalesData(mockSalesData);
            if (DEVELOPMENT_CONFIG.LOG_CONTRACT_CALLS) {
              console.log("⚠️ No blockchain event found, using mock data");
            }
          }
        } else {
          // Use mock data when blockchain disabled
          setEvent(mockEvent);
          setSalesData(mockSalesData);
          if (DEVELOPMENT_CONFIG.LOG_CONTRACT_CALLS) {
            console.log("🔧 Blockchain disabled, using mock data");
          }
        }
      } catch (error) {
        console.error("Error fetching blockchain event data:", error);
        // Fallback to mock data
        setEvent(mockEvent);
        setSalesData(mockSalesData);
      }
      
      setAttendees(mockAttendees);
      
      // Load actual resale rules from blockchain
      try {
        const resaleRules = await getResaleRules();
        if (resaleRules) {
          console.log("📋 Loading resale rules from blockchain (already converted):", resaleRules);
          const frontendSettings: ResellSettingsData = {
            allowResell: resaleRules.allowResell,
            maxMarkupPercentage: resaleRules.maxMarkupPercentage, // Already converted in useSmartContract: 50%
            organizerFeePercentage: resaleRules.organizerFeePercentage, // Already converted in useSmartContract: 10%
            restrictResellTiming: resaleRules.restrictResellTiming,
            minDaysBeforeEvent: resaleRules.minDaysBeforeEvent,
          };
          console.log("📋 Frontend settings (no additional conversion):", frontendSettings);
          setResellSettings(frontendSettings);
        } else {
          setResellSettings(mockResellSettings);
        }
      } catch (error) {
        console.error("Failed to load resale rules from blockchain:", error);
        setResellSettings(mockResellSettings);
      }
      
      // Staff data now comes from useStaffEventListener hook automatically
      setLoading(false);
    };

    fetchData();
    
    // Load enhanced attendee data
    loadEnhancedAttendeeData();
  }, [id, getEventInfo, getTicketTiers]);

  // Load enhanced attendee data with analytics
  const loadEnhancedAttendeeData = async () => {
    if (!id) return;
    
    setAttendeeLoading(true);
    try {
      // Load enhanced attendee data (real blockchain integration)
      const attendeeData = await AttendeeService.getAllEventAttendees(getAllEventAttendees);
      const analytics = await AttendeeService.getEventAnalytics(attendeeData);
      
      setEnhancedAttendees(attendeeData);
      setEventAnalytics(analytics);
      
      if (DEVELOPMENT_CONFIG.LOG_CONTRACT_CALLS) {
        console.log("✅ Enhanced attendee data loaded:", {
          totalAttendees: attendeeData.length,
          analytics,
          sampleAttendee: attendeeData[0],
        });
      }
    } catch (error) {
      console.error("Error loading enhanced attendee data:", error);
      toast({
        title: "Failed to load attendee data",
        description: "Using fallback data. Please try refreshing.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setAttendeeLoading(false);
    }
  };

  // Handle check-in
  const handleCheckIn = (attendeeId: string) => {
    setAttendees(
      attendees.map((att) =>
        att.id === attendeeId ? { ...att, status: "checked-in" } : att
      )
    );

    toast({
      title: "Attendee checked in",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  // Handle export
  const handleExport = () => {
    toast({
      title: "Exporting attendees",
      description: "Attendee list is being exported to CSV",
      status: "info",
      duration: 3000,
      isClosable: true,
    });
  };

  // Enhanced attendee management handlers
  const handleEnhancedCheckIn = async (tokenId: string) => {
    try {
      // Mock staff data - in real app, get from current user context
      const currentStaffAddress = "0x1234567890abcdef1234567890abcdef12345678";
      const currentStaffRole = "SCANNER";
      
      const success = await AttendeeService.checkInAttendee(tokenId, currentStaffAddress, currentStaffRole);
      
      if (success) {
        // Update local state
        setEnhancedAttendees(prevAttendees => 
          prevAttendees.map(attendee => 
            attendee.tokenId === tokenId
              ? {
                  ...attendee,
                  used: true,
                  displayStatus: "Checked In" as const,
                  checkInData: {
                    timestamp: new Date(),
                    staffAddress: currentStaffAddress,
                    staffRole: currentStaffRole as any,
                    // staffName removed - contract only provides wallet address
                  },
                }
              : attendee
          )
        );
        
        // Refresh analytics
        const newAnalytics = await AttendeeService.getEventAnalytics();
        setEventAnalytics(newAnalytics);
        
        // Trigger real-time refresh of attendee data from blockchain
        console.log("🔄 Triggering attendee data refresh after check-in...");
        await loadEnhancedAttendeeData();
        
        toast({
          title: "Attendee checked in",
          description: `Token ${tokenId} has been successfully checked in`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error("Check-in failed:", error);
      toast({
        title: "Check-in failed",
        description: (error as Error).message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleSendEmailToAttendee = async (attendee: AttendeeData) => {
    try {
      const message = `Hello! This is a message from ${event?.eventName} organizer.`;
      await AttendeeService.sendEmailToAttendee(attendee, message);
      
      toast({
        title: "Email sent",
        description: `Email sent successfully to ${attendee.email}`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Failed to send email:", error);
      toast({
        title: "Failed to send email",
        description: (error as Error).message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleExportEnhanced = async () => {
    try {
      const csvData = await AttendeeService.exportAttendeeData(enhancedAttendees);
      
      // Create and download CSV file
      const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${event?.eventName}_attendees_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export successful",
        description: "Enhanced attendee data has been exported to CSV",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Export failed:", error);
      toast({
        title: "Export failed",
        description: "Failed to export attendee data",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Bulk operation handlers for table component
  const handleBulkCheckIn = async (tokenIds: string[]) => {
    try {
      // Process bulk check-in
      const successCount = await Promise.allSettled(
        tokenIds.map(tokenId => AttendeeService.checkInAttendee(tokenId, "0x1234567890abcdef1234567890abcdef12345678", "SCANNER"))
      );
      
      const successful = successCount.filter(result => result.status === 'fulfilled').length;
      
      // Update local state for successful check-ins
      setEnhancedAttendees(prevAttendees => 
        prevAttendees.map(attendee => 
          tokenIds.includes(attendee.tokenId)
            ? {
                ...attendee,
                used: true,
                displayStatus: "Checked In" as const,
                checkInData: {
                  timestamp: new Date(),
                  staffAddress: "0x1234567890abcdef1234567890abcdef12345678",
                  staffRole: "SCANNER" as any,
                  // staffName removed - contract only provides wallet address
                },
              }
            : attendee
        )
      );
      
      // Refresh analytics
      const newAnalytics = await AttendeeService.getEventAnalytics();
      setEventAnalytics(newAnalytics);
      
      toast({
        title: `Bulk check-in completed`,
        description: `${successful} out of ${tokenIds.length} attendees checked in successfully`,
        status: successful === tokenIds.length ? "success" : "warning",
        duration: 4000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Bulk check-in failed:", error);
      toast({
        title: "Bulk check-in failed",
        description: (error as Error).message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleBulkEmail = async (attendees: AttendeeData[]) => {
    try {
      const message = `Hello! This is a bulk message from ${event?.eventName} organizer. We hope you're excited for the upcoming event!`;
      
      const emailResults = await Promise.allSettled(
        attendees.map(attendee => AttendeeService.sendEmailToAttendee(attendee, message))
      );
      
      const successful = emailResults.filter(result => result.status === 'fulfilled').length;
      
      toast({
        title: `Bulk emails sent`,
        description: `${successful} out of ${attendees.length} emails sent successfully`,
        status: successful === attendees.length ? "success" : "warning",
        duration: 4000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Bulk email failed:", error);
      toast({
        title: "Bulk email failed",
        description: (error as Error).message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Handle resell settings update
  const handleResellSettingsUpdate = async (settings: ResellSettingsData) => {
    try {
      // Call contract function with 4 separate parameters
      const result = await setResaleRules(
        settings.maxMarkupPercentage,        // Already in percentage (e.g., 50)
        settings.organizerFeePercentage,     // Already in percentage (e.g., 10)
        settings.restrictResellTiming,
        settings.minDaysBeforeEvent
      );
      
      if (result) {
        // Update local state only after successful blockchain update
        setResellSettings(settings);

        toast({
          title: "Settings updated",
          description: "Resale settings have been successfully updated on blockchain",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error("Failed to update resale settings:", error);
      toast({
        title: "Update failed",
        description: `Failed to update resale settings: ${(error as Error).message}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Staff management handlers with role hierarchy
  const handleAddStaff = async () => {
    if (!newStaffAddress.trim()) {
      toast({
        title: "Invalid address",
        description: "Please enter a valid wallet address",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (eventBasedStaffList.some(staff => staff.address.toLowerCase() === newStaffAddress.toLowerCase())) {
      toast({
        title: "Staff already exists",
        description: "This address is already in the staff list",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      // Call the contract function (event system will update UI automatically)
      const result = await addStaff(newStaffAddress);
      if (!result) {
        throw new Error("Failed to add staff to blockchain");
      }
      
      // Reset form - staff list will be updated via events
      setNewStaffAddress("");
      setNewStaffRole(StaffRole.SCANNER);

      toast({
        title: "Staff added",
        description: "Staff member added with scanner access successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      if (DEVELOPMENT_CONFIG.LOG_CONTRACT_CALLS) {
        console.error("❌ Enhanced Staff Debug - Add Staff Failed:", {
          error: error,
          errorMessage: (error as Error).message,
          errorStack: (error as Error).stack,
          attemptedAddress: newStaffAddress,
          attemptedRole: newStaffRole,
          roleInfo: getRoleInfo(newStaffRole),
          isInsufficientPrivileges: (error as Error).message.includes("InsufficientStaffPrivileges"),
          blockchainEnabled: DEVELOPMENT_CONFIG.ENABLE_BLOCKCHAIN,
          timestamp: new Date().toISOString(),
          possibleCauses: [
            "Contract caller doesn't have MANAGER role",
            "Contract event address mismatch", 
            "Role enum value incorrect",
            "Insufficient gas or transaction failed"
          ]
        });
      }
      console.error("Error adding staff:", error);
      toast({
        title: "Failed to add staff",
        description: `Error: ${(error as Error).message}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleRemoveStaff = async (staffAddress: string) => {
    try {
      // Call the contract function (event system will update UI automatically)
      const result = await removeStaff(staffAddress);
      if (!result) {
        throw new Error("Failed to remove staff from blockchain");
      }

      toast({
        title: "Staff removed",
        description: "Staff member has been removed successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      if (DEVELOPMENT_CONFIG.LOG_CONTRACT_CALLS) {
        console.error("❌ Enhanced Staff Debug - Remove Staff Failed:", {
          error: error,
          errorMessage: (error as Error).message,
          errorStack: (error as Error).stack,
          attemptedAddress: staffAddress,
          isInsufficientPrivileges: (error as Error).message.includes("InsufficientStaffPrivileges"),
          blockchainEnabled: DEVELOPMENT_CONFIG.ENABLE_BLOCKCHAIN,
          timestamp: new Date().toISOString(),
          possibleCauses: [
            "Contract caller doesn't have MANAGER role",
            "Contract event address mismatch",
            "Staff address doesn't exist or has no role",
            "Insufficient gas or transaction failed"
          ]
        });
      }
      console.error("Error removing staff:", error);
      toast({
        title: "Failed to remove staff",
        description: `Error: ${(error as Error).message}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Helper function to get role display name and color (simplified)
  const getRoleInfo = (role: StaffRole) => {
    switch (role) {
      case StaffRole.SCANNER:
        return { name: 'Staff', color: 'blue', description: 'Can scan QR codes and validate tickets' };
      default:
        return { name: 'None', color: 'gray', description: 'No permissions' };
    }
  };

  // Handle event cancellation
  const handleCancelEvent = () => {
    onClose();

    toast({
      title: "Event cancelled",
      description: "The event has been cancelled successfully",
      status: "success",
      duration: 3000,
      isClosable: true,
    });

    navigate("/organizer/events");
  };

  // Handlers for editing and adding tiers (contract supports updateTicketTier)
  const handleEditTier = (tier: any, index: number) => {
    setEditingTier({
      id: tier.id || `tier-${index}`,
      tierId: index, // Use index as tier ID for contract call
      name: tier.tierName,
      price: tier.price,
      currency: tier.currency || "IDRX",
      description: tier.description || "Ticket description", // Mock value
      available: tier.total,
      maxPerPurchase: tier.maxPerPurchase || 4, // Mock value
      benefits: tier.benefits || [], // Mock value
    });
    setIsNewTier(false);
    openTierModal();
  };

  const handleDeleteTier = () => {
    // TODO: Implement contract clearAllTiers() or individual tier removal
    toast({
      title: "Delete Tier",
      description: "This feature requires contract integration for tier removal",
      status: "info",
      duration: 5000,
      isClosable: true,
    });
  };

  const handleAddNewTier = () => {
    setEditingTier({
      id: `tier-${Date.now()}`,
      tierId: -1, // New tier, no ID yet
      name: "",
      price: 0,
      currency: "IDRX",
      description: "",
      available: 100,
      maxPerPurchase: 4,
      benefits: [],
    });
    setIsNewTier(true);
    openTierModal();
  };

  // Handler for form changes
  const handleTierInputChange = (field: keyof EditableTier, value: any) => {
    if (editingTier) {
      setEditingTier({
        ...editingTier,
        [field]: value,
      });
    }
  };

  // Validate tier form before saving
  const validateTierForm = (tier: EditableTier): string[] => {
    const errors: string[] = [];

    if (!tier.name.trim()) {
      errors.push("Tier name is required");
    }

    if (tier.price <= 0) {
      errors.push("Price must be greater than 0");
    }

    if (tier.available <= 0) {
      errors.push("Available quantity must be greater than 0");
    }

    if (tier.maxPerPurchase <= 0) {
      errors.push("Max per purchase must be at least 1");
    }

    if (tier.maxPerPurchase > tier.available) {
      errors.push("Max per purchase cannot exceed available quantity");
    }

    return errors;
  };

  // Handler to save changes - uses contract addTicketTier()
  const handleSaveTier = async () => {
    if (!editingTier || !event || tierSaving) return;

    // Validate form before proceeding
    const validationErrors = validateTierForm(editingTier);
    if (validationErrors.length > 0) {
      toast({
        title: "Validation Error",
        description: validationErrors.join(", "),
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setTierSaving(true);
    try {
      if (DEVELOPMENT_CONFIG.ENABLE_BLOCKCHAIN) {
        if (isNewTier) {
          // Real blockchain integration for new tier
          console.log("🎫 Adding new tier via blockchain:", editingTier);
          
          const result = await addTicketTier(
            editingTier.name,
            editingTier.price,
            editingTier.available,
            editingTier.maxPerPurchase
          );
          
          if (result) {
            toast({
              title: "Tier Added Successfully",
              description: `"${editingTier.name}" has been added to the blockchain. Transaction: ${result.slice(0, 10)}...`,
              status: "success",
              duration: 5000,
              isClosable: true,
            });
            
            // Close modal and clear editing state
            closeTierModal();
            setEditingTier(null);
            setIsNewTier(false);
            
            // Refresh event data to show new tier (better than full page reload)
            setTimeout(() => {
              window.location.reload();
            }, 1000);
            
          } else {
            throw new Error("Failed to add tier to blockchain");
          }
        } else {
          // Update existing tier (not yet implemented in contract)
          toast({
            title: "Update Tier", 
            description: "Tier update functionality coming in Phase 2",
            status: "info",
            duration: 5000,
            isClosable: true,
          });
        }
      } else {
        // Mock implementation for development
        let updatedTierStats = [...event.tierStats];

        if (isNewTier) {
          // Add new tier
          updatedTierStats.push({
            tierName: editingTier.name,
            sold: 0,
            total: editingTier.available,
            price: editingTier.price,
          });

          toast({
            title: "Ticket tier added",
            description: `${editingTier.name} has been added successfully.`,
            status: "success",
            duration: 3000,
            isClosable: true,
          });
        } else {
          // Update existing tier
          updatedTierStats = updatedTierStats.map((tier, index) =>
            index === editingTier.tierId
              ? {
                  ...tier,
                  tierName: editingTier.name,
                  price: editingTier.price,
                  total: editingTier.available,
                }
              : tier
          );

          toast({
            title: "Ticket tier updated",
            description: `${editingTier.name} has been updated successfully.`,
            status: "success",
            duration: 3000,
            isClosable: true,
          });
        }

        // Update event data
        setEvent({
          ...event,
          tierStats: updatedTierStats,
          // Update total tickets and revenue
          totalTickets: updatedTierStats.reduce(
            (total, tier) => total + tier.total,
            0
          ),
          ticketsSold: updatedTierStats.reduce(
            (total, tier) => total + tier.sold,
            0
          ),
          revenue: updatedTierStats.reduce(
            (total, tier) => total + tier.sold * tier.price,
            0
          ),
        });
      }

      closeTierModal();
    } catch (error) {
      console.error("Error saving tier:", error);
      toast({
        title: "Failed to save tier",
        description: `Error: ${(error as Error).message}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setTierSaving(false);
    }
  };

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <HStack mb={6}>
          <IconButton
            aria-label="Go back"
            icon={<ArrowBackIcon />}
            variant="ghost"
            onClick={() => navigate("/organizer/events")}
          />
          <Skeleton height="40px" width="300px" />
        </HStack>

        <Skeleton height="200px" my={6} />
        <Skeleton height="400px" />
      </Container>
    );
  }

  if (!event || !salesData || !resellSettings) {
    return (
      <Container maxW="container.xl" py={8}>
        <Text>Event not found</Text>
        <Button mt={4} onClick={() => navigate("/organizer/events")}>
          Back to Events
        </Button>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <HStack mb={2}>
        <IconButton
          aria-label="Go back"
          icon={<ArrowBackIcon />}
          variant="ghost"
          onClick={() => navigate("/organizer/events")}
        />
        <Heading size="lg">Manage Event</Heading>
      </HStack>

      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="xl">{event.eventName}</Heading>
          <HStack>
            <Badge
              colorScheme={
                event.daysUntilEvent > 30
                  ? "green"
                  : event.daysUntilEvent > 7
                  ? "orange"
                  : "red"
              }
            >
              {event.daysUntilEvent} days to go
            </Badge>
            <Text color="gray.600">
              Tickets: {event.ticketsSold} / {event.totalTickets} sold
            </Text>
          </HStack>
        </Box>

        <HStack>
          {/* Edit Event button removed - core event info cannot be updated after creation */}
          <Button
            leftIcon={<DeleteIcon />}
            colorScheme="red"
            variant="outline"
            onClick={onOpen}
          >
            Cancel Event
          </Button>
        </HStack>
      </Flex>

      <Tabs colorScheme="purple" variant="enclosed">
        <TabList>
          <Tab>
            <Icon as={FaChartBar} mr={2} /> Analytics
          </Tab>
          <Tab>
            <Icon as={FaTicketAlt} mr={2} /> Tickets
          </Tab>
          <Tab>
            <Icon as={FaUsers} mr={2} /> Attendees
          </Tab>
          <Tab>
            <Icon as={FaUserCheck} mr={2} /> Staff
          </Tab>
          <Tab>
            <Icon as={FaCog} mr={2} /> Settings
          </Tab>
        </TabList>

        <TabPanels>
          {/* Analytics Tab */}
          <TabPanel px={0} py={6}>
            <VStack spacing={6} align="stretch">
              <SalesStatistics
                salesData={salesData}
                eventName={event.eventName}
              />

              <Divider />
              <MotionBox
                border="2px solid"
                borderColor={"gray.200"}
                p={4}
                rounded="xl"
              >
                <Box>
                  <Heading size="md" mb={4}>
                    Ticket Sales Performance
                  </Heading>
                  <EventStats stats={event} />
                </Box>
              </MotionBox>
            </VStack>
          </TabPanel>

          {/* Tickets Tab */}
          <TabPanel px={0} py={6}>
            <VStack spacing={6} align="stretch">
              <Flex justify="space-between" align="center">
                <Heading size="md">Ticket Tiers</Heading>
                <Button
                  leftIcon={<AddIcon />}
                  colorScheme="purple"
                  onClick={handleAddNewTier}
                >
                  Add New Tier
                </Button>
              </Flex>

              {event.tierStats.map((tier, index) => (
                <Box
                  key={index}
                  p={4}
                  borderWidth="2px"
                  borderRadius="md"
                  shadow="sm"
                  transition="all 0.3s"
                  _hover={{ boxShadow: "md" }}
                >
                  <Flex justify="space-between" align="start" w="full">
                    <VStack align="start" spacing={3} flex="1">
                      {/* Tier Name */}
                      <Text fontWeight="bold" fontSize="lg">
                        {tier.tierName}
                      </Text>
                      
                      {/* Sold Stats - Compact Format */}
                      <HStack spacing={4} align="center">
                        <Text fontSize="md" fontWeight="medium">
                          {tier.sold} / {tier.total}
                        </Text>
                        <Badge colorScheme="blue" variant="subtle">
                          {((tier.sold / tier.total) * 100).toFixed(0)}%
                        </Badge>
                      </HStack>
                      
                      {/* Price per ticket */}
                      <Text fontSize="md" color="purple.600" fontWeight="medium">
                        {event.currency} {tier.price} per ticket
                      </Text>

                      {/* Progress bar */}
                      <Progress
                        value={(tier.sold / tier.total) * 100}
                        size="sm"
                        colorScheme={
                          (tier.sold / tier.total) * 100 >= 75
                            ? "green"
                            : "blue"
                        }
                        borderRadius="full"
                        w="full"
                      />
                    </VStack>

                    {/* Tier Actions - Contract supports updateTicketTier() */}
                    <VStack spacing={2} ml={4}>
                      <Button
                        size="sm"
                        leftIcon={<EditIcon />}
                        colorScheme="purple"
                        variant="outline"
                        onClick={() => handleEditTier(tier, index)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        leftIcon={<DeleteIcon />}
                        colorScheme="red"
                        variant="outline"
                        onClick={() => handleDeleteTier()}
                      >
                        Delete
                      </Button>
                    </VStack>
                  </Flex>
                </Box>
              ))}

              {event.tierStats.length === 0 && (
                <Box
                  p={8}
                  borderWidth="1px"
                  borderRadius="md"
                  borderStyle="dashed"
                  textAlign="center"
                >
                  <Text color="gray.500">No ticket tiers added yet.</Text>
                  <Button
                    mt={4}
                    colorScheme="purple"
                    onClick={handleAddNewTier}
                  >
                    Add Your First Tier
                  </Button>
                </Box>
              )}
            </VStack>
          </TabPanel>

          {/* Attendees Tab - Enhanced Version */}
          <TabPanel px={0} py={6}>
            <VStack spacing={6} align="stretch">
              <Flex justify="space-between" align="center">
                <Heading size="md">Attendee Management</Heading>
                <HStack>
                  <Button
                    colorScheme="purple"
                    onClick={() => navigate(`/organizer/events/${id}/check-in`)}
                  >
                    QR Scanner Dashboard
                  </Button>
                </HStack>
              </Flex>
              
              {attendeeLoading ? (
                <VStack spacing={4} py={8}>
                  <Text color="gray.500">Loading enhanced attendee data...</Text>
                  <Progress size="lg" isIndeterminate w="50%" />
                </VStack>
              ) : (
                <EnhancedAttendeeListTable
                  attendees={enhancedAttendees}
                  analytics={eventAnalytics}
                  onCheckIn={handleEnhancedCheckIn}
                  onSendEmail={handleSendEmailToAttendee}
                  onExport={handleExportEnhanced}
                  onRefreshData={loadEnhancedAttendeeData}
                  onBulkCheckIn={handleBulkCheckIn}
                  onBulkEmail={handleBulkEmail}
                />
              )}
              
              {/* Fallback to old attendee list if needed */}
              {enhancedAttendees.length === 0 && !attendeeLoading && (
                <Box>
                  <Text color="gray.500" mb={4} fontSize="sm">
                    Fallback to basic attendee list (enhanced data not available)
                  </Text>
                  <AttendeeList
                    attendees={attendees}
                    onCheckIn={handleCheckIn}
                    onExport={handleExport}
                  />
                </Box>
              )}
            </VStack>
          </TabPanel>

          {/* Staff Tab */}
          <TabPanel px={0} py={6}>
            <VStack spacing={6} align="stretch">
              <Flex justify="space-between" align="center">
                <Heading size="md">Staff Management</Heading>
              </Flex>
              
              <Text color="gray.600">
                Manage staff members who can scan QR codes and validate tickets at your event. All staff get the same scanning permissions.
              </Text>

              {/* Staff Access Info */}
              <Box
                p={4}
                borderWidth="2px"
                borderRadius="md"
                borderColor="blue.200"
                bg="blue.50"
                shadow="sm"
              >
                <Text fontWeight="medium" mb={2} color="blue.800">Staff Access & Permissions:</Text>
                <VStack align="start" spacing={1} fontSize="sm" color="blue.700">
                  <Text>• <strong>Ticket Scanning:</strong> Can scan QR codes to validate tickets</Text>
                  <Text>• <strong>Status Updates:</strong> Can mark tickets as used after validation</Text>
                  <Text>• <strong>Event Access:</strong> Can access the staff scanner interface</Text>
                </VStack>
              </Box>

              {/* Add Staff */}
              <Box
                p={4}
                borderWidth="2px"
                borderRadius="md"
                borderColor="gray.200"
                bg="white"
                shadow="sm"
              >
                <Heading size="sm" mb={4}>Add New Staff Member</Heading>
                <VStack spacing={4} mb={6}>
                  <FormControl>
                    <FormLabel>Wallet Address</FormLabel>
                    <Input
                      placeholder="Enter staff wallet address (0x...)"
                      value={newStaffAddress}
                      onChange={(e) => setNewStaffAddress(e.target.value)}
                    />
                  </FormControl>
                  
                  <Box
                    p={3}
                    borderWidth="1px"
                    borderRadius="md"
                    borderColor="blue.200"
                    bg="blue.50"
                  >
                    <Text fontSize="sm" color="blue.800" fontWeight="medium">
                      Access Level: <Badge colorScheme="blue" ml={2}>Scanner Access</Badge>
                    </Text>
                    <Text fontSize="sm" color="blue.600" mt={1}>
                      Staff members can scan QR codes and validate tickets at your event.
                    </Text>
                  </Box>
                  
                  <Button
                    colorScheme="green"
                    onClick={handleAddStaff}
                    w="full"
                  >
                    Add Staff Member
                  </Button>
                </VStack>
              </Box>

              {/* Staff List */}
              <Box
                p={4}
                borderWidth="2px"
                borderRadius="md"
                borderColor="gray.200"
                bg="white"
                shadow="sm"
              >
                <VStack align="stretch" spacing={3}>
                  <HStack justify="space-between">
                    <Text fontWeight="medium">
                      Current Staff ({eventBasedStaffList.length})
                    </Text>
                    <HStack spacing={2}>
                      {staffEventsListening && (
                        <Badge colorScheme="green" size="sm">
                          🟢 Live Updates
                        </Badge>
                      )}
                      {staffEventsError && (
                        <Badge colorScheme="red" size="sm">
                          ❌ Error Loading
                        </Badge>
                      )}
                      <Button
                        size="xs"
                        variant="ghost"
                        colorScheme="blue"
                        onClick={refreshStaffEvents}
                        isDisabled={staffEventsLoading}
                      >
                        🔄 Refresh
                      </Button>
                    </HStack>
                  </HStack>
                  {staffEventsLoading ? (
                    <Text color="gray.500" textAlign="center" py={4}>
                      Loading staff events...
                    </Text>
                  ) : eventBasedStaffList.length > 0 ? (
                    eventBasedStaffList.map((staff, index) => {
                      const roleInfo = getRoleInfo(staff.role);
                      return (
                        <Flex
                          key={index}
                          justify="space-between"
                          align="center"
                          p={4}
                          borderWidth="1px"
                          borderRadius="md"
                          bg="gray.50"
                        >
                          <VStack align="start" spacing={1}>
                            <Text fontFamily="mono" fontSize="sm">
                              {staff.address}
                            </Text>
                            <HStack spacing={2}>
                              <Badge colorScheme={roleInfo.color} size="sm">
                                {roleInfo.name}
                              </Badge>
                              <Text fontSize="xs" color="gray.500">
                                Added {staff.assignedDate instanceof Date 
                                  ? staff.assignedDate.toLocaleDateString() 
                                  : new Date(staff.assignedDate).toLocaleDateString()}
                              </Text>
                            </HStack>
                            <Text fontSize="xs" color="gray.600">
                              {roleInfo.description}
                            </Text>
                          </VStack>
                          <VStack spacing={2}>
                            <HStack spacing={1} fontSize="xs">
                              {staff.canScanTickets && <Badge size="xs" colorScheme="blue">Scanner</Badge>}
                            </HStack>
                            <Button
                              size="sm"
                              colorScheme="red"
                              variant="outline"
                              onClick={() => handleRemoveStaff(staff.address)}
                            >
                              Remove
                            </Button>
                          </VStack>
                        </Flex>
                      );
                    })
                  ) : (
                    <Box
                      p={8}
                      borderWidth="1px"
                      borderRadius="md"
                      borderStyle="dashed"
                      textAlign="center"
                      bg="gray.25"
                    >
                      <Text color="gray.500">
                        No staff members added yet. Add staff with appropriate roles to enable event management.
                      </Text>
                    </Box>
                  )}
                </VStack>
              </Box>
            </VStack>
          </TabPanel>

          {/* Settings Tab */}
          <TabPanel px={0} py={6}>
            <VStack spacing={6} align="stretch">
              <Flex justify="space-between" align="center">
                <Heading size="md">Event Settings</Heading>
              </Flex>
              
              <ResellSettings
                settings={resellSettings}
                onSave={handleResellSettingsUpdate}
              />
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Cancel Event Confirmation Dialog */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Cancel Event
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure? This will cancel the event and notify all ticket
              holders. This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                No, Keep Event
              </Button>
              <Button colorScheme="red" onClick={handleCancelEvent} ml={3}>
                Yes, Cancel Event
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Ticket Tier Edit/Add Modal - Contract supports updateTicketTier() */}
      <Modal isOpen={isTierModalOpen} onClose={closeTierModal} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {isNewTier ? "Add New Ticket Tier" : "Edit Ticket Tier"}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {editingTier && (
              <Stack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Tier Name</FormLabel>
                  <Input
                    value={editingTier.name}
                    onChange={(e) =>
                      handleTierInputChange("name", e.target.value)
                    }
                    placeholder="e.g. VIP, General Admission, Early Bird"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Price</FormLabel>
                  <InputGroup>
                    <InputLeftAddon>{editingTier.currency}</InputLeftAddon>
                    <NumberInput
                      value={editingTier.price}
                      onChange={(_, value) =>
                        handleTierInputChange("price", value)
                      }
                      min={0}
                      w="full"
                    >
                      <NumberInputField borderLeftRadius={0} />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </InputGroup>
                </FormControl>

                <FormControl>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    value={editingTier.description}
                    onChange={(e) =>
                      handleTierInputChange("description", e.target.value)
                    }
                    placeholder="Describe what this ticket tier offers"
                    rows={3}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Available Quantity</FormLabel>
                  <NumberInput
                    value={editingTier.available}
                    onChange={(_, value) =>
                      handleTierInputChange("available", value)
                    }
                    min={0}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>Maximum Per Purchase</FormLabel>
                  <NumberInput
                    value={editingTier.maxPerPurchase}
                    onChange={(_, value) =>
                      handleTierInputChange("maxPerPurchase", value)
                    }
                    min={1}
                    max={10}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    Maximum number of tickets that can be purchased in a single transaction
                  </Text>
                </FormControl>

                <FormControl>
                  <FormLabel>Benefits (Optional)</FormLabel>
                  <VStack align="start" spacing={2}>
                    {editingTier.benefits?.map((benefit, index) => (
                      <HStack key={index} width="full">
                        <Input
                          value={benefit}
                          onChange={(e) => {
                            const newBenefits = [
                              ...(editingTier.benefits || []),
                            ];
                            newBenefits[index] = e.target.value;
                            handleTierInputChange("benefits", newBenefits);
                          }}
                          placeholder={`Benefit ${index + 1}`}
                        />
                        <IconButton
                          aria-label="Remove benefit"
                          icon={<DeleteIcon />}
                          size="sm"
                          colorScheme="red"
                          variant="ghost"
                          onClick={() => {
                            const newBenefits = [
                              ...(editingTier.benefits || []),
                            ];
                            newBenefits.splice(index, 1);
                            handleTierInputChange("benefits", newBenefits);
                          }}
                        />
                      </HStack>
                    ))}
                    <Button
                      leftIcon={<AddIcon />}
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const newBenefits = [
                          ...(editingTier.benefits || []),
                          "",
                        ];
                        handleTierInputChange("benefits", newBenefits);
                      }}
                    >
                      Add Benefit
                    </Button>
                  </VStack>
                </FormControl>
              </Stack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={closeTierModal}>
              Cancel
            </Button>
            <Button 
              colorScheme="purple" 
              onClick={handleSaveTier}
              isLoading={tierSaving}
              loadingText={isNewTier ? "Adding..." : "Saving..."}
            >
              {isNewTier ? "Add Tier" : "Save Changes"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default EventManagement;
