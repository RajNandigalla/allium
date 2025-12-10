'use client';

import { Card } from '@/components/ui/Card';
import CronJobForm from '../CronJobForm';

export default function NewCronJobPage() {
  return (
    <div className='max-w-3xl'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold text-slate-900 dark:text-white'>
          Create Cron Job
        </h1>
        <p className='text-slate-600 dark:text-slate-400 mt-1'>
          Schedule a new recurring task
        </p>
      </div>

      <Card>
        <CronJobForm />
      </Card>
    </div>
  );
}
