import React, { useState, useRef, useCallback } from 'react';
import ReactCrop, { 
  Crop, 
  PixelCrop, 
  centerCrop, 
  makeAspectCrop,
  convertToPixelCrop 
} from 'react-image-crop';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  Text,
  HStack,
  Box,
  Alert,
  AlertIcon,
  useToast,
} from '@chakra-ui/react';
import 'react-image-crop/dist/ReactCrop.css';
import { ImageType, IMAGE_SPECS } from '../../types/IPFSMetadata';

interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageFile: File | null;
  imageType: ImageType;
  onCropComplete: (croppedFile: File) => void;
}

const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  onClose,
  imageFile,
  imageType,
  onCropComplete,
}) => {
  const toast = useToast();
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [processing, setProcessing] = useState(false);

  const spec = IMAGE_SPECS[imageType];
  const aspectRatio = spec.aspectRatio;

  React.useEffect(() => {
    if (imageFile && isOpen) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result?.toString() || '');
      });
      reader.readAsDataURL(imageFile);
    }
  }, [imageFile, isOpen]);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth: width, naturalHeight: height } = e.currentTarget;

    // Create initial crop centered with correct aspect ratio
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        aspectRatio,
        width,
        height,
      ),
      width,
      height,
    );

    setCrop(crop);
  }, [aspectRatio]);

  const getCroppedImg = useCallback(
    async (image: HTMLImageElement, pixelCrop: PixelCrop): Promise<File> => {
      const canvas = canvasRef.current;
      if (!canvas) {
        throw new Error('Canvas not available');
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('No 2d context');
      }

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      // Set canvas size to recommended dimensions
      canvas.width = spec.recommendedSize.width;
      canvas.height = spec.recommendedSize.height;

      // Calculate source crop dimensions
      const sourceX = pixelCrop.x * scaleX;
      const sourceY = pixelCrop.y * scaleY;
      const sourceWidth = pixelCrop.width * scaleX;
      const sourceHeight = pixelCrop.height * scaleY;

      // Draw the cropped image
      ctx.drawImage(
        image,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        canvas.width,
        canvas.height,
      );

      // Convert canvas to blob
      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas is empty'));
              return;
            }

            // Create new file with proper name
            const fileExtension = imageFile?.name.split('.').pop() || 'jpg';
            const fileName = `cropped-${imageType.toLowerCase()}-${Date.now()}.${fileExtension}`;
            
            const file = new File([blob], fileName, {
              type: blob.type || 'image/jpeg',
              lastModified: Date.now(),
            });

            resolve(file);
          },
          'image/jpeg',
          0.9, // Quality
        );
      });
    },
    [imageFile, imageType, spec.recommendedSize],
  );

  const handleCropComplete = async () => {
    if (!completedCrop || !imgRef.current) {
      toast({
        title: 'No crop selected',
        description: 'Please select an area to crop',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setProcessing(true);

    try {
      const croppedFile = await getCroppedImg(imgRef.current, completedCrop);
      
      console.log(`✅ Image cropped successfully for ${imageType}:`, {
        originalSize: imageFile ? `${imageFile.size} bytes` : 'unknown',
        croppedSize: `${croppedFile.size} bytes`,
        dimensions: `${spec.recommendedSize.width}×${spec.recommendedSize.height}`,
      });

      onCropComplete(croppedFile);
      onClose();

      toast({
        title: 'Image cropped successfully!',
        description: `${spec.name} ready for upload`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Crop failed:', error);
      toast({
        title: 'Crop failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    setImageSrc('');
    setCrop(undefined);
    setCompletedCrop(undefined);
    onClose();
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} size="4xl" closeOnOverlayClick={false}>
        <ModalOverlay />
        <ModalContent maxW="90vw" maxH="90vh">
          <ModalHeader>
            Crop {spec.name}
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="info">
                <AlertIcon />
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm" fontWeight="medium">
                    Crop your image to {spec.aspectRatio === 16/9 ? '16:9' : spec.aspectRatio === 21/9 ? '21:9' : '1:1'} aspect ratio
                  </Text>
                  <Text fontSize="xs" color="gray.600">
                    Recommended size: {spec.recommendedSize.width}×{spec.recommendedSize.height}px
                  </Text>
                </VStack>
              </Alert>

              {imageSrc && (
                <Box 
                  maxH="60vh" 
                  overflow="auto" 
                  display="flex" 
                  justifyContent="center"
                  bg="gray.50"
                  p={4}
                  borderRadius="md"
                >
                  <ReactCrop
                    crop={crop}
                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                    onComplete={(c) => setCompletedCrop(convertToPixelCrop(c, imgRef.current?.width || 0, imgRef.current?.height || 0))}
                    aspect={aspectRatio}
                    minWidth={100}
                    minHeight={100}
                  >
                    <img
                      ref={imgRef}
                      alt="Crop preview"
                      src={imageSrc}
                      style={{ maxWidth: '100%', maxHeight: '50vh' }}
                      onLoad={onImageLoad}
                    />
                  </ReactCrop>
                </Box>
              )}

              {/* Preview Info */}
              {completedCrop && (
                <Alert status="success" size="sm">
                  <AlertIcon />
                  <Text fontSize="sm">
                    Crop area: {Math.round(completedCrop.width)}×{Math.round(completedCrop.height)}px 
                    → Will be resized to {spec.recommendedSize.width}×{spec.recommendedSize.height}px
                  </Text>
                </Alert>
              )}
            </VStack>
          </ModalBody>

          <ModalFooter>
            <HStack spacing={3}>
              <Button variant="outline" onClick={handleClose} isDisabled={processing}>
                Cancel
              </Button>
              <Button 
                colorScheme="blue" 
                onClick={handleCropComplete}
                isLoading={processing}
                loadingText="Processing..."
                isDisabled={!completedCrop}
              >
                Crop & Use Image
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Hidden canvas for processing */}
      <canvas
        ref={canvasRef}
        style={{
          display: 'none',
        }}
      />
    </>
  );
};

export default ImageCropModal;