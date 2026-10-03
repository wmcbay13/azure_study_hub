/**
 * Parses raw content (from JSON files) into a validated, indexed ContentIndex.
 * Shared by the browser loader (import.meta.glob) and the Node validation script (fs).
 */
import { z } from 'zod'
import {
  CaseStudy,
  Comparison,
  Diagram,
  Flashcard,
  ObjectivesFile,
  Question,
  QuickRef,
  Service,
  Topic,
} from './schema'

export interface RawContent {
  objectives: unknown
  topics: Record<string, unknown>
  services: Record<string, unknown>
  questions: Record<string, unknown>
  caseStudies: Record<string, unknown>
  flashcards: Record<string, unknown>
  diagrams: Record<string, unknown>
  comparisons: Record<string, unknown>
  quickref: Record<string, unknown>
}

export interface ContentIndex {
  objectives: ObjectivesFile
  topics: Topic[]
  services: Service[]
  questions: Question[]
  caseStudies: CaseStudy[]
  flashcards: Flashcard[]
  diagrams: Diagram[]
  comparisons: Comparison[]
  quickref: QuickRef[]
  topicBySlug: Map<string, Topic>
  serviceById: Map<string, Service>
  questionById: Map<string, Question>
  caseStudyById: Map<string, CaseStudy>
  diagramById: Map<string, Diagram>
  comparisonById: Map<string, Comparison>
  quickrefById: Map<string, QuickRef>
}

export class ContentError extends Error {
  constructor(public problems: string[]) {
    super(`Content validation failed:\n- ${problems.join('\n- ')}`)
  }
}

function parseFiles<T>(files: Record<string, unknown>, schema: z.ZodType<T>, problems: string[]): T[] {
  const out: T[] = []
  for (const [path, data] of Object.entries(files).sort(([a], [b]) => a.localeCompare(b))) {
    const items = Array.isArray(data) ? data : [data]
    items.forEach((item, i) => {
      const r = schema.safeParse(item)
      if (r.success) out.push(r.data)
      else {
        const id = (item as { id?: string; slug?: string })?.id ?? (item as { slug?: string })?.slug ?? `#${i}`
        for (const iss of r.error.issues) problems.push(`${path} [${id}] ${iss.path.join('.')}: ${iss.message}`)
      }
    })
  }
  return out
}

function indexBy<T>(items: T[], key: (t: T) => string, kind: string, problems: string[]): Map<string, T> {
  const m = new Map<string, T>()
  for (const it of items) {
    const k = key(it)
    if (m.has(k)) problems.push(`duplicate ${kind} id "${k}"`)
    m.set(k, it)
  }
  return m
}

/** Builds the index. With `strict`, referential-integrity problems throw too. */
export function buildContent(raw: RawContent, { strict = true } = {}): { content: ContentIndex; problems: string[] } {
  const problems: string[] = []
  const obj = ObjectivesFile.safeParse(raw.objectives)
  if (!obj.success) throw new ContentError(obj.error.issues.map((i) => `objectives ${i.path.join('.')}: ${i.message}`))

  const topics = parseFiles(raw.topics, Topic, problems)
  const services = parseFiles(raw.services, Service, problems)
  const questions = parseFiles(raw.questions, Question, problems)
  const caseStudies = parseFiles(raw.caseStudies, CaseStudy, problems)
  const flashcards = parseFiles(raw.flashcards, Flashcard, problems)
  const diagrams = parseFiles(raw.diagrams, Diagram, problems)
  const comparisons = parseFiles(raw.comparisons, Comparison, problems)
  const quickref = parseFiles(raw.quickref, QuickRef, problems)

  const content: ContentIndex = {
    objectives: obj.data,
    topics,
    services,
    questions,
    caseStudies,
    flashcards,
    diagrams,
    comparisons,
    quickref,
    topicBySlug: indexBy(topics, (t) => t.slug, 'topic', problems),
    serviceById: indexBy(services, (s) => s.id, 'service', problems),
    questionById: indexBy(questions, (q) => q.id, 'question', problems),
    caseStudyById: indexBy(caseStudies, (c) => c.id, 'case study', problems),
    diagramById: indexBy(diagrams, (d) => d.id, 'diagram', problems),
    comparisonById: indexBy(comparisons, (c) => c.id, 'comparison', problems),
    quickrefById: indexBy(quickref, (q) => q.id, 'quickref', problems),
  }
  indexBy(flashcards, (f) => f.id, 'flashcard', problems)

  problems.push(...checkReferences(content))
  if (strict && problems.length) throw new ContentError(problems)
  return { content, problems }
}

function checkReferences(c: ContentIndex): string[] {
  const p: string[] = []
  const objectiveIds = new Set(c.objectives.domains.flatMap((d) => d.objectives.map((o) => o.id)))
  const ref = (map: Map<string, unknown>, id: string, kind: string, where: string) => {
    if (!map.has(id)) p.push(`${where}: unknown ${kind} "${id}"`)
  }
  for (const t of c.topics) {
    const w = `topic ${t.slug}`
    t.objectiveIds.forEach((o) => !objectiveIds.has(o) && p.push(`${w}: unknown objective "${o}"`))
    t.diagrams.forEach((d) => ref(c.diagramById, d, 'diagram', w))
    t.services.forEach((s) => ref(c.serviceById, s, 'service', w))
    t.confusedWith.forEach((x) => x.comparison && ref(c.comparisonById, x.comparison, 'comparison', w))
  }
  for (const s of c.services) {
    const w = `service ${s.id}`
    s.relatedServices.forEach((r) => ref(c.serviceById, r, 'service', w))
    s.topics.forEach((t) => ref(c.topicBySlug, t, 'topic', w))
  }
  for (const q of c.questions) {
    const w = `question ${q.id}`
    if (!objectiveIds.has(q.objectiveId)) p.push(`${w}: unknown objective "${q.objectiveId}"`)
    ref(c.topicBySlug, q.topic, 'topic', w)
    q.relatedTopics.forEach((t) => ref(c.topicBySlug, t, 'topic', w))
    q.services.forEach((s) => ref(c.serviceById, s, 'service', w))
    if (q.caseStudyId) ref(c.caseStudyById, q.caseStudyId, 'case study', w)
  }
  for (const f of c.flashcards) if (f.topic) ref(c.topicBySlug, f.topic, 'topic', `flashcard ${f.id}`)
  for (const d of c.diagrams) d.topics.forEach((t) => ref(c.topicBySlug, t, 'topic', `diagram ${d.id}`))
  for (const x of c.comparisons) {
    x.topics.forEach((t) => ref(c.topicBySlug, t, 'topic', `comparison ${x.id}`))
    x.items.forEach((i) => i.serviceId && ref(c.serviceById, i.serviceId, 'service', `comparison ${x.id}`))
  }
  for (const q of c.quickref) {
    q.topics.forEach((t) => ref(c.topicBySlug, t, 'topic', `quickref ${q.id}`))
    for (const s of q.sections)
      if (s.kind === 'table')
        s.rows.forEach((r, i) => r.length !== s.columns.length && p.push(`quickref ${q.id} "${s.heading}" row ${i}: column count`))
  }
  return p
}
