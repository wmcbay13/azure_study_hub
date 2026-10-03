import Fuse from 'fuse.js'
import type { ContentIndex } from '@/content/build'

export type SearchKind = 'topic' | 'service' | 'diagram' | 'comparison' | 'reference' | 'flashcard' | 'question'

export interface SearchDoc {
  kind: SearchKind
  id: string
  title: string
  /** Short text shown under the title. */
  snippet: string
  /** Extra searchable text, not displayed. */
  body: string
  keywords: string
  href: string
}

export const KIND_LABEL: Record<SearchKind, string> = {
  topic: 'Study Topics',
  service: 'Azure Services',
  diagram: 'Diagrams',
  comparison: 'Comparisons',
  reference: 'Quick Reference',
  flashcard: 'Flashcards',
  question: 'Practice Questions',
}

export const KIND_ICON: Record<SearchKind, string> = {
  topic: 'book-open',
  service: 'cloud',
  diagram: 'workflow',
  comparison: 'scale',
  reference: 'file-text',
  flashcard: 'square-stack',
  question: 'target',
}

export function buildSearchDocs(c: ContentIndex): SearchDoc[] {
  const docs: SearchDoc[] = []
  for (const t of c.topics)
    docs.push({
      kind: 'topic',
      id: t.slug,
      title: t.title,
      snippet: t.summary,
      body: [...t.overview, ...t.keyConcepts.map((k) => `${k.term} ${k.definition}`), ...t.examTips].join(' '),
      keywords: [...t.keyConcepts.map((k) => k.term), ...t.confusedWith.map((x) => x.name)].join(' '),
      href: `/topics/${t.slug}`,
    })
  for (const s of c.services)
    docs.push({
      kind: 'service',
      id: s.id,
      title: s.name,
      snippet: s.tagline,
      body: [s.whatItIs, s.primaryPurpose, ...s.keyFeatures].join(' '),
      keywords: `${s.category} ${s.confusedWith.map((x) => x.name).join(' ')}`,
      href: `/services/${s.id}`,
    })
  for (const d of c.diagrams)
    docs.push({
      kind: 'diagram',
      id: d.id,
      title: d.title,
      snippet: d.summary,
      body: [...d.nodes.map((n) => `${n.label} ${n.detail}`), ...d.examExpects].join(' '),
      keywords: d.nodes.map((n) => n.label).join(' '),
      href: `/visual/${d.id}`,
    })
  for (const x of c.comparisons)
    docs.push({
      kind: 'comparison',
      id: x.id,
      title: x.title,
      snippet: x.summary,
      body: [x.keyDifference, x.memoryAid, ...x.rows.flatMap((r) => r.values)].join(' '),
      keywords: x.items.map((i) => i.name).join(' '),
      href: `/compare/${x.id}`,
    })
  for (const q of c.quickref)
    docs.push({
      kind: 'reference',
      id: q.id,
      title: q.title,
      snippet: q.summary,
      body: q.sections
        .map((s) => (s.kind === 'table' ? s.rows.flat().join(' ') : s.kind === 'list' ? s.items.join(' ') : s.text))
        .join(' '),
      keywords: q.sections.map((s) => s.heading).join(' '),
      href: `/reference/${q.id}`,
    })
  for (const f of c.flashcards)
    docs.push({
      kind: 'flashcard',
      id: f.id,
      title: f.front,
      snippet: f.back,
      body: '',
      keywords: f.tags.join(' '),
      href: `/flashcards?card=${f.id}`,
    })
  for (const q of c.questions)
    docs.push({
      kind: 'question',
      id: q.id,
      title: q.question,
      snippet: q.scenario ?? q.examTakeaway,
      body: `${q.examTakeaway} ${q.options.map((o) => o.text).join(' ')}`,
      keywords: `${q.topic.replaceAll('-', ' ')} ${q.services.join(' ').replaceAll('-', ' ')}`,
      href: `/practice/session?q=${q.id}`,
    })
  return docs
}

export function createSearch(docs: SearchDoc[]) {
  const fuse = new Fuse(docs, {
    keys: [
      { name: 'title', weight: 3 },
      { name: 'keywords', weight: 2 },
      { name: 'snippet', weight: 1 },
      { name: 'body', weight: 0.5 },
    ],
    threshold: 0.35,
    ignoreLocation: true,
    minMatchCharLength: 2,
    includeScore: true,
  })
  return (query: string, limit = 50) => (query.trim().length < 2 ? [] : fuse.search(query.trim(), { limit }).map((r) => r.item))
}

/** Results grouped by kind, preserving relevance order within each group. */
export function groupResults(results: SearchDoc[]) {
  const groups = new Map<SearchKind, SearchDoc[]>()
  for (const r of results) groups.set(r.kind, [...(groups.get(r.kind) ?? []), r])
  return [...groups.entries()]
}
