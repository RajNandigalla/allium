'use client';

import { useState, useRef } from 'react';
import {
  Download,
  Upload,
  FileJson,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { adminApi, ModelDefinition } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import toast from 'react-hot-toast';
import packageJson from '../../../package.json';
import { downloadJSON } from '@/lib/download';

type ImportStrategy = 'skip' | 'overwrite';

interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: Array<{ name: string; error: string }>;
}

export default function ImportExportPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importStrategy, setImportStrategy] = useState<ImportStrategy>('skip');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Model selection state
  const [parsedModels, setParsedModels] = useState<ModelDefinition[]>([]);
  const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set());
  const [showModelSelection, setShowModelSelection] = useState(false);

  // Export all models as JSON
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = await adminApi.getModels();
      const exportData = {
        version: packageJson.version,
        exportedAt: new Date().toISOString(),
        models: data,
      };

      const filename = `allium-schema-${
        new Date().toISOString().split('T')[0]
      }.json`;
      downloadJSON(exportData, filename);

      toast.success(`Exported ${data.length} models successfully`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Export failed: ${message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Handle file selection and parse
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setImportResult(null);
    setShowModelSelection(false);

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.models || !Array.isArray(data.models)) {
        throw new Error(
          'Invalid schema file. Expected { models: [...] } format.'
        );
      }

      setParsedModels(data.models);
      // Select all by default
      setSelectedModels(
        new Set(data.models.map((m: ModelDefinition) => m.name))
      );
      setShowModelSelection(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to parse file: ${message}`);
      setImportFile(null);
    }
  };

  // Toggle model selection
  const toggleModel = (modelName: string) => {
    setSelectedModels((prev) => {
      const next = new Set(prev);
      if (next.has(modelName)) {
        next.delete(modelName);
      } else {
        next.add(modelName);
      }
      return next;
    });
  };

  // Toggle all models
  const toggleAll = () => {
    if (selectedModels.size === parsedModels.length) {
      setSelectedModels(new Set());
    } else {
      setSelectedModels(new Set(parsedModels.map((m) => m.name)));
    }
  };

  // Import selected models
  const handleImport = async () => {
    if (selectedModels.size === 0) {
      toast.error('Please select at least one model to import');
      return;
    }

    setIsImporting(true);
    setImportResult(null);
    try {
      const modelsToImport = parsedModels.filter((m) =>
        selectedModels.has(m.name)
      );

      const result = await adminApi.importModels(
        modelsToImport,
        importStrategy
      );
      setImportResult(result);

      if (result.imported > 0) {
        toast.success(`Imported ${result.imported} models successfully`);
      }
      if (result.skipped > 0) {
        toast.success(`Skipped ${result.skipped} existing models`);
      }
      if (result.errors.length > 0) {
        toast.error(`${result.errors.length} models failed to import`);
      }

      // Reset selection
      setShowModelSelection(false);
      setImportFile(null);
      setParsedModels([]);
      setSelectedModels(new Set());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Import failed: ${message}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className='space-y-8'>
      {/* Header */}
      <div>
        <h1 className='text-2xl font-bold text-slate-900 dark:text-white'>
          Import / Export
        </h1>
        <p className='mt-1 text-sm text-slate-600 dark:text-slate-400'>
          Export your schema for backup or share with others, or import an
          existing schema.
        </p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Export Section */}
        <Card className='p-6'>
          <div className='flex items-center gap-3 mb-4'>
            <div className='p-2 bg-green-100 dark:bg-green-900/30 rounded-lg'>
              <Download className='w-5 h-5 text-green-600 dark:text-green-400' />
            </div>
            <div>
              <h2 className='text-lg font-semibold text-slate-900 dark:text-white'>
                Export Schema
              </h2>
              <p className='text-sm text-slate-600 dark:text-slate-400'>
                Download all models as a JSON file
              </p>
            </div>
          </div>

          <div className='space-y-4'>
            <div className='p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700'>
              <div className='flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400'>
                <FileJson className='w-4 h-4' />
                <span>
                  Includes all model definitions, fields, relations, and
                  configurations
                </span>
              </div>
            </div>

            <Button
              onClick={handleExport}
              disabled={isExporting}
              className='w-full'
            >
              {isExporting ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className='w-4 h-4 mr-2' />
                  Export Schema
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Import Section */}
        <Card className='p-6'>
          <div className='flex items-center gap-3 mb-4'>
            <div className='p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg'>
              <Upload className='w-5 h-5 text-blue-600 dark:text-blue-400' />
            </div>
            <div>
              <h2 className='text-lg font-semibold text-slate-900 dark:text-white'>
                Import Schema
              </h2>
              <p className='text-sm text-slate-600 dark:text-slate-400'>
                Upload a JSON schema file to import
              </p>
            </div>
          </div>

          <div className='space-y-4'>
            {/* File Input */}
            <div>
              <input
                ref={fileInputRef}
                type='file'
                accept='.json'
                onChange={handleFileSelect}
                className='hidden'
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className='w-full p-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors cursor-pointer'
              >
                {importFile ? (
                  <div className='flex items-center justify-center gap-2 text-sm'>
                    <FileJson className='w-5 h-5 text-indigo-600 dark:text-indigo-400' />
                    <span className='font-medium text-slate-900 dark:text-white'>
                      {importFile.name}
                    </span>
                  </div>
                ) : (
                  <div className='text-center'>
                    <Upload className='w-8 h-8 mx-auto text-slate-400 mb-2' />
                    <p className='text-sm text-slate-600 dark:text-slate-400'>
                      Click to select a JSON file
                    </p>
                  </div>
                )}
              </button>
            </div>

            {/* Model Selection */}
            {showModelSelection && (
              <div className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <label className='text-sm font-medium text-slate-700 dark:text-slate-300'>
                    Select Models to Import
                  </label>
                  <button
                    onClick={toggleAll}
                    className='text-xs text-indigo-600 dark:text-indigo-400 hover:underline'
                  >
                    {selectedModels.size === parsedModels.length
                      ? 'Deselect All'
                      : 'Select All'}
                  </button>
                </div>
                <div className='max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg'>
                  {parsedModels.map((model) => (
                    <label
                      key={model.name}
                      className='flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-0'
                    >
                      <input
                        type='checkbox'
                        checked={selectedModels.has(model.name)}
                        onChange={() => toggleModel(model.name)}
                        className='rounded border-slate-300 text-indigo-600 focus:ring-indigo-500'
                      />
                      <div className='flex-1'>
                        <p className='text-sm font-medium text-slate-900 dark:text-white'>
                          {model.name}
                        </p>
                        <p className='text-xs text-slate-500 dark:text-slate-500'>
                          {model.fields?.length || 0} fields,{' '}
                          {model.relations?.length || 0} relations
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
                <p className='text-xs text-slate-500 dark:text-slate-500'>
                  {selectedModels.size} of {parsedModels.length} models selected
                </p>
              </div>
            )}

            {/* Strategy Selection */}
            {showModelSelection && (
              <div className='space-y-2'>
                <label className='text-sm font-medium text-slate-700 dark:text-slate-300'>
                  Import Strategy
                </label>
                <div className='grid grid-cols-2 gap-2'>
                  <button
                    onClick={() => setImportStrategy('skip')}
                    className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                      importStrategy === 'skip'
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    Skip Existing
                  </button>
                  <button
                    onClick={() => setImportStrategy('overwrite')}
                    className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                      importStrategy === 'overwrite'
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    Overwrite
                  </button>
                </div>
                <p className='text-xs text-slate-500 dark:text-slate-500'>
                  {importStrategy === 'skip'
                    ? 'Existing models will be ignored during import'
                    : 'Existing models will be replaced with imported versions'}
                </p>
              </div>
            )}

            {/* Import Button */}
            {showModelSelection && (
              <Button
                onClick={handleImport}
                disabled={selectedModels.size === 0 || isImporting}
                className='w-full'
              >
                {isImporting ? (
                  <>
                    <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                    Importing {selectedModels.size} models...
                  </>
                ) : (
                  <>
                    <Upload className='w-4 h-4 mr-2' />
                    Import {selectedModels.size} Selected Models
                  </>
                )}
              </Button>
            )}

            {/* Import Result */}
            {importResult && (
              <div
                className={`p-4 rounded-lg ${
                  importResult.errors.length > 0
                    ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                    : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                }`}
              >
                <div className='flex items-start gap-3'>
                  {importResult.errors.length > 0 ? (
                    <AlertCircle className='w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5' />
                  ) : (
                    <CheckCircle2 className='w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5' />
                  )}
                  <div className='space-y-1 text-sm'>
                    <p className='font-medium text-slate-900 dark:text-white'>
                      Import Complete
                    </p>
                    <p className='text-slate-600 dark:text-slate-400'>
                      Imported: {importResult.imported}, Skipped:{' '}
                      {importResult.skipped}
                    </p>
                    {importResult.errors.length > 0 && (
                      <div className='mt-2'>
                        <p className='font-medium text-amber-700 dark:text-amber-300'>
                          Errors ({importResult.errors.length}):
                        </p>
                        <ul className='list-disc list-inside text-amber-600 dark:text-amber-400'>
                          {importResult.errors.map((err, idx) => (
                            <li key={idx}>
                              {err.name}: {err.error}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
