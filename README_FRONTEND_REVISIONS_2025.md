# 🎨 LUMMY FRONTEND - MAJOR REVISIONS 2025

## 📋 **FRONTEND REVISION OVERVIEW**

**Date:** January 29, 2025  
**Type:** Architecture Migration - Factory Pattern → Diamond Pattern  
**Impact:** Breaking changes to all contract interactions  
**Priority:** Critical - Required for backend compatibility  

---

## 🚨 **CRITICAL INCOMPATIBILITY DISCOVERED**

### **Current State vs Required State:**

```diff
CURRENT FRONTEND:
- ❌ Uses EventFactory pattern
- ❌ Calls individual Event contracts  
- ❌ Has useAlgorithm1 conditional logic
- ❌ References EVENT_FACTORY_ADDRESS
- ❌ Uses legacy Event ABI

BACKEND REALITY:
- ✅ Uses Diamond pattern (single contract)
- ✅ All functions in Diamond facets
- ✅ Algorithm 1 only (no conditionals)
- ✅ Single DIAMOND_ADDRESS
- ✅ Combined Diamond ABI

RESULT: Complete incompatibility - frontend cannot communicate with backend!
```

---

## 🔧 **REQUIRED FRONTEND CHANGES**

### **1. CONTRACT CONSTANTS REPLACEMENT**

#### **REMOVE These Files:**
```
❌ src/contracts/EventFactory.ts
❌ src/contracts/Event.ts  
```

#### **CREATE New File:**
```typescript
// ✅ src/contracts/Diamond.ts
export const DIAMOND_ADDRESS = "0x[DEPLOYED_DIAMOND_ADDRESS]";

export const DIAMOND_ABI = [
  // EventCore Facet Functions (17 functions)
  {
    name: "initialize",
    type: "function",
    inputs: [
      { name: "_organizer", type: "address" },
      { name: "_name", type: "string" },
      { name: "_description", type: "string" },
      { name: "_date", type: "uint256" },
      { name: "_venue", type: "string" },
      { name: "_ipfsMetadata", type: "string" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    name: "addTicketTier",
    type: "function", 
    inputs: [
      { name: "_name", type: "string" },
      { name: "_price", type: "uint256" },
      { name: "_available", type: "uint256" },
      { name: "_maxPerPurchase", type: "uint256" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    name: "getEventInfo",
    type: "function",
    inputs: [],
    outputs: [
      { name: "name", type: "string" },
      { name: "description", type: "string" },
      { name: "date", type: "uint256" },
      { name: "venue", type: "string" },
      { name: "ipfsMetadata", type: "string" },
      { name: "organizer", type: "address" }
    ],
    stateMutability: "view"
  },
  {
    name: "getEventDetails", // NEW - for NFT metadata
    type: "function",
    inputs: [],
    outputs: [
      { name: "name", type: "string" },
      { name: "venue", type: "string" },
      { name: "date", type: "uint256" },
      { name: "organizer", type: "address" }
    ],
    stateMutability: "view"
  },
  {
    name: "getTierInfo", // NEW - for NFT metadata
    type: "function",
    inputs: [{ name: "tierId", type: "uint256" }],
    outputs: [
      { name: "tierName", type: "string" },
      { name: "price", type: "uint256" },
      { name: "maxSupply", type: "uint256" },
      { name: "sold", type: "uint256" }
    ],
    stateMutability: "view"
  },
  {
    name: "getTierCount",
    type: "function",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view"
  },
  {
    name: "getTicketTier",
    type: "function",
    inputs: [{ name: "tierId", type: "uint256" }],
    outputs: [
      { name: "name", type: "string" },
      { name: "price", type: "uint256" },
      { name: "available", type: "uint256" },
      { name: "sold", type: "uint256" },
      { name: "maxPerPurchase", type: "uint256" },
      { name: "active", type: "bool" }
    ],
    stateMutability: "view"
  },
  {
    name: "setTicketNFT",
    type: "function",
    inputs: [
      { name: "_ticketNFT", type: "address" },
      { name: "_idrxToken", type: "address" },
      { name: "_platformFeeReceiver", type: "address" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },

  // TicketPurchase Facet Functions (9 functions)
  {
    name: "purchaseTicket",
    type: "function",
    inputs: [
      { name: "_tierId", type: "uint256" },
      { name: "_quantity", type: "uint256" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    name: "getRevenueStats",
    type: "function",
    inputs: [],
    outputs: [
      { name: "totalRevenue", type: "uint256" },
      { name: "totalRefunds", type: "uint256" }
    ],
    stateMutability: "view"
  },
  {
    name: "getTierSalesCount",
    type: "function",
    inputs: [{ name: "tierId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view"
  },
  {
    name: "getUserPurchaseCount", 
    type: "function",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view"
  },
  {
    name: "withdrawOrganizerFunds",
    type: "function",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    name: "getOrganizerEscrow",
    type: "function",
    inputs: [{ name: "organizer", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view"
  },

  // Marketplace Facet Functions (12 functions)
  {
    name: "listTicketForResale",
    type: "function",
    inputs: [
      { name: "_tokenId", type: "uint256" },
      { name: "_price", type: "uint256" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    name: "purchaseResaleTicket",
    type: "function",
    inputs: [{ name: "_tokenId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    name: "getActiveListings",
    type: "function",
    inputs: [],
    outputs: [
      { name: "tokenIds", type: "uint256[]" },
      { name: "prices", type: "uint256[]" },
      { name: "sellers", type: "address[]" }
    ],
    stateMutability: "view"
  },

  // StaffManagement Facet Functions (12 functions)
  {
    name: "addStaffWithRole",
    type: "function",
    inputs: [
      { name: "staff", type: "address" },
      { name: "role", type: "uint8" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    name: "getRoleHierarchy",
    type: "function",
    inputs: [],
    outputs: [{ name: "", type: "string[]" }],
    stateMutability: "view"
  },
  {
    name: "validateTicket",
    type: "function",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable"
  },

  // Diamond Standard Functions (8 functions)
  {
    name: "owner",
    type: "function", 
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view"
  },
  {
    name: "facets",
    type: "function",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "facetAddress", type: "address" },
          { name: "functionSelectors", type: "bytes4[]" }
        ]
      }
    ],
    stateMutability: "view"
  },
  {
    name: "supportsInterface",
    type: "function",
    inputs: [{ name: "interfaceId", type: "bytes4" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view"
  }
];

// Enhanced TicketNFT ABI with new metadata functions
export const TICKET_NFT_ABI = [
  // Standard ERC721 functions
  {
    name: "tokenURI",
    type: "function",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view"
  },
  {
    name: "getTicketMetadata", 
    type: "function",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "eventId", type: "uint256" },
          { name: "tierId", type: "uint256" },
          { name: "originalPrice", type: "uint256" },
          { name: "used", type: "bool" },
          { name: "purchaseDate", type: "uint256" },
          { name: "eventName", type: "string" },
          { name: "eventVenue", type: "string" },
          { name: "eventDate", type: "uint256" },
          { name: "tierName", type: "string" },
          { name: "organizerName", type: "string" },
          { name: "serialNumber", type: "uint256" },
          { name: "specialTraits", type: "string[]" }
        ]
      }
    ],
    stateMutability: "view"
  },
  {
    name: "getTicketStatus",
    type: "function",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }], // "valid", "used", "refunded"
    stateMutability: "view"
  }
];
```

