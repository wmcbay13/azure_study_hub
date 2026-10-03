import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronRight, Eye } from 'lucide-react'
import { content } from '@/content'
import { Callout, Card, DocLinks, DomainBadge, PageHeader, SectionTitle, tone, toneVar, VersionNote } from '@/components/ui'
import { Icon } from '@/components/Icon'
import { NotFoundPage } from '../NotFoundPage'

function Scenario({ scenario, answer }: { scenario: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <li className="rounded-xl border border-border bg-surface p-4">
      <p className="text-[15px] leading-relaxed">{scenario}</p>
      {open ? (
        <p className="mt-2 rounded-lg bg-success-soft px-3 py-2 text-sm font-medium text-success">{answer}</p>
      ) : (
        <button onClick={() => setOpen(true)} className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline">
          <Eye className="size-4" /> Reveal answer
        </button>
      )}
    </li>
  )
}

export function ComparisonDetailPage() {
  const { id = '' } = useParams()
  const c = content.comparisonById.get(id)
  if (!c) return <NotFoundPage what="comparison" />
  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1 text-sm text-muted">
        <Link to="/compare" className="hover:text-accent">
          Comparison Center
        </Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span className="truncate">{c.title}</span>
      </nav>
      <PageHeader title={c.title} description={c.summary} eyebrow={<DomainBadge domain={c.domain} short={false} />} />

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <Callout color="blue" icon="zap" title="The key difference">
          {c.keyDifference}
        </Callout>
        <Callout color="purple" icon="brain" title="Memory aid">
          {c.memoryAid}
        </Callout>
      </div>

      {c.versionNote && (
        <div className="mb-6">
          <VersionNote>{c.versionNote}</VersionNote>
        </div>
      )}

      {/* Desktop table */}
      <Card className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 w-44 bg-surface p-4 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                Aspect
              </th>
              {c.items.map((it) => (
                <th key={it.name} scope="col" className="min-w-56 p-4 text-left" style={{ borderTop: `4px solid ${toneVar(it.color)}` }}>
                  <span className="flex items-center gap-2 text-[15px] font-semibold" style={{ color: toneVar(it.color) }}>
                    {it.serviceId ? (
                      <Link to={`/services/${it.serviceId}`} className="hover:underline">
                        {it.name}
                      </Link>
                    ) : (
                      it.name
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {c.rows.map((r, i) => (
              <tr key={r.aspect} className={i % 2 ? 'bg-surface-2' : 'bg-surface'}>
                <th scope="row" className="sticky left-0 border-t border-border bg-inherit p-4 text-left align-top font-semibold">
                  {r.aspect}
                </th>
                {r.values.map((v, j) => (
                  <td key={j} className="border-t border-border p-4 align-top leading-relaxed">
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Mobile stacked */}
      <div className="space-y-3 md:hidden">
        {c.rows.map((r) => (
          <Card key={r.aspect} className="p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-subtle">{r.aspect}</p>
            <dl className="space-y-2">
              {r.values.map((v, j) => (
                <div key={j} className="rounded-lg border-l-4 py-1 pl-3" style={{ borderColor: toneVar(c.items[j].color) }}>
                  <dt className="text-xs font-semibold" style={{ color: toneVar(c.items[j].color) }}>
                    {c.items[j].name}
                  </dt>
                  <dd className="text-sm leading-relaxed">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section>
          <SectionTitle>Typical exam scenarios</SectionTitle>
          <ul className="space-y-3">
            {c.examScenarios.map((s, i) => (
              <Scenario key={i} {...s} />
            ))}
          </ul>
        </section>
        <section className="space-y-5">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-muted">Study topics</h3>
            <div className="flex flex-wrap gap-2">
              {c.topics.map((slug) => {
                const t = content.topicBySlug.get(slug)
                return (
                  t && (
                    <Link key={slug} to={`/topics/${slug}`} className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm hover:underline" style={tone('blue')}>
                      <Icon name={t.icon} className="size-3.5" />
                      {t.title}
                    </Link>
                  )
                )
              })}
            </div>
          </div>
          <DocLinks links={c.docLinks} />
        </section>
      </div>
    </div>
  )
}
