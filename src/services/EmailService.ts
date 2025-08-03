// src/services/EmailService.ts
import { Resend } from 'resend';

// Environment variables
const resendApiKey = import.meta.env.VITE_RESEND_API_KEY;
const fromEmail = import.meta.env.VITE_FROM_EMAIL || 'onboarding@resend.dev';
const frontendUrl = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173';

// Initialize Resend (conditional for client-side usage)
let resend: Resend | null = null;
if (resendApiKey) {
  resend = new Resend(resendApiKey);
}

// Email template interfaces
export interface EmailVerificationTemplate {
  to: string;
  walletAddress: string;
  verificationCode: string;
  expiresInHours: number;
}

export interface TicketPurchaseTemplate {
  to: string;
  walletAddress: string;
  eventName: string;
  tierName: string;
  quantity: number;
  totalPrice: number;
  currency: string;
  transactionHash: string;
  eventDate: string;
  venue: string;
}

export interface TicketResaleTemplate {
  to: string;
  walletAddress: string;
  eventName: string;
  tierName: string;
  resalePrice: number;
  platformFee: number;
  netAmount: number;
  currency: string;
  transactionHash: string;
}

// Email templates
export const EMAIL_TEMPLATES = {
  emailVerification: (data: EmailVerificationTemplate) => ({
    from: fromEmail,
    to: data.to,
    subject: '🔐 Verify Your Email for Lummy',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification - Lummy</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 32px; font-weight: bold; color: #6B46C1; margin-bottom: 10px; }
            .verification-code { background: #6B46C1; color: white; padding: 20px; border-radius: 8px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 4px; margin: 30px 0; }
            .wallet-info { background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0; font-family: monospace; font-size: 14px; }
            .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #666; }
            .button { display: inline-block; background: #6B46C1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🎫 LUMMY</div>
              <h1>Email Verification</h1>
              <p>Welcome to Lummy! Please verify your email to enable notifications.</p>
            </div>

            <div class="wallet-info">
              <strong>Wallet Address:</strong><br>
              ${data.walletAddress}
            </div>

            <p>Enter this verification code in the app:</p>
            
            <div class="verification-code">
              ${data.verificationCode}
            </div>

            <p><strong>Important:</strong></p>
            <ul>
              <li>This code expires in ${data.expiresInHours} hours</li>
              <li>Only use this code if you requested it</li>
              <li>Never share this code with anyone</li>
            </ul>

            <div class="footer">
              <p>If you didn't request this verification, please ignore this email.</p>
              <p>Need help? Contact us at <a href="mailto:support@lummy.app">support@lummy.app</a></p>
              <p>&copy; 2025 Lummy. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  ticketPurchase: (data: TicketPurchaseTemplate) => ({
    from: fromEmail,
    to: data.to,
    subject: `🎫 Ticket Purchase Confirmed - ${data.eventName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Ticket Purchase Confirmed - Lummy</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 32px; font-weight: bold; color: #6B46C1; margin-bottom: 10px; }
            .ticket-details { background: #F0FDF4; border: 2px solid #16A34A; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .detail-label { font-weight: bold; }
            .transaction-hash { background: #F3F4F6; padding: 10px; border-radius: 6px; font-family: monospace; font-size: 12px; word-break: break-all; margin: 15px 0; }
            .button { display: inline-block; background: #6B46C1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🎫 LUMMY</div>
              <h1>🎉 Ticket Purchase Confirmed!</h1>
              <p>Your tickets have been successfully purchased and are now available in your wallet.</p>
            </div>

            <div class="ticket-details">
              <h3>📋 Ticket Details</h3>
              <div class="detail-row">
                <span class="detail-label">Event:</span>
                <span>${data.eventName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Tier:</span>
                <span>${data.tierName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Quantity:</span>
                <span>${data.quantity} ticket${data.quantity > 1 ? 's' : ''}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Total Paid:</span>
                <span><strong>${data.totalPrice.toLocaleString()} ${data.currency}</strong></span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Event Date:</span>
                <span>${new Date(data.eventDate).toLocaleDateString()}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Venue:</span>
                <span>${data.venue}</span>
              </div>
            </div>

            <div class="transaction-hash">
              <strong>Transaction Hash:</strong><br>
              <a href="https://sepolia-blockscout.lisk.com/tx/${data.transactionHash}" target="_blank">${data.transactionHash}</a>
            </div>

            <div style="text-align: center;">
              <a href="${frontendUrl}/my-tickets" class="button">View My Tickets</a>
            </div>

            <div style="background: #FEF3C7; border: 1px solid #F59E0B; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>📱 Next Steps:</strong></p>
              <ul>
                <li>Your tickets are stored as NFTs in your wallet</li>
                <li>No need to print anything - just bring your phone</li>
                <li>Tickets can be transferred or resold anytime</li>
                <li>Check-in will be via QR code scan at the venue</li>
              </ul>
            </div>

            <div class="footer">
              <p>Questions about your tickets? Contact us at <a href="mailto:support@lummy.app">support@lummy.app</a></p>
              <p>&copy; 2025 Lummy. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),
};

// Development mode check
const isDevelopment = import.meta.env.DEV;

// Debug: log environment mode on service load (only once)
// console.log('📧 EmailService loaded - Development mode:', isDevelopment);

// Email service functions
export class EmailService {
  static async sendEmailVerification(data: EmailVerificationTemplate): Promise<boolean> {
    // Development mode - log to console instead of sending email
    if (isDevelopment) {
      console.log('🔐 DEV MODE - Email Verification Code:', data.verificationCode);
      console.log('📧 Would send to:', data.to);
      console.log('👤 Wallet:', data.walletAddress);
      
      // Auto-fill verification code in modal after 2 seconds
      setTimeout(() => {
        console.log('📤 Dispatching auto-fill event with code:', data.verificationCode);
        const event = new CustomEvent('devVerificationCode', {
          detail: { code: data.verificationCode }
        });
        window.dispatchEvent(event);
        console.log('✨ Auto-fill event dispatched!');
      }, 2000);
      
      return true; // Simulate successful send
    }

    if (!resend) {
      console.warn('Resend not initialized - email verification skipped');
      return false;
    }

    try {
      const emailData = EMAIL_TEMPLATES.emailVerification(data);
      const result = await resend.emails.send(emailData);
      
      if (result.error) {
        console.error('Email verification send failed:', result.error);
        return false;
      }

      console.log('Email verification sent successfully:', result.data?.id);
      return true;
    } catch (error) {
      console.error('Email verification send error:', error);
      return false;
    }
  }

  static async sendTicketPurchaseConfirmation(data: TicketPurchaseTemplate): Promise<boolean> {
    // Development mode - log to console instead of sending email
    if (isDevelopment) {
      console.log('🎫 DEV MODE - Ticket Purchase Notification');
      console.log('📧 Would send to:', data.to);
      console.log('🎪 Event:', data.eventName);
      console.log('🎟️ Tier:', data.tierName);
      console.log('📊 Quantity:', data.quantity);
      console.log('💰 Total:', data.totalPrice, data.currency);
      console.log('🔗 Transaction:', data.transactionHash);
      return true; // Simulate successful send
    }

    if (!resend) {
      console.warn('Resend not initialized - ticket purchase email skipped');
      return false;
    }

    try {
      const emailData = EMAIL_TEMPLATES.ticketPurchase(data);
      const result = await resend.emails.send(emailData);
      
      if (result.error) {
        console.error('Ticket purchase email send failed:', result.error);
        return false;
      }

      console.log('Ticket purchase email sent successfully:', result.data?.id);
      return true;
    } catch (error) {
      console.error('Ticket purchase email send error:', error);
      return false;
    }
  }

  // Add more email methods as needed...
}