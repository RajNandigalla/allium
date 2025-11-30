'use client';

import {
  UseFormRegister,
  FieldErrors,
  Control,
  useFieldArray,
  useWatch,
} from 'react-hook-form';
import { WizardStep } from '../ui/WizardStep';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

export interface RelationData {
  name: string;
  type: '1:1' | '1:n' | 'n:m' | 'polymorphic';
  model?: string;
  foreignKey?: string;
  references?: string;
  onDelete?: 'Cascade' | 'SetNull' | 'NoAction' | 'Restrict';
  required: boolean;
}

interface RelationsStepProps {
  register: UseFormRegister<any>;
  control: Control<any>;
  errors: FieldErrors<any>;
}

const RELATION_TYPES = [
  { value: '1:1', label: 'One-to-One (1:1)' },
  { value: '1:n', label: 'One-to-Many (1:n)' },
  { value: 'n:m', label: 'Many-to-Many (n:m)' },
  { value: 'polymorphic', label: 'Polymorphic' },
];

const ON_DELETE_ACTIONS = [
  { value: 'Cascade', label: 'Cascade (delete related records)' },
  { value: 'SetNull', label: 'Set Null (set foreign key to null)' },
  { value: 'NoAction', label: 'No Action (prevent deletion)' },
  { value: 'Restrict', label: 'Restrict (prevent deletion)' },
];

export function RelationsStep({
  register,
  control,
  errors,
}: RelationsStepProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'relations',
  });

  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  // Load available models (you'll need to implement this API call)
  useEffect(() => {
    // TODO: Fetch available models from API
    // For now, using placeholder
    setAvailableModels(['User', 'Post', 'Comment', 'Category']);
  }, []);

  return (
    <WizardStep>
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <div>
            <h3 className='text-sm font-semibold text-slate-900 dark:text-slate-100'>
              Relations
            </h3>
            <p className='text-xs text-slate-600 dark:text-slate-400 mt-0.5'>
              Define relationships between this model and others (optional)
            </p>
          </div>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={() =>
              append({
                name: '',
                type: '1:n',
                model: '',
                references: 'id',
                onDelete: 'NoAction',
                required: false,
              })
            }
          >
            <Plus size={16} />
            Add Relation
          </Button>
        </div>

        {fields.length > 0 && (
          <div className='space-y-4'>
            {fields.map((field, index) => (
              <div
                key={field.id}
                className='p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-y-4'
              >
                <div className='flex items-start gap-3'>
                  <div className='flex-1 space-y-4'>
                    {/* Relation Name and Type */}
                    <div className='grid grid-cols-2 gap-3'>
                      <Input
                        label='Relation Name'
                        placeholder='e.g., author, posts'
                        error={errors.relations?.[index]?.name?.message}
                        {...register(`relations.${index}.name`)}
                      />
                      <div className='space-y-1.5'>
                        <label className='text-sm font-medium text-slate-700 dark:text-slate-300'>
                          Type
                        </label>
                        <select
                          className='flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-indigo-400 dark:focus:ring-offset-slate-900'
                          {...register(`relations.${index}.type`)}
                        >
                          {RELATION_TYPES.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Target Model */}
                    <div className='space-y-1.5'>
                      <label className='text-sm font-medium text-slate-700 dark:text-slate-300'>
                        Target Model
                      </label>
                      <select
                        className='flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-indigo-400 dark:focus:ring-offset-slate-900'
                        {...register(`relations.${index}.model`)}
                      >
                        <option value=''>Select a model...</option>
                        {availableModels.map((model) => (
                          <option key={model} value={model}>
                            {model}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Foreign Key and References */}
                    <div className='grid grid-cols-2 gap-3'>
                      <Input
                        label='Foreign Key'
                        placeholder='e.g., userId'
                        {...register(`relations.${index}.foreignKey`)}
                        helperText='Optional. Auto-generated if not specified'
                      />
                      <Input
                        label='References'
                        placeholder='id'
                        {...register(`relations.${index}.references`)}
                        helperText="Field in target model (usually 'id')"
                      />
                    </div>

                    {/* On Delete Action */}
                    <div className='space-y-1.5'>
                      <label className='text-sm font-medium text-slate-700 dark:text-slate-300'>
                        On Delete
                      </label>
                      <select
                        className='flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-indigo-400 dark:focus:ring-offset-slate-900'
                        {...register(`relations.${index}.onDelete`)}
                      >
                        {ON_DELETE_ACTIONS.map((action) => (
                          <option key={action.value} value={action.value}>
                            {action.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Required Checkbox */}
                    <label className='flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer'>
                      <input
                        type='checkbox'
                        className='rounded border-slate-300 text-indigo-600 focus:ring-indigo-500'
                        {...register(`relations.${index}.required`)}
                      />
                      Required (foreign key cannot be null)
                    </label>
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
              </div>
            ))}
          </div>
        )}

        {fields.length === 0 && (
          <div className='text-center py-12 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg'>
            <AlertCircle className='mx-auto mb-3 text-slate-400' size={32} />
            <p className='text-sm text-slate-600 dark:text-slate-400 mb-2'>
              No relations defined
            </p>
            <p className='text-xs text-slate-500 dark:text-slate-500 mb-4'>
              Relations are optional. You can skip this step if your model
              doesn't need relationships.
            </p>
            <Button
              type='button'
              variant='secondary'
              size='sm'
              onClick={() =>
                append({
                  name: '',
                  type: '1:n',
                  model: '',
                  references: 'id',
                  onDelete: 'NoAction',
                  required: false,
                })
              }
            >
              <Plus size={16} />
              Add Relation
            </Button>
          </div>
        )}
      </div>
    </WizardStep>
  );
}
