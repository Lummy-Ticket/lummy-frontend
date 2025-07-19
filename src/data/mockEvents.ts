import { Event } from "../types/Event";

// Mock events with contract-compatible structure
export const mockEvents: Event[] = [
  {
    id: "1",
    title: "Summer Music Festival",
    description: "The biggest music festival of the summer featuring top artists from around the world.",
    longDescription: `Get ready for the ultimate summer experience! The Summer Music Festival brings together the biggest names in music for an unforgettable weekend.

From pop to rock, hip-hop to electronic, this festival has something for everyone. Join thousands of music lovers from around the world for this celebration of sound.

Highlights include:
- 3 main stages with continuous performances
- Food and drink vendors offering local and international cuisine
- Artisan market with unique merchandise
- Chill-out zones for when you need a break
- Free water stations throughout the venue

Don't miss out on the biggest music event of the summer!`,
    date: "2025-06-15T12:00:00",
    time: "12:00 PM",
    endTime: "11:00 PM",
    location: "Jakarta Convention Center",
    venue: "Jakarta Convention Center Main Arena",
    address: "Jl. Gatot Subroto, Jakarta 10270, Indonesia",
    imageUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
    price: 250,
    currency: "IDRX",
    category: "Music",
    status: "available",
    organizer: {
      id: "org1",
      name: "EventMaster Indonesia",
      verified: true,
      description: "Indonesia's premier event organizer, bringing world-class experiences to Jakarta since 2015.",
      website: "https://example.com",
      eventsHosted: 48,
      address: "0x1234567890abcdef1234567890abcdef12345678", // Mock organizer address
    },
    ticketsAvailable: 500,
    ticketTiers: [
      {
        id: "tier1",
        name: "General Admission",
        price: 250,
        currency: "IDRX",
        description: "Standard festival access for one day",
        available: 300,
        maxPerPurchase: 4,
        sold: 0,
        active: true,
      },
      {
        id: "tier2",
        name: "VIP Pass",
        price: 500,
        currency: "IDRX",
        description: "Enhanced experience with premium viewing areas and complimentary refreshments",
        available: 100,
        maxPerPurchase: 2,
        sold: 0,
        active: true,
        benefits: [
          "Access to VIP viewing areas",
          "Complimentary food and drinks",
          "VIP restroom facilities",
          "Exclusive festival merchandise",
        ],
      },
      {
        id: "tier3",
        name: "Weekend Pass",
        price: 450,
        currency: "IDRX",
        description: "Full weekend access to all festival days",
        available: 150,
        maxPerPurchase: 4,
        sold: 0,
        active: true,
      },
      {
        id: "tier4",
        name: "Backstage Experience",
        price: 1000,
        currency: "IDRX",
        description: "The ultimate festival experience with backstage access",
        available: 0,
        maxPerPurchase: 2,
        sold: 50,
        active: false,
        benefits: [
          "All VIP benefits",
          "Backstage tour",
          "Artist meet & greet opportunity",
          "Exclusive backstage lounge access",
        ],
      },
    ],
    tags: ["music", "festival", "concert", "summer"],
    // Contract-compatible fields
    eventId: "1",
    ipfsMetadata: "QmSummerMusicFestival2025Hash",
    cancelled: false,
    useAlgorithm1: false,
  },
  {
    id: "2",
    title: "Tech Conference 2025",
    description: "Join the leading tech experts for a day of learning and networking.",
    longDescription: `Tech Conference 2025 brings together industry leaders, innovators, and tech enthusiasts for an immersive day of knowledge sharing and networking.

This year's conference focuses on emerging technologies including AI, blockchain, and the future of web development. Whether you're a seasoned professional or just starting your tech journey, you'll find valuable insights and connections.

Conference schedule includes:
- Keynote speeches from industry pioneers
- Technical workshops with hands-on experience
- Panel discussions on trending topics
- Networking sessions with like-minded professionals
- Exhibition area showcasing cutting-edge products

Don't miss this opportunity to stay ahead of the curve in the rapidly evolving tech landscape.`,
    date: "2025-07-25T09:00:00",
    time: "09:00 AM",
    endTime: "05:00 PM",
    location: "Digital Hub Bandung",
    venue: "Digital Hub Conference Center",
    address: "Jl. Dipati Ukur No. 112, Bandung 40132, Indonesia",
    imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1712&q=80",
    price: 150,
    currency: "IDRX",
    category: "Technology",
    status: "limited",
    organizer: {
      id: "org2",
      name: "TechTalks ID",
      verified: true,
      description: "Dedicated to fostering tech innovation and knowledge sharing in Indonesia.",
      website: "https://example.com",
      eventsHosted: 24,
      address: "0xabcdef1234567890abcdef1234567890abcdef12",
    },
    ticketsAvailable: 50,
    ticketTiers: [
      {
        id: "tier1",
        name: "Standard Access",
        price: 150,
        currency: "IDRX",
        description: "Full day access to all conference sessions and exhibition area",
        available: 30,
        maxPerPurchase: 5,
        sold: 170,
        active: true,
      },
      {
        id: "tier2",
        name: "Premium Access",
        price: 300,
        currency: "IDRX",
        description: "Enhanced experience with premium seating and exclusive workshops",
        available: 20,
        maxPerPurchase: 2,
        sold: 30,
        active: true,
        benefits: [
          "Priority seating in all sessions",
          "Access to exclusive workshops",
          "Lunch with speakers",
          "Digital copy of all presentations",
        ],
      },
      {
        id: "tier3",
        name: "Student Pass",
        price: 75,
        currency: "IDRX",
        description: "Discounted ticket for students with valid student ID",
        available: 0,
        maxPerPurchase: 1,
        sold: 50,
        active: false,
      },
    ],
    tags: ["technology", "conference", "networking", "education"],
    eventId: "2",
    ipfsMetadata: "QmTechConference2025Hash",
    cancelled: false,
    useAlgorithm1: true,
  },
  {
    id: "3",
    title: "Blockchain Workshop",
    description: "Hands-on workshop to learn about blockchain technology and development.",
    date: "2025-08-10T10:00:00",
    time: "10:00 AM",
    endTime: "04:00 PM",
    location: "Blockchain Center Jakarta",
    venue: "Blockchain Center Jakarta",
    address: "Jl. Sudirman No. 123, Jakarta 10220, Indonesia",
    imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    price: 100,
    currency: "IDRX",
    category: "Workshop",
    status: "available",
    organizer: {
      id: "org3",
      name: "Blockchain Indonesia",
      verified: true,
      description: "Leading the blockchain revolution in Indonesia through education and community building.",
      eventsHosted: 15,
      address: "0xfedcba0987654321fedcba0987654321fedcba09",
    },
    ticketsAvailable: 100,
    ticketTiers: [
      {
        id: "tier1",
        name: "Workshop Ticket",
        price: 100,
        currency: "IDRX",
        description: "Full access to the workshop including materials",
        available: 80,
        maxPerPurchase: 3,
        sold: 20,
        active: true,
      },
      {
        id: "tier2",
        name: "Workshop + Certification",
        price: 200,
        currency: "IDRX",
        description: "Workshop access plus official certification upon completion",
        available: 50,
        maxPerPurchase: 1,
        sold: 0,
        active: true,
        benefits: [
          "Full workshop access",
          "Official certification",
          "Post-workshop support for 1 month",
          "Access to exclusive online resources",
        ],
      },
    ],
    tags: ["blockchain", "workshop", "technology", "education"],
    eventId: "3",
    ipfsMetadata: "QmBlockchainWorkshop2025Hash",
    cancelled: false,
    useAlgorithm1: false,
  },
];

