'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { z } from 'zod';
import { Wizard, WizardStepConfig } from '../ui/Wizard';
import { BasicInfoStep } from './BasicInfoStep';
import { FieldsStep } from './FieldsStep';
import { RelationsStep } from './RelationsStep';
import { ConfigurationStep } from './ConfigurationStep';
import { ReviewStep } from './ReviewStep';

// Validation schemas
const fieldSchema = z.object({
  name: z
    .string()
    .min(1, 'Field name is required')
    .regex(/^[a-z][a-zA-Z0-9]*$/, 'Must be camelCase'),
  type: z.string(),
  required: z.boolean().default(false),
  unique: z.boolean().default(false),
  default: z.string().optional(),
  private: z.boolean().optional(),
  writePrivate: z.boolean().optional(),
  encrypted: z.boolean().optional(),
  minLength: z.coerce.number().optional(),
  maxLength: z.coerce.number().optional(),
  min: z.coerce.number().optional(),
  max: z.coerce.number().optional(),
  pattern: z.string().optional(),
  values: z.string().optional(),
  computedTemplate: z.string().optional(),
});

const relationSchema = z.object({
  name: z.string().min(1, 'Relation name is required'),
  type: z.enum(['1:1', '1:n', 'n:m', 'polymorphic']),
  model: z.string().optional(),
  foreignKey: z.string().optional(),
  references: z.string().optional(),
  onDelete: z.enum(['Cascade', 'SetNull', 'NoAction', 'Restrict']).optional(),
  required: z.boolean().default(false),
});

const modelWizardSchema = z.object({
  // Step 1: Basic Info
  name: z
    .string()
    .min(1, 'Model name is required')
    .regex(/^[A-Z][a-zA-Z0-9]*$/, 'Must be PascalCase'),
  description: z.string().optional(),
  softDelete: z.boolean().default(false),
  auditTrail: z.boolean().default(false),

  // Step 2: Fields
  fields: z.array(fieldSchema).min(1, 'At least one field is required'),

  // Step 3: Relations (optional)
  relations: z.array(relationSchema).optional(),

  // Step 4: Configuration (optional)
  apiPrefix: z.string().optional(),
  apiVersion: z.string().optional(),
  operations: z.array(z.string()).optional(),
  rateLimitMax: z.coerce.number().optional(),
  rateLimitTimeWindow: z.string().optional(),
  beforeCreate: z.string().optional(),
  afterCreate: z.string().optional(),
  beforeUpdate: z.string().optional(),
  afterUpdate: z.string().optional(),
  beforeDelete: z.string().optional(),
  afterDelete: z.string().optional(),
  customMethods: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().optional(),
      })
    )
    .optional(),
  compoundUniqueInput: z.string().optional(),
  compoundIndexesInput: z.string().optional(),
});

type ModelWizardFormData = z.infer<typeof modelWizardSchema>;

interface ModelWizardProps {
  initialData?: any;
  mode?: 'create' | 'edit';
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
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
    // Return cleaned object if it has keys, otherwise return original to preserve structure
    return Object.keys(cleaned).length > 0 ? cleaned : obj;
  }

  return obj;
}

const WIZARD_STEPS: WizardStepConfig[] = [
  { id: 'basic', title: 'Basic Info', description: 'Name and model options' },
  { id: 'fields', title: 'Fields', description: 'Define model fields' },
  {
    id: 'relations',
    title: 'Relations',
    description: 'Define relationships',
    optional: true,
  },
  {
    id: 'config',
    title: 'Configuration',
    description: 'API and service settings',
    optional: true,
  },
  { id: 'review', title: 'Review', description: 'Review and create' },
];

