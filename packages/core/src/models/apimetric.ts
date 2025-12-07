import { ModelDefinition } from '../runtime/types';

/**
 * Built-in ApiMetric model for tracking API usage and performance
 * Used by the analytics dashboard
 */
export const ApiMetricModel: ModelDefinition = {
  name: 'ApiMetric',
  softDelete: false,
  auditTrail: false,
  fields: [
    {
      name: 'endpoint',
      type: 'String',
      required: true,
    },
    {
      name: 'method',
      type: 'String',
      required: true,
    },
    {
      name: 'statusCode',
      type: 'Int',
      required: true,
    },
    {
      name: 'latency',
      type: 'Int',
      required: true,
    },
    {
      name: 'timestamp',
      type: 'DateTime',
      required: true,
    },
    {
      name: 'errorType',
      type: 'String',
      required: false,
    },
    {
      name: 'errorMessage',
      type: 'String',
      required: false,
    },
  ],
  relations: [],
  constraints: {
    indexes: [['endpoint', 'timestamp'], ['timestamp']],
  },
};
