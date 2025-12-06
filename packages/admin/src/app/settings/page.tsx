'use client';

import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Server, Package, Cpu, HardDrive, Clock } from 'lucide-react';
import { adminApi } from '../../lib/api';

interface SystemInfo {
  os: {
    platform: string;
    release: string;
    type: string;
    arch: string;
    cpus: number;
    totalMem: number;
    freeMem: number;
  };
  node: {
    version: string;
    env: string;
    uptime: number;
    memoryUsage: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
    };
  };
}

interface ProjectConfig {
  name: string;
  version: string;
  root: string;
}

export default function SettingsPage() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [config, setConfig] = useState<ProjectConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sysInfo, projConfig] = await Promise.all([
          adminApi.getSystemInfo(),
          adminApi.getConfig(),
        ]);
        setSystemInfo(sysInfo);
        setConfig(projConfig);
      } catch (error) {
        console.error('Failed to fetch settings data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatBytes = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(2)} GB`;
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className='p-8'>
        <div className='flex justify-center items-center h-64'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600'></div>
          <span className='ml-3 text-slate-500'>Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className='p-8'>
      <div className='mb-8'>
        <h1 className='text-4xl font-bold mb-2'>Settings</h1>
        <p className='text-slate-600 dark:text-slate-400'>
          System information and project configuration
        </p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Project Information */}
        <Card>
          <div className='flex items-center gap-3 mb-6'>
            <div className='p-3 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg'>
              <Package className='w-6 h-6 text-indigo-600 dark:text-indigo-400' />
            </div>
            <h3 className='text-xl font-semibold'>Project Information</h3>
          </div>
          <div className='space-y-3'>
            <div className='flex justify-between items-center p-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg'>
              <span className='text-slate-600 dark:text-slate-400'>Name</span>
              <span className='font-medium'>{config?.name || 'N/A'}</span>
            </div>
            <div className='flex justify-between items-center p-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg'>
              <span className='text-slate-600 dark:text-slate-400'>
                Version
              </span>
              <span className='font-medium'>{config?.version || 'N/A'}</span>
            </div>
            <div className='flex justify-between items-center p-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg'>
              <span className='text-slate-600 dark:text-slate-400'>
                Root Path
              </span>
              <span className='font-medium text-xs truncate max-w-xs'>
                {config?.root || 'N/A'}
              </span>
            </div>
          </div>
        </Card>

        {/* Node.js Information */}
        <Card>
          <div className='flex items-center gap-3 mb-6'>
            <div className='p-3 bg-green-100 dark:bg-green-900/20 rounded-lg'>
              <Server className='w-6 h-6 text-green-600 dark:text-green-400' />
            </div>
            <h3 className='text-xl font-semibold'>Node.js</h3>
          </div>
          <div className='space-y-3'>
            <div className='flex justify-between items-center p-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg'>
              <span className='text-slate-600 dark:text-slate-400'>
                Version
              </span>
              <span className='font-medium'>{systemInfo?.node.version}</span>
            </div>
            <div className='flex justify-between items-center p-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg'>
              <span className='text-slate-600 dark:text-slate-400'>
                Environment
              </span>
              <span className='font-medium capitalize'>
                {systemInfo?.node.env}
              </span>
            </div>
            <div className='flex justify-between items-center p-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg'>
              <span className='text-slate-600 dark:text-slate-400'>Uptime</span>
              <span className='font-medium'>
                {systemInfo?.node.uptime
                  ? formatUptime(systemInfo.node.uptime)
                  : 'N/A'}
              </span>
            </div>
          </div>
        </Card>

        {/* Operating System */}
        <Card>
          <div className='flex items-center gap-3 mb-6'>
            <div className='p-3 bg-cyan-100 dark:bg-cyan-900/20 rounded-lg'>
              <Cpu className='w-6 h-6 text-cyan-600 dark:text-cyan-400' />
            </div>
            <h3 className='text-xl font-semibold'>Operating System</h3>
          </div>
          <div className='space-y-3'>
            <div className='flex justify-between items-center p-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg'>
              <span className='text-slate-600 dark:text-slate-400'>
                Platform
              </span>
              <span className='font-medium capitalize'>
                {systemInfo?.os.platform}
              </span>
            </div>
            <div className='flex justify-between items-center p-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg'>
              <span className='text-slate-600 dark:text-slate-400'>Type</span>
              <span className='font-medium'>{systemInfo?.os.type}</span>
            </div>
            <div className='flex justify-between items-center p-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg'>
              <span className='text-slate-600 dark:text-slate-400'>
                Architecture
              </span>
              <span className='font-medium'>{systemInfo?.os.arch}</span>
            </div>
            <div className='flex justify-between items-center p-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg'>
              <span className='text-slate-600 dark:text-slate-400'>CPUs</span>
              <span className='font-medium'>{systemInfo?.os.cpus} cores</span>
            </div>
          </div>
        </Card>

        {/* Memory Information */}
        <Card>
          <div className='flex items-center gap-3 mb-6'>
            <div className='p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg'>
              <HardDrive className='w-6 h-6 text-purple-600 dark:text-purple-400' />
            </div>
            <h3 className='text-xl font-semibold'>Memory</h3>
          </div>
          <div className='space-y-3'>
            <div className='flex justify-between items-center p-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg'>
              <span className='text-slate-600 dark:text-slate-400'>
                Total RAM
              </span>
              <span className='font-medium'>
                {systemInfo?.os.totalMem
                  ? formatBytes(systemInfo.os.totalMem)
                  : 'N/A'}
              </span>
            </div>
            <div className='flex justify-between items-center p-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg'>
              <span className='text-slate-600 dark:text-slate-400'>
                Free RAM
              </span>
              <span className='font-medium'>
                {systemInfo?.os.freeMem
                  ? formatBytes(systemInfo.os.freeMem)
                  : 'N/A'}
              </span>
            </div>
            <div className='flex justify-between items-center p-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg'>
              <span className='text-slate-600 dark:text-slate-400'>
                Heap Used
              </span>
              <span className='font-medium'>
                {systemInfo?.node.memoryUsage.heapUsed
                  ? formatBytes(systemInfo.node.memoryUsage.heapUsed)
                  : 'N/A'}
              </span>
            </div>
            <div className='flex justify-between items-center p-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg'>
              <span className='text-slate-600 dark:text-slate-400'>
                Heap Total
              </span>
              <span className='font-medium'>
                {systemInfo?.node.memoryUsage.heapTotal
                  ? formatBytes(systemInfo.node.memoryUsage.heapTotal)
                  : 'N/A'}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
