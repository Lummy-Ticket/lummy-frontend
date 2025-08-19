import React, { useState, useEffect } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  SimpleGrid,
  Divider,
  Button,
  useToast,
  Stepper,
  Step,
  StepIndicator,
  StepStatus,
  StepIcon,
  StepNumber,
  StepTitle,
  StepSeparator,
  useSteps,
  Text,
} from "@chakra-ui/react";
import { OrderSummary } from "../../components/checkout/OrderSummary";
import { PaymentMethod } from "../../components/checkout/PaymentMethod";
import { WalletConnect } from "../../components/checkout/WalletConnect";
import { PaymentConfirmation } from "../../components/checkout/PaymentConfirmation";
import { mockEvents } from "../../data/mockEvents";
import { Event, TicketTier } from "../../types/Event";
import { TokenBalance } from "../../components/wallet";
import { useSmartContract } from "../../hooks/useSmartContract";
import { DEVELOPMENT_CONFIG, CONTRACT_ADDRESSES } from "../../constants";
import { useBalance, useAccount } from "wagmi";

// Fetch event from blockchain or mock data
const fetchEventById = async (id: string): Promise<Event | undefined> => {
  // Check if it's a blockchain event (contract address)
  if (DEVELOPMENT_CONFIG.ENABLE_BLOCKCHAIN && id.startsWith("0x") && id.length === 42) {
    try {
      // This is a blockchain event - we'll load it in the component using useSmartContract
      return undefined; // Will be loaded by useSmartContract in component
    } catch (error) {
      console.error("Error fetching blockchain event:", error);
    }
  }
  
  // Mock event fallback
  return new Promise((resolve) => {
    setTimeout(() => {
      const event = mockEvents.find((e) => e.id === id);
      resolve(event);
    }, 300);
  });
};

// Steps for the checkout process
const steps = [
  { title: "Connect Wallet" },
  { title: "Review Order" },
  { title: "Payment" },
  { title: "Confirmation" },
];

export interface CheckoutState {
  tierId: string;
  quantity: number;
  isCompact?: boolean;
  showRefresh?: boolean;
}

