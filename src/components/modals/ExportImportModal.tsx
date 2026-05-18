'use client';

import { useState, useRef } from 'react';
import { X, Download, Upload, FileJson, FileSpreadsheet, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: () => void;
}

export function ExportImportModal({ isOpen, onClose, onImportSuccess }: ExportImportModalProps) {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = (format: 'json' | 'csv' | 'html') => {
    window.open(`/api/export/${format}`, '_blank');
  };

  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const processFile = async (file: File) => {
    setImporting(true);
    setImportResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('format', file.name.endsWith('.json') ? 'json' : 'html');

    try {
      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Import failed');
      }

      setImportResult(data);
      if (data.imported > 0) {
        onImportSuccess?.();
      }
    } catch (error: any) {
      setImportResult({ imported: 0, skipped: 0, errors: [error.message] });
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-surface border border-border rounded-xl shadow-2xl pointer-events-auto"
            >
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-lg font-semibold">Export & Import</h2>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-border">
                <button
                  onClick={() => { setActiveTab('export'); setImportResult(null); }}
                  className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    activeTab === 'export'
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
                <button
                  onClick={() => { setActiveTab('import'); setImportResult(null); }}
                  className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    activeTab === 'import'
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  Import
                </button>
              </div>

              <div className="p-6">
                {activeTab === 'export' ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground mb-4">
                      Download all your links in your preferred format.
                    </p>

                    <button
                      onClick={() => handleExport('json')}
                      className="w-full flex items-center gap-3 p-4 bg-background border border-border rounded-xl hover:border-primary transition-colors text-left"
                    >
                      <FileJson className="w-8 h-8 text-primary" />
                      <div>
                        <p className="font-medium text-sm">JSON</p>
                        <p className="text-xs text-muted-foreground">Full backup with metadata, tags, and categories</p>
                      </div>
                    </button>

                    <button
                      onClick={() => handleExport('csv')}
                      className="w-full flex items-center gap-3 p-4 bg-background border border-border rounded-xl hover:border-primary transition-colors text-left"
                    >
                      <FileSpreadsheet className="w-8 h-8 text-green-500" />
                      <div>
                        <p className="font-medium text-sm">CSV</p>
                        <p className="text-xs text-muted-foreground">Spreadsheet format for Excel or Google Sheets</p>
                      </div>
                    </button>

                    <button
                      onClick={() => handleExport('html')}
                      className="w-full flex items-center gap-3 p-4 bg-background border border-border rounded-xl hover:border-primary transition-colors text-left"
                    >
                      <FileText className="w-8 h-8 text-orange-500" />
                      <div>
                        <p className="font-medium text-sm">HTML Bookmarks</p>
                        <p className="text-xs text-muted-foreground">Standard browser bookmark format</p>
                      </div>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Import links from a LinkVault JSON backup or a browser bookmark HTML file.
                    </p>

                    <div
                      onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
                      onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleFileDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                        dragActive
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-muted-foreground'
                      }`}
                    >
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm font-medium mb-1">
                        Drop a file here, or click to browse
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Supports .json and .html bookmark files
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json,.html"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>

                    {importing && (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        <span className="ml-2 text-sm text-muted-foreground">Importing...</span>
                      </div>
                    )}

                    {importResult && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span className="text-sm font-medium">
                            Imported {importResult.imported} links
                          </span>
                        </div>
                        {importResult.skipped > 0 && (
                          <p className="text-sm text-muted-foreground ml-7">
                            {importResult.skipped} duplicates skipped
                          </p>
                        )}
                        {importResult.errors.length > 0 && (
                          <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertCircle className="w-4 h-4 text-red-500" />
                              <span className="text-sm font-medium text-red-600 dark:text-red-400">
                                {importResult.errors.length} errors
                              </span>
                            </div>
                            <ul className="text-xs text-red-600 dark:text-red-400 space-y-1 max-h-32 overflow-y-auto">
                              {importResult.errors.map((err, i) => (
                                <li key={i}>{err}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
