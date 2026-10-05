import { Client } from 'pg';

const ME = '11111111-1111-4111-8111-111111111111';
const MARIA = '22222222-2222-4222-8222-222222222222';
const IVAN = '33333333-3333-4333-8333-333333333333';
const NINA = '44444444-4444-4444-8444-444444444444';
const SECRET = '55555555-5555-4555-8555-555555555555';

const GROUP_KLASSIKA = 'aaaaaaaa-0000-4000-8000-000000000001';
const GROUP_KINOVECHERA = 'aaaaaaaa-0000-4000-8000-000000000002';
const GROUP_DOCS = 'aaaaaaaa-0000-4000-8000-000000000003';
const GROUP_CLOSED = 'aaaaaaaa-0000-4000-8000-000000000004';

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to run the development seed in production');
  }
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required to run the development seed');
  }

  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO users (id, email, name, role, handle, profile_hidden)
       VALUES
         ($1, 'me@example.com', 'Алексей', 'employee', 'me', false),
         ($2, 'maria@example.com', 'Мария', 'employee', 'maria', false),
         ($3, 'ivan@example.com', 'Иван', 'employee', 'ivan', false),
         ($4, 'nina@example.com', 'Нина', 'employee', 'nina', false),
         ($5, 'secret@example.com', 'Скрытый пользователь', 'employee', 'secret', true)
       ON CONFLICT (id) DO NOTHING`,
      [ME, MARIA, IVAN, NINA, SECRET],
    );

    await client.query(
      `INSERT INTO friendships (id, requester_id, addressee_id, status)
       VALUES
         ('bbbbbbbb-0000-4000-8000-000000000001', $1, $2, 'accepted'),
         ('bbbbbbbb-0000-4000-8000-000000000002', $4, $1, 'pending'),
         ('bbbbbbbb-0000-4000-8000-000000000003', $1, $3, 'pending'),
         ('bbbbbbbb-0000-4000-8000-000000000004', $5, $1, 'pending')
       ON CONFLICT (id) DO NOTHING`,
      [ME, MARIA, IVAN, NINA, SECRET],
    );

    await client.query(
      `INSERT INTO groups (id, name, description, tags, restricted)
       VALUES
         ($1, 'Киновечера', 'Смотрим и обсуждаем по пятницам.', ARRAY['пятница','обсуждение','компания'], false),
         ($2, 'Классика', 'Фильмы до 1990 года.', ARRAY['классика','ретро'], false),
         ($3, 'Документальное кино', 'Реальные истории и биографии.', ARRAY['документальное','биография'], false),
         ($4, 'Закрытый клуб', 'Только по приглашению.', ARRAY['закрытый'], true)
       ON CONFLICT (id) DO NOTHING`,
      [GROUP_KINOVECHERA, GROUP_KLASSIKA, GROUP_DOCS, GROUP_CLOSED],
    );

    await client.query(
      `INSERT INTO group_members (group_id, user_id, role)
       VALUES
         ($1, $4, 'admin'),
         ($1, $5, 'member'),
         ($1, $6, 'member'),
         ($2, $4, 'member'),
         ($2, $7, 'admin'),
         ($3, $7, 'admin')
       ON CONFLICT (group_id, user_id) DO NOTHING`,
      [GROUP_KINOVECHERA, GROUP_KLASSIKA, GROUP_CLOSED, ME, MARIA, NINA, IVAN],
    );

    await client.query(
      `INSERT INTO watched_records (id, user_id, media_kind, media_ref, title, year, genres, rating, comment, watched_at)
       VALUES
         ('cccccccc-0000-4000-8000-000000000001', $1, 'film', '27205', 'Начало', 2010, ARRAY['фантастика','боевик'], 9.0, 'Отличная структура сна.', '2026-08-12'),
         ('cccccccc-0000-4000-8000-000000000002', $1, 'film', '603', 'Матрица', 1999, ARRAY['фантастика','боевик'], 8.5, NULL, '2026-08-02'),
         ('cccccccc-0000-4000-8000-000000000003', $2, 'film', '155', 'Тёмный рыцарь', 2008, ARRAY['боевик','драма'], 8.5, NULL, '2026-08-20'),
         ('cccccccc-0000-4000-8000-000000000004', $2, 'film', '680', 'Криминальное чтиво', 1994, ARRAY['драма','криминал'], 8.5, 'Классика.', '2026-08-18'),
         ('cccccccc-0000-4000-8000-000000000005', $4, 'series', 'breaking-bad', 'Во все тяжкие', 2008, ARRAY['драма','криминал'], 9.0, NULL, '2026-08-24'),
         ('cccccccc-0000-4000-8000-000000000006', $3, 'film', '13', 'Форрест Гамп', 1994, ARRAY['драма','романтика'], 8.0, NULL, '2026-08-10')
       ON CONFLICT (id) DO NOTHING`,
      [ME, MARIA, IVAN, NINA],
    );

    const existing = await client.query<{ count: string }>(
      'SELECT count(*)::text AS count FROM activity_events',
    );
    if (existing.rows[0]?.count === '0') {
      await client.query(
        `INSERT INTO activity_events (id, actor_id, kind, group_id, target_type, target_id, payload)
         VALUES
           ('dddddddd-0000-4000-8000-000000000001', $1, 'film_rated', NULL, 'film', '155',
             '{"title":"Тёмный рыцарь","rating":8.5,"year":2008,"actorName":"Мария","actorHandle":"maria","href":"/film/155"}'::jsonb),
           ('dddddddd-0000-4000-8000-000000000002', $1, 'film_rated', NULL, 'film', '680',
             '{"title":"Криминальное чтиво","rating":8.5,"year":1994,"actorName":"Мария","actorHandle":"maria","href":"/film/680"}'::jsonb),
           ('dddddddd-0000-4000-8000-000000000003', $3, 'series_rated', NULL, 'series', 'breaking-bad',
             '{"title":"Во все тяжкие","rating":9,"year":2008,"actorName":"Нина","actorHandle":"nina","href":"/series"}'::jsonb),
           ('dddddddd-0000-4000-8000-000000000004', $2, 'film_rated', NULL, 'film', '13',
             '{"title":"Форрест Гамп","rating":8,"year":1994,"actorName":"Иван","actorHandle":"ivan","href":"/film/13"}'::jsonb),
           ('dddddddd-0000-4000-8000-000000000005', $1, 'film_rated', $4, 'film', '27205',
             '{"title":"Начало","rating":9,"year":2010,"actorName":"Мария","actorHandle":"maria","href":"/film/27205"}'::jsonb)
         ON CONFLICT (id) DO NOTHING`,
        [MARIA, IVAN, NINA, GROUP_KINOVECHERA],
      );
    }

    await client.query('COMMIT');
    console.log('Development seed complete.');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
