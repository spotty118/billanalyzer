
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
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

type FilterType = "All" | "phones" | "tablets" | "watches" | "accessories" | "service_discounts";

interface DatabasePromotion {
  id: number;
  title: string;
  category: string;
  description: string;
  requirements: string[];
  value: number;
  end_date: string;
}

const LoadingState = () => (
  <div className="space-y-4">
    <Skeleton className="h-[200px] w-full" />
    <Skeleton className="h-[200px] w-full" />
  </div>
);

export function PromotionsOverview() {
  const [promotions, setPromotions] = useState<DatabasePromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<FilterType>("All");
  const { toast } = useToast();

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const { data, error } = await supabase
          .from('verizon_promotions')
          .select('*')
          .order('value', { ascending: false });

        if (error) throw error;

        setPromotions(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching promotions:', err);
        setErrorMessage(err instanceof Error ? err.message : 'Failed to load promotions');
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load promotions. Please try again later.",
        });
        setLoading(false);
      }
    };

    fetchPromotions();
  }, [toast]);

  // Group promotion types with "All" option
  const promoGroups: FilterType[] = useMemo(() => {
    const types = Array.from(new Set(promotions.map(p => p.category))) as FilterType[];
    return ["All", ...types];
  }, [promotions]);

  // Filter promotions based on selected type
  const filteredPromotions = useMemo(() => {
    if (selectedType === "All") return promotions;
    return promotions.filter(p => p.category === selectedType);
  }, [selectedType, promotions]);

  // Get count for each category
  const categoryCounts = useMemo(() => {
    const counts = new Map<FilterType, number>([["All", promotions.length]]);
    promotions.forEach(p => {
      const currentCount = counts.get(p.category as FilterType) || 0;
      counts.set(p.category as FilterType, currentCount + 1);
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

  if (errorMessage) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
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
            onValueChange={(value) => setSelectedType(value as FilterType)}
          >
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="All Promotions" />
            </SelectTrigger>
            <SelectContent>
              {promoGroups.map(type => (
                <SelectItem key={type} value={type}>
                  <div className="flex items-center justify-between w-full">
                    <span className="capitalize">{type.replace(/_/g, ' ')}</span>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {categoryCounts.get(type)}
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
                        Expires: {new Date(promo.end_date).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Badge variant="outline" className="capitalize">
                        ${promo.value.toFixed(2)}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {promo.category.replace(/_/g, ' ')}
                      </Badge>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600">{promo.description}</p>
                    </div>

                    {promo.requirements && promo.requirements.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm text-gray-700 mb-2">Requirements:</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          {promo.requirements.map((req, idx) => (
                            <li key={`${promo.id}-req-${idx}`} className="text-sm text-gray-600">
                              {req}
                            </li>
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
