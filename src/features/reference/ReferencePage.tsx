import { Link } from 'react-router-dom'
import { content } from '@/content'
import { Card, DomainBadge, PageHeader } from '@/components/ui'
import { Icon } from '@/components/Icon'

export function ReferencePage() {
  return (
    <div>
      <PageHeader
        icon="file-text"
        title="Quick Reference"
        description="Compact cheat sheets designed to be scanned in the last hours before your exam. Each one prints cleanly too."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {content.quickref.map((r) => (
          <Link key={r.id} to={`/reference/${r.id}`} className="group">
            <Card className="flex h-full flex-col p-5 transition-all group-hover:-translate-y-0.5 group-hover:border-accent/50 group-hover:shadow-pop">
              <div className="flex items-start justify-between gap-2">
                <span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent">
                  <Icon name={r.icon} className="size-5" />
                </span>
                {r.domain && <DomainBadge domain={r.domain} />}
              </div>
              <h2 className="mt-3 font-semibold group-hover:text-accent">{r.title}</h2>
              <p className="mt-1 flex-1 text-sm text-muted">{r.summary}</p>
              <p className="mt-3 text-xs text-subtle">{r.sections.length} sections</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
