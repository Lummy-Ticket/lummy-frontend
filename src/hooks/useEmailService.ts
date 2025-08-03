// src/hooks/useEmailService.ts
import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import CryptoJS from 'crypto-js';
import { supabase, isSupabaseAvailable, UserEmailMapping, InsertUserEmailMapping } from '../lib/supabase';
import { EmailService } from '../services/EmailService';

// Hook interface
export interface UseEmailServiceReturn {
  // State
  loading: boolean;
  error: string | null;
  userEmail: UserEmailMapping | null;
  isEmailVerified: boolean;
  
  // Email management
  checkEmailExists: () => Promise<UserEmailMapping | null>;
  submitEmail: (email: string) => Promise<boolean>;
  verifyEmail: (verificationCode: string) => Promise<boolean>;
  updateNotificationPreferences: (preferences: Partial<UserEmailMapping['notification_preferences']>) => Promise<boolean>;
  
  // Notifications
  sendTicketPurchaseNotification: (data: {
    eventName: string;
    tierName: string;
    quantity: number;
    totalPrice: number;
    currency: string;
    transactionHash: string;
    eventDate: string;
    venue: string;
    eventId?: string;
  }) => Promise<boolean>;
  
  // Utility
  resendVerificationCode: () => Promise<boolean>;
}

