import type { Difficulty, DomainId, QuestionType } from '@/content/schema'
import type { SessionFilters, SessionSource } from '@/lib/session'

/** Session filters <-> URL query string, so sessions are linkable and survive refresh. */
export function encodeFilters(f: SessionFilters): string {
  const p = new URLSearchParams()
  if (f.domains?.length) p.set('domain', f.domains.join(','))
  if (f.topics?.length) p.set('topic', f.topics.join(','))
  if (f.services?.length) p.set('service', f.services.join(','))
  if (f.difficulties?.length) p.set('difficulty', f.difficulties.join(','))
  if (f.types?.length) p.set('type', f.types.join(','))
  if (f.source && f.source !== 'all') p.set('source', f.source)
  if (f.includeBeyond) p.set('beyond', '1')
  p.set('count', String(f.count))
  return p.toString()
}

const list = <T extends string>(v: string | null) => (v ? (v.split(',').filter(Boolean) as T[]) : [])

export function decodeFilters(p: URLSearchParams): SessionFilters {
  return {
    domains: list<DomainId>(p.get('domain')),
    topics: list(p.get('topic')),
    services: list(p.get('service')),
    difficulties: list<Difficulty>(p.get('difficulty')),
    types: list<QuestionType>(p.get('type')),
    source: (p.get('source') as SessionSource) ?? 'all',
    includeBeyond: p.get('beyond') === '1',
    count: Math.min(100, Math.max(1, Number(p.get('count')) || 10)),
  }
}
