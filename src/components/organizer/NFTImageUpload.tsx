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
  Badge,
  useDisclosure
} from '@chakra-ui/react';
import { AttachmentIcon, DeleteIcon, ViewIcon } from '@chakra-ui/icons';
import { uploadToIPFS } from '../../services/IPFSService';
import { DEVELOPMENT_CONFIG, UI_CONFIG } from '../../constants';
import ImageCropModal from '../common/ImageCropModal';
import { formatFileSize } from '../../utils/ipfsMetadata';

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
  onMetadataReady: _onMetadataReady,
  isRequired = false,
  label = "NFT Background Image"
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string>('');
  const [ipfsHash, setIpfsHash] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>(currentImageUrl || '');
  
  // Image crop modal state
  const { isOpen: isCropModalOpen, onOpen: onCropModalOpen, onClose: onCropModalClose } = useDisclosure();
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  // Handle file selection - opens crop modal instead of direct upload
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Basic file validation
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File',
        description: 'File must be an image',
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (file.size > UI_CONFIG.MAX_IMAGE_SIZE) {
      toast({
        title: 'File Too Large',
        description: `File size (${formatFileSize(file.size)}) exceeds maximum ${formatFileSize(UI_CONFIG.MAX_IMAGE_SIZE)}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    // Open crop modal
    setPendingImageFile(file);
    onCropModalOpen();
  };

  // Handle cropped image from modal - Auto-upload to Real IPFS
  const handleCroppedImage = async (croppedFile: File) => {
    console.log(`📤 NFT Background cropped for ${tierName}:`, croppedFile.name, formatFileSize(croppedFile.size));

    setError('');
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Auto-upload to Real IPFS immediately after crop
      console.log(`🚀 Auto-uploading NFT Background for ${tierName} to IPFS...`);
      
      const uploadResult = await uploadToIPFS(croppedFile);
      
      if (uploadResult.success && uploadResult.hash) {
        setIpfsHash(uploadResult.hash);
        
        // Create preview URL from cropped file
        const previewUrl = URL.createObjectURL(croppedFile);
        setPreviewUrl(previewUrl);
        
        // Notify parent with file and IPFS hash
        const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${uploadResult.hash}`;
        onImageChange(croppedFile, ipfsUrl);

        toast({
          title: "NFT Background Uploaded!",
          description: `${tierName} tier background successfully uploaded to IPFS`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });

        if (DEVELOPMENT_CONFIG.LOG_CONTRACT_CALLS) {
          console.log('🎨 NFT Real IPFS Upload Success:', {
            tierId,
            tierName,
            eventTitle,
            originalSize: pendingImageFile?.size,
            croppedSize: croppedFile.size,
            ipfsHash: uploadResult.hash,
            ipfsUrl: ipfsUrl
          });
        }

      } else {
        throw new Error(uploadResult.error || 'IPFS upload failed');
      }

    } catch (err) {
      console.error('NFT Image Real IPFS upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload to IPFS');
      toast({
        title: "NFT Upload Failed",
        description: err instanceof Error ? err.message : "Failed to upload to IPFS",
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
    // Cleanup preview URL if it's a blob URL
    if (previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    
    setIpfsHash('');
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
              <VStack spacing={2}>
                <Badge colorScheme="green" variant="subtle">
                  ✅ IPFS Upload Complete
                </Badge>
                {ipfsHash && (
                  <HStack spacing={2}>
                    <Badge colorScheme="purple" size="xs">IPFS</Badge>
                    <Text fontSize="xs" color="blue.600" as="a" 
                          href={`https://gateway.pinata.cloud/ipfs/${ipfsHash}`}
                          target="_blank" _hover={{ textDecoration: 'underline' }}>
                      {ipfsHash.substring(0, 12)}...
                    </Text>
                  </HStack>
                )}
              </VStack>
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
            Square aspect ratio (1:1). Recommended: {UI_CONFIG.NFT_IMAGE_DIMENSIONS.RECOMMENDED.width}x{UI_CONFIG.NFT_IMAGE_DIMENSIONS.RECOMMENDED.height}px, 
            Max size: {UI_CONFIG.MAX_IMAGE_SIZE / (1024 * 1024)}MB. 
            Images will be cropped to 1:1 ratio automatically.
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

      {/* Image Crop Modal for NFT Background */}
      <ImageCropModal
        isOpen={isCropModalOpen}
        onClose={onCropModalClose}
        imageFile={pendingImageFile}
        imageType="NFT_BACKGROUND"
        onCropComplete={handleCroppedImage}
      />
    </FormControl>
  );
};

export default NFTImageUpload;