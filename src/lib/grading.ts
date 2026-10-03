import type { CorrectAnswer, Question } from '@/content/schema'
import type { GivenAnswer } from '@/progress/types'

/** True when the question expects more than one selected option. */
export function isMultiSelect(q: Question): boolean {
  return q.questionType === 'multi' || (q.questionType === 'caseStudy' && Array.isArray(q.correctAnswer))
}

export function isAnswered(q: Question, given: GivenAnswer | undefined): boolean {
  if (given == null) return false
  if (q.questionType === 'ordering') return Array.isArray(given) && given.length === q.options.length
  if (q.questionType === 'matching')
    return typeof given === 'object' && !Array.isArray(given) && q.options.every((o) => !!given[o.id])
  if (Array.isArray(given)) return given.length > 0
  return typeof given === 'string' && given.length > 0
}

export function grade(q: Question, given: GivenAnswer | undefined): boolean {
  if (!isAnswered(q, given)) return false
  const ca: CorrectAnswer = q.correctAnswer
  switch (q.questionType) {
    case 'ordering':
      return Array.isArray(ca) && Array.isArray(given) && ca.every((id, i) => given[i] === id)
    case 'matching':
      return (
        typeof ca === 'object' && !Array.isArray(ca) &&
        typeof given === 'object' && given !== null && !Array.isArray(given) &&
        q.options.every((o) => given[o.id] === ca[o.id])
      )
    default:
      if (Array.isArray(ca)) {
        const g = Array.isArray(given) ? given : [given as string]
        return g.length === ca.length && ca.every((id) => g.includes(id))
      }
      return (Array.isArray(given) ? given[0] : given) === ca
  }
}

/** Human-readable correct answer, for review screens. */
export function describeCorrect(q: Question): string[] {
  const text = (id: string) => q.options.find((o) => o.id === id)?.text ?? id
  const ca = q.correctAnswer
  if (q.questionType === 'matching' && typeof ca === 'object' && !Array.isArray(ca)) {
    const target = (id: string) => q.matchTargets?.find((t) => t.id === id)?.text ?? id
    return q.options.map((o) => `${o.text} → ${target(ca[o.id])}`)
  }
  if (q.questionType === 'ordering' && Array.isArray(ca)) return ca.map((id, i) => `${i + 1}. ${text(id)}`)
  return (Array.isArray(ca) ? ca : [ca as string]).map(text)
}

export const isCorrectOption = (q: Question, optionId: string) =>
  Array.isArray(q.correctAnswer) ? q.correctAnswer.includes(optionId) : q.correctAnswer === optionId
