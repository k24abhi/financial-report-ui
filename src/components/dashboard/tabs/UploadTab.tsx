import React, { useCallback, useState } from "react";
import { Upload, FolderOpen, FileText, Eye, Trash } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../ui/card";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { ScrollArea } from "../../ui/scroll-area";
import { cn } from "../../../lib/utils";
import { UploadedFile } from "../../../types";

interface UploadTabProps {
  files: UploadedFile[];
  onAddFiles: (files: UploadedFile[]) => void;
  onRemoveFile: (index: number) => void;
}

export function UploadTab({ files, onAddFiles, onRemoveFile }: UploadTabProps) {
  const [isDragging, setDragging] = useState(false);

  const onDrop = useCallback((evt: React.DragEvent) => {
    evt.preventDefault();
    setDragging(false);
    const dropped = Array.from(evt.dataTransfer.files).map((f: any) => ({
      name: f.name,
      size: f.size,
      type: f.type,
      status: "parsed",
    }));
    if (dropped.length) {
      onAddFiles(dropped);
    }
  }, [onAddFiles]);

  const onSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const fl = e.target.files ? Array.from(e.target.files) : [];
    if (!fl.length) return;
    const added = fl.map((f: any) => ({ name: f.name, size: f.size, type: f.type, status: "parsed" }));
    onAddFiles(added);
  }, [onAddFiles]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Document Upload & Management</CardTitle>
        <CardDescription>Upload and manage documents for this company</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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
          </div>
          <ScrollArea className="h-[320px] rounded-xl border">
            <div className="divide-y">
              {files.map((f, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <FileText className="h-5 w-5 text-neutral-500" />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{f.name}</div>
                      <div className="truncate text-xs text-neutral-500">{(f.size / 1024 / 1024).toFixed(2)} MB</div>
                    </div>
                    {f.status === "parsed" && (<Badge variant="secondary" className="ml-2">Parsed</Badge>)}
                  </div>
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => onRemoveFile(idx)}><Trash className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
