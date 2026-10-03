import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Clock, Layers, Target, TrendingDown, TrendingUp } from 'lucide-react'
import { content, domains } from '@/content'
import { useProgress } from '@/progress/store'
import { domainStats, overallReadiness, recommendedTopic, streak, strongTopics, topicStats, totals, weakTopics } from '@/progress/analytics'
import { timeAgo } from '@/lib/date'
import { encodeFilters } from '../practice/params'
import { ButtonLink, Card, CardHeader, EmptyState, pct, ProgressRing, scoreColor, Stat, tone, toneVar } from '@/components/ui'
import { BarList, ScoreTrend } from '@/components/charts'
import { Icon } from '@/components/Icon'

const ACTIVITY_ICON = { topic: 'book-open', question: 'target', flashcard: 'square-stack', exam: 'clock', diagram: 'workflow', status: 'badge-check' } as const

export function DashboardPage() {
  const progress = useProgress()
  const dstats = useMemo(() => domainStats(progress, content), [progress])
  const readiness = overallReadiness(dstats, content)
  const t = totals(progress)
  const { current, longest } = streak(progress.studyDays)
  const tstats = useMemo(() => topicStats(progress, content), [progress])
  const weak = weakTopics(tstats, 5)
  const strong = strongTopics(tstats, 5)
  const rec = recommendedTopic(progress, content)
  const isNew = t.questionsAnswered === 0 && t.cardsReviewed === 0 && t.topicsStudied === 0

  return (
    <div className="space-y-6">
      {/* Hero */}
      <Card className="relative overflow-hidden p-6 sm:p-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{ background: 'radial-gradient(circle at 85% 20%, var(--accent-soft), transparent 55%)' }}
          aria-hidden
        />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center">
          <ProgressRing value={readiness} size={148} stroke={13} label={`AZ-104 readiness ${readiness}%`}>
            <div>
              <div className="text-4xl font-extrabold tabular-nums">{readiness}%</div>
              <div className="text-xs font-medium text-muted">readiness</div>
            </div>
          </ProgressRing>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-accent">AZ-104 · Microsoft Azure Administrator</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{isNew ? 'Welcome to Azure Study Hub' : 'Welcome back — keep the momentum going'}</h1>
            <p className="mt-2 max-w-2xl text-[15px] text-muted">
              {isNew
                ? 'Learn each concept, see it in a diagram, review with flashcards, then prove it with practice questions. Your readiness score grows as you go.'
                : 'Readiness blends your question accuracy, topic mastery and flashcard progress, weighted by each domain’s share of the exam.'}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <ButtonLink to={rec ? `/topics/${rec.topic.slug}` : '/topics'} variant="primary">
                <BookOpen className="size-4" /> Continue Studying
              </ButtonLink>
              <ButtonLink to={`/practice/session?${encodeFilters({ source: 'weak', count: 15 })}`} className={weak.length ? '' : 'hidden sm:inline-flex'}>
                <Target className="size-4" /> Review Weak Areas
              </ButtonLink>
              <ButtonLink to="/practice">
                <Icon name="list-ordered" className="size-4" /> Practice Questions
              </ButtonLink>
              <ButtonLink to="/exam">
                <Clock className="size-4" /> Start Practice Exam
              </ButtonLink>
              <ButtonLink to="/flashcards">
                <Layers className="size-4" /> Review Flashcards
              </ButtonLink>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat icon="book-open" color="blue" label="Topics studied" value={`${t.topicsStudied}/${content.topics.length}`} hint={`${t.topicsMastered} mastered`} />
        <Stat icon="square-stack" color="purple" label="Flashcards reviewed" value={t.cardsReviewed} hint={`${t.cardsKnown} known`} />
        <Stat icon="target" color="teal" label="Questions answered" value={t.questionsAnswered} hint={`of ${content.questions.length}`} />
        <Stat icon="badge-check" color="green" label="Accuracy" value={pct(t.accuracy)} hint={`${t.totalAttempts} attempts`} />
        <Stat icon="flame" color="orange" label="Day streak" value={current} hint={`best ${longest}`} />
        <Stat icon="trophy" color="amber" label="Practice exams" value={progress.exams.length} hint={progress.exams[0] ? `last ${pct(progress.exams[0].score)}` : 'none yet'} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] [&>*]:min-w-0">
        {/* Domains */}
        <Card>
          <CardHeader title="Progress by exam domain" subtitle="Readiness per AZ-104 skills area" action={<Link to="/progress" className="text-sm text-accent hover:underline">Details</Link>} />
          <ul className="space-y-4 p-5">
            {dstats.map((s) => {
              const d = domains.find((x) => x.id === s.id)!
              return (
                <li key={s.id}>
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                    <span className="flex min-w-0 items-center gap-2 font-medium">
                      <span className="grid size-7 shrink-0 place-items-center rounded-lg" style={tone(d.color, ['fg', 'bg'])}>
                        <Icon name={d.icon} className="size-4" />
                      </span>
                      <span className="truncate">{d.name}</span>
                    </span>
                    <span className="shrink-0 font-semibold tabular-nums">{s.readiness}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-surface-3" role="progressbar" aria-valuenow={s.readiness} aria-valuemin={0} aria-valuemax={100} aria-label={`${d.shortName} readiness`}>
                    <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${s.readiness}%`, background: toneVar(d.color, 'mk') }} />
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {d.weight} of exam · {s.topicsMastered}/{s.topicsTotal} topics mastered · accuracy {pct(s.accuracy.pct)} · {s.cardsKnown}/{s.cardsTotal} cards known
                  </p>
                </li>
              )
            })}
          </ul>
        </Card>

        {/* Recommended */}
        <div className="space-y-6">
          {rec && (
            <Link to={`/topics/${rec.topic.slug}`} className="group block">
              <Card className="p-5 transition-all group-hover:border-accent/50 group-hover:shadow-pop">
                <p className="text-xs font-semibold uppercase tracking-wide text-accent">Recommended next</p>
                <div className="mt-3 flex items-start gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
                    <Icon name={rec.topic.icon} className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold group-hover:text-accent">{rec.topic.title}</p>
                    <p className="text-sm text-muted">{rec.reason}</p>
                  </div>
                  <ArrowRight className="ml-auto size-5 shrink-0 self-center text-accent transition-transform group-hover:translate-x-0.5" />
                </div>
              </Card>
            </Link>
          )}
          <Card>
            <CardHeader title="Recent activity" />
            <div className="p-5 pt-3">
              {progress.activity.length === 0 ? (
                <p className="text-sm text-muted">Your study activity will show up here.</p>
              ) : (
                <ul className="space-y-2.5">
                  {progress.activity.slice(0, 7).map((a, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <Icon name={ACTIVITY_ICON[a.kind]} className="size-4 shrink-0 text-subtle" />
                      {a.href ? (
                        <Link to={a.href} className="min-w-0 flex-1 truncate hover:text-accent">
                          {a.label}
                        </Link>
                      ) : (
                        <span className="min-w-0 flex-1 truncate">{a.label}</span>
                      )}
                      <span className="shrink-0 text-xs text-subtle">{timeAgo(a.at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 [&>*]:min-w-0">
        <Card>
          <CardHeader title="Weakest topics" icon={<TrendingDown className="size-4 text-danger" />} />
          <div className="p-5 pt-3">
            {weak.length ? (
              <BarList
                rows={weak.map((s) => ({
                  id: s.topic.slug,
                  label: s.topic.title,
                  value: s.accuracy.pct,
                  color: scoreColor(s.accuracy.pct),
                  href: `/topics/${s.topic.slug}`,
                }))}
              />
            ) : (
              <p className="text-sm text-muted">No weak areas detected yet. Answer at least two questions in a topic to measure it.</p>
            )}
          </div>
        </Card>
        <Card>
          <CardHeader title="Strongest topics" icon={<TrendingUp className="size-4 text-success" />} />
          <div className="p-5 pt-3">
            {strong.length ? (
              <BarList
                rows={strong.map((s) => ({
                  id: s.topic.slug,
                  label: s.topic.title,
                  value: s.accuracy.pct,
                  color: scoreColor(s.accuracy.pct),
                  href: `/topics/${s.topic.slug}`,
                }))}
              />
            ) : (
              <p className="text-sm text-muted">Topics where you score 80%+ over three or more attempts appear here.</p>
            )}
          </div>
        </Card>
        <Card>
          <CardHeader title="Practice exam history" action={<Link to="/exam" className="text-sm text-accent hover:underline">All</Link>} />
          <div className="p-5 pt-3">
            {progress.exams.length ? (
              <>
                <ScoreTrend exams={progress.exams} height={140} />
                <ul className="mt-3 space-y-1.5 text-sm">
                  {progress.exams.slice(0, 3).map((e) => (
                    <li key={e.id}>
                      <Link to={`/exam/results/${e.id}`} className="flex justify-between hover:text-accent">
                        <span className="text-muted">{new Date(e.finishedAt).toLocaleDateString()}</span>
                        <span className="font-semibold tabular-nums">{pct(e.score)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <EmptyState icon="clock" title="No exams yet">
                <Link to="/exam" className="text-accent hover:underline">
                  Take your first practice exam
                </Link>
              </EmptyState>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
