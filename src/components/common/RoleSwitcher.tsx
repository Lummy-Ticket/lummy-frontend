import React, { useEffect, useState } from 'react';
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  Icon,
  Text,
  Badge,
  HStack,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { FaUser, FaUserTie, FaUserShield, FaUserCheck, FaRobot } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useRole, UserRole } from '../../context/RoleContext';
import { useSmartContract } from '../../hooks/useSmartContract';

const RoleSwitcher: React.FC = () => {
  const { role, setRole } = useRole();
  const { getWalletRoles } = useSmartContract();
  const [detectedRoles, setDetectedRoles] = useState<{
    isOrganizer: boolean;
    staffRole: number;
    hasAnyRole: boolean;
    recommendedRole: UserRole;
  } | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const navigate = useNavigate();
  const menuBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Define the first path for each role
  const getRoleDefaultPath = (roleValue: UserRole): string => {
    switch (roleValue) {
      case 'customer':
        return '/';
      case 'organizer':
        return '/organizer';
      case 'staff':
        return '/staff';
      case 'admin':
        return '/admin';
      default:
        return '/';
    }
  };

  // Auto-detect roles when component mounts
  useEffect(() => {
    const detectRoles = async () => {
      setIsDetecting(true);
      try {
        const roles = await getWalletRoles();
        setDetectedRoles(roles);
        
        // Auto-suggest role if different from current
        if (roles.hasAnyRole && role === 'customer' && roles.recommendedRole !== 'customer') {
          console.log("🔍 Suggesting role change:", roles.recommendedRole);
        }
      } catch (error) {
        console.error("Error detecting roles:", error);
      } finally {
        setIsDetecting(false);
      }
    };

    detectRoles();
  }, [getWalletRoles]);

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    const defaultPath = getRoleDefaultPath(newRole);
    navigate(defaultPath);
  };


  const roles: { value: UserRole; label: string; icon: React.ElementType; color: string }[] = [
    { value: 'customer', label: 'Customer', icon: FaUser, color: 'blue' },
    { value: 'organizer', label: 'Organizer', icon: FaUserTie, color: 'purple' },
    { value: 'staff', label: 'Staff', icon: FaUserCheck, color: 'green' },
    { value: 'admin', label: 'Admin', icon: FaUserShield, color: 'red' },
  ];

  const currentRole = roles.find(r => r.value === role) || roles[0];

  return (
    <Menu>
      <MenuButton
        as={Button}
        rightIcon={<ChevronDownIcon />}
        variant="outline"
        colorScheme="purple"
        size={{ base: "sm", lg: "md" }}
        px={{ base: 2, md: 3, lg: 4 }}
        py={2}
        borderRadius="lg"
        leftIcon={<Icon as={currentRole.icon} />}
        isLoading={isDetecting}
      >
        <Text display={{ base: "none", sm: "block" }}>
          {currentRole.label}
        </Text>
      </MenuButton>
      
      <MenuList 
        bg={menuBg} 
        borderColor={borderColor} 
        shadow="lg"
        minW="200px"
        py={2}
      >
        {/* Role selection */}
        <VStack align="stretch" spacing={1} px={2} py={1}>
          {roles.map((roleOption) => (
            <MenuItem
              key={roleOption.value}
              onClick={() => handleRoleChange(roleOption.value)}
              bg={role === roleOption.value ? `${roleOption.color}.50` : 'transparent'}
              _hover={{
                bg: role === roleOption.value ? `${roleOption.color}.100` : `${roleOption.color}.50`,
              }}
              _active={{
                bg: `${roleOption.color}.100`,
              }}
              py={2.5}
              px={3}
              borderRadius="md"
              minH="auto"
            >
              <HStack spacing={3} justify="space-between" width="100%">
                <HStack spacing={3}>
                  <Icon as={roleOption.icon} color={`${roleOption.color}.500`} boxSize={4} />
                  <Text fontWeight={role === roleOption.value ? 'semibold' : 'normal'} fontSize="sm">
                    {roleOption.label}
                  </Text>
                </HStack>
                <HStack spacing={2}>
                  {/* Show if role is available based on detection */}
                  {detectedRoles && (
                    <>
                      {roleOption.value === 'organizer' && detectedRoles.isOrganizer && (
                        <Icon as={FaRobot} color="green.400" boxSize={3} />
                      )}
                      {roleOption.value === 'staff' && detectedRoles.staffRole >= 1 && (
                        <Icon as={FaRobot} color="green.400" boxSize={3} />
                      )}
                    </>
                  )}
                  {role === roleOption.value && (
                    <Badge colorScheme={roleOption.color} size="sm" fontSize="xs">
                      Active
                    </Badge>
                  )}
                </HStack>
              </HStack>
            </MenuItem>
          ))}
        </VStack>
      </MenuList>
    </Menu>
  );
};

export default RoleSwitcher;