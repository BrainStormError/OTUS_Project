import { pingDatabase } from '@/core/db/pool';

import { createHealthHandler } from './health-factory';

export const dynamic = 'force-dynamic';

export const GET = createHealthHandler(pingDatabase);
