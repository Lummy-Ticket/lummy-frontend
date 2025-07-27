import { useState } from 'react';
import { useSmartContract } from './useSmartContract';
import { DEVELOPMENT_CONFIG } from '../constants';
import { TicketTierInput } from '../components/organizer/TicketTierCreator';
import { ipfsImageService } from '../services/IPFSImageService';
import { ResellSettingsData } from '../components/organizer/ResellSettings';

interface EventCreationData {
  title: string;
  description: string;
  venue: string;
  address: string;
  date: string;
  time: string;
  endTime: string;
  category: string;
  bannerImage: File | null;
}

interface CreateEventResult {
  success: boolean;
  eventAddress?: string;
  eventId?: string;
  error?: string;
  mockData?: any;
  ipfsMetadataUrl?: string;
  bannerImageUrl?: string;
}

export const useHybridEventCreation = () => {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [progressSteps, setProgressSteps] = useState<Array<{
    id: string;
    status: 'pending' | 'in-progress' | 'completed' | 'error';
    detail?: string;
  }>>([]);
  
  const { createEvent: contractCreateEvent, loading: contractLoading, error: contractError } = useSmartContract();

  const updateStepStatus = (stepId: string, status: 'pending' | 'in-progress' | 'completed' | 'error', detail?: string) => {
    setCurrentStep(stepId);
    setProgressSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status, detail }
        : step
    ));
  };

  const initializeSteps = () => {
    const steps = [
      { id: 'banner-upload', status: 'pending' as const },
      { id: 'nft-upload', status: 'pending' as const },
      { id: 'metadata-upload', status: 'pending' as const },
      { id: 'contract-creation', status: 'pending' as const }
    ];
    setProgressSteps(steps);
  };

  /**
   * Mock event creation simulation
   */
  const mockCreateEvent = async (
    eventData: EventCreationData, 
    processedTiers: TicketTierInput[],
    ipfsMetadataUrl: string
  ): Promise<CreateEventResult> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, DEVELOPMENT_CONFIG.MOCK_TRANSACTION_DELAY));

    // Simulate occasional failures
    if (Math.random() > DEVELOPMENT_CONFIG.MOCK_SUCCESS_RATE) {
      return {
        success: false,
        error: 'Mock event creation failed (simulated network error)'
      };
    }

    // Generate mock event data
    const mockEventId = `event_${Date.now()}`;
    const mockEventAddress = `0x${Math.random().toString(16).substr(2, 40)}`;

    const mockData = {
      eventId: mockEventId,
      eventAddress: mockEventAddress,
      ipfsMetadataUrl,
      eventData: {
        ...eventData,
        eventDate: new Date(`${eventData.date}T${eventData.time}`),
      },
      ticketTiers: processedTiers.map(tier => ({
        ...tier,
        // NFT metadata URLs from processing
        nftImageUrl: tier.nftImageUrl,
        contractReady: true
      })),
      blockchain: {
        transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        blockNumber: Math.floor(Math.random() * 1000000),
        gasUsed: '150000'
      }
    };

    if (DEVELOPMENT_CONFIG.LOG_CONTRACT_CALLS) {
      console.log('🎪 Mock Event Creation:', mockData);
    }

    return {
      success: true,
      eventAddress: mockEventAddress,
      eventId: mockEventId,
      mockData
    };
  };

  /**
   * Real contract event creation
   */
  const realCreateEvent = async (
    eventData: EventCreationData,
    _processedTiers: TicketTierInput[],
    ipfsMetadataUrl: string
  ): Promise<CreateEventResult> => {
    try {
      const eventDate = new Date(`${eventData.date}T${eventData.time}`);
      const eventTimestamp = Math.floor(eventDate.getTime() / 1000);
      
      console.log('🔗 Calling contract createEvent with:', {
        name: eventData.title,
        description: eventData.description,
        date: eventTimestamp,
        venue: eventData.venue || eventData.address,
        ipfsMetadata: ipfsMetadataUrl
      });

      // Call actual contract with processed metadata URL
      const eventAddress = await contractCreateEvent(
        eventData.title,
        eventData.description,
        eventDate,
        eventData.venue || eventData.address,
        ipfsMetadataUrl
      );

      if (eventAddress) {
        return {
          success: true,
          eventAddress,
          eventId: eventAddress // Use address as ID for now
        };
      } else {
        return {
          success: false,
          error: 'Contract call returned empty address'
        };
      }

    } catch (error) {
      console.error('Real contract creation error:', error);
      return {
        success: false,
        error: contractError || 'Contract creation failed'
      };
    }
  };

  /**
   * Hybrid create event function with complete workflow
   */
  const createEvent = async (
    eventData: EventCreationData,
    ticketTiers: TicketTierInput[],
    _resellSettings?: ResellSettingsData
  ): Promise<CreateEventResult> => {
    setLoading(true);

    try {
      // Validate required fields
      if (!eventData.title || !eventData.date || !eventData.time || ticketTiers.length === 0) {
        return {
          success: false,
          error: 'Missing required fields'
        };
      }

      // Initialize progress tracking
      initializeSteps();
      console.log('🚀 Starting event creation workflow...');

      // Step 1: Upload banner image to IPFS if provided
      updateStepStatus('banner-upload', 'in-progress', 'Uploading banner image...');
      let bannerImageUrl: string | undefined;
      
      if (eventData.bannerImage) {
        console.log('📸 Uploading banner image to IPFS...');
        const bannerUpload = await ipfsImageService.uploadImage(eventData.bannerImage);
        
        if (!bannerUpload.success) {
          updateStepStatus('banner-upload', 'error', `Upload failed: ${bannerUpload.error}`);
          return {
            success: false,
            error: `Banner upload failed: ${bannerUpload.error}`
          };
        }
        
        bannerImageUrl = bannerUpload.ipfsUrl;
        console.log('✅ Banner uploaded:', bannerImageUrl);
        updateStepStatus('banner-upload', 'completed', 'Banner image uploaded successfully');
      } else {
        updateStepStatus('banner-upload', 'completed', 'No banner image provided');
      }

      // Step 2: Process NFT images for tiers
      updateStepStatus('nft-upload', 'in-progress', 'Processing NFT images for tiers...');
      console.log('🎨 Processing NFT images for tiers...');
      const processedTiers = [...ticketTiers];
      
      const tiersWithImages = processedTiers.filter(tier => tier.nftImage);
      if (tiersWithImages.length > 0) {
        for (let i = 0; i < processedTiers.length; i++) {
          const tier = processedTiers[i];
          if (tier.nftImage) {
            updateStepStatus('nft-upload', 'in-progress', `Uploading NFT for ${tier.name}...`);
            const nftUpload = await ipfsImageService.uploadImage(tier.nftImage);
            if (nftUpload.success) {
              processedTiers[i] = {
                ...tier,
                nftImageUrl: nftUpload.ipfsUrl
              };
              console.log(`✅ NFT image uploaded for tier ${tier.name}:`, nftUpload.ipfsUrl);
            } else {
              console.warn(`⚠️ NFT upload failed for tier ${tier.name}:`, nftUpload.error);
            }
          }
        }
        updateStepStatus('nft-upload', 'completed', `${tiersWithImages.length} NFT images processed`);
      } else {
        updateStepStatus('nft-upload', 'completed', 'No NFT images provided');
      }

      // Step 3: Generate and upload event metadata
      updateStepStatus('metadata-upload', 'in-progress', 'Generating event metadata...');
      console.log('📋 Generating event metadata...');
      const eventMetadata = ipfsImageService.generateEventMetadata(
        eventData,
        bannerImageUrl,
        processedTiers
      );

      const metadataUpload = await ipfsImageService.uploadMetadata(eventMetadata);
      if (!metadataUpload.success) {
        updateStepStatus('metadata-upload', 'error', `Upload failed: ${metadataUpload.error}`);
        return {
          success: false,
          error: `Metadata upload failed: ${metadataUpload.error}`
        };
      }

      console.log('✅ Event metadata uploaded:', metadataUpload.ipfsUrl);
      updateStepStatus('metadata-upload', 'completed', 'Event metadata uploaded successfully');

      // Step 4: Create event (mock or real)
      updateStepStatus('contract-creation', 'in-progress', 'Creating event on blockchain...');
      let result: CreateEventResult;

      if (DEVELOPMENT_CONFIG.ENABLE_BLOCKCHAIN) {
        console.log('🔗 Creating event on blockchain...');
        result = await realCreateEvent(eventData, processedTiers, metadataUpload.ipfsUrl!);
      } else {
        console.log('🔄 Creating mock event...');
        result = await mockCreateEvent(eventData, processedTiers, metadataUpload.ipfsUrl!);
      }

      if (result.success) {
        updateStepStatus('contract-creation', 'completed', 'Event created successfully');
      } else {
        updateStepStatus('contract-creation', 'error', result.error || 'Event creation failed');
      }

      // Add metadata URLs to result
      if (result.success) {
        result.ipfsMetadataUrl = metadataUpload.ipfsUrl;
        result.bannerImageUrl = bannerImageUrl;
      }

      return result;

    } catch (error) {
      console.error('Event creation error:', error);
      return {
        success: false,
        error: 'Failed to create event'
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Validate event data before submission
   */
  const validateEventData = (
    eventData: EventCreationData,
    ticketTiers: TicketTierInput[]
  ): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Basic validation
    if (!eventData.title.trim()) errors.push('Event title is required');
    if (!eventData.description.trim()) errors.push('Event description is required');
    if (!eventData.date) errors.push('Event date is required');
    if (!eventData.time) errors.push('Event time is required');
    if (!eventData.venue.trim() && !eventData.address.trim()) {
      errors.push('Either venue or address is required');
    }
    if (ticketTiers.length === 0) errors.push('At least one ticket tier is required');

    // Date validation
    const eventDateTime = new Date(`${eventData.date}T${eventData.time}`);
    if (eventDateTime <= new Date()) {
      errors.push('Event date must be in the future');
    }

    // End time validation (if provided)
    if (eventData.endTime) {
      const endDateTime = new Date(`${eventData.date}T${eventData.endTime}`);
      if (endDateTime <= eventDateTime) {
        errors.push('End time must be after start time');
      }
    }

    // Banner image validation (if provided)
    if (eventData.bannerImage) {
      const validation = ipfsImageService.validateImage(eventData.bannerImage);
      if (!validation.valid) {
        errors.push(`Banner image: ${validation.error}`);
      }
    }

    // Tier validation
    ticketTiers.forEach((tier, index) => {
      if (!tier.name.trim()) errors.push(`Tier ${index + 1}: Name is required`);
      if (tier.price <= 0) errors.push(`Tier ${index + 1}: Price must be greater than 0`);
      if (tier.quantity <= 0) errors.push(`Tier ${index + 1}: Quantity must be greater than 0`);
      if (tier.maxPerPurchase <= 0 || tier.maxPerPurchase > tier.quantity) {
        errors.push(`Tier ${index + 1}: Invalid max per purchase`);
      }

      // NFT image validation (if provided)
      if (tier.nftImage) {
        const nftValidation = ipfsImageService.validateImage(tier.nftImage);
        if (!nftValidation.valid) {
          errors.push(`Tier ${index + 1} NFT image: ${nftValidation.error}`);
        }
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  };

  return {
    createEvent,
    validateEventData,
    loading: loading || contractLoading,
    error: contractError,
    // Progress tracking
    currentStep,
    progressSteps
  };
};