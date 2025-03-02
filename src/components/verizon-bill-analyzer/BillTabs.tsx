
import React from 'react';

interface BillTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const BillTabs: React.FC<BillTabsProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="flex border-b">
      <button 
        className={`px-6 py-3 font-medium ${activeTab === 'summary' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
        onClick={() => setActiveTab('summary')}
      >
        Summary
      </button>
      <button 
        className={`px-6 py-3 font-medium ${activeTab === 'lines' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
        onClick={() => setActiveTab('lines')}
      >
        Line Details
      </button>
      <button 
        className={`px-6 py-3 font-medium ${activeTab === 'recommendations' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
        onClick={() => setActiveTab('recommendations')}
      >
        Recommendations
      </button>
    </div>
  );
};

export default BillTabs;
