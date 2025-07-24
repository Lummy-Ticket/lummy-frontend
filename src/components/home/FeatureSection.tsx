import React from "react";
import {
  Box,
  Container,
  SimpleGrid,
  Icon,
  Text,
  Stack,
  Flex,
  Heading,
} from "@chakra-ui/react";
import {
  FaShieldAlt,
  FaExchangeAlt,
  FaMoneyBillWave,
  FaQrcode,
  FaTicketAlt,
} from "react-icons/fa";
import { MdSecurity } from "react-icons/md";

interface FeatureProps {
  title: string;
  text: string;
  icon: React.ReactElement;
}

const Feature = ({ title, text, icon }: FeatureProps) => {
  return (
    <Stack>
      <Flex
        w={16}
        h={16}
        align={"center"}
        justify={"center"}
        color={"white"}
        rounded={"full"}
        bg={"purple.500"}
        mb={4}
      >
        {icon}
      </Flex>
      <Text fontWeight={600} fontSize="lg">
        {title}
      </Text>
      <Text color={"gray.600"}>{text}</Text>
    </Stack>
  );
};

const FeatureSection: React.FC = () => {
  return (
    <Box bg={"gray.50"}>
      <Container maxW={"container.xl"} py={16}>
        <Stack spacing={12}>
          <Box textAlign={"center"}>
            <Heading
              as="h2"
              size="xl"
              fontWeight="bold"
              mb={4}
              bgGradient="linear(to-r, purple.500, pink.500)"
              bgClip="text"
            >
              Blockchain-Powered Ticketing
            </Heading>
            <Text fontSize="lg" color={"gray.600"} maxW="800px" mx="auto">
              Lummy transforms Indonesian event ticketing with advanced
              blockchain technology for every type of event.
            </Text>
          </Box>

          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={10}>
            <Feature
              icon={<Icon as={FaShieldAlt} w={10} h={10} />}
              title={"Anti-Counterfeit Protection"}
              text={
                "Each ticket is a unique NFT with dynamic QR codes. Fake tickets are impossible."
              }
            />
            <Feature
              icon={<Icon as={FaMoneyBillWave} w={10} h={10} />}
              title={"IDRX Native Payments"}
              text={
                "Pay with Indonesian digital currency. We handle all the blockchain complexity automatically."
              }
            />
            <Feature
              icon={<Icon as={FaExchangeAlt} w={10} h={10} />}
              title={"Smart Marketplace"}
              text={
                "Resell tickets safely with automatic fair pricing and instant payments."
              }
            />
            <Feature
              icon={<Icon as={FaQrcode} w={10} h={10} />}
              title={"Flexible Event Options"}
              text={
                "Perfect for any event size. Choose Web2-friendly or full Web3 experience."
              }
            />
            <Feature
              icon={<Icon as={FaTicketAlt} w={10} h={10} />}
              title={"Complete Transparency"}
              text={
                "Full ticket history on Lisk blockchain. Verify authenticity instantly."
              }
            />
            <Feature
              icon={<Icon as={MdSecurity} w={10} h={10} />}
              title={"Enterprise Security"}
              text={
                "Multi-layered protection trusted by professional organizers across Indonesia."
              }
            />
          </SimpleGrid>
        </Stack>
      </Container>
    </Box>
  );
};

export default FeatureSection;