### **2. HOOK INTERFACE UPDATES**

#### **UPDATE src/hooks/useSmartContract.ts:**

```typescript
// ❌ REMOVE old imports:
import {
  EVENT_FACTORY_ADDRESS,
  EVENT_FACTORY_ABI,
} from "../contracts/EventFactory";
import { EVENT_ABI } from "../contracts/Event";

// ✅ ADD new imports:
import {
  DIAMOND_ADDRESS,
  DIAMOND_ABI,
  TICKET_NFT_ABI
} from "../contracts/Diamond";

// ❌ REMOVE useAlgorithm1 from interfaces:
export interface EventData {
  eventId: bigint;
  name: string;
  description: string;
  date: bigint;
  venue: string;
  ipfsMetadata: string;
  organizer: string;
  cancelled: boolean;
  eventCompleted: boolean; // ✅ Add this
  // ❌ useAlgorithm1: boolean; // REMOVE - always Algorithm 1 now
}

// ✅ ADD new interfaces for enhanced NFT:
export interface EnhancedTicketMetadata {
  eventId: bigint;
  tierId: bigint;
  originalPrice: bigint;
  used: boolean;
  purchaseDate: bigint;
  eventName: string;
  eventVenue: string;
  eventDate: bigint;
  tierName: string;
  organizerName: string;
  serialNumber: bigint;
  specialTraits: string[];
}

export interface DiamondFacetInfo {
  facetAddress: string;
  functionSelectors: string[];
}
```

### **3. COMPONENT LOGIC UPDATES**

#### **Event Creation Components:**

