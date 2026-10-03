import { useState } from 'react'
import { Link } from 'react-router-dom'
import { content, domains } from '@/content'
import type { Diagram, DomainId } from '@/content/schema'
import { Card, Chip, DomainBadge, PageHeader, toneVar } from '@/components/ui'

/** Tiny static preview of a diagram's layout for gallery cards. */
function Thumb({ d }: { d: Diagram }) {
  return (
    <svg viewBox={`0 0 ${d.width} ${d.height}`} className="h-36 w-full" aria-hidden preserveAspectRatio="xMidYMid meet">
      {d.groups.map((g) => (
        <rect key={g.id} x={g.x} y={g.y} width={g.w} height={g.h} rx={16} fill={toneVar(g.color, 'bg')} stroke={toneVar(g.color, 'bd')} strokeWidth={3} strokeDasharray="10 6" />
      ))}
      {d.edges.map((e, i) => {
        const a = d.nodes.find((n) => n.id === e.from)!
        const b = d.nodes.find((n) => n.id === e.to)!
        return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--border-strong)" strokeWidth={3} />
      })}
      {d.nodes.map((n) => (
        <rect key={n.id} x={n.x - (n.w ?? 150) / 2} y={n.y - (n.h ?? 58) / 2} width={n.w ?? 150} height={n.h ?? 58} rx={12} fill="var(--surface)" stroke={toneVar(n.color)} strokeWidth={3} />
      ))}
    </svg>
  )
}

export function VisualPage() {
  const [domain, setDomain] = useState<DomainId | 'all'>('all')
  const list = content.diagrams.filter((d) => domain === 'all' || d.domain === domain)
  return (
    <div>
      <PageHeader
        icon="workflow"
        title="Visual Learning"
        description="Interactive architecture and flow diagrams. Click any component for an explanation, and use walkthroughs to see how traffic, permissions or data move."
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
        {list.map((d) => (
          <Link key={d.id} to={`/visual/${d.id}`} className="group">
            <Card className="flex h-full flex-col overflow-hidden transition-all group-hover:-translate-y-0.5 group-hover:border-accent/50 group-hover:shadow-pop">
              <div className="border-b border-border bg-surface-2 p-3">
                <Thumb d={d} />
              </div>
              <div className="flex flex-1 flex-col p-4">
                <div className="mb-2 flex items-center gap-2">
                  <DomainBadge domain={d.domain} />
                  {d.steps.length > 0 && <span className="text-xs text-subtle">{d.steps.length}-step walkthrough</span>}
                </div>
                <h2 className="font-semibold group-hover:text-accent">{d.title}</h2>
                <p className="mt-1 line-clamp-2 text-sm text-muted">{d.summary}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
