import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import axios from 'axios';
import crypto from 'crypto';
import fs from 'fs-extra';
import path from 'path';

interface WebhookPayload {
  event: string;
  timestamp: string;
  data: any;
}

interface WebhookConfig {
  name: string;
  url: string;
  events: string[];
  active: boolean;
  secret?: string;
}

export class WebhookService {
  private webhooks: WebhookConfig[] = [];

  constructor(private fastify: FastifyInstance) {}

  /**
   * Load webhooks from JSON files in .allium/webhooks/
   */
  async loadWebhooksFromFiles() {
    const webhooksDir = path.join(process.cwd(), '.allium', 'webhooks');

    if (!(await fs.pathExists(webhooksDir))) {
      this.fastify.log.info(
        'No webhooks directory found, skipping webhook loading'
      );
      return;
    }

    try {
      const files = await fs.readdir(webhooksDir);
      const jsonFiles = files.filter((f) => f.endsWith('.json'));

      this.webhooks = await Promise.all(
        jsonFiles.map(async (file) => {
          const content = await fs.readJson(path.join(webhooksDir, file));
          return this.interpolateEnvVars(content);
        })
      );

      this.fastify.log.info(
        `Loaded ${this.webhooks.length} webhooks from .allium/webhooks`
      );
    } catch (error) {
      this.fastify.log.error({ error }, 'Failed to load webhooks from files');
    }
  }

  /**
   * Interpolate environment variables in webhook config
   * Replaces ${VAR_NAME} with process.env.VAR_NAME
   */
  private interpolateEnvVars(webhook: WebhookConfig): WebhookConfig {
    return {
      ...webhook,
      url: this.interpolateString(webhook.url),
      secret: webhook.secret
        ? this.interpolateString(webhook.secret)
        : undefined,
    };
  }

  private interpolateString(str: string): string {
    return str.replace(/\$\{([A-Z_]+)\}/g, (_, varName) => {
      return process.env[varName] || `\${${varName}}`;
    });
  }

  /**
   * Reload webhooks from files (called after admin changes)
   */
  async reload() {
    await this.loadWebhooksFromFiles();
  }

  /**
   * Trigger a webhook event
   * @param event e.g. "user.create"
   * @param payload data associated with the event
   */
  async trigger(event: string, payload: any) {
    try {
      const activeWebhooks = this.webhooks.filter((w) => w.active);
      const matchingWebhooks = activeWebhooks.filter(
        (w) => w.events.includes(event) || w.events.includes('*')
      );

      if (matchingWebhooks.length === 0) return;

      this.fastify.log.info(
        `Triggering event '${event}' to ${matchingWebhooks.length} webhooks`
      );

      // Fire and forget (or queue)
      matchingWebhooks.forEach((wh) => {
        this.send(wh, event, payload).catch((err) =>
          this.fastify.log.error({ err }, `Failed to send webhook to ${wh.url}`)
        );
      });
    } catch (error) {
      this.fastify.log.error({ error }, 'Failed to process webhooks');
    }
  }

  private async send(webhook: WebhookConfig, event: string, data: any) {
    const timestamp = new Date().toISOString();
    const payloadBody: WebhookPayload = {
      event,
      timestamp,
      data,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Allium-Webhook/1.0',
      'X-Allium-Event': event,
      'X-Allium-Delivery': crypto.randomUUID(),
    };

    if (webhook.secret) {
      const signature = crypto
        .createHmac('sha256', webhook.secret)
        .update(JSON.stringify(payloadBody))
        .digest('hex');
      headers['X-Allium-Signature'] = `sha256=${signature}`;
    }

    await axios.post(webhook.url, payloadBody, {
      headers,
      timeout: 5000,
    });
  }
}

export default fp(
  async (fastify: FastifyInstance) => {
    const service = new WebhookService(fastify);
    fastify.decorate('webhooks', service);

    // Load webhooks on startup
    fastify.addHook('onReady', async () => {
      await service.loadWebhooksFromFiles();
    });
  },
  {
    name: 'allium-webhooks',
  }
);

declare module 'fastify' {
  interface FastifyInstance {
    webhooks: WebhookService;
  }
}
