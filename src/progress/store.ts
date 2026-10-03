import { create } from 'zustand'
import { dayKey } from '@/lib/date'
import { migrate, repository } from './storage'
import type { ActiveExam, ActivityEvent, PracticeExamResult, TopicStatus, UserProgress } from './types'
import { emptyProgress } from './types'

const MAX_ACTIVITY = 60
const MAX_EXAMS = 50

interface Actions {
  setTopicStatus(slug: string, status: TopicStatus, title: string): void
  visitTopic(slug: string, title: string): void
  recordAnswer(questionId: string, correct: boolean, label: string): void
  markFlashcard(id: string, status: 'know' | 'review'): void
  logActivity(e: Omit<ActivityEvent, 'at'>): void
  addStudyTime(seconds: number): void
  startExam(exam: ActiveExam): void
  updateExam(patch: Partial<ActiveExam>): void
  finishExam(result: PracticeExamResult): void
  abandonExam(): void
  importProgress(data: unknown): void
  reset(): void
}

export type ProgressState = UserProgress & Actions

/** Adds today's date to studyDays and prepends an activity event. */
function touch(s: UserProgress, event?: Omit<ActivityEvent, 'at'>): Partial<UserProgress> {
  const today = dayKey()
  const studyDays = s.studyDays.includes(today) ? s.studyDays : [...s.studyDays, today]
  if (!event) return { studyDays }
  const prev = s.activity[0]
  // Collapse repeated identical events (e.g. re-answering the same card) to keep the feed useful.
  const rest = prev && prev.label === event.label && prev.kind === event.kind ? s.activity.slice(1) : s.activity
  return { studyDays, activity: [{ ...event, at: Date.now() }, ...rest].slice(0, MAX_ACTIVITY) }
}

export const useProgress = create<ProgressState>()((set) => ({
  ...repository.load(),

  setTopicStatus: (slug, status, title) =>
    set((s) => ({
      topicStatus: { ...s.topicStatus, [slug]: status },
      ...touch(s, { kind: 'status', label: `${title} → ${status}`, href: `/topics/${slug}` }),
    })),

  visitTopic: (slug, title) =>
    set((s) => ({
      topicVisits: { ...s.topicVisits, [slug]: (s.topicVisits[slug] ?? 0) + 1 },
      // Opening a topic for the first time moves it to "Learning".
      topicStatus: s.topicStatus[slug] ? s.topicStatus : { ...s.topicStatus, [slug]: 'learning' },
      ...touch(s, { kind: 'topic', label: `Studied ${title}`, href: `/topics/${slug}` }),
    })),

  recordAnswer: (id, correct, label) =>
    set((s) => {
      const prev = s.questionAttempts[id]
      return {
        questionAttempts: {
          ...s.questionAttempts,
          [id]: {
            attempts: (prev?.attempts ?? 0) + 1,
            correct: (prev?.correct ?? 0) + (correct ? 1 : 0),
            lastResult: correct,
            lastAt: Date.now(),
          },
        },
        ...touch(s, { kind: 'question', label, href: '/practice' }),
      }
    }),

  markFlashcard: (id, status) =>
    set((s) => ({
      flashcards: {
        ...s.flashcards,
        [id]: { status, seen: (s.flashcards[id]?.seen ?? 0) + 1, lastAt: Date.now() },
      },
      ...touch(s, { kind: 'flashcard', label: 'Reviewed flashcards', href: '/flashcards' }),
    })),

  logActivity: (e) => set((s) => touch(s, e)),

  addStudyTime: (seconds) => set((s) => ({ studySeconds: s.studySeconds + seconds })),

  startExam: (exam) => set((s) => ({ activeExam: exam, ...touch(s) })),

  updateExam: (patch) => set((s) => (s.activeExam ? { activeExam: { ...s.activeExam, ...patch } } : {})),

  finishExam: (result) =>
    set((s) => {
      const questionAttempts = { ...s.questionAttempts }
      for (const id of result.questionIds) {
        const prev = questionAttempts[id]
        const ok = !!result.correct[id]
        questionAttempts[id] = {
          attempts: (prev?.attempts ?? 0) + 1,
          correct: (prev?.correct ?? 0) + (ok ? 1 : 0),
          lastResult: ok,
          lastAt: result.finishedAt,
        }
      }
      return {
        activeExam: null,
        questionAttempts,
        exams: [result, ...s.exams].slice(0, MAX_EXAMS),
        ...touch(s, {
          kind: 'exam',
          label: `Practice exam: ${Math.round(result.score)}%`,
          href: `/exam/results/${result.id}`,
        }),
      }
    }),

  abandonExam: () => set({ activeExam: null }),

  importProgress: (data) => set(() => migrate(data)),

  reset: () => {
    repository.clear()
    set(emptyProgress())
  },
}))

/** Snapshot of the persisted fields only (no actions). */
export function progressSnapshot(s: ProgressState): UserProgress {
  const { version, topicStatus, topicVisits, questionAttempts, flashcards, exams, activeExam, activity, studyDays, studySeconds } = s
  return { version, topicStatus, topicVisits, questionAttempts, flashcards, exams, activeExam, activity, studyDays, studySeconds }
}

useProgress.subscribe((s) => repository.save(progressSnapshot(s)))
