/**
 * Content schemas. These Zod schemas are the single source of truth for the
 * shape of every educational content file under /content. Types used by the
 * UI are inferred from them, so content and presentation can evolve separately.
 */
import { z } from 'zod'

export const DOMAIN_IDS = ['identity-governance', 'storage', 'compute', 'networking', 'monitoring'] as const
export const DomainId = z.enum(DOMAIN_IDS)
export type DomainId = z.infer<typeof DomainId>

export const COLOR_TOKENS = ['blue', 'teal', 'purple', 'orange', 'green', 'red', 'gray', 'amber', 'pink'] as const
export const ColorToken = z.enum(COLOR_TOKENS)
export type ColorToken = z.infer<typeof ColorToken>

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'must be kebab-case')
const text = z.string().min(1)

export const DocLink = z.object({
  title: text,
  url: z.url().refine((u) => u.startsWith('https://'), 'must be https'),
})
export type DocLink = z.infer<typeof DocLink>

/** Optional freshness metadata for anything containing version-sensitive facts. */
const freshness = {
  versionNote: z.string().optional(),
  lastReviewed: z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/).optional(),
}

// ---------------------------------------------------------------- objectives
export const ExamObjective = z.object({
  id: slug,
  title: text,
  skills: z.array(text).min(1),
})
export type ExamObjective = z.infer<typeof ExamObjective>

export const Domain = z.object({
  id: DomainId,
  name: text,
  shortName: text,
  weight: text,
  /** Midpoint of the published weight range, used to weight readiness. */
  weightValue: z.number().positive(),
  color: ColorToken,
  icon: text,
  description: text,
  objectives: z.array(ExamObjective).min(1),
})
export type Domain = z.infer<typeof Domain>

export const ObjectivesFile = z.object({
  exam: text,
  title: text,
  asOf: text,
  source: DocLink,
  note: text,
  domains: z.array(Domain).length(DOMAIN_IDS.length),
})
export type ObjectivesFile = z.infer<typeof ObjectivesFile>

// ---------------------------------------------------------------- topics
export const Topic = z.object({
  slug,
  title: text,
  domain: DomainId,
  objectiveIds: z.array(slug).min(1),
  icon: text,
  summary: text,
  overview: z.array(text).min(1),
  keyConcepts: z.array(z.object({ term: text, definition: text })).min(3),
  howItWorks: z.array(text).min(2),
  whenToUse: z.array(text).min(2),
  examTips: z.array(text).min(2),
  commonMistakes: z.array(text).min(2),
  confusedWith: z
    .array(z.object({ name: text, difference: text, comparison: slug.optional() }))
    .min(1),
  diagrams: z.array(slug),
  services: z.array(slug),
  docLinks: z.array(DocLink).min(1),
  ...freshness,
})
export type Topic = z.infer<typeof Topic>

// ---------------------------------------------------------------- services
export const SERVICE_CATEGORIES = [
  'Compute',
  'Networking',
  'Storage',
  'Identity',
  'Governance',
  'Monitoring',
  'Security',
  'Backup',
  'Containers',
] as const
export const ServiceCategory = z.enum(SERVICE_CATEGORIES)
export type ServiceCategory = z.infer<typeof ServiceCategory>

export const Service = z.object({
  id: slug,
  name: text,
  category: ServiceCategory,
  icon: text,
  tagline: text,
  whatItIs: text,
  primaryPurpose: text,
  useCases: z.array(text).min(2),
  keyFeatures: z.array(text).min(2),
  security: z.array(text).min(1),
  networking: z.array(text).min(1),
  pricing: text,
  relatedServices: z.array(slug),
  confusedWith: z.array(z.object({ name: text, difference: text })),
  relevance: z.enum(['core', 'important', 'awareness']),
  relevanceNote: text,
  examTips: z.array(text).min(1),
  topics: z.array(slug),
  docLinks: z.array(DocLink).min(1),
  ...freshness,
})
export type Service = z.infer<typeof Service>

// ---------------------------------------------------------------- questions
export const DIFFICULTIES = ['beginner', 'intermediate', 'exam', 'challenging'] as const
export const Difficulty = z.enum(DIFFICULTIES)
export type Difficulty = z.infer<typeof Difficulty>

export const QUESTION_TYPES = ['single', 'multi', 'scenario', 'ordering', 'matching', 'caseStudy'] as const
export const QuestionType = z.enum(QUESTION_TYPES)
export type QuestionType = z.infer<typeof QuestionType>

