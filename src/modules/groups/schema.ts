import { z } from 'zod';

import { ratingInput } from '@/modules/ratings';

const id = z.coerce.number().int().positive();

const groupName = z.string().trim().min(1).max(100);
const groupDescription = z.string().trim().max(1000);
const groupTag = z.string().trim().min(1).max(80);
const tagList = z.array(groupTag);

export const joinGroupInput = z.object({
  groupId: id,
});

export type JoinGroupInput = z.infer<typeof joinGroupInput>;

export const leaveGroupInput = z.object({
  groupId: id,
});

export type LeaveGroupInput = z.infer<typeof leaveGroupInput>;

export const dissolveGroupInput = z.object({
  groupId: id,
});

export type DissolveGroupInput = z.infer<typeof dissolveGroupInput>;

export const groupRatingInput = ratingInput.extend({
  groupId: id,
  alsoPersonal: z.boolean().optional(),
  confirmOverwrite: z.boolean().optional(),
});

export type GroupRatingInput = z.infer<typeof groupRatingInput>;

export const createGroupInput = z.object({
  name: groupName,
  description: groupDescription.optional(),
  tags: tagList.optional(),
  restricted: z.boolean().optional(),
});

export type CreateGroupInput = z.infer<typeof createGroupInput>;

export const updateGroupInput = z.object({
  groupId: id,
  name: groupName.optional(),
  description: groupDescription.optional(),
  tags: tagList.optional(),
  restricted: z.boolean().optional(),
});

export type UpdateGroupInput = z.infer<typeof updateGroupInput>;

export const groupRoleInput = z.object({
  groupId: id,
  userId: id,
  role: z.enum(['admin', 'member']),
});

export type GroupRoleInput = z.infer<typeof groupRoleInput>;

export const removeGroupMemberInput = z.object({
  groupId: id,
  userId: id,
});

export type RemoveGroupMemberInput = z.infer<typeof removeGroupMemberInput>;

export const inviteToGroupInput = z.object({
  groupId: id,
  inviteeId: id,
});

export type InviteToGroupInput = z.infer<typeof inviteToGroupInput>;

export const respondInvitationInput = z.object({
  invitationId: id,
  decision: z.enum(['accept', 'decline']),
});

export type RespondInvitationInput = z.infer<typeof respondInvitationInput>;

export const invitationIdInput = z.object({
  invitationId: id,
});

export type InvitationIdInput = z.infer<typeof invitationIdInput>;
