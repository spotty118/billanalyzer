
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getPlans } from "@/data/verizonPlans";
import { RefreshCw, FileSpreadsheet, PieChart } from "lucide-react";
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BillBreakdownChart } from "@/components/dashboard/BillBreakdownChart";
import { RecentBillsTable } from "@/components/dashboard/RecentBillsTable";

// Define the Bill interface that matches what both components expect
interface Bill {
  id: number;
  account_number: string;
  billing_period: string;
  total_amount: number;
  created_at: string;
  analysis_data: any;
}

function Dashboard() {
  const { 
    data: plans,
    isLoading: loadingPlans,
    refetch: refetchPlans
  } = useQuery({
    queryKey: ["plans"],
    queryFn: getPlans,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: bills,
    isLoading: loadingBills,
    refetch: refetchBills
  } = useQuery({
    queryKey: ["bill_analyses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bill_analyses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      
      // Convert Supabase results to our Bill interface
      return (data || []).map((bill): Bill => ({
        id: bill.id,
        account_number: bill.account_number,
        billing_period: bill.billing_period,
        total_amount: bill.total_amount,
        created_at: bill.created_at || new Date().toISOString(), // Use current time as fallback
        analysis_data: bill.analysis_data || {} // Ensure we have at least an empty object
      }));
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const [refreshing, setRefreshing] = useState(false);

  const handleRefreshData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchPlans(), refetchBills()]);
      toast({
        title: "Data Refreshed",
        description: "The data has been successfully refreshed.",
      });
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast({
        title: "Error",
        description: "Failed to refresh data. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Calculate plan type counts
  const planTypeCounts = plans?.reduce((acc, plan) => {
    acc[plan.type] = (acc[plan.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // Calculate average bill amount
  const averageBillAmount = bills?.length 
    ? bills.reduce((sum, bill) => sum + Number(bill.total_amount), 0) / bills.length 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button 
          onClick={handleRefreshData}
          className="flex items-center gap-2"
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh Data"}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Available Plans</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingPlans ? (
              <p className="text-gray-500">Loading...</p>
            ) : (
              <p className="text-2xl font-bold">{plans?.length || 0}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Bills</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingBills ? (
              <p className="text-gray-500">Loading...</p>
            ) : (
              <p className="text-2xl font-bold">{bills?.length || 0}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Avg. Bill Amount</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingBills ? (
              <p className="text-gray-500">Loading...</p>
            ) : (
              <p className="text-2xl font-bold">
                ${averageBillAmount.toFixed(2)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Plan Types</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingPlans ? (
              <p className="text-gray-500">Loading...</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(planTypeCounts).map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center">
                    <span className="capitalize">{type}</span>
                    <span className="font-medium">{count} plans</span>
                  </div>
                ))}
                {Object.keys(planTypeCounts).length === 0 && (
                  <p className="text-gray-500">No plans available</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={handleRefreshData}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                {refreshing ? "Refreshing..." : "Refresh All Data"}
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={() => window.location.href = "/bill-analyzer"}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Bill Analyzer
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Bill Breakdown Chart Card */}
        <Card className="md:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Bill Breakdown by Category</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingBills ? (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-gray-500">Loading...</p>
              </div>
            ) : bills && bills.length > 0 ? (
              <BillBreakdownChart bills={bills} />
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-gray-500">No bill data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Bills Table */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Recent Bills</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingBills ? (
              <p className="text-gray-500">Loading...</p>
            ) : bills && bills.length > 0 ? (
              <RecentBillsTable bills={bills} />
            ) : (
              <p className="text-gray-500">No recent bills available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return <Dashboard />;
}
