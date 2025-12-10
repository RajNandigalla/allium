'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Save, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

interface WebhookFormProps {
  initialData?: any;
  isEdit?: boolean;
}

export default function WebhookForm({
  initialData,
  isEdit = false,
}: WebhookFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    url: initialData?.url || '',
    events: initialData?.events || [],
    active: initialData?.active ?? true,
    secret: initialData?.secret || '',
  });

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      const data = await adminApi.getModels();
      setModels(data.map((m: any) => m.name));
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.url || formData.events.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);

      if (isEdit) {
        await adminApi.updateWebhook(initialData.name, formData);
        toast.success('Webhook updated successfully');
      } else {
        await adminApi.createWebhook(formData);
        toast.success('Webhook created successfully');
      }

      router.push('/webhooks');
    } catch (error: any) {
      toast.error(
        error.message || `Failed to ${isEdit ? 'update' : 'create'} webhook`
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleEvent = (event: string) => {
    setFormData((prev) => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter((e: string) => e !== event)
        : [...prev.events, event],
    }));
  };

  const allEvents = [
    '*',
    ...models.flatMap((model) => [
      `${model.toLowerCase()}.created`,
      `${model.toLowerCase()}.updated`,
      `${model.toLowerCase()}.deleted`,
    ]),
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
        placeholder='user-events'
        helperText='Lowercase, alphanumeric, hyphens only (auto-formatted)'
        required
      />

      <Input
        label='URL'
        value={formData.url}
        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
        placeholder='https://api.example.com/webhooks or ${WEBHOOK_URL}'
        helperText='Use ${VAR_NAME} for environment variables'
        required
      />

      <div>
        <label className='block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2'>
          Events ({formData.events.length} selected)
        </label>
        <div className='border border-slate-300 dark:border-slate-700 rounded-lg p-4 max-h-64 overflow-y-auto space-y-2 bg-white dark:bg-slate-800'>
          {allEvents.map((event) => (
            <div
              key={event}
              className='p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded'
            >
              <Checkbox
                checked={formData.events.includes(event)}
                onCheckedChange={() => toggleEvent(event)}
                label={event}
              />
            </div>
          ))}
        </div>
      </div>

      <PasswordInput
        label='Secret (optional)'
        value={formData.secret}
        onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
        placeholder='${WEBHOOK_SECRET}'
        helperText='For HMAC signature verification'
        showCopyButton
      />

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
          {isEdit ? 'Update Webhook' : 'Create Webhook'}
        </Button>
        <Link href='/webhooks'>
          <Button variant='secondary'>
            <X className='w-4 h-4' />
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  );
}
