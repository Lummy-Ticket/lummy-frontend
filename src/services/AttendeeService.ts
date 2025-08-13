import { AttendeeData, CheckInData } from "../components/organizer/AttendeeList";
import { EventAnalytics } from "../components/organizer/EnhancedAttendeeList";
import { DEVELOPMENT_CONFIG } from "../constants";

// Enhanced AttendeeService - supports both mock and real blockchain data
export class AttendeeService {
  
  /**
   * Get all attendees for an event (Real blockchain integration or Mock)
   * @param blockchainFunction Optional blockchain function for real data
   * @returns Array of attendee data
   */
  static async getAllEventAttendees(blockchainFunction?: () => Promise<AttendeeData[]>): Promise<AttendeeData[]> {
    // Use real blockchain data if available and enabled
    if (DEVELOPMENT_CONFIG.ENABLE_BLOCKCHAIN && blockchainFunction) {
      try {
        console.log("🎯 Using real blockchain attendee data...");
        const realAttendees = await blockchainFunction();
        console.log(`✅ Loaded ${realAttendees.length} real attendees from blockchain`);
        return realAttendees;
      } catch (error) {
        console.error("❌ Blockchain attendee loading failed, falling back to mock:", error);
        // Fall through to mock data
      }
    }
    
    console.log("🎭 Using mock attendee data (blockchain disabled or function not provided)");
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate mock attendees based on existing tier data
    const mockAttendees: AttendeeData[] = [];
    
    // Generate for test tier 1 (295 total, tier ID 0)
    for (let i = 1; i <= 295; i++) {
      const isCheckedIn = Math.random() < 0.3; // 30% check-in rate
      const hasEmail = Math.random() < 0.7; // 70% have email
      const isEmailVerified = hasEmail && Math.random() < 0.8; // 80% of emails verified
      const hasTransferred = Math.random() < 0.1; // 10% have transferred tickets
      
      const purchaseDate = new Date(2025, 2, Math.floor(Math.random() * 20) + 1);
      const checkInData: CheckInData | undefined = isCheckedIn ? {
        timestamp: new Date(purchaseDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000),
        staffAddress: `0x${Math.random().toString(16).substring(2, 42)}`, // Real from TicketStatusUpdated event logs
        staffRole: ["SCANNER", "CHECKIN", "MANAGER"][Math.floor(Math.random() * 3)] as any,
        // staffName removed - contract only provides wallet address
      } : undefined;
      
      mockAttendees.push({
        // Smart Contract Data
        tokenId: `1001000${String(i).padStart(3, '0')}`, // Algorithm 1 format
        walletAddress: `0x${Math.random().toString(16).substring(2, 42)}`,
        tierName: "test tier 1",
        tierId: 0,
        originalPrice: 49,
        purchaseDate,
        serialNumber: i,
        used: isCheckedIn,
        status: isCheckedIn ? "used" : hasTransferred ? "invalid" : "valid",
        transferCount: hasTransferred ? Math.floor(Math.random() * 3) + 1 : 0,
        
        // Database Data (Email System)
        email: hasEmail ? `attendee${i}@example.com` : undefined,
        emailVerified: isEmailVerified,
        notificationPrefs: hasEmail ? {
          ticket_purchase: true,
          event_reminders: Math.random() > 0.3,
          price_alerts: Math.random() > 0.6,
        } : undefined,
        
        // Enhanced Check-in Data
        checkInData,
        
        // Computed Properties
        isCurrentOwner: !hasTransferred,
        canCheckIn: !isCheckedIn && !hasTransferred,
        canReceiveEmails: hasEmail && isEmailVerified,
        displayStatus: isCheckedIn ? "Checked In" : hasTransferred ? "Transferred" : "Valid",
      });
    }
    
    // Generate for test tier 2 (97 total, tier ID 1)
    for (let i = 1; i <= 97; i++) {
      const isCheckedIn = Math.random() < 0.25; // 25% check-in rate (lower for expensive tier)
      const hasEmail = Math.random() < 0.9; // 90% have email (VIP tier more likely)
      const isEmailVerified = hasEmail && Math.random() < 0.95; // 95% of VIP emails verified
      const hasTransferred = Math.random() < 0.05; // 5% have transferred (VIP less likely)
      
      const purchaseDate = new Date(2025, 2, Math.floor(Math.random() * 15) + 5); // Later purchases
      const checkInData: CheckInData | undefined = isCheckedIn ? {
        timestamp: new Date(purchaseDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000),
        staffAddress: `0x${Math.random().toString(16).substring(2, 42)}`, // Real from TicketStatusUpdated event logs
        staffRole: ["SCANNER", "CHECKIN", "MANAGER"][Math.floor(Math.random() * 3)] as any,
        // staffName removed - contract only provides wallet address
      } : undefined;
      
      mockAttendees.push({
        // Smart Contract Data
        tokenId: `1001001${String(i).padStart(3, '0')}`, // Algorithm 1 format
        walletAddress: `0x${Math.random().toString(16).substring(2, 42)}`,
        tierName: "test tier 2",
        tierId: 1,
        originalPrice: 160,
        purchaseDate,
        serialNumber: i,
        used: isCheckedIn,
        status: isCheckedIn ? "used" : hasTransferred ? "invalid" : "valid",
        transferCount: hasTransferred ? Math.floor(Math.random() * 2) + 1 : 0,
        
        // Database Data (Email System)
        email: hasEmail ? `vip${i}@example.com` : undefined,
        emailVerified: isEmailVerified,
        notificationPrefs: hasEmail ? {
          ticket_purchase: true,
          event_reminders: true,
          price_alerts: Math.random() > 0.4,
        } : undefined,
        
        // Enhanced Check-in Data
        checkInData,
        
        // Computed Properties
        isCurrentOwner: !hasTransferred,
        canCheckIn: !isCheckedIn && !hasTransferred,
        canReceiveEmails: hasEmail && isEmailVerified,
        displayStatus: isCheckedIn ? "Checked In" : hasTransferred ? "Transferred" : "Valid",
      });
    }
    
    // Sort by purchase date (latest first)
    return mockAttendees.sort((a, b) => b.purchaseDate.getTime() - a.purchaseDate.getTime());
  }
  
