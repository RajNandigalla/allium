'use client';

import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { SidePanel } from '../../components/ui/SidePanel';
import { Plus, Database, Link2, Trash2, Settings } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { adminApi, ModelDefinition } from '../../lib/api';
import { ModelWizard } from '../../components/model-wizard/ModelWizard';

export default function ModelsPage() {
  const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false);
  const [models, setModels] = useState<ModelDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedModels, setExpandedModels] = useState<Record<string, boolean>>(
    {}
  );

  const toggleExpanded = (modelName: string) => {
    setExpandedModels((prev) => ({
      ...prev,
      [modelName]: !prev[modelName],
    }));
  };

  const fetchModels = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await adminApi.getModels();
      setModels(data);
    } catch (err: any) {
      console.error('Failed to fetch models:', err);
      setError(err.message || 'Failed to load models');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const handleCreateModel = async (data: any) => {
    try {
      console.log('Creating model:', data);
      toast.loading(`Creating model ${data.name}...`, { id: 'create-model' });

      // 1. Create Model Definition
      await adminApi.createModel(data);

      toast.success(`Model ${data.name} created successfully!`, {
        id: 'create-model',
      });
      setIsCreatePanelOpen(false);

      // Refresh models list
      fetchModels();
    } catch (error: any) {
      console.error('Failed to create model:', error);
      toast.error(error.message || 'Failed to create model', {
        id: 'create-model',
      });
      throw error;
    }
  };

  const handleDeleteModel = async (modelName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete the model "${modelName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      toast.loading(`Deleting model ${modelName}...`, { id: 'delete-model' });
      await adminApi.deleteModel(modelName);
      toast.success(`Model ${modelName} deleted successfully!`, {
        id: 'delete-model',
      });
      fetchModels();
    } catch (error: any) {
      console.error('Failed to delete model:', error);
      toast.error(error.message || 'Failed to delete model', {
        id: 'delete-model',
      });
    }
  };

  return (
    <div className='p-8'>
      <div className='flex items-center justify-between mb-8'>
        <div>
          <h1 className='text-4xl font-bold mb-2'>Models</h1>
          <p className='text-gray-400'>Manage your data models</p>
        </div>
        <Button
          variant='primary'
          size='md'
          onClick={() => setIsCreatePanelOpen(true)}
        >
          <Plus size={20} />
          Create Model
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <div className='text-center py-12'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4'></div>
            <p className='text-gray-400'>Loading models...</p>
          </div>
        </Card>
      ) : error ? (
        <Card>
          <div className='text-center py-12'>
            <p className='text-red-500 mb-4'>{error}</p>
            <Button variant='secondary' size='sm' onClick={fetchModels}>
              Retry
            </Button>
          </div>
        </Card>
      ) : models.length === 0 ? (
        <Card>
          <div className='text-center py-12'>
            <p className='text-gray-400 mb-4'>
              No models yet. Create your first model to get started!
            </p>
            <Button
              variant='primary'
              size='md'
              onClick={() => setIsCreatePanelOpen(true)}
            >
              <Plus size={20} />
              Create Your First Model
            </Button>
          </div>
        </Card>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {models.map((model) => {
            const isExpanded = expandedModels[model.name] || false;

            return (
              <Card key={model.name} hover className='relative'>
                <div className='flex items-start justify-between mb-4'>
                  <div className='flex-1'>
                    <h3 className='text-xl font-bold text-slate-900 dark:text-white mb-1'>
                      {model.name}
                    </h3>
                    {model.description && (
                      <p className='text-sm text-slate-600 dark:text-slate-400'>
                        {model.description}
                      </p>
                    )}
                  </div>
                  <Button
                    variant='ghost'
                    size='sm'
                    className='text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                    onClick={() => handleDeleteModel(model.name)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>

                {/* Summary Stats */}
                <div className='space-y-2 mb-4'>
                  <div className='flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400'>
                    <Database size={16} className='text-indigo-500' />
                    <span>
                      {model.fields?.length || 0} field
                      {model.fields?.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {model.relations && model.relations.length > 0 && (
                    <div className='flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400'>
                      <Link2 size={16} className='text-green-500' />
                      <span>
                        {model.relations.length} relation
                        {model.relations.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}

                  {(model.softDelete ||
                    model.auditTrail ||
                    model.api ||
                    model.service) && (
                    <div className='flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400'>
                      <Settings size={16} className='text-purple-500' />
                      <span>Advanced configuration</span>
                    </div>
                  )}
                </div>

                {/* Expandable Details */}
                <button
                  onClick={() => toggleExpanded(model.name)}
                  className='w-full text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium mb-3 text-left'
                >
                  {isExpanded ? '▼ Hide Details' : '▶ Show Details'}
                </button>

                {isExpanded && (
                  <div className='space-y-4 mb-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg'>
                    {/* Fields List */}
                    {model.fields && model.fields.length > 0 && (
                      <div>
                        <h4 className='text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2'>
                          Fields
                        </h4>
                        <div className='space-y-1'>
                          {model.fields.map((field, idx) => (
                            <div
                              key={idx}
                              className='text-xs flex items-center justify-between py-1'
                            >
                              <span className='font-mono text-slate-900 dark:text-white'>
                                {field.name}
                              </span>
                              <div className='flex items-center gap-2'>
                                <span className='text-slate-500 dark:text-slate-400'>
                                  {field.type}
                                </span>
                                {field.required && (
                                  <span className='px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-[10px] font-medium'>
                                    Required
                                  </span>
                                )}
                                {field.unique && (
                                  <span className='px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-[10px] font-medium'>
                                    Unique
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Relations List */}
                    {model.relations && model.relations.length > 0 && (
                      <div>
                        <h4 className='text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2'>
                          Relations
                        </h4>
                        <div className='space-y-1'>
                          {model.relations.map((relation, idx) => (
                            <div
                              key={idx}
                              className='text-xs flex items-center justify-between py-1'
                            >
                              <span className='font-mono text-slate-900 dark:text-white'>
                                {relation.name}
                              </span>
                              <div className='flex items-center gap-2'>
                                <span className='text-slate-500 dark:text-slate-400'>
                                  {relation.type}
                                </span>
                                <span className='text-slate-500 dark:text-slate-400'>
                                  → {relation.model}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* API Config */}
                    {model.api && (
                      <div>
                        <h4 className='text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2'>
                          API Configuration
                        </h4>
                        <div className='text-xs space-y-1 text-slate-600 dark:text-slate-400'>
                          {model.api.prefix && (
                            <div>
                              Prefix:{' '}
                              <span className='font-mono'>
                                {model.api.prefix}
                              </span>
                            </div>
                          )}
                          {model.api.operations && (
                            <div>
                              Operations: {model.api.operations.join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Service Hooks */}
                    {model.service?.hooks && (
                      <div>
                        <h4 className='text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2'>
                          Service Hooks
                        </h4>
                        <div className='text-xs space-y-1 text-slate-600 dark:text-slate-400'>
                          {Object.entries(model.service.hooks)
                            .filter(([_, value]) => value)
                            .map(([hook, fn]) => (
                              <div key={hook}>
                                {hook}: <span className='font-mono'>{fn}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Feature Badges */}
                <div className='pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-2'>
                  {model.softDelete && (
                    <span className='px-2 py-1 text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded'>
                      Soft Delete
                    </span>
                  )}
                  {model.auditTrail && (
                    <span className='px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded'>
                      Audit Trail
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <SidePanel
        open={isCreatePanelOpen}
        onOpenChange={setIsCreatePanelOpen}
        title='Create New Model'
        description='Define a new data model with fields, relations, and configuration.'
      >
        <ModelWizard
          onSubmit={handleCreateModel}
          onCancel={() => setIsCreatePanelOpen(false)}
        />
      </SidePanel>
    </div>
  );
}
