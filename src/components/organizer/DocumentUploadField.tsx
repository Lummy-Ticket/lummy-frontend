import React, { useState, useRef, useCallback } from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Progress,
  Alert,
  AlertIcon,
  Icon,
  Flex,
  useColorModeValue,
} from "@chakra-ui/react";
import { FiUpload, FiFile, FiCheck, FiX } from "react-icons/fi";
import { UI_CONFIG, DEVELOPMENT_CONFIG } from "../../constants";

export interface DocumentUploadFieldProps {
  label: string;
  documentType: string;
  onUpload: (documentType: string, file: File) => Promise<void>;
  progress?: number;
  required?: boolean;
  disabled?: boolean;
  uploadedFile?: {
    name: string;
    size: number;
    uploadedAt: Date;
  };
  error?: string;
}

const DocumentUploadField: React.FC<DocumentUploadFieldProps> = ({
  label,
  documentType,
  onUpload,
  progress = 0,
  required = false,
  disabled = false,
  uploadedFile,
  error,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [localError, setLocalError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Theme colors
  const bgColor = useColorModeValue("gray.50", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const dragOverBg = useColorModeValue("purple.50", "purple.900");
  const dragOverBorder = useColorModeValue("purple.300", "purple.600");

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!UI_CONFIG.SUPPORTED_DOCUMENT_TYPES.includes(file.type)) {
      return "Please upload a DOCX file only";
    }

    // Check file size
    if (file.size > UI_CONFIG.MAX_DOCUMENT_SIZE) {
      const maxSizeMB = UI_CONFIG.MAX_DOCUMENT_SIZE / (1024 * 1024);
      return `File size must be less than ${maxSizeMB}MB`;
    }

    return null;
  };

  const handleFileSelect = useCallback(async (file: File) => {
    setLocalError("");
    
    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setLocalError(validationError);
      return;
    }

    // Start upload
    setIsUploading(true);
    
    try {
      await onUpload(documentType, file);
      
      if (DEVELOPMENT_CONFIG.LOG_API_CALLS) {
        console.log(`✅ Document uploaded successfully: ${file.name} (${documentType})`);
      }
    } catch (uploadError) {
      const errorMessage = uploadError instanceof Error ? uploadError.message : "Upload failed";
      setLocalError(errorMessage);
      console.error(`❌ Document upload failed: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  }, [documentType, onUpload]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const currentError = error || localError;

  return (
    <VStack spacing={3} align="stretch">
      {/* Label */}
      <Flex align="center" justify="space-between">
        <Text fontSize="sm" fontWeight="medium" color="gray.700">
          {label}
          {required && (
            <Text as="span" color="red.500" ml={1}>
              *
            </Text>
          )}
        </Text>
        {uploadedFile && (
          <HStack spacing={1}>
            <Icon as={FiCheck} color="green.500" boxSize={4} />
            <Text fontSize="xs" color="green.600">
              Uploaded
            </Text>
          </HStack>
        )}
      </Flex>

      {/* Upload Area or File Display */}
      {uploadedFile ? (
        // Show uploaded file
        <Box
          p={4}
          bg={bgColor}
          borderRadius="md"
          border="1px solid"
          borderColor="green.200"
        >
          <HStack spacing={3}>
            <Icon as={FiFile} color="green.500" boxSize={5} />
            <VStack spacing={1} align="start" flex={1}>
              <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                {uploadedFile.name}
              </Text>
              <Text fontSize="xs" color="gray.500">
                {formatFileSize(uploadedFile.size)} • Uploaded {uploadedFile.uploadedAt.toLocaleDateString()}
              </Text>
            </VStack>
            <Button
              size="sm"
              variant="ghost"
              colorScheme="red"
              leftIcon={<FiX />}
              onClick={handleBrowseClick}
              isDisabled={disabled || isUploading}
            >
              Replace
            </Button>
          </HStack>
        </Box>
      ) : (
        // Show upload area
        <Box
          p={8}
          bg={isDragOver ? dragOverBg : bgColor}
          borderRadius="md"
          border="2px dashed"
          borderColor={isDragOver ? dragOverBorder : borderColor}
          textAlign="center"
          cursor={disabled || isUploading ? "not-allowed" : "pointer"}
          onClick={disabled || isUploading ? undefined : handleBrowseClick}
          onDragEnter={disabled || isUploading ? undefined : handleDragEnter}
          onDragLeave={disabled || isUploading ? undefined : handleDragLeave}
          onDragOver={disabled || isUploading ? undefined : handleDragOver}
          onDrop={disabled || isUploading ? undefined : handleDrop}
          opacity={disabled ? 0.6 : 1}
          transition="all 0.2s"
          _hover={
            !disabled && !isUploading
              ? {
                  borderColor: "purple.300",
                  bg: "purple.50",
                }
              : undefined
          }
        >
          <VStack spacing={4}>
            <Icon
              as={FiUpload}
              boxSize={8}
              color={isDragOver ? "purple.500" : "gray.400"}
            />
            
            {isUploading ? (
              <VStack spacing={3}>
                <Text fontSize="sm" color="purple.600">
                  Uploading document...
                </Text>
                <Progress
                  value={progress}
                  size="sm"
                  colorScheme="purple"
                  width="200px"
                  hasStripe
                  isAnimated
                />
                <Text fontSize="xs" color="gray.500">
                  {Math.round(progress)}% complete
                </Text>
              </VStack>
            ) : (
              <VStack spacing={2}>
                <Text fontSize="sm" color="gray.600">
                  Drag & drop your DOCX file here, or{" "}
                  <Text as="span" color="purple.600" textDecoration="underline">
                    browse files
                  </Text>
                </Text>
                <Text fontSize="xs" color="gray.500">
                  Maximum file size: {UI_CONFIG.MAX_DOCUMENT_SIZE / (1024 * 1024)}MB
                </Text>
              </VStack>
            )}
          </VStack>
        </Box>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".docx"
        style={{ display: "none" }}
        onChange={handleFileInputChange}
        disabled={disabled || isUploading}
      />

      {/* Error message */}
      {currentError && (
        <Alert status="error" size="sm">
          <AlertIcon />
          <Text fontSize="sm">{currentError}</Text>
        </Alert>
      )}
    </VStack>
  );
};

export default DocumentUploadField;