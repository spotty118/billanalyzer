import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { scrapeVerizonPromotions, fetchVerizonPlans } from "@/utils/scraper";

export default function AdminDashboard() {
  const { data: promotions } = useQuery({
    queryKey: ["promotions"],
    queryFn: scrapeVerizonPromotions
  });

  const { data: plans } = useQuery({
    queryKey: ["plans"],
    queryFn: fetchVerizonPlans
  });

  return (
    <div className="flex h-screen">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Promotions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{promotions?.length || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Available Plans</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{plans?.length || 0}</p>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">No recent activity</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
