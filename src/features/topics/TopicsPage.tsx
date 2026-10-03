import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { content, domains } from '@/content'
import { useProgress } from '@/progress/store'
import { accuracyFor } from '@/progress/analytics'
import { TOPIC_STATUSES, TOPIC_STATUS_LABEL, type TopicStatus } from '@/progress/types'
import { Card, Chip, PageHeader, pct, tone, EmptyState } from '@/components/ui'
import { StatusBadge } from '@/components/StatusPicker'
import { Icon } from '@/components/Icon'

export function TopicsPage() {
  const progress = useProgress()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<TopicStatus | 'all'>('all')

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return content.topics.filter(
      (t) =>
        (status === 'all' || (progress.topicStatus[t.slug] ?? 'notStarted') === status) &&
        (!needle || `${t.title} ${t.summary} ${t.keyConcepts.map((k) => k.term).join(' ')}`.toLowerCase().includes(needle)),
    )
  }, [q, status, progress.topicStatus])

  return (
    <div>
      <PageHeader
        icon="book-open"
        title="Study Topics"
        description={`${content.topics.length} topics organized by the AZ-104 skills-measured outline. Each topic walks you through Learn → Visualize → Review → Practice.`}
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative flex-1 sm:max-w-sm">
          <span className="sr-only">Filter topics</span>
          <Search className="absolute top-2.5 left-3 size-4 text-subtle" aria-hidden />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter topics…"
            className="h-10 w-full rounded-xl border border-border bg-surface pr-3 pl-9 text-sm"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <Chip active={status === 'all'} onClick={() => setStatus('all')}>
            All
          </Chip>
          {TOPIC_STATUSES.map((s) => (
            <Chip key={s} active={status === s} onClick={() => setStatus(s)}>
              {TOPIC_STATUS_LABEL[s]}
            </Chip>
          ))}
        </div>
      </div>

      {filtered.length === 0 && <EmptyState title="No topics match your filters." />}

      <div className="space-y-10">
        {domains.map((d) => {
          const topics = filtered.filter((t) => t.domain === d.id)
          if (!topics.length) return null
          return (
            <section key={d.id} aria-labelledby={`dom-${d.id}`}>
              <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 id={`dom-${d.id}`} className="flex items-center gap-2 text-lg font-semibold">
                  <span className="grid size-8 place-items-center rounded-lg" style={tone(d.color, ['fg', 'bg'])}>
                    <Icon name={d.icon} className="size-4" />
                  </span>
                  {d.name}
                </h2>
                <span className="text-sm text-muted">{d.weight} of exam</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {topics.map((t) => {
                  const st = progress.topicStatus[t.slug] ?? 'notStarted'
                  const acc = accuracyFor(progress, content.questions.filter((x) => x.topic === t.slug).map((x) => x.id))
                  const qCount = content.questions.filter((x) => x.topic === t.slug).length
                  return (
                    <Link key={t.slug} to={`/topics/${t.slug}`} className="group">
                      <Card className="flex h-full flex-col p-5 transition-all group-hover:-translate-y-0.5 group-hover:border-accent/50 group-hover:shadow-pop">
                        <div className="flex items-start justify-between gap-3">
                          <span className="grid size-10 place-items-center rounded-xl" style={tone(d.color, ['fg', 'bg'])}>
                            <Icon name={t.icon} className="size-5" />
                          </span>
                          <StatusBadge status={st} />
                        </div>
                        <h3 className="mt-3 font-semibold leading-snug group-hover:text-accent">{t.title}</h3>
                        <p className="mt-1 line-clamp-2 flex-1 text-sm text-muted">{t.summary}</p>
                        <div className="mt-4 flex items-center gap-3 text-xs text-subtle">
                          <span>{qCount} questions</span>
                          <span>·</span>
                          <span>{t.keyConcepts.length} key concepts</span>
                          {acc.pct !== null && (
                            <>
                              <span>·</span>
                              <span className="font-semibold text-text">{pct(acc.pct)} accuracy</span>
                            </>
                          )}
                        </div>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
