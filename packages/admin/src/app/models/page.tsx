'use client';

import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { SidePanel } from '../../components/ui/SidePanel';
import { Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { adminApi } from '../../lib/api';
import { ModelWizard } from '../../components/model-wizard/ModelWizard';

export default function ModelsPage() {
  const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false);

  const handleCreateModel = async (data: any) => {
    try {
      console.log('Creating model:', data);
      toast.loading(`Creating model ${data.name}...`, { id: 'create-model' });

      // 1. Create Model Definition
      await adminApi.createModel(data);

      // 2. Sync Schema
      toast.loading('Syncing database schema...', { id: 'create-model' });
      await adminApi.syncSchema();

      toast.success(`Model ${data.name} created successfully!`, {
        id: 'create-model',
      });
      setIsCreatePanelOpen(false);
    } catch (error: any) {
      console.error('Failed to create model:', error);
      toast.error(error.message || 'Failed to create model', {
        id: 'create-model',
      });
      throw error;
    }
  };

  return (
    <div className='p-8'>
      <div className='flex items-center justify-between mb-8'>
        <div>
          <h1 className='text-4xl font-bold mb-2'>Models</h1>
          <p className='text-gray-400'>Manage your data models</p>
        </div>
        <Button
          variant='primary'
          size='md'
          onClick={() => setIsCreatePanelOpen(true)}
        >
          <Plus size={20} />
          Create Model
        </Button>
      </div>

      <Card>
        <div className='text-center py-12'>
          <p className='text-gray-400 mb-4'>
            No models yet. Create your first model to get started!
          </p>
          <Button
            variant='primary'
            size='md'
            onClick={() => setIsCreatePanelOpen(true)}
          >
            <Plus size={20} />
            Create Your First Model
          </Button>
        </div>
      </Card>

      <SidePanel
        open={isCreatePanelOpen}
        onOpenChange={setIsCreatePanelOpen}
        title='Create New Model'
        description='Define a new data model with fields, relations, and configuration.'
      >
        <ModelWizard
          onSubmit={handleCreateModel}
          onCancel={() => setIsCreatePanelOpen(false)}
        />
      </SidePanel>
    </div>
  );
}
