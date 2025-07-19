import XellarSDK, { TransactionResult } from "./XellarIntegration";
import { CONTRACT_ADDRESSES } from "../constants";
import { 
  parseTokenAmount, 
  parseContractError,
  isValidAddress 
} from "../utils/contractUtils";

// Enhanced transaction result for contract operations
interface ContractTransactionResult extends TransactionResult {
  transactionHash?: string;
  blockNumber?: number;
  gasUsed?: bigint;
  contractAddress?: string;
  tokenId?: bigint;
  eventId?: bigint;
}

class TransactionService {
  private sdk: XellarSDK;

  constructor() {
    this.sdk = XellarSDK.getInstance();
  }

  private validateAddress(address: string): boolean {
    return isValidAddress(address);
  }

  private handleContractError(error: any): ContractTransactionResult {
    console.error("Contract transaction failed:", error);
    return {
      success: false,
      error: parseContractError(error),
    };
  }

  /**
   * Send IDRX payment to address
   * @param address Recipient address
   * @param amount Amount in IDRX tokens
   * @param tokenType Token type (default: IDRX)
   * @returns Transaction result
   */
  public async sendPayment(
    address: string,
    amount: number,
    tokenType: string = "IDRX"
  ): Promise<ContractTransactionResult> {
    try {
      if (!this.validateAddress(address)) {
        return {
          success: false,
          error: "Invalid recipient address",
        };
      }

      const result = await this.sdk.sendTransaction({
        to: address,
        amount,
        tokenType,
      });

      return {
        ...result,
        transactionHash: result.transactionHash,
      };
    } catch (error) {
      return this.handleContractError(error);
    }
  }

  /**
   * Purchase tickets for an event
   * @param eventAddress Event contract address
   * @param tierId Ticket tier ID
   * @param quantity Number of tickets
   * @param pricePerTicket Price per ticket in IDRX
   * @returns Transaction result with token IDs
   */
  public async buyTicket(
    eventAddress: string,
    tierId: number,
    quantity: number,
    pricePerTicket: number
  ): Promise<ContractTransactionResult> {
    try {
      if (!this.validateAddress(eventAddress)) {
        return {
          success: false,
          error: "Invalid event contract address",
        };
      }

      if (quantity <= 0 || quantity > 10) {
        return {
          success: false,
          error: "Invalid ticket quantity (1-10 allowed)",
        };
      }

      const totalAmount = pricePerTicket * quantity;
      const totalAmountWei = parseTokenAmount(totalAmount.toString());

      // First, approve IDRX spending
      const approveResult = await this.sdk.sendTransaction({
        to: CONTRACT_ADDRESSES.MockIDRX,
        amount: 0,
        tokenType: "IDRX",
        data: JSON.stringify({
          action: "approve",
          spender: eventAddress,
          amount: totalAmountWei.toString(),
        }),
      });

      if (!approveResult.success) {
        return {
          success: false,
          error: "Failed to approve IDRX spending",
        };
      }

      // Then, purchase tickets
      const purchaseResult = await this.sdk.sendTransaction({
        to: eventAddress,
        amount: 0, // Amount is handled by contract
        tokenType: "IDRX",
        data: JSON.stringify({
          action: "purchaseTicket",
          tierId: tierId,
          quantity: quantity,
        }),
      });

      return {
        ...purchaseResult,
        transactionHash: purchaseResult.transactionHash,
      };
    } catch (error) {
      return this.handleContractError(error);
    }
  }

  /**
   * List a ticket for resale
   * @param eventAddress Event contract address
   * @param tokenId NFT token ID
   * @param resalePrice Price for resale in IDRX
   * @returns Transaction result
   */
  public async resellTicket(
    eventAddress: string,
    tokenId: bigint,
    resalePrice: number
  ): Promise<ContractTransactionResult> {
    try {
      if (!this.validateAddress(eventAddress)) {
        return {
          success: false,
          error: "Invalid event contract address",
        };
      }

      if (resalePrice <= 0) {
        return {
          success: false,
          error: "Invalid resale price",
        };
      }

      const priceWei = parseTokenAmount(resalePrice.toString());

      const result = await this.sdk.sendTransaction({
        to: eventAddress,
        amount: 0,
        tokenType: "IDRX",
        data: JSON.stringify({
          action: "listTicketForResale",
          tokenId: tokenId.toString(),
          price: priceWei.toString(),
        }),
      });

      return {
        ...result,
        transactionHash: result.transactionHash,
        tokenId,
      };
    } catch (error) {
      return this.handleContractError(error);
    }
  }

