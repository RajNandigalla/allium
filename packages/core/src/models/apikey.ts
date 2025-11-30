import { ModelDefinition } from '../runtime/types';
import crypto from 'crypto';

/**
 * Built-in ApiKey model for service-to-service authentication
 * This model is automatically available when API key authentication is enabled
 */
export const ApiKeyModel: ModelDefinition = {
  name: 'ApiKey',
  softDelete: false,
  auditTrail: true,
  fields: [
    {
      name: 'name',
      type: 'String',
      required: true,
    },
    {
      name: 'key',
      type: 'String',
      required: false,
      unique: true,
      writePrivate: true, // Prevent users from setting this - it's auto-generated
    },
    {
      name: 'service',
      type: 'String',
      required: true,
    },
    {
      name: 'isActive',
      type: 'Boolean',
      default: true,
    },
    {
      name: 'expiresAt',
      type: 'DateTime',
      required: false,
    },
    {
      name: 'lastUsedAt',
      type: 'DateTime',
      required: false,
    },
  ],
  relations: [],
  hooks: {
    beforeCreate: async (data, context) => {
      // Generate a secure API key if not provided
      if (!data.key) {
        data.key = `sk_${crypto.randomBytes(32).toString('hex')}`;
      }
      return data;
    },
    afterCreate: async (record, context) => {
      context.logger.info(`API Key created for service: ${record.service}`);
    },
  },
};

/**
 * Generate a new API key
 */
export function generateApiKey(prefix: string = 'sk_'): string {
  return `${prefix}${crypto.randomBytes(32).toString('hex')}`;
}
