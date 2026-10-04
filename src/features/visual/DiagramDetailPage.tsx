import { Link, useParams } from 'react-router-dom'
import { ChevronRight, GraduationCap } from 'lucide-react'
import { content } from '@/content'
import { Badge, Card, DocLinks, DomainBadge, PageHeader } from '@/components/ui'
import { BEYOND_LABEL, isBeyondDiagram } from '@/content/scope'
import { DiagramCanvas } from '@/components/diagram/DiagramCanvas'
import { Icon } from '@/components/Icon'
import { NotFoundPage } from '../NotFoundPage'

export function DiagramDetailPage() {
  const { id = '' } = useParams()
  const d = content.diagramById.get(id)
  if (!d) return <NotFoundPage what="diagram" />
  const topics = [...new Set([...d.topics, ...content.topics.filter((t) => t.diagrams.includes(d.id)).map((t) => t.slug)])]
  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1 text-sm text-muted">
        <Link to="/visual" className="hover:text-accent">
          Visual Learning
        </Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span className="truncate">{d.title}</span>
      </nav>
      <PageHeader title={d.title} description={d.summary} eyebrow={
          isBeyondDiagram(content, d) ? (
            <Badge color="amber" icon="compass">
              {BEYOND_LABEL} — for context, not tested
            </Badge>
          ) : (
            <DomainBadge domain={d.domain} short={false} />
          )
        } />
      <DiagramCanvas diagram={d} />
      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card className="p-5">
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <GraduationCap className="size-5 text-accent" /> What the exam expects you to understand
          </h2>
          <ul className="space-y-2">
            {d.examExpects.map((x, i) => (
              <li key={i} className="flex gap-2 text-[15px] leading-relaxed">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                {x}
              </li>
            ))}
          </ul>
        </Card>
        <Card className="space-y-5 p-5">
          {topics.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-muted">Study topics</h3>
              <ul className="space-y-1.5">
                {topics.map((slug) => {
                  const t = content.topicBySlug.get(slug)
                  return (
                    t && (
                      <li key={slug}>
                        <Link to={`/topics/${slug}`} className="flex items-center gap-2 text-sm hover:text-accent">
                          <Icon name={t.icon} className="size-4 text-accent" />
                          {t.title}
                        </Link>
                      </li>
                    )
                  )
                })}
              </ul>
            </div>
          )}
          <DocLinks links={d.docLinks} />
        </Card>
      </div>
    </div>
  )
}
