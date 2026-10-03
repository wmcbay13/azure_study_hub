import type { DomainId } from '@/content/schema'

export const TOPIC_STATUSES = ['notStarted', 'learning', 'needsReview', 'mastered'] as const
export type TopicStatus = (typeof TOPIC_STATUSES)[number]

export const TOPIC_STATUS_LABEL: Record<TopicStatus, string> = {
  notStarted: 'Not Started',
  learning: 'Learning',
  needsReview: 'Needs Review',
  mastered: 'Mastered',
}

export interface QuestionAttempt {
  attempts: number
  correct: number
  lastResult: boolean
  lastAt: number
}

export interface FlashcardState {
  status: 'know' | 'review'
  seen: number
  lastAt: number
}

export type ActivityKind = 'topic' | 'question' | 'flashcard' | 'exam' | 'diagram' | 'status'
export interface ActivityEvent {
  kind: ActivityKind
  label: string
  /** In-app route to revisit the item. */
  href?: string
  at: number
}

/** Answer recorded in a session or exam; shape mirrors CorrectAnswer. */
export type GivenAnswer = string | string[] | Record<string, string> | null

export interface PracticeExamResult {
  id: string
  startedAt: number
  finishedAt: number
  durationSec: number
  timeLimitSec: number
  questionIds: string[]
  answers: Record<string, GivenAnswer>
  correct: Record<string, boolean>
  flagged: string[]
  score: number
  byDomain: Partial<Record<DomainId, { correct: number; total: number }>>
}

/** An exam in progress, persisted so a page refresh does not lose it. */
export interface ActiveExam {
  id: string
  startedAt: number
  timeLimitSec: number
  questionIds: string[]
  answers: Record<string, GivenAnswer>
  flagged: string[]
  current: number
}

export interface UserProgress {
  version: number
  topicStatus: Record<string, TopicStatus>
  topicVisits: Record<string, number>
  questionAttempts: Record<string, QuestionAttempt>
  flashcards: Record<string, FlashcardState>
  exams: PracticeExamResult[]
  activeExam: ActiveExam | null
  activity: ActivityEvent[]
  /** Local calendar days (YYYY-MM-DD) with any study activity. */
  studyDays: string[]
  studySeconds: number
}

export const PROGRESS_VERSION = 1

export const emptyProgress = (): UserProgress => ({
  version: PROGRESS_VERSION,
  topicStatus: {},
  topicVisits: {},
  questionAttempts: {},
  flashcards: {},
  exams: [],
  activeExam: null,
  activity: [],
  studyDays: [],
  studySeconds: 0,
})
