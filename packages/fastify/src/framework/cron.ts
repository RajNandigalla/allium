import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import cron, { ScheduledTask } from 'node-cron';
import axios from 'axios';

export class CronService {
  private jobs: Map<string, ScheduledTask> = new Map();

  constructor(private fastify: FastifyInstance) {}

  /**
   * Start the cron service: load jobs from DB and schedule them
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
   * Reload jobs from database
   */
  async reload() {
    this.stop();

    const prisma = (this.fastify as any).prisma;
    if (!prisma || !prisma.cronJob) return;

    try {
      const cronJobs = await prisma.cronJob.findMany({
        where: { active: true },
      });

      this.fastify.log.info(`Scheduling ${cronJobs.length} cron jobs`);

      cronJobs.forEach((job: any) => {
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

        this.jobs.set(job.id, task);
      });
    } catch (error) {
      this.fastify.log.error({ error }, 'Failed to load cron jobs');
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
    dependencies: ['prisma'],
  }
);

declare module 'fastify' {
  interface FastifyInstance {
    cron: CronService;
  }
}
