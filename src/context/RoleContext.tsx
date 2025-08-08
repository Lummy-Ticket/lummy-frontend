import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAccount } from 'wagmi';

export type UserRole = 'customer' | 'organizer' | 'admin' | 'staff';

interface RoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  getRoleLabel: (role: UserRole) => string;
  isAutoDetected: boolean;
  refreshRoles: () => Promise<void>;
  roleInfo: {
    isOrganizer: boolean;
    staffRole: number;
    hasAnyRole: boolean;
  } | null;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>('customer');
  const [isAutoDetected, setIsAutoDetected] = useState(false);
  const [roleInfo, setRoleInfo] = useState<{
    isOrganizer: boolean;
    staffRole: number;
    hasAnyRole: boolean;
  } | null>(null);
  const { address, isConnected } = useAccount();

  const getRoleLabel = (role: UserRole): string => {
    switch (role) {
      case 'customer': return 'Customer';
      case 'organizer': return 'Organizer';
      case 'admin': return 'Admin';
      case 'staff': return 'Staff';
      default: return 'Customer';
    }
  };

  const refreshRoles = async () => {
    if (!address || !isConnected) {
      setRoleInfo(null);
      setRole('customer');
      setIsAutoDetected(false);
      return;
    }

    try {
      // Get role information (this will only work if called from within a component that has the hook)
      // For now, we'll set this up as a placeholder and implement proper detection later
      console.log("🔍 Role detection triggered for:", address);
      
      // Set default for now - actual implementation will be done when integrated with components
      setRoleInfo({
        isOrganizer: false,
        staffRole: 0,
        hasAnyRole: false,
      });
      setIsAutoDetected(true);
    } catch (error) {
      console.error("Error detecting roles:", error);
      setIsAutoDetected(false);
    }
  };

  // Auto-detect roles when wallet changes
  useEffect(() => {
    refreshRoles();
  }, [address, isConnected]);

  return (
    <RoleContext.Provider value={{ 
      role, 
      setRole, 
      getRoleLabel, 
      isAutoDetected,
      refreshRoles,
      roleInfo 
    }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = (): RoleContextType => {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};