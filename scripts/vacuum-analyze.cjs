const { Client } = require('pg');

// Refreshes query-planner statistics after migrations so plans are chosen from
// real cardinality estimates instead of the empty-table default. Runs as a
// one-off deploy step in the migrator image, matching scripts/migrate.cjs.
//
// VACUUM cannot run inside a transaction block; a bare client.query sends the
// statement on its own outside any explicit BEGIN, so this is safe.

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required to analyze the database');
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query('VACUUM ANALYZE');
  } finally {
    await client.end();
  }

  console.log('VACUUM ANALYZE complete.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
