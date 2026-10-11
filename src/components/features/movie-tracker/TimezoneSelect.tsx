'use client';

import { useId } from 'react';

import { useTimeFormat } from '@/components/layout/preferences';

const FALLBACK_ZONES = [
  'UTC',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Moscow',
  'Asia/Tokyo',
  'America/New_York',
  'America/Los_Angeles',
];

function availableTimeZones(): string[] {
  try {
    const supported = Intl.supportedValuesOf('timeZone');
    return supported.length > 0 ? supported : FALLBACK_ZONES;
  } catch {
    return FALLBACK_ZONES;
  }
}

export function TimezoneSelect() {
  const id = useId();
  const { timeZone, setTimeZone } = useTimeFormat();

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm font-medium">
        Тайм-зона
      </label>
      <select
        id={id}
        value={timeZone}
        onChange={(event) => setTimeZone(event.target.value)}
        className="h-11 max-w-full rounded-md border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <option value="">Как в браузере</option>
        {availableTimeZones().map((zone) => (
          <option key={zone} value={zone}>
            {zone}
          </option>
        ))}
      </select>
    </div>
  );
}
