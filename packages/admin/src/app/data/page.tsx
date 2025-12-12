'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Database, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { adminApi, ModelDefinition } from '../../lib/api';
import { DataExplorer } from '../../components/data/DataExplorer';

function GlobalDataPageInner() {
  const searchParams = useSearchParams();
  const initialModel = searchParams?.get('model') || '';

  const [models, setModels] = useState<ModelDefinition[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>(initialModel);
  const [modelDef, setModelDef] = useState<ModelDefinition | null>(null);

  // Fetch available models
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const defs = await adminApi.getModels();
        setModels(defs);
      } catch (err) {
        console.error('Failed to fetch models:', err);
        toast.error('Failed to load models');
      }
    };
    fetchModels();
  }, []);

  // Update URL when model changes
  useEffect(() => {
    if (selectedModel) {
      const url = new URL(window.location.href);
      url.searchParams.set('model', selectedModel);
      window.history.pushState({}, '', url.toString());
    }
  }, [selectedModel]);

  // Update modelDef when models or selectedModel changes
  useEffect(() => {
    if (!selectedModel || models.length === 0) {
      setModelDef(null);
      return;
    }

    const model = models.find(
      (m) => m.name.toLowerCase() === selectedModel.toLowerCase()
    );
    setModelDef(model || null);
  }, [selectedModel, models]);

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Database className='w-8 h-8 text-indigo-600' />
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>Data Explorer</h1>
            <p className='text-slate-500 dark:text-slate-400 mt-2'>
              Browse and manage your data across all models
            </p>
          </div>
        </div>
      </div>

      {/* Model Selector */}
      <Card>
        <div className='space-y-2'>
          <label className='text-sm font-medium text-slate-700 dark:text-slate-200'>
            Select Model
          </label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className='w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg'
          >
            <option value=''>-- Select a model to browse --</option>
            {models.map((model) => (
              <option key={model.name} value={model.name}>
                {model.name}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Data Explorer */}
      {selectedModel && modelDef ? (
        <DataExplorer
          modelName={selectedModel}
          modelDef={modelDef}
          onModelDefChange={setModelDef}
        />
      ) : selectedModel ? (
        <div className='flex justify-center items-center h-64'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600'></div>
          <span className='ml-3 text-slate-500'>Loading model...</span>
        </div>
      ) : (
        <Card className='text-center py-12'>
          <Database className='w-12 h-12 mx-auto text-slate-400 mb-4' />
          <h3 className='text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2'>
            No Model Selected
          </h3>
          <p className='text-slate-500 dark:text-slate-400'>
            Select a model from the dropdown above to view and manage its data
          </p>
        </Card>
      )}
    </div>
  );
}

export default function GlobalDataPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GlobalDataPageInner />
    </Suspense>
  );
}
