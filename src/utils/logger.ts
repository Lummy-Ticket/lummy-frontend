// Logger utility with controlled verbosity
import { DEVELOPMENT_CONFIG } from '../constants';

export const logger = {
  // Always log important information
  info: (message: string, ...args: any[]) => {
    console.log(message, ...args);
  },

  // Only log if verbose mode is enabled
  verbose: (message: string, ...args: any[]) => {
    if (DEVELOPMENT_CONFIG.LOG_VERBOSE) {
      console.log(message, ...args);
    }
  },

  // Contract-related logs (controlled by LOG_CONTRACT_CALLS)
  contract: (message: string, ...args: any[]) => {
    if (DEVELOPMENT_CONFIG.LOG_CONTRACT_CALLS) {
      console.log(message, ...args);
    }
  },

  // Error logs (always shown)
  error: (message: string, ...args: any[]) => {
    console.error(message, ...args);
  },

  // Warning logs (always shown)
  warn: (message: string, ...args: any[]) => {
    console.warn(message, ...args);
  },

  // Debug logs (only in development)
  debug: (message: string, ...args: any[]) => {
    if (import.meta.env.DEV) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }
};