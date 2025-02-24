import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Json } from "@/integrations/supabase/types";

interface CommissionDevice {
  device_id: number;
  model_name: string;
  brand_name: string;
  dpp_price: number | null;
  welcome_unlimited_upgrade: number | null;
  ultimate_upgrade: number | null;
  welcome_unlimited_new: number | null;
  ultimate_new: number | null;
  spiff_amount: number | null;
}

interface CommissionService {
  service_id: number;
  name: string;
  base_commission: number | null;
  spiff_amount: number | null;
}

interface DatabaseResponse {
  device_id: number;
  model_name: string;
  dpp_price: number | null;
  welcome_unlimited_upgrade: number | null;
  ultimate_upgrade: number | null;
  welcome_unlimited_new: number | null;
  ultimate_new: number | null;
  spiff_amount: number | null;
  commission_brands: {
    name: string;
  } | null;
}

type PlanType = "welcome_unlimited_new" | "ultimate_new" | "welcome_unlimited_upgrade" | "ultimate_upgrade";

interface DevicePlan {
  deviceId: string;
  planType: PlanType;
}

export function CommissionCalculator() {
  const [devicePlans, setDevicePlans] = useState<DevicePlan[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [devices, setDevices] = useState<CommissionDevice[]>([]);
  const [services, setServices] = useState<CommissionService[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchDevicesAndServices = async () => {
      try {
        setLoading(true);
        
        const { data: devicesData, error: devicesError } = await supabase
          .from('commission_devices')
          .select(`
            device_id,
            model_name,
            dpp_price,
            welcome_unlimited_upgrade,
            ultimate_upgrade,
            welcome_unlimited_new,
            ultimate_new,
            spiff_amount,
            commission_brands (
              name
            )
          `)
          .is('end_date', null)
          .order('model_name');

        if (devicesError) {
          console.error('Devices fetch error:', devicesError);
          throw devicesError;
        }

        if (!devicesData) {
          throw new Error('No devices data returned');
        }

        const formattedDevices: CommissionDevice[] = (devicesData as DatabaseResponse[]).map(device => ({
          device_id: device.device_id,
          model_name: device.model_name,
          brand_name: device.commission_brands?.name || '',
          dpp_price: device.dpp_price,
          welcome_unlimited_upgrade: device.welcome_unlimited_upgrade,
          ultimate_upgrade: device.ultimate_upgrade,
          welcome_unlimited_new: device.welcome_unlimited_new,
          ultimate_new: device.ultimate_new,
          spiff_amount: device.spiff_amount
        }));

        setDevices(formattedDevices);

        const { data: servicesData, error: servicesError } = await supabase
          .from('commission_services')
          .select('*')
          .is('end_date', null)
          .order('name');

        if (servicesError) {
          console.error('Services fetch error:', servicesError);
          throw servicesError;
        }

        setServices(servicesData || []);

      } catch (err) {
        console.error('Error fetching data:', err);
        toast({
          title: "Error",
          description: "Failed to load commission data. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDevicesAndServices();
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
      const device = devices.find(d => d.device_id.toString() === deviceId);
      if (device) {
        const planAmount = device[planType] ?? 0;
        const spiffAmount = device.spiff_amount ?? 0;
        total += planAmount + spiffAmount;
      }
    });

    selectedServices.forEach(serviceId => {
      const service = services.find(s => s.service_id.toString() === serviceId);
      if (service) {
        const baseCommission = service.base_commission ?? 0;
        const spiffAmount = service.spiff_amount ?? 0;
        total += baseCommission + spiffAmount;
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
                          <SelectItem key={device.device_id} value={device.device_id.toString()}>
                            {device.brand_name} {device.model_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Plan Type</label>
                    <Select 
                      value={plan.planType} 
                      onValueChange={(value) => updateDevicePlan(index, 'planType', value)}
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
                  <div key={service.service_id} className="flex items-center space-x-2">
                    <Checkbox
                      id={service.service_id.toString()}
                      checked={selectedServices.includes(service.service_id.toString())}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedServices([...selectedServices, service.service_id.toString()]);
                        } else {
                          setSelectedServices(selectedServices.filter(id => id !== service.service_id.toString()));
                        }
                      }}
                    />
                    <label
                      htmlFor={service.service_id.toString()}
                      className="text-sm flex-1 flex justify-between items-center"
                    >
                      <span>{service.name}</span>
                      <span className="text-muted-foreground">
                        +${((service.base_commission ?? 0) + (service.spiff_amount ?? 0)).toFixed(2)}
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
