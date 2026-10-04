import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { content } from '@/content'
import { SERVICE_CATEGORIES, type ServiceCategory } from '@/content/schema'
import { Badge, Card, Chip, EmptyState, PageHeader } from '@/components/ui'
import { Icon } from '@/components/Icon'

export const RELEVANCE = {
  core: { label: 'Core AZ-104', color: 'green' },
  important: { label: 'Important', color: 'blue' },
  awareness: { label: 'Awareness', color: 'gray' },
} as const

export function ServicesPage() {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<ServiceCategory | 'all'>('all')
  const list = useMemo(() => {
    const n = q.trim().toLowerCase()
    return content.services
      .filter((s) => (cat === 'all' || s.category === cat) && (!n || `${s.name} ${s.tagline} ${s.whatItIs} ${s.category}`.toLowerCase().includes(n)))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [q, cat])
  const cats = SERVICE_CATEGORIES.filter((c) => content.services.some((s) => s.category === c))

  return (
    <div>
      <PageHeader
        icon="cloud"
        title="Azure Service Explorer"
        description={`${content.services.length} Azure services an administrator should know — what each does, security and networking considerations, how it's priced, and how the exam treats it.`}
      />
      <div className="mb-6 space-y-3">
        <label className="relative block max-w-md">
          <span className="sr-only">Search services</span>
          <Search className="absolute top-2.5 left-3 size-4 text-subtle" aria-hidden />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search services…" className="h-10 w-full rounded-md border border-border bg-surface pr-3 pl-9 text-sm" />
        </label>
        <div className="flex flex-wrap gap-2">
          <Chip active={cat === 'all'} onClick={() => setCat('all')}>
            All
          </Chip>
          {cats.map((c) => (
            <Chip key={c} active={cat === c} onClick={() => setCat(c)}>
              {c}
            </Chip>
          ))}
        </div>
      </div>
      {list.length === 0 && <EmptyState title="No services match." />}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((s) => (
          <Link key={s.id} to={`/services/${s.id}`} className="group">
            <Card className="flex h-full flex-col p-5 transition-all group-hover:-translate-y-0.5 group-hover:border-accent/50 group-hover:shadow-pop">
              <div className="flex items-start justify-between gap-2">
                <span className="grid size-10 place-items-center rounded-md bg-accent-soft text-accent">
                  <Icon name={s.icon} className="size-5" />
                </span>
                <Badge color={RELEVANCE[s.relevance].color}>{RELEVANCE[s.relevance].label}</Badge>
              </div>
              <h2 className="mt-3 font-semibold group-hover:text-accent">{s.name}</h2>
              <p className="mt-1 flex-1 text-sm text-muted">{s.tagline}</p>
              <p className="mt-3 text-xs font-medium text-subtle">{s.category}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
