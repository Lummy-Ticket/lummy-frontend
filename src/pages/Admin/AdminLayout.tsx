import React from "react";
import {
  Box,
  Container,
  Flex,
  VStack,
  Text,
  Icon,
  useColorModeValue,
  Heading,
  Divider,
  Badge,
  HStack,
} from "@chakra-ui/react";
import { 
  MdDashboard, 
  MdPeople, 
  MdAnalytics, 
  MdSettings,
  MdEvent,
  MdAttachMoney
} from "react-icons/md";
import { NavLink, Outlet, useLocation } from "react-router-dom";

interface SidebarItemProps {
  icon: any;
  children: React.ReactNode;
  to: string;
  badge?: string;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, children, to, badge }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  const activeBg = useColorModeValue("purple.50", "purple.900");
  const activeColor = useColorModeValue("purple.600", "purple.200");
  const hoverBg = useColorModeValue("gray.50", "gray.700");

  return (
    <Box
      as={NavLink}
      to={to}
      w="full"
      px={4}
      py={3}
      borderRadius="md"
      bg={isActive ? activeBg : "transparent"}
      color={isActive ? activeColor : "inherit"}
      _hover={{
        bg: isActive ? activeBg : hoverBg,
        textDecoration: "none",
      }}
      transition="all 0.2s"
    >
      <HStack spacing={3}>
        <Icon as={icon} boxSize={5} />
        <Text fontWeight={isActive ? "semibold" : "medium"}>{children}</Text>
        {badge && (
          <Badge colorScheme="red" size="sm" borderRadius="full">
            {badge}
          </Badge>
        )}
      </HStack>
    </Box>
  );
};

const AdminLayout: React.FC = () => {
  const sidebarBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  return (
    <Container maxW="container.xl" py={4}>
      <Flex gap={6} align="start">
        {/* Sidebar */}
        <Box
          w="280px"
          bg={sidebarBg}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="lg"
          p={6}
          h="fit-content"
          position="sticky"
          top="6"
        >
          <VStack spacing={6} align="stretch">
            {/* Header */}
            <Box>
              <Heading size="md" color="purple.600" mb={1}>
                Admin Panel
              </Heading>
              <Text fontSize="sm" color="gray.500">
                Platform Management
              </Text>
            </Box>

            <Divider />

            {/* Navigation */}
            <VStack spacing={2} align="stretch">
              <SidebarItem icon={MdDashboard} to="/admin">
                Dashboard
              </SidebarItem>
              
              <SidebarItem icon={MdPeople} to="/admin/organizers" badge="3">
                Organizer Requests
              </SidebarItem>
              
              <SidebarItem icon={MdEvent} to="/admin/events">
                Event Management
              </SidebarItem>
              
              <SidebarItem icon={MdAnalytics} to="/admin/analytics">
                Analytics
              </SidebarItem>
              
              <SidebarItem icon={MdAttachMoney} to="/admin/revenue">
                Revenue
              </SidebarItem>
              
              <SidebarItem icon={MdSettings} to="/admin/settings">
                Settings
              </SidebarItem>
            </VStack>
          </VStack>
        </Box>

        {/* Main Content */}
        <Box flex="1">
          <Outlet />
        </Box>
      </Flex>
    </Container>
  );
};

export default AdminLayout;