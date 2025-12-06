'use client';

import { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Plus, X } from 'lucide-react';
import { ModelDefinition } from '../../lib/api';

export interface Filter {
  field: string;
  operator: string;
  value: any;
}

interface DataFiltersProps {
  modelDef: ModelDefinition | null;
  filters: Filter[];
  onChange: (filters: Filter[]) => void;
}

const getOperatorsForType = (
  type: string
): { value: string; label: string }[] => {
  switch (type) {
    case 'String':
      return [
        { value: 'equals', label: 'Equals' },
        { value: 'contains', label: 'Contains' },
        { value: 'startsWith', label: 'Starts with' },
        { value: 'endsWith', label: 'Ends with' },
        { value: 'not', label: 'Not equals' },
      ];
    case 'Int':
    case 'Float':
      return [
        { value: 'equals', label: 'Equals' },
        { value: 'gt', label: 'Greater than' },
        { value: 'gte', label: 'Greater than or equal' },
        { value: 'lt', label: 'Less than' },
        { value: 'lte', label: 'Less than or equal' },
        { value: 'not', label: 'Not equals' },
      ];
    case 'Boolean':
      return [
        { value: 'equals', label: 'Is' },
        { value: 'not', label: 'Is not' },
      ];
    case 'DateTime':
      return [
        { value: 'equals', label: 'On' },
        { value: 'gt', label: 'After' },
        { value: 'gte', label: 'On or after' },
        { value: 'lt', label: 'Before' },
        { value: 'lte', label: 'On or before' },
      ];
    default:
      return [{ value: 'equals', label: 'Equals' }];
  }
};

export function DataFilters({ modelDef, filters, onChange }: DataFiltersProps) {
  const [localFilters, setLocalFilters] = useState<Filter[]>(filters);

  const addFilter = () => {
    const firstField = modelDef?.fields?.[0];
    if (!firstField) return;

    const newFilter: Filter = {
      field: firstField.name,
      operator: 'equals',
      value: '',
    };
    const updated = [...localFilters, newFilter];
    setLocalFilters(updated);
    onChange(updated);
  };

  const removeFilter = (index: number) => {
    const updated = localFilters.filter((_, i) => i !== index);
    setLocalFilters(updated);
    onChange(updated);
  };

  const updateFilter = (index: number, key: keyof Filter, value: any) => {
    const updated = [...localFilters];
    updated[index] = { ...updated[index], [key]: value };

    // If field changed, reset operator to default for that type
    if (key === 'field') {
      const field = modelDef?.fields?.find((f) => f.name === value);
      if (field) {
        const operators = getOperatorsForType(field.type);
        updated[index].operator = operators[0].value;
      }
    }

    setLocalFilters(updated);
    onChange(updated);
  };

  const clearFilters = () => {
    setLocalFilters([]);
    onChange([]);
  };

  if (!modelDef) return null;

  const availableFields =
    modelDef.fields?.filter(
      (f) => f.name !== 'id' && f.name !== 'createdAt' && f.name !== 'updatedAt'
    ) || [];

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between'>
        <h4 className='text-sm font-semibold text-slate-700 dark:text-slate-300'>
          Filters
        </h4>
        <Button variant='secondary' size='sm' onClick={addFilter}>
          <Plus className='w-4 h-4 mr-1' />
          Add Filter
        </Button>
      </div>

      {localFilters.length === 0 ? (
        <p className='text-sm text-slate-500 dark:text-slate-400 text-center py-4'>
          No filters applied. Click "Add Filter" to filter records.
        </p>
      ) : (
        <div className='space-y-2'>
          {localFilters.map((filter, index) => {
            const field = modelDef.fields?.find((f) => f.name === filter.field);
            const operators = field ? getOperatorsForType(field.type) : [];

            return (
              <div
                key={index}
                className='flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg'
              >
                {/* Field Selector */}
                <select
                  value={filter.field}
                  onChange={(e) => updateFilter(index, 'field', e.target.value)}
                  className='flex-1 px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg'
                >
                  {availableFields.map((f) => (
                    <option key={f.name} value={f.name}>
                      {f.name}
                    </option>
                  ))}
                </select>

                {/* Operator Selector */}
                <select
                  value={filter.operator}
                  onChange={(e) =>
                    updateFilter(index, 'operator', e.target.value)
                  }
                  className='px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg'
                >
                  {operators.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>

                {/* Value Input */}
                {field?.type === 'Boolean' ? (
                  <select
                    value={String(filter.value)}
                    onChange={(e) =>
                      updateFilter(index, 'value', e.target.value === 'true')
                    }
                    className='flex-1 px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg'
                  >
                    <option value='true'>True</option>
                    <option value='false'>False</option>
                  </select>
                ) : (
                  <Input
                    type={
                      field?.type === 'Int' || field?.type === 'Float'
                        ? 'number'
                        : field?.type === 'DateTime'
                        ? 'datetime-local'
                        : 'text'
                    }
                    value={filter.value}
                    onChange={(e) => {
                      const val =
                        field?.type === 'Int' || field?.type === 'Float'
                          ? e.target.value === ''
                            ? ''
                            : Number(e.target.value)
                          : e.target.value;
                      updateFilter(index, 'value', val);
                    }}
                    placeholder='Enter value...'
                    className='flex-1'
                  />
                )}

                {/* Remove Button */}
                <button
                  onClick={() => removeFilter(index)}
                  className='p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors'
                  title='Remove filter'
                >
                  <X className='w-4 h-4' />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
