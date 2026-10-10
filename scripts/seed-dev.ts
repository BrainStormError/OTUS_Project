import { Client } from 'pg';

// All identifiers are fixed numbers so the seed is deterministic and activity
// events can reference stored ratings/discussions exactly.

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

    // Reset the whole dataset so re-running the seed is deterministic: the
    // login form resolves demo accounts by email, so stale rows would shadow
    // the fixed seed identifiers. RESTART IDENTITY also resets sequences.
    await client.query(
      `TRUNCATE activity_events, discussion_posts, group_discussions, ratings,
         group_members, friendships, groups, media, tags, genres, users
       RESTART IDENTITY CASCADE`,
    );

    await client.query(
      `INSERT INTO genres (id, name) VALUES
         (12, 'Приключение'),
         (14, 'Фэнтези'),
         (16, 'Мультфильм'),
         (18, 'Драма'),
         (27, 'Ужасы'),
         (28, 'Боевик'),
         (35, 'Комедия'),
         (36, 'История'),
         (37, 'Вестерн'),
         (53, 'Триллер'),
         (80, 'Криминал'),
         (99, 'Документальный'),
         (878, 'Фантастика'),
         (9648, 'Детектив'),
         (10402, 'Музыка'),
         (10749, 'Мелодрама'),
         (10751, 'Семейный'),
         (10752, 'Военный'),
         (10759, 'Боевик и приключения'),
         (10762, 'Детский'),
         (10763, 'Новости'),
         (10764, 'Реалити-шоу'),
         (10765, 'Научная фантастика и фэнтези'),
         (10766, 'Мыльная опера'),
         (10767, 'Ток-шоу'),
         (10768, 'Военный и политический'),
         (10770, 'Телевизионный фильм')`,
    );

    await client.query(
      `INSERT INTO tags (id, name) VALUES
         (1, 'пятница'),
         (2, 'обсуждение'),
         (3, 'компания'),
         (4, 'классика'),
         (5, 'ретро'),
         (6, 'документальное'),
         (7, 'биография'),
         (8, 'закрытый')`,
    );

    // Users: ids 1..6. Employee role = 0, admin = 1.
    await client.query(
      `INSERT INTO users (id, email, name, role, handle, profile_hidden) VALUES
         (1, 'employee@demo.local', 'Алексей', 0, 'me', false),
         (2, 'maria@example.com', 'Мария', 0, 'maria', false),
         (3, 'ivan@example.com', 'Иван', 0, 'ivan', false),
         (4, 'nina@example.com', 'Нина', 0, 'nina', false),
         (5, 'secret@example.com', 'Скрытый пользователь', 0, 'secret', true),
         (6, 'admin@demo.local', 'Пётр', 1, 'admin', false)`,
    );

    // Media: kind 0 = film, 1 = series. external_ref is the numeric TMDB id
    // and genre_ids are TMDB genre ids (see the genres insert above).
    await client.query(
      `INSERT INTO media (id, kind, external_ref, title, year, director, genre_ids) VALUES
         (1, 0, '27205', 'Начало', 2010, 'Кристофер Нолан', '{12,28,878}'::smallint[]),
         (2, 0, '603', 'Матрица', 1999, 'Лана Вачовски', '{28,878}'::smallint[]),
         (3, 0, '155', 'Тёмный рыцарь', 2008, 'Кристофер Нолан', '{18,28,53,80}'::smallint[]),
         (4, 0, '680', 'Криминальное чтиво', 1994, 'Квентин Тарантино', '{18,53,80}'::smallint[]),
         (5, 1, '1396', 'Во все тяжкие', 2008, 'Винс Гиллиган', '{18,80}'::smallint[]),
         (6, 0, '13', 'Форрест Гамп', 1994, 'Роберт Земекис', '{18,35,10749}'::smallint[])`,
    );

    // Friendships: status 0 = pending, 1 = accepted, 2 = declined.
    await client.query(
      `INSERT INTO friendships (id, requester_id, addressee_id, status) VALUES
         (1, 1, 2, 1),
         (2, 4, 1, 0),
         (3, 1, 3, 0),
         (4, 5, 1, 0),
         (5, 6, 1, 1),
         (6, 6, 2, 1),
         (7, 3, 4, 2)`,
    );

    await client.query(
      `INSERT INTO groups (id, name, description, tag_ids, restricted) VALUES
         (1, 'Киновечера', 'Смотрим и обсуждаем по пятницам.', '{1,2,3}'::smallint[], false),
         (2, 'Классика', 'Фильмы до 1990 года.', '{4,5}'::smallint[], false),
         (3, 'Документальное кино', 'Реальные истории и биографии.', '{6,7}'::smallint[], false),
         (4, 'Закрытый клуб', 'Только по приглашению.', '{8}'::smallint[], true)`,
    );

    // Group members: role 1 = admin, 0 = member.
    await client.query(
      `INSERT INTO group_members (group_id, user_id, role) VALUES
         (1, 1, 1),
         (1, 2, 0),
         (1, 4, 0),
         (1, 6, 1),
         (2, 1, 0),
         (2, 3, 1),
         (2, 6, 0),
         (3, 3, 1)`,
    );

    // Personal ratings (group_id NULL). rating is stored in tenths (0..100).
    // Every demo account gets at least one personal rating so profiles and
    // statistics are non-empty for all of them.
    await client.query(
      `INSERT INTO ratings (id, user_id, media_id, group_id, rating, comment, watched_at) VALUES
         (1, 1, 1, NULL, 90, 'Отличная структура сна.', '2026-08-12'),
         (2, 1, 2, NULL, 85, NULL, '2026-08-02'),
         (3, 2, 3, NULL, 85, NULL, '2026-08-20'),
         (4, 2, 4, NULL, 85, 'Классика.', '2026-08-18'),
         (5, 4, 5, NULL, 90, NULL, '2026-08-24'),
         (6, 3, 6, NULL, 80, NULL, '2026-08-10'),
         (7, 2, 6, NULL, 70, repeat('я', 1000), '2026-08-05'),
         (11, 5, 6, NULL, 60, NULL, '2026-08-06'),
         (12, 5, 4, NULL, 70, NULL, '2026-08-11'),
         (13, 6, 1, NULL, 95, 'Шедевр.', '2026-08-07'),
         (14, 6, 3, NULL, 88, NULL, '2026-08-08'),
         (15, 6, 5, NULL, 92, NULL, '2026-08-09'),
         (16, 3, 1, NULL, 82, NULL, '2026-08-12'),
         (17, 4, 2, NULL, 78, NULL, '2026-08-13')`,
    );

    // Group ratings for «Киновечера» (group_id = 1).
    await client.query(
      `INSERT INTO ratings (id, user_id, media_id, group_id, rating, comment, watched_at) VALUES
         (8, 1, 1, 1, 90, NULL, '2026-08-12'),
         (9, 2, 1, 1, 80, 'Пересматриваю с удовольствием.', '2026-08-13'),
         (10, 3, 2, 1, 75, NULL, '2026-08-14')`,
    );

    await client.query(
      `INSERT INTO group_discussions (id, group_id, author_id, title, media_id) VALUES
         (1, 1, 1, 'Обсуждаем «Начало»', 1),
         (2, 1, 1, 'Что смотрим в пятницу?', NULL)`,
    );

    await client.query(
      `INSERT INTO discussion_posts (id, discussion_id, author_id, body) VALUES
         (1, 1, 2, 'Финал гениален, спорить бесполезно.'),
         (2, 1, 1, 'Согласен, но второй уровень слабее.')`,
    );

    // Activity kinds: 0 film_rated, 1 series_rated, 2 friendship_accepted,
    // 3 group_joined, 4 post_created, 5 comment_created. Rating events select
    // a stored rating with the same actor/media/group, so the feed can derive
    // the value by joining.
    await client.query(
      `INSERT INTO activity_events (id, actor_id, kind, group_id, media_id, discussion_id, created_at) VALUES
         (1, 2, 0, NULL, 3, NULL, '2026-08-20T10:00:00Z'),
         (2, 2, 0, NULL, 4, NULL, '2026-08-18T10:00:00Z'),
         (3, 4, 1, NULL, 5, NULL, '2026-08-24T10:00:00Z'),
         (4, 3, 0, NULL, 6, NULL, '2026-08-10T10:00:00Z'),
         (5, 2, 0, 1, 1, NULL, '2026-08-12T10:00:00Z'),
         (6, 1, 4, 1, NULL, 1, '2026-08-12T11:00:00Z'),
         (7, 2, 5, 1, NULL, 1, '2026-08-12T12:00:00Z'),
         (8, 4, 3, 1, NULL, NULL, '2026-08-11T10:00:00Z'),
         (9, 2, 2, NULL, NULL, NULL, '2026-08-09T10:00:00Z')`,
    );

    // Explicit identity values do not advance the sequence; align each one so
    // newly created rows (for example demo logins) cannot collide.
    for (const table of [
      'users',
      'media',
      'ratings',
      'friendships',
      'groups',
      'group_discussions',
      'discussion_posts',
      'activity_events',
    ]) {
      await client.query(
        `SELECT setval(pg_get_serial_sequence('${table}', 'id'), (SELECT max(id) FROM ${table}))`,
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
