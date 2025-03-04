
import { FC, useState } from 'react';
import { BillUploader } from './BillUploader';
import { BillTabs } from './BillTabs';
import { useVerizonBillAnalyzer } from '../../hooks/use-verizon-bill-analyzer';
import { BillAnalysisHeader } from './BillAnalysisHeader';
import { ManualEntryForm } from './ManualEntryForm';
import { NavBar } from '../ui/tubelight-navbar';
import { Home, FileText, BarChart3, Lightbulb } from 'lucide-react';

// Export the NetworkPreference type so it can be imported by other components
export type NetworkPreference = 'verizon' | 'tmobile' | 'att';

const VerizonBillAnalyzer: FC = () => {
  const { 
    billData, 
    isLoading: isAnalyzing, 
    handleFileChange, 
    resetBillData: resetAnalysis, 
    addManualLineCharges: analyzeBill,
    calculateCarrierSavings,
    errorMessage,
    fileSelected
  } = useVerizonBillAnalyzer();
  
  const [isManualMode, setIsManualMode] = useState(false);
  const enterManualMode = (value: boolean) => setIsManualMode(value);

  const [activeTab, setActiveTab] = useState("overview");

  // Navigation items for the tube light navbar
  const navItems = [
    { name: 'Overview', url: '#overview', icon: Home },
    { name: 'Line Items', url: '#line-items', icon: FileText },
    { name: 'Analysis', url: '#recommendations', icon: BarChart3 },
    { name: 'Savings', url: '#carrier-comparison', icon: Lightbulb }
  ];

  // Handle tab click from the navbar
  const handleNavClick = (tabName: string) => {
    const tabLowerCase = tabName.toLowerCase();
    setActiveTab(tabLowerCase === 'analysis' ? 'recommendations' : 
                 tabLowerCase === 'savings' ? 'carrier-comparison' : 
                 tabLowerCase);
  };

  return (
    <div className="relative">
      {!billData ? (
        <div className="space-y-6">
          {isManualMode ? (
            <ManualEntryForm 
              onSubmit={analyzeBill} 
              onCancel={() => enterManualMode(false)} 
            />
          ) : (
            <BillUploader 
              fileSelected={fileSelected}
              isLoading={isAnalyzing} 
              errorMessage={errorMessage}
              onFileChange={handleFileChange}
              onManualEntry={() => enterManualMode(true)}
            />
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <BillAnalysisHeader 
            bill={billData} 
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
            calculateCarrierSavings={calculateCarrierSavings}
            networkPreference={billData.networkPreference}
          />
        </div>
      )}
    </div>
  );
};

export default VerizonBillAnalyzer;
