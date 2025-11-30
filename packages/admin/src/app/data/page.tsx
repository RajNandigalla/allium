import { Card } from '../../components/ui/Card';

export default function DataExplorerPage() {
  return (
    <div className='p-8'>
      <div className='mb-8'>
        <h1 className='text-4xl font-bold mb-2'>Data Explorer</h1>
        <p className='text-gray-400'>View and manage your data</p>
      </div>

      <Card>
        <div className='text-center py-12'>
          <p className='text-gray-400'>Select a model to explore data</p>
        </div>
      </Card>
    </div>
  );
}
