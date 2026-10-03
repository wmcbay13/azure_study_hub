import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { content } from '@/content'
import { DECKS, type DeckId } from '@/content/schema'
import { useProgress } from '@/progress/store'
import { cn } from '@/lib/cn'
import { Card, Chip, EmptyState, PageHeader, ProgressBar } from '@/components/ui'
import { FlashcardPlayer } from '@/components/flashcards/FlashcardPlayer'
import { Icon } from '@/components/Icon'

export const DECK_META: Record<DeckId, { label: string; icon: string }> = {
  identity: { label: 'Identity', icon: 'fingerprint' },
  governance: { label: 'Governance', icon: 'gavel' },
  storage: { label: 'Storage', icon: 'database' },
  compute: { label: 'Compute', icon: 'server' },
  networking: { label: 'Networking', icon: 'network' },
  monitoring: { label: 'Monitoring', icon: 'activity' },
  'backup-recovery': { label: 'Backup & Recovery', icon: 'database-backup' },
  limits: { label: 'Common Azure Limits', icon: 'gauge' },
  terminology: { label: 'Azure Terminology', icon: 'book-open' },
  'confused-services': { label: 'Frequently Confused', icon: 'scale' },
  'exam-traps': { label: 'Exam Traps', icon: 'triangle-alert' },
}

type Mode = 'all' | 'review' | 'unseen'

export function FlashcardsPage() {
  const [params] = useSearchParams()
  const startCard = params.get('card') ?? undefined
  const startDeck = startCard ? content.flashcards.find((c) => c.id === startCard)?.deck : undefined
  const [deck, setDeck] = useState<DeckId | 'all'>(startDeck ?? 'all')
  const [topic, setTopic] = useState<string>('all')
  const [mode, setMode] = useState<Mode>('all')
  const states = useProgress((s) => s.flashcards)

  const deckCards = useMemo(() => content.flashcards.filter((c) => deck === 'all' || c.deck === deck), [deck])
  const topicsInDeck = useMemo(
    () => [...new Set(deckCards.map((c) => c.topic).filter(Boolean) as string[])].map((s) => content.topicBySlug.get(s)!).filter(Boolean),
    [deckCards],
  )
  const cards = useMemo(
    () =>
      deckCards.filter(
        (c) =>
          (topic === 'all' || c.topic === topic) &&
          (mode === 'all' || (mode === 'review' ? states[c.id]?.status === 'review' : !states[c.id])),
      ),
    // Mode filters are computed when the mode/deck changes, not on every mark, so the set doesn't shrink mid-review.
    [deckCards, topic, mode],
  )

  const reviewCount = content.flashcards.filter((c) => states[c.id]?.status === 'review').length

  return (
    <div>
      <PageHeader
        icon="square-stack"
        title="Flashcards"
        description={`${content.flashcards.length} cards across ${DECKS.length} decks — definitions and scenario cards. Mark each card Know It or Needs Review to track mastery.`}
      />

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="min-w-0">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-subtle">Decks</h2>
          <ul className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
            {(['all', ...DECKS] as const).map((d) => {
              const list = d === 'all' ? content.flashcards : content.flashcards.filter((c) => c.deck === d)
              if (!list.length) return null
              const known = list.filter((c) => states[c.id]?.status === 'know').length
              const meta = d === 'all' ? { label: 'All decks', icon: 'layers' } : DECK_META[d]
              return (
                <li key={d} className="shrink-0">
                  <button
                    onClick={() => {
                      setDeck(d)
                      setTopic('all')
                    }}
                    aria-pressed={deck === d}
                    className={cn(
                      'w-56 rounded-xl border p-3 text-left transition-colors lg:w-full',
                      deck === d ? 'border-accent bg-accent-soft' : 'border-border bg-surface hover:bg-surface-2',
                    )}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <Icon name={meta.icon} className={cn('size-4', deck === d ? 'text-accent' : 'text-subtle')} />
                      {meta.label}
                      <span className="ml-auto text-xs text-subtle tabular-nums">
                        {known}/{list.length}
                      </span>
                    </span>
                    <ProgressBar value={(known / list.length) * 100} className="mt-2 h-1.5" color="var(--success)" />
                  </button>
                </li>
              )
            })}
          </ul>
        </aside>

        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Chip active={mode === 'all'} onClick={() => setMode('all')}>
              All cards
            </Chip>
            <Chip active={mode === 'review'} onClick={() => setMode('review')}>
              Review missed ({reviewCount})
            </Chip>
            <Chip active={mode === 'unseen'} onClick={() => setMode('unseen')}>
              Not yet seen
            </Chip>
            {topicsInDeck.length > 1 && (
              <label className="relative ml-auto">
                <span className="sr-only">Filter by topic</span>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="h-9 appearance-none rounded-xl border border-border bg-surface pr-8 pl-3 text-sm"
                >
                  <option value="all">All topics</option>
                  {topicsInDeck.map((t) => (
                    <option key={t.slug} value={t.slug}>
                      {t.title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute top-2.5 right-2.5 size-4 text-subtle" aria-hidden />
              </label>
            )}
          </div>
          {cards.length ? (
            <FlashcardPlayer cards={cards} startId={startCard} />
          ) : (
            <Card className="p-2">
              <EmptyState icon="badge-check" title={mode === 'review' ? 'Nothing to review here — nice work!' : 'No cards match these filters.'} />
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
