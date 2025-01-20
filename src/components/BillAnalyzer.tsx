import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Upload } from "lucide-react";

export function BillAnalyzer() {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
    } else {
      toast({
        title: "Invalid File",
        description: "Please upload a PDF file.",
        variant: "destructive",
      });
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      // In a real implementation, this would call your backend API
      const response = await fetch('/api/analyze-bill', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Analysis failed');

      toast({
        title: "Bill Analysis Complete",
        description: "The bill has been analyzed successfully.",
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Unable to analyze the bill.",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bill Analyzer</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
              id="bill-upload"
            />
            <label
              htmlFor="bill-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <Upload className="h-8 w-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-600">
                {file ? file.name : "Upload Verizon PDF Bill"}
              </span>
            </label>
          </div>
          <Button
            onClick={handleAnalyze}
            className="w-full"
            disabled={!file || analyzing}
          >
            {analyzing ? "Analyzing..." : "Analyze Bill"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}