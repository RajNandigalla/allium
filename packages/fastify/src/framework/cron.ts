import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import cron, { ScheduledTask } from 'node-cron';
import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';

interface CronJobConfig {
  name: string;
  schedule: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  active: boolean;
}

export class CronService {
  private jobs: Map<string, ScheduledTask> = new Map();

  constructor(private fastify: FastifyInstance) {}

  /**
   * Start the cron service: load jobs from JSON files and schedule them
   */
  async start() {
    await this.reload();
  }

  /**
   * Stop all running jobs
   */
  stop() {
    this.jobs.forEach((job) => job.stop());
    this.jobs.clear();
  }

  /**
   * Reload jobs from JSON files in .allium/cronjobs/
   */
  async reload() {
    this.stop();

    const cronjobsDir = path.join(process.cwd(), '.allium', 'cronjobs');

    if (!(await fs.pathExists(cronjobsDir))) {
      this.fastify.log.info(
        'No cronjobs directory found, skipping cron job loading'
      );
      return;
    }

    try {
      const files = await fs.readdir(cronjobsDir);
      const jsonFiles = files.filter((f) => f.endsWith('.json'));

      const cronJobs: CronJobConfig[] = await Promise.all(
        jsonFiles.map((file) => fs.readJson(path.join(cronjobsDir, file)))
      );

      const active = cronJobs.filter((job) => job.active);
      this.fastify.log.info(
        `Scheduling ${active.length} cron jobs from .allium/cronjobs`
      );

      active.forEach((job) => {
        if (!cron.validate(job.schedule)) {
          this.fastify.log.warn(
            `Invalid cron schedule '${job.schedule}' for job '${job.name}'`
          );
          return;
        }

        const task = cron.schedule(job.schedule, async () => {
          this.fastify.log.info(`Executing cron job: ${job.name}`);
          try {
            const url = job.endpoint.startsWith('http')
              ? job.endpoint
              : `http://localhost:${process.env.PORT || 3000}${
                  job.endpoint.startsWith('/') ? '' : '/'
                }${job.endpoint}`;

            await axios({
              method: job.method || 'POST',
              url,
              headers: {
                'User-Agent': 'Allium-Cron/1.0',
                'X-Allium-Job': job.name,
              },
              timeout: 10000,
            });
          } catch (error) {
            this.fastify.log.error(
              { error, jobName: job.name },
              'Cron job execution failed'
            );
          }
        });

        this.jobs.set(job.name, task);
      });
    } catch (error) {
      this.fastify.log.error({ error }, 'Failed to load cron jobs from files');
    }
  }
}

export default fp(
  async (fastify: FastifyInstance) => {
    const service = new CronService(fastify);
    fastify.decorate('cron', service);

    fastify.addHook('onReady', async () => {
      await service.start();
    });

    fastify.addHook('onClose', async () => {
      service.stop();
    });
  },
  {
    name: 'allium-cron',
  }
);

declare module 'fastify' {
  interface FastifyInstance {
    cron: CronService;
  }
}
