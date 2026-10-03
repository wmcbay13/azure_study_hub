import { describe, expect, it } from 'vitest'
import { Question } from '@/content/schema'
import { describeCorrect, grade, isAnswered } from './grading'
import { matching, multi, ordering, single } from '@/test/fixtures'

describe('grade', () => {
  it('single choice', () => {
    expect(grade(single, 'b')).toBe(true)
    expect(grade(single, 'a')).toBe(false)
    expect(grade(single, null)).toBe(false)
  })
  it('multi choice requires the exact set in any order', () => {
    expect(grade(multi, ['c', 'a'])).toBe(true)
    expect(grade(multi, ['a'])).toBe(false)
    expect(grade(multi, ['a', 'b', 'c'])).toBe(false)
  })
  it('ordering requires exact order', () => {
    expect(grade(ordering, ['y', 'x', 'z'])).toBe(true)
    expect(grade(ordering, ['x', 'y', 'z'])).toBe(false)
  })
  it('matching requires every pair', () => {
    expect(grade(matching, { p: 't2', r: 't1' })).toBe(true)
    expect(grade(matching, { p: 't2', r: 't2' })).toBe(false)
    expect(isAnswered(matching, { p: 't2' })).toBe(false)
  })
  it('describes correct answers', () => {
    expect(describeCorrect(ordering)).toEqual(['1. Y', '2. X', '3. Z'])
    expect(describeCorrect(matching)).toEqual(['P → T2', 'R → T1'])
  })
})

describe('Question schema', () => {
  it('rejects a missing distractor explanation', () => {
    const r = Question.safeParse({ ...single, incorrectAnswerExplanations: { a: 'no' } })
    expect(r.success).toBe(false)
  })
  it('rejects a correct answer that is not an option', () => {
    const r = Question.safeParse({ ...single, correctAnswer: 'zz' })
    expect(r.success).toBe(false)
  })
})