export const AnswerOption = z.object({ id: z.string().min(1), text })
export type AnswerOption = z.infer<typeof AnswerOption>

/**
 * correctAnswer shape depends on questionType:
 *  - single / scenario / caseStudy (single select): option id
 *  - multi / caseStudy (multi select): option ids (any order)
 *  - ordering: option ids in the correct order
 *  - matching: { optionId: matchTargetId }
 */
export const CorrectAnswer = z.union([z.string(), z.array(z.string()).min(1), z.record(z.string(), z.string())])
export type CorrectAnswer = z.infer<typeof CorrectAnswer>

export const Question = z
  .object({
    id: slug,
    domain: DomainId,
    objectiveId: slug,
    topic: slug,
    services: z.array(slug),
    difficulty: Difficulty,
    questionType: QuestionType,
    caseStudyId: slug.optional(),
    scenario: z.string().optional(),
    question: text,
    options: z.array(AnswerOption).min(2),
    matchTargets: z.array(AnswerOption).optional(),
    correctAnswer: CorrectAnswer,
    explanation: text,
    /**
     * Keyed by option id. For choice questions, every incorrect option needs an
     * entry. For ordering/matching, every option needs an entry explaining its placement.
     */
    incorrectAnswerExplanations: z.record(z.string(), text),
    examTakeaway: text,
    relatedTopics: z.array(slug).min(1),
    documentationLinks: z.array(DocLink).min(1),
    versionNote: z.string().optional(),
  })
  .superRefine((q, ctx) => {
    const ids = new Set(q.options.map((o) => o.id))
    if (ids.size !== q.options.length) ctx.addIssue({ code: 'custom', message: 'duplicate option ids' })
    const ca = q.correctAnswer
    const issue = (message: string) => ctx.addIssue({ code: 'custom', message: `${q.id}: ${message}` })
    const needExplanation = (optId: string) => {
      if (!q.incorrectAnswerExplanations[optId]) issue(`missing incorrectAnswerExplanations["${optId}"]`)
    }
    switch (q.questionType) {
      case 'single':
      case 'scenario':
        if (typeof ca !== 'string' || !ids.has(ca)) issue('correctAnswer must be a single valid option id')
        break
      case 'multi':
        if (!Array.isArray(ca) || ca.length < 2 || ca.some((c) => !ids.has(c)))
          issue('multi correctAnswer must be 2+ valid option ids')
        break
      case 'caseStudy':
        if (!q.caseStudyId) issue('caseStudy requires caseStudyId')
        if (typeof ca === 'string' ? !ids.has(ca) : !Array.isArray(ca) || ca.some((c) => !ids.has(c)))
          issue('caseStudy correctAnswer must be option id(s)')
        break
      case 'ordering':
        if (!Array.isArray(ca) || ca.length !== ids.size || new Set(ca).size !== ids.size || ca.some((c) => !ids.has(c)))
          issue('ordering correctAnswer must list every option id once')
        break
      case 'matching': {
        const targets = new Set((q.matchTargets ?? []).map((t) => t.id))
        if (targets.size < 2) issue('matching requires matchTargets')
        if (typeof ca !== 'object' || Array.isArray(ca)) {
          issue('matching correctAnswer must be a record')
          break
        }
        for (const id of ids) if (!ca[id] || !targets.has(ca[id])) issue(`matching option ${id} needs a valid target`)
        break
      }
    }
    if (q.questionType === 'ordering' || q.questionType === 'matching') {
      ids.forEach(needExplanation)
    } else {
      const correct = new Set(typeof ca === 'string' ? [ca] : Array.isArray(ca) ? ca : [])
      ids.forEach((id) => !correct.has(id) && needExplanation(id))
    }
  })
export type Question = z.infer<typeof Question>

export const CaseStudy = z.object({
  id: slug,
  title: text,
  domain: DomainId,
  overview: z.array(text).min(1),
  existingEnvironment: z.array(text).min(1),
  requirements: z.array(text).min(1),
})
export type CaseStudy = z.infer<typeof CaseStudy>

// ---------------------------------------------------------------- flashcards
export const DECKS = [
  'identity',
  'governance',
  'storage',
  'compute',
  'networking',
  'monitoring',
  'backup-recovery',
  'limits',
  'terminology',
  'confused-services',
  'exam-traps',
] as const
export const DeckId = z.enum(DECKS)
export type DeckId = z.infer<typeof DeckId>