```typescript
// ❌ OLD pattern (EventFactory):
const createEvent = async () => {
  const factory = getContract({
    address: EVENT_FACTORY_ADDRESS,
    abi: EVENT_FACTORY_ABI,
    publicClient
  });
  
  const eventAddress = await factory.createEvent(
    name, description, date, venue, metadata, useAlgorithm1 // ❌ Remove useAlgorithm1
  );
};

// ✅ NEW pattern (Diamond):
const createEvent = async () => {
  const diamond = getContract({
    address: DIAMOND_ADDRESS,
    abi: DIAMOND_ABI,
    publicClient
  });
  
  // Step 1: Initialize event in Diamond
  await diamond.initialize(
    organizerAddress, name, description, date, venue, metadata
  );
  
  // Step 2: Set NFT contract (if needed)
  await diamond.setTicketNFT(nftAddress, idrxAddress, feeReceiver);
  
  // Diamond address is the event address now
  return DIAMOND_ADDRESS;
};
```

#### **Ticket Purchase Components:**

```typescript
// ❌ OLD pattern (Individual Event contracts):
const purchaseTicket = async (eventAddress: string, tierId: bigint, quantity: bigint) => {
  const eventContract = getContract({
    address: eventAddress, // ❌ Different for each event
    abi: EVENT_ABI,
    publicClient
  });
  
  return await eventContract.purchaseTicket(tierId, quantity);
};

// ✅ NEW pattern (Single Diamond):
const purchaseTicket = async (tierId: bigint, quantity: bigint) => {
  const diamond = getContract({
    address: DIAMOND_ADDRESS, // ✅ Same for all events
    abi: DIAMOND_ABI,
    publicClient
  });
  
  return await diamond.purchaseTicket(tierId, quantity);
};
```

#### **Event Info Components:**

```typescript
// ❌ OLD pattern:
const getEventInfo = async (eventAddress: string) => {
  const eventContract = getContract({
    address: eventAddress,
    abi: EVENT_ABI,
    publicClient
  });
  
  const [name, description, date, venue, cancelled, useAlgorithm1] = 
    await eventContract.getEventInfo();
    
  return { name, description, date, venue, cancelled, useAlgorithm1 };
};

// ✅ NEW pattern:
const getEventInfo = async () => {
  const diamond = getContract({
    address: DIAMOND_ADDRESS,
    abi: DIAMOND_ABI,
    publicClient
  });
  
  const [name, description, date, venue, ipfsMetadata, organizer] = 
    await diamond.getEventInfo();
    
  const [cancelled, eventCompleted] = await diamond.getEventStatus();
    
  return { 
    name, description, date, venue, ipfsMetadata, organizer,
    cancelled, eventCompleted
    // No useAlgorithm1 - always Algorithm 1
  };
};
```

### **4. NFT DISPLAY ENHANCEMENTS**

#### **Enhanced NFT Metadata Display:**

