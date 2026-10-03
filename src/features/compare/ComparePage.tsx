import { useState } from 'react'
import { Link } from 'react-router-dom'
import { content, domains } from '@/content'
import type { DomainId } from '@/content/schema'
import { Card, Chip, DomainBadge, PageHeader, tone } from '@/components/ui'

export function ComparePage() {
  const [domain, setDomain] = useState<DomainId | 'all'>('all')
  const list = content.comparisons.filter((c) => domain === 'all' || c.domain === domain)
  return (
    <div>
      <PageHeader
        icon="scale"
        title="Comparison Center"
        description="Side-by-side breakdowns of the Azure services and concepts the exam loves to contrast — with memory aids and typical exam scenarios."
      />
      <div className="mb-6 flex flex-wrap gap-2">
        <Chip active={domain === 'all'} onClick={() => setDomain('all')}>
          All
        </Chip>
        {domains.map((d) => (
          <Chip key={d.id} active={domain === d.id} onClick={() => setDomain(d.id)}>
            {d.shortName}
          </Chip>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((c) => (
          <Link key={c.id} to={`/compare/${c.id}`} className="group">
            <Card className="flex h-full flex-col p-5 transition-all group-hover:-translate-y-0.5 group-hover:border-accent/50 group-hover:shadow-pop">
              <div className="mb-3 flex flex-wrap items-center gap-1.5">
                {c.items.map((it, i) => (
                  <span key={it.name} className="flex items-center gap-1.5">
                    {i > 0 && <span className="text-xs font-bold text-subtle">vs</span>}
                    <span className="rounded-lg border px-2 py-0.5 text-xs font-semibold" style={tone(it.color)}>
                      {it.name}
                    </span>
                  </span>
                ))}
              </div>
              <h2 className="font-semibold group-hover:text-accent">{c.title}</h2>
              <p className="mt-1 flex-1 text-sm text-muted">{c.summary}</p>
              <div className="mt-3">
                <DomainBadge domain={c.domain} />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
