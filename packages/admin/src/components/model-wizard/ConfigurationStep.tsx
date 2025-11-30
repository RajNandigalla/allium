'use client';

import {
  UseFormRegister,
  FieldErrors,
  Control,
  useFieldArray,
} from 'react-hook-form';
import { WizardStep } from '../ui/WizardStep';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

export interface ConfigurationData {
  // API Config
  apiPrefix?: string;
  apiVersion?: string;
  operations?: string[];
  rateLimitMax?: number;
  rateLimitTimeWindow?: string;
  // Service Config
  beforeCreate?: string;
  afterCreate?: string;
  beforeUpdate?: string;
  afterUpdate?: string;
  beforeDelete?: string;
  afterDelete?: string;
  customMethods?: Array<{ name: string; description?: string }>;
  // Constraints
  compoundUnique?: string[][];
  compoundIndexes?: string[][];
}

interface ConfigurationStepProps {
  register: UseFormRegister<any>;
  control: Control<any>;
  errors: FieldErrors<any>;
}

const API_OPERATIONS = [
  { value: 'create', label: 'Create' },
  { value: 'read', label: 'Read' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'list', label: 'List' },
];

export function ConfigurationStep({
  register,
  control,
  errors,
}: ConfigurationStepProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const {
    fields: customMethodFields,
    append: appendMethod,
    remove: removeMethod,
  } = useFieldArray({
    control,
    name: 'customMethods',
  });

  return (
    <WizardStep>
      <div className='space-y-6'>
        <div>
          <h3 className='text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1'>
            Advanced Configuration
          </h3>
          <p className='text-xs text-slate-600 dark:text-slate-400'>
            All sections are optional. Configure API settings, service hooks,
            and constraints as needed.
          </p>
        </div>

        {/* API Configuration */}
        <div className='border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden'>
          <button
            type='button'
            onClick={() => toggleSection('api')}
            className='w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors'
          >
            <span className='text-sm font-medium text-slate-900 dark:text-slate-100'>
              API Configuration
            </span>
            {expandedSections.has('api') ? (
              <ChevronUp size={18} />
            ) : (
              <ChevronDown size={18} />
            )}
          </button>
          {expandedSections.has('api') && (
            <div className='p-4 space-y-4'>
              <div className='grid grid-cols-2 gap-3'>
                <Input
                  label='API Prefix'
                  placeholder='e.g., /api/v1'
                  {...register('apiPrefix')}
                  helperText='Custom API path prefix'
                />
                <Input
                  label='API Version'
                  placeholder='e.g., v1'
                  {...register('apiVersion')}
                  helperText='API version identifier'
                />
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-medium text-slate-700 dark:text-slate-300'>
                  Enabled Operations
                </label>
                <div className='grid grid-cols-3 gap-2'>
                  {API_OPERATIONS.map((op) => (
                    <label
                      key={op.value}
                      className='flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer'
                    >
                      <input
                        type='checkbox'
                        value={op.value}
                        className='rounded border-slate-300 text-indigo-600 focus:ring-indigo-500'
                        {...register('operations')}
                      />
                      {op.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className='grid grid-cols-2 gap-3'>
                <Input
                  label='Rate Limit (Max)'
                  type='number'
                  placeholder='100'
                  {...register('rateLimitMax')}
                  helperText='Max requests per time window'
                />
                <Input
                  label='Time Window'
                  placeholder='1m, 1h, 1d'
                  {...register('rateLimitTimeWindow')}
                  helperText='Time window for rate limit'
                />
              </div>
            </div>
          )}
        </div>

        {/* Service Configuration */}
        <div className='border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden'>
          <button
            type='button'
            onClick={() => toggleSection('service')}
            className='w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors'
          >
            <span className='text-sm font-medium text-slate-900 dark:text-slate-100'>
              Service Hooks
            </span>
            {expandedSections.has('service') ? (
              <ChevronUp size={18} />
            ) : (
              <ChevronDown size={18} />
            )}
          </button>
          {expandedSections.has('service') && (
            <div className='p-4 space-y-4'>
              <div className='grid grid-cols-2 gap-3'>
                <Input
                  label='Before Create'
                  placeholder='Function name'
                  {...register('beforeCreate')}
                  helperText='Hook before creating records'
                />
                <Input
                  label='After Create'
                  placeholder='Function name'
                  {...register('afterCreate')}
                  helperText='Hook after creating records'
                />
                <Input
                  label='Before Update'
                  placeholder='Function name'
                  {...register('beforeUpdate')}
                  helperText='Hook before updating records'
                />
                <Input
                  label='After Update'
                  placeholder='Function name'
                  {...register('afterUpdate')}
                  helperText='Hook after updating records'
                />
                <Input
                  label='Before Delete'
                  placeholder='Function name'
                  {...register('beforeDelete')}
                  helperText='Hook before deleting records'
                />
                <Input
                  label='After Delete'
                  placeholder='Function name'
                  {...register('afterDelete')}
                  helperText='Hook after deleting records'
                />
              </div>

              <div className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <label className='text-sm font-medium text-slate-700 dark:text-slate-300'>
                    Custom Methods
                  </label>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={() => appendMethod({ name: '', description: '' })}
                  >
                    <Plus size={16} />
                    Add Method
                  </Button>
                </div>
                {customMethodFields.map((field, index) => (
                  <div key={field.id} className='flex items-start gap-2'>
                    <Input
                      placeholder='Method name'
                      {...register(`customMethods.${index}.name`)}
                    />
                    <Input
                      placeholder='Description'
                      {...register(`customMethods.${index}.description`)}
                    />
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      className='text-red-500 hover:text-red-600'
                      onClick={() => removeMethod(index)}
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Constraints */}
        <div className='border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden'>
          <button
            type='button'
            onClick={() => toggleSection('constraints')}
            className='w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors'
          >
            <span className='text-sm font-medium text-slate-900 dark:text-slate-100'>
              Compound Constraints
            </span>
            {expandedSections.has('constraints') ? (
              <ChevronUp size={18} />
            ) : (
              <ChevronDown size={18} />
            )}
          </button>
          {expandedSections.has('constraints') && (
            <div className='p-4 space-y-4'>
              <Input
                label='Compound Unique Constraints'
                placeholder='e.g., email,tenantId'
                {...register('compoundUniqueInput')}
                helperText='Comma-separated field names for compound unique constraint'
              />
              <Input
                label='Compound Indexes'
                placeholder='e.g., userId,createdAt'
                {...register('compoundIndexesInput')}
                helperText='Comma-separated field names for compound index'
              />
            </div>
          )}
        </div>
      </div>
    </WizardStep>
  );
}
