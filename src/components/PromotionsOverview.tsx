import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Promotion, PromotionType } from "@/data/types/verizonTypes";
import { useState, useEffect, useMemo } from "react";

type FilterType = PromotionType | 'All';

const LoadingState = () => (
  <div className="space-y-4">
    <Skeleton className="h-[200px] w-full" />
    <Skeleton className="h-[200px] w-full" />
  </div>
);

export function PromotionsOverview() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<FilterType>("All");

  useEffect(() => {
    // Mock promotions data
    const mockPromotions: Promotion[] = [
      {
        id: "1",
        title: "Save $200 on new iPhone",
        description: "Get $200 off the latest iPhone with select trade-in.",
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        type: "device",
        value: "$200",
        terms: ["With approved credit", "Limited time offer"],
        eligiblePlans: ["Unlimited Plus", "Unlimited Welcome"],
        stackable: true
      },
      {
        id: "2",
        title: "50% off Unlimited Plan",
        description: "New customers get 50% off Unlimited Welcome plan for 12 months.",
        expires: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        type: "plan",
        value: "50% off",
        terms: ["New customers only", "12-month commitment"],
        eligiblePlans: ["Unlimited Welcome"],
        stackable: false
      },
      {
        id: "3",
        title: "Get up to $800 with trade-in",
        description: "Trade in your old phone and get up to $800 towards a new Samsung Galaxy.",
        expires: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
        type: "trade-in",
        value: "Up to $800",
        terms: ["Trade-in condition applies", "Select models only"],
        eligiblePlans: ["Unlimited Plus", "Unlimited Ultimate"],
        stackable: true
      }
    ];

    setLoading(false);
    setPromotions(mockPromotions);
  }, []);

  // Group promotion types with "All" option
  const promoGroups: FilterType[] = useMemo(() => {
    const types = Array.from(new Set(promotions.map(p => p.type)));
    return ["All", ...types];
  }, [promotions]);

  // Filter promotions based on active tab
  const filteredPromotions = useMemo(() => {
    if (selectedType === "All") return promotions;
    return promotions.filter(p => p.type === selectedType);
  }, [selectedType, promotions]);

  // Get count for each tab
  const tabCounts = useMemo(() => {
    const counts = new Map<FilterType, number>([["All", promotions.length]]);
    promotions.forEach(p => {
      const currentCount = counts.get(p.type) || 0;
      counts.set(p.type, currentCount + 1);
    });
    return counts;
  }, [promotions]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <LoadingState />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-lg font-semibold">Promotions</h2>
          <Select 
            value={selectedType} 
            onValueChange={(value: string) => setSelectedType(value as FilterType)}
          >
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="All Promotions" />
            </SelectTrigger>
            <SelectContent>
              {promoGroups.map(type => (
                <SelectItem key={type} value={type}>
                  <div className="flex items-center justify-between w-full">
                    <span className="capitalize">{type.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {tabCounts.get(type)}
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
                        Expires: {new Date(promo.expires).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Badge variant="outline" className="capitalize">
                        {promo.value}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {promo.type}
                      </Badge>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600">{promo.description}</p>
                    </div>

                    {promo.terms && promo.terms.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm text-gray-700 mb-2">Terms:</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          {promo.terms.map((term, idx) => (
                            <li key={`${promo.id}-term-${idx}`} className="text-sm text-gray-600">
                              {term}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {promo.eligiblePlans && promo.eligiblePlans.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm text-gray-700 mb-2">Eligible Plans:</h4>
                        <div className="flex flex-wrap gap-2">
                          {promo.eligiblePlans.map((plan) => (
                            <Badge key={plan} variant="secondary">
                              {plan}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {promo.stackable && (
                      <Badge variant="outline" className="bg-green-50">
                        Stackable with other promotions
                      </Badge>
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
