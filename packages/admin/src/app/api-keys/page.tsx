'use client';

import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { SidePanel } from '../../components/ui/SidePanel';
import { Input } from '../../components/ui/Input';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';

const generateKeySchema = z.object({
  name: z.string().min(1, 'Key name is required'),
});

type GenerateKeyForm = z.infer<typeof generateKeySchema>;

export default function ApiKeysPage() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<GenerateKeyForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(generateKeySchema as any),
  });

  const onSubmit = (data: GenerateKeyForm) => {
    console.log('Generating key:', data);
    toast.success(`Generated API key: ${data.name}`);
    // TODO: Implement actual API call
    setIsPanelOpen(false);
    reset();
  };

  return (
    <div>
      <div className='flex items-center justify-between mb-8'>
        <div>
          <h1 className='text-4xl font-bold mb-2 text-slate-900 dark:text-white'>
            API Keys
          </h1>
          <p className='text-slate-600 dark:text-slate-400'>
            Manage your API keys
          </p>
        </div>
        <Button
          variant='primary'
          size='md'
          onClick={() => setIsPanelOpen(true)}
        >
          <Plus size={20} />
          Generate Key
        </Button>
      </div>

      <Card>
        <div className='text-center py-12'>
          <p className='text-slate-600 dark:text-slate-400'>No API keys yet</p>
        </div>
      </Card>

      <SidePanel
        open={isPanelOpen}
        onOpenChange={setIsPanelOpen}
        title='Generate API Key'
        description='Create a new API key to access your project programmatically.'
      >
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-6 mt-4'>
          <Input
            label='Key Name'
            placeholder='e.g. Production Server, Mobile App'
            error={errors.name?.message}
            {...register('name')}
            helperText='Give your key a recognizable name.'
          />

          <div className='flex justify-end gap-3 pt-4'>
            <Button
              type='button'
              variant='ghost'
              onClick={() => setIsPanelOpen(false)}
            >
              Cancel
            </Button>
            <Button type='submit' variant='primary'>
              Generate Key
            </Button>
          </div>
        </form>
      </SidePanel>
    </div>
  );
}
