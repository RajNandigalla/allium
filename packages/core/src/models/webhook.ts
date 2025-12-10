import { ModelDefinition } from '../runtime/types';

/**
 * Webhook model for outgoing event notifications
 */
export const WebhookModel: ModelDefinition = {
  name: 'Webhook',
  softDelete: false,
  auditTrail: true,
  api: {
    prefix: '/_admin/webhook',
  },
  fields: [
    {
      name: 'name',
      type: 'String',
      required: true,
    },
    {
      name: 'url',
      type: 'String',
      required: true,
    },
    {
      name: 'events',
      type: 'Json', // Array of strings e.g. ["user.create", "post.update"]
      required: true,
    },
    {
      name: 'active',
      type: 'Boolean',
      required: true,
      default: true,
    },
    {
      name: 'secret',
      type: 'String',
      required: false, // For signature verification
    },
  ],
  relations: [],
};
