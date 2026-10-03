import type { ContentIndex } from '@/content/build'
import type { DomainId } from '@/content/schema'
import type { ActiveExam, PracticeExamResult } from '@/progress/types'
import { grade } from './grading'

export function scoreExam(exam: ActiveExam, content: ContentIndex, finishedAt = Date.now()): PracticeExamResult {
  const correct: Record<string, boolean> = {}
  const byDomain: PracticeExamResult['byDomain'] = {}
  for (const id of exam.questionIds) {
    const q = content.questionById.get(id)
    if (!q) continue
    const ok = grade(q, exam.answers[id])
    correct[id] = ok
    const d = (byDomain[q.domain as DomainId] ??= { correct: 0, total: 0 })
    d.total++
    if (ok) d.correct++
  }
  const n = exam.questionIds.length
  return {
    id: exam.id,
    startedAt: exam.startedAt,
    finishedAt,
    durationSec: Math.min(exam.timeLimitSec, Math.round((finishedAt - exam.startedAt) / 1000)),
    timeLimitSec: exam.timeLimitSec,
    questionIds: exam.questionIds,
    answers: exam.answers,
    correct,
    flagged: exam.flagged,
    score: n ? (Object.values(correct).filter(Boolean).length / n) * 100 : 0,
    byDomain,
  }
}
