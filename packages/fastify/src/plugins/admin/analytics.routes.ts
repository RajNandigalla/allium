import { FastifyInstance } from 'fastify';

interface AnalyticsQuery {
  range: '24h' | '7d' | '30d';
}

export async function registerAnalyticsRoutes(fastify: FastifyInstance) {
  // GET /_admin/analytics/overview
  fastify.get<{ Querystring: AnalyticsQuery }>(
    '/analytics/overview',
    {
      schema: {
        tags: ['Admin - Analytics'],
        description: 'Get analytics overview',
      },
    },
    async (req, reply) => {
      const prisma = (fastify as any).prisma;
      if (!prisma?.apiMetric) {
        return {
          totalRequests: 0,
          avgLatency: 0,
          errorRate: 0,
          requestsTrend: 0,
        };
      }

      const { range = '24h' } = req.query;
      let startDate = new Date();
      let previousStartDate = new Date();

      if (range === '24h') {
        startDate.setHours(startDate.getHours() - 24);
        previousStartDate.setHours(previousStartDate.getHours() - 48);
      } else if (range === '7d') {
        startDate.setDate(startDate.getDate() - 7);
        previousStartDate.setDate(previousStartDate.getDate() - 14);
      } else if (range === '30d') {
        startDate.setDate(startDate.getDate() - 30);
        previousStartDate.setDate(previousStartDate.getDate() - 60);
      }

      // Current period metrics
      const [totalRequests, avgLatencyAgg, errorCount] = await Promise.all([
        prisma.apiMetric.count({
          where: { timestamp: { gte: startDate } },
        }),
        prisma.apiMetric.aggregate({
          where: { timestamp: { gte: startDate } },
          _avg: { latency: true },
        }),
        prisma.apiMetric.count({
          where: {
            timestamp: { gte: startDate },
            statusCode: { gte: 400 },
          },
        }),
      ]);

      // Previous period metrics for trend
      const previousRequests = await prisma.apiMetric.count({
        where: {
          timestamp: { gte: previousStartDate, lt: startDate },
        },
      });

      const avgLatency = Math.round(avgLatencyAgg._avg.latency || 0);
      const errorRate =
        totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;
      const requestsTrend =
        previousRequests > 0
          ? ((totalRequests - previousRequests) / previousRequests) * 100
          : 0;

      return {
        totalRequests,
        avgLatency,
        errorRate: Number(errorRate.toFixed(2)),
        requestsTrend: Number(requestsTrend.toFixed(2)),
      };
    }
  );

  // GET /_admin/analytics/usage
  fastify.get<{ Querystring: AnalyticsQuery }>(
    '/analytics/usage',
    async (req, reply) => {
      const prisma = (fastify as any).prisma;
      if (!prisma?.apiMetric) return [];

      const { range = '24h' } = req.query;
      const startDate = new Date();

      if (range === '24h') startDate.setHours(startDate.getHours() - 24);
      else if (range === '7d') startDate.setDate(startDate.getDate() - 7);
      else if (range === '30d') startDate.setDate(startDate.getDate() - 30);

      // Group by endpoint
      const usage = await prisma.apiMetric.groupBy({
        by: ['endpoint', 'method'],
        where: { timestamp: { gte: startDate } },
        _count: { endpoint: true },
        _avg: { latency: true },
        orderBy: { _count: { endpoint: 'desc' } },
        take: 20,
      });

      return usage.map((item: any) => ({
        endpoint: item.endpoint,
        method: item.method,
        requests: item._count.endpoint,
        avgLatency: Math.round(item._avg.latency || 0),
      }));
    }
  );

  // GET /_admin/analytics/errors
  fastify.get<{ Querystring: AnalyticsQuery }>(
    '/analytics/errors',
    async (req, reply) => {
      const prisma = (fastify as any).prisma;
      if (!prisma?.apiMetric) return [];

      const { range = '24h' } = req.query;
      const startDate = new Date();

      if (range === '24h') startDate.setHours(startDate.getHours() - 24);
      else if (range === '7d') startDate.setDate(startDate.getDate() - 7);
      else if (range === '30d') startDate.setDate(startDate.getDate() - 30);

      const errors = await prisma.apiMetric.findMany({
        where: {
          timestamp: { gte: startDate },
          statusCode: { gte: 400 },
        },
        orderBy: { timestamp: 'desc' },
        take: 50,
        select: {
          id: true,
          endpoint: true,
          method: true,
          statusCode: true,
          timestamp: true,
          errorMessage: true,
          errorType: true,
        },
      });

      return errors;
    }
  );

  // GET /_admin/analytics/chart
  fastify.get<{ Querystring: AnalyticsQuery }>(
    '/analytics/chart',
    async (req, reply) => {
      const prisma = (fastify as any).prisma;
      if (!prisma?.apiMetric) return [];

      const { range = '24h' } = req.query;
      const startDate = new Date();

      // Determine interval and format based on range
      // Since Prisma groupBy doesn't natively support Date truncation cross-db without raw queries
      // We will fetch all data and aggregate in memory for now (simpler than raw SQL for multiple DBs)
      // Optimization: For production, raw SQL date_trunc is better.

      if (range === '24h') startDate.setHours(startDate.getHours() - 24);
      else if (range === '7d') startDate.setDate(startDate.getDate() - 7);
      else if (range === '30d') startDate.setDate(startDate.getDate() - 30);

      // Fetch minimal data needed for chart
      const metrics = await prisma.apiMetric.findMany({
        where: { timestamp: { gte: startDate } },
        select: { timestamp: true, latency: true, statusCode: true },
        orderBy: { timestamp: 'asc' },
      });

      // Aggregation Logic
      const buckets: Record<
        string,
        { requests: number; errors: number; latency: number; count: number }
      > = {};

      metrics.forEach((m: any) => {
        let key: string;
        const date = new Date(m.timestamp);

        if (range === '24h') {
          // Group by hour: "14:00"
          date.setMinutes(0, 0, 0);
          key = date.toISOString();
        } else {
          // Group by day: "2023-10-25"
          date.setHours(0, 0, 0, 0);
          key = date.toISOString();
        }

        if (!buckets[key]) {
          buckets[key] = { requests: 0, errors: 0, latency: 0, count: 0 };
        }

        buckets[key].requests++;
        if (m.statusCode >= 400) buckets[key].errors++;
        buckets[key].latency += m.latency;
        buckets[key].count++;
      });

      return Object.entries(buckets)
        .map(([date, data]) => ({
          date,
          requests: data.requests,
          errors: data.errors,
          avgLatency: Math.round(data.latency / data.count),
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    }
  );
}
