export type Role = 'employee' | 'admin';

export type Actor = { id: string; role: Role; email?: string };

export type Action =
  | 'wish:create'
  | 'wish:edit'
  | 'donation:change'
  | 'thread:read'
  | 'admin:view'
  | 'directory:create'
  | 'directory:edit';

export type Resource = { ownerId?: string; authorId?: string };

export function can(actor: Actor, action: Action, resource?: Resource): boolean {
  switch (action) {
    case 'admin:view':
    case 'donation:change':
      return actor.role === 'admin';
    case 'thread:read':
      return actor.role === 'admin' || resource?.ownerId === actor.id;
    case 'wish:create':
      return true;
    case 'wish:edit':
      return actor.role === 'admin' || resource?.authorId === actor.id;
    case 'directory:create':
      return actor.role === 'admin';
    case 'directory:edit':
      return actor.role === 'admin' || resource?.ownerId === actor.id;
  }
}
