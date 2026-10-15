import { revalidatePath } from 'next/cache';

const PERSONAL_DATA_ROUTES: Array<{ path: string; type?: 'page' | 'layout' }> = [
  { path: '/' },
  { path: '/films' },
  { path: '/series' },
  { path: '/me' },
  { path: '/me/stats' },
  { path: '/films/[id]', type: 'page' },
  { path: '/film/[tmdbId]', type: 'page' },
  { path: '/series/[tmdbId]', type: 'page' },
  { path: '/u/[handle]', type: 'page' },
];

export function revalidatePersonalData(): void {
  for (const route of PERSONAL_DATA_ROUTES) {
    if (route.type) {
      revalidatePath(route.path, route.type);
    } else {
      revalidatePath(route.path);
    }
  }
}
