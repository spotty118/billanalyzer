import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export function NumberLookup() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleLookup = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would call your backend API that interfaces with Twilio
      const response = await fetch('/api/lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      });
      
      if (!response.ok) throw new Error('Lookup failed');
      
      toast({
        title: "Number Lookup Complete",
        description: "Carrier information retrieved successfully.",
      });
    } catch (error) {
      toast({
        title: "Lookup Failed",
        description: "Unable to retrieve carrier information.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Number Lookup</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Phone Number</label>
            <Input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Enter phone number"
              className="mt-1"
            />
          </div>
          <Button 
            onClick={handleLookup} 
            className="w-full"
            disabled={loading}
          >
            {loading ? "Looking up..." : "Lookup Number"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}