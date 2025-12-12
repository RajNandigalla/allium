'use client';

import { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { SidePanel } from '../ui/SidePanel';
import { Plus, Trash2, Edit, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { adminApi, ModelDefinition } from '../../lib/api';
import { DataFilters, Filter } from './DataFilters';

interface DataExplorerProps {
  modelName: string;
  modelDef: ModelDefinition | null;
  onModelDefChange?: (def: ModelDefinition | null) => void;
}

export function DataExplorer({
  modelName,
  modelDef: externalModelDef,
  onModelDefChange,
}: DataExplorerProps) {
  const [records, setRecords] = useState<any[]>([]);
  const [modelDef, setModelDef] = useState<ModelDefinition | null>(
    externalModelDef
  );
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

  // Filters
  const [filters, setFilters] = useState<Filter[]>([]);
  const [appliedFilters, setAppliedFilters] = useState<Filter[]>([]);

  // Sync external modelDef
  useEffect(() => {
    setModelDef(externalModelDef);
  }, [externalModelDef]);

  // Fetch model definition if not provided
  useEffect(() => {
    if (!modelName || externalModelDef) return;

    const fetchDef = async () => {
      try {
        const defs = await adminApi.getModels();
        const def = defs.find(
          (m) => m.name.toLowerCase() === modelName.toLowerCase()
        );
        setModelDef(def || null);
        onModelDefChange?.(def || null);

        // Fetch related records
        if (def?.relations) {
          const relData: Record<string, any[]> = {};
          for (const relation of def.relations) {
            if (relation.model) {
              try {
                const response = await adminApi.listRecords(relation.model, {
                  limit: 100,
                });
                relData[relation.name] = response.data;
              } catch (err) {
                console.error(`Failed to fetch ${relation.model}:`, err);
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

    fetchDef();
  }, [modelName, externalModelDef, onModelDefChange]);

  const fetchRecords = async () => {
    if (!modelName) return;

    try {
      setIsLoading(true);
      setError(null);

      const params: any = { page, limit };

      appliedFilters.forEach((filter) => {
        if (
          filter.value !== '' &&
          filter.value !== null &&
          filter.value !== undefined
        ) {
          const operator =
            filter.operator === 'equals' ? '$eq' : `$${filter.operator}`;
          params[`filters[${filter.field}][${operator}]`] = filter.value;
        }
      });

      const response = await adminApi.listRecords(modelName, params);
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
    if (modelName && modelDef) {
      fetchRecords();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelName, page, modelDef, limit, appliedFilters]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;

    try {
      await toast.promise(adminApi.deleteRecord(modelName, id), {
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
          adminApi.updateRecord(modelName, editingRecord.id, formData),
          {
            loading: 'Updating record...',
            success: 'Record updated successfully!',
            error: (err) => `Failed to update: ${err.message}`,
          }
        );
      } else {
        await toast.promise(adminApi.createRecord(modelName, formData), {
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
    let value = formData[relation.foreignKey] || formData[relation.name] || '';

    if (typeof value === 'object' && value !== null) {
      value = value.id || '';
    }

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

  // Determine visible columns
  const columns =
    records.length > 0
      ? (() => {
          const allKeys = Object.keys(records[0]).filter(
            (key) =>
              !key.startsWith('_') &&
              key !== 'uuid' &&
              key !== 'createdBy' &&
              key !== 'updatedBy' &&
              key !== 'deletedBy'
          );

          if (modelDef?.draftPublish) {
            const result = [];
            if (allKeys.includes('status')) result.push('status');
            result.push(
              ...allKeys.filter((k) => k !== 'status' && k !== 'publishedAt')
            );
            if (allKeys.includes('publishedAt')) result.push('publishedAt');
            return result.slice(0, 8);
          }

          return allKeys.slice(0, 8);
        })()
      : [];

  if (isLoading) {
    return (
      <div className='flex justify-center items-center h-64'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600'></div>
        <span className='ml-3 text-slate-500'>Loading records...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className='bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg'>
        {error}
      </div>
    );
  }

  return (
    <>
      {/* Filters */}
      <Card className='mb-6'>
        <DataFilters
          modelDef={modelDef}
          filters={filters}
          onChange={setFilters}
        />
        {filters.length > 0 && (
          <div className='mt-4 flex gap-2'>
            <Button
              onClick={() => {
                setAppliedFilters(filters);
                setPage(1);
              }}
              size='sm'
            >
              Apply Filters
            </Button>
            <Button
              variant='secondary'
              onClick={() => {
                setFilters([]);
                setAppliedFilters([]);
                setPage(1);
              }}
              size='sm'
            >
              Clear All
            </Button>
          </div>
        )}
      </Card>

      {/* Data Table */}
      {records.length === 0 ? (
        <Card className='text-center py-12'>
          <p className='text-slate-500'>No records found for {modelName}.</p>
          <Button variant='secondary' className='mt-4' onClick={openCreateForm}>
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
                        {col === 'status' ? (
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              record[col] === 'PUBLISHED'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                : record[col] === 'ARCHIVED'
                                ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                            }`}
                          >
                            {record[col]}
                          </span>
                        ) : col === 'publishedAt' ? (
                          record[col] ? (
                            new Date(record[col]).toLocaleString()
                          ) : (
                            <span className='text-slate-400'>Not set</span>
                          )
                        ) : typeof record[col] === 'object' ? (
                          JSON.stringify(record[col])
                        ) : (
                          String(record[col] ?? '')
                        )}
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
          <div className='flex items-center justify-between mt-4'>
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

          {/* Draft/Publish Fields */}
          {modelDef?.draftPublish && (
            <div className='pt-4 border-t border-slate-200 dark:border-slate-700 space-y-4'>
              <h4 className='text-sm font-semibold text-slate-700 dark:text-slate-300'>
                Publishing
              </h4>
              <div className='space-y-2'>
                <label className='text-sm font-medium text-slate-700 dark:text-slate-200'>
                  Status
                </label>
                <select
                  value={formData['status'] || 'DRAFT'}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      status: e.target.value,
                    }))
                  }
                  className='w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg'
                >
                  <option value='DRAFT'>Draft</option>
                  <option value='PUBLISHED'>Published</option>
                  <option value='ARCHIVED'>Archived</option>
                </select>
              </div>
              <div className='space-y-2'>
                <label className='text-sm font-medium text-slate-700 dark:text-slate-200'>
                  Published At
                </label>
                <Input
                  type='datetime-local'
                  value={
                    formData['publishedAt']
                      ? new Date(formData['publishedAt'])
                          .toISOString()
                          .slice(0, 16)
                      : ''
                  }
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      publishedAt: e.target.value
                        ? new Date(e.target.value).toISOString()
                        : null,
                    }))
                  }
                />
              </div>
            </div>
          )}

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
  );
}
