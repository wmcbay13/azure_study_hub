import { Link, useParams } from 'react-router-dom'
import { ChevronRight, Printer } from 'lucide-react'
import { content } from '@/content'
import { Button, Card, DocLinks, DomainBadge, PageHeader, VersionNote } from '@/components/ui'
import { Icon } from '@/components/Icon'
import { NotFoundPage } from '../NotFoundPage'

export function ReferenceDetailPage() {
  const { id = '' } = useParams()
  const r = content.quickrefById.get(id)
  if (!r) return <NotFoundPage what="cheat sheet" />
  return (
    <div>
      <nav aria-label="Breadcrumb" className="no-print mb-4 flex items-center gap-1 text-sm text-muted">
        <Link to="/reference" className="hover:text-accent">
          Quick Reference
        </Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span className="truncate">{r.title}</span>
      </nav>
      <PageHeader
        icon={r.icon}
        title={r.title}
        description={r.summary}
        eyebrow={r.domain && <DomainBadge domain={r.domain} short={false} />}
        actions={
          <Button onClick={() => window.print()} className="no-print">
            <Printer className="size-4" /> Print
          </Button>
        }
      />
      {r.versionNote && (
        <div className="mb-4">
          <VersionNote>{r.versionNote}</VersionNote>
        </div>
      )}
      <div className="columns-1 gap-4 xl:columns-2 [&>*]:mb-4">
        {r.sections.map((s) => (
          <Card key={s.heading} className="print-break break-inside-avoid overflow-hidden">
            <h2 className="border-b border-border bg-surface-2 px-4 py-2.5 text-sm font-semibold">{s.heading}</h2>
            {s.kind === 'table' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-subtle">
                      {s.columns.map((c) => (
                        <th key={c} scope="col" className="px-4 py-2 font-semibold">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {s.rows.map((row, i) => (
                      <tr key={i} className="border-t border-border align-top">
                        {row.map((cell, j) => (
                          <td key={j} className={j === 0 ? 'px-4 py-2 font-medium' : 'px-4 py-2 text-muted'}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : s.kind === 'list' ? (
              <ul className="space-y-1.5 p-4">
                {s.items.map((x, i) => (
                  <li key={i} className="flex gap-2 text-sm leading-relaxed">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                    {x}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-4 text-sm leading-relaxed">{s.text}</p>
            )}
          </Card>
        ))}
      </div>
      <div className="no-print mt-4 grid gap-6 sm:grid-cols-2">
        {r.topics.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-muted">Study topics</h3>
            <div className="flex flex-wrap gap-2">
              {r.topics.map((slug) => {
                const t = content.topicBySlug.get(slug)
                return (
                  t && (
                    <Link key={slug} to={`/topics/${slug}`} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-sm hover:border-accent hover:text-accent">
                      <Icon name={t.icon} className="size-3.5" /> {t.title}
                    </Link>
                  )
                )
              })}
            </div>
          </div>
        )}
        <DocLinks links={r.docLinks} />
      </div>
    </div>
  )
}
