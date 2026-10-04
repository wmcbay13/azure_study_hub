import { describe, expect, it } from 'vitest'
import { content } from '@/content'
import { emptyProgress } from '@/progress/types'
import { domainStats } from '@/progress/analytics'
import { filterQuestions, pickExamQuestions } from '@/lib/session'
import { isBeyondQuestion } from './scope'
import { rng } from '@/test/rng'

const beyondIds = new Set(content.questions.filter((q) => isBeyondQuestion(content, q)).map((q) => q.id))

describe('beyond-exam content (AKS)', () => {
  it('exists', () => {
    expect(content.topicBySlug.get('aks')?.examScope).toBe('beyond')
    expect(beyondIds.size).toBeGreaterThan(0)
  })

  it('never appears in practice exams', () => {
    for (let seed = 1; seed <= 20; seed++)
      expect(pickExamQuestions(content, 50, rng(seed)).some((q) => beyondIds.has(q.id))).toBe(false)
  })

  it('is excluded from default sessions but available on request', () => {
    const p = emptyProgress()
    expect(filterQuestions(content, p, { count: 500 }).some((q) => beyondIds.has(q.id))).toBe(false)
    expect(filterQuestions(content, p, { count: 500, includeBeyond: true }).some((q) => beyondIds.has(q.id))).toBe(true)
    expect(filterQuestions(content, p, { count: 500, topics: ['aks'] }).every((q) => beyondIds.has(q.id))).toBe(true)
  })

  it("doesn't affect AZ-104 readiness", () => {
    const p = emptyProgress()
    for (const id of beyondIds) p.questionAttempts[id] = { attempts: 1, correct: 1, lastResult: true, lastAt: 0 }
    p.topicStatus.aks = 'mastered'
    expect(domainStats(p, content).every((d) => d.readiness === 0 && d.accuracy.attempts === 0)).toBe(true)
  })
})
