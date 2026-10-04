import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play } from 'lucide-react'
import { content, domains } from '@/content'
import { DIFFICULTIES, QUESTION_TYPES, type Difficulty, type DomainId, type QuestionType } from '@/content/schema'
import { useProgress } from '@/progress/store'
import { filterQuestions, type SessionFilters, type SessionSource } from '@/lib/session'
import { Button, Card, Chip, PageHeader, difficultyLabel, tone } from '@/components/ui'
import { Icon } from '@/components/Icon'
import { encodeFilters } from './params'

const TYPE_LABEL: Record<QuestionType, string> = {
  single: 'Single answer',
  multi: 'Multiple answer',
  scenario: 'Scenario',
  ordering: 'Ordering',
  matching: 'Matching',
  caseStudy: 'Case study',
}

const SOURCES: { id: SessionSource; label: string }[] = [
  { id: 'all', label: 'Random' },
  { id: 'unanswered', label: 'Unanswered' },
  { id: 'incorrect', label: 'Previously incorrect' },
  { id: 'weak', label: 'Weak areas' },
]

const PRESETS: { title: string; desc: string; icon: string; color: 'blue' | 'teal' | 'purple' | 'orange' | 'green' | 'red'; filters: SessionFilters }[] = [
  { title: '10 Question Quick Quiz', desc: 'A fast mixed check across every domain.', icon: 'zap', color: 'blue', filters: { count: 10 } },
  { title: '25 Question Study Session', desc: 'A longer study block with explanations after each answer.', icon: 'book-open', color: 'purple', filters: { count: 25 } },
  { title: 'Weak Areas Review', desc: 'Questions from the topics where your accuracy is lowest.', icon: 'target', color: 'red', filters: { count: 15, source: 'weak' } },
  { title: 'Networking Challenge', desc: 'Exam-level and challenging networking scenarios.', icon: 'network', color: 'orange', filters: { count: 15, domains: ['networking'], difficulties: ['exam', 'challenging'] } },
  { title: 'Storage Challenge', desc: 'Redundancy, access, tiers and Azure Files at exam level.', icon: 'database', color: 'teal', filters: { count: 15, domains: ['storage'], difficulties: ['intermediate', 'exam', 'challenging'] } },
  { title: 'Random AZ-104 Questions', desc: 'Twenty questions from the whole bank, any difficulty.', icon: 'shuffle', color: 'green', filters: { count: 20 } },
]

function toggle<T>(list: T[], v: T): T[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v]
}

