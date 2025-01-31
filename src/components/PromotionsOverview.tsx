import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { promotions } from "@/data/promotions";
import { useMemo, useState } from "react";

export function PromotionsOverview() {
  // Group similar promo types
  const promoGroups = useMemo(() => {
    const deviceTypes = ["Tablets/Connected Devices", "AllPhones"];
    const tradeTypes = ["Trade in", "BYOD"];
    const serviceTypes = ["Fios", "FWA", "Entertainment", "International"];
    const otherTypes = ["Prepaid", "Price Plan", "Port In", "Other"];

    const types = Array.from(new Set(promotions.map(p => p.promoType)));
    const grouped = [
      "All",
      ...deviceTypes.filter(t => types.includes(t)),
      ...tradeTypes.filter(t => types.includes(t)),
      ...serviceTypes.filter(t => types.includes(t)),
      ...otherTypes.filter(t => types.includes(t))
    ];

    return grouped;
  }, []);

  const [selectedType, setSelectedType] = useState("All");

  // Filter promotions based on active tab
  const filteredPromotions = useMemo(() => {
    if (selectedType === "All") return promotions;
    return promotions.filter(p => p.promoType === selectedType);
  }, [selectedType]);

  // Get count for each tab
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { All: promotions.length };
    promotions.forEach(p => {
      counts[p.promoType] = (counts[p.promoType] || 0) + 1;
    });
    return counts;
  }, []);

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-lg font-semibold">Promotions</h2>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="All Promotions" />
            </SelectTrigger>
            <SelectContent>
              {promoGroups.map(type => (
                <SelectItem key={type} value={type}>
                  <div className="flex items-center justify-between w-full">
                    <span className="capitalize">{type.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {tabCounts[type]}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="p-4 md:p-6">
            <div className="grid gap-6">
              {filteredPromotions.map((promo) => (
                <Card key={promo.id}>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-lg text-gray-900">
                          {promo.title}
                        </h3>
                        <span className="text-sm text-gray-500">
                          Start: {new Date(promo.startDate).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <Badge variant="outline" className="capitalize">
                          {promo.partnerType}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {promo.promoType}
                        </Badge>
                      </div>

                      <div>
                        <h4 className="font-medium text-sm text-gray-700 mb-2">Key Points:</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          {promo.keyPoints.map((point, idx) => (
                            <li key={`${promo.id}-point-${idx}`} className="text-sm text-gray-600">{point}</li>
                          ))}
                        </ul>
                      </div>

                      {promo.eligibility.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm text-gray-700 mb-2">Eligibility:</h4>
                          <ul className="list-disc pl-5 space-y-1">
                            {promo.eligibility.map((item, idx) => (
                              <li key={`${promo.id}-eligibility-${idx}`} className="text-sm text-gray-600">{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
