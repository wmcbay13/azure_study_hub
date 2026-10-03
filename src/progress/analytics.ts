/**
 * Pure analytics over progress + content. No React, no storage: easy to test
 * and reusable if progress moves server-side.
 */
import type { ContentIndex } from '@/content/build'
import type { DomainId, Flashcard, Topic } from '@/content/schema'
import { dayKey } from '@/lib/date'
import type { TopicStatus, UserProgress } from './types'

export interface Accuracy {
  correct: number
  attempts: number
  answered: number
  /** 0–100, or null when nothing has been attempted. */
  pct: number | null
}

export function accuracyFor(progress: UserProgress, questionIds: string[]): Accuracy {
  let correct = 0
  let attempts = 0
  let answered = 0
  for (const id of questionIds) {
    const a = progress.questionAttempts[id]
    if (!a) continue
    answered++
    correct += a.correct
    attempts += a.attempts
  }
  return { correct, attempts, answered, pct: attempts ? (correct / attempts) * 100 : null }
}

const STATUS_SCORE: Record<TopicStatus, number> = { notStarted: 0, learning: 0.3, needsReview: 0.5, mastered: 1 }

export function flashcardDomain(card: Flashcard, content: ContentIndex): DomainId | undefined {
  if (card.topic) return content.topicBySlug.get(card.topic)?.domain
  const byDeck: Partial<Record<Flashcard['deck'], DomainId>> = {
    identity: 'identity-governance',
    governance: 'identity-governance',
    storage: 'storage',
    compute: 'compute',
    networking: 'networking',
    monitoring: 'monitoring',
    'backup-recovery': 'monitoring',
  }
  return byDeck[card.deck]
}

export interface DomainStats {
  id: DomainId
  accuracy: Accuracy
  totalQuestions: number
  topicsTotal: number
  topicsMastered: number
  topicsStarted: number
  cardsTotal: number
  cardsKnown: number
  /** 0–100 composite readiness. */
  readiness: number
}

export function domainStats(progress: UserProgress, content: ContentIndex): DomainStats[] {
  return content.objectives.domains.map((d) => {
    const qs = content.questions.filter((q) => q.domain === d.id)
    const topics = content.topics.filter((t) => t.domain === d.id)
    const cards = content.flashcards.filter((c) => flashcardDomain(c, content) === d.id)
    const accuracy = accuracyFor(progress, qs.map((q) => q.id))
    const cardsKnown = cards.filter((c) => progress.flashcards[c.id]?.status === 'know').length
    const topicScore = topics.length
      ? topics.reduce((sum, t) => sum + STATUS_SCORE[progress.topicStatus[t.slug] ?? 'notStarted'], 0) / topics.length
      : 0
    // Accuracy only counts fully once a reasonable sample of the domain has been answered.
    const sample = Math.min(15, qs.length) || 1
    const questionScore = ((accuracy.pct ?? 0) / 100) * Math.min(1, accuracy.answered / sample)
    const cardScore = cards.length ? cardsKnown / cards.length : 0
    return {
      id: d.id,
      accuracy,
      totalQuestions: qs.length,
      topicsTotal: topics.length,
      topicsMastered: topics.filter((t) => progress.topicStatus[t.slug] === 'mastered').length,
      topicsStarted: topics.filter((t) => (progress.topicStatus[t.slug] ?? 'notStarted') !== 'notStarted').length,
      cardsTotal: cards.length,
      cardsKnown,
      readiness: Math.round((questionScore * 0.6 + topicScore * 0.25 + cardScore * 0.15) * 100),
    }
  })
}

export function overallReadiness(stats: DomainStats[], content: ContentIndex): number {
  const weights = new Map(content.objectives.domains.map((d) => [d.id, d.weightValue]))
  const total = stats.reduce((s, d) => s + (weights.get(d.id) ?? 0), 0)
  return Math.round(stats.reduce((s, d) => s + d.readiness * (weights.get(d.id) ?? 0), 0) / (total || 1))
}

export interface TopicStats {
  topic: Topic
  accuracy: Accuracy
  status: TopicStatus
}

export function topicStats(progress: UserProgress, content: ContentIndex): TopicStats[] {
  return content.topics.map((topic) => ({
    topic,
    status: progress.topicStatus[topic.slug] ?? 'notStarted',
    accuracy: accuracyFor(
      progress,
      content.questions.filter((q) => q.topic === topic.slug).map((q) => q.id),
    ),
  }))
}

/** Topics with enough attempts, lowest accuracy first; "Needs Review" topics are always included. */
export function weakTopics(stats: TopicStats[], limit = 5): TopicStats[] {
  return stats
    .filter((s) => (s.accuracy.attempts >= 2 && (s.accuracy.pct ?? 100) < 75) || s.status === 'needsReview')
    .sort((a, b) => (a.accuracy.pct ?? 50) - (b.accuracy.pct ?? 50))
    .slice(0, limit)
}

export function strongTopics(stats: TopicStats[], limit = 5): TopicStats[] {
  return stats
    .filter((s) => s.accuracy.attempts >= 3 && (s.accuracy.pct ?? 0) >= 80)
    .sort((a, b) => (b.accuracy.pct ?? 0) - (a.accuracy.pct ?? 0) || b.accuracy.attempts - a.accuracy.attempts)
    .slice(0, limit)
}

export function weakDomains(stats: DomainStats[]): DomainStats[] {
  return stats.filter((d) => d.accuracy.attempts >= 3).sort((a, b) => (a.accuracy.pct ?? 0) - (b.accuracy.pct ?? 0))
}

/** Next topic to study: needs-review first, then weak, then in-progress, then the first untouched topic. */
export function recommendedTopic(progress: UserProgress, content: ContentIndex): { topic: Topic; reason: string } | null {
  const stats = topicStats(progress, content)
  const review = stats.find((s) => s.status === 'needsReview')
  if (review) return { topic: review.topic, reason: 'You marked this topic as Needs Review.' }
  const weak = weakTopics(stats, 1)[0]
  if (weak) return { topic: weak.topic, reason: `Your accuracy here is ${Math.round(weak.accuracy.pct ?? 0)}%.` }
  const learning = stats.find((s) => s.status === 'learning')
  if (learning) return { topic: learning.topic, reason: 'Pick up where you left off.' }
  // Untouched topics, heaviest exam domain first.
  const order = [...content.objectives.domains].sort((a, b) => b.weightValue - a.weightValue).map((d) => d.id)
  const next = stats
    .filter((s) => s.status === 'notStarted')
    .sort((a, b) => order.indexOf(a.topic.domain) - order.indexOf(b.topic.domain))[0]
  if (next) return { topic: next.topic, reason: 'Not started yet — and in a heavily weighted domain.' }
  return stats[0] ? { topic: stats[0].topic, reason: 'Everything is mastered — keep it fresh.' } : null
}

export function streak(studyDays: string[], now = Date.now()): { current: number; longest: number } {
  const days = new Set(studyDays)
  const DAY = 86_400_000
  let current = 0
  // A streak survives until the end of today even if today has no activity yet.
  let t = days.has(dayKey(now)) ? now : now - DAY
  while (days.has(dayKey(t))) {
    current++
    t -= DAY
  }
  const sorted = [...days].sort()
  let longest = 0
  let run = 0
  let prev: number | null = null
  for (const d of sorted) {
    const ts = new Date(`${d}T12:00:00`).getTime()
    run = prev !== null && Math.round((ts - prev) / DAY) === 1 ? run + 1 : 1
    longest = Math.max(longest, run)
    prev = ts
  }
  return { current, longest: Math.max(longest, current) }
}

export function totals(progress: UserProgress) {
  const attempts = Object.values(progress.questionAttempts)
  const totalAttempts = attempts.reduce((s, a) => s + a.attempts, 0)
  const totalCorrect = attempts.reduce((s, a) => s + a.correct, 0)
  const cards = Object.values(progress.flashcards)
  return {
    questionsAnswered: attempts.length,
    totalAttempts,
    totalCorrect,
    accuracy: totalAttempts ? (totalCorrect / totalAttempts) * 100 : null,
    cardsReviewed: cards.length,
    cardsKnown: cards.filter((c) => c.status === 'know').length,
    cardsReview: cards.filter((c) => c.status === 'review').length,
    topicsStudied: Object.values(progress.topicStatus).filter((s) => s !== 'notStarted').length,
    topicsMastered: Object.values(progress.topicStatus).filter((s) => s === 'mastered').length,
  }
}
