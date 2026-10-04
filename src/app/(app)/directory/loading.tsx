import { AsyncView } from '@/components/features/AsyncView';

export default function DirectoryLoading() {
  return <AsyncView state={{ status: 'loading' }}>{() => null}</AsyncView>;
}
