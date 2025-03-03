
import React from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';

interface BillUploaderProps {
  fileSelected: boolean;
  isLoading: boolean;
  errorMessage?: string | null;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function BillUploader({ 
  fileSelected, 
  isLoading, 
  errorMessage,
  onFileChange 
}: BillUploaderProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 transition-all duration-200 hover:border-blue-500">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="mb-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-1">Analyzing your Verizon bill</h3>
          <p className="text-sm text-gray-500">This may take a few moments...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10">
          {errorMessage ? (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg max-w-md text-center">
              <div className="flex items-center justify-center mb-2">
                <AlertCircle className="w-6 h-6 text-red-500 mr-2" />
                <h4 className="font-medium text-red-700">Error</h4>
              </div>
              <p className="text-sm text-red-600">{errorMessage}</p>
              <p className="text-xs text-red-500 mt-2">Please try again with a different file or format.</p>
            </div>
          ) : null}
          
          <div className="mb-5">
            <div className="w-16 h-16 flex items-center justify-center bg-blue-100 rounded-full">
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <h3 className="text-xl font-medium text-gray-800 mb-2">Upload your Verizon bill</h3>
          <p className="text-sm text-gray-500 mb-6 text-center max-w-md">
            We'll analyze your bill to find potential savings and recommend the best plan for your needs.
          </p>
          
          <label 
            htmlFor="file-upload" 
            className={`flex items-center justify-center px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              fileSelected 
                ? "bg-green-100 text-green-700 hover:bg-green-200" 
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            <Upload className="w-5 h-5 mr-2" />
            {fileSelected ? "Bill selected" : "Select bill file"}
            <input
              id="file-upload"
              type="file"
              accept=".pdf,.txt,.html,.htm"
              className="hidden"
              onChange={onFileChange}
            />
          </label>
          
          <p className="text-xs text-gray-400 mt-4">
            Supported formats: PDF, TXT, HTML
          </p>
        </div>
      )}
    </div>
  );
}
