/**
 * Browser content loader. All JSON under /content is bundled at build time,
 * validated once, and exposed through simple selectors.
 */
import { buildContent, type ContentIndex } from './build'
import type { DomainId, Question } from './schema'
import objectives from '../../content/objectives.json'

const glob = (files: Record<string, { default: unknown }>) =>
  Object.fromEntries(Object.entries(files).map(([k, v]) => [k, v.default]))

export const content: ContentIndex = buildContent(
  {
    objectives,
    topics: glob(import.meta.glob('../../content/topics/**/*.json', { eager: true })),
    services: glob(import.meta.glob('../../content/services/*.json', { eager: true })),
    questions: glob(import.meta.glob(['../../content/questions/*.json', '!**/case-studies.json'], { eager: true })),
    caseStudies: glob(import.meta.glob('../../content/questions/case-studies.json', { eager: true })),
    flashcards: glob(import.meta.glob('../../content/flashcards/*.json', { eager: true })),
    diagrams: glob(import.meta.glob('../../content/diagrams/*.json', { eager: true })),
    comparisons: glob(import.meta.glob('../../content/comparisons/*.json', { eager: true })),
    quickref: glob(import.meta.glob('../../content/quickref/*.json', { eager: true })),
  },
  // Referential problems are surfaced by `npm run validate:content`; don't crash the app over them.
  { strict: false },
).content

export const domains = content.objectives.domains
export const domainById = new Map(domains.map((d) => [d.id, d]))
export const getDomain = (id: DomainId) => domainById.get(id)!

export const topicsByDomain = (id: DomainId) => content.topics.filter((t) => t.domain === id)
export const questionsByTopic = (slug: string): Question[] =>
  content.questions.filter((q) => q.topic === slug || q.relatedTopics.includes(slug))
export const flashcardsByTopic = (slug: string) => content.flashcards.filter((f) => f.topic === slug)
export const comparisonsByTopic = (slug: string) => content.comparisons.filter((c) => c.topics.includes(slug))
export const diagramsByTopic = (slug: string) =>
  content.diagrams.filter((d) => d.topics.includes(slug) || content.topicBySlug.get(slug)?.diagrams.includes(d.id))
export const quickrefByTopic = (slug: string) => content.quickref.filter((q) => q.topics.includes(slug))
export const servicesByTopic = (slug: string) =>
  content.services.filter((s) => s.topics.includes(slug) || content.topicBySlug.get(slug)?.services.includes(s.id))

export const objectiveTitle = (objectiveId: string) =>
  domains.flatMap((d) => d.objectives).find((o) => o.id === objectiveId)?.title ?? objectiveId
