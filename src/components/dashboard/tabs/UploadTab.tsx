import React, { useCallback, useState } from "react";
import { Upload, FolderOpen, FileText, Eye, Trash, Calendar, Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../ui/card";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { ScrollArea } from "../../ui/scroll-area";
import { Label } from "../../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { cn } from "../../../lib/utils";
import { UploadedFile } from "../../../types";
import { extractDataAPI } from "../../../services/api";

interface UploadTabProps {
  files: UploadedFile[];
  onAddFiles: (files: UploadedFile[]) => void;
  onRemoveFile: (index: number) => void;
  companyId?: string;
}

export function UploadTab({ files, onAddFiles, onRemoveFile, companyId = "company_1" }: UploadTabProps) {
  const [isDragging, setDragging] = useState(false);
  const [uploadDate, setUploadDate] = useState("");
  const [periodType, setPeriodType] = useState<string>("Q");
  const [uploading, setUploading] = useState<Record<number, boolean>>({});
  const [uploadErrors, setUploadErrors] = useState<Record<number, string>>({});

  const onDrop = useCallback((evt: React.DragEvent) => {
    evt.preventDefault();
    setDragging(false);
    const dropped = Array.from(evt.dataTransfer.files).map((f: File) => ({
      name: f.name,
      size: f.size,
      type: f.type,
      status: "pending",
      file: f,
      company_id: companyId,
    }));
    if (dropped.length) {
      onAddFiles(dropped);
    }
  }, [onAddFiles, companyId]);

  const onSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const fl = e.target.files ? Array.from(e.target.files) : [];
    if (!fl.length) return;
    const added = fl.map((f: File) => ({ 
      name: f.name, 
      size: f.size, 
      type: f.type, 
      status: "pending",
      file: f,
      company_id: companyId,
    }));
    onAddFiles(added);
  }, [onAddFiles, companyId]);

  const handleUploadToAPI = async (fileIndex: number) => {
    const file = files[fileIndex];
    
    if (!file.file) {
      setUploadErrors({ ...uploadErrors, [fileIndex]: "No file found" });
      return;
    }

    if (!uploadDate) {
      setUploadErrors({ ...uploadErrors, [fileIndex]: "Please select a period date" });
      return;
    }

    setUploading({ ...uploading, [fileIndex]: true });
    setUploadErrors({ ...uploadErrors, [fileIndex]: "" });

    try {
      const result = await extractDataAPI.extractData({
        file: file.file,
        company_id: companyId,
        date: uploadDate,
        period_type: periodType,
        extract_again: false,
      });

      // Update file status to parsed
      const updatedFiles = [...files];
      updatedFiles[fileIndex] = {
        ...updatedFiles[fileIndex],
        status: "parsed",
        date: uploadDate,
        period_type: periodType,
        extractedData: result,
      };
      onAddFiles(updatedFiles);
      
      setUploading({ ...uploading, [fileIndex]: false });
    } catch (error: any) {
      console.error("Upload failed:", error);
      setUploadErrors({ 
        ...uploadErrors, 
        [fileIndex]: error.message || "Upload failed" 
      });
      setUploading({ ...uploading, [fileIndex]: false });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Document Upload & Management</CardTitle>
        <CardDescription>Upload and manage documents for this company</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Period Configuration */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="period-date" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Period Date
                </Label>
                <Input
                  id="period-date"
                  type="date"
                  value={uploadDate}
                  onChange={(e) => setUploadDate(e.target.value)}
                  className="bg-white"
                  placeholder="Select period end date"
                />
                <p className="text-xs text-neutral-500">
                  Select the period end date (e.g., 2024-12-31 for Q4 2024)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="period-type">Period Type</Label>
                <Select value={periodType} onValueChange={setPeriodType}>
                  <SelectTrigger id="period-type" className="bg-white">
                    <SelectValue placeholder="Select period type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Q">Quarterly (Q)</SelectItem>
                    <SelectItem value="A">Annual (A)</SelectItem>
                    <SelectItem value="M">Monthly (M)</SelectItem>
                    <SelectItem value="YTD">Year-to-Date (YTD)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-neutral-500">
                  Select the reporting period type
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            "group relative grid place-items-center rounded-2xl border-2 border-dashed p-10 text-center transition",
            isDragging ? "border-black bg-neutral-100" : "border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50"
          )}
        >
          <Upload className="mb-3 h-10 w-10 opacity-70" />
          <div className="text-lg font-medium">Drop files here</div>
          <div className="text-sm text-neutral-500">or</div>
          <div className="mt-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm shadow-sm hover:bg-neutral-50">
              <FolderOpen className="h-4 w-4" />
              <span>Browse files</span>
              <Input onChange={onSelect} type="file" multiple className="hidden" />
            </label>
          </div>
          <div className="mt-3 text-xs text-neutral-500">Supported: PDF, XLS/XLSX, CSV, PNG, JPG</div>
        </div>

        {/* File List */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-medium">Uploaded Files ({files.length})</div>
            {!uploadDate && files.some(f => f.status === "pending") && (
              <Badge variant="outline" className="gap-1 text-amber-600 border-amber-600">
                <AlertCircle className="h-3 w-3" />
                Set period date to upload
              </Badge>
            )}
          </div>
          <ScrollArea className="h-[320px] rounded-xl border">
            <div className="divide-y">
              {files.map((f, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <FileText className="h-5 w-5 text-neutral-500" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{f.name}</div>
                      <div className="flex items-center gap-2 text-xs text-neutral-500">
                        <span>{(f.size / 1024 / 1024).toFixed(2)} MB</span>
                        {f.date && f.period_type && (
                          <>
                            <span>•</span>
                            <span>{f.date} ({f.period_type})</span>
                          </>
                        )}
                      </div>
                    </div>
                    {f.status === "parsed" && (
                      <Badge variant="secondary" className="gap-1 bg-green-100 text-green-700">
                        <CheckCircle2 className="h-3 w-3" />
                        Parsed
                      </Badge>
                    )}
                    {f.status === "pending" && (
                      <Badge variant="secondary" className="gap-1">
                        Pending
                      </Badge>
                    )}
                    {uploading[idx] && (
                      <Badge variant="secondary" className="gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Uploading...
                      </Badge>
                    )}
                    {uploadErrors[idx] && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Error
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {f.status === "pending" && !uploading[idx] && (
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => handleUploadToAPI(idx)}
                        disabled={!uploadDate}
                        className="gap-1"
                      >
                        <Send className="h-3 w-3" />
                        Upload
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" disabled={uploading[idx]}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => onRemoveFile(idx)}
                      disabled={uploading[idx]}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {uploadErrors && Object.entries(uploadErrors).map(([idx, error]) => error && (
                <div key={`error-${idx}`} className="bg-red-50 px-4 py-2 text-xs text-red-600">
                  File {parseInt(idx) + 1}: {error}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
