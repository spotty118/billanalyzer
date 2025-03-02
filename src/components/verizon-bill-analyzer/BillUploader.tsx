
import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { supabase } from '../../integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface BillUploaderProps {
  onBillAnalyzed: (analysis: any) => void;
}

const BillUploader: React.FC<BillUploaderProps> = ({ onBillAnalyzed }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    
    if (!selectedFile) {
      return;
    }
    
    if (selectedFile.type !== 'application/pdf') {
      setError('Please upload a PDF file.');
      setFile(null);
      return;
    }
    
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB.');
      setFile(null);
      return;
    }
    
    setFile(selectedFile);
    setError(null);
  };

  const analyzeBill = async () => {
    if (!file) {
      setError('Please select a file first.');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadSuccess(false);

    try {
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('bill', file);

      // Get the Edge Function URL from Supabase
      const { data: functionData } = await supabase.functions.invoke("analyze-bill", {
        body: formData,
        headers: {
          // No need for explicit content type as FormData sets it automatically with boundary
        },
        method: 'POST',
      });

      if (functionData.error) {
        throw new Error(functionData.error);
      }

      // Set success and call the callback with the analysis data
      setUploadSuccess(true);
      onBillAnalyzed(functionData.data);
    } catch (err) {
      console.error('Error analyzing bill:', err);
      setError('Failed to analyze the bill. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upload Verizon Bill</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
            <input
              type="file"
              id="bill-upload"
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf"
              disabled={isUploading}
            />
            <label 
              htmlFor="bill-upload" 
              className="cursor-pointer text-blue-600 hover:text-blue-800"
            >
              Select a PDF bill to upload
            </label>
            {file && (
              <div className="mt-2 text-sm text-gray-600">
                Selected file: {file.name}
              </div>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {uploadSuccess && (
            <Alert className="bg-green-50 text-green-800 border-green-200">
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>Your bill has been analyzed successfully.</AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={analyzeBill} 
            disabled={!file || isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Analyze Bill'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BillUploader;