```typescript
// ✅ NEW - Enhanced NFT display component
const EnhancedNFTDisplay: React.FC<{ tokenId: bigint }> = ({ tokenId }) => {
  const [metadata, setMetadata] = useState<EnhancedTicketMetadata | null>(null);
  const [tokenURI, setTokenURI] = useState<string>("");

  useEffect(() => {
    const fetchEnhancedMetadata = async () => {
      const nftContract = getContract({
        address: TICKET_NFT_ADDRESS,
        abi: TICKET_NFT_ABI,
        publicClient
      });

      // Get enhanced metadata
      const enhancedMetadata = await nftContract.getTicketMetadata(tokenId);
      setMetadata(enhancedMetadata);

      // Get dynamic tokenURI
      const uri = await nftContract.tokenURI(tokenId);
      setTokenURI(uri);
    };

    fetchEnhancedMetadata();
  }, [tokenId]);

  if (!metadata) return <div>Loading...</div>;

  return (
    <div className="nft-card">
      {/* Dynamic image based on status */}
      <img 
        src={tokenURI.includes('data:') ? tokenURI : `${tokenURI}/image`}
        alt={`${metadata.eventName} - ${metadata.tierName}`}
      />
      
      <div className="nft-details">
        <h3>{metadata.eventName}</h3>
        <p className="venue">{metadata.eventVenue}</p>
        <p className="date">{new Date(Number(metadata.eventDate) * 1000).toLocaleDateString()}</p>
        
        {/* Status badge */}
        <span className={`status-badge ${metadata.used ? 'used' : 'valid'}`}>
          {metadata.used ? 'USED' : 'VALID'}
        </span>
        
        {/* Tier info */}
        <div className="tier-info">
          <span className="tier">{metadata.tierName}</span>
          <span className="serial">#{metadata.serialNumber.toString()}</span>
        </div>
        
        {/* Special traits */}
        {metadata.specialTraits.length > 0 && (
          <div className="traits">
            {metadata.specialTraits.map((trait, index) => (
              <span key={index} className="trait-tag">{trait}</span>
            ))}
          </div>
        )}
        
        {/* OpenSea link */}
        <a 
          href={`https://testnets.opensea.io/assets/lisk-sepolia/${TICKET_NFT_ADDRESS}/${tokenId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="opensea-link"
        >
          View on OpenSea
        </a>
      </div>
    </div>
  );
};
```

### **5. STAFF MANAGEMENT UPDATES**

```typescript
// ✅ NEW - Staff management with role hierarchy
const StaffManagement: React.FC = () => {
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    const fetchRoleHierarchy = async () => {
      const diamond = getContract({
        address: DIAMOND_ADDRESS,
        abi: DIAMOND_ABI,
        publicClient
      });

      const hierarchy = await diamond.getRoleHierarchy();
      setRoles(hierarchy); // ["NONE", "SCANNER", "CHECKIN", "MANAGER"]
    };

    fetchRoleHierarchy();
  }, []);

  const addStaffWithRole = async (staffAddress: string, roleIndex: number) => {
    const diamond = getContract({
      address: DIAMOND_ADDRESS,
      abi: DIAMOND_ABI,
      walletClient
    });

    await diamond.addStaffWithRole(staffAddress, roleIndex);
  };

  return (
    <div className="staff-management">
      <h2>Staff Management</h2>
      
      {/* Role hierarchy display */}
      <div className="role-hierarchy">
        {roles.map((role, index) => (
          <div key={index} className={`role-level level-${index}`}>
            <span className="role-name">{role}</span>
            <span className="role-index">Level {index}</span>
          </div>
        ))}
      </div>
      
      {/* Add staff form */}
      <form onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        addStaffWithRole(
          formData.get('address') as string,
          parseInt(formData.get('role') as string)
        );
      }}>
        <input name="address" placeholder="Staff wallet address" required />
        <select name="role" required>
          {roles.map((role, index) => (
            <option key={index} value={index}>{role}</option>
          ))}
        </select>
        <button type="submit">Add Staff</button>
      </form>
    </div>
  );
};
```

---

## 🔍 **TESTING REQUIREMENTS**

### **Frontend Testing Checklist:**

- [ ] **Contract Constants Updated**
  - [ ] Diamond.ts file created with correct ABI
  - [ ] EventFactory.ts and Event.ts removed
  - [ ] All imports updated

- [ ] **Event Management**
  - [ ] Event creation via Diamond.initialize() works
  - [ ] Event info display shows correct data
  - [ ] No useAlgorithm1 references remain

- [ ] **Ticket Purchase**
  - [ ] Purchase flows through Diamond.purchaseTicket()  
  - [ ] Revenue stats accessible via Diamond
  - [ ] Escrow funds tracked correctly

- [ ] **NFT Display**
  - [ ] Enhanced metadata displays correctly
  - [ ] Dynamic images show status changes
  - [ ] OpenSea traits visible
  - [ ] Status updates reflect visually

- [ ] **Marketplace**
  - [ ] Listing via Diamond.listTicketForResale()
  - [ ] Active listings display correctly
  - [ ] Purchase from marketplace works

- [ ] **Staff Management**
  - [ ] Role hierarchy displays
  - [ ] Staff assignment via Diamond works
  - [ ] Ticket validation functions

---

## 🚨 **CRITICAL NOTES**

### **⚠️ BREAKING CHANGES:**
- **All contract addresses change** - only Diamond address used
- **All function calls change** - use Diamond ABI
- **Event creation flow changes** - initialize instead of factory
- **No more individual event contracts** - single Diamond for all
- **useAlgorithm1 removed everywhere** - Algorithm 1 always used

### **📋 DEPLOYMENT SEQUENCE:**
1. **Wait for backend** - Diamond contracts must be deployed first
2. **Get Diamond address** - update DIAMOND_ADDRESS constant  
3. **Update all imports** - replace Factory/Event with Diamond
4. **Test incrementally** - one feature at a time
5. **Deploy to production** - after full integration testing

### **🔧 MAINTENANCE:**
- **Single contract address** - easier to maintain
- **Combined ABI** - all functions in one place
- **Consistent patterns** - no more dual algorithm logic
- **Enhanced features** - dynamic NFT metadata, role hierarchy

---

*This frontend revision aligns with the Diamond Pattern backend architecture and enables advanced NFT features. Critical for system compatibility and production readiness.*