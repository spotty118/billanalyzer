
import { useState } from 'react';
import { BillAnalyzerContent } from './BillAnalyzerContent';
import { ManualEntryForm } from './ManualEntryForm';
import { useVerizonBillAnalyzer } from '@/hooks/use-verizon-bill-analyzer';
import { Button } from '@/components/ui/button';
import { Upload, PencilLine, RefreshCw, Signal, AlertTriangle, FileText, Clipboard } from 'lucide-react';
import { toast } from "sonner";
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export type NetworkPreference = 'verizon' | 'tmobile' | 'att' | 'usmobile' | null;

const CarrierBillAnalyzer = () => {
  const { 
    billData,
    resetBillData,
    calculateCarrierSavings,
    addManualLineCharges,
    handleFileChange,
    analyzeBillText,
    isLoading,
    errorMessage,
    ocrProvider
  } = useVerizonBillAnalyzer();

  const [inputMethod, setInputMethod] = useState<'upload' | 'manual' | 'text' | null>(null);
  const [networkPreference, setNetworkPreference] = useState<NetworkPreference>(null);
  const [showNetworkError, setShowNetworkError] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [billText, setBillText] = useState('');
  const [carrierType, setCarrierType] = useState('verizon');

  const handleStartOver = () => {
    resetBillData();
    setInputMethod(null);
    setNetworkPreference(null);
    setShowNetworkError(false);
    setBillText('');
    toast.success("Analysis reset. You can start over.");
  };

  const handleNetworkPreferenceChange = (value: string) => {
    setNetworkPreference(value as NetworkPreference);
    setShowNetworkError(false);
  };

  const handleCarrierTypeChange = (value: string) => {
    setCarrierType(value);
  };

  const handleSubmitForm = (data: any) => {
    if (!networkPreference) {
      setShowNetworkError(true);
      toast.error("Please select which carrier works best in your area");
      return;
    }
    
    addManualLineCharges({...data, networkPreference, carrierType});
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!networkPreference) {
      setShowNetworkError(true);
      toast.error("Please select which carrier works best in your area");
      return;
    }

    if (e.target.files && e.target.files.length > 0) {
      setUploadProgress(0);
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const nextProgress = prev + Math.random() * 10;
          return nextProgress >= 90 ? 90 : nextProgress;
        });
      }, 200);

      handleFileChange(e, carrierType).then(() => {
        clearInterval(progressInterval);
        setUploadProgress(100);
        setTimeout(() => setUploadProgress(0), 500);
      }).catch(() => {
        clearInterval(progressInterval);
        setUploadProgress(0);
      });
    }
  };

  const handleTextAnalysis = async () => {
    if (!networkPreference) {
      setShowNetworkError(true);
      toast.error("Please select which carrier works best in your area");
      return;
    }

    if (!billText || billText.trim().length < 50) {
      toast.error("Please paste your bill text. Make sure to include sufficient content for accurate analysis.");
      return;
    }

    await analyzeBillText(billText, networkPreference, carrierType);
  };

  const handlePasteSample = () => {
    fetch('/sample-bill.txt')
      .then(response => response.text())
      .then(text => {
        setBillText(text);
        toast.success("Sample bill text loaded!");
      })
      .catch(error => {
        console.error("Error loading sample bill:", error);
        toast.error("Failed to load sample bill text");
      });
  };

  const getAnalyzerTitle = () => {
    if (billData?.carrierType) {
      return `${billData.carrierType.charAt(0).toUpperCase() + billData.carrierType.slice(1)} Bill Analysis`;
    } else if (carrierType) {
      return `${carrierType.charAt(0).toUpperCase() + carrierType.slice(1)} Bill Analysis`;
    }
    return "Bill Analysis";
  };

  if (billData) {
    return (
      <div className="flex flex-col w-full max-w-6xl mx-auto bg-white rounded-lg shadow">
        <div className="flex justify-between items-center px-6 pt-6">
          <div>
            <h1 className="text-2xl font-bold">{getAnalyzerTitle()}</h1>
            {ocrProvider && (
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={ocrProvider === 'claude' ? "secondary" : "outline"}>
                  {ocrProvider === 'claude' ? 'Our AI OCR' : 'Standard Extraction'}
                </Badge>
              </div>
            )}
          </div>
          <Button 
            onClick={handleStartOver}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Start Over
          </Button>
        </div>
        <BillAnalyzerContent 
          billData={billData}
          calculateCarrierSavings={calculateCarrierSavings}
          networkPreference={networkPreference}
          carrierType={billData.carrierType || carrierType}
        />
        
        {billData?.billVersion && (
          <div className="text-xs text-gray-500 p-2 text-right">
            Bill Format Version: {billData.billVersion}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto bg-white rounded-lg shadow">
      {!inputMethod ? (
        <div className="flex flex-col items-center justify-center p-10 space-y-8">
          <h2 className="text-2xl font-semibold text-gray-800">Choose Input Method</h2>
          <p className="text-gray-600 text-center max-w-md">
            You can upload a bill PDF, paste the bill text, or manually enter your line charges.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
            <Button 
              onClick={() => setInputMethod('upload')}
              className="flex-1 h-32 flex-col space-y-3 p-6"
              variant="outline"
            >
              <Upload className="h-10 w-10 text-blue-500" />
              <span className="font-medium">Upload Bill</span>
            </Button>
            
            <Button 
              onClick={() => setInputMethod('text')}
              className="flex-1 h-32 flex-col space-y-3 p-6"
              variant="outline"
            >
              <FileText className="h-10 w-10 text-purple-500" />
              <span className="font-medium">Paste Bill Text</span>
            </Button>
            
            <Button 
              onClick={() => setInputMethod('manual')}
              className="flex-1 h-32 flex-col space-y-3 p-6"
              variant="outline"
            >
              <PencilLine className="h-10 w-10 text-green-500" />
              <span className="font-medium">Enter Manually</span>
            </Button>
          </div>
          
          <p className="text-xs text-gray-400 mt-6">
            All methods will provide you with a detailed analysis and potential savings. Your data isn't saved and is immediately destroyed after use.
          </p>
        </div>
      ) : inputMethod === 'upload' ? (
        <div>
          <Button 
            onClick={() => setInputMethod(null)} 
            variant="ghost" 
            className="m-4"
          >
            ← Back to selection
          </Button>
          <div className="flex flex-col items-center justify-center p-10 space-y-8">
            <Card className="w-full max-w-md">
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Select your bill carrier</h3>
                      <Select 
                        value={carrierType} 
                        onValueChange={handleCarrierTypeChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select your carrier" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="verizon">Verizon</SelectItem>
                          <SelectItem value="att">AT&T</SelectItem>
                          <SelectItem value="tmobile">T-Mobile</SelectItem>
                          <SelectItem value="xfinity">Xfinity Mobile</SelectItem>
                          <SelectItem value="visible">Visible</SelectItem>
                          <SelectItem value="cricket">Cricket</SelectItem>
                          <SelectItem value="metropcs">Metro by T-Mobile</SelectItem>
                          <SelectItem value="boost">Boost Mobile</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  
                    <div className="flex items-center gap-2">
                      <Signal className="h-5 w-5 text-blue-500" />
                      <h3 className="text-lg font-medium">Select your network preference</h3>
                      <span className="text-red-500">*</span>
                    </div>
                  
                    {showNetworkError && (
                      <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-2 rounded border border-red-200">
                        <AlertTriangle size={16} />
                        <span>Please select a network preference to continue</span>
                      </div>
                    )}
                  
                    <RadioGroup 
                      value={networkPreference || ''} 
                      onValueChange={handleNetworkPreferenceChange}
                      className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2"
                    >
                      <div className="flex items-center space-x-2 border rounded-md p-4 hover:bg-gray-50">
                        <RadioGroupItem value="verizon" id="verizon-upload" />
                        <Label htmlFor="verizon-upload" className="font-medium cursor-pointer">
                          Verizon
                        </Label>
                      </div>
                    
                      <div className="flex items-center space-x-2 border rounded-md p-4 hover:bg-gray-50">
                        <RadioGroupItem value="tmobile" id="tmobile-upload" />
                        <Label htmlFor="tmobile-upload" className="font-medium cursor-pointer">
                          T-Mobile
                        </Label>
                      </div>
                    
                      <div className="flex items-center space-x-2 border rounded-md p-4 hover:bg-gray-50">
                        <RadioGroupItem value="att" id="att-upload" />
                        <Label htmlFor="att-upload" className="font-medium cursor-pointer">
                          AT&T
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div className="space-y-4 pt-4">
                    <h3 className="text-lg font-medium">Upload your bill</h3>
                    <p className="text-sm text-gray-500">
                      Upload your recent bill PDF to analyze your current charges and potential savings.
                    </p>
                    
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <input
                        type="file"
                        id="bill-upload"
                        className="hidden"
                        accept=".pdf"
                        onChange={handleFileUpload}
                        disabled={isLoading || !networkPreference}
                      />
                      <label
                        htmlFor="bill-upload"
                        className={`flex flex-col items-center justify-center cursor-pointer ${!networkPreference ? 'opacity-70' : ''}`}
                      >
                        <Upload className="h-10 w-10 text-blue-500 mb-2" />
                        <span className="font-medium">Click to upload PDF</span>
                        <span className="text-sm text-gray-500 mt-1">or drag and drop</span>
                      </label>
                    </div>
                    
                    {uploadProgress > 0 && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Analyzing bill...</span>
                          <span>{Math.round(uploadProgress)}%</span>
                        </div>
                        <Progress value={uploadProgress} className="h-2" />
                      </div>
                    )}
                    
                    {errorMessage && (
                      <div className="text-red-500 bg-red-50 p-4 rounded-md border border-red-200 mt-4">
                        <h4 className="font-medium flex items-center gap-2">
                          <AlertTriangle size={16} />
                          Error processing bill
                        </h4>
                        <p className="text-sm mt-1">{errorMessage}</p>
                      </div>
                    )}
                    
                    {isLoading && (
                      <div className="text-blue-500 bg-blue-50 p-4 rounded-md border border-blue-200 mt-4">
                        <div className="flex justify-between mb-2">
                          <p className="text-sm font-medium">Analyzing your bill with advanced AI technology</p>
                          <span className="text-sm font-bold">75%</span>
                        </div>
                        <Progress value={75} className="h-2 mb-2" />
                        <p className="text-xs text-blue-400 mt-1">This may take a few moments...</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : inputMethod === 'text' ? (
        <div>
          <Button 
            onClick={() => setInputMethod(null)} 
            variant="ghost" 
            className="m-4"
          >
            ← Back to selection
          </Button>
          <div className="flex flex-col items-center justify-center p-10 space-y-8">
            <Card className="w-full max-w-2xl">
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Select your bill carrier</h3>
                      <Select 
                        value={carrierType} 
                        onValueChange={handleCarrierTypeChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select your carrier" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="verizon">Verizon</SelectItem>
                          <SelectItem value="att">AT&T</SelectItem>
                          <SelectItem value="tmobile">T-Mobile</SelectItem>
                          <SelectItem value="xfinity">Xfinity Mobile</SelectItem>
                          <SelectItem value="visible">Visible</SelectItem>
                          <SelectItem value="cricket">Cricket</SelectItem>
                          <SelectItem value="metropcs">Metro by T-Mobile</SelectItem>
                          <SelectItem value="boost">Boost Mobile</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Signal className="h-5 w-5 text-blue-500" />
                      <h3 className="text-lg font-medium">Select your network preference</h3>
                      <span className="text-red-500">*</span>
                    </div>
                  
                    {showNetworkError && (
                      <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-2 rounded border border-red-200">
                        <AlertTriangle size={16} />
                        <span>Please select a network preference to continue</span>
                      </div>
                    )}
                  
                    <RadioGroup 
                      value={networkPreference || ''} 
                      onValueChange={handleNetworkPreferenceChange}
                      className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2"
                    >
                      <div className="flex items-center space-x-2 border rounded-md p-4 hover:bg-gray-50">
                        <RadioGroupItem value="verizon" id="verizon-text" />
                        <Label htmlFor="verizon-text" className="font-medium cursor-pointer">
                          Verizon
                        </Label>
                      </div>
                    
                      <div className="flex items-center space-x-2 border rounded-md p-4 hover:bg-gray-50">
                        <RadioGroupItem value="tmobile" id="tmobile-text" />
                        <Label htmlFor="tmobile-text" className="font-medium cursor-pointer">
                          T-Mobile
                        </Label>
                      </div>
                    
                      <div className="flex items-center space-x-2 border rounded-md p-4 hover:bg-gray-50">
                        <RadioGroupItem value="att" id="att-text" />
                        <Label htmlFor="att-text" className="font-medium cursor-pointer">
                          AT&T
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div className="space-y-4 pt-4">
                    <div className="flex flex-row justify-between items-center">
                      <h3 className="text-lg font-medium">Paste your bill text</h3>
                      <Button 
                        onClick={handlePasteSample} 
                        variant="outline" 
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <Clipboard size={14} />
                        Load Sample
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500">
                      Copy and paste the text from your bill below. Include as much detail as possible for the best analysis.
                    </p>
                    
                    <Textarea
                      placeholder={`Paste your ${carrierType} bill text here... (e.g., 'Account: 526905159-00001, Invoice: 8776031257, Balance from last bill: $327.25...')`}
                      className="min-h-[300px] font-mono text-sm"
                      value={billText}
                      onChange={(e) => setBillText(e.target.value)}
                      disabled={isLoading}
                    />
                    
                    <Button 
                      onClick={handleTextAnalysis}
                      className="w-full"
                      disabled={isLoading || !networkPreference || !billText}
                    >
                      {isLoading ? "Analyzing..." : "Analyze Bill Text"}
                    </Button>
                    
                    {errorMessage && (
                      <div className="text-red-500 bg-red-50 p-4 rounded-md border border-red-200 mt-4">
                        <h4 className="font-medium flex items-center gap-2">
                          <AlertTriangle size={16} />
                          Error processing bill
                        </h4>
                        <p className="text-sm mt-1">{errorMessage}</p>
                      </div>
                    )}
                    
                    {isLoading && (
                      <div className="text-blue-500 bg-blue-50 p-4 rounded-md border border-blue-200 mt-4">
                        <div className="flex justify-between mb-2">
                          <p className="text-sm font-medium">Analyzing your bill with advanced AI technology</p>
                          <span className="text-sm font-bold">75%</span>
                        </div>
                        <Progress value={75} className="h-2 mb-2" />
                        <p className="text-xs text-blue-400 mt-1">This may take a few moments...</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div>
          <Button 
            onClick={() => setInputMethod(null)} 
            variant="ghost" 
            className="m-4"
          >
            ← Back to selection
          </Button>
          
          <div className="px-6 pt-2 pb-6">
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Select your bill carrier</h3>
                    <Select 
                      value={carrierType} 
                      onValueChange={handleCarrierTypeChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select your carrier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="verizon">Verizon</SelectItem>
                        <SelectItem value="att">AT&T</SelectItem>
                        <SelectItem value="tmobile">T-Mobile</SelectItem>
                        <SelectItem value="xfinity">Xfinity Mobile</SelectItem>
                        <SelectItem value="visible">Visible</SelectItem>
                        <SelectItem value="cricket">Cricket</SelectItem>
                        <SelectItem value="metropcs">Metro by T-Mobile</SelectItem>
                        <SelectItem value="boost">Boost Mobile</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Signal className="h-5 w-5 text-blue-500" />
                    <h3 className="text-lg font-medium">Which carrier works best in your area?</h3>
                    <span className="text-red-500">*</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    This helps us recommend the best US Mobile plan for your location. US Mobile offers plans on multiple networks.
                  </p>
                  
                  {showNetworkError && (
                    <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-2 rounded border border-red-200">
                      <AlertTriangle size={16} />
                      <span>Please select a network preference to continue</span>
                    </div>
                  )}
                  
                  <RadioGroup 
                    value={networkPreference || ''} 
                    onValueChange={handleNetworkPreferenceChange}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2"
                  >
                    <div className="flex items-center space-x-2 border rounded-md p-4 hover:bg-gray-50">
                      <RadioGroupItem value="verizon" id="verizon" />
                      <Label htmlFor="verizon" className="font-medium cursor-pointer">
                        Verizon
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2 border rounded-md p-4 hover:bg-gray-50">
                      <RadioGroupItem value="tmobile" id="tmobile" />
                      <Label htmlFor="tmobile" className="font-medium cursor-pointer">
                        T-Mobile
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2 border rounded-md p-4 hover:bg-gray-50">
                      <RadioGroupItem value="att" id="att" />
                      <Label htmlFor="att" className="font-medium cursor-pointer">
                        AT&T
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>
            
            <ManualEntryForm onSubmit={handleSubmitForm} carrierType={carrierType} />
          </div>
        </div>
      )}
    </div>
  );
};

export default CarrierBillAnalyzer;
