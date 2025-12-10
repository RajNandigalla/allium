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
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { clsx } from 'clsx';

export interface FieldData {
  name: string;
  type: string;
  required: boolean;
  unique: boolean;
  default?: string;
  // Advanced options
  private?: boolean;
  writePrivate?: boolean;
  encrypted?: boolean;
  // Validation
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  // Enum
  values?: string;
  // Computed
  computedTemplate?: string;
}

interface FieldsStepProps {
  register: UseFormRegister<any>;
  control: Control<any>;
  errors: FieldErrors<any>;
}

const FIELD_TYPES = [
  { value: 'String', label: 'String' },
  { value: 'Int', label: 'Integer' },
  { value: 'Float', label: 'Float' },
  { value: 'Boolean', label: 'Boolean' },
  { value: 'DateTime', label: 'DateTime' },
  { value: 'Json', label: 'JSON' },
  { value: 'Enum', label: 'Enum' },
];

export function FieldsStep({ register, control, errors }: FieldsStepProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'fields',
  });

  const [expandedFields, setExpandedFields] = useState<Set<number>>(new Set());

  const toggleAdvanced = (index: number) => {
    setExpandedFields((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <WizardStep>
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <div>
            <h3 className='text-sm font-semibold text-slate-900 dark:text-slate-100'>
              Fields
            </h3>
            <p className='text-xs text-slate-600 dark:text-slate-400 mt-0.5'>
              Define at least one field for your model
            </p>
          </div>
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
          {fields.map((field, index) => {
            const isExpanded = expandedFields.has(index);
            const fieldType = register(`fields.${index}.type`);

            return (
              <div
                key={field.id}
                className='p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-y-4'
              >
                {/* Basic Field Options */}
                <div className='flex items-start gap-3'>
                  <div className='flex-1 grid grid-cols-2 gap-3'>
                    <Input
                      label='Field Name'
                      placeholder='e.g., email, age'
                      error={(errors.fields as any)?.[index]?.name?.message}
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
                        {FIELD_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
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

                {/* Basic Checkboxes */}
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

                {/* Advanced Options Toggle */}
                <button
                  type='button'
                  onClick={() => toggleAdvanced(index)}
                  className='flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors'
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp size={16} />
                      Hide Advanced Options
                    </>
                  ) : (
                    <>
                      <ChevronDown size={16} />
                      Show Advanced Options
                    </>
                  )}
                </button>

                {/* Advanced Options */}
                {isExpanded && (
                  <div className='pt-4 border-t border-slate-200 dark:border-slate-700 space-y-4'>
                    <Input
                      label='Default Value'
                      placeholder='Optional default value'
                      {...register(`fields.${index}.default`)}
                      helperText='Default value when creating new records'
                    />

                    {/* Privacy Options */}
                    <div className='space-y-2'>
                      <label className='text-sm font-medium text-slate-700 dark:text-slate-300'>
                        Privacy
                      </label>
                      <div className='space-y-2'>
                        <label className='flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer'>
                          <input
                            type='checkbox'
                            className='rounded border-slate-300 text-indigo-600 focus:ring-indigo-500'
                            {...register(`fields.${index}.private`)}
                          />
                          Private (excluded from API responses)
                        </label>
                        <label className='flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer'>
                          <input
                            type='checkbox'
                            className='rounded border-slate-300 text-indigo-600 focus:ring-indigo-500'
                            {...register(`fields.${index}.writePrivate`)}
                          />
                          Write Private (cannot be set by users)
                        </label>
                        <label className='flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer'>
                          <input
                            type='checkbox'
                            className='rounded border-slate-300 text-indigo-600 focus:ring-indigo-500'
                            {...register(`fields.${index}.encrypted`)}
                          />
                          Encrypted (encrypted at rest)
                        </label>
                      </div>
                    </div>

                    {/* Validation Rules - Conditional based on type */}
                    <div className='grid grid-cols-2 gap-3'>
                      <Input
                        label='Min Length'
                        type='number'
                        placeholder='Minimum length'
                        {...register(`fields.${index}.minLength`)}
                      />
                      <Input
                        label='Max Length'
                        type='number'
                        placeholder='Maximum length'
                        {...register(`fields.${index}.maxLength`)}
                      />
                      <Input
                        label='Min Value'
                        type='number'
                        placeholder='Minimum value'
                        {...register(`fields.${index}.min`)}
                      />
                      <Input
                        label='Max Value'
                        type='number'
                        placeholder='Maximum value'
                        {...register(`fields.${index}.max`)}
                      />
                    </div>

                    <Input
                      label='Pattern (Regex)'
                      placeholder='e.g., ^[A-Z][a-z]+$'
                      {...register(`fields.${index}.pattern`)}
                      helperText='Regular expression for validation'
                    />

                    {/* Enum Values */}
                    <Input
                      label='Enum Values'
                      placeholder='e.g., ACTIVE, PENDING, INACTIVE'
                      {...register(`fields.${index}.values`)}
                      helperText='Comma-separated values for Enum type'
                    />

                    {/* Computed Field */}
                    <Input
                      label='Computed Template'
                      placeholder='e.g., {firstName} {lastName}'
                      {...register(`fields.${index}.computedTemplate`)}
                      helperText='Template for virtual/computed fields'
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {fields.length === 0 && (
          <div className='text-center py-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg'>
            <p className='text-sm text-slate-600 dark:text-slate-400 mb-3'>
              No fields yet. Add at least one field to continue.
            </p>
            <Button
              type='button'
              variant='primary'
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
              Add Your First Field
            </Button>
          </div>
        )}
      </div>
    </WizardStep>
  );
}
