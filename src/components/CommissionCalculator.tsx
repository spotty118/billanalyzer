
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface DeviceContribution {
  id: number;
  device_name: string;
  manufacturer: string;
  dpp_price: number | null;
  base_spiff: number | null;
  welcome_unlimited_upgrade: number | null;
  plus_ultimate_upgrade: number | null;
  welcome_unlimited_new: number | null;
  plus_ultimate_new: number | null;
  end_date: string | null;
}

interface ServiceContribution {
  id: number;
  name: string;
  category: string;
  contribution: number | null;
  spiff: number | null;
  total_contribution: number | null;
  end_date: string | null;
}

type PlanType = "welcome_unlimited_new" | "ultimate_new" | "welcome_unlimited_upgrade" | "ultimate_upgrade";

interface DevicePlan {
  deviceId: string;
  planType: PlanType;
}

export function CommissionCalculator() {
  const [devicePlans, setDevicePlans] = useState<DevicePlan[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [devices, setDevices] = useState<DeviceContribution[]>([]);
  const [services, setServices] = useState<ServiceContribution[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch devices
        const { data: devicesData, error: devicesError } = await supabase
          .from('device_contributions')
          .select('*')
          .order('manufacturer', { ascending: true })
          .order('device_name', { ascending: true });

        if (devicesError) throw devicesError;
        setDevices(devicesData || []);

        // Fetch services
        const { data: servicesData, error: servicesError } = await supabase
          .from('service_contributions')
          .select('*')
          .order('category', { ascending: true })
          .order('name', { ascending: true });

        if (servicesError) throw servicesError;
        setServices(servicesData || []);

      } catch (err) {
        console.error('Error fetching data:', err);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load commission data. Please try again later.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const addDevicePlan = () => {
    setDevicePlans([...devicePlans, { deviceId: "", planType: "welcome_unlimited_new" }]);
  };

  const removeDevicePlan = (index: number) => {
    setDevicePlans(devicePlans.filter((_, i) => i !== index));
  };

  const updateDevicePlan = (index: number, field: keyof DevicePlan, value: string) => {
    const newDevicePlans = [...devicePlans];
    newDevicePlans[index] = {
      ...newDevicePlans[index],
      [field]: field === 'planType' ? value as PlanType : value
    };
    setDevicePlans(newDevicePlans);
  };

  const commission = useMemo(() => {
    let total = 0;

    devicePlans.forEach(({ deviceId, planType }) => {
      const device = devices.find(d => d.id.toString() === deviceId);
      if (device) {
        const planAmount = planType === 'welcome_unlimited_new' ? device.welcome_unlimited_new :
                         planType === 'ultimate_new' ? device.plus_ultimate_new :
                         planType === 'welcome_unlimited_upgrade' ? device.welcome_unlimited_upgrade :
                         device.plus_ultimate_upgrade;
        const spiffAmount = device.base_spiff ?? 0;
        total += (planAmount ?? 0) + spiffAmount;
      }
    });

    selectedServices.forEach(serviceId => {
      const service = services.find(s => s.id.toString() === serviceId);
      if (service) {
        total += (service.total_contribution ?? 0);
      }
    });

    return total;
  }, [devicePlans, selectedServices, devices, services]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <div 
              className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"
              data-testid="loading-spinner"
            ></div>
            <div>Loading commission data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Commission Calculator</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-4">
            {devicePlans.map((plan, index) => (
              <div key={index} className="flex items-start space-x-4 p-4 border rounded-lg">
                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Device</label>
                    <Select 
                      value={plan.deviceId} 
                      onValueChange={(value) => updateDevicePlan(index, 'deviceId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a device" />
                      </SelectTrigger>
                      <SelectContent>
                        {devices.map((device) => (
                          <SelectItem key={device.id} value={device.id.toString()}>
                            {device.manufacturer} {device.device_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Plan Type</label>
                    <Select 
                      value={plan.planType} 
                      onValueChange={(value) => updateDevicePlan(index, 'planType', value as PlanType)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a plan type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="welcome_unlimited_new">Welcome Unlimited (New)</SelectItem>
                        <SelectItem value="ultimate_new">Ultimate (New)</SelectItem>
                        <SelectItem value="welcome_unlimited_upgrade">Welcome Unlimited (Upgrade)</SelectItem>
                        <SelectItem value="ultimate_upgrade">Ultimate (Upgrade)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeDevicePlan(index)}
                  className="mt-2"
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <Button
              variant="outline"
              onClick={addDevicePlan}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Device
            </Button>
          </div>

          {devices.length > 0 && services.length > 0 && (
            <div className="space-y-4">
              <label className="text-sm font-medium">Add Services</label>
              <div className="space-y-2">
                {services.map((service) => (
                  <div key={service.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={service.id.toString()}
                      checked={selectedServices.includes(service.id.toString())}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedServices([...selectedServices, service.id.toString()]);
                        } else {
                          setSelectedServices(selectedServices.filter(id => id !== service.id.toString()));
                        }
                      }}
                    />
                    <label
                      htmlFor={service.id.toString()}
                      className="text-sm flex-1 flex justify-between items-center"
                    >
                      <span>{service.name}</span>
                      <span className="text-muted-foreground">
                        +${service.total_contribution?.toFixed(2)}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {commission > 0 && (
            <div className="pt-4 border-t">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Commission</p>
                <p className="text-3xl font-bold text-primary">
                  ${commission.toFixed(2)}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
