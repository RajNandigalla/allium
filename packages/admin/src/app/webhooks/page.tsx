'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2, Edit, Power } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWebhooks();
  }, []);

  const loadWebhooks = async () => {
    try {
      setLoading(true);
      const data = await adminApi.listWebhooks();
      setWebhooks(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load webhooks');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`Delete webhook "${name}"?`)) return;

    try {
      await adminApi.deleteWebhook(name);
      toast.success('Webhook deleted');
      loadWebhooks();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete webhook');
    }
  };

  const handleToggleActive = async (webhook: any) => {
    try {
      await adminApi.updateWebhook(webhook.name, {
        ...webhook,
        active: !webhook.active,
      });
      toast.success(`Webhook ${webhook.active ? 'disabled' : 'enabled'}`);
      loadWebhooks();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update webhook');
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
            Webhooks
          </h1>
          <p className='text-slate-600 dark:text-slate-400 mt-1'>
            Manage outgoing webhook subscriptions
          </p>
        </div>
        <Link href='/webhooks/new'>
          <Button>
            <Plus className='w-4 h-4' />
            Create Webhook
          </Button>
        </Link>
      </div>

      {webhooks.length === 0 ? (
        <Card className='text-center py-12'>
          <p className='text-slate-600 dark:text-slate-400'>
            No webhooks configured
          </p>
          <Link href='/webhooks/new'>
            <Button variant='secondary' className='mt-4'>
              <Plus className='w-4 h-4' />
              Create your first webhook
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
                  URL
                </th>
                <th className='px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider'>
                  Events
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
              {webhooks.map((webhook) => (
                <tr
                  key={webhook.name}
                  className='hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors'
                >
                  <td className='px-4 py-3 text-sm text-slate-900 dark:text-slate-100'>
                    {webhook.name}
                  </td>
                  <td className='px-4 py-3 text-sm text-slate-600 dark:text-slate-400 truncate max-w-xs'>
                    {webhook.url}
                  </td>
                  <td className='px-4 py-3'>
                    <div className='flex flex-wrap gap-1'>
                      {webhook.events.slice(0, 3).map((event: string) => (
                        <span
                          key={event}
                          className='inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
                        >
                          {event}
                        </span>
                      ))}
                      {webhook.events.length > 3 && (
                        <span className='inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'>
                          +{webhook.events.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className='px-4 py-3'>
                    <button
                      onClick={() => handleToggleActive(webhook)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                        webhook.active
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800'
                          : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      <Power size={12} />
                      {webhook.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className='px-4 py-3 text-right'>
                    <div className='flex items-center justify-end gap-2'>
                      <Link href={`/webhooks/${webhook.name}`}>
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
                        onClick={() => handleDelete(webhook.name)}
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
