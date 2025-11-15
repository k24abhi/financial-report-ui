import React, { useCallback, useState } from "react";
import { Upload, FolderOpen, FileText, Eye, Trash } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../ui/card";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { ScrollArea } from "../../ui/scroll-area";

import { cn } from "../../../lib/utils";
import { UploadedFile, FinancialStatementType } from "../../../types";

interface UploadTabProps {
  files: UploadedFile[];
  onAddFiles: (files: UploadedFile[]) => void;
  onRemoveFile: (index: number) => void;
  onUpdateFileStatementType: (index: number, statementType: FinancialStatementType) => void;
}

export function UploadTab({ files, onAddFiles, onRemoveFile, onUpdateFileStatementType }: UploadTabProps) {
  const [isDragging, setDragging] = useState(false);
  const [selectedStatementType, setSelectedStatementType] = useState<FinancialStatementType>('Q1');

  const onDrop = useCallback((evt: React.DragEvent) => {
    evt.preventDefault();
    setDragging(false);
    const dropped = Array.from(evt.dataTransfer.files).map((f: any) => ({
      name: f.name,
      size: f.size,
      type: f.type,
      status: "parsed",
      statementType: selectedStatementType,
    }));
    if (dropped.length) {
      onAddFiles(dropped);
    }
  }, [onAddFiles, selectedStatementType]);

  const onSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const fl = e.target.files ? Array.from(e.target.files) : [];
    if (!fl.length) return;
    const added = fl.map((f: any) => ({ name: f.name, size: f.size, type: f.type, status: "parsed", statementType: selectedStatementType }));
    onAddFiles(added);
  }, [onAddFiles, selectedStatementType]);

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

        {/* Financial Statement Type Selector */}
        <div className="space-y-4">
          <div className="text-sm font-medium">Financial Statement Type</div>
          
          {/* Quarterly Statements */}
          <div>
            <div className="text-sm font-medium text-neutral-700 mb-3">Quarterly</div>
            <div className="flex gap-3">
              {[
                { value: 'Q1', label: 'Quarter-1' },
                { value: 'Q2', label: 'Quarter-2' },
                { value: 'Q3', label: 'Quarter-3' },
                { value: 'Q4', label: 'Quarter-4' }
              ].map((quarter) => (
                <button
                  key={quarter.value}
                  type="button"
                  onClick={() => setSelectedStatementType(quarter.value as FinancialStatementType)}
                  className={cn(
                    "flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-all duration-200",
                    selectedStatementType === quarter.value
                      ? "bg-black text-white border-black shadow-sm"
                      : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50"
                  )}
                >
                  {quarter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Half Yearly Statements */}
          <div>
            <div className="text-sm font-medium text-neutral-700 mb-3">Half Yearly</div>
            <div className="flex gap-3">
              {[
                { value: 'H1', label: 'Half Yearly-1' },
                { value: 'H2', label: 'Half Yearly-2' }
              ].map((half) => (
                <button
                  key={half.value}
                  type="button"
                  onClick={() => setSelectedStatementType(half.value as FinancialStatementType)}
                  className={cn(
                    "flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-all duration-200",
                    selectedStatementType === half.value
                      ? "bg-black text-white border-black shadow-sm"
                      : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50"
                  )}
                >
                  {half.label}
                </button>
              ))}
            </div>
          </div>

          {/* Annual Statement */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-neutral-700">Yearly</div>
            <div className="grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={() => setSelectedStatementType('Annual')}
                className={cn(
                  "rounded-lg border px-4 py-3 text-sm font-medium transition-all duration-200",
                  selectedStatementType === 'Annual'
                    ? "bg-black text-white border-black shadow-sm"
                    : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50"
                )}
              >
                Annual
              </button>
            </div>
          </div>
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
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{f.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="truncate text-xs text-neutral-500">{(f.size / 1024 / 1024).toFixed(2)} MB</div>
                        {f.statementType && (
                          <Badge variant="outline" className="text-xs">
                            {f.statementType === 'H1' ? 'First Half' : 
                             f.statementType === 'H2' ? 'Second Half' : 
                             f.statementType === 'Annual' ? 'Annual' : f.statementType}
                          </Badge>
                        )}
                        {f.status === "parsed" && (<Badge variant="secondary">Parsed</Badge>)}
                      </div>
                    </div>
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
