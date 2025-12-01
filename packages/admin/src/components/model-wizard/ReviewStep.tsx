'use client';

import { WizardStep } from '../ui/WizardStep';
import { Card } from '../ui/Card';
import { CheckCircle2, ChevronDown, ChevronUp, Code } from 'lucide-react';
import { useState } from 'react';
import { clsx } from 'clsx';

interface ReviewStepProps {
  data: any;
  onEdit: (step: number) => void;
}

// Helper function to remove empty values from objects
function cleanEmptyValues(obj: any): any {
  if (Array.isArray(obj)) {
    const cleaned = obj.map(cleanEmptyValues).filter((item) => {
      if (item === null || item === undefined) return false;
      if (typeof item === 'object' && Object.keys(item).length === 0)
        return false;
      return true;
    });
    return cleaned.length > 0 ? cleaned : undefined;
  }

  if (obj !== null && typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip empty strings, null, undefined (but NOT false boolean)
      if (value === '' || value === null || value === undefined) continue;

      // Skip empty arrays
      if (Array.isArray(value) && value.length === 0) continue;

      // Recursively clean nested objects (but preserve booleans)
      if (typeof value === 'object' && typeof value !== 'boolean') {
        const cleanedValue = cleanEmptyValues(value);
        if (
          cleanedValue !== undefined &&
          Object.keys(cleanedValue).length > 0
        ) {
          cleaned[key] = cleanedValue;
        }
      } else {
        // Keep all other values including false booleans
        cleaned[key] = value;
      }
    }
    return Object.keys(cleaned).length > 0 ? cleaned : undefined;
  }

  return obj;
}

export function ReviewStep({ data, onEdit }: ReviewStepProps) {
  const [showJson, setShowJson] = useState(false);

  const hasRelations = data.relations && data.relations.length > 0;
  const hasApiConfig =
    data.apiPrefix || data.apiVersion || data.operations?.length > 0;
  const hasServiceConfig =
    data.beforeCreate ||
    data.afterCreate ||
    data.beforeUpdate ||
    data.afterUpdate ||
    data.beforeDelete ||
    data.afterDelete;

  return (
    <WizardStep>
      <div className='space-y-6'>
        <div className='flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg'>
          <CheckCircle2
            className='text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5'
            size={20}
          />
          <div>
            <h3 className='text-sm font-semibold text-green-900 dark:text-green-100'>
              Ready to Create
            </h3>
            <p className='text-xs text-green-700 dark:text-green-300 mt-1'>
              Review your model configuration below. Click "Edit" on any section
              to make changes.
            </p>
          </div>
        </div>

        {/* Basic Info */}
        <Card>
          <div className='flex items-start justify-between mb-4'>
            <div>
              <h3 className='text-lg font-bold text-slate-900 dark:text-white'>
                {data.name || 'Untitled Model'}
              </h3>
              {data.description && (
                <p className='text-sm text-slate-600 dark:text-slate-400 mt-1'>
                  {data.description}
                </p>
              )}
            </div>
            <button
              type='button'
              onClick={() => onEdit(0)}
              className='text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium'
            >
              Edit
            </button>
          </div>

          <div className='flex flex-wrap gap-2'>
            {data.softDelete && (
              <span className='px-2 py-1 text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded'>
                Soft Delete
              </span>
            )}
            {data.auditTrail && (
              <span className='px-2 py-1 text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded'>
                Audit Trail
              </span>
            )}
          </div>
        </Card>

        {/* Fields */}
        <Card>
          <div className='flex items-center justify-between mb-4'>
            <h4 className='text-sm font-semibold text-slate-900 dark:text-white'>
              Fields ({data.fields?.length || 0})
            </h4>
            <button
              type='button'
              onClick={() => onEdit(1)}
              className='text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium'
            >
              Edit
            </button>
          </div>
          <div className='space-y-2'>
            {data.fields?.map((field: any, index: number) => (
              <div
                key={index}
                className='flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg'
              >
                <div className='flex items-center gap-3'>
                  <span className='font-mono text-sm font-medium text-slate-900 dark:text-white'>
                    {field.name}
                  </span>
                  <span className='text-xs text-slate-500 dark:text-slate-400'>
                    {field.type}
                  </span>
                </div>
                <div className='flex items-center gap-2'>
                  {field.required && (
                    <span className='px-2 py-0.5 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded'>
                      Required
                    </span>
                  )}
                  {field.unique && (
                    <span className='px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded'>
                      Unique
                    </span>
                  )}
                  {field.private && (
                    <span className='px-2 py-0.5 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded'>
                      Private
                    </span>
                  )}
                  {field.encrypted && (
                    <span className='px-2 py-0.5 text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded'>
                      Encrypted
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Relations */}
        {hasRelations && (
          <Card>
            <div className='flex items-center justify-between mb-4'>
              <h4 className='text-sm font-semibold text-slate-900 dark:text-white'>
                Relations ({data.relations?.length || 0})
              </h4>
              <button
                type='button'
                onClick={() => onEdit(2)}
                className='text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium'
              >
                Edit
              </button>
            </div>
            <div className='space-y-2'>
              {data.relations?.map((relation: any, index: number) => (
                <div
                  key={index}
                  className='flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg'
                >
                  <div className='flex items-center gap-3'>
                    <span className='font-mono text-sm font-medium text-slate-900 dark:text-white'>
                      {relation.name}
                    </span>
                    <span className='text-xs text-slate-500 dark:text-slate-400'>
                      {relation.type} → {relation.model}
                    </span>
                  </div>
                  {relation.required && (
                    <span className='px-2 py-0.5 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded'>
                      Required
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Configuration Summary */}
        {(hasApiConfig || hasServiceConfig) && (
          <Card>
            <div className='flex items-center justify-between mb-4'>
              <h4 className='text-sm font-semibold text-slate-900 dark:text-white'>
                Advanced Configuration
              </h4>
              <button
                type='button'
                onClick={() => onEdit(3)}
                className='text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium'
              >
                Edit
              </button>
            </div>
            <div className='space-y-2 text-sm text-slate-600 dark:text-slate-400'>
              {hasApiConfig && <div>✓ API Configuration enabled</div>}
              {hasServiceConfig && <div>✓ Service Hooks configured</div>}
            </div>
          </Card>
        )}

        {/* JSON Preview */}
        <div className='border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden'>
          <button
            type='button'
            onClick={() => setShowJson(!showJson)}
            className='w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors'
          >
            <span className='text-sm font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2'>
              <Code size={16} />
              JSON Preview
            </span>
            {showJson ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          {showJson && (
            <div className='p-4 bg-slate-900 dark:bg-slate-950'>
              <pre className='text-xs text-green-400 font-mono overflow-x-auto'>
                {JSON.stringify(cleanEmptyValues(data), null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </WizardStep>
  );
}
