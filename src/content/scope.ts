/**
 * Exam-scope helpers. Questions, flashcards and diagrams inherit scope from their topics,
 * so marking a topic `examScope: "beyond"` is all that's needed to keep its content out of
 * readiness scoring and practice exams.
 */
import type { ContentIndex } from './build'
import type { Diagram, Flashcard, Question } from './schema'

export const isBeyondTopic = (c: ContentIndex, slug: string) => c.topicBySlug.get(slug)?.examScope === 'beyond'
export const isBeyondQuestion = (c: ContentIndex, q: Question) => isBeyondTopic(c, q.topic)
export const isBeyondFlashcard = (c: ContentIndex, f: Flashcard) => !!f.topic && isBeyondTopic(c, f.topic)
export const isBeyondDiagram = (c: ContentIndex, d: Diagram) => d.topics.length > 0 && d.topics.every((t) => isBeyondTopic(c, t))

export const BEYOND_LABEL = 'Beyond AZ-104'
