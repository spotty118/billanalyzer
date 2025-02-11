import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

interface FileUploadOptions {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  validateFile?: (file: File) => boolean | string;
}

interface FileUploadResult {
  file: File | null;
  isLoading: boolean;
  error: string | null;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  reset: () => void;
}

export const useFileUpload = (options: FileUploadOptions = {}): FileUploadResult => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = [],
    validateFile,
  } = options;

  const reset = useCallback(() => {
    setFile(null);
    setError(null);
    setIsLoading(false);
  }, []);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = event.target.files?.[0];
      setError(null);

      if (!selectedFile) {
        return;
      }

      // Size validation
      if (selectedFile.size > maxSize) {
        const errorMsg = `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`;
        setError(errorMsg);
        toast({
          title: 'Invalid File',
          description: errorMsg,
          variant: 'destructive',
        });
        return;
      }

      // Type validation
      if (allowedTypes.length > 0 && !allowedTypes.includes(selectedFile.type)) {
        const errorMsg = `File type must be: ${allowedTypes.join(', ')}`;
        setError(errorMsg);
        toast({
          title: 'Invalid File Type',
          description: errorMsg,
          variant: 'destructive',
        });
        return;
      }

      // Custom validation
      if (validateFile) {
        const validationResult = validateFile(selectedFile);
        if (typeof validationResult === 'string') {
          setError(validationResult);
          toast({
            title: 'Invalid File',
            description: validationResult,
            variant: 'destructive',
          });
          return;
        }
      }

      setFile(selectedFile);
    },
    [maxSize, allowedTypes, validateFile, toast]
  );

  return {
    file,
    isLoading,
    error,
    handleFileChange,
    reset,
  };
};