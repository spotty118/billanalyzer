import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { promotions } from "@/data/verizonPlans";
import { Badge } from "@/components/ui/badge";

export function PromotionsOverview() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Promotions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {promotions.map((promo) => (
            <div
              key={promo.id}
              className="border-b border-gray-200 last:border-0 pb-4 last:pb-0"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-lg">{promo.title}</h3>
                <Badge variant="outline" className="capitalize">
                  {promo.type}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">{promo.description}</p>
              <div className="flex justify-between items-center mt-2">
                <p className="text-sm text-verizon-red font-semibold">
                  {promo.value}
                </p>
                <p className="text-xs text-gray-400">
                  Expires: {new Date(promo.expires).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}