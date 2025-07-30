import { liskSepolia } from "viem/chains";

// Extend Window interface for MetaMask
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (data: any) => void) => void;
      removeListener?: (event: string, callback: (data: any) => void) => void;
    };
  }
}

// Lisk Sepolia network configuration
export const LISK_SEPOLIA_CONFIG = {
  chainId: `0x${liskSepolia.id.toString(16)}`, // Convert to hex
  chainName: liskSepolia.name,
  nativeCurrency: liskSepolia.nativeCurrency,
  rpcUrls: [liskSepolia.rpcUrls.default.http[0]],
  blockExplorerUrls: [liskSepolia.blockExplorers?.default.url],
};

/**
 * Switch to Lisk Sepolia network
 * Auto-adds network if not exists in wallet
 */
export const switchToLiskSepolia = async (): Promise<boolean> => {
  // Check for any wallet provider (MetaMask, Xellar, etc.)
  if (!window.ethereum) {
    console.warn("No wallet provider detected - skipping network switch");
    return false;
  }

  try {
    // Try to switch to Lisk Sepolia
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: LISK_SEPOLIA_CONFIG.chainId }],
    });
    
    console.log("Successfully switched to Lisk Sepolia");
    return true;
  } catch (switchError: any) {
    // Network not added to wallet, try to add it
    if (switchError.code === 4902 || switchError.code === -32603) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [LISK_SEPOLIA_CONFIG],
        });
        
        console.log("Successfully added and switched to Lisk Sepolia");
        return true;
      } catch (addError) {
        console.error("Failed to add Lisk Sepolia network:", addError);
        return false;
      }
    } else {
      console.error("Failed to switch network:", switchError);
      return false;
    }
  }
};

/**
 * Check if currently on Lisk Sepolia
 */
export const isOnLiskSepolia = async (): Promise<boolean> => {
  if (!window.ethereum) return false;
  
  try {
    const chainId = await window.ethereum.request({ method: "eth_chainId" });
    return chainId === LISK_SEPOLIA_CONFIG.chainId;
  } catch (error) {
    console.error("Failed to check network:", error);
    return false;
  }
};

/**
 * Get current network name
 */
export const getCurrentNetworkName = async (): Promise<string> => {
  if (!window.ethereum) return "Unknown";
  
  try {
    const chainId = await window.ethereum.request({ method: "eth_chainId" });
    const chainIdDecimal = parseInt(chainId, 16);
    
    const networkNames: { [key: number]: string } = {
      1: "Ethereum Mainnet",
      11155111: "Ethereum Sepolia", 
      4202: "Lisk Sepolia",
      137: "Polygon Mainnet",
      80002: "Polygon Amoy",
    };
    
    return networkNames[chainIdDecimal] || `Network ${chainIdDecimal}`;
  } catch (error) {
    console.error("Failed to get network name:", error);
    return "Unknown";
  }
};

/**
 * Listen for network changes
 */
export const onNetworkChange = (callback: (chainId: string) => void) => {
  if (!window.ethereum) return;
  
  window.ethereum.on("chainChanged", callback);
  
  // Return cleanup function
  return () => {
    if (window.ethereum?.removeListener) {
      window.ethereum.removeListener("chainChanged", callback);
    }
  };
};