import React from 'react';

interface BillTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BillTabs({ activeTab, onTabChange }: BillTabsProps) {
  return (
    <div className="flex border-b">
      <button 
        className={`px-6 py-3 font-medium ${activeTab === 'summary' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
        onClick={() => onTabChange('summary')}
      >
        Summary
      </button>
      <button 
        className={`px-6 py-3 font-medium ${activeTab === 'lines' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
        onClick={() => onTabChange('lines')}
      >
        Line Details
      </button>
      <button 
        className={`px-6 py-3 font-medium ${activeTab === 'recommendations' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
        onClick={() => onTabChange('recommendations')}
      >
        Recommendations
      </button>
      <button 
        className={`px-6 py-3 font-medium ${activeTab === 'alternatives' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
        onClick={() => onTabChange('alternatives')}
      >
        US Mobile Plans
      </button>
    </div>
  );
}
