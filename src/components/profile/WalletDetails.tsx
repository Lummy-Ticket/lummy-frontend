import React, { useState } from "react";
import {
  Box,
  VStack,
  HStack,
  Flex,
  Text,
  Button,
  Divider,
  Icon,
  useClipboard,
  Tooltip,
  Spinner,
} from "@chakra-ui/react";
import { CopyIcon, CheckIcon, ExternalLinkIcon } from "@chakra-ui/icons";
import { FaWallet, FaCoins, FaExchangeAlt, FaTicketAlt, FaPlus } from "react-icons/fa";
import { useAccount } from "wagmi";
import SimpleTopUpModal from "./SimpleTopUpModal";

// Interface for balance data
interface WalletDetailsProps {
  balanceData?: {
    formatted: string;
    symbol: string;
    value: bigint;
  };
}

const WalletDetails: React.FC<WalletDetailsProps> = ({ balanceData }) => {
  const { address } = useAccount();
  const { hasCopied, onCopy } = useClipboard(address || "");
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);

  const bgColor = "white";
  const cardBg = "gray.50";

  // Format address for display
  const formatAddress = (address?: string, length = 6) => {
    if (!address) return "";
    return `${address.substring(0, length)}...${address.substring(
      address.length - 4
    )}`;
  };

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      bg={bgColor}
      p={6}
    >
      <Text fontSize="xl" fontWeight="bold" mb={6}>
        Wallet Details
      </Text>

      <VStack spacing={6} align="stretch">
        {/* Wallet Address */}
        <Flex
          bg={cardBg}
          p={4}
          borderRadius="md"
          justify="space-between"
          align="center"
        >
          <HStack>
            <Icon as={FaWallet} color="purple.500" />
            <Text fontWeight="medium">Wallet Address</Text>
          </HStack>
          <HStack>
            <Text fontFamily="monospace" fontSize="sm">
              {formatAddress(address)}
            </Text>
            <Tooltip label={hasCopied ? "Copied!" : "Copy address"}>
              <Button
                size="xs"
                onClick={onCopy}
                variant="ghost"
                colorScheme="purple"
              >
                {hasCopied ? <CheckIcon /> : <CopyIcon />}
              </Button>
            </Tooltip>
            <Tooltip label="View on explorer">
              <Button
                as="a"
                href={`https://explorer.lisk.com/address/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                size="xs"
                variant="ghost"
                colorScheme="purple"
              >
                <ExternalLinkIcon />
              </Button>
            </Tooltip>
          </HStack>
        </Flex>

        <Divider />

        {/* Token Balances */}
        <Box>
          <Text fontWeight="medium" mb={4}>
            Token Balances
          </Text>
          <VStack spacing={4} align="stretch">
            <Box
              bg="blue.50"
              p={4}
              borderRadius="md"
              borderWidth="1px"
              borderColor="blue.200"
            >
              <Flex justify="space-between" align="center" mb={3}>
                <HStack>
                  <Icon as={FaCoins} color="blue.500" />
                  <Text fontWeight="medium">IDRX Balance</Text>
                </HStack>
                {balanceData ? (
                  <Text fontWeight="bold" fontSize="lg" color="blue.600">
                    {parseFloat(balanceData.formatted).toLocaleString()}{" "}
                    {balanceData.symbol}
                  </Text>
                ) : (
                  <Spinner size="sm" color="blue.500" />
                )}
              </Flex>
              <Flex justify="space-between" align="center">
                <Text fontSize="xs" color="gray.600">
                  On Lisk Network
                </Text>
                <Button
                  size="sm"
                  colorScheme="purple"
                  leftIcon={<Icon as={FaPlus} />}
                  onClick={() => setIsTopUpModalOpen(true)}
                >
                  Top Up
                </Button>
              </Flex>
            </Box>

            <Flex
              justify="space-between"
              align="center"
              bg={cardBg}
              p={4}
              borderRadius="md"
            >
              <HStack>
                <Icon as={FaCoins} color="gray.500" />
                <Text>LSK Balance</Text>
              </HStack>
              <Text fontWeight="medium">5.5 LSK</Text>
            </Flex>
          </VStack>
        </Box>

        <Divider />

        {/* Quick Actions */}
        <Box>
          <Text fontWeight="medium" mb={4}>
            Quick Actions
          </Text>
          <HStack spacing={4}>
            <Button
              leftIcon={<Icon as={FaExchangeAlt} />}
              colorScheme="purple"
              variant="outline"
            >
              Send Tokens
            </Button>
            <Button leftIcon={<Icon as={FaTicketAlt} />} colorScheme="purple">
              View My Tickets
            </Button>
          </HStack>
        </Box>
      </VStack>

      {/* Top Up Modal */}
      <SimpleTopUpModal
        isOpen={isTopUpModalOpen}
        onClose={() => setIsTopUpModalOpen(false)}
        currentBalance={balanceData?.formatted || "0"}
      />
    </Box>
  );
};

export default WalletDetails;
