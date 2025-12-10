'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { Save, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

interface CronJobFormProps {
  initialData?: any;
  isEdit?: boolean;
}

export default function CronJobForm({
  initialData,
  isEdit = false,
}: CronJobFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    schedule: initialData?.schedule || '',
    endpoint: initialData?.endpoint || '',
    method: initialData?.method || 'POST',
    active: initialData?.active ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.schedule || !formData.endpoint) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);

      if (isEdit) {
        await adminApi.updateCronJob(initialData.name, formData);
        toast.success('Cron job updated successfully');
      } else {
        await adminApi.createCronJob(formData);
        toast.success('Cron job created successfully');
      }

      router.push('/cron-jobs');
    } catch (error: any) {
      toast.error(
        error.message || `Failed to ${isEdit ? 'update' : 'create'} cron job`
      );
    } finally {
      setLoading(false);
    }
  };

  const cronPresets = [
    { label: 'Every minute', value: '* * * * *' },
    { label: 'Every 5 minutes', value: '*/5 * * * *' },
    { label: 'Every 15 minutes', value: '*/15 * * * *' },
    { label: 'Every hour', value: '0 * * * *' },
    { label: 'Daily at midnight', value: '0 0 * * *' },
    { label: 'Daily at 2 AM', value: '0 2 * * *' },
    { label: 'Weekly (Monday 9 AM)', value: '0 9 * * 1' },
    { label: 'Monthly (1st at midnight)', value: '0 0 1 * *' },
  ];

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      <Input
        label='Name'
        value={formData.name}
        onChange={(e) => {
          // Auto-format: lowercase, replace spaces with hyphens, remove invalid chars
          const formatted = e.target.value
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
          setFormData({ ...formData, name: formatted });
        }}
        disabled={isEdit}
        placeholder='daily-cleanup'
        helperText='Lowercase, alphanumeric, hyphens only (auto-formatted)'
        required
      />

      <div>
        <Input
          label='Schedule (Cron Expression)'
          value={formData.schedule}
          onChange={(e) =>
            setFormData({ ...formData, schedule: e.target.value })
          }
          placeholder='0 2 * * *'
          helperText='Format: minute hour day month weekday'
          className='font-mono'
          required
        />
        <div className='mt-2 flex flex-wrap gap-2'>
          {cronPresets.map((preset) => (
            <button
              key={preset.value}
              type='button'
              onClick={() =>
                setFormData({ ...formData, schedule: preset.value })
              }
              className='text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors'
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <Input
        label='Endpoint'
        value={formData.endpoint}
        onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
        placeholder='/api/tasks/cleanup'
        helperText='Relative path or absolute URL'
        required
      />

      <div>
        <label className='block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2'>
          HTTP Method
        </label>
        <select
          value={formData.method}
          onChange={(e) => setFormData({ ...formData, method: e.target.value })}
          className='w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 dark:text-white'
          required
        >
          <option value='GET'>GET</option>
          <option value='POST'>POST</option>
          <option value='PUT'>PUT</option>
          <option value='PATCH'>PATCH</option>
          <option value='DELETE'>DELETE</option>
        </select>
      </div>

      <Checkbox
        checked={formData.active}
        onCheckedChange={(checked) =>
          setFormData({ ...formData, active: checked })
        }
        label='Active'
      />

      <div className='flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-700'>
        <Button type='submit' isLoading={loading}>
          <Save className='w-4 h-4' />
          {isEdit ? 'Update Cron Job' : 'Create Cron Job'}
        </Button>
        <Link href='/cron-jobs'>
          <Button variant='secondary'>
            <X className='w-4 h-4' />
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  );
}
