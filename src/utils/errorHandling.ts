// src/utils/errorHandling.ts
import { ContractFunctionExecutionError } from "viem";

/**
 * Configuration for retry operations
 */
export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number; // in milliseconds
  maxDelay: number; // in milliseconds
  backoffMultiplier: number;
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
};

/**
 * Error types that we can retry
 */
export const RETRYABLE_ERROR_PATTERNS = [
  /network/i,
  /timeout/i,
  /connection/i,
  /provider/i,
  /rpc/i,
  /temporary/i,
  /rate limit/i,
  /too many requests/i,
] as const;

/**
 * Determines if an error is retryable
 */
export const isRetryableError = (error: any): boolean => {
  const errorMessage = error?.message || error?.toString() || '';
  
  // Check if error message matches retryable patterns
  return RETRYABLE_ERROR_PATTERNS.some(pattern => 
    pattern.test(errorMessage)
  );
};

/**
 * Calculates delay for exponential backoff with jitter
 */
export const calculateBackoffDelay = (
  attempt: number, 
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): number => {
  const exponentialDelay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
  const jitteredDelay = exponentialDelay * (0.5 + Math.random() * 0.5); // Add 0-50% jitter
  return Math.min(jitteredDelay, config.maxDelay);
};

/**
 * Executes a function with retry logic
 */
export const withRetry = async <T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  onRetry?: (attempt: number, error: any) => void
): Promise<T> => {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: any;

  for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry if it's the last attempt or error is not retryable
      if (attempt === retryConfig.maxAttempts || !isRetryableError(error)) {
        break;
      }

      const delay = calculateBackoffDelay(attempt, retryConfig);
      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms:`, error);
      
      if (onRetry) {
        onRetry(attempt, error);
      }

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

/**
 * Enhanced error parser for contract errors
 */
export const parseContractError = (error: any): string => {
  // Handle Viem contract errors
  if (error instanceof ContractFunctionExecutionError) {
    const cause = error.cause as any; // Type assertion for cause properties
    
    if (cause?.reason) {
      return `Contract error: ${cause.reason}`;
    }
    
    if (cause?.shortMessage) {
      return cause.shortMessage;
    }
  }

  // Handle common blockchain errors
  if (error?.message) {
    const message = error.message;
    
    // User rejected transaction
    if (message.includes('User rejected') || message.includes('user rejected')) {
      return 'Transaction was cancelled by user';
    }
    
    // Insufficient funds
    if (message.includes('insufficient funds')) {
      return 'Insufficient funds for this transaction';
    }
    
    // Gas estimation failed
    if (message.includes('gas') && message.includes('estimate')) {
      return 'Transaction may fail. Please check your inputs and try again';
    }
    
    // Network errors
    if (message.includes('network') || message.includes('connection')) {
      return 'Network connection error. Please check your internet connection';
    }
    
    // RPC errors
    if (message.includes('RPC') || message.includes('provider')) {
      return 'Blockchain network error. Please try again later';
    }
    
    // Contract-specific errors
    if (message.includes('revert')) {
      return 'Transaction reverted. Please check your inputs and try again';
    }
    
    return message;
  }

  // Fallback
  return 'An unexpected error occurred. Please try again';
};

/**
 * Creates a user-friendly error notification object
 */
export interface ErrorNotification {
  title: string;
  description: string;
  status: 'error' | 'warning' | 'info';
  isRetryable: boolean;
  duration?: number;
}

export const createErrorNotification = (error: any): ErrorNotification => {
  const isRetryable = isRetryableError(error);
  const description = parseContractError(error);
  
  // Determine severity and title based on error type
  let title = 'Error';
  let status: 'error' | 'warning' | 'info' = 'error';
  
  if (description.includes('cancelled by user') || description.includes('rejected')) {
    title = 'Transaction Cancelled';
    status = 'info';
  } else if (description.includes('insufficient funds')) {
    title = 'Insufficient Funds';
    status = 'warning';
  } else if (description.includes('network') || description.includes('connection')) {
    title = 'Network Error';
    status = 'warning';
  } else if (isRetryable) {
    title = 'Temporary Error';
    status = 'warning';
  }

  return {
    title,
    description,
    status,
    isRetryable,
    duration: status === 'info' ? 3000 : 5000,
  };
};

/**
 * Wrapper for contract operations with enhanced error handling
 */
export const executeContractOperation = async <T>(
  operation: () => Promise<T>,
  operationName: string,
  config?: Partial<RetryConfig>
): Promise<T> => {
  console.log(`🔄 Executing ${operationName}...`);
  
  try {
    const result = await withRetry(
      operation,
      config,
      (attempt, error) => {
        console.warn(`📱 ${operationName} attempt ${attempt} failed:`, error);
      }
    );
    
    console.log(`✅ ${operationName} completed successfully`);
    return result;
  } catch (error) {
    console.error(`❌ ${operationName} failed:`, error);
    throw error;
  }
};

/**
 * Transaction timeout wrapper
 */
export const withTimeout = <T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string = 'Operation timed out'
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
    ),
  ]);
};

/**
 * Safe operation wrapper that catches all errors
 */
export const safeOperation = async <T>(
  operation: () => Promise<T>,
  fallbackValue: T,
  onError?: (error: any) => void
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    if (onError) {
      onError(error);
    } else {
      console.error('Safe operation failed:', error);
    }
    return fallbackValue;
  }
};