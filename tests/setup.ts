import '@testing-library/jest-dom/vitest';
import { beforeEach } from 'vitest';

import { resetListStores } from '@/components/features/movie-tracker/list-store';

beforeEach(() => {
  resetListStores();
});
