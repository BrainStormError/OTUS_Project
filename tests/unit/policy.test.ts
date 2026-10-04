import { describe, expect, it } from 'vitest';

import { can, type Actor } from '@/core/auth/policy';

const admin: Actor = { id: 'admin-1', role: 'admin' };
const employee: Actor = { id: 'emp-1', role: 'employee' };

describe('can', () => {
  it('allows only administrators to view admin and change donations', () => {
    expect(can(admin, 'admin:view')).toBe(true);
    expect(can(employee, 'admin:view')).toBe(false);
    expect(can(admin, 'donation:change')).toBe(true);
    expect(can(employee, 'donation:change')).toBe(false);
  });

  it('allows thread reads for admins and the thread owner only', () => {
    expect(can(admin, 'thread:read', { ownerId: 'someone-else' })).toBe(true);
    expect(can(employee, 'thread:read', { ownerId: employee.id })).toBe(true);
    expect(can(employee, 'thread:read', { ownerId: 'other' })).toBe(false);
    expect(can(employee, 'thread:read')).toBe(false);
  });

  it('allows any actor to create a wish', () => {
    expect(can(admin, 'wish:create')).toBe(true);
    expect(can(employee, 'wish:create')).toBe(true);
  });

  it('allows wish edits for admins and the author only', () => {
    expect(can(admin, 'wish:edit', { authorId: 'other' })).toBe(true);
    expect(can(employee, 'wish:edit', { authorId: employee.id })).toBe(true);
    expect(can(employee, 'wish:edit', { authorId: 'other' })).toBe(false);
    expect(can(employee, 'wish:edit')).toBe(false);
  });

  it('allows only administrators to create directory entries', () => {
    expect(can(admin, 'directory:create')).toBe(true);
    expect(can(employee, 'directory:create')).toBe(false);
  });

  it('allows directory edits for admins and the owner only', () => {
    expect(can(admin, 'directory:edit', { ownerId: 'other' })).toBe(true);
    expect(can(employee, 'directory:edit', { ownerId: employee.id })).toBe(true);
    expect(can(employee, 'directory:edit', { ownerId: 'other' })).toBe(false);
    expect(can(employee, 'directory:edit')).toBe(false);
  });
});
