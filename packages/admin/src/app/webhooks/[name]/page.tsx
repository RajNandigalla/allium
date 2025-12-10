'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { adminApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { toast } from 'react-hot-toast';
import WebhookForm from '../WebhookForm';

export default function EditWebhookPage() {
  const params = useParams();
  const name = params.name as string;
  const [webhook, setWebhook] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWebhook();
  }, [name]);

  const loadWebhook = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getWebhook(name);
      setWebhook(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load webhook');
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

  if (!webhook) {
    return (
      <Card className='text-center py-12'>
        <p className='text-slate-600 dark:text-slate-400'>Webhook not found</p>
      </Card>
    );
  }

  return (
    <div className='max-w-3xl'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold text-slate-900 dark:text-white'>
          Edit Webhook
        </h1>
        <p className='text-slate-600 dark:text-slate-400 mt-1'>
          Update webhook configuration for{' '}
          <span className='font-mono'>{name}</span>
        </p>
      </div>

      <Card>
        <WebhookForm initialData={webhook} isEdit />
      </Card>
    </div>
  );
}
