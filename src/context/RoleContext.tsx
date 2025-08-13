import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAccount } from 'wagmi';
import { useLocation } from 'react-router-dom';

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
  const location = useLocation();

  // Helper function to detect role from current URL
  const detectRoleFromURL = (pathname: string): UserRole => {
    // Specific exceptions that should NOT change role
    if (pathname === '/organizer-request') return 'customer'; // Organizer request form stays in customer role
    if (pathname === '/profile') return role; // Profile page doesn't change role, keeps current
    
    // Role-specific routes  
    if (pathname === '/organizer' || pathname.startsWith('/organizer/')) return 'organizer'; // /organizer dashboard and subpaths
    if (pathname.startsWith('/staff')) return 'staff';
    if (pathname.startsWith('/admin')) return 'admin';
    
    return 'customer';
  };

  // Enhanced setRole function that persists to localStorage
  const setRoleWithPersistence = (newRole: UserRole) => {
    setRole(newRole);
    localStorage.setItem('lummy-user-role', newRole);
    console.log(`🔄 Role switched to: ${newRole}`);
  };

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

  // Initialize role from localStorage or URL on component mount
  useEffect(() => {
    try {
      // First priority: try to restore from localStorage
      const savedRole = localStorage.getItem('lummy-user-role') as UserRole | null;
      
      // Second priority: detect from current URL
      const urlRole = detectRoleFromURL(location.pathname);
      
      if (savedRole && ['customer', 'organizer', 'admin', 'staff'].includes(savedRole)) {
        // If saved role matches URL role, use saved role
        if (savedRole === urlRole || urlRole === 'customer') {
          setRole(savedRole);
          console.log(`🔄 Restored role from localStorage: ${savedRole}`);
        } else {
          // If URL suggests different role, use URL and update localStorage
          setRole(urlRole);
          localStorage.setItem('lummy-user-role', urlRole);
          console.log(`🔄 Role detected from URL (overriding saved): ${urlRole}`);
        }
      } else if (urlRole !== 'customer') {
        // If no saved role but URL suggests specific role
        setRole(urlRole);
        localStorage.setItem('lummy-user-role', urlRole);
        console.log(`🔄 Role detected from URL: ${urlRole}`);
      } else {
        // Default to customer
        setRole('customer');
        localStorage.setItem('lummy-user-role', 'customer');
      }
    } catch (error) {
      console.error('Error initializing role:', error);
      setRole('customer');
    }
  }, []); // Only run on mount

  // Update role when URL changes (navigation)
  useEffect(() => {
    const urlRole = detectRoleFromURL(location.pathname);
    const currentRole = role;
    
    // If URL suggests different role than current, update role
    if (urlRole !== currentRole) {
      setRoleWithPersistence(urlRole);
      console.log(`🔄 Role auto-updated based on navigation: ${currentRole} → ${urlRole}`);
    }
  }, [location.pathname, role]);

  // Auto-detect roles when wallet changes
  useEffect(() => {
    refreshRoles();
  }, [address, isConnected]);

  return (
    <RoleContext.Provider value={{ 
      role, 
      setRole: setRoleWithPersistence, // Use enhanced setRole that persists to localStorage
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