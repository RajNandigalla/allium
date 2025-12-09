'use client';

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { adminApi, AnalyticsOverview, AnalyticsChartData } from '../../lib/api';
import { Card } from '../../components/ui/Card';
import {
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  AlertTriangle,
  Clock,
  Globe,
} from 'lucide-react';
import { Input } from '../../components/ui/Input';

export default function DashboardPage() {
  const [range, setRange] = useState<'24h' | '7d' | '30d' | 'custom'>('24h');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [chartData, setChartData] = useState<AnalyticsChartData[]>([]);
  const [topEndpoints, setTopEndpoints] = useState<any[]>([]);
  const [recentErrors, setRecentErrors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [range, fromDate, toDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const from = range === 'custom' ? fromDate : undefined;
      const to = range === 'custom' ? toDate : undefined;
      // Pass '24h' as fallback for custom, backend handles specific dates if present
      const apiRange = range === 'custom' ? '24h' : range;

      const [overviewData, chart, usage, errors] = await Promise.all([
        adminApi.getAnalyticsOverview(apiRange, from, to),
        adminApi.getAnalyticsChart(apiRange, from, to),
        adminApi.getAnalyticsUsage(apiRange, from, to),
        adminApi.getAnalyticsErrors(apiRange, from, to),
      ]);

      setOverview(overviewData);
      setChartData(chart);
      setTopEndpoints(usage);
      setRecentErrors(errors);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const PresetButton = ({
    value,
    label,
  }: {
    value: typeof range;
    label: string;
  }) => (
    <button
      onClick={() => setRange(value)}
      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
        range === value
          ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
          : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className='p-8 space-y-8 max-w-7xl mx-auto'>
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold text-slate-900 dark:text-white'>
            Analytics
          </h1>
          <p className='text-slate-500 dark:text-slate-400'>
            Monitor your API performance and usage.
          </p>
        </div>

        <div className='flex flex-wrap items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm'>
          <PresetButton value='24h' label='24h' />
          <PresetButton value='7d' label='7d' />
          <PresetButton value='30d' label='30d' />
          <div className='h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1' />
          <button
            onClick={() => setRange('custom')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              range === 'custom'
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            Custom
          </button>
        </div>
      </div>

      {range === 'custom' && (
        <div className='flex gap-4 items-center bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800'>
          <Input
            type='datetime-local'
            label='From'
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
          <Input
            type='datetime-local'
            label='To'
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
      )}

      {/* Summary Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <SummaryCard
          title='Total Requests'
          value={overview?.totalRequests.toLocaleString() || '0'}
          change={overview?.requestsTrend}
          icon={Globe}
          loading={loading}
        />
        <SummaryCard
          title='Avg Latency'
          value={`${overview?.avgLatency || 0}ms`}
          icon={Clock}
          loading={loading}
          trend='neutral'
        />
        <SummaryCard
          title='Error Rate'
          value={`${overview?.errorRate || 0}%`}
          icon={AlertTriangle}
          loading={loading}
          trend='inverse'
        />
        <SummaryCard
          title='Active Status'
          value='Healthy'
          icon={Activity}
          loading={loading}
          trend='neutral'
        />
      </div>

      {/* Main Chart */}
      <Card className='p-6 min-h-[400px]'>
        <div className='mb-6'>
          <h3 className='text-lg font-semibold text-slate-900 dark:text-white'>
            Traffic Overview
          </h3>
        </div>
        <div className='h-[300px] w-full'>
          <ResponsiveContainer width='100%' height='100%'>
            <LineChart data={chartData}>
              <CartesianGrid
                strokeDasharray='3 3'
                stroke='#334155'
                opacity={0.2}
              />
              <XAxis
                dataKey='date'
                stroke='#64748b'
                fontSize={12}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return range === '24h'
                    ? date.toLocaleTimeString([], { hour: '2-digit' })
                    : date.toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      });
                }}
              />
              <YAxis stroke='#64748b' fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  borderColor: '#334155',
                  color: '#f8fafc',
                }}
              />
              <Line
                type='monotone'
                dataKey='requests'
                stroke='#3b82f6'
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                name='Requests'
              />
              <Line
                type='monotone'
                dataKey='errors'
                stroke='#ef4444'
                strokeWidth={2}
                dot={false}
                name='Errors'
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        {/* Top Endpoints */}
        <Card className='p-6'>
          <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-4'>
            Top Endpoints
          </h3>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead>
                <tr className='text-left border-b border-slate-200 dark:border-slate-800'>
                  <th className='pb-3 text-sm font-medium text-slate-500 dark:text-slate-400'>
                    Endpoint
                  </th>
                  <th className='pb-3 text-sm font-medium text-slate-500 dark:text-slate-400'>
                    Requests
                  </th>
                  <th className='pb-3 text-sm font-medium text-slate-500 dark:text-slate-400'>
                    Latency
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-200 dark:divide-slate-800'>
                {topEndpoints.map((endpoint, i) => (
                  <tr key={i}>
                    <td className='py-3'>
                      <div className='flex items-center gap-2'>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400`}
                        >
                          {endpoint.method}
                        </span>
                        <span className='text-sm text-slate-700 dark:text-slate-300 font-mono'>
                          {endpoint.endpoint}
                        </span>
                      </div>
                    </td>
                    <td className='py-3 text-sm text-slate-600 dark:text-slate-400'>
                      {endpoint.requests.toLocaleString()}
                    </td>
                    <td className='py-3 text-sm text-slate-600 dark:text-slate-400'>
                      {endpoint.avgLatency}ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Recent Errors */}
        <Card className='p-6'>
          <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-4'>
            Recent Errors
          </h3>
          <div className='space-y-4'>
            {recentErrors.map((error) => (
              <div
                key={error.id}
                className='flex gap-3 items-start p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30'
              >
                <AlertTriangle className='w-5 h-5 text-red-500 shrink-0 mt-0.5' />
                <div className='min-w-0 flex-1'>
                  <div className='flex items-center justify-between gap-2 mb-1'>
                    <span className='text-sm font-medium text-red-900 dark:text-red-200 truncate'>
                      {error.method} {error.endpoint}
                    </span>
                    <span className='text-xs text-red-700 dark:text-red-400 shrink-0'>
                      {new Date(error.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className='text-sm text-red-700 dark:text-red-300 line-clamp-2'>
                    {error.errorMessage || 'Unknown Error'}
                  </p>
                  <div className='mt-2 flex items-center gap-2'>
                    <span className='px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'>
                      {error.statusCode}
                    </span>
                    <span className='text-xs text-red-600 dark:text-red-400'>
                      {error.errorType}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {recentErrors.length === 0 && (
              <div className='text-center py-8 text-slate-500 dark:text-slate-400'>
                No recent errors found.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  change,
  icon: Icon,
  loading,
  trend = 'positive',
}: any) {
  if (loading) {
    return (
      <Card className='p-6 animate-pulse'>
        <div className='h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded mb-4' />
        <div className='h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded' />
      </Card>
    );
  }

  const isPositive = change > 0;
  const isNeutral = change === undefined || change === 0;

  // Trend logic: normally + is good (green), - is bad (red)
  // Inverse (for errors): + is bad (red), - is good (green)
  let trendColor = 'text-slate-500';
  if (!isNeutral) {
    if (trend === 'inverse') {
      trendColor = isPositive ? 'text-red-500' : 'text-emerald-500';
    } else {
      trendColor = isPositive ? 'text-emerald-500' : 'text-red-500';
    }
  }

  return (
    <Card className='p-6 relative overflow-hidden'>
      <div className='flex items-start justify-between'>
        <div>
          <p className='text-sm font-medium text-slate-500 dark:text-slate-400 mb-1'>
            {title}
          </p>
          <h3 className='text-2xl font-bold text-slate-900 dark:text-white'>
            {value}
          </h3>
        </div>
        <div className='p-2 bg-slate-100 dark:bg-slate-800 rounded-lg'>
          <Icon className='w-5 h-5 text-slate-600 dark:text-slate-400' />
        </div>
      </div>
      {change !== undefined && (
        <div className='mt-4 flex items-center gap-1'>
          {isPositive ? (
            <ArrowUpRight className={`w-4 h-4 ${trendColor}`} />
          ) : (
            <ArrowDownRight className={`w-4 h-4 ${trendColor}`} />
          )}
          <span className={`text-sm font-medium ${trendColor}`}>
            {Math.abs(change)}%
          </span>
          <span className='text-sm text-slate-500 dark:text-slate-400'>
            vs last period
          </span>
        </div>
      )}
    </Card>
  );
}
