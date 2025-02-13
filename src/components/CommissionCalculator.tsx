import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";
import { devices, addons } from "@/data/devices";

export function CommissionCalculator() {
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

  // Calculate total commission
  const commission = useMemo(() => {
    let total = 0;

    // Add device base commission
    const device = devices.find(d => d.id === selectedDevice);
    if (device) {
      total += device.baseCommission;
    }

    // Add addon commissions
    selectedAddons.forEach(addonId => {
      const addon = addons.find(a => a.id === addonId);
      if (addon) {
        total += addon.commission;
      }
    });

    return total;
  }, [selectedDevice, selectedAddons]);

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
                  <SelectItem key={device.id} value={device.id}>
                    <div className="flex justify-between items-center w-full">
                      <span>{device.name}</span>
                      <span className="text-sm text-muted-foreground">
                        ${device.baseCommission}
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
