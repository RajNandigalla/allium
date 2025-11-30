import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Plus, Search } from 'lucide-react';

export default function ModelsPage() {
  return (
    <div className='p-8'>
      <div className='flex items-center justify-between mb-8'>
        <div>
          <h1 className='text-4xl font-bold mb-2'>Models</h1>
          <p className='text-gray-400'>Manage your data models</p>
        </div>
        <Button variant='primary' size='md'>
          <Plus size={20} />
          Create Model
        </Button>
      </div>

      <Card>
        <div className='text-center py-12'>
          <p className='text-gray-400 mb-4'>
            No models yet. Create your first model to get started!
          </p>
          <Button variant='primary' size='md'>
            <Plus size={20} />
            Create Your First Model
          </Button>
        </div>
      </Card>
    </div>
  );
}
