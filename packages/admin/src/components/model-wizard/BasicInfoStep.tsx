'use client';

import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { WizardStep } from '../ui/WizardStep';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Info } from 'lucide-react';

export interface BasicInfoData {
  name: string;
  description?: string;
  softDelete: boolean;
  auditTrail: boolean;
}

interface BasicInfoStepProps {
  register: UseFormRegister<any>;
  errors: FieldErrors<BasicInfoData>;
}

export function BasicInfoStep({ register, errors }: BasicInfoStepProps) {
  return (
    <WizardStep>
      <Input
        label='Model Name'
        placeholder='e.g., User, Post, Comment'
        error={errors.name?.message}
        {...register('name')}
        helperText='Must start with an uppercase letter and contain only alphanumeric characters (PascalCase).'
        required
      />

      <Textarea
        label='Description'
        placeholder='Describe what this model represents...'
        error={errors.description?.message}
        rows={4}
        {...register('description')}
        helperText='Optional. Helps document your data model.'
      />

      <div className='space-y-4 pt-4'>
        <h3 className='text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2'>
          Model Options
          <Info size={16} className='text-slate-400' />
        </h3>

        <div className='space-y-3 pl-1'>
          <label className='flex items-start gap-3 cursor-pointer group'>
            <input
              type='checkbox'
              className='mt-0.5 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-400 cursor-pointer'
              {...register('softDelete')}
            />
            <div className='flex-1'>
              <div className='text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors'>
                Soft Delete
              </div>
              <div className='text-xs text-slate-600 dark:text-slate-400 mt-0.5'>
                Records are marked as deleted instead of being permanently
                removed from the database
              </div>
            </div>
          </label>

          <label className='flex items-start gap-3 cursor-pointer group'>
            <input
              type='checkbox'
              className='mt-0.5 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-400 cursor-pointer'
              {...register('auditTrail')}
            />
            <div className='flex-1'>
              <div className='text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors'>
                Audit Trail
              </div>
              <div className='text-xs text-slate-600 dark:text-slate-400 mt-0.5'>
                Automatically track creation and update timestamps (createdAt,
                updatedAt)
              </div>
            </div>
          </label>
        </div>
      </div>
    </WizardStep>
  );
}