export function ModelWizard({
  initialData,
  mode = 'create',
  onSubmit,
  onCancel,
}: ModelWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Transform initialData to form format if editing
  const defaultValues: Partial<ModelWizardFormData> = initialData
    ? {
        name: initialData.name,
        description: initialData.description,
        softDelete: initialData.softDelete || false,
        auditTrail: initialData.auditTrail || false,
        fields: initialData.fields?.map((f: any) => ({
          ...f,
          type: f.type || 'String',
          required: f.required || false,
          unique: f.unique || false,
          // Flatten validation object
          ...(f.validation || {}),
          // Handle enum values
          values: f.validation?.enum?.join(', '),
          // Handle computed
          computedTemplate: f.computed?.template,
        })) || [{ name: '', type: 'String', required: false, unique: false }],
        relations: initialData.relations || [],
        // API Config
        apiPrefix: initialData.api?.prefix,
        apiVersion: initialData.api?.version,
        operations: initialData.api?.operations || [
          'create',
          'read',
          'update',
          'delete',
          'list',
        ],
        rateLimitMax: initialData.api?.rateLimit?.max,
        rateLimitTimeWindow: initialData.api?.rateLimit?.timeWindow,
        // Service Hooks
        beforeCreate: initialData.service?.hooks?.beforeCreate,
        afterCreate: initialData.service?.hooks?.afterCreate,
        beforeUpdate: initialData.service?.hooks?.beforeUpdate,
        afterUpdate: initialData.service?.hooks?.afterUpdate,
        beforeDelete: initialData.service?.hooks?.beforeDelete,
        afterDelete: initialData.service?.hooks?.afterDelete,
        customMethods: initialData.service?.customMethods,
        // Constraints
        compoundUniqueInput: initialData.constraints?.unique?.[0]?.join(', '),
        compoundIndexesInput: initialData.constraints?.indexes?.[0]?.join(', '),
      }
    : {
        softDelete: false,
        auditTrail: false,
        fields: [{ name: '', type: 'String', required: false, unique: false }],
        relations: [],
        operations: ['create', 'read', 'update', 'delete', 'list'],
      };

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    trigger,
    getValues,
    setValue,
  } = useForm<ModelWizardFormData>({
    resolver: standardSchemaResolver(modelWizardSchema) as any,
    defaultValues,
    mode: 'onChange',
  });

  const handleNext = async () => {
    let fieldsToValidate: (keyof ModelWizardFormData)[] = [];

    switch (currentStep) {
      case 0:
        fieldsToValidate = ['name', 'description', 'softDelete', 'auditTrail'];
        break;
      case 1:
        fieldsToValidate = ['fields'];
        break;
      case 2:
        fieldsToValidate = ['relations'];
        break;
      case 3:
        // Configuration step - all optional
        break;
    }

    if (fieldsToValidate.length > 0) {
      const isValid = await trigger(fieldsToValidate);
      if (!isValid) return;
    }

    setCurrentStep((prev) => Math.min(prev + 1, WIZARD_STEPS.length - 1));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSkip = () => {
    setCurrentStep((prev) => Math.min(prev + 1, WIZARD_STEPS.length - 1));
  };

  const handleEdit = (step: number) => {
    setCurrentStep(step);
  };

  const handleFinalSubmit = async () => {
    const isValid = await trigger();
    if (!isValid) {
      console.error('Validation errors:', errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = getValues();

      // Transform form data to API format
      const modelData = {
        name: formData.name,
        description: formData.description,
        fields: formData.fields.map((field) => ({
          name: field.name,
          type: field.type,
          required: field.required,
          unique: field.unique,
          default: field.default,
          private: field.private,
          writePrivate: field.writePrivate,
          encrypted: field.encrypted,
          validation: {
            ...(field.minLength && { minLength: field.minLength }),
            ...(field.maxLength && { maxLength: field.maxLength }),
            ...(field.min && { min: field.min }),
            ...(field.max && { max: field.max }),
            ...(field.pattern && { pattern: field.pattern }),
            ...(field.values && {
              enum: field.values.split(',').map((v) => v.trim()),
            }),
          },
          ...(field.computedTemplate && {
            computed: { template: field.computedTemplate },
            virtual: true,
          }),
        })),
        relations: formData.relations
          ?.filter((r) => r.name && r.model)
          .map((r) => ({
            name: r.name,
            type: r.type,
            model: r.model,
            ...(r.foreignKey && { foreignKey: r.foreignKey }),
            ...(r.references && { references: r.references }),
            ...(r.onDelete && { onDelete: r.onDelete }),
            required: r.required,
          })),
        softDelete: formData.softDelete,
        auditTrail: formData.auditTrail,
        ...(formData.apiPrefix ||
        formData.apiVersion ||
        formData.operations?.length
          ? {
              api: {
                ...(formData.apiPrefix && { prefix: formData.apiPrefix }),
                ...(formData.apiVersion && { version: formData.apiVersion }),
                ...(formData.operations && { operations: formData.operations }),
                ...(formData.rateLimitMax &&
                  formData.rateLimitTimeWindow && {
                    rateLimit: {
                      max: formData.rateLimitMax,
                      timeWindow: formData.rateLimitTimeWindow,
                    },
                  }),
              },
            }
          : {}),
        ...(formData.beforeCreate ||
        formData.afterCreate ||
        formData.beforeUpdate ||
        formData.afterUpdate ||
        formData.beforeDelete ||
        formData.afterDelete
          ? {
              service: {
                hooks: {
                  ...(formData.beforeCreate && {
                    beforeCreate: formData.beforeCreate,
                  }),
                  ...(formData.afterCreate && {
                    afterCreate: formData.afterCreate,
                  }),
                  ...(formData.beforeUpdate && {
                    beforeUpdate: formData.beforeUpdate,
                  }),
                  ...(formData.afterUpdate && {
                    afterUpdate: formData.afterUpdate,
                  }),
                  ...(formData.beforeDelete && {
                    beforeDelete: formData.beforeDelete,
                  }),
                  ...(formData.afterDelete && {
                    afterDelete: formData.afterDelete,
                  }),
                },
                ...(formData.customMethods &&
                  formData.customMethods.length > 0 && {
                    customMethods: formData.customMethods,
                  }),
              },
            }
          : {}),
        ...(formData.compoundUniqueInput || formData.compoundIndexesInput
          ? {
              constraints: {
                ...(formData.compoundUniqueInput && {
                  unique: [
                    formData.compoundUniqueInput
                      .split(',')
                      .map((f) => f.trim()),
                  ],
                }),
                ...(formData.compoundIndexesInput && {
                  indexes: [
                    formData.compoundIndexesInput
                      .split(',')
                      .map((f) => f.trim()),
                  ],
                }),
              },
            }
          : {}),
      };

      // Clean up empty values before sending
      const cleanedModelData = cleanEmptyValues(modelData);

      await onSubmit(cleanedModelData);
    } catch (error) {
      console.error('Failed to create model:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const canGoNext = () => {
    switch (currentStep) {
      case 0:
        return !errors.name;
      case 1:
        const fields = getValues('fields');
        return fields && fields.length > 0 && !errors.fields;
      case 2:
      case 3:
        return true; // Optional steps
      case 4:
        return true; // Review step
      default:
        return false;
    }
  };

  return (
    <Wizard
      steps={WIZARD_STEPS}
      currentStep={currentStep}
      onNext={handleNext}
      onBack={handleBack}
      onSkip={handleSkip}
      onSubmit={handleFinalSubmit}
      canGoNext={canGoNext()}
      canGoBack={currentStep > 0}
      isSubmitting={isSubmitting}
    >
      {currentStep === 0 && (
        <BasicInfoStep register={register} errors={errors} />
      )}
      {currentStep === 1 && (
        <FieldsStep register={register} control={control} errors={errors} />
      )}
      {currentStep === 2 && (
        <RelationsStep register={register} control={control} errors={errors} />
      )}
      {currentStep === 3 && (
        <ConfigurationStep
          register={register}
          control={control}
          errors={errors}
        />
      )}
      {currentStep === 4 && (
        <ReviewStep data={getValues()} onEdit={handleEdit} />
      )}
    </Wizard>
  );
}
