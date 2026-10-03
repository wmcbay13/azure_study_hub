/** Builds practice question sets from filters. Pure; used by Practice and Exam modes. */
import type { ContentIndex } from '@/content/build'
import type { Difficulty, DomainId, Question, QuestionType } from '@/content/schema'
import type { UserProgress } from '@/progress/types'
import { topicStats, weakTopics } from '@/progress/analytics'
import { shuffle } from './random'

export type SessionSource = 'all' | 'unanswered' | 'incorrect' | 'weak'

export interface SessionFilters {
  domains?: DomainId[]
  topics?: string[]
  services?: string[]
  difficulties?: Difficulty[]
  types?: QuestionType[]
  source?: SessionSource
  count: number
}

export function filterQuestions(content: ContentIndex, progress: UserProgress, f: SessionFilters): Question[] {
  const weak = f.source === 'weak' ? new Set(weakTopics(topicStats(progress, content), 8).map((s) => s.topic.slug)) : null
  return content.questions.filter((q) => {
    if (f.domains?.length && !f.domains.includes(q.domain)) return false
    if (f.topics?.length && !f.topics.includes(q.topic)) return false
    if (f.services?.length && !q.services.some((s) => f.services!.includes(s))) return false
    if (f.difficulties?.length && !f.difficulties.includes(q.difficulty)) return false
    if (f.types?.length && !f.types.includes(q.questionType)) return false
    const a = progress.questionAttempts[q.id]
    if (f.source === 'unanswered' && a) return false
    if (f.source === 'incorrect' && (!a || a.lastResult)) return false
    if (weak && !weak.has(q.topic)) return false
    return true
  })
}

/**
 * Picks `count` questions. Case-study questions stay together and in order so the
 * shared scenario reads naturally.
 */
export function pickQuestions(pool: Question[], count: number, rand: () => number = Math.random): Question[] {
  const singles = shuffle(pool.filter((q) => !q.caseStudyId), rand)
  const picked = singles.slice(0, count)
  const shortfall = count - picked.length
  if (shortfall > 0) {
    const caseQs = pool.filter((q) => q.caseStudyId)
    picked.push(...caseQs.slice(0, shortfall))
  }
  return shuffle(picked, rand)
}

/**
 * Exam selection weighted by domain weight, so an exam mirrors the outline.
 * Includes at most one case study block.
 */
export function pickExamQuestions(content: ContentIndex, count: number, rand: () => number = Math.random): Question[] {
  const domains = content.objectives.domains
  const totalWeight = domains.reduce((s, d) => s + d.weightValue, 0)
  const caseStudies = shuffle(content.caseStudies, rand)
  const caseBlock = caseStudies.length && count >= 20
    ? content.questions.filter((q) => q.caseStudyId === caseStudies[0].id)
    : []
  const remaining = count - caseBlock.length
  const chosen: Question[] = []
  for (const d of domains) {
    const n = Math.round((d.weightValue / totalWeight) * remaining)
    chosen.push(...shuffle(content.questions.filter((q) => q.domain === d.id && !q.caseStudyId), rand).slice(0, n))
  }
  // Rounding can leave us short or long; top up from anything unused or trim.
  const used = new Set(chosen.map((q) => q.id))
  const extra = shuffle(content.questions.filter((q) => !used.has(q.id) && !q.caseStudyId), rand)
  while (chosen.length < remaining && extra.length) chosen.push(extra.pop()!)
  return [...shuffle(chosen.slice(0, remaining), rand), ...caseBlock]
}
