import React from "react";
import {
  Box,
  Container,
  Heading,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Text,
  Flex,
  Button,
  VStack,
} from "@chakra-ui/react";

const faqData = [
  {
    question: "What makes Lummy different?",
    answer:
      "Advanced blockchain security with IDRX payments, but as simple as regular apps.",
  },
  {
    question: "How do I buy tickets?",
    answer:
      "Browse events, click buy, we guide you through IDRX setup. Easy as online shopping.",
  },
  {
    question: "Can I sell if I can't go?",
    answer:
      "Yes! List instantly with automatic fair pricing. Payment direct to your account.",
  },
  {
    question: "What if event is cancelled?",
    answer:
      "Automatic refunds to your account immediately. No forms or waiting.",
  },
  {
    question: "Do I need crypto knowledge?",
    answer:
      "Nope! Just get IDRX and start buying. We handle the tech stuff.",
  },
  {
    question: "How do QR codes work?",
    answer:
      "Smart codes that update automatically. Just show at venue and scan in.",
  },
  {
    question: "Can I transfer to friends?",
    answer:
      "Super easy! Tap transfer, enter details, they get it instantly.",
  },
  {
    question: "Is my data safe?",
    answer:
      "Yes! Blockchain records ownership for security, personal data stays private.",
  },
];

const FaqSection: React.FC = () => {
  const bgColor = "white";

  return (
    <Box bg={bgColor} py={16}>
      <Container maxW="container.xl">
        <Flex
          direction={{ base: "column", lg: "row" }}
          align="start"
          justify="space-between"
          gap={10}
        >
          <VStack
            align="flex-start"
            spacing={6}
            flex="1"
            maxW={{ lg: "400px" }}
          >
            <Heading
              as="h2"
              size="xl"
              fontWeight="bold"
              bgGradient="linear(to-r, purple.500, pink.500)"
              bgClip="text"
            >
              Frequently Asked Questions
            </Heading>
            <Text color="gray.600" fontSize="lg">
              Got questions about Lummy, NFT tickets, or how our platform works?
              Find answers to common questions here.
            </Text>
            <Button colorScheme="purple" size="lg" mt={4}>
              Contact Support
            </Button>
          </VStack>

          <Box flex="1.5">
            <Accordion allowMultiple>
              {faqData.map((faq, index) => (
                <AccordionItem
                  key={index}
                  borderWidth="1px"
                  my={2}
                  borderRadius="md"
                >
                  <h2>
                    <AccordionButton py={4}>
                      <Box flex="1" textAlign="left" fontWeight="medium">
                        {faq.question}
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                  </h2>
                  <AccordionPanel pb={4}>
                    <Text color="gray.600">{faq.answer}</Text>
                  </AccordionPanel>
                </AccordionItem>
              ))}
            </Accordion>
          </Box>
        </Flex>
      </Container>
    </Box>
  );
};

export default FaqSection;
