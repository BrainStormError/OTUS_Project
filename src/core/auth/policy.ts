export type Role = 'employee' | 'admin';

export type Actor = {
  id: number;
  role: Role;
  email?: string;
  name?: string | null;
  handle?: string | null;
};

export type GroupRole = 'admin' | 'member';

export type Action =
  | 'wish:create'
  | 'wish:edit'
  | 'donation:change'
  | 'thread:read'
  | 'friend:request'
  | 'friend:withdraw'
  | 'group:create'
  | 'group:update'
  | 'group:invite'
  | 'group:manage'
  | 'group:delete'
  | 'group:leave'
  | 'group:view'
  | 'group:rate'
  | 'group:discuss'
  | 'group:discuss:create'
  | 'group:discuss:attach'
  | 'admin:view';

export type Resource = {
  ownerId?: number;
  authorId?: number;
  groupRole?: GroupRole | null;
  restricted?: boolean;
};

export function can(actor: Actor, action: Action, resource?: Resource): boolean {
  switch (action) {
    case 'admin:view':
    case 'donation:change':
      return actor.role === 'admin';
    case 'thread:read':
      return actor.role === 'admin' || resource?.ownerId === actor.id;
    case 'friend:request':
    case 'friend:withdraw':
      return true;
    case 'wish:create':
    case 'group:create':
      return true;
    case 'wish:edit':
      return actor.role === 'admin' || resource?.authorId === actor.id;
    case 'group:update':
    case 'group:invite':
    case 'group:manage':
    case 'group:delete':
      return resource?.groupRole === 'admin';
    case 'group:leave':
      return resource?.groupRole === 'member';
    case 'group:view':
      return (
        resource?.restricted !== true ||
        resource?.groupRole === 'admin' ||
        resource?.groupRole === 'member'
      );
    case 'group:rate':
    case 'group:discuss':
      return resource?.groupRole === 'admin' || resource?.groupRole === 'member';
    case 'group:discuss:create':
    case 'group:discuss:attach':
      return resource?.groupRole === 'admin';
  }
}
