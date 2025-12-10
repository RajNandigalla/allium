import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import axios from 'axios';
import crypto from 'crypto';

interface WebhookPayload {
  event: string;
  timestamp: string;
  data: any;
}

export class WebhookService {
  constructor(private fastify: FastifyInstance) {}

  /**
   * Trigger a webhook event
   * @param event e.g. "user.create"
   * @param payload data associated with the event
   */
  async trigger(event: string, payload: any) {
    const prisma = (this.fastify as any).prisma;
    if (!prisma || !prisma.webhook) return;

    try {
      // Find all active webhooks that subscribe to this event
      // We'll fetch all and filter in memory because 'events' is a JSON array
      // Ideally we'd use database filtering if supported (e.g. Postgres @>)
      const webhooks = await prisma.webhook.findMany({
        where: { active: true },
      });

      const matchingWebhooks = webhooks.filter((wh: any) => {
        const events = Array.isArray(wh.events)
          ? wh.events
          : JSON.parse(wh.events || '[]');
        return events.includes(event) || events.includes('*');
      });

      if (matchingWebhooks.length === 0) return;

      this.fastify.log.info(
        `Triggering event '${event}' to ${matchingWebhooks.length} webhooks`
      );

      // Fire and forget (or queue)
      matchingWebhooks.forEach((wh: any) => {
        this.send(wh, event, payload).catch((err) =>
          this.fastify.log.error({ err }, `Failed to send webhook to ${wh.url}`)
        );
      });
    } catch (error) {
      this.fastify.log.error({ error }, 'Failed to process webhooks');
    }
  }

  private async send(webhook: any, event: string, data: any) {
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
  },
  {
    name: 'allium-webhooks',
    dependencies: ['prisma'],
  }
);

declare module 'fastify' {
  interface FastifyInstance {
    webhooks: WebhookService;
  }
}