// Contract-compatible mock data for testing
export const mockContractEvents = [
  {
    eventId: 1n,
    name: "Summer Music Festival",
    description: "The biggest music festival of the summer featuring top artists from around the world.",
    date: 1750089600n, // June 15, 2025 12:00:00 UTC timestamp
    venue: "Jakarta Convention Center Main Arena",
    ipfsMetadata: "QmSummerMusicFestival2025Hash",
    organizer: "0x1234567890abcdef1234567890abcdef12345678",
    cancelled: false,
    useAlgorithm1: false,
    factory: "0x0000000000000000000000000000000000000000",
    ticketNFT: "0x0000000000000000000000000000000000000000",
    idrxToken: "0xD63029C1a3dA68b51c67c6D1DeC3DEe50D681661",
    platformFeeReceiver: "0x0000000000000000000000000000000000000000",
    tierCount: 4n,
  },
  {
    eventId: 2n,
    name: "Tech Conference 2025",
    description: "Join the leading tech experts for a day of learning and networking.",
    date: 1753027200n, // July 25, 2025 09:00:00 UTC timestamp
    venue: "Digital Hub Conference Center",
    ipfsMetadata: "QmTechConference2025Hash",
    organizer: "0xabcdef1234567890abcdef1234567890abcdef12",
    cancelled: false,
    useAlgorithm1: true,
    factory: "0x0000000000000000000000000000000000000000",
    ticketNFT: "0x0000000000000000000000000000000000000000",
    idrxToken: "0xD63029C1a3dA68b51c67c6D1DeC3DEe50D681661",
    platformFeeReceiver: "0x0000000000000000000000000000000000000000",
    tierCount: 3n,
  },
];

// Contract-compatible ticket tiers for testing
export const mockContractTicketTiers = [
  // Event 1 tiers
  {
    name: "General Admission",
    price: 250000000000000000000n, // 250 IDRX in wei (18 decimals)
    available: 300n,
    sold: 0n,
    maxPerPurchase: 4n,
    active: true,
  },
  {
    name: "VIP Pass",
    price: 500000000000000000000n, // 500 IDRX in wei
    available: 100n,
    sold: 0n,
    maxPerPurchase: 2n,
    active: true,
  },
  {
    name: "Weekend Pass",
    price: 450000000000000000000n, // 450 IDRX in wei
    available: 150n,
    sold: 0n,
    maxPerPurchase: 4n,
    active: true,
  },
  {
    name: "Backstage Experience",
    price: 1000000000000000000000n, // 1000 IDRX in wei
    available: 0n,
    sold: 50n,
    maxPerPurchase: 2n,
    active: false,
  },
];