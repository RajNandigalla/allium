'use client';

import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { WizardStep } from '../ui/WizardStep';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Checkbox } from '../ui/Checkbox';
import { Info } from 'lucide-react';

export interface BasicInfoData {
  name: string;
  description?: string;
  softDelete: boolean;
  auditTrail: boolean;
  draftPublish: boolean;
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
          <Checkbox
            label='Soft Delete'
            helperText='Records are marked as deleted instead of being permanently removed from the database'
            {...register('softDelete')}
          />

          <Checkbox
            label='Audit Trail'
            helperText='Automatically track creation and update timestamps (createdAt, updatedAt)'
            {...register('auditTrail')}
          />

          <Checkbox
            label='Draft & Publish Workflow'
            helperText='Enable content status management (Draft/Published/Archived) and scheduling'
            {...register('draftPublish')}
          />
        </div>
      </div>
    </WizardStep>
  );
}
