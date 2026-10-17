import { FeedProvider } from '@/components/features/movie-tracker/feed-stream';
import { ToastProvider } from '@/components/ui/toast';

import { AppShell } from '@/components/layout/app-shell';

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ToastProvider>
      <FeedProvider>
        <AppShell>{children}</AppShell>
      </FeedProvider>
    </ToastProvider>
  );
}
