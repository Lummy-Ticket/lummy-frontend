export const STAFF_MANAGEMENT_FACET_ABI = [
  {
    type: "constructor",
    inputs: [
      {
        name: "trustedForwarder",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "addStaff",
    inputs: [{ name: "staff", type: "address", internalType: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "addStaffWithRole",
    inputs: [
      { name: "staff", type: "address", internalType: "address" },
      {
        name: "role",
        type: "uint8",
        internalType: "enum LibAppStorage.StaffRole",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "batchUpdateTicketStatus",
    inputs: [
      { name: "tokenIds", type: "uint256[]", internalType: "uint256[]" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getAllStaff",
    inputs: [],
    outputs: [
      {
        name: "staffMembers",
        type: "address[]",
        internalType: "address[]",
      },
      {
        name: "roles",
        type: "uint8[]",
        internalType: "enum LibAppStorage.StaffRole[]",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getRoleHierarchy",
    inputs: [],
    outputs: [{ name: "", type: "string[]", internalType: "string[]" }],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "getStaffRole",
    inputs: [{ name: "account", type: "address", internalType: "address" }],
    outputs: [
      {
        name: "",
        type: "uint8",
        internalType: "enum LibAppStorage.StaffRole",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "hasStaffRole",
    inputs: [
      { name: "account", type: "address", internalType: "address" },
      {
        name: "requiredRole",
        type: "uint8",
        internalType: "enum LibAppStorage.StaffRole",
      },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isStaff",
    inputs: [{ name: "account", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isTrustedForwarder",
    inputs: [{ name: "forwarder", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "removeStaff",
    inputs: [{ name: "staff", type: "address", internalType: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "removeStaffRole",
    inputs: [{ name: "staff", type: "address", internalType: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "trustedForwarder",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "updateTicketStatus",
    inputs: [{ name: "tokenId", type: "uint256", internalType: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "validateTicket",
    inputs: [{ name: "tokenId", type: "uint256", internalType: "uint256" }],
    outputs: [
      { name: "isValid", type: "bool", internalType: "bool" },
      { name: "owner", type: "address", internalType: "address" },
      { name: "tierId", type: "uint256", internalType: "uint256" },
      { name: "status", type: "string", internalType: "string" },
    ],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "BatchTicketStatusUpdated",
    inputs: [
      {
        name: "tokenIds",
        type: "uint256[]",
        indexed: false,
        internalType: "uint256[]",
      },
      {
        name: "scanner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "StaffAdded",
    inputs: [
      {
        name: "staff",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "organizer",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "StaffRemoved",
    inputs: [
      {
        name: "staff",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "organizer",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "StaffRoleAssigned",
    inputs: [
      {
        name: "staff",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "role",
        type: "uint8",
        indexed: false,
        internalType: "enum LibAppStorage.StaffRole",
      },
      {
        name: "assignedBy",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "StaffRoleRemoved",
    inputs: [
      {
        name: "staff",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "removedBy",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "TicketStatusUpdated",
    inputs: [
      {
        name: "tokenId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "oldStatus",
        type: "string",
        indexed: false,
        internalType: "string",
      },
      {
        name: "newStatus",
        type: "string",
        indexed: false,
        internalType: "string",
      },
      {
        name: "scanner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  { type: "error", name: "CannotAssignNoneRole", inputs: [] },
  { type: "error", name: "CannotRemoveOrganizer", inputs: [] },
  { type: "error", name: "InsufficientStaffPrivileges", inputs: [] },
  { type: "error", name: "InvalidStaffAddress", inputs: [] },
  { type: "error", name: "OnlyOrganizerCanAssignManager", inputs: [] },
  { type: "error", name: "OnlyOrganizerCanRemoveManager", inputs: [] },
  { type: "error", name: "ReentrancyGuardReentrantCall", inputs: [] },
  { type: "error", name: "StaffHasNoRole", inputs: [] },
];
