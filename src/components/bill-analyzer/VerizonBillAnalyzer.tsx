
import { FC, useState } from 'react';
import { BillUploader } from './BillUploader';
import { BillTabs } from './BillTabs';
import { useBillAnalyzer } from '../../hooks/use-verizon-bill-analyzer';
import { BillAnalysisHeader } from './BillAnalysisHeader';
import { ManualEntryForm } from './ManualEntryForm';
import { NavBar } from '../ui/tubelight-navbar';
import { Home, FileText, BarChart3, Lightbulb } from 'lucide-react';

const VerizonBillAnalyzer: FC = () => {
  const { 
    billData, 
    isAnalyzing, 
    analyzeBill, 
    resetAnalysis, 
    enterManualMode, 
    isManualMode 
  } = useBillAnalyzer();

  const [activeTab, setActiveTab] = useState("overview");

  // Navigation items for the tube light navbar
  const navItems = [
    { name: 'Overview', url: '#overview', icon: Home },
    { name: 'Line Items', url: '#line-items', icon: FileText },
    { name: 'Analysis', url: '#analysis', icon: BarChart3 },
    { name: 'Savings', url: '#savings', icon: Lightbulb }
  ];

  // Handle tab click from the navbar
  const handleNavClick = (tabName: string) => {
    const tabLowerCase = tabName.toLowerCase();
    setActiveTab(tabLowerCase);
  };

  return (
    <div className="relative">
      {!billData ? (
        <div className="space-y-6">
          {isManualMode ? (
            <ManualEntryForm onSubmit={analyzeBill} onCancel={() => enterManualMode(false)} />
          ) : (
            <BillUploader 
              onUpload={analyzeBill} 
              isAnalyzing={isAnalyzing} 
              onManualEntry={() => enterManualMode(true)}
            />
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <BillAnalysisHeader 
            billData={billData} 
            onReset={resetAnalysis}
          />
          
          {/* TubeLight Navbar for bill tabs */}
          <div className="mb-16">
            <NavBar 
              items={navItems.map(item => ({
                ...item,
                url: item.url,
                name: item.name,
                onClick: () => handleNavClick(item.name)
              }))} 
              className="mb-8"
            />
          </div>
          
          <BillTabs 
            billData={billData} 
            activeTab={activeTab} 
            onTabChange={setActiveTab}
          />
        </div>
      )}
    </div>
  );
};

export default VerizonBillAnalyzer;
