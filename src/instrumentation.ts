export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const { getEnv } = await import('@/core/config/env');
      getEnv();
    } catch (error) {
      // Fail fast: never serve traffic with invalid configuration.
      console.error(
        error instanceof Error ? error.message : String(error),
      );
      process.exit(1);
    }
    // Establish the database pool's connections before the first request so a
    // burst after an idle period does not pay connection setup. A failure is
    // non-fatal: the pool still fills lazily on demand.
    try {
      const { warmPool } = await import('@/core/db/pool');
      await warmPool();
    } catch (error) {
      console.error(
        `Database pool warm-up failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    // Cache maintenance runs on a background timer, decoupled from requests.
    const { startCacheSweep } = await import('@/modules/catalog/service');
    startCacheSweep();
  }
}
