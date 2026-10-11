'use client';

import * as React from 'react';

import { avatarParams, type AvatarParams, type AvatarTone } from './avatar-params';
import { cn } from './utils';

const paramsCache = new Map<string, AvatarParams>();

// Reuses the derived parameters for a seed within the page session. Nothing is
// persisted: the map lives only in the tab's memory and is gone on reload.
export function getAvatarParams(seed: string): AvatarParams {
  const cached = paramsCache.get(seed);
  if (cached) {
    return cached;
  }
  const params = avatarParams(seed);
  paramsCache.set(seed, params);
  return params;
}

function tone({ hue, saturation, lightness }: AvatarTone): string {
  return `hsl(${hue} ${saturation}% ${lightness}%)`;
}

export function Avatar({
  seed,
  size = 40,
  label,
  className,
}: {
  seed: string;
  size?: number;
  label?: string;
  className?: string;
}) {
  const params = getAvatarParams(seed);
  const uid = React.useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const clipId = `avatar-${uid}-clip`;
  const gradientIds = params.spots.map((_, index) => `avatar-${uid}-gradient-${index}`);

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      data-testid="avatar"
      className={cn('shrink-0 rounded-full', className)}
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx="32" cy="32" r="32" />
        </clipPath>
        {params.spots.map((spot, index) => (
          <radialGradient key={gradientIds[index]} id={gradientIds[index]}>
            <stop offset="0%" stopColor={tone(spot)} stopOpacity="0.85" />
            <stop offset="100%" stopColor={tone(spot)} stopOpacity="0" />
          </radialGradient>
        ))}
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect width="64" height="64" fill={tone(params.base)} />
        {params.spots.map((spot, index) => (
          <circle
            key={gradientIds[index]}
            cx={spot.cx}
            cy={spot.cy}
            r={spot.radius}
            fill={`url(#${gradientIds[index]})`}
          />
        ))}
      </g>
    </svg>
  );
}
