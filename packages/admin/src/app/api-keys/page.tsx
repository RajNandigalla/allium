'use client';

import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { SidePanel } from '../../components/ui/SidePanel';
import { Input } from '../../components/ui/Input';
import { Plus, Copy, Trash2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { adminApi } from '../../lib/api';

const generateKeySchema = z.object({
  name: z.string().min(1, 'Key name is required'),
  service: z.string().min(1, 'Service name is required'),
});

type GenerateKeyForm = z.infer<typeof generateKeySchema>;

interface ApiKey {
  id: string;
  name: string;
  key: string;
  service: string;
  isActive: boolean;
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function ApiKeysPage() {
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(false);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(
    () => new Set<string>()
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<GenerateKeyForm>({
    resolver: standardSchemaResolver(generateKeySchema),
  });

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      const response = await adminApi.listApiKeys();
      console.log(response);
      setApiKeys(response ?? []);
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
      toast.error('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const onSubmit = async (data: GenerateKeyForm) => {
    try {
      const response = await adminApi.generateApiKey(data);
      toast.success('API key generated successfully!');
      setGeneratedKey(response.apiKey.key);
      await fetchApiKeys();
      reset();
    } catch (error) {
      console.error('Failed to generate API key:', error);
      toast.error('Failed to generate API key');
    }
  };

  const handleRevoke = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to revoke the API key "${name}"?`)) {
      return;
    }

    try {
      await adminApi.revokeApiKey(id);
      toast.success('API key revoked successfully');
      await fetchApiKeys();
    } catch (error) {
      console.error('Failed to revoke API key:', error);
      toast.error('Failed to revoke API key');
    }
  };

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success('API key copied to clipboard');
  };

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const maskKey = (key: string) => {
    return '•'.repeat(key.length);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const closePanelAndReset = () => {
    setIsPanelOpen(false);
    setGeneratedKey(null);
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
            Manage your API keys for service authentication
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

      {loading ? (
        <Card>
          <div className='text-center py-12'>
            <p className='text-slate-600 dark:text-slate-400'>Loading...</p>
          </div>
        </Card>
      ) : apiKeys.length === 0 ? (
        <Card>
          <div className='text-center py-12'>
            <p className='text-slate-600 dark:text-slate-400 mb-2'>
              No API keys yet
            </p>
            <p className='text-sm text-slate-500 dark:text-slate-500'>
              Generate your first API key to get started
            </p>
          </div>
        </Card>
      ) : (
        <div className='space-y-4'>
          {apiKeys.map((key) => (
            <Card key={key.id}>
              <div className='p-6'>
                <div className='flex items-start justify-between mb-4'>
                  <div className='flex-1'>
                    <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-1'>
                      {key.name}
                    </h3>
                    <p className='text-sm text-slate-600 dark:text-slate-400'>
                      Service: {key.service}
                    </p>
                  </div>
                  <div className='flex items-center gap-2'>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        key.isActive
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}
                    >
                      {key.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className='bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 mb-4'>
                  <div className='flex items-center justify-between'>
                    <code className='text-sm font-mono text-slate-700 dark:text-slate-300'>
                      {visibleKeys.has(key.id) ? key.key : maskKey(key.key)}
                    </code>
                    <div className='flex items-center gap-2'>
                      <button
                        onClick={() => toggleKeyVisibility(key.id)}
                        className='p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors'
                        title={
                          visibleKeys.has(key.id) ? 'Hide key' : 'Show key'
                        }
                      >
                        {visibleKeys.has(key.id) ? (
                          <EyeOff
                            size={16}
                            className='text-slate-600 dark:text-slate-400'
                          />
                        ) : (
                          <Eye
                            size={16}
                            className='text-slate-600 dark:text-slate-400'
                          />
                        )}
                      </button>
                      <button
                        onClick={() => handleCopy(key.key)}
                        className='p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors'
                        title='Copy to clipboard'
                      >
                        <Copy
                          size={16}
                          className='text-slate-600 dark:text-slate-400'
                        />
                      </button>
                    </div>
                  </div>
                </div>

                <div className='flex items-center justify-between text-sm'>
                  <div className='text-slate-600 dark:text-slate-400'>
                    <span>Created: {formatDate(key.createdAt)}</span>
                    {key.lastUsedAt && (
                      <span className='ml-4'>
                        Last used: {formatDate(key.lastUsedAt)}
                      </span>
                    )}
                  </div>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => handleRevoke(key.id, key.name)}
                    className='text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20'
                  >
                    <Trash2 size={16} />
                    Revoke
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <SidePanel
        open={isPanelOpen}
        onOpenChange={closePanelAndReset}
        title='Generate API Key'
        description='Create a new API key to access your project programmatically.'
      >
        {generatedKey ? (
          <div className='space-y-6 mt-4'>
            <div className='bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4'>
              <div className='flex gap-3'>
                <AlertCircle
                  className='text-amber-600 dark:text-amber-500 flex-shrink-0'
                  size={20}
                />
                <div>
                  <h4 className='font-semibold text-amber-900 dark:text-amber-200 mb-1'>
                    Save this key now!
                  </h4>
                  <p className='text-sm text-amber-800 dark:text-amber-300'>
                    This is the only time you&apos;ll see the full key. Make
                    sure to copy it to a safe place.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                Your API Key
              </label>
              <div className='bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4'>
                <code className='text-sm font-mono text-slate-700 dark:text-slate-300 break-all'>
                  {generatedKey}
                </code>
              </div>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => handleCopy(generatedKey)}
                className='mt-2 w-full'
              >
                <Copy size={16} />
                Copy to Clipboard
              </Button>
            </div>

            <div className='flex justify-end'>
              <Button variant='primary' onClick={closePanelAndReset}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-6 mt-4'>
            <Input
              label='Key Name'
              placeholder='e.g. Production Server, Mobile App'
              error={errors.name?.message}
              {...register('name')}
              helperText='Give your key a recognizable name.'
            />

            <Input
              label='Service Name'
              placeholder='e.g. production-api, staging-app'
              error={errors.service?.message}
              {...register('service')}
              helperText='Identify which service will use this key.'
            />

            <div className='flex justify-end gap-3 pt-4'>
              <Button
                type='button'
                variant='ghost'
                onClick={closePanelAndReset}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type='submit' variant='primary' disabled={isSubmitting}>
                {isSubmitting ? 'Generating...' : 'Generate Key'}
              </Button>
            </div>
          </form>
        )}
      </SidePanel>
    </div>
  );
}
