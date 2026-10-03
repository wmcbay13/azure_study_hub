import { Link, useParams } from 'react-router-dom'
import { ChevronRight, CircleDollarSign, Lightbulb, Lock, Network } from 'lucide-react'
import { content } from '@/content'
import { encodeFilters } from '../practice/params'
import { Badge, ButtonLink, Callout, Card, DocLinks, PageHeader, SectionTitle, VersionNote } from '@/components/ui'
import { Icon } from '@/components/Icon'
import { NotFoundPage } from '../NotFoundPage'
import { RELEVANCE } from './ServicesPage'

function List({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((x, i) => (
        <li key={i} className="flex gap-2 text-sm leading-relaxed">
          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
          {x}
        </li>
      ))}
    </ul>
  )
}

export function ServiceDetailPage() {
  const { id = '' } = useParams()
  const s = content.serviceById.get(id)
  if (!s) return <NotFoundPage what="service" />
  const qCount = content.questions.filter((q) => q.services.includes(s.id)).length
  const comparisons = content.comparisons.filter((c) => c.items.some((i) => i.serviceId === s.id))
  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1 text-sm text-muted">
        <Link to="/services" className="hover:text-accent">
          Service Explorer
        </Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span>{s.category}</span>
      </nav>
      <PageHeader
        icon={s.icon}
        title={s.name}
        description={s.tagline}
        eyebrow={
          <div className="flex gap-2">
            <Badge>{s.category}</Badge>
            <Badge color={RELEVANCE[s.relevance].color}>{RELEVANCE[s.relevance].label}</Badge>
          </div>
        }
        actions={
          qCount > 0 && (
            <ButtonLink variant="primary" to={`/practice/session?${encodeFilters({ services: [s.id], count: Math.min(qCount, 15) })}`}>
              Practice {qCount} questions
            </ButtonLink>
          )
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-8">
          {s.versionNote && <VersionNote>{s.versionNote}</VersionNote>}
          <section>
            <SectionTitle>What it is</SectionTitle>
            <p className="text-[15px] leading-relaxed">{s.whatItIs}</p>
          </section>
          <section>
            <SectionTitle>Primary purpose</SectionTitle>
            <p className="text-[15px] leading-relaxed">{s.primaryPurpose}</p>
          </section>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="p-5">
              <h3 className="mb-3 font-semibold">Common use cases</h3>
              <List items={s.useCases} />
            </Card>
            <Card className="p-5">
              <h3 className="mb-3 font-semibold">Key features</h3>
              <List items={s.keyFeatures} />
            </Card>
            <Card className="p-5">
              <h3 className="mb-3 flex items-center gap-2 font-semibold">
                <Lock className="size-4 text-accent" /> Security considerations
              </h3>
              <List items={s.security} />
            </Card>
            <Card className="p-5">
              <h3 className="mb-3 flex items-center gap-2 font-semibold">
                <Network className="size-4 text-accent" /> Networking considerations
              </h3>
              <List items={s.networking} />
            </Card>
          </div>
          <Card className="p-5">
            <h3 className="mb-2 flex items-center gap-2 font-semibold">
              <CircleDollarSign className="size-4 text-accent" /> Pricing model overview
            </h3>
            <p className="text-sm leading-relaxed">{s.pricing}</p>
            <p className="mt-2 text-xs text-subtle">
              Prices vary by region and change over time — use the{' '}
              <a className="text-accent hover:underline" href="https://azure.microsoft.com/pricing/calculator/" target="_blank" rel="noreferrer">
                Azure pricing calculator
              </a>{' '}
              for current figures.
            </p>
          </Card>
          {s.confusedWith.length > 0 && (
            <section>
              <SectionTitle>Commonly confused with</SectionTitle>
              <div className="grid gap-3 sm:grid-cols-2">
                {s.confusedWith.map((c) => (
                  <Card key={c.name} className="p-4">
                    <p className="font-semibold">{c.name}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{c.difference}</p>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="space-y-4">
          <Callout color="green" icon="graduation-cap" title="AZ-104 relevance">
            {s.relevanceNote}
          </Callout>
          <Card className="p-5">
            <h3 className="mb-3 flex items-center gap-2 font-semibold">
              <Lightbulb className="size-4" style={{ color: 'var(--c-purple-fg)' }} /> Exam tips
            </h3>
            <List items={s.examTips} />
          </Card>
          {(s.topics.length > 0 || comparisons.length > 0) && (
            <Card className="space-y-4 p-5">
              {s.topics.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-muted">Study topics</h3>
                  <ul className="space-y-1.5">
                    {s.topics.map((t) => {
                      const topic = content.topicBySlug.get(t)
                      return (
                        topic && (
                          <li key={t}>
                            <Link to={`/topics/${t}`} className="flex items-center gap-2 text-sm hover:text-accent">
                              <Icon name={topic.icon} className="size-4 text-accent" /> {topic.title}
                            </Link>
                          </li>
                        )
                      )
                    })}
                  </ul>
                </div>
              )}
              {comparisons.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-muted">Comparisons</h3>
                  <ul className="space-y-1.5">
                    {comparisons.map((c) => (
                      <li key={c.id}>
                        <Link to={`/compare/${c.id}`} className="flex items-center gap-2 text-sm hover:text-accent">
                          <Icon name="scale" className="size-4 text-accent" /> {c.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          )}
          {s.relatedServices.length > 0 && (
            <Card className="p-5">
              <h3 className="mb-2 text-sm font-semibold text-muted">Related services</h3>
              <div className="flex flex-wrap gap-2">
                {s.relatedServices.map((r) => {
                  const rs = content.serviceById.get(r)
                  return (
                    rs && (
                      <Link key={r} to={`/services/${r}`} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-sm hover:border-accent hover:text-accent">
                        <Icon name={rs.icon} className="size-3.5" /> {rs.name}
                      </Link>
                    )
                  )
                })}
              </div>
            </Card>
          )}
          <Card className="p-5">
            <DocLinks links={s.docLinks} />
          </Card>
        </div>
      </div>
    </div>
  )
}