  /**
   * Transfer a ticket NFT to another address
   * @param nftAddress NFT contract address
   * @param tokenId Token ID to transfer
   * @param toAddress Recipient address
   * @returns Transaction result
   */
  public async transferTicket(
    nftAddress: string,
    tokenId: bigint,
    toAddress: string
  ): Promise<ContractTransactionResult> {
    try {
      if (!this.validateAddress(nftAddress) || !this.validateAddress(toAddress)) {
        return {
          success: false,
          error: "Invalid contract or recipient address",
        };
      }

      const result = await this.sdk.sendTransaction({
        to: nftAddress,
        amount: 0,
        tokenType: "IDRX",
        data: JSON.stringify({
          action: "transferFrom",
          tokenId: tokenId.toString(),
          to: toAddress,
        }),
      });

      return {
        ...result,
        transactionHash: result.transactionHash,
        tokenId,
      };
    } catch (error) {
      return this.handleContractError(error);
    }
  }

  /**
   * Purchase a resale ticket
   * @param eventAddress Event contract address
   * @param tokenId Token ID to purchase
   * @param price Purchase price in IDRX
   * @returns Transaction result
   */
  public async buyResaleTicket(
    eventAddress: string,
    tokenId: bigint,
    price: number
  ): Promise<ContractTransactionResult> {
    try {
      if (!this.validateAddress(eventAddress)) {
        return {
          success: false,
          error: "Invalid event contract address",
        };
      }

      const priceWei = parseTokenAmount(price.toString());

      // First, approve IDRX spending
      const approveResult = await this.sdk.sendTransaction({
        to: CONTRACT_ADDRESSES.MockIDRX,
        amount: 0,
        tokenType: "IDRX",
        data: JSON.stringify({
          action: "approve",
          spender: eventAddress,
          amount: priceWei.toString(),
        }),
      });

      if (!approveResult.success) {
        return {
          success: false,
          error: "Failed to approve IDRX spending",
        };
      }

      // Then, purchase resale ticket
      const purchaseResult = await this.sdk.sendTransaction({
        to: eventAddress,
        amount: 0,
        tokenType: "IDRX",
        data: JSON.stringify({
          action: "purchaseResaleTicket",
          tokenId: tokenId.toString(),
        }),
      });

      return {
        ...purchaseResult,
        transactionHash: purchaseResult.transactionHash,
        tokenId,
      };
    } catch (error) {
      return this.handleContractError(error);
    }
  }

  /**
   * Cancel a resale listing
   * @param eventAddress Event contract address
   * @param tokenId Token ID to cancel
   * @returns Transaction result
   */
  public async cancelResaleListing(
    eventAddress: string,
    tokenId: bigint
  ): Promise<ContractTransactionResult> {
    try {
      if (!this.validateAddress(eventAddress)) {
        return {
          success: false,
          error: "Invalid event contract address",
        };
      }

      const result = await this.sdk.sendTransaction({
        to: eventAddress,
        amount: 0,
        tokenType: "IDRX",
        data: JSON.stringify({
          action: "cancelResaleListing",
          tokenId: tokenId.toString(),
        }),
      });

      return {
        ...result,
        transactionHash: result.transactionHash,
        tokenId,
      };
    } catch (error) {
      return this.handleContractError(error);
    }
  }

  /**
   * Burn a ticket NFT to generate QR code (Algorithm 1)
   * @param nftAddress NFT contract address
   * @param tokenId Token ID to burn
   * @returns Transaction result with QR code
   */
  public async burnTicketForQR(
    nftAddress: string,
    tokenId: bigint
  ): Promise<ContractTransactionResult> {
    try {
      if (!this.validateAddress(nftAddress)) {
        return {
          success: false,
          error: "Invalid NFT contract address",
        };
      }

      const result = await this.sdk.sendTransaction({
        to: nftAddress,
        amount: 0,
        tokenType: "IDRX",
        data: JSON.stringify({
          action: "burn",
          tokenId: tokenId.toString(),
        }),
      });

      return {
        ...result,
        transactionHash: result.transactionHash,
        tokenId,
      };
    } catch (error) {
      return this.handleContractError(error);
    }
  }
}

export default TransactionService;
export type { ContractTransactionResult };
