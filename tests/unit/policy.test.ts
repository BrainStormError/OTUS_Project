import { describe, expect, it } from 'vitest';

import { can, type Actor } from '@/core/auth/policy';

const admin: Actor = { id: 1, role: 'admin' };
const employee: Actor = { id: 2, role: 'employee' };

describe('can', () => {
  it('allows only administrators to view admin and change donations', () => {
    expect(can(admin, 'admin:view')).toBe(true);
    expect(can(employee, 'admin:view')).toBe(false);
    expect(can(admin, 'donation:change')).toBe(true);
    expect(can(employee, 'donation:change')).toBe(false);
  });

  it('allows thread reads for admins and the thread owner only', () => {
    expect(can(admin, 'thread:read', { ownerId: 99 })).toBe(true);
    expect(can(employee, 'thread:read', { ownerId: employee.id })).toBe(true);
    expect(can(employee, 'thread:read', { ownerId: 99 })).toBe(false);
    expect(can(employee, 'thread:read')).toBe(false);
  });

  it('allows any authenticated actor to send and withdraw friend requests', () => {
    expect(can(admin, 'friend:request')).toBe(true);
    expect(can(employee, 'friend:request')).toBe(true);
    expect(can(admin, 'friend:withdraw')).toBe(true);
    expect(can(employee, 'friend:withdraw')).toBe(true);
  });

  it('allows any actor to create a wish', () => {
    expect(can(admin, 'wish:create')).toBe(true);
    expect(can(employee, 'wish:create')).toBe(true);
  });

  it('allows wish edits for admins and the author only', () => {
    expect(can(admin, 'wish:edit', { authorId: 99 })).toBe(true);
    expect(can(employee, 'wish:edit', { authorId: employee.id })).toBe(true);
    expect(can(employee, 'wish:edit', { authorId: 99 })).toBe(false);
    expect(can(employee, 'wish:edit')).toBe(false);
  });

  it('restricts discussion creation and attachment to group admins', () => {
    expect(can(employee, 'group:discuss:create', { groupRole: 'admin' })).toBe(true);
    expect(can(employee, 'group:discuss:create', { groupRole: 'member' })).toBe(false);
    expect(can(employee, 'group:discuss:create', { groupRole: null })).toBe(false);
    expect(can(employee, 'group:discuss:create')).toBe(false);

    expect(can(employee, 'group:discuss:attach', { groupRole: 'admin' })).toBe(true);
    expect(can(employee, 'group:discuss:attach', { groupRole: 'member' })).toBe(false);
  });

  it('allows any actor to view an open group', () => {
    expect(can(admin, 'group:view', { restricted: false })).toBe(true);
    expect(can(employee, 'group:view', { restricted: false })).toBe(true);
    expect(can(employee, 'group:view', { restricted: false, groupRole: null })).toBe(true);
  });

  it('restricts a restricted group view to its admins and members', () => {
    expect(can(employee, 'group:view', { restricted: true, groupRole: 'member' })).toBe(true);
    expect(can(employee, 'group:view', { restricted: true, groupRole: 'admin' })).toBe(true);
    expect(can(employee, 'group:view', { restricted: true, groupRole: null })).toBe(false);
    expect(can(employee, 'group:view', { restricted: true })).toBe(false);
    expect(can(admin, 'group:view', { restricted: true, groupRole: null })).toBe(false);
  });

  it('allows any authenticated actor to create a group', () => {
    expect(can(admin, 'group:create')).toBe(true);
    expect(can(employee, 'group:create')).toBe(true);
  });

  it('restricts group settings, invitations and member management to group admins', () => {
    for (const action of ['group:update', 'group:invite', 'group:manage'] as const) {
      expect(can(employee, action, { groupRole: 'admin' })).toBe(true);
      expect(can(employee, action, { groupRole: 'member' })).toBe(false);
      expect(can(employee, action, { groupRole: null })).toBe(false);
      expect(can(employee, action)).toBe(false);
    }
  });

  it('allows group members and admins to discuss and rate', () => {
    expect(can(employee, 'group:discuss', { groupRole: 'member' })).toBe(true);
    expect(can(employee, 'group:discuss', { groupRole: 'admin' })).toBe(true);
    expect(can(employee, 'group:discuss', { groupRole: null })).toBe(false);
    expect(can(employee, 'group:discuss')).toBe(false);

    expect(can(employee, 'group:rate', { groupRole: 'member' })).toBe(true);
    expect(can(employee, 'group:rate', { groupRole: 'admin' })).toBe(true);
    expect(can(employee, 'group:rate', { groupRole: null })).toBe(false);
  });

  it('restricts starting a rating to group admins', () => {
    expect(can(employee, 'group:rate:start', { groupRole: 'admin' })).toBe(true);
    expect(can(employee, 'group:rate:start', { groupRole: 'member' })).toBe(false);
    expect(can(employee, 'group:rate:start', { groupRole: null })).toBe(false);
    expect(can(employee, 'group:rate:start')).toBe(false);
  });

  it('allows only members to leave a group and only admins to delete it', () => {
    expect(can(employee, 'group:leave', { groupRole: 'member' })).toBe(true);
    expect(can(employee, 'group:leave', { groupRole: 'admin' })).toBe(false);
    expect(can(employee, 'group:leave', { groupRole: null })).toBe(false);
    expect(can(employee, 'group:leave')).toBe(false);

    expect(can(employee, 'group:delete', { groupRole: 'admin' })).toBe(true);
    expect(can(employee, 'group:delete', { groupRole: 'member' })).toBe(false);
    expect(can(employee, 'group:delete', { groupRole: null })).toBe(false);
    expect(can(employee, 'group:delete')).toBe(false);
  });
});
