import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import XellarSDK, {
  XellarWallet,
  WalletBalance,
} from "../services/XellarIntegration";
import { formatTokenAmount, parseTokenAmount } from "../utils/contractUtils";

// Enhanced balance interface for contract compatibility
interface ContractWalletBalance {
  IDRX: bigint;  // Balance in Wei
  LSK: bigint;   // Balance in Wei
  // Display formatted versions
  IDRXFormatted: string;
  LSKFormatted: string;
}

interface WalletContextType {
  wallet: XellarWallet | null;
  isConnecting: boolean;
  isConnected: boolean;
  balance: WalletBalance;  // Legacy balance (numbers)
  contractBalance: ContractWalletBalance;  // Contract-compatible balance (bigint)
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  // New contract-specific methods
  getIDRXBalance: () => bigint;
  getLSKBalance: () => bigint;
  hasMinimumBalance: (amount: bigint) => boolean;
  formatBalance: (amount: bigint, currency: 'IDRX' | 'LSK') => string;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [wallet, setWallet] = useState<XellarWallet | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [balance, setBalance] = useState<WalletBalance>({ IDRX: 0, LSK: 0 });
  const [contractBalance, setContractBalance] = useState<ContractWalletBalance>({
    IDRX: 0n,
    LSK: 0n,
    IDRXFormatted: "0",
    LSKFormatted: "0",
  });
  const sdk = XellarSDK.getInstance();

  useEffect(() => {
    // Register wallet listener
    const walletListener = (newWallet: XellarWallet | null) => {
      setWallet(newWallet);
    };

    sdk.addWalletListener(walletListener);

    // Check if wallet is already connected
    const checkConnection = async () => {
      const currentWallet = sdk.getWallet();
      if (currentWallet && currentWallet.isConnected) {
        setWallet(currentWallet);
        await refreshBalance();
      }
    };

    checkConnection();

    return () => {
      sdk.removeWalletListener(walletListener);
    };
  }, []);

  const connect = async () => {
    try {
      setIsConnecting(true);
      const connectedWallet = await sdk.connect();
      setWallet(connectedWallet);
      if (connectedWallet) {
        await refreshBalance();
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      await sdk.disconnect();
      setWallet(null);
      setBalance({ IDRX: 0, LSK: 0 });
      setContractBalance({
        IDRX: 0n,
        LSK: 0n,
        IDRXFormatted: "0",
        LSKFormatted: "0",
      });
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
    }
  };

  const refreshBalance = async () => {
    if (!wallet) return;

    try {
      const balances = await sdk.getAllBalances();
      setBalance(balances);
      
      // Convert to contract-compatible format
      const idrxWei = parseTokenAmount(balances.IDRX.toString());
      const lskWei = parseTokenAmount(balances.LSK.toString());
      
      setContractBalance({
        IDRX: idrxWei,
        LSK: lskWei,
        IDRXFormatted: formatTokenAmount(idrxWei),
        LSKFormatted: formatTokenAmount(lskWei),
      });
    } catch (error) {
      console.error("Failed to fetch balance:", error);
    }
  };

  // Contract-specific helper methods
  const getIDRXBalance = (): bigint => {
    return contractBalance.IDRX;
  };

  const getLSKBalance = (): bigint => {
    return contractBalance.LSK;
  };

  const hasMinimumBalance = (amount: bigint): boolean => {
    return contractBalance.IDRX >= amount;
  };

  const formatBalance = (amount: bigint, currency: 'IDRX' | 'LSK'): string => {
    const formatted = formatTokenAmount(amount);
    return `${formatted} ${currency}`;
  };

  const value = {
    wallet,
    isConnecting,
    isConnected: !!wallet,
    balance,
    contractBalance,
    connect,
    disconnect,
    refreshBalance,
    getIDRXBalance,
    getLSKBalance,
    hasMinimumBalance,
    formatBalance,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};

export const useWalletContext = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWalletContext must be used within a WalletProvider");
  }
  return context;
};
