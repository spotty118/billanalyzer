import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getPlans } from "@/data/verizonPlans";
import { RefreshCw } from "lucide-react";

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

  const handleRefreshData = async () => {
    await refetchPlans();
  };

  // Calculate plan type counts
  const planTypeCounts = plans?.reduce((acc, plan) => {
    acc[plan.type] = (acc[plan.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button 
          onClick={handleRefreshData}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Data
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={handleRefreshData}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh All Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return <Dashboard />;
}
