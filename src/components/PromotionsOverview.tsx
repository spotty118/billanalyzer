import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const promotions = [
  {
    title: "New Line Special",
    description: "Get $500 off when adding a new line with any 5G plan",
    expires: "2024-05-01",
  },
  {
    title: "Trade-In Bonus",
    description: "Up to $1000 trade-in value for eligible devices",
    expires: "2024-04-15",
  },
  {
    title: "Family Plan Discount",
    description: "Save $25/line when adding 4+ lines",
    expires: "2024-06-30",
  },
];

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
              key={promo.title}
              className="border-b border-gray-200 last:border-0 pb-4 last:pb-0"
            >
              <h3 className="font-semibold text-lg">{promo.title}</h3>
              <p className="text-sm text-gray-600">{promo.description}</p>
              <p className="text-xs text-gray-400 mt-1">
                Expires: {promo.expires}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}