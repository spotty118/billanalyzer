
import { Wifi, PhoneCall, Clock, Tag, ChevronDown, ChevronRight, ArrowLeftRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Button } from "@/components/ui/button";

interface BillSummaryProps {
  billData: any;
  expandedSection: string;
  toggleSectionExpansion: (section: string) => void;
  formatCurrency: (value: number) => string;
  prepareLineItemsData: () => any[];
  prepareCategoryData: () => any[];
  onCompareCarriers: () => void;
}

export function BillSummary({ 
  billData, 
  expandedSection, 
  toggleSectionExpansion, 
  formatCurrency, 
  prepareLineItemsData, 
  prepareCategoryData,
  onCompareCarriers
}: BillSummaryProps) {
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF', '#FF6B6B'];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="font-bold text-lg mb-4">Charges by Line</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={prepareLineItemsData()}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={value => `$${value}`} />
                <YAxis dataKey="name" type="category" width={100} />
                <RechartsTooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, null]} />
                <Legend />
                <Bar dataKey="plan" name="Plan" stackId="a" fill="#0088FE" />
                <Bar dataKey="device" name="Device" stackId="a" fill="#00C49F" />
                <Bar dataKey="protection" name="Protection" stackId="a" fill="#FFBB28" />
                <Bar dataKey="taxes" name="Taxes & Fees" stackId="a" fill="#FF8042" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="font-bold text-lg mb-4">Breakdown by Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={prepareCategoryData()}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {prepareCategoryData().map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, null]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Usage Insights</h3>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            billData.usageAnalysis.trend === 'stable' ? 'bg-green-100 text-green-800' :
            billData.usageAnalysis.trend === 'increasing' ? 'bg-yellow-100 text-yellow-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            {billData.usageAnalysis.trend === 'stable' ? 'Stable Usage' :
             billData.usageAnalysis.trend === 'increasing' ? 'Increasing Usage' :
             'Decreasing Usage'}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <Wifi className="w-10 h-10 text-blue-500 mr-4" />
            <div>
              <p className="text-sm text-gray-500">Avg. Data Usage</p>
              <p className="text-xl font-semibold">{billData.usageAnalysis.avg_data_usage_gb} GB</p>
            </div>
          </div>
          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <PhoneCall className="w-10 h-10 text-blue-500 mr-4" />
            <div>
              <p className="text-sm text-gray-500">Avg. Talk Minutes</p>
              <p className="text-xl font-semibold">{billData.usageAnalysis.avg_talk_minutes} mins</p>
            </div>
          </div>
          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <Clock className="w-10 h-10 text-blue-500 mr-4" />
            <div>
              <p className="text-sm text-gray-500">Avg. Text Messages</p>
              <p className="text-xl font-semibold">{billData.usageAnalysis.avg_text_messages}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h3 className="font-bold text-lg mb-4">Cost Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Average Monthly Bill</p>
            <p className="text-xl font-semibold">{formatCurrency(billData.costAnalysis.averageMonthlyBill)}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Projected Next Bill</p>
            <p className="text-xl font-semibold">{formatCurrency(billData.costAnalysis.projectedNextBill)}</p>
          </div>
        </div>
        
        <div 
          className="flex justify-between items-center p-4 bg-green-50 rounded-lg cursor-pointer"
          onClick={() => toggleSectionExpansion('savings')}
        >
          <div className="flex items-center">
            <Tag className="w-6 h-6 text-green-600 mr-2" />
            <h4 className="font-semibold text-green-800">Potential Savings</h4>
          </div>
          {expandedSection === 'savings' ? (
            <ChevronDown className="w-5 h-5 text-green-600" />
          ) : (
            <ChevronRight className="w-5 h-5 text-green-600" />
          )}
        </div>
        
        {expandedSection === 'savings' && (
          <div className="mt-2 pl-12">
            {billData.costAnalysis.potentialSavings.map((saving: any, index: number) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                <span>{saving.description}</span>
                <span className="font-semibold text-green-600">{formatCurrency(saving.estimatedSaving)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <Button 
        variant="outline" 
        className="w-full mt-4 border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800"
        onClick={onCompareCarriers}
      >
        <ArrowLeftRight className="h-4 w-4 mr-2" />
        Compare with US Mobile Plans
      </Button>
    </div>
  );
}
