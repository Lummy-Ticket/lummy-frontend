// src/utils/qrGenerator.ts
import QRCode from 'qrcode';

/**
 * Interface for ticket QR code data
 */
export interface TicketQRData {
  tokenId: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  venue: string;
  tierName: string;
  ownerAddress: string;
  contractAddress: string;
  validationHash: string; // Hash for validation
  chainId: number;
}

/**
 * Interface for QR code generation options
 */
export interface QRCodeOptions {
  width?: number;
  height?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

/**
 * Default QR code options
 */
export const DEFAULT_QR_OPTIONS: QRCodeOptions = {
  width: 300,
  height: 300,
  margin: 2,
  color: {
    dark: '#000000',
    light: '#FFFFFF',
  },
  errorCorrectionLevel: 'M',
};

/**
 * Generates a validation hash for ticket data
 * This provides basic tamper detection for QR codes
 */
export const generateValidationHash = (data: Omit<TicketQRData, 'validationHash'>): string => {
  const dataString = JSON.stringify(data);
  // Simple hash function (in production, use a proper cryptographic hash)
  let hash = 0;
  for (let i = 0; i < dataString.length; i++) {
    const char = dataString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
};

/**
 * Creates ticket QR data object
 */
export const createTicketQRData = (
  tokenId: string,
  eventInfo: {
    id: string;
    name: string;
    date: string;
    venue: string;
  },
  tierName: string,
  ownerAddress: string,
  contractAddress: string,
  chainId: number = 4202 // Lisk Sepolia
): TicketQRData => {
  const baseData = {
    tokenId,
    eventId: eventInfo.id,
    eventName: eventInfo.name,
    eventDate: eventInfo.date,
    venue: eventInfo.venue,
    tierName,
    ownerAddress,
    contractAddress,
    chainId,
  };

  const validationHash = generateValidationHash(baseData);

  return {
    ...baseData,
    validationHash,
  };
};

/**
 * Generates QR code as base64 data URL
 */
export const generateQRCode = async (
  data: TicketQRData,
  options: QRCodeOptions = DEFAULT_QR_OPTIONS
): Promise<string> => {
  try {
    const qrOptions = { ...DEFAULT_QR_OPTIONS, ...options };
    const jsonData = JSON.stringify(data);
    
    return await QRCode.toDataURL(jsonData, {
      width: qrOptions.width,
      margin: qrOptions.margin,
      color: qrOptions.color,
      errorCorrectionLevel: qrOptions.errorCorrectionLevel,
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

/**
 * Generates QR code as SVG string
 */
export const generateQRCodeSVG = async (
  data: TicketQRData,
  options: QRCodeOptions = DEFAULT_QR_OPTIONS
): Promise<string> => {
  try {
    const qrOptions = { ...DEFAULT_QR_OPTIONS, ...options };
    const jsonData = JSON.stringify(data);
    
    return await QRCode.toString(jsonData, {
      type: 'svg',
      width: qrOptions.width,
      margin: qrOptions.margin,
      color: qrOptions.color,
      errorCorrectionLevel: qrOptions.errorCorrectionLevel,
    });
  } catch (error) {
    console.error('Error generating QR code SVG:', error);
    throw new Error('Failed to generate QR code SVG');
  }
};

/**
 * Validates QR code data integrity
 */
export const validateTicketQRData = (data: TicketQRData): boolean => {
  try {
    const { validationHash, ...baseData } = data;
    const expectedHash = generateValidationHash(baseData);
    return validationHash === expectedHash;
  } catch (error) {
    console.error('Error validating QR data:', error);
    return false;
  }
};

/**
 * Parses QR code data from JSON string
 */
export const parseQRCodeData = (qrString: string): TicketQRData | null => {
  try {
    const data = JSON.parse(qrString) as TicketQRData;
    
    // Validate required fields
    const requiredFields: (keyof TicketQRData)[] = [
      'tokenId', 'eventId', 'eventName', 'eventDate', 'venue',
      'tierName', 'ownerAddress', 'contractAddress', 'validationHash', 'chainId'
    ];
    
    for (const field of requiredFields) {
      if (!data[field]) {
        console.error(`Missing required field: ${field}`);
        return null;
      }
    }
    
    // Validate data integrity
    if (!validateTicketQRData(data)) {
      console.error('QR data validation failed');
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error parsing QR code data:', error);
    return null;
  }
};

/**
 * Generates a ticket validation URL with QR data
 */
export const generateValidationURL = (
  data: TicketQRData,
  baseURL: string = window.location.origin
): string => {
  const params = new URLSearchParams({
    tokenId: data.tokenId,
    eventId: data.eventId,
    hash: data.validationHash,
  });
  
  return `${baseURL}/validate-ticket?${params.toString()}`;
};

/**
 * Hook for generating ticket QR codes
 */
export const useTicketQRGenerator = () => {
  const generateTicketQR = async (
    tokenId: string,
    eventInfo: {
      id: string;
      name: string;
      date: string;
      venue: string;
    },
    tierName: string,
    ownerAddress: string,
    contractAddress: string,
    options?: QRCodeOptions
  ): Promise<{
    qrCode: string;
    qrData: TicketQRData;
    validationURL: string;
  }> => {
    try {
      // Create QR data
      const qrData = createTicketQRData(
        tokenId,
        eventInfo,
        tierName,
        ownerAddress,
        contractAddress
      );
      
      // Generate QR code
      const qrCode = await generateQRCode(qrData, options);
      
      // Generate validation URL
      const validationURL = generateValidationURL(qrData);
      
      return {
        qrCode,
        qrData,
        validationURL,
      };
    } catch (error) {
      console.error('Error in ticket QR generation:', error);
      throw error;
    }
  };

  return {
    generateTicketQR,
    parseQRCodeData,
    validateTicketQRData,
  };
};