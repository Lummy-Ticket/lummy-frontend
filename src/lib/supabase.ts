// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Environment variables with fallbacks for production deployment
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Development mode: Allow missing Supabase env variables
const isDevelopment = import.meta.env.DEV;
const isSupabaseEnabled = supabaseUrl && supabaseAnonKey;

if (!isSupabaseEnabled && !isDevelopment) {
  console.warn('⚠️ Supabase environment variables missing - email features disabled');
}

// Create Supabase client only if environment variables are available
export const supabase = isSupabaseEnabled 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false, // We don't need Supabase auth, just database access
      },
    })
  : null;

// Helper function to check if Supabase is available
export const isSupabaseAvailable = () => {
  return supabase !== null;
};

// Database Types
export interface UserEmailMapping {
  id: string;
  wallet_address: string;
  email: string;
  email_verified: boolean;
  verification_token?: string;
  verification_expires_at?: string;
  notification_preferences: {
    ticket_purchase: boolean;
    ticket_resale: boolean;
    event_reminders: boolean;
    price_alerts: boolean;
    marketing: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface NotificationHistory {
  id: string;
  wallet_address: string;
  email: string;
  notification_type: 'ticket_purchase' | 'ticket_resale' | 'event_reminder' | 'price_alert' | 'event_cancelled';
  event_id?: string;
  transaction_hash?: string;
  event_data?: Record<string, any>;
  email_sent: boolean;
  sent_at?: string;
  error_message?: string;
  created_at: string;
}

// Database operation types
export type InsertUserEmailMapping = Omit<UserEmailMapping, 'id' | 'created_at' | 'updated_at'>;
export type UpdateUserEmailMapping = Partial<Pick<UserEmailMapping, 'email' | 'email_verified' | 'verification_token' | 'verification_expires_at' | 'notification_preferences'>>;
export type InsertNotificationHistory = Omit<NotificationHistory, 'id' | 'created_at'>;