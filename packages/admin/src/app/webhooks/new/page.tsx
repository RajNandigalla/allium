'use client';

import { Card } from '@/components/ui/Card';
import WebhookForm from '../WebhookForm';

export default function NewWebhookPage() {
  return (
    <div className='max-w-3xl'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold text-slate-900 dark:text-white'>
          Create Webhook
        </h1>
        <p className='text-slate-600 dark:text-slate-400 mt-1'>
          Configure a new outgoing webhook subscription
        </p>
      </div>

      <Card>
        <WebhookForm />
      </Card>
    </div>
  );
}
