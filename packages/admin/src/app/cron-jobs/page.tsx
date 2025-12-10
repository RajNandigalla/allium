'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2, Edit, Power, Clock } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function CronJobsPage() {
  const [cronJobs, setCronJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCronJobs();
  }, []);

  const loadCronJobs = async () => {
    try {
      setLoading(true);
      const data = await adminApi.listCronJobs();
      setCronJobs(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load cron jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`Delete cron job "${name}"?`)) return;

    try {
      await adminApi.deleteCronJob(name);
      toast.success('Cron job deleted');
      loadCronJobs();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete cron job');
    }
  };

  const handleToggleActive = async (cronJob: any) => {
    try {
      await adminApi.updateCronJob(cronJob.name, {
        ...cronJob,
        active: !cronJob.active,
      });
      toast.success(`Cron job ${cronJob.active ? 'disabled' : 'enabled'}`);
      loadCronJobs();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update cron job');
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600'></div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-slate-900 dark:text-white'>
            Cron Jobs
          </h1>
          <p className='text-slate-600 dark:text-slate-400 mt-1'>
            Manage scheduled tasks and recurring jobs
          </p>
        </div>
        <Link href='/cron-jobs/new'>
          <Button>
            <Plus className='w-4 h-4' />
            Create Cron Job
          </Button>
        </Link>
      </div>

      {cronJobs.length === 0 ? (
        <Card className='text-center py-12'>
          <Clock className='w-12 h-12 mx-auto text-slate-400 mb-4' />
          <p className='text-slate-600 dark:text-slate-400'>
            No cron jobs configured
          </p>
          <Link href='/cron-jobs/new'>
            <Button variant='secondary' className='mt-4'>
              <Plus className='w-4 h-4' />
              Create your first cron job
            </Button>
          </Link>
        </Card>
      ) : (
        <Card className='overflow-x-auto'>
          <table className='w-full'>
            <thead className='bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700'>
              <tr>
                <th className='px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider'>
                  Name
                </th>
                <th className='px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider'>
                  Schedule
                </th>
                <th className='px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider'>
                  Endpoint
                </th>
                <th className='px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider'>
                  Method
                </th>
                <th className='px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider'>
                  Status
                </th>
                <th className='px-4 py-3 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-200 dark:divide-slate-700'>
              {cronJobs.map((cronJob) => (
                <tr
                  key={cronJob.name}
                  className='hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors'
                >
                  <td className='px-4 py-3 text-sm text-slate-900 dark:text-slate-100'>
                    {cronJob.name}
                  </td>
                  <td className='px-4 py-3'>
                    <code className='text-sm text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded'>
                      {cronJob.schedule}
                    </code>
                  </td>
                  <td className='px-4 py-3 text-sm text-slate-600 dark:text-slate-400 truncate max-w-xs'>
                    {cronJob.endpoint}
                  </td>
                  <td className='px-4 py-3'>
                    <span className='inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'>
                      {cronJob.method}
                    </span>
                  </td>
                  <td className='px-4 py-3'>
                    <button
                      onClick={() => handleToggleActive(cronJob)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                        cronJob.active
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800'
                          : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      <Power size={12} />
                      {cronJob.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className='px-4 py-3 text-right'>
                    <div className='flex items-center justify-end gap-2'>
                      <Link href={`/cron-jobs/${cronJob.name}`}>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-8 w-8 p-0'
                        >
                          <Edit className='w-4 h-4' />
                        </Button>
                      </Link>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20'
                        onClick={() => handleDelete(cronJob.name)}
                      >
                        <Trash2 className='w-4 h-4' />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
