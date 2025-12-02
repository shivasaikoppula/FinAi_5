import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DatasetUploadCardProps {
  onUploadComplete?: (stats: any) => void;
}

export default function DatasetUploadCard({ onUploadComplete }: DatasetUploadCardProps) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/dataset/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      toast({
        title: "Dataset Uploaded Successfully!",
        description: `Processed ${data.stats.totalTransactions} transactions`,
      });

      onUploadComplete?.(data.stats);
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Upload Fraud Dataset</CardTitle>
      </CardHeader>
      <CardContent>
        <label className="flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              {uploading ? "Uploading..." : "Click to upload CSV or ZIP file"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Supports IEEE Fraud Dataset format
            </p>
          </div>
          <input
            type="file"
            className="hidden"
            accept=".csv,.zip"
            disabled={uploading}
            onChange={handleFileUpload}
          />
        </label>

        {uploading && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Processing dataset...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
