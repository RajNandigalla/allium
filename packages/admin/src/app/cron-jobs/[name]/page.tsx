'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { adminApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { toast } from 'react-hot-toast';
import CronJobForm from '../CronJobForm';

export default function EditCronJobPage() {
  const params = useParams();
  const name = params.name as string;
  const [cronJob, setCronJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCronJob();
  }, [name]);

  const loadCronJob = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getCronJob(name);
      setCronJob(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load cron job');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600'></div>
      </div>
    );
  }

  if (!cronJob) {
    return (
      <Card className='text-center py-12'>
        <p className='text-slate-600 dark:text-slate-400'>Cron job not found</p>
      </Card>
    );
  }

  return (
    <div className='max-w-3xl'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold text-slate-900 dark:text-white'>
          Edit Cron Job
        </h1>
        <p className='text-slate-600 dark:text-slate-400 mt-1'>
          Update cron job configuration for{' '}
          <span className='font-mono'>{name}</span>
        </p>
      </div>

      <Card>
        <CronJobForm initialData={cronJob} isEdit />
      </Card>
    </div>
  );
}
