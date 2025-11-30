'use client';

import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { SidePanel } from '../../components/ui/SidePanel';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Plus } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { adminApi } from '../../lib/api';
import { Trash2 } from 'lucide-react';

const fieldSchema = z.object({
  name: z
    .string()
    .min(1, 'Field name is required')
    .regex(/^[a-zA-Z][a-zA-Z0-9]*$/, 'Alphanumeric only'),
  type: z.string().min(1, 'Type is required'),
  required: z.boolean().default(false),
  unique: z.boolean().default(false),
});

const createModelSchema = z.object({
  name: z
    .string()
    .min(1, 'Model name is required')
    .regex(
      /^[a-zA-Z][a-zA-Z0-9]*$/,
      'Model name must start with a letter and contain only alphanumeric characters'
    ),
  description: z.string().optional(),
  fields: z.array(fieldSchema).optional(),
});

type CreateModelForm = z.infer<typeof createModelSchema>;

export default function ModelsPage() {
  const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateModelForm>({
    resolver: zodResolver(createModelSchema as any),
    defaultValues: {
      fields: [{ name: '', type: 'String', required: false, unique: false }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'fields',
  });

  const onSubmit = async (data: CreateModelForm) => {
    try {
      console.log('Creating model:', data);
      toast.loading(`Creating model ${data.name}...`, { id: 'create-model' });

      // 1. Create Model Definition
      await adminApi.createModel({
        name: data.name,
        fields:
          data.fields?.map((f) => ({
            name: f.name,
            type: f.type,
            required: f.required,
            unique: f.unique,
          })) || [],
      });

      // 2. Sync Schema
      toast.loading('Syncing database schema...', { id: 'create-model' });
      await adminApi.syncSchema();

      toast.success(`Model ${data.name} created successfully!`, {
        id: 'create-model',
      });
      setIsCreatePanelOpen(false);
      reset();
    } catch (error: any) {
      console.error('Failed to create model:', error);
      toast.error(error.message || 'Failed to create model', {
        id: 'create-model',
      });
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

          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <h3 className='text-sm font-medium text-slate-900 dark:text-slate-100'>
                Fields
              </h3>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={() =>
                  append({
                    name: '',
                    type: 'String',
                    required: false,
                    unique: false,
                  })
                }
              >
                <Plus size={16} />
                Add Field
              </Button>
            </div>

            <div className='space-y-4'>
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className='p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-y-4'
                >
                  <div className='flex items-start gap-3'>
                    <div className='flex-1 grid grid-cols-2 gap-3'>
                      <Input
                        label='Field Name'
                        placeholder='e.g. title'
                        error={errors.fields?.[index]?.name?.message}
                        {...register(`fields.${index}.name`)}
                      />
                      <div className='space-y-1.5'>
                        <label className='text-sm font-medium text-slate-700 dark:text-slate-300'>
                          Type
                        </label>
                        <select
                          className='flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-indigo-400 dark:focus:ring-offset-slate-900'
                          {...register(`fields.${index}.type`)}
                        >
                          <option value='String'>String</option>
                          <option value='Int'>Int</option>
                          <option value='Float'>Float</option>
                          <option value='Boolean'>Boolean</option>
                          <option value='DateTime'>DateTime</option>
                          <option value='JSON'>JSON</option>
                        </select>
                      </div>
                    </div>
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      className='mt-7 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                      onClick={() => remove(index)}
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>

                  <div className='flex items-center gap-6'>
                    <label className='flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer'>
                      <input
                        type='checkbox'
                        className='rounded border-slate-300 text-indigo-600 focus:ring-indigo-500'
                        {...register(`fields.${index}.required`)}
                      />
                      Required
                    </label>
                    <label className='flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer'>
                      <input
                        type='checkbox'
                        className='rounded border-slate-300 text-indigo-600 focus:ring-indigo-500'
                        {...register(`fields.${index}.unique`)}
                      />
                      Unique
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className='flex justify-end gap-3 pt-4'>
            <Button
              type='button'
              variant='ghost'
              onClick={() => setIsCreatePanelOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              variant='primary'
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              Create Model
            </Button>
          </div>
        </form>
      </SidePanel>
    </div>
  );
}
