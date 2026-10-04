import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { content, domains, examTopics } from '@/content'
import { useProgress } from '@/progress/store'
import { accuracyFor } from '@/progress/analytics'
import { TOPIC_STATUSES, TOPIC_STATUS_LABEL, type TopicStatus } from '@/progress/types'
import { Badge, Card, Chip, PageHeader, pct, tone, EmptyState } from '@/components/ui'
import type { ColorToken, Topic } from '@/content/schema'
import type { UserProgress } from '@/progress/types'
import { BEYOND_LABEL } from '@/content/scope'
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

  const beyond = filtered.filter((t) => t.examScope === 'beyond')

  return (
    <div>
      <PageHeader
        icon="book-open"
        title="Study Topics"
        description={`${examTopics.length} topics organized by the AZ-104 skills-measured outline, plus ${content.topics.length - examTopics.length} beyond-exam topic(s) for wider context. Each topic walks you through Learn → Visualize → Review → Practice.`}
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative flex-1 sm:max-w-sm">
          <span className="sr-only">Filter topics</span>
          <Search className="absolute top-2.5 left-3 size-4 text-subtle" aria-hidden />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter topics…"
            className="h-10 w-full rounded-md border border-border bg-surface pr-3 pl-9 text-sm"
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
          const topics = filtered.filter((t) => t.domain === d.id && t.examScope === 'in')
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
                {topics.map((t) => (
                  <TopicCard key={t.slug} topic={t} color={d.color} progress={progress} />
                ))}
              </div>
            </section>
          )
        })}
        {beyond.length > 0 && (
          <section aria-labelledby="dom-beyond">
            <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 id="dom-beyond" className="flex items-center gap-2 text-lg font-semibold">
                <span className="grid size-8 place-items-center rounded-lg" style={tone('amber', ['fg', 'bg'])}>
                  <Icon name="compass" className="size-4" />
                </span>
                Beyond the exam
              </h2>
              <span className="text-sm text-muted">Related Azure services for wider context — not in the AZ-104 skills outline and not counted toward readiness</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {beyond.map((t) => (
                <TopicCard key={t.slug} topic={t} color="amber" progress={progress} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function TopicCard({ topic: t, color, progress }: { topic: Topic; color: ColorToken; progress: UserProgress }) {
  const st = progress.topicStatus[t.slug] ?? 'notStarted'
  const ids = content.questions.filter((x) => x.topic === t.slug).map((x) => x.id)
  const acc = accuracyFor(progress, ids)
  return (
    <Link to={`/topics/${t.slug}`} className="group">
      <Card className="flex h-full flex-col p-5 transition-all group-hover:-translate-y-0.5 group-hover:border-accent/50 group-hover:shadow-pop">
        <div className="flex items-start justify-between gap-3">
          <span className="grid size-10 place-items-center rounded-md" style={tone(color, ['fg', 'bg'])}>
            <Icon name={t.icon} className="size-5" />
          </span>
          <div className="flex flex-wrap justify-end gap-1">
            {t.examScope === 'beyond' && <Badge color="amber">{BEYOND_LABEL}</Badge>}
            <StatusBadge status={st} />
          </div>
        </div>
        <h3 className="mt-3 font-semibold leading-snug group-hover:text-accent">{t.title}</h3>
        <p className="mt-1 line-clamp-2 flex-1 text-sm text-muted">{t.summary}</p>
        <div className="mt-4 flex items-center gap-3 text-xs text-subtle">
          <span>{ids.length} questions</span>
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
}
