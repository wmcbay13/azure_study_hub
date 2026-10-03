import { describe, expect, it } from 'vitest'
import { content } from '@/content'
import { emptyProgress } from '@/progress/types'
import { filterQuestions, pickExamQuestions, pickQuestions } from './session'
import { scoreExam } from './exam'
import { rng } from '@/test/rng'

describe('content', () => {
  it('loads with every question explaining every distractor', () => {
    expect(content.questions.length).toBeGreaterThanOrEqual(150)
    for (const q of content.questions) expect(q.explanation.length).toBeGreaterThan(40)
  })
})

describe('session selection', () => {
  it('filters by domain, difficulty and source', () => {
    const p = emptyProgress()
    const net = filterQuestions(content, p, { domains: ['networking'], difficulties: ['exam'], count: 10 })
    expect(net.length).toBeGreaterThan(0)
    expect(net.every((q) => q.domain === 'networking' && q.difficulty === 'exam')).toBe(true)

    p.questionAttempts[net[0].id] = { attempts: 1, correct: 0, lastResult: false, lastAt: 0 }
    expect(filterQuestions(content, p, { source: 'incorrect', count: 10 }).map((q) => q.id)).toEqual([net[0].id])
    expect(filterQuestions(content, p, { source: 'unanswered', count: 500 }).some((q) => q.id === net[0].id)).toBe(false)
  })

  it('picks the requested count without duplicates', () => {
    const qs = pickQuestions(content.questions, 25, rng(1))
    expect(qs).toHaveLength(25)
    expect(new Set(qs.map((q) => q.id)).size).toBe(25)
  })

  it('builds weighted exams that cover every domain', () => {
    const qs = pickExamQuestions(content, 40, rng(7))
    expect(qs).toHaveLength(40)
    expect(new Set(qs.map((q) => q.domain)).size).toBe(5)
    expect(new Set(qs.map((q) => q.id)).size).toBe(40)
  })
})

describe('scoreExam', () => {
  it('scores correct answers and groups by domain', () => {
    const [q1, q2] = content.questions.filter((q) => q.questionType === 'single').slice(0, 2)
    const wrong = q2.options.find((o) => o.id !== q2.correctAnswer)!.id
    const r = scoreExam(
      { id: 'x', startedAt: 0, timeLimitSec: 600, questionIds: [q1.id, q2.id], answers: { [q1.id]: q1.correctAnswer as string, [q2.id]: wrong }, flagged: [], current: 0 },
      content,
      120_000,
    )
    expect(r.score).toBe(50)
    expect(r.durationSec).toBe(120)
    expect(r.correct).toEqual({ [q1.id]: true, [q2.id]: false })
  })
})