export const Flashcard = z.object({
  id: slug,
  deck: DeckId,
  topic: slug.optional(),
  type: z.enum(['definition', 'scenario']),
  front: text,
  back: text,
  tags: z.array(z.string()).default([]),
  versionNote: z.string().optional(),
})
export type Flashcard = z.infer<typeof Flashcard>

// ---------------------------------------------------------------- diagrams
export const DiagramNode = z.object({
  id: z.string().min(1),
  label: text,
  sublabel: z.string().optional(),
  icon: z.string().optional(),
  x: z.number(),
  y: z.number(),
  w: z.number().positive().optional(),
  h: z.number().positive().optional(),
  color: ColorToken.default('blue'),
  detail: text,
})
export type DiagramNode = z.infer<typeof DiagramNode>

export const DiagramEdge = z.object({
  from: z.string(),
  to: z.string(),
  label: z.string().optional(),
  style: z.enum(['solid', 'dashed']).default('solid'),
  color: ColorToken.optional(),
  bidirectional: z.boolean().default(false),
})
export type DiagramEdge = z.infer<typeof DiagramEdge>

export const DiagramGroup = z.object({
  id: z.string(),
  label: text,
  x: z.number(),
  y: z.number(),
  w: z.number().positive(),
  h: z.number().positive(),
  color: ColorToken.default('gray'),
})
export type DiagramGroup = z.infer<typeof DiagramGroup>

export const Diagram = z
  .object({
    id: slug,
    title: text,
    summary: text,
    domain: DomainId,
    topics: z.array(slug),
    width: z.number().positive(),
    height: z.number().positive(),
    groups: z.array(DiagramGroup).default([]),
    nodes: z.array(DiagramNode).min(2),
    edges: z.array(DiagramEdge).default([]),
    legend: z.array(z.object({ color: ColorToken, label: text })).default([]),
    steps: z.array(z.object({ title: text, text, highlight: z.array(z.string()) })).default([]),
    examExpects: z.array(text).min(1),
    docLinks: z.array(DocLink).min(1),
  })
  .superRefine((d, ctx) => {
    const ids = new Set(d.nodes.map((n) => n.id))
    for (const e of d.edges)
      for (const end of [e.from, e.to])
        if (!ids.has(end)) ctx.addIssue({ code: 'custom', message: `${d.id}: edge references unknown node ${end}` })
    for (const s of d.steps)
      for (const h of s.highlight)
        if (!ids.has(h)) ctx.addIssue({ code: 'custom', message: `${d.id}: step highlights unknown node ${h}` })
  })
export type Diagram = z.infer<typeof Diagram>

// ---------------------------------------------------------------- comparisons
export const Comparison = z
  .object({
    id: slug,
    title: text,
    summary: text,
    domain: DomainId,
    items: z.array(z.object({ name: text, serviceId: slug.optional(), color: ColorToken })).min(2),
    rows: z.array(z.object({ aspect: text, values: z.array(text) })).min(5),
    keyDifference: text,
    memoryAid: text,
    examScenarios: z.array(z.object({ scenario: text, answer: text })).min(1),
    topics: z.array(slug),
    docLinks: z.array(DocLink).min(1),
    versionNote: z.string().optional(),
  })
  .superRefine((c, ctx) => {
    for (const r of c.rows)
      if (r.values.length !== c.items.length)
        ctx.addIssue({ code: 'custom', message: `${c.id}: row "${r.aspect}" needs ${c.items.length} values` })
  })
export type Comparison = z.infer<typeof Comparison>

// ---------------------------------------------------------------- quick reference
export const QuickRefSection = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('table'), heading: text, columns: z.array(text).min(2), rows: z.array(z.array(z.string())).min(1) }),
  z.object({ kind: z.literal('list'), heading: text, items: z.array(text).min(1) }),
  z.object({ kind: z.literal('note'), heading: text, text }),
])
export type QuickRefSection = z.infer<typeof QuickRefSection>

export const QuickRef = z.object({
  id: slug,
  title: text,
  summary: text,
  domain: DomainId.optional(),
  icon: text,
  sections: z.array(QuickRefSection).min(1),
  topics: z.array(slug),
  docLinks: z.array(DocLink).min(1),
  ...freshness,
})
export type QuickRef = z.infer<typeof QuickRef>
