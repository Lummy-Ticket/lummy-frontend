import React from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  Stack,
  Avatar,
  Flex,
  SimpleGrid,
  Icon,
} from "@chakra-ui/react";
import { FaQuoteLeft } from "react-icons/fa";

interface TestimonialProps {
  name: string;
  role: string;
  content: string;
  avatar: string;
}

const testimonials: TestimonialProps[] = [
  {
    name: "Sari Wijaya",
    role: "Jakarta",
    content:
      "Buying with IDRX is simple and reselling happened instantly with fair pricing built-in.",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80",
  },
  {
    name: "Budi Santoso",
    role: "Event Organizer",
    content:
      "The staff system and automatic royalties transformed how I manage events.",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80",
  },
  {
    name: "Maya Chen",
    role: "Community Leader",
    content:
      "Having both Web2 and Web3 options means I can serve any audience perfectly.",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=764&q=80",
  },
  {
    name: "Rizki Pratama",
    role: "Festival Producer",
    content:
      "Burn-to-verify eliminated fraud and automatic refunds save us hours of work.",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80",
  },
  {
    name: "Rini Hartati",
    role: "First-time User",
    content:
      "Paying with IDRX feels like any payment app, but my tickets are blockchain-secured.",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80",
  },
  {
    name: "Aditya Pratama",
    role: "Conference Director",
    content:
      "Real-time analytics help me plan better events every time.",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80",
  },
];

const Testimonial = ({ name, role, content, avatar }: TestimonialProps) => {
  const bgColor = "white";
  const borderColor = "gray.200";

  return (
    <Box
      boxShadow={"lg"}
      maxW={"440px"}
      width={"full"}
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="lg"
      p={6}
      position={"relative"}
    >
      <Icon
        as={FaQuoteLeft}
        color={"purple.200"}
        position="absolute"
        top={2}
        left={2}
        fontSize="xl"
      />
      <Stack mt={6} direction={"column"} spacing={4}>
        <Text color={"gray.700"} fontSize={"md"} fontStyle="italic">
          {content}
        </Text>
        <Flex align={"center"} mt={4}>
          <Avatar src={avatar} name={name} mr={4} />
          <Stack direction={"column"} spacing={0}>
            <Text fontWeight={600}>{name}</Text>
            <Text fontSize={"sm"} color={"gray.500"}>
              {role}
            </Text>
          </Stack>
        </Flex>
      </Stack>
    </Box>
  );
};

const TestimonialSection: React.FC = () => {
  return (
    <Box bg={"purple.50"}>
      <Container maxW={"container.xl"} py={16}>
        <Stack spacing={8} align={"center"}>
          <Heading
            textAlign={"center"}
            as="h2"
            size="xl"
            fontWeight="bold"
            mb={2}
            bgGradient="linear(to-r, purple.500, pink.500)"
            bgClip="text"
          >
            What People Are Saying
          </Heading>
          <Text
            fontSize={"lg"}
            textAlign={"center"}
            maxW={"800px"}
            color={"gray.600"}
          >
            Hear from event-goers and organizers who are already enjoying the
            benefits of blockchain tickets.
          </Text>
          <SimpleGrid
            columns={{ base: 1, md: 2, lg: 3 }}
            spacing={10}
            width={"full"}
          >
            {testimonials.map((testimonial, index) => (
              <Testimonial key={index} {...testimonial} />
            ))}
          </SimpleGrid>
        </Stack>
      </Container>
    </Box>
  );
};

export default TestimonialSection;