export const CheckoutPage: React.FC = () => {
  const { id: eventId } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  // Get checkout state from navigation or fallback
  const checkoutState = location.state as CheckoutState | null;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTier, setSelectedTier] = useState<TicketTier | null>(null);
  const [quantity, setQuantity] = useState<number>(
    checkoutState?.quantity || 1
  );
  const [isWalletConnected, setIsWalletConnected] = useState<boolean>(false);
  const [isWalletLoading, setIsWalletLoading] = useState<boolean>(false);
  const [isProcessingPayment, setIsProcessingPayment] =
    useState<boolean>(false);
  const [transactionHash, setTransactionHash] = useState<string>("");

  // Stepper control
  const { activeStep, setActiveStep } = useSteps({
    index: 0,
    count: steps.length,
  });

  // Wallet integration - using Wagmi for consistency with Navbar
  const { isConnected } = useAccount();
  const { address } = useAccount();

  // Auto-skip Connect Wallet step if user is already connected
  useEffect(() => {
    console.log('🚀 CheckoutPage - wallet check (Wagmi):', { isConnected, activeStep, address });
    if (isConnected && address && activeStep === 0) {
      console.log('✅ Auto-skip - wallet already connected via Wagmi');
      setIsWalletConnected(true);
      setActiveStep(1);
    }
  }, [isConnected, address, activeStep, setActiveStep]);
  
  // Get real wallet balance for payment checking
  const { data: balanceData } = useBalance({
    address,
    token: CONTRACT_ADDRESSES.MockIDRX as `0x${string}`,
  });
  
  // Smart contract integration for blockchain events
  const { getEventInfo, getTicketTiers, approveIDRX, purchaseTickets } = useSmartContract();
  // Removed unused variables: hasEnoughBalance, buyTicket


  useEffect(() => {
    const getEvent = async () => {
      if (eventId) {
        try {
          console.log("🔍 CheckoutPage - Loading event:", eventId);
          
          // Check if this is a blockchain event
          if (DEVELOPMENT_CONFIG.ENABLE_BLOCKCHAIN && eventId.startsWith("0x") && eventId.length === 42) {
            console.log("🔗 Loading blockchain event...");
            
            // Load event from blockchain
            const eventInfo = await getEventInfo();
            const tiers = await getTicketTiers();
            
            if (eventInfo && eventInfo.name) {
              // Convert blockchain event to UI format
              const blockchainEvent: Event = {
                id: eventId,
                title: eventInfo.name,
                description: eventInfo.description,
                date: new Date(Number(eventInfo.date) * 1000).toISOString(),
                time: new Date(Number(eventInfo.date) * 1000).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit"
                }),
                location: eventInfo.venue,
                price: 0,
                currency: "IDRX",
                imageUrl: eventInfo.ipfsMetadata || "",
                category: "blockchain",
                status: "available",
                organizer: {
                  id: eventInfo.organizer,
                  name: "Event Organizer",
                  verified: true,
                  address: eventInfo.organizer,
                },
                ticketsAvailable: 0,
                ticketTiers: []
              };
              
              // Add tiers
              if (tiers && tiers.length > 0) {
                const formattedTiers: TicketTier[] = tiers.map((tier, index) => ({
                  id: index.toString(),
                  name: tier.name || `Tier ${index + 1}`,
                  price: Number(tier.price || 0) / 1e18,
                  currency: "IDRX",
                  description: tier.name || `Tier ${index + 1}`,
                  available: Number(tier.available || 0) - Number(tier.sold || 0),
                  maxPerPurchase: Number(tier.maxPerPurchase || 0),
                  benefits: [],
                }));
                
                blockchainEvent.ticketTiers = formattedTiers;
                blockchainEvent.price = Math.min(...formattedTiers.map(t => t.price));
              }
              
              setEvent(blockchainEvent);
              console.log("✅ Blockchain event loaded:", blockchainEvent.title);
              
              // Set the selected tier for blockchain event
              if (checkoutState?.tierId && blockchainEvent.ticketTiers) {
                const tier = blockchainEvent.ticketTiers.find(
                  (t) => t.id === checkoutState.tierId
                );
                if (tier) {
                  setSelectedTier(tier);
                  console.log("✅ Selected tier:", tier.name);
                }
              }
            } else {
              console.log("⚠️ No blockchain event data found");
            }
          } else {
            // Load mock event
            const eventData = await fetchEventById(eventId);
            setEvent(eventData || null);
            
            // Set the selected tier for mock event
            if (eventData && checkoutState?.tierId) {
              const tier = eventData.ticketTiers?.find(
                (t) => t.id === checkoutState.tierId
              );
              if (tier) {
                setSelectedTier(tier);
              }
            }
          }

          console.log("🔧 Setting loading to false");
          setLoading(false);
        } catch (error) {
          console.error("Error fetching event:", error);
          toast({
            title: "Error loading event",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
          setLoading(false);
        }
      }
    };

    getEvent();
  }, [eventId, checkoutState, toast]);

  // If no checkout state, redirect back to event
  useEffect(() => {
    if (!loading && !checkoutState) {
      navigate(`/event/${eventId}`);
      toast({
        title: "Please select tickets first",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
    }
  }, [loading, checkoutState, navigate, eventId, toast]);

  // Mock wallet connection for development purposes
  const handleConnectWallet = async () => {
    setIsWalletLoading(true);

    // Simulate wallet connection
    setTimeout(() => {
      setIsWalletConnected(true);
      setIsWalletLoading(false);
      setActiveStep(1); // Move to Review Order step

      toast({
        title: "Wallet connected",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    }, 1500);
  };

  const handleBackToReview = () => {
    setActiveStep(1); // Go back to review step
  };

  const handlePayment = async () => {
    setIsProcessingPayment(true);

    if (!eventId || !selectedTier) {
      toast({
        title: "Error processing payment",
        description: "Missing event or ticket information",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setIsProcessingPayment(false);
      return;
    }

    const totalPrice = getTotalPrice();
    
    console.log("💳 Starting real blockchain purchase...");
    console.log("Event ID:", eventId);
    console.log("Selected Tier:", selectedTier);
    console.log("Quantity:", quantity);
    console.log("Total Price:", totalPrice);

    try {
      // Step 1: Approve IDRX spending first
      console.log("🔓 Step 1: Approving IDRX spending...");
      const approvalTx = await approveIDRX(totalPrice);
      
      if (!approvalTx) {
        throw new Error("IDRX approval failed");
      }
      
      console.log("✅ IDRX approved, proceeding to purchase...");

      // Step 2: Real blockchain purchase
      const tierId = parseInt(selectedTier.id);
      
      // Call real smart contract
      const txHash = await purchaseTickets(tierId, quantity, {
        eventName: event?.title || "Event",
        tierName: selectedTier.name,
        totalPrice: totalPrice,
        currency: selectedTier.currency,
        eventDate: event?.date || new Date().toISOString(),
        venue: event?.location || "Venue",
        eventId: eventId,
      });

      if (txHash) {
        console.log("✅ Purchase successful! TX:", txHash);
        setTransactionHash(txHash);
        setIsProcessingPayment(false);
        setActiveStep(3); // Move to confirmation step

        toast({
          title: "Payment successful",
          description: "Your tickets have been minted as NFTs",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      } else {
        console.log("❌ Purchase failed - no transaction hash");
        setIsProcessingPayment(false);
        toast({
          title: "Payment failed",
          description: "Transaction was not completed. Please try again.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error("❌ Purchase error:", error);
      setIsProcessingPayment(false);
      toast({
        title: "Payment failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleGoToTickets = () => {
    navigate("/tickets");
  };

  const getTotalPrice = (): number => {
    if (selectedTier) {
      return selectedTier.price * quantity;
    }
    return 0;
  };

  if (loading || !event || !selectedTier) {
    return (
      <Container maxW="container.lg" py={8}>
        <VStack spacing={8}>
          <Heading size="lg">Loading checkout...</Heading>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={8} align="stretch">
        <Heading size="lg">Checkout</Heading>

        {/* Stepper */}
        <Box>
          <Stepper index={activeStep} colorScheme="purple">
            {steps.map((step, index) => (
              <Step key={index}>
                <StepIndicator>
                  <StepStatus
                    complete={<StepIcon />}
                    incomplete={<StepNumber />}
                    active={<StepNumber />}
                  />
                </StepIndicator>

                <Box flexShrink={0}>
                  <StepTitle>{step.title}</StepTitle>
                </Box>

                <StepSeparator />
              </Step>
            ))}
          </Stepper>
        </Box>

        {activeStep === 3 ? (
          // Full width confirmation step
          <Box width="100%">
            <PaymentConfirmation
              event={event}
              tier={selectedTier}
              quantity={quantity}
              transactionHash={transactionHash}
              onViewTickets={handleGoToTickets}
            />
          </Box>
        ) : (
          // Two-column layout for other steps
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
            {/* Left side - Step content */}
            <Box>
              {activeStep === 0 && (
                <WalletConnect
                  onConnect={handleConnectWallet}
                  isLoading={isWalletLoading}
                  isConnected={isWalletConnected}
                  walletAddress={address}
                />
              )}

              {activeStep === 1 && (
                <VStack spacing={4} align="stretch">
                  <Heading size="md">Review Your Order</Heading>
                  <OrderSummary
                    event={event}
                    tier={selectedTier}
                    quantity={quantity}
                    onQuantityChange={setQuantity}
                  />
                  <Button
                    colorScheme="purple"
                    size="lg"
                    onClick={() => setActiveStep(2)}
                    mt={4}
                  >
                    Continue to Payment
                  </Button>
                </VStack>
              )}

              {activeStep === 2 && (
                <PaymentMethod
                  totalAmount={getTotalPrice()}
                  currency={selectedTier.currency}
                  onPay={handlePayment}
                  isProcessing={isProcessingPayment}
                  onBack={handleBackToReview}
                  walletBalance={balanceData ? parseFloat(balanceData.formatted) : 0}
                />
              )}
            </Box>

            {/* Right side - Order summary */}
            <Box
              borderWidth="1px"
              borderRadius="lg"
              p={6}
              bg="white"
              boxShadow="sm"
            >
              <VStack spacing={4} align="stretch">
                <Heading size="md">Order Summary</Heading>
                <HStack justify="space-between">
                  <Box>
                    <Heading size="sm">{event.title}</Heading>
                    <Box fontSize="sm" color="gray.600">
                      {selectedTier.name} × {quantity}
                    </Box>
                  </Box>
                  <Box fontWeight="bold">
                    {selectedTier.currency}{" "}
                    {(selectedTier.price * quantity).toLocaleString()}
                  </Box>
                </HStack>

                <Divider />

                <HStack justify="space-between">
                  <Box fontWeight="bold">Total</Box>
                  <Box fontWeight="bold">
                    {selectedTier.currency} {getTotalPrice().toLocaleString()}
                  </Box>
                </HStack>

                {isWalletConnected && (
                  <Box mt={2} bg="gray.50" p={3} borderRadius="md">
                    <HStack justify="space-between">
                      <Text fontSize="sm">Your Balance:</Text>
                      <TokenBalance />
                    </HStack>
                  </Box>
                )}
              </VStack>
            </Box>
          </SimpleGrid>
        )}
      </VStack>
    </Container>
  );
};

export default CheckoutPage;
