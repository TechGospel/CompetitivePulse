import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Download, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type UploadType = "competitors" | "pricing" | "market_data";

interface UploadStatus {
  status: "idle" | "uploading" | "processing" | "success" | "error";
  progress: number;
  message: string;
}

export default function BulkUpload() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploadType, setUploadType] = useState<UploadType>("competitors");
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    status: "idle",
    progress: 0,
    message: ""
  });

  const uploadTypes = [
    { value: "competitors", label: "Competitor Data", description: "Upload competitor information, contact details, and basic metrics" },
    { value: "pricing", label: "Pricing Data", description: "Upload pricing information for products/services across competitors" },
    { value: "market_data", label: "Market Data", description: "Upload market trends, share data, and industry metrics" }
  ];

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadStatus({ status: "idle", progress: 0, message: "" });
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive"
      });
      return;
    }

    setUploadStatus({ status: "uploading", progress: 10, message: "Preparing upload..." });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', uploadType);

    try {
      setUploadStatus({ status: "uploading", progress: 30, message: "Uploading file..." });

      const response = await fetch('/api/bulk-upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      setUploadStatus({ status: "processing", progress: 60, message: "Processing data..." });

      const result = await response.json();

      setUploadStatus({ status: "processing", progress: 90, message: "Validating data..." });

      // Simulate processing time
      setTimeout(() => {
        setUploadStatus({ 
          status: "success", 
          progress: 100, 
          message: `Successfully processed ${result.recordsProcessed || 0} records` 
        });
        toast({
          title: "Upload successful",
          description: `${result.recordsProcessed || 0} records have been processed and added to the database.`
        });
      }, 1000);

    } catch (error) {
      setUploadStatus({ 
        status: "error", 
        progress: 0, 
        message: "Upload failed. Please check your file format and try again." 
      });
      toast({
        title: "Upload failed",
        description: "There was an error processing your file. Please check the format and try again.",
        variant: "destructive"
      });
    }
  };

  const downloadTemplate = () => {
    const templates = {
      competitors: `Name,Category,Price_Range_Min,Price_Range_Max,Market_Share,Trend_Status
"Acme Corp","Technology","29.99","99.99","15.5","growing"
"Beta Inc","Finance","19.99","149.99","12.3","stable"
"Gamma Ltd","Healthcare","49.99","199.99","8.7","declining"`,
      pricing: `Competitor,Price
"Acme Corp","29.99"
"Beta Inc","49.99"
"Gamma Ltd","89.99"`,
      market_data: `Date,Metric,Value,Competitor,Category
"2025-01-01","Market Share","15.5","Acme Corp","Technology"
"2025-01-01","Growth Rate","12.3","Beta Inc","Finance"`
    };

    const csvContent = templates[uploadType];
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `${uploadType}_template.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (!user || (user.role !== 'admin' && user.role !== 'analyst')) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access bulk upload functionality.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 lg:py-8 space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Bulk Data Upload</h1>
        <p className="text-muted-foreground mt-2">
          Upload large datasets for competitors, pricing, and market data
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upload Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Data
            </CardTitle>
            <CardDescription>
              Select your data type and upload a CSV file
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="upload-type">Data Type</Label>
              <Select value={uploadType} onValueChange={(value) => setUploadType(value as UploadType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select data type" />
                </SelectTrigger>
                <SelectContent>
                  {uploadTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {uploadTypes.find(t => t.value === uploadType)?.description}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file-upload">CSV File</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              {file && (
                <p className="text-sm text-muted-foreground">
                  Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            {uploadStatus.status !== "idle" && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {uploadStatus.status === "success" && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {uploadStatus.status === "error" && <AlertCircle className="h-4 w-4 text-red-500" />}
                  <span className="text-sm font-medium">{uploadStatus.message}</span>
                </div>
                <Progress value={uploadStatus.progress} className="w-full" />
              </div>
            )}

            <Button 
              onClick={handleUpload} 
              disabled={!file || uploadStatus.status === "uploading" || uploadStatus.status === "processing"}
              className="w-full"
            >
              {uploadStatus.status === "uploading" || uploadStatus.status === "processing" ? "Processing..." : "Upload Data"}
            </Button>
          </CardContent>
        </Card>

        {/* Template Download */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Download Template
            </CardTitle>
            <CardDescription>
              Get the correct CSV format for your data type
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <FileText className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h3 className="font-medium">{uploadTypes.find(t => t.value === uploadType)?.label} Template</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Download a CSV template with the correct column headers and sample data
                  </p>
                </div>
              </div>

              <Button variant="outline" onClick={downloadTemplate} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download {uploadTypes.find(t => t.value === uploadType)?.label} Template
              </Button>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Important:</strong> Ensure your CSV file matches the template format exactly. 
                The first row should contain column headers, and each subsequent row should contain data.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <h4>File Requirements:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>File format: CSV (Comma Separated Values)</li>
              <li>Maximum file size: 10MB</li>
              <li>Encoding: UTF-8</li>
              <li>First row must contain column headers</li>
            </ul>
            
            <h4 className="mt-4">Data Validation:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>All required fields must be provided</li>
              <li>Duplicate entries will be skipped</li>
              <li>Invalid data formats will be reported</li>
              <li>You'll receive a summary after processing</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}