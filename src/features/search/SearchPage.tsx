import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { groupResults, KIND_ICON, KIND_LABEL, type SearchKind } from '@/lib/search'
import { getSearch } from '@/components/SearchDialog'
import { Card, Chip, EmptyState, PageHeader } from '@/components/ui'
import { Icon } from '@/components/Icon'

export function SearchPage() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const [kind, setKind] = useState<SearchKind | 'all'>('all')
  const results = useMemo(() => getSearch()(q, 200), [q])
  const grouped = groupResults(results)
  const shown = kind === 'all' ? grouped : grouped.filter(([k]) => k === kind)

  return (
    <div>
      <PageHeader icon="scan-search" title="Search" description="Search across study topics, services, diagrams, comparisons, cheat sheets, flashcards and practice questions." />
      <label className="relative mb-4 block max-w-xl">
        <span className="sr-only">Search</span>
        <Search className="absolute top-3 left-3 size-5 text-subtle" aria-hidden />
        <input
          autoFocus
          value={q}
          onChange={(e) => setParams({ q: e.target.value }, { replace: true })}
          placeholder="e.g. private endpoint, RBAC inheritance, NSG…"
          className="h-11 w-full rounded-xl border border-border bg-surface pr-3 pl-10"
        />
      </label>
      {grouped.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <Chip active={kind === 'all'} onClick={() => setKind('all')}>
            All ({results.length})
          </Chip>
          {grouped.map(([k, items]) => (
            <Chip key={k} active={kind === k} onClick={() => setKind(k)}>
              {KIND_LABEL[k]} ({items.length})
            </Chip>
          ))}
        </div>
      )}
      {q.trim().length >= 2 && results.length === 0 && <EmptyState icon="scan-search" title={`No results for “${q}”.`} />}
      <div className="space-y-8">
        {shown.map(([k, items]) => (
          <section key={k}>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-subtle">
              <Icon name={KIND_ICON[k]} className="size-4" /> {KIND_LABEL[k]}
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              {items.map((r) => (
                <Link key={r.id} to={r.href} className="group">
                  <Card className="h-full p-4 group-hover:border-accent/50">
                    <p className="line-clamp-2 font-medium group-hover:text-accent">{r.title}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-muted">{r.snippet}</p>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
