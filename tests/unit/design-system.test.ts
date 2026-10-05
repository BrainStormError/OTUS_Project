import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const css = readFileSync('src/app/globals.css', 'utf8');

function themeBlock(selector: string): string {
  const match = new RegExp(`${selector}\\s*\\{([\\s\\S]*?)\\}`).exec(css);
  if (!match?.[1]) {
    throw new Error(`theme block not found: ${selector}`);
  }
  return match[1];
}

function tokens(block: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const match of block.matchAll(/(--[a-z-]+)\s*:\s*(#[0-9a-fA-F]{6})/g)) {
    if (match[1] && match[2]) {
      result[match[1]] = match[2];
    }
  }
  return result;
}

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const r = channel(parseInt(hex.slice(1, 3), 16));
  const g = channel(parseInt(hex.slice(3, 5), 16));
  const b = channel(parseInt(hex.slice(5, 7), 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [light, dark] = la > lb ? [la, lb] : [lb, la];
  return (light + 0.05) / (dark + 0.05);
}

const light = tokens(themeBlock(":root"));
const dark = tokens(themeBlock("\\[data-theme='dark'\\]"));

function collectTsx(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      collectTsx(full, acc);
    } else if (full.endsWith('.tsx')) {
      acc.push(full);
    }
  }
  return acc;
}

describe('theme tokens', () => {
  it('resolves both themes through the same semantic roles', () => {
    for (const role of [
      '--background',
      '--card',
      '--border',
      '--foreground',
      '--muted-foreground',
      '--primary',
      '--accent',
      '--accent-foreground',
      '--destructive',
      '--ring',
    ]) {
      expect(light[role], `light ${role}`).toBeTruthy();
      expect(dark[role], `dark ${role}`).toBeTruthy();
    }
  });

  it('keeps normal text at or above 4.5:1 in both themes', () => {
    const checks: Array<[string, Record<string, string>]> = [
      [':root', light],
      ['dark', dark],
    ];
    for (const [name, t] of checks) {
      expect(contrast(t['--foreground']!, t['--background']!), `${name} foreground`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(t['--muted-foreground']!, t['--background']!), `${name} muted/canvas`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(t['--muted-foreground']!, t['--muted']!), `${name} muted/raised`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(t['--accent-foreground']!, t['--accent']!), `${name} accent`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(t['--primary-foreground']!, t['--primary']!), `${name} primary text`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(t['--destructive']!, t['--background']!), `${name} destructive text`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('keeps control boundaries and the dark action at or above 3:1', () => {
    expect(contrast(light['--primary']!, light['--background']!)).toBeGreaterThanOrEqual(3);
    expect(contrast(dark['--primary']!, dark['--background']!)).toBeGreaterThanOrEqual(3);
    expect(contrast(light['--ring']!, light['--background']!)).toBeGreaterThanOrEqual(3);
    expect(contrast(dark['--ring']!, dark['--background']!)).toBeGreaterThanOrEqual(3);
  });

  it('uses only the allowed motion durations between 150ms and 250ms', () => {
    expect(css).toMatch(/--dur-fast:\s*150ms/);
    expect(css).toMatch(/--dur:\s*200ms/);
    expect(css).toMatch(/--dur-slow:\s*250ms/);
    expect(css).toMatch(/--ease:/);

    const durations = [...css.matchAll(/--dur[a-z-]*:\s*(\d+)ms/g)].map((m) => Number(m[1]));
    expect(durations.length).toBeGreaterThanOrEqual(3);
    for (const value of durations) {
      expect(value).toBeGreaterThanOrEqual(150);
      expect(value).toBeLessThanOrEqual(250);
    }
  });

  it('defines only fade, slide, and skeleton keyframes', () => {
    const names = [...css.matchAll(/@keyframes\s+([a-z-]+)/g)].map((m) => m[1]);
    expect(new Set(names)).toEqual(new Set(['fade-in', 'slide-up', 'skeleton-pulse']));
  });

  it('collapses motion when reduced motion is requested', () => {
    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
    expect(css).toMatch(/transition-duration:\s*0\.01ms\s*!important/);
    expect(css).toMatch(/animation-iteration-count:\s*1\s*!important/);
  });
});

describe('components avoid hardcoded colors', () => {
  it('contains no raw hex colors in any component or page', () => {
    const files = collectTsx('src/components').concat(collectTsx('src/app'));
    const offenders: string[] = [];
    for (const file of files) {
      const content = readFileSync(file, 'utf8');
      if (/#[0-9a-fA-F]{3,8}\b/.test(content)) {
        offenders.push(file);
      }
    }
    expect(offenders).toEqual([]);
  });
});
