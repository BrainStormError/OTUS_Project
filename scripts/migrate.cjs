const path = require('node:path');
const { runner } = require('node-pg-migrate');

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is required to run migrations');
    process.exit(1);
  }

  await runner({
    databaseUrl,
    dir: path.join(__dirname, '..', 'src', 'core', 'db', 'migrations'),
    direction: 'up',
    migrationsTable: 'pgmigrations',
    count: Infinity,
  });

  console.log('Migrations applied');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
