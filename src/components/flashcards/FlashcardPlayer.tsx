import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, ChevronLeft, ChevronRight, RotateCcw, Shuffle } from 'lucide-react'
import type { Flashcard } from '@/content/schema'
import { content } from '@/content'
import { BEYOND_LABEL, isBeyondFlashcard } from '@/content/scope'
import { useProgress } from '@/progress/store'
import { shuffle as shuffleArr } from '@/lib/random'
import { cn } from '@/lib/cn'
import { Badge, Button, ProgressBar } from '../ui'

/** Flip-card player with shuffle, navigation, Know It / Needs Review and keyboard shortcuts. */
export function FlashcardPlayer({ cards, startId, compact = false }: { cards: Flashcard[]; startId?: string; compact?: boolean }) {
  const [order, setOrder] = useState(cards)
  const [index, setIndex] = useState(() => Math.max(0, cards.findIndex((c) => c.id === startId)))
  const [flipped, setFlipped] = useState(false)
  const states = useProgress((s) => s.flashcards)
  const mark = useProgress((s) => s.markFlashcard)

  // Reset when the deck/filter changes.
  const key = cards.map((c) => c.id).join(',')
  useEffect(() => {
    setOrder(cards)
    setIndex(Math.max(0, cards.findIndex((c) => c.id === startId)))
    setFlipped(false)
  }, [key])

  const card = order[index]
  const go = useCallback(
    (d: number) => {
      setFlipped(false)
      setIndex((i) => Math.min(Math.max(i + d, 0), order.length - 1))
    },
    [order.length],
  )
  const answer = useCallback(
    (status: 'know' | 'review') => {
      if (!card) return
      mark(card.id, status)
      if (index < order.length - 1) go(1)
    },
    [card, mark, index, order.length, go],
  )

  useEffect(() => {
    if (compact) return
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        setFlipped((f) => !f)
      } else if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
      else if (e.key === '1') answer('know')
      else if (e.key === '2') answer('review')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, answer, compact])

  if (!card) return null
  const st = states[card.id]?.status
  const known = order.filter((c) => states[c.id]?.status === 'know').length
  const topic = card.topic ? content.topicBySlug.get(card.topic) : undefined

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-sm">
        <span className="shrink-0 font-medium tabular-nums text-muted">
          {index + 1} / {order.length}
        </span>
        <ProgressBar value={((index + 1) / order.length) * 100} />
        <span className="shrink-0 tabular-nums text-success" title="Cards marked Know It in this set">
          {known} known
        </span>
      </div>

      <div className="flip-scene">
        <button
          onClick={() => setFlipped((f) => !f)}
          className={cn('flip-card relative grid w-full text-left', compact ? 'min-h-56' : 'min-h-72 sm:min-h-80', flipped && 'is-flipped')}
          aria-label={flipped ? 'Show question' : 'Show answer'}
        >
          <div className="flip-face col-start-1 row-start-1 flex flex-col rounded-lg border border-border bg-surface p-6 shadow-card sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <Badge color={card.type === 'scenario' ? 'purple' : 'blue'}>{card.type === 'scenario' ? 'Scenario' : 'Definition'}</Badge>
              {isBeyondFlashcard(content, card) && <Badge color="amber">{BEYOND_LABEL}</Badge>}
              {st && <Badge color={st === 'know' ? 'green' : 'amber'}>{st === 'know' ? 'Known' : 'Needs review'}</Badge>}
            </div>
            <p className={cn('my-auto py-6 text-center font-semibold leading-snug', compact ? 'text-lg' : 'text-xl sm:text-2xl')}>{card.front}</p>
            <p className="text-center text-xs text-subtle">Click or press Space to flip</p>
          </div>
          <div className="flip-face flip-back col-start-1 row-start-1 flex flex-col rounded-lg border border-accent/40 bg-accent-soft p-6 shadow-card sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">Answer</p>
            <p className={cn('my-auto py-4 leading-relaxed', compact ? 'text-base' : 'text-lg')}>{card.back}</p>
            {card.versionNote && <p className="text-xs text-warning">Note: {card.versionNote}</p>}
          </div>
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          <Button onClick={() => go(-1)} disabled={index === 0} aria-label="Previous card">
            <ChevronLeft className="size-4" />
          </Button>
          <Button onClick={() => go(1)} disabled={index === order.length - 1} aria-label="Next card">
            <ChevronRight className="size-4" />
          </Button>
          <Button
            onClick={() => {
              setOrder(shuffleArr(order))
              setIndex(0)
              setFlipped(false)
            }}
            title="Shuffle"
          >
            <Shuffle className="size-4" /> <span className="hidden sm:inline">Shuffle</span>
          </Button>
          {index > 0 && (
            <Button
              variant="ghost"
              onClick={() => {
                setIndex(0)
                setFlipped(false)
              }}
              title="Restart"
            >
              <RotateCcw className="size-4" />
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={() => answer('review')} className="border-warning/40 text-warning">
            Needs Review
          </Button>
          <Button variant="primary" onClick={() => answer('know')}>
            <Check className="size-4" /> Know It
          </Button>
        </div>
      </div>
      {!compact && (
        <p className="text-xs text-subtle">
          Shortcuts: Space flip · ← → navigate · 1 Know It · 2 Needs Review
          {topic && (
            <>
              {' '}
              · Topic:{' '}
              <Link className="text-accent hover:underline" to={`/topics/${topic.slug}`}>
                {topic.title}
              </Link>
            </>
          )}
        </p>
      )}
    </div>
  )
}
