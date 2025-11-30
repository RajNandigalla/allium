'use client';

import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { SidePanel } from '../../components/ui/SidePanel';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';

const createModelSchema = z.object({
  name: z
    .string()
    .min(1, 'Model name is required')
    .regex(
      /^[a-zA-Z][a-zA-Z0-9]*$/,
      'Model name must start with a letter and contain only alphanumeric characters'
    ),
  description: z.string().optional(),
});

type CreateModelForm = z.infer<typeof createModelSchema>;

export default function ModelsPage() {
  const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateModelForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createModelSchema as any),
  });

  const onSubmit = (data: CreateModelForm) => {
    console.log('Creating model:', data);
    toast.success(`Creating model ${data.name}...`);
    // TODO: Implement actual API call
    setIsCreatePanelOpen(false);
    reset();
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
        description='Define a new data model for your application.'
      >
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-6 mt-4'>
          <Input
            label='Model Name'
            placeholder='e.g. User, Post, Comment'
            error={errors.name?.message}
            {...register('name')}
            helperText='Must start with a letter and contain only alphanumeric characters.'
          />

          <Textarea
            label='Description (Optional)'
            placeholder='Describe what this model represents...'
            error={errors.description?.message}
            rows={4}
            {...register('description')}
          />

          <div className='flex justify-end gap-3 pt-4'>
            <Button
              type='button'
              variant='ghost'
              onClick={() => setIsCreatePanelOpen(false)}
            >
              Cancel
            </Button>
            <Button type='submit' variant='primary'>
              Create Model
            </Button>
          </div>
        </form>
      </SidePanel>
    </div>
  );
}
