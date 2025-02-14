
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";

export function PricingGrid() {
  const plans = [
    {
      name: "Ultimate",
      prices: [90, 80, 65, 55, 52]
    },
    {
      name: "Plus",
      prices: [80, 70, 55, 45, 42]
    },
    {
      name: "Welcome",
      prices: [65, 55, 40, 30, 27]
    }
  ];

  const lineTypes = ["1 Line", "2 Lines", "3 Lines", "4 Lines", "5+ Lines"];

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Plan Type</TableHead>
              {lineTypes.map((type) => (
                <TableHead key={type} className="text-center">{type}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((plan) => (
              <TableRow key={plan.name}>
                <TableCell className="font-medium">{plan.name}</TableCell>
                {plan.prices.map((price, index) => (
                  <TableCell key={index} className="text-center">
                    ${price}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
