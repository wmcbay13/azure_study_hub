import { describe, expect, it } from 'vitest'
import { accuracyFor, streak, totals, weakTopics, type TopicStats } from './analytics'
import { emptyProgress } from './types'
import { dayKey } from '@/lib/date'

const DAY = 86_400_000

describe('accuracyFor', () => {
  it('aggregates attempts and returns null with no data', () => {
    const p = emptyProgress()
    expect(accuracyFor(p, ['a']).pct).toBeNull()
    p.questionAttempts = { a: { attempts: 2, correct: 1, lastResult: true, lastAt: 0 }, b: { attempts: 2, correct: 2, lastResult: true, lastAt: 0 } }
    const acc = accuracyFor(p, ['a', 'b', 'c'])
    expect(acc).toMatchObject({ correct: 3, attempts: 4, answered: 2, pct: 75 })
  })
})

describe('streak', () => {
  const now = new Date('2026-03-10T15:00:00').getTime()
  it('counts consecutive days ending today', () => {
    const days = [dayKey(now), dayKey(now - DAY), dayKey(now - 2 * DAY)]
    expect(streak(days, now).current).toBe(3)
  })
  it('keeps a streak alive when only yesterday is studied', () => {
    expect(streak([dayKey(now - DAY), dayKey(now - 2 * DAY)], now).current).toBe(2)
  })
  it('breaks on a gap and reports the longest run', () => {
    const days = [dayKey(now - 5 * DAY), dayKey(now - 4 * DAY), dayKey(now - 3 * DAY), dayKey(now)]
    expect(streak(days, now)).toEqual({ current: 1, longest: 3 })
  })
})

describe('weakTopics', () => {
  const mk = (slug: string, pct: number | null, attempts: number, status: TopicStats['status'] = 'learning') =>
    ({ topic: { slug } as TopicStats['topic'], status, accuracy: { pct, attempts, correct: 0, answered: attempts } }) as TopicStats
  it('includes low-accuracy and needs-review topics, lowest first', () => {
    const res = weakTopics([mk('a', 90, 5), mk('b', 40, 3), mk('c', 60, 2), mk('d', null, 0, 'needsReview'), mk('e', 10, 1)])
    expect(res.map((r) => r.topic.slug)).toEqual(['b', 'd', 'c'])
  })
})

describe('totals', () => {
  it('summarises progress', () => {
    const p = emptyProgress()
    p.flashcards = { x: { status: 'know', seen: 1, lastAt: 0 }, y: { status: 'review', seen: 1, lastAt: 0 } }
    p.topicStatus = { a: 'mastered', b: 'learning', c: 'notStarted' }
    expect(totals(p)).toMatchObject({ cardsKnown: 1, cardsReview: 1, topicsStudied: 2, topicsMastered: 1, accuracy: null })
  })
})