  /**
   * Mock function: Get attendees filtered by tier
   * In real implementation: Contract function getAttendeesByTier(eventId, tierId)
   */
  static async getAttendeesByTier(tierId: number): Promise<AttendeeData[]> {
    const allAttendees = await this.getAllEventAttendees();
    return allAttendees.filter(attendee => attendee.tierId === tierId);
  }
  
  /**
   * Get event analytics (Real blockchain integration or Mock)
   * @param attendees Array of attendee data to calculate analytics from
   * @returns Event analytics
   */
  static async getEventAnalytics(attendees?: AttendeeData[]): Promise<EventAnalytics> {
    // Use provided attendees or fetch them
    let attendeeData = attendees;
    if (!attendeeData) {
      attendeeData = await this.getAllEventAttendees();
    }
    
    const totalTickets = attendeeData.length;
    const checkedIn = attendeeData.filter(a => a.used).length;
    const remaining = totalTickets - checkedIn;
    const checkInRate = totalTickets > 0 ? Math.round((checkedIn / totalTickets) * 100) : 0;
    
    console.log("📊 Analytics Debug:", {
      totalAttendees: totalTickets,
      checkedInFromUsedFlag: checkedIn,
      remaining: remaining,
      checkInRate: `${checkInRate}%`,
      attendeesWithUsedTrue: attendeeData.filter(a => a.used === true).map(a => ({
        tokenId: a.tokenId,
        displayStatus: a.displayStatus,
        used: a.used
      }))
    });
    
    // Calculate tier breakdown
    const tierMap = new Map<string, { total: number; checkedIn: number }>();
    attendeeData.forEach(attendee => {
      const existing = tierMap.get(attendee.tierName) || { total: 0, checkedIn: 0 };
      existing.total++;
      if (attendee.used) existing.checkedIn++;
      tierMap.set(attendee.tierName, existing);
    });
    
    const tierBreakdown = Array.from(tierMap.entries()).map(([tierName, stats]) => ({
      tierName,
      total: stats.total,
      checkedIn: stats.checkedIn,
      rate: stats.total > 0 ? Math.round((stats.checkedIn / stats.total) * 100) : 0,
    }));
    
    return {
      totalTickets,
      checkedIn,
      remaining,
      checkInRate,
      tierBreakdown,
    };
  }
  
  /**
   * Mock function: Enhanced check-in with timestamp and staff tracking
   * In real implementation: Contract function checkInWithTracking(tokenId)
   */
  static async checkInAttendee(tokenId: string, staffAddress: string, staffRole: string): Promise<boolean> {
    // Simulate API delay and potential failure
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 95% success rate
    if (Math.random() < 0.95) {
      console.log(`✅ Enhanced Check-in Success:`, {
        tokenId,
        timestamp: new Date(),
        staffAddress,
        staffRole,
        blockHash: `0x${Math.random().toString(16).substring(2, 66)}`,
      });
      return true;
    } else {
      throw new Error("Check-in failed: Network error or invalid ticket");
    }
  }
  
  /**
   * Mock function: Send email to attendee
   * Uses existing email service integration
   */
  static async sendEmailToAttendee(attendee: AttendeeData, message: string): Promise<boolean> {
    if (!attendee.canReceiveEmails) {
      throw new Error("Attendee cannot receive emails (no verified email)");
    }
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log(`📧 Email sent to ${attendee.email}:`, {
      tokenId: attendee.tokenId,
      tierName: attendee.tierName,
      message,
      timestamp: new Date(),
    });
    
    return true;
  }
  
  /**
   * Mock function: Export attendee data with enhanced fields
   */
  static async exportAttendeeData(attendees: AttendeeData[]): Promise<string> {
    const headers = [
      "Token ID",
      "Wallet Address", 
      "Tier",
      "Price (IDRX)",
      "Purchase Date",
      "Status",
      "Check-in Status", 
      "Email",
      "Email Verified",
      "Check-in Time",
      "Check-in Staff",
      "Transfer Count",
    ].join(",");
    
    const rows = attendees.map(a => [
      a.tokenId,
      a.walletAddress,
      a.tierName,
      a.originalPrice,
      a.purchaseDate.toISOString(),
      a.displayStatus,
      a.used ? "Yes" : "No",
      a.email || "No email",
      a.emailVerified ? "Yes" : "No",
      a.checkInData?.timestamp.toISOString() || "Not checked in",
      a.checkInData?.staffAddress || "N/A",
      a.transferCount,
    ].join(",")).join("\n");
    
    return `${headers}\n${rows}`;
  }
}

// Export for use in components
export default AttendeeService;