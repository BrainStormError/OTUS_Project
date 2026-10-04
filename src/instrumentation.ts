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
  }
}
