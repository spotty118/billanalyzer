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
import { getPromotions, PromotionType } from "@/data/verizonPlans";
import { useMemo, useState, useEffect } from "react";
import { Promotion } from "@/types";

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
    const fetchPromotions = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getPromotions();
        setPromotions(data);
      } catch (err) {
        setError('Failed to load promotions. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchPromotions();
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
