import { describe, expect, it } from 'vitest';

import {
  createGroupInput,
  inviteToGroupInput,
  respondInvitationInput,
  updateGroupInput,
} from '@/modules/groups/schema';

describe('createGroupInput', () => {
  it('trims the name and accepts optional description, tags and visibility', () => {
    const parsed = createGroupInput.safeParse({
      name: '  Киновечера  ',
      description: '  Смотрим вместе  ',
      tags: ['  пятница  ', 'компания'],
      restricted: true,
    });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.name).toBe('Киновечера');
    expect(parsed.data.description).toBe('Смотрим вместе');
    expect(parsed.data.tags).toEqual(['пятница', 'компания']);
    expect(parsed.data.restricted).toBe(true);
  });

  it('accepts a name without optional fields', () => {
    const parsed = createGroupInput.safeParse({ name: 'Классика' });
    expect(parsed.success).toBe(true);
  });

  it('rejects an empty or over-limit name', () => {
    expect(createGroupInput.safeParse({ name: '   ' }).success).toBe(false);
    expect(createGroupInput.safeParse({ name: 'а'.repeat(101) }).success).toBe(false);
    expect(createGroupInput.safeParse({ name: 'а'.repeat(100) }).success).toBe(true);
    expect(createGroupInput.safeParse({}).success).toBe(false);
  });

  it('rejects an over-limit description or tag', () => {
    expect(
      createGroupInput.safeParse({ name: 'Группа', description: 'я'.repeat(1001) }).success,
    ).toBe(false);
    expect(
      createGroupInput.safeParse({ name: 'Группа', description: 'я'.repeat(1000) }).success,
    ).toBe(true);
    expect(
      createGroupInput.safeParse({ name: 'Группа', tags: ['я'.repeat(81)] }).success,
    ).toBe(false);
    expect(
      createGroupInput.safeParse({ name: 'Группа', tags: ['я'.repeat(80)] }).success,
    ).toBe(true);
  });
});

describe('updateGroupInput', () => {
  it('requires a group id and allows a partial patch', () => {
    expect(updateGroupInput.safeParse({}).success).toBe(false);
    const parsed = updateGroupInput.safeParse({ groupId: '3', restricted: false });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.groupId).toBe(3);
    expect(parsed.data.restricted).toBe(false);
  });

  it('validates a provided name and tags', () => {
    expect(updateGroupInput.safeParse({ groupId: 1, name: '  ' }).success).toBe(false);
    expect(updateGroupInput.safeParse({ groupId: 1, name: 'Новое' }).success).toBe(true);
    expect(updateGroupInput.safeParse({ groupId: 1, tags: ['a', 'b'] }).success).toBe(true);
  });
});

describe('invitation inputs', () => {
  it('requires a numeric invitee for invites', () => {
    expect(inviteToGroupInput.safeParse({ groupId: 2, inviteeId: '5' }).success).toBe(true);
    expect(inviteToGroupInput.safeParse({ groupId: 2 }).success).toBe(false);
  });

  it('restricts a decision to accept or decline', () => {
    expect(respondInvitationInput.safeParse({ invitationId: 1, decision: 'accept' }).success).toBe(
      true,
    );
    expect(respondInvitationInput.safeParse({ invitationId: 1, decision: 'decline' }).success).toBe(
      true,
    );
    expect(respondInvitationInput.safeParse({ invitationId: 1, decision: 'maybe' }).success).toBe(
      false,
    );
  });
});
