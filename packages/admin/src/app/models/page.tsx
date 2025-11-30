'use client';

import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { SidePanel } from '../../components/ui/SidePanel';
import {
  Plus,
  Database,
  Trash2,
  Link2,
  Eraser,
  Settings,
  Search,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { adminApi, ModelDefinition } from '../../lib/api';
import { ModelWizard } from '../../components/model-wizard/ModelWizard';
import { Input } from '../../components/ui/Input';

export default function ModelsPage() {
  const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false);
  const [models, setModels] = useState<ModelDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [expandedModels, setExpandedModels] = useState<Record<string, boolean>>(
    {}
  );

  const [editingModel, setEditingModel] = useState<ModelDefinition | null>(
    null
  );

  const toggleExpanded = (modelName: string) => {
    setExpandedModels((prev) => ({
      ...prev,
      [modelName]: !prev[modelName],
    }));
  };

  const toggleFilter = (filter: string) => {
    setActiveFilters((prev) =>
      prev.includes(filter)
        ? prev.filter((f) => f !== filter)
        : [...prev, filter]
    );
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

  const handleUpdateModel = async (data: any) => {
    if (!editingModel) return;

    try {
      console.log('Updating model:', data);
      toast.loading(`Updating model ${data.name}...`, { id: 'update-model' });

      // Update Model Definition
      await adminApi.updateModel(editingModel.name, data);

      toast.success(`Model ${data.name} updated successfully!`, {
        id: 'update-model',
      });
      setEditingModel(null);
      setIsCreatePanelOpen(false);

      // Refresh models list
      fetchModels();
    } catch (error: any) {
      console.error('Failed to update model:', error);
      toast.error(error.message || 'Failed to update model', {
        id: 'update-model',
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

  const handleClearData = async (modelName: string) => {
    if (
      !confirm(
        `Are you sure you want to clear ALL data from "${modelName}"? This cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await toast.promise(
        adminApi.clearModelData(modelName),
        {
          loading: `Clearing data from ${modelName}...`,
          success: (data) => `Cleared ${data.count} records from ${modelName}!`,
          error: (err) => `Failed to clear data: ${err.message}`,
        },
        {
          id: 'clear-data',
        }
      );
    } catch (error) {
      console.error('Failed to clear data:', error);
    }
  };

  const openCreateWizard = () => {
    setEditingModel(null);
    setIsCreatePanelOpen(true);
  };

  const openEditWizard = (model: ModelDefinition) => {
    setEditingModel(model);
    setIsCreatePanelOpen(true);
  };

  const filteredModels = models.filter((model) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      model.name.toLowerCase().includes(query) ||
      model.description?.toLowerCase().includes(query);

    if (!matchesSearch) return false;

    if (activeFilters.length === 0) return true;

    return activeFilters.every((filter) => {
      if (filter === 'Soft Delete') return model.softDelete;
      if (filter === 'Audit Trail') return model.auditTrail;
      if (filter === 'Configured')
        return model.api || model.service || model.constraints;
      return true;
    });
  });

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-4'>
        <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>Models</h1>
            <p className='text-slate-500 dark:text-slate-400 mt-2'>
              Manage your data models and schema definitions.
            </p>
          </div>
          <div className='flex items-center gap-3 w-full md:w-auto'>
            <div className='relative flex-1 md:w-64'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400' />
              <Input
                placeholder='Search models...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-9'
              />
            </div>
            <Button onClick={openCreateWizard}>
              <Plus className='w-4 h-4 mr-2' />
              Create Model
            </Button>
          </div>
        </div>

        {/* Filter Chips */}
        <div className='flex items-center gap-2 flex-wrap'>
          <span className='text-sm text-slate-500 font-medium mr-1'>
            Filter by:
          </span>
          {['Soft Delete', 'Audit Trail', 'Configured'].map((filter) => (
            <button
              key={filter}
              onClick={() => toggleFilter(filter)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                activeFilters.includes(filter)
                  ? 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-700'
              }`}
            >
              {filter}
            </button>
          ))}
          {activeFilters.length > 0 && (
            <button
              onClick={() => setActiveFilters([])}
              className='px-3 py-1.5 text-xs font-medium text-red-500 hover:text-red-600 transition-colors'
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className='flex justify-center items-center h-64'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600'></div>
          <span className='ml-3 text-slate-500'>Loading models...</span>
        </div>
      ) : error ? (
        <div className='bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg flex items-center justify-between'>
          <span>{error}</span>
          <Button variant='secondary' size='sm' onClick={fetchModels}>
            Retry
          </Button>
        </div>
      ) : filteredModels.length === 0 ? (
        <div className='text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700'>
          {searchQuery ? (
            <>
              <Search className='w-12 h-12 text-slate-400 mx-auto mb-4' />
              <h3 className='text-lg font-medium text-slate-900 dark:text-slate-100'>
                No models found
              </h3>
              <p className='text-slate-500 dark:text-slate-400 mt-2 mb-6'>
                No models match your search &quot;{searchQuery}&quot;.
              </p>
              <Button variant='secondary' onClick={() => setSearchQuery('')}>
                Clear Search
              </Button>
            </>
          ) : (
            <>
              <Database className='w-12 h-12 text-slate-400 mx-auto mb-4' />
              <h3 className='text-lg font-medium text-slate-900 dark:text-slate-100'>
                No models found
              </h3>
              <p className='text-slate-500 dark:text-slate-400 mt-2 mb-6'>
                Get started by creating your first data model.
              </p>
              <Button onClick={openCreateWizard}>
                <Plus className='w-4 h-4 mr-2' />
                Create Model
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {filteredModels.map((model) => {
            const isExpanded = expandedModels[model.name] || false;

            return (
              <Card key={model.name} className='relative group'>
                <div className='absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2'>
                  <Button
                    variant='ghost'
                    size='sm'
                    className='h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 p-0'
                    onClick={() => openEditWizard(model)}
                    title='Edit Model'
                  >
                    <Settings className='w-4 h-4' />
                  </Button>
                  <Button
                    variant='ghost'
                    size='sm'
                    className='h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 p-0'
                    onClick={() => handleClearData(model.name)}
                    title='Clear Data (Truncate)'
                  >
                    <Eraser className='w-4 h-4' />
                  </Button>
                  <Button
                    variant='ghost'
                    size='sm'
                    className='h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 p-0'
                    onClick={() => handleDeleteModel(model.name)}
                    title='Delete Model'
                  >
                    <Trash2 className='w-4 h-4' />
                  </Button>
                </div>

                <div className='mb-4'>
                  <div className='flex items-center justify-between mb-2'>
                    <h3 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>
                      {model.name}
                    </h3>
                  </div>
                  {model.description && (
                    <p className='text-sm text-slate-500 dark:text-slate-400 line-clamp-2'>
                      {model.description}
                    </p>
                  )}
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
        onOpenChange={(open) => {
          setIsCreatePanelOpen(open);
          if (!open) setEditingModel(null);
        }}
        title={
          editingModel ? `Edit Model: ${editingModel.name}` : 'Create New Model'
        }
        description={
          editingModel
            ? 'Modify existing model definition.'
            : 'Define a new data model with fields, relations, and configuration.'
        }
      >
        <ModelWizard
          initialData={editingModel}
          mode={editingModel ? 'edit' : 'create'}
          onSubmit={editingModel ? handleUpdateModel : handleCreateModel}
          onCancel={() => {
            setIsCreatePanelOpen(false);
            setEditingModel(null);
          }}
        />
      </SidePanel>
    </div>
  );
}