export function PracticePage() {
  const navigate = useNavigate()
  const progress = useProgress()
  const [doms, setDoms] = useState<DomainId[]>([])
  const [topics, setTopics] = useState<string[]>([])
  const [services, setServices] = useState<string[]>([])
  const [diffs, setDiffs] = useState<Difficulty[]>([])
  const [types, setTypes] = useState<QuestionType[]>([])
  const [source, setSource] = useState<SessionSource>('all')
  const [count, setCount] = useState(10)

  const filters: SessionFilters = { domains: doms, topics, services, difficulties: diffs, types, source, count }
  const available = useMemo(() => filterQuestions(content, progress, filters).length, [doms, topics, services, diffs, types, source, progress])
  const topicOptions = content.topics.filter((t) => !doms.length || doms.includes(t.domain))
  const serviceOptions = content.services.filter((s) => content.questions.some((q) => q.services.includes(s.id)))
  const start = (f: SessionFilters) => navigate(`/practice/session?${encodeFilters(f)}`)

  return (
    <div>
      <PageHeader
        icon="target"
        title="Practice Questions"
        description={`${content.questions.length} original questions aligned to the AZ-104 objectives. Study mode shows a full explanation — including why every distractor is wrong — after each answer.`}
      />

      <h2 className="mb-3 text-lg font-semibold">Quick start</h2>
      <div className="mb-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {PRESETS.map((p) => {
          const n = filterQuestions(content, progress, p.filters).length
          return (
            <button key={p.title} onClick={() => start(p.filters)} disabled={!n} className="group text-left disabled:opacity-50">
              <Card className="flex h-full items-start gap-3 p-4 transition-all group-hover:-translate-y-0.5 group-hover:border-accent/50 group-hover:shadow-pop">
                <span className="grid size-10 shrink-0 place-items-center rounded-md" style={tone(p.color, ['fg', 'bg'])}>
                  <Icon name={p.icon} className="size-5" />
                </span>
                <span>
                  <span className="block font-semibold group-hover:text-accent">{p.title}</span>
                  <span className="block text-sm text-muted">{p.desc}</span>
                  {p.filters.source === 'weak' && !n && <span className="mt-1 block text-xs text-subtle">Answer some questions first to find weak areas.</span>}
                </span>
              </Card>
            </button>
          )
        })}
      </div>

      <h2 className="mb-3 text-lg font-semibold">Build a custom session</h2>
      <Card className="space-y-6 p-5 sm:p-6">
        <Field label="Domain">
          {domains.map((d) => (
            <Chip key={d.id} active={doms.includes(d.id)} onClick={() => setDoms(toggle(doms, d.id))}>
              {d.shortName}
            </Chip>
          ))}
        </Field>
        <Field label="Topic">
          <MultiSelect
            options={topicOptions.map((t) => ({ id: t.slug, label: t.title }))}
            value={topics}
            onChange={setTopics}
            placeholder="Any topic"
          />
        </Field>
        <Field label="Azure service">
          <MultiSelect options={serviceOptions.map((s) => ({ id: s.id, label: s.name }))} value={services} onChange={setServices} placeholder="Any service" />
        </Field>
        <Field label="Difficulty">
          {DIFFICULTIES.map((d) => (
            <Chip key={d} active={diffs.includes(d)} onClick={() => setDiffs(toggle(diffs, d))}>
              {difficultyLabel(d)}
            </Chip>
          ))}
        </Field>
        <Field label="Question type">
          {QUESTION_TYPES.map((t) => (
            <Chip key={t} active={types.includes(t)} onClick={() => setTypes(toggle(types, t))}>
              {TYPE_LABEL[t]}
            </Chip>
          ))}
        </Field>
        <Field label="Question pool">
          {SOURCES.map((s) => (
            <Chip key={s.id} active={source === s.id} onClick={() => setSource(s.id)}>
              {s.label}
            </Chip>
          ))}
        </Field>
        <Field label="Number of questions">
          {[5, 10, 25, 50].map((n) => (
            <Chip key={n} active={count === n} onClick={() => setCount(n)}>
              {n}
            </Chip>
          ))}
        </Field>
        <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            <strong className="text-text">{available}</strong> matching questions
            {available < count && available > 0 && ` — the session will include all ${available}.`}
          </p>
          <Button variant="primary" size="lg" disabled={!available} onClick={() => start(filters)}>
            <Play className="size-4" /> Start session
          </Button>
        </div>
      </Card>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold">{label}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  )
}

function MultiSelect({
  options,
  value,
  onChange,
  placeholder,
}: {
  options: { id: string; label: string }[]
  value: string[]
  onChange: (v: string[]) => void
  placeholder: string
}) {
  return (
    <div className="w-full">
      <select
        value=""
        onChange={(e) => e.target.value && onChange([...value, e.target.value])}
        className="h-10 w-full max-w-md rounded-md border border-border bg-surface px-3 text-sm"
        aria-label={placeholder}
      >
        <option value="">{value.length ? 'Add another…' : placeholder}</option>
        {options
          .filter((o) => !value.includes(o.id))
          .map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
      </select>
      {value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {value.map((v) => (
            <Chip key={v} active onClick={() => onChange(value.filter((x) => x !== v))} aria-label={`Remove ${v}`}>
              {options.find((o) => o.id === v)?.label ?? v} ×
            </Chip>
          ))}
        </div>
      )}
    </div>
  )
}
