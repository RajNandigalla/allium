import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Plus } from 'lucide-react';

export default function ApiKeysPage() {
  return (
    <div>
      <div className='flex items-center justify-between mb-8'>
        <div>
          <h1 className='text-4xl font-bold mb-2 text-slate-900 dark:text-white'>
            API Keys
          </h1>
          <p className='text-slate-600 dark:text-slate-400'>
            Manage your API keys
          </p>
        </div>
        <Button variant='primary' size='md'>
          <Plus size={20} />
          Generate Key
        </Button>
      </div>

      <Card>
        <div className='text-center py-12'>
          <p className='text-slate-600 dark:text-slate-400'>No API keys yet</p>
        </div>
      </Card>
    </div>
  );
}
