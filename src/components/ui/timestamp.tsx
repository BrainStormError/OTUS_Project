'use client';

import { useEffect, useState } from 'react';

import { formatTimestamp, useTimeFormat } from '@/components/layout/preferences';

export function Timestamp({ value, className }: { value: string; className?: string }) {
  const { hour12 } = useTimeFormat();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const sync = () => setMounted(true);
    sync();
  }, []);

  return (
    <time dateTime={value} className={className}>
      {mounted ? formatTimestamp(value, { hour12 }) : ''}
    </time>
  );
}
