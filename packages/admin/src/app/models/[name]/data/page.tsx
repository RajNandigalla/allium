'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '../../../../components/ui/Button';
import { ArrowLeft, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { adminApi, ModelDefinition } from '../../../../lib/api';
import { DataExplorer } from '../../../../components/data/DataExplorer';

export default function DataBrowserPage() {
  const params = useParams();
  const router = useRouter();
  const modelName = params?.name as string;

  const [modelDef, setModelDef] = useState<ModelDefinition | null>(null);
  const [total, setTotal] = useState(0);

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => router.push('/models')}
          >
            <ArrowLeft className='w-4 h-4 mr-2' />
            Back to Models
          </Button>
          <div>
            <h1 className='text-3xl font-bold tracking-tight capitalize'>
              {modelName} Data
            </h1>
            <p className='text-slate-500 dark:text-slate-400 mt-2'>
              {total} total records
            </p>
          </div>
        </div>
      </div>

      {/* Data Explorer */}
      <DataExplorer
        modelName={modelName}
        modelDef={modelDef}
        onModelDefChange={setModelDef}
      />
    </div>
  );
}
