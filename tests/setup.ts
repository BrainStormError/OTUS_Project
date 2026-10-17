import '@testing-library/jest-dom/vitest';
import { beforeEach } from 'vitest';

import { resetListStores } from '@/components/features/movie-tracker/list-store';
import { resetReadStore } from '@/components/features/movie-tracker/read-store';

beforeEach(() => {
  resetListStores();
  resetReadStore();
});
