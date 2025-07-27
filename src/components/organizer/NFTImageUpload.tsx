import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  Image,
  VStack,
  HStack,
  Text,
  IconButton,
  useToast,
  Progress,
  Flex,
  Badge
} from '@chakra-ui/react';
import { AttachmentIcon, DeleteIcon, ViewIcon } from '@chakra-ui/icons';
import { mockNFTImageService, NFTImageData } from '../../services/MockNFTImageService';
import { DEVELOPMENT_CONFIG, UI_CONFIG } from '../../constants';

interface NFTImageUploadProps {
  tierId: string;
  tierName: string;
  eventTitle: string;
  currentImage?: File | null;
  currentImageUrl?: string;
  onImageChange: (image: File | null, imageUrl?: string) => void;
  onMetadataReady?: (metadataUrl: string) => void;
  isRequired?: boolean;
  label?: string;
}

const NFTImageUpload: React.FC<NFTImageUploadProps> = ({
  tierId,
  tierName,
  eventTitle,
  currentImage: _currentImage,
  currentImageUrl,
  onImageChange,
  onMetadataReady,
  isRequired = false,
  label = "NFT Background Image"
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string>('');
  const [imageData, setImageData] = useState<NFTImageData | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(currentImageUrl || '');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Mock progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Process the image
      const result = await mockNFTImageService.processNFTImage(
        file,
        eventTitle || 'Event',
        tierName || 'Ticket',
        `NFT background for ${tierName} tier`
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.success && result.imageData) {
        setImageData(result.imageData);
        setPreviewUrl(result.imageData.preview);
        onImageChange(file, result.imageData.ipfsUrl);

        // Notify parent about metadata URL if needed
        if (result.metadataUrl && onMetadataReady) {
          onMetadataReady(result.metadataUrl);
        }

        toast({
          title: "Image uploaded successfully",
          description: DEVELOPMENT_CONFIG.ENABLE_BLOCKCHAIN 
            ? "Image uploaded to IPFS" 
            : "Mock upload completed (development mode)",
          status: "success",
          duration: 3000,
          isClosable: true,
        });

        if (DEVELOPMENT_CONFIG.LOG_CONTRACT_CALLS) {
          console.log('🎨 NFT Image Upload Success:', {
            tierId,
            tierName,
            eventTitle,
            imageData: result.imageData,
            metadataUrl: result.metadataUrl
          });
        }

      } else {
        setError(result.error || 'Upload failed');
        toast({
          title: "Upload failed",
          description: result.error,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }

    } catch (err) {
      console.error('Image upload error:', err);
      setError('Failed to upload image');
      toast({
        title: "Upload error",
        description: "An unexpected error occurred",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveImage = () => {
    if (imageData?.preview) {
      mockNFTImageService.cleanupPreview(imageData.preview);
    }
    
    setImageData(null);
    setPreviewUrl('');
    setError('');
    onImageChange(null);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    toast({
      title: "Image removed",
      status: "info",
      duration: 2000,
      isClosable: true,
    });
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const openPreview = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    }
  };

  return (
    <FormControl isInvalid={!!error} isRequired={isRequired}>
      <FormLabel>{label}</FormLabel>
      
      <VStack spacing={4} align="stretch">
        {/* Upload Area */}
        <Box
          borderWidth="2px"
          borderStyle="dashed"
          borderColor={error ? "red.300" : "gray.300"}
          borderRadius="md"
          p={6}
          textAlign="center"
          bg={previewUrl ? "gray.50" : "white"}
          position="relative"
          minH="200px"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          {isUploading ? (
            <VStack spacing={3}>
              <Text>Uploading...</Text>
              <Progress 
                value={uploadProgress} 
                colorScheme="purple" 
                size="lg" 
                w="200px"
                hasStripe
                isAnimated
              />
              <Text fontSize="sm" color="gray.600">
                {uploadProgress}%
              </Text>
            </VStack>
          ) : previewUrl ? (
            <VStack spacing={3}>
              <Image
                src={previewUrl}
                alt={`NFT preview for ${tierName}`}
                maxH="150px"
                maxW="150px"
                objectFit="cover"
                borderRadius="md"
                border="1px solid"
                borderColor="gray.200"
              />
              <HStack>
                <Badge colorScheme="green" variant="subtle">
                  {imageData?.ipfsHash ? 'IPFS' : 'Mock'} Upload Ready
                </Badge>
              </HStack>
              <HStack spacing={2}>
                <IconButton
                  aria-label="View full image"
                  icon={<ViewIcon />}
                  size="sm"
                  onClick={openPreview}
                />
                <IconButton
                  aria-label="Remove image"
                  icon={<DeleteIcon />}
                  size="sm"
                  colorScheme="red"
                  variant="ghost"
                  onClick={handleRemoveImage}
                />
              </HStack>
            </VStack>
          ) : (
            <VStack spacing={3}>
              <AttachmentIcon w={8} h={8} color="gray.400" />
              <Text color="gray.600">
                Upload NFT background image for {tierName || 'this tier'}
              </Text>
              <Button
                colorScheme="purple"
                variant="outline"
                onClick={openFileDialog}
                isDisabled={isUploading}
              >
                Choose Image
              </Button>
            </VStack>
          )}
        </Box>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={UI_CONFIG.SUPPORTED_IMAGE_TYPES.join(',')}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        {/* Help text and development notice */}
        <VStack spacing={2} align="stretch">
          <FormHelperText>
            Recommended: {UI_CONFIG.NFT_IMAGE_DIMENSIONS.RECOMMENDED.width}x{UI_CONFIG.NFT_IMAGE_DIMENSIONS.RECOMMENDED.height}px, 
            Max size: {UI_CONFIG.MAX_IMAGE_SIZE / (1024 * 1024)}MB
          </FormHelperText>
          
          {DEVELOPMENT_CONFIG.SHOW_DEV_NOTICES && (
            <Flex 
              bg="blue.50" 
              p={2} 
              borderRadius="md" 
              border="1px solid" 
              borderColor="blue.200"
            >
              <Text fontSize="xs" color="blue.700">
                🚀 Development Mode: Images are processed with mock IPFS upload. 
                {!DEVELOPMENT_CONFIG.ENABLE_BLOCKCHAIN && " Contract integration disabled."}
              </Text>
            </Flex>
          )}
        </VStack>

        {error && <FormErrorMessage>{error}</FormErrorMessage>}
      </VStack>
    </FormControl>
  );
};

export default NFTImageUpload;