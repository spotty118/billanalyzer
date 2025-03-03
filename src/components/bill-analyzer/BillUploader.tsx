
import React, { useState } from 'react';
import { DollarSign } from 'lucide-react';

interface BillUploaderProps {
  fileSelected: boolean;
  isLoading: boolean;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function BillUploader({ fileSelected, isLoading, onFileChange }: BillUploaderProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-blue-50">
        <DollarSign className="w-8 h-8 text-blue-500" />
      </div>
      <h2 className="mb-2 text-2xl font-bold">Verizon Bill Analyzer</h2>
      <p className="mb-6 text-gray-600">
        Upload your Verizon bill to analyze charges, get insights, and find potential savings.
      </p>
      <div className="flex flex-col items-center w-full max-w-md p-6 border-2 border-dashed rounded-lg border-gray-300 hover:border-blue-500">
        <label className="flex flex-col items-center w-full cursor-pointer">
          <span className="text-blue-600 font-medium mb-2">
            {fileSelected ? "File selected" : "Choose a bill file"}
          </span>
          <span className="text-sm text-gray-500">
            {fileSelected ? "Click to change file" : "PDF or text file supported"}
          </span>
          <input 
            type="file" 
            className="hidden" 
            accept=".pdf,.txt" 
            onChange={onFileChange} 
          />
        </label>
      </div>
      {isLoading && (
        <div className="mt-6 flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-2 text-gray-600">Analyzing your bill...</p>
        </div>
      )}
    </div>
  );
}
