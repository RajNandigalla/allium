import { ModelDefinition } from '../runtime/types';

/**
 * CronJob model for scheduled tasks
 */
export const CronJobModel: ModelDefinition = {
  name: 'CronJob',
  softDelete: false,
  auditTrail: true,
  api: {
    prefix: '/_admin/cronjob',
  },
  fields: [
    {
      name: 'name',
      type: 'String',
      required: true,
      unique: true,
    },
    {
      name: 'schedule',
      type: 'String', // Cron expression e.g. "0 * * * *"
      required: true,
    },
    {
      name: 'endpoint',
      type: 'String', // API endpoint to hit
      required: true,
    },
    {
      name: 'method',
      type: 'String',
      required: true,
      default: 'POST',
    },
    {
      name: 'active',
      type: 'Boolean',
      required: true,
      default: true,
    },
  ],
  relations: [],
};
