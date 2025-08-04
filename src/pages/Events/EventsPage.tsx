// src/pages/Events/EventsPage.tsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  Button,
  VStack,
  Skeleton,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from "@chakra-ui/react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { EventCard } from "../../components/core/Card";
import { mockEvents } from "../../data/mockEvents";
import { Event } from "../../types/Event";
import { EventsFilter, EventsSorter } from "../../components/events";
import { useSmartContract } from "../../hooks/useSmartContract";
import { DEVELOPMENT_CONFIG, CONTRACT_ADDRESSES } from "../../constants";

const EventsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);

  // Extract URL parameters
  const categoryFromUrl = searchParams.get("category") || "";
  const searchFromUrl = searchParams.get("search") || "";

  // Filter states
  const [searchQuery, setSearchQuery] = useState(searchFromUrl);
  const [categoryFilter, setCategoryFilter] = useState(categoryFromUrl);
  const [locationFilter, setLocationFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("date-asc");

  // Smart contract hook for blockchain integration
  const { getEventInfo, getTicketTiers } = useSmartContract();

  // SIMPLIFIED: Load events only once, no retry loops
  useEffect(() => {
    let isMounted = true; // Prevent state updates if component unmounted

    const fetchEvents = async () => {
      setIsLoading(true);
      setErrorMsg(null);

      try {
        if (DEVELOPMENT_CONFIG.ENABLE_BLOCKCHAIN) {
          // Fetching blockchain data
          
          // Try to get event from Diamond contract
          const eventInfo = await getEventInfo();
          
          if (eventInfo && eventInfo.name && eventInfo.name !== "") {
            // Convert blockchain event to UI format
            const blockchainEvent: Event = {
              id: CONTRACT_ADDRESSES.DiamondLummy, // Use contract address as ID
              title: eventInfo.name,
              description: eventInfo.description,
              date: new Date(Number(eventInfo.date) * 1000).toISOString(),
              time: new Date(Number(eventInfo.date) * 1000).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
              }),
              location: eventInfo.venue,
              price: 0, // Will be updated when tiers are loaded
              currency: "IDRX", // Add currency for price display
              imageUrl: "/api/placeholder/300/200", // Placeholder image
              category: "blockchain",
              status: eventInfo.cancelled ? "soldout" : "available",
              organizer: {
                id: eventInfo.organizer,
                name: "Event Organizer",
                verified: true,
                address: eventInfo.organizer,
              },
              ticketsAvailable: 0 // Will be updated
            };

            // Try to get ticket tiers for pricing
            try {
              const tiers = await getTicketTiers();
              console.log("🔍 DEBUG: Loaded tiers:", tiers);
              
              if (tiers && tiers.length > 0) {
                // Calculate minimum price from tiers (tiers have BigInt price in Wei)
                const prices = tiers.map(tier => {
                  const priceInWei = typeof tier.price === 'bigint' ? tier.price : BigInt(tier.price || 0);
                  const priceInTokens = Number(priceInWei) / 1e18; // Convert from Wei to IDRX
                  console.log(`🔍 Tier "${tier.name}": ${priceInWei} Wei = ${priceInTokens} IDRX`);
                  return priceInTokens;
                });
                
                const minPrice = Math.min(...prices.filter(p => p > 0)); // Exclude zero prices
                blockchainEvent.price = minPrice || 0;
                
                // Calculate total tickets
                blockchainEvent.ticketsAvailable = tiers.reduce((sum, tier) => {
                  const available = typeof tier.available === 'bigint' ? Number(tier.available) : Number(tier.available || 0);
                  return sum + available;
                }, 0);
                
                
                console.log("✅ Final event price:", blockchainEvent.price, "IDRX");
                console.log("✅ Available tickets:", blockchainEvent.ticketsAvailable);
              } else {
                console.log("⚠️ No tiers found");
                blockchainEvent.price = 0;
              }
            } catch (tierError) {
              console.log("❌ Tier loading failed:", tierError);
              blockchainEvent.price = 0;
            }

            if (!isMounted) return;
            
            setEvents([blockchainEvent]);
            setFilteredEvents([blockchainEvent]);
            setUsingMockData(false);
          } else {
            // No event initialized yet, fall back to mock data
            if (!isMounted) return;
            
            setEvents(mockEvents);
            setFilteredEvents(mockEvents);
            setUsingMockData(true);
            setErrorMsg("No events found on blockchain - showing demo data");
          }
        } else {
          // Blockchain disabled, use mock data
          console.log("Using mock data (blockchain disabled)");
          
          if (!isMounted) return;

          setEvents(mockEvents);
          setFilteredEvents(mockEvents);
          setUsingMockData(true);
        }
        
      } catch (error) {
        console.log("Blockchain fetch failed, using mock data:", error);
        
        if (!isMounted) return;

        // Fallback to mock data immediately - NO RETRY
        setEvents(mockEvents);
        setFilteredEvents(mockEvents);
        setUsingMockData(true);
        setErrorMsg("Using demo data - blockchain connection unavailable");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchEvents();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array - only run once!

  // Filter events whenever filter criteria changes
  useEffect(() => {
    if (events.length === 0) return;

    let filtered = [...events];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(query) ||
          event.description.toLowerCase().includes(query) ||
          event.location.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter((event) => event.category === categoryFilter);
    }

    // Apply location filter
    if (locationFilter) {
      filtered = filtered.filter((event) => event.location === locationFilter);
    }

    // Apply date filter
    if (dateFilter) {
      const filterDate = new Date(dateFilter).toISOString().split("T")[0];
      filtered = filtered.filter((event) => {
        const eventDate = new Date(event.date).toISOString().split("T")[0];
        return eventDate === filterDate;
      });
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter((event) => event.status === statusFilter);
    }

    // Apply sorting
    filtered = sortEvents(filtered, sortBy);

    setFilteredEvents(filtered);
  }, [
    events,
    searchQuery,
    categoryFilter,
    locationFilter,
    dateFilter,
    statusFilter,
    sortBy,
  ]);

  const sortEvents = (eventsToSort: Event[], sortMethod: string): Event[] => {
    const sorted = [...eventsToSort];

    switch (sortMethod) {
      case "date-asc":
        return sorted.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
      case "date-desc":
        return sorted.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      case "price-asc":
        return sorted.sort((a, b) => a.price - b.price);
      case "price-desc":
        return sorted.sort((a, b) => b.price - a.price);
      case "name-asc":
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      default:
        return sorted;
    }
  };

  const handleEventClick = (eventId: string) => {
    navigate(`/event/${eventId}`);
  };

  const resetFilters = () => {
    setSearchQuery("");
    setCategoryFilter("");
    setLocationFilter("");
    setDateFilter("");
    setStatusFilter("");
  };

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();

    if (searchQuery) params.set("search", searchQuery);
    if (categoryFilter) params.set("category", categoryFilter);
    if (locationFilter) params.set("location", locationFilter);
    if (dateFilter) params.set("date", dateFilter);
    if (statusFilter) params.set("status", statusFilter);

    if (params.toString() !== searchParams.toString()) {
      setSearchParams(params);
    }
  }, [
    searchQuery,
    categoryFilter,
    locationFilter,
    dateFilter,
    statusFilter,
    setSearchParams,
    searchParams,
  ]);

  // Extract unique values for filters
  const categories = Array.from(
    new Set(filteredEvents.map((event) => event.category))
  );

  const locations = Array.from(
    new Set(filteredEvents.map((event) => event.location))
  );

  const statuses = ["available", "limited", "soldout"];

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading size="lg">Discover Events</Heading>
          <Text color="gray.600">
            Find and book blockchain-verified tickets for the best events
          </Text>
        </Box>

        {/* Display status message */}
        {errorMsg && (
          <Alert status={usingMockData ? "info" : "warning"} borderRadius="md">
            <AlertIcon />
            <AlertTitle>{usingMockData ? "Demo Mode" : "Notice"}:</AlertTitle>
            <AlertDescription>{errorMsg}</AlertDescription>
          </Alert>
        )}

        {/* Search and Filter Section */}
        <EventsFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          categoryFilter={categoryFilter}
          onCategoryChange={setCategoryFilter}
          locationFilter={locationFilter}
          onLocationChange={setLocationFilter}
          dateFilter={dateFilter}
          onDateChange={setDateFilter}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          categories={categories}
          locations={locations}
          statuses={statuses}
          onReset={resetFilters}
        />

        {/* Results section */}
        <Box>
          <EventsSorter
            isLoading={isLoading}
            totalCount={filteredEvents.length}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />

          {isLoading ? (
            // Loading state
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={6}>
              {Array.from({ length: 8 }).map((_, index) => (
                <Box key={index} height="380px">
                  <Skeleton height="200px" mb={2} />
                  <Skeleton height="20px" width="80%" mb={2} />
                  <Skeleton height="20px" width="60%" mb={2} />
                  <Skeleton height="20px" width="40%" mb={2} />
                </Box>
              ))}
            </SimpleGrid>
          ) : filteredEvents.length > 0 ? (
            // Events grid
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={6}>
              {filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onClick={() => handleEventClick(event.id)}
                />
              ))}
            </SimpleGrid>
          ) : (
            // No results state
            <Box
              py={12}
              textAlign="center"
              borderWidth="1px"
              borderRadius="lg"
              borderStyle="dashed"
            >
              <VStack spacing={3}>
                <Text fontSize="xl" fontWeight="medium">
                  No events found
                </Text>
                <Text color="gray.600">
                  Try adjusting your search or filter criteria
                </Text>
                <Button
                  mt={4}
                  colorScheme="purple"
                  variant="outline"
                  onClick={resetFilters}
                >
                  Clear Filters
                </Button>
              </VStack>
            </Box>
          )}
        </Box>
      </VStack>
    </Container>
  );
};

export default EventsPage;