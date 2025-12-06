'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { SidePanel } from '../../components/ui/SidePanel';
import {
  Database,
  Plus,
  Trash2,
  Edit,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { adminApi, ModelDefinition } from '../../lib/api';

export default function GlobalDataPage() {
  const searchParams = useSearchParams();
  const initialModel = searchParams?.get('model') || '';

  const [models, setModels] = useState<ModelDefinition[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>(initialModel);

  const [records, setRecords] = useState<any[]>([]);
  const [modelDef, setModelDef] = useState<ModelDefinition | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Relation data cache
  const [relationData, setRelationData] = useState<Record<string, any[]>>({});

  // Fetch available models
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const defs = await adminApi.getModels();
        setModels(defs);
      } catch (err) {
        console.error('Failed to fetch models:', err);
        toast.error('Failed to load models');
      }
    };
    fetchModels();
  }, []);

  // Update URL when model changes
  useEffect(() => {
    if (selectedModel) {
      const url = new URL(window.location.href);
      url.searchParams.set('model', selectedModel);
      window.history.pushState({}, '', url.toString());
    }
  }, [selectedModel]);

  const fetchModelDefinition = async () => {
    if (!selectedModel) return;

    try {
      const model = models.find(
        (m) => m.name.toLowerCase() === selectedModel.toLowerCase()
      );
      setModelDef(model || null);

      // Fetch related records for all relations
      if (model?.relations) {
        const relData: Record<string, any[]> = {};
        for (const relation of model.relations) {
          if (relation.model) {
            try {
              const response = await adminApi.listRecords(relation.model, {
                limit: 100,
              });
              relData[relation.name] = response.data;
            } catch (err) {
              console.error(`Failed to fetch ${relation.model} records:`, err);
              relData[relation.name] = [];
            }
          }
        }
        setRelationData(relData);
      }
    } catch (err) {
      console.error('Failed to fetch model definition:', err);
    }
  };

  const fetchRecords = async () => {
    if (!selectedModel) return;

    try {
      setIsLoading(true);
      setError(null);
      const response = await adminApi.listRecords(selectedModel, {
        page,
        limit,
      });
      setRecords(response.data);
      setTotal(response.meta.total);
      setPages(response.meta.pages);
    } catch (err: any) {
      console.error('Failed to fetch records:', err);
      setError(err.message || 'Failed to load records');
      setRecords([]);
      setTotal(0);
      setPages(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedModel && models.length > 0) {
      fetchModelDefinition();
      fetchRecords();
    } else {
      setRecords([]);
      setModelDef(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModel, page, models, limit]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) {
      return;
    }

    try {
      await toast.promise(adminApi.deleteRecord(selectedModel, id), {
        loading: 'Deleting record...',
        success: 'Record deleted successfully!',
        error: (err) => `Failed to delete: ${err.message}`,
      });
      fetchRecords();
    } catch (error) {
      console.error('Failed to delete record:', error);
    }
  };

  const openCreateForm = () => {
    setEditingRecord(null);
    setFormData({});
    setIsFormOpen(true);
  };

  const openEditForm = (record: any) => {
    setEditingRecord(record);
    setFormData({ ...record });
    setIsFormOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (editingRecord) {
        await toast.promise(
          adminApi.updateRecord(selectedModel, editingRecord.id, formData),
          {
            loading: 'Updating record...',
            success: 'Record updated successfully!',
            error: (err) => `Failed to update: ${err.message}`,
          }
        );
      } else {
        await toast.promise(adminApi.createRecord(selectedModel, formData), {
          loading: 'Creating record...',
          success: 'Record created successfully!',
          error: (err) => `Failed to create: ${err.message}`,
        });
      }
      setIsFormOpen(false);
      fetchRecords();
    } catch (error) {
      console.error('Failed to save record:', error);
    }
  };

  const renderFormField = (field: any) => {
    const value = formData[field.name] || '';

    // Skip auto-generated fields
    if (
      field.name === 'id' ||
      field.name === 'createdAt' ||
      field.name === 'updatedAt'
    ) {
      return null;
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setFormData((prev) => ({
        ...prev,
        [field.name]:
          field.type === 'Int' || field.type === 'Float'
            ? val === ''
              ? null
              : Number(val)
            : field.type === 'Boolean'
            ? val === 'true'
            : val,
      }));
    };

    if (field.type === 'Boolean') {
      return (
        <div key={field.name} className='space-y-2'>
          <label className='text-sm font-medium text-slate-700 dark:text-slate-200'>
            {field.name}
            {field.required && <span className='text-red-500 ml-1'>*</span>}
          </label>
          <select
            value={String(value)}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                [field.name]: e.target.value === 'true',
              }))
            }
            className='w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg'
          >
            <option value='false'>False</option>
            <option value='true'>True</option>
          </select>
        </div>
      );
    }

    return (
      <Input
        key={field.name}
        label={field.name}
        type={
          field.type === 'Int' || field.type === 'Float' ? 'number' : 'text'
        }
        value={value}
        onChange={handleChange}
        helperText={field.required ? 'Required' : undefined}
      />
    );
  };

  const renderRelationField = (relation: any) => {
    const relatedRecords = relationData[relation.name] || [];
    // Try to find value in foreign key first (e.g. authorId), then relation name (e.g. author)
    // If the value is an object (relation included), try to get its ID
    let value = formData[relation.foreignKey] || formData[relation.name] || '';

    if (typeof value === 'object' && value !== null) {
      value = value.id || '';
    }

    // For n:m relations, we might need to handle arrays
    const isMultiple = relation.type === 'n:m' || relation.type === '1:n';

    return (
      <div key={relation.name} className='space-y-2'>
        <label className='text-sm font-medium text-slate-700 dark:text-slate-200'>
          {relation.name} ({relation.model})
          {relation.required && <span className='text-red-500 ml-1'>*</span>}
        </label>
        <select
          value={value}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              [relation.name]: e.target.value,
            }))
          }
          className='w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg'
        >
          <option value=''>-- Select {relation.model} --</option>
          {relatedRecords.map((record) => (
            <option key={record.id} value={record.id}>
              {record.name || record.title || record.id}
            </option>
          ))}
        </select>
        <p className='text-xs text-slate-500'>
          {isMultiple
            ? 'Multiple selection (coming soon)'
            : `Select a ${relation.model} record`}
        </p>
      </div>
    );
  };

  const columns = records.length > 0 ? Object.keys(records[0]) : [];

  return (
    <div className='space-y-6 p-8'>
      {/* Header */}
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Data Explorer</h1>
          <p className='text-slate-500 dark:text-slate-400 mt-2'>
            Manage data across all your models
          </p>
        </div>

        <div className='flex items-center gap-4'>
          <div className='w-64'>
            <select
              value={selectedModel}
              onChange={(e) => {
                setSelectedModel(e.target.value);
                setPage(1);
              }}
              className='w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500'
            >
              <option value=''>Select a Model</option>
              {models.map((model) => (
                <option key={model.name} value={model.name}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>

          {selectedModel && (
            <Button onClick={openCreateForm}>
              <Plus className='w-4 h-4 mr-2' />
              Create Record
            </Button>
          )}
        </div>
      </div>

      {!selectedModel ? (
        <Card className='flex flex-col items-center justify-center py-24 text-center'>
          <div className='bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-full mb-4'>
            <Database className='w-8 h-8 text-indigo-600 dark:text-indigo-400' />
          </div>
          <h3 className='text-xl font-semibold mb-2'>Select a Model</h3>
          <p className='text-slate-500 max-w-md'>
            Choose a model from the dropdown above to view and manage its
            records.
          </p>
        </Card>
      ) : (
        <>
          {/* Data Table */}
          {isLoading ? (
            <div className='flex justify-center items-center h-64'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600'></div>
              <span className='ml-3 text-slate-500'>Loading records...</span>
            </div>
          ) : error ? (
            <div className='bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg'>
              {error}
            </div>
          ) : records.length === 0 ? (
            <Card className='text-center py-12'>
              <p className='text-slate-500'>
                No records found for {selectedModel}.
              </p>
              <Button
                variant='secondary'
                className='mt-4'
                onClick={openCreateForm}
              >
                <Plus className='w-4 h-4 mr-2' />
                Create First Record
              </Button>
            </Card>
          ) : (
            <>
              <Card className='overflow-x-auto'>
                <table className='w-full'>
                  <thead className='bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700'>
                    <tr>
                      {columns.map((col) => (
                        <th
                          key={col}
                          className='px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider'
                        >
                          {col}
                        </th>
                      ))}
                      <th className='px-4 py-3 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider'>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-slate-200 dark:divide-slate-700'>
                    {records.map((record, idx) => (
                      <tr
                        key={record.id || idx}
                        className='hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors'
                      >
                        {columns.map((col) => (
                          <td
                            key={col}
                            className='px-4 py-3 text-sm text-slate-900 dark:text-slate-100'
                          >
                            {typeof record[col] === 'object'
                              ? JSON.stringify(record[col])
                              : String(record[col] ?? '')}
                          </td>
                        ))}
                        <td className='px-4 py-3 text-right'>
                          <div className='flex justify-end gap-2'>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='h-8 w-8 p-0'
                              onClick={() => openEditForm(record)}
                            >
                              <Edit className='w-4 h-4' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20'
                              onClick={() => handleDelete(record.id)}
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

              {/* Pagination */}
              <div className='flex items-center justify-between'>
                <p className='text-sm text-slate-500'>
                  Showing {(page - 1) * limit + 1} to{' '}
                  {Math.min(page * limit, total)} of {total} records
                </p>
                <div className='flex gap-2'>
                  <Button
                    variant='secondary'
                    size='sm'
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className='w-4 h-4' />
                    Previous
                  </Button>
                  <div className='flex items-center gap-2 px-4'>
                    <span className='text-sm text-slate-600 dark:text-slate-400'>
                      Page {page} of {pages}
                    </span>
                  </div>
                  <Button
                    variant='secondary'
                    size='sm'
                    onClick={() => setPage((p) => Math.min(pages, p + 1))}
                    disabled={page === pages}
                  >
                    Next
                    <ChevronRight className='w-4 h-4' />
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Create/Edit Form */}
          <SidePanel
            open={isFormOpen}
            onOpenChange={setIsFormOpen}
            title={editingRecord ? 'Edit Record' : 'Create Record'}
            description={
              editingRecord
                ? 'Update the record details.'
                : 'Add a new record to the database.'
            }
          >
            <div className='space-y-4'>
              {/* Regular Fields */}
              {modelDef?.fields?.map(renderFormField)}

              {/* Relation Fields */}
              {modelDef?.relations && modelDef.relations.length > 0 && (
                <>
                  <div className='pt-4 border-t border-slate-200 dark:border-slate-700'>
                    <h4 className='text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3'>
                      Relations
                    </h4>
                  </div>
                  {modelDef.relations.map(renderRelationField)}
                </>
              )}

              <div className='flex gap-3 pt-4'>
                <Button onClick={handleSubmit} className='flex-1'>
                  {editingRecord ? 'Update' : 'Create'}
                </Button>
                <Button
                  variant='secondary'
                  onClick={() => setIsFormOpen(false)}
                  className='flex-1'
                >
                  Cancel
                </Button>
              </div>
            </div>
          </SidePanel>
        </>
      )}
    </div>
  );
}
