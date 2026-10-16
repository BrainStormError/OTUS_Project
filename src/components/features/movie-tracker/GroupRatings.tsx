'use client';

import { useRouter } from 'next/navigation';
import { Fragment, useEffect, useId, useState } from 'react';

import { currentDateInTimeZone, useTimeFormat } from '@/components/layout/preferences';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import type { CatalogSearchResult } from '@/modules/catalog';
import type { GroupRatingMember, GroupRatingSummary } from '@/modules/groups';

import { genreOptionsFromCatalog } from './catalog-view';
import { RatingForm, type RatingPayload } from './RatingForm';
import { SearchField } from './SearchField';
import type { FilterOption, MediaKind, SearchFilters } from './types';

type SearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'done'; items: CatalogSearchResult[] };

type PendingSave = {
  media: { kind: MediaKind; ref: string };
  payload: RatingPayload;
};

function alsoPersonalLabel(kind: MediaKind): string {
  return kind === 'series' ? 'также добавить в мои сериалы' : 'также добавить в мои фильмы';
}

function ratingKey(mediaKind: string, mediaRef: string): string {
  return `${mediaKind}:${mediaRef}`;
}

export function GroupRatings({
  groupId,
  isMember,
  isAdmin,
  currentUserId,
  ratings,
  onOpenDiscussion,
}: {
  groupId: number;
  isMember: boolean;
  isAdmin: boolean;
  currentUserId?: number;
  ratings: GroupRatingSummary[];
  onOpenDiscussion: (id: number) => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const attachTitleId = useId();
  const { timeZone } = useTimeFormat();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [kind, setKind] = useState<MediaKind>('film');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [search, setSearch] = useState<SearchState>({ status: 'idle' });
  const [genresByKind, setGenresByKind] = useState<Record<MediaKind, FilterOption[]>>({
    film: [],
    series: [],
  });
  const [selected, setSelected] = useState<CatalogSearchResult | null>(null);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [rateTarget, setRateTarget] = useState<GroupRatingSummary | null>(null);
  const [attachTarget, setAttachTarget] = useState<GroupRatingSummary | null>(null);
  const [attachTitle, setAttachTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [alsoPersonal, setAlsoPersonal] = useState(false);
  const [overwritePrompt, setOverwritePrompt] = useState(false);
  const [pendingSave, setPendingSave] = useState<PendingSave | null>(null);

  function mineOf(target: GroupRatingSummary): GroupRatingMember | undefined {
    return currentUserId !== undefined
      ? target.ratings.find((member) => member.userId === currentUserId)
      : undefined;
  }

  function loadGenres(next: MediaKind) {
    void fetch(`/api/genres?kind=${next}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { items?: { id: number; name: string }[] } | null) => {
        if (data?.items) {
          setGenresByKind((previous) => ({ ...previous, [next]: genreOptionsFromCatalog(data.items!) }));
        }
      })
      .catch(() => undefined);
  }

  useEffect(() => {
    loadGenres('film');
  }, []);

  function changeKind(next: MediaKind) {
    setKind(next);
    setFilters({});
    setSearch({ status: 'idle' });
    if (genresByKind[next].length === 0) {
      loadGenres(next);
    }
  }

  async function runSearch(active: SearchFilters) {
    setSearch({ status: 'loading' });
    try {
      const params = new URLSearchParams({ kind, page: '1' });
      if (active.title) params.set('q', active.title);
      if (active.genre?.length) params.set('genre', active.genre.join(','));
      if (active.yearFrom) params.set('yearFrom', active.yearFrom);
      if (active.yearTo) params.set('yearTo', active.yearTo);
      const response = await fetch(`/api/search?${params.toString()}`);
      if (!response.ok) {
        setSearch({ status: 'error' });
        return;
      }
      const data = (await response.json()) as { items?: CatalogSearchResult[] };
      setSearch({ status: 'done', items: data.items ?? [] });
    } catch {
      setSearch({ status: 'error' });
    }
  }

  async function saveRating(
    media: { kind: MediaKind; ref: string },
    payload: RatingPayload,
    options?: { alsoPersonal?: boolean; confirmOverwrite?: boolean },
  ) {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/groups/${groupId}/ratings`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          mediaKind: media.kind,
          mediaRef: media.ref,
          rating: payload.rating,
          comment: payload.comment,
          watchedAt: payload.watchedAt,
          ...(options?.alsoPersonal ? { alsoPersonal: true } : {}),
          ...(options?.confirmOverwrite ? { confirmOverwrite: true } : {}),
        }),
      });
      if (response.status === 409) {
        setPendingSave({ media, payload });
        setOverwritePrompt(true);
        return;
      }
      if (!response.ok) {
        setError('Не удалось сохранить оценку');
        toast.error('Не удалось сохранить оценку');
        return;
      }
      setSelected(null);
      setRateTarget(null);
      setAlsoPersonal(false);
      setPendingSave(null);
      toast.success('Оценка сохранена');
      router.refresh();
    } catch {
      setError('Не удалось сохранить оценку');
      toast.error('Не удалось сохранить оценку');
    } finally {
      setPending(false);
    }
  }

  async function confirmOverwrite() {
    if (!pendingSave) return;
    setOverwritePrompt(false);
    await saveRating(pendingSave.media, pendingSave.payload, {
      alsoPersonal: true,
      confirmOverwrite: true,
    });
  }

  function dismissOverwrite() {
    setOverwritePrompt(false);
    setAlsoPersonal(false);
    setPendingSave(null);
  }

  async function submitAttach(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!attachTarget || !attachTitle.trim()) {
      setError('Укажите название обсуждения');
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/groups/${groupId}/ratings/${attachTarget.mediaId}/discussion`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ mediaId: attachTarget.mediaId, title: attachTitle.trim() }),
        },
      );
      if (!response.ok) {
        setError('Не удалось прикрепить обсуждение');
        toast.error('Не удалось прикрепить обсуждение');
        return;
      }
      setAttachTarget(null);
      setAttachTitle('');
      toast.success('Обсуждение прикреплено');
      router.refresh();
    } catch {
      setError('Не удалось прикрепить обсуждение');
      toast.error('Не удалось прикрепить обсуждение');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      {isAdmin ? (
        <div className="flex justify-end">
          <Button type="button" onClick={() => setPickerOpen(true)}>
            Добавить оценку
          </Button>
        </div>
      ) : null}

      {ratings.length === 0 ? (
        <EmptyState
          title="В группе пока нет оценок"
          description="Администратор группы начинает оценивание, добавив первую оценку фильма или сериала."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table
            data-testid="group-ratings"
            className="w-full border-collapse text-left text-sm"
          >
            <thead>
            <tr className="border-b border-border">
              <th scope="col" className="px-4 py-3 font-medium">
                Медиа
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Оценка группы
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Действия
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Обсуждение
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {ratings.map((rating) => {
              const key = ratingKey(rating.mediaKind, rating.mediaRef);
              const expanded = expandedKey === key;
              const detailId = `rating-${key}`;
              const mine = mineOf(rating);
              return (
                <Fragment key={key}>
                  <tr
                    onClick={() => setExpandedKey(expanded ? null : key)}
                    className="cursor-pointer transition-hover hover:bg-secondary"
                  >
                    <th scope="row" className="px-4 py-3 font-medium">
                      <button
                        type="button"
                        aria-expanded={expanded}
                        aria-controls={detailId}
                        onClick={(event) => {
                          event.stopPropagation();
                          setExpandedKey(expanded ? null : key);
                        }}
                        className="rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      >
                        {rating.title}
                      </button>
                    </th>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">
                      {rating.average.toFixed(1)}
                    </td>
                    <td className="px-4 py-3">
                      {isMember ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            setRateTarget(rating);
                            setAlsoPersonal(false);
                          }}
                        >
                          {mine ? 'Изменить' : 'Оценить'}
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {rating.discussionId ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            onOpenDiscussion(rating.discussionId as number);
                          }}
                        >
                          К обсуждению
                        </Button>
                      ) : isAdmin ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            setAttachTarget(rating);
                          }}
                        >
                          Обсудить
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                  {expanded ? (
                    <tr>
                      <td id={detailId} colSpan={4} className="bg-secondary/40 px-4 py-3">
                        <ul data-testid="individual-ratings" className="space-y-2">
                          {rating.ratings.map((member) => (
                            <li
                              key={member.userId}
                              className="flex flex-wrap items-center justify-between gap-2 text-sm"
                            >
                              <span className="font-medium">{member.name}</span>
                              <span className="text-muted-foreground">
                                {member.rating.toFixed(1)} · {member.watchedAt}
                                {member.comment ? ` · ${member.comment}` : ''}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
          </table>
        </div>
      )}

      <Modal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Выбор медиа"
        size="wide"
      >
        <div className="space-y-3">
          <SearchField
            filters={filters}
            onFiltersChange={setFilters}
            onSearch={runSearch}
            onReset={() => setSearch({ status: 'idle' })}
            genres={genresByKind[kind]}
            kind={kind}
            onKindChange={changeKind}
            ariaLabel="Поиск медиа"
          />

          {search.status === 'done' ? (
            search.items.length === 0 ? (
              <p role="status" className="text-sm text-muted-foreground">
                Ничего не найдено
              </p>
            ) : (
              <ul className="max-h-64 divide-y divide-border overflow-y-auto rounded-lg border border-border">
                {search.items.map((item) => (
                  <li key={`${item.kind}:${item.externalId}`}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(item);
                        setAlsoPersonal(false);
                        setPickerOpen(false);
                      }}
                      className="flex min-h-12 w-full items-center justify-between gap-3 px-3 text-left text-sm transition-hover hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                    >
                      <span className="truncate font-medium">{item.title}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {item.kind === 'series' ? 'Сериал' : 'Фильм'} · {item.year ?? '—'}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )
          ) : null}
        </div>
      </Modal>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? `Оценка «${selected.title}»` : 'Оценка'}
      >
        {selected ? (
          <RatingForm
            initialDate={currentDateInTimeZone(timeZone)}
            submitLabel="Сохранить"
            alsoPersonal={alsoPersonal}
            onAlsoPersonalChange={setAlsoPersonal}
            alsoPersonalLabel={alsoPersonalLabel(selected.kind)}
            onSubmit={(payload) =>
              void saveRating(
                { kind: selected.kind, ref: selected.externalId },
                payload,
                { alsoPersonal },
              )
            }
            onCancel={() => {
              setSelected(null);
              setAlsoPersonal(false);
            }}
          />
        ) : null}
      </Modal>

      <Modal
        open={Boolean(rateTarget)}
        onClose={() => setRateTarget(null)}
        title={rateTarget ? `Оценка «${rateTarget.title}»` : 'Оценка'}
      >
        {rateTarget ? (
          <RatingForm
            initialRating={mineOf(rateTarget)?.rating}
            initialComment={mineOf(rateTarget)?.comment ?? undefined}
            initialDate={mineOf(rateTarget)?.watchedAt ?? currentDateInTimeZone(timeZone)}
            submitLabel="Сохранить"
            alsoPersonal={alsoPersonal}
            onAlsoPersonalChange={setAlsoPersonal}
            alsoPersonalLabel={alsoPersonalLabel(rateTarget.mediaKind)}
            onSubmit={(payload) =>
              void saveRating(
                { kind: rateTarget.mediaKind, ref: rateTarget.mediaRef },
                payload,
                { alsoPersonal },
              )
            }
            onCancel={() => {
              setRateTarget(null);
              setAlsoPersonal(false);
            }}
          />
        ) : null}
      </Modal>

      <Modal
        open={Boolean(attachTarget)}
        onClose={() => setAttachTarget(null)}
        title={attachTarget ? `Обсуждение «${attachTarget.title}»` : 'Обсуждение'}
      >
        <form className="space-y-3" onSubmit={submitAttach}>
          <label htmlFor={attachTitleId} className="text-sm font-medium">
            Название обсуждения
          </label>
          <Input
            id={attachTitleId}
            value={attachTitle}
            maxLength={200}
            onChange={(event) => setAttachTitle(event.target.value)}
          />
          <div className="flex items-center gap-2">
            <Button type="submit" disabled={pending}>
              Прикрепить
            </Button>
            <Button type="button" variant="outline" onClick={() => setAttachTarget(null)}>
              Отмена
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={overwritePrompt}
        onClose={dismissOverwrite}
        title="Перезаписать личную оценку?"
      >
        <p className="text-sm text-muted-foreground">
          У вас уже есть личная оценка этого медиа. При сохранении она будет заменена
          значениями из формы.
        </p>
        <div className="mt-4 flex items-center gap-2">
          <Button type="button" disabled={pending} onClick={() => void confirmOverwrite()}>
            Перезаписать
          </Button>
          <Button type="button" variant="outline" onClick={dismissOverwrite}>
            Отмена
          </Button>
        </div>
      </Modal>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
