
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo, useEffect } from "react";
import { addons, type Addon } from "@/data/devices";
import { supabase } from "@/integrations/supabase/client";

interface Device {
  id: string;
  external_id: string;
  name: string;
  base_commission: number;
  category: 'phone' | 'tablet' | 'watch' | 'accessory';
  brand: 'Apple' | 'Google' | 'Samsung';
  dpp_price: number | null;
  spiff_amount: number;
  welcome_upgrade: number;
  unlimited_plus_upgrade: number;
  welcome_new: number;
  unlimited_plus_new: number;
}

export function CommissionCalculator() {
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('devices')
          .select('*')
          .order('name');

        if (error) {
          throw error;
        }

        // Add type assertion to ensure the data matches our Device interface
        const typedData = data.map(device => ({
          ...device,
          category: device.category as 'phone' | 'tablet' | 'watch' | 'accessory',
          brand: device.brand as 'Apple' | 'Google' | 'Samsung'
        }));

        setDevices(typedData);
      } catch (err) {
        console.error('Error fetching devices:', err);
        setError('Failed to load devices. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, []);

  // Calculate total commission
  const commission = useMemo(() => {
    let total = 0;

    // Add device base commission
    const device = devices.find(d => d.external_id === selectedDevice);
    if (device) {
      total += device.base_commission;
    }

    // Add addon commissions
    selectedAddons.forEach(addonId => {
      const addon = addons.find(a => a.id === addonId);
      if (addon) {
        total += addon.commission;
      }
    });

    return total;
  }, [selectedDevice, selectedAddons, devices]);

  // Group addons by category for better organization
  const groupedAddons = useMemo(() => {
    const groups: Record<string, Addon[]> = {};
    addons.forEach(addon => {
      if (!groups[addon.category]) {
        groups[addon.category] = [];
      }
      groups[addon.category].push(addon);
    });
    return groups;
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <div 
              className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"
              data-testid="loading-spinner"
            ></div>
            <div>Loading devices...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-red-600">
            {error}
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
          {/* Device Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Device</label>
            <Select value={selectedDevice} onValueChange={setSelectedDevice}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a device" />
              </SelectTrigger>
              <SelectContent>
                {devices.map((device) => (
                  <SelectItem key={device.id} value={device.external_id}>
                    <div className="flex justify-between items-center w-full">
                      <span>{device.name}</span>
                      <span className="text-sm text-muted-foreground">
                        ${device.base_commission}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Addons Selection */}
          {selectedDevice && (
            <div className="space-y-4">
              <label className="text-sm font-medium">Add Features</label>
              {Object.entries(groupedAddons).map(([category, categoryAddons]) => (
                <div key={category} className="space-y-2">
                  <label className="text-sm font-medium capitalize">{category}</label>
                  <div className="space-y-2">
                    {categoryAddons.map((addon) => (
                      <div key={addon.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={addon.id}
                          checked={selectedAddons.includes(addon.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedAddons([...selectedAddons, addon.id]);
                            } else {
                              setSelectedAddons(selectedAddons.filter(id => id !== addon.id));
                            }
                          }}
                        />
                        <label
                          htmlFor={addon.id}
                          className="text-sm flex-1 flex justify-between items-center"
                        >
                          <span>{addon.name}</span>
                          <span className="text-muted-foreground">+${addon.commission}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Commission Display */}
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
