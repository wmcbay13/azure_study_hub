import type { ColorToken } from '@/content/schema'
import { useProgress } from '@/progress/store'
import { TOPIC_STATUSES, TOPIC_STATUS_LABEL, type TopicStatus } from '@/progress/types'
import { cn } from '@/lib/cn'
import { tone, Badge } from './ui'

export const STATUS_COLOR: Record<TopicStatus, ColorToken> = {
  notStarted: 'gray',
  learning: 'blue',
  needsReview: 'amber',
  mastered: 'green',
}

export function StatusBadge({ status }: { status: TopicStatus }) {
  return <Badge color={STATUS_COLOR[status]}>{TOPIC_STATUS_LABEL[status]}</Badge>
}

export function StatusPicker({ slug, title }: { slug: string; title: string }) {
  const status = useProgress((s) => s.topicStatus[slug] ?? 'notStarted')
  const set = useProgress((s) => s.setTopicStatus)
  return (
    <div role="radiogroup" aria-label="Topic status" className="inline-flex flex-wrap gap-1 rounded-md border border-border bg-surface p-1">
      {TOPIC_STATUSES.map((s) => (
        <button
          key={s}
          role="radio"
          aria-checked={status === s}
          onClick={() => set(slug, s, title)}
          className={cn('rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors', status !== s && 'border-transparent text-muted hover:bg-surface-2')}
          style={status === s ? tone(STATUS_COLOR[s]) : undefined}
        >
          {TOPIC_STATUS_LABEL[s]}
        </button>
      ))}
    </div>
  )
}
