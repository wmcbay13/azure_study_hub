import { Question, type Question as Q } from '@/content/schema'

const base = {
  domain: 'networking',
  objectiveId: 'vnets',
  topic: 'vnet-peering',
  services: [],
  difficulty: 'exam',
  explanation: 'Because.',
  examTakeaway: 'Remember it.',
  relatedTopics: ['vnet-peering'],
  documentationLinks: [{ title: 'Docs', url: 'https://learn.microsoft.com/azure/' }],
} as const

export const q = (over: Record<string, unknown>): Q => Question.parse({ ...base, ...over })

export const single = q({
  id: 's1',
  questionType: 'single',
  question: 'Pick b',
  options: [
    { id: 'a', text: 'A' },
    { id: 'b', text: 'B' },
    { id: 'c', text: 'C' },
  ],
  correctAnswer: 'b',
  incorrectAnswerExplanations: { a: 'no', c: 'no' },
})

export const multi = q({
  id: 'm1',
  questionType: 'multi',
  question: 'Pick a and c',
  options: [
    { id: 'a', text: 'A' },
    { id: 'b', text: 'B' },
    { id: 'c', text: 'C' },
  ],
  correctAnswer: ['a', 'c'],
  incorrectAnswerExplanations: { b: 'no' },
})

export const ordering = q({
  id: 'o1',
  questionType: 'ordering',
  question: 'Order',
  options: [
    { id: 'x', text: 'X' },
    { id: 'y', text: 'Y' },
    { id: 'z', text: 'Z' },
  ],
  correctAnswer: ['y', 'x', 'z'],
  incorrectAnswerExplanations: { x: '2nd', y: '1st', z: '3rd' },
})

export const matching = q({
  id: 'mt1',
  questionType: 'matching',
  question: 'Match',
  options: [
    { id: 'p', text: 'P' },
    { id: 'r', text: 'R' },
  ],
  matchTargets: [
    { id: 't1', text: 'T1' },
    { id: 't2', text: 'T2' },
  ],
  correctAnswer: { p: 't2', r: 't1' },
  incorrectAnswerExplanations: { p: 'p→t2', r: 'r→t1' },
})