export const useEmailService = (): UseEmailServiceReturn => {
  const { address } = useAccount();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<UserEmailMapping | null>(null);

  // Derived state
  const isEmailVerified = userEmail?.email_verified || false;

  // Generate verification code
  const generateVerificationCode = useCallback((): string => {
    return Math.random().toString().slice(2, 8).padStart(6, '0');
  }, []);

  // Hash verification code for storage
  const hashVerificationCode = useCallback((code: string): string => {
    return CryptoJS.SHA256(code).toString();
  }, []);

  // Check if email exists for current wallet
  const checkEmailExists = useCallback(async (): Promise<UserEmailMapping | null> => {
    if (!address) {
      setError('Wallet not connected');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // Check if Supabase is available
      if (!isSupabaseAvailable()) {
        console.log('🔄 Supabase not available, checking localStorage');
        
        // Fall back to localStorage in development or when Supabase is not configured
        const localData = localStorage.getItem(`email_${address.toLowerCase()}`);
        if (localData) {
          try {
            const data = JSON.parse(localData);
            const emailData: UserEmailMapping = {
              id: 'local',
              wallet_address: data.wallet_address,
              email: data.email,
              email_verified: data.email_verified,
              notification_preferences: data.notification_preferences || {
                ticket_purchase: true,
                ticket_resale: true,
                event_reminders: true,
                price_alerts: false,
                marketing: false,
              },
              created_at: data.created_at || new Date().toISOString(),
              updated_at: data.updated_at || new Date().toISOString(),
            };
            
            setUserEmail(emailData);
            return emailData;
          } catch (e) {
            console.warn('Failed to parse localStorage email data');
          }
        }
        
        setUserEmail(null);
        return null;
      }

      const { data, error: supabaseError } = await supabase!
        .from('user_email_mapping')
        .select('*')
        .eq('wallet_address', address.toLowerCase())
        .single();

      if (supabaseError && supabaseError.code !== 'PGRST116') { // PGRST116 is "not found"
        throw supabaseError;
      }

      const emailData = data as UserEmailMapping | null;
      setUserEmail(emailData);
      return emailData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check email';
      console.warn('🚨 Supabase connection error:', errorMessage);
      console.warn('💡 This is expected if database is not set up. Email system will work in local-only mode.');
      
      // In development, continue without database
      setError(null); // Don't show error to user
      setUserEmail(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [address]);

  // Submit email for verification
  const submitEmail = useCallback(async (email: string): Promise<boolean> => {
    if (!address) {
      setError('Wallet not connected');
      return false;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      // Generate verification code and hash
      const verificationCode = generateVerificationCode();
      
      // Check if Supabase is available - if not, use localStorage mode
      if (!isSupabaseAvailable()) {
        console.log('🔄 Supabase not available, using localStorage mode');
        
        // Send email (will show in console for development)
        await EmailService.sendEmailVerification({
          to: email,
          walletAddress: address,
          verificationCode,
          expiresInHours: 24,
        });

        // Store in localStorage
        const devData = {
          email: email.toLowerCase(),
          wallet_address: address.toLowerCase(),
          email_verified: false,
          verification_code: verificationCode,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          notification_preferences: {
            ticket_purchase: true,
            ticket_resale: true,
            event_reminders: true,
            price_alerts: false,
            marketing: false,
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        localStorage.setItem(`email_${address.toLowerCase()}`, JSON.stringify(devData));
        return true;
      }

      // Supabase is available, use normal flow
      const hashedCode = hashVerificationCode(verificationCode);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Prepare data for insert/update
      const emailData: InsertUserEmailMapping = {
        wallet_address: address.toLowerCase(),
        email: email.toLowerCase(),
        email_verified: false,
        verification_token: hashedCode,
        verification_expires_at: expiresAt.toISOString(),
        notification_preferences: {
          ticket_purchase: true,
          ticket_resale: true,
          event_reminders: true,
          price_alerts: false,
          marketing: false,
        },
      };

      // Upsert email mapping
      const { data, error: supabaseError } = await supabase!
        .from('user_email_mapping')
        .upsert(emailData, { 
          onConflict: 'wallet_address',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (supabaseError) {
        throw supabaseError;
      }

      // Send verification email
      const emailSent = await EmailService.sendEmailVerification({
        to: email,
        walletAddress: address,
        verificationCode,
        expiresInHours: 24,
      });

      if (!emailSent) {
        console.warn('Email verification sending failed, but database was updated');
      }

      setUserEmail(data as UserEmailMapping);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit email';
      console.warn('🚨 Supabase error in submitEmail:', errorMessage);
      
      const isDevelopment = import.meta.env.DEV;
      if (isDevelopment) {
        console.warn('💡 Development mode: Continuing with local-only verification');
        
        // Generate verification code for development
        const verificationCode = generateVerificationCode();
        
        // Send email (will show in console)
        await EmailService.sendEmailVerification({
          to: email,
          walletAddress: address,
          verificationCode,
          expiresInHours: 24,
        });
        
        // Store in localStorage for development
        const devData = {
          email: email.toLowerCase(),
          wallet_address: address.toLowerCase(),
          email_verified: false,
          verification_code: verificationCode,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        };
        localStorage.setItem(`email_${address.toLowerCase()}`, JSON.stringify(devData));
        
        return true; // Success in development mode
      }
      
      setError(errorMessage);
      console.error('Submit email error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [address, generateVerificationCode, hashVerificationCode]);

  // Verify email with code
  const verifyEmail = useCallback(async (verificationCode: string): Promise<boolean> => {
    if (!address) {
      setError('Wallet not connected');
      return false;
    }

    // Development mode - check localStorage if no userEmail from Supabase
    const isDevelopment = import.meta.env.DEV;
    let emailData = userEmail;
    
    if (!emailData && isDevelopment) {
      const localData = localStorage.getItem(`email_${address.toLowerCase()}`);
      if (localData) {
        emailData = JSON.parse(localData);
        console.log('💡 Using localStorage data for verification:', emailData);
      }
    }

    if (!emailData) {
      setError('Email not submitted yet');
      return false;
    }

    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit verification code');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      // Development mode - simple code check
      if (isDevelopment && !userEmail) {
        // Check against localStorage data
        if (emailData && 'verification_code' in emailData) {
          if (emailData.verification_code !== verificationCode) {
            setError('Invalid verification code');
            return false;
          }
          
          // Check expiration
          if ((emailData as any).expires_at && new Date((emailData as any).expires_at) < new Date()) {
            setError('Verification code has expired. Please request a new one.');
            return false;
          }
          
          // Mark as verified in localStorage
          const updatedData = { ...emailData, email_verified: true };
          localStorage.setItem(`email_${address.toLowerCase()}`, JSON.stringify(updatedData));
          setUserEmail(updatedData as UserEmailMapping);
          // console.log('✅ Email verified in development mode');
          return true;
        }
      }

      // Normal Supabase flow
      if (!userEmail) {
        setError('Email data not available');
        return false;
      }

      // Hash the provided code
      const hashedCode = hashVerificationCode(verificationCode);

      // Check if code matches and hasn't expired
      if (userEmail.verification_token !== hashedCode) {
        setError('Invalid verification code');
        return false;
      }

      if (userEmail.verification_expires_at && new Date(userEmail.verification_expires_at) < new Date()) {
        setError('Verification code has expired. Please request a new one.');
        return false;
      }

      // Update email as verified (only if Supabase is available)
      if (!isSupabaseAvailable()) {
        console.log('💡 Supabase not available, updating localStorage');
        // Update localStorage
        const localData = localStorage.getItem(`email_${address.toLowerCase()}`);
        if (localData) {
          const updatedData = { ...JSON.parse(localData), email_verified: true };
          localStorage.setItem(`email_${address.toLowerCase()}`, JSON.stringify(updatedData));
        }
        setUserEmail({ ...userEmail, email_verified: true });
        return true;
      }

      const { data, error: supabaseError } = await supabase!
        .from('user_email_mapping')
        .update({
          email_verified: true,
          verification_token: null,
          verification_expires_at: null,
        })
        .eq('wallet_address', address.toLowerCase())
        .select()
        .single();

      if (supabaseError) {
        throw supabaseError;
      }

      setUserEmail(data as UserEmailMapping);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to verify email';
      setError(errorMessage);
      console.error('Verify email error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [address, userEmail, hashVerificationCode]);

  // Resend verification code
  const resendVerificationCode = useCallback(async (): Promise<boolean> => {
    if (!userEmail || !address) {
      setError('Email not submitted yet');
      return false;
    }

    return await submitEmail(userEmail.email);
  }, [userEmail, address, submitEmail]);

  // Update notification preferences
  const updateNotificationPreferences = useCallback(async (
    preferences: Partial<UserEmailMapping['notification_preferences']>
  ): Promise<boolean> => {
    if (!address || !userEmail) {
      setError('Email not set up yet');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const updatedPreferences = {
        ...userEmail.notification_preferences,
        ...preferences,
      };

      // Check if Supabase is available
      if (!isSupabaseAvailable()) {
        console.log('💡 Supabase not available, updating localStorage preferences');
        // Update localStorage
        const localData = localStorage.getItem(`email_${address.toLowerCase()}`);
        if (localData) {
          const updatedData = { ...JSON.parse(localData), notification_preferences: updatedPreferences };
          localStorage.setItem(`email_${address.toLowerCase()}`, JSON.stringify(updatedData));
        }
        setUserEmail({ ...userEmail, notification_preferences: updatedPreferences });
        return true;
      }

      const { data, error: supabaseError } = await supabase!
        .from('user_email_mapping')
        .update({ notification_preferences: updatedPreferences })
        .eq('wallet_address', address.toLowerCase())
        .select()
        .single();

      if (supabaseError) {
        throw supabaseError;
      }

      setUserEmail(data as UserEmailMapping);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update preferences';
      setError(errorMessage);
      console.error('Update preferences error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [address, userEmail]);

  // Send ticket purchase notification
  const sendTicketPurchaseNotification = useCallback(async (data: {
    eventName: string;
    tierName: string;
    quantity: number;
    totalPrice: number;
    currency: string;
    transactionHash: string;
    eventDate: string;
    venue: string;
    eventId?: string;
  }): Promise<boolean> => {
    if (!address || !userEmail || !isEmailVerified) {
      console.warn('Email not verified - skipping notification');
      return false;
    }

    if (!userEmail.notification_preferences.ticket_purchase) {
      console.log('Ticket purchase notifications disabled for user');
      return false;
    }

    try {
      // Send email
      const emailSent = await EmailService.sendTicketPurchaseConfirmation({
        to: userEmail.email,
        walletAddress: address,
        ...data,
      });

      // Log notification history (only if Supabase is available)
      if (isSupabaseAvailable()) {
        const historyData = {
          wallet_address: address.toLowerCase(),
          email: userEmail.email,
          notification_type: 'ticket_purchase' as const,
          event_id: data.eventId,
          transaction_hash: data.transactionHash,
          event_data: data,
          email_sent: emailSent,
          sent_at: emailSent ? new Date().toISOString() : undefined,
          error_message: emailSent ? undefined : 'Failed to send email',
        };

        await supabase!
          .from('notification_history')
          .insert(historyData);
      } else {
        console.log('💡 Supabase not available, skipping notification history');
      }

      return emailSent;
    } catch (err) {
      console.error('Send ticket purchase notification error:', err);
      return false;
    }
  }, [address, userEmail, isEmailVerified]);

  return {
    // State
    loading,
    error,
    userEmail,
    isEmailVerified,
    
    // Email management
    checkEmailExists,
    submitEmail,
    verifyEmail,
    updateNotificationPreferences,
    
    // Notifications
    sendTicketPurchaseNotification,
    
    // Utility
    resendVerificationCode,
  };
};