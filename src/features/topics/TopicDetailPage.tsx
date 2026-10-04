import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowRight, CheckCircle2, ChevronRight, Lightbulb, Play } from 'lucide-react'
import {
  comparisonsByTopic,
  content,
  diagramsByTopic,
  flashcardsByTopic,
  getDomain,
  objectiveTitle,
  questionsByTopic,
  quickrefByTopic,
  servicesByTopic,
} from '@/content'
import { useProgress } from '@/progress/store'
import { accuracyFor } from '@/progress/analytics'
import { pickQuestions } from '@/lib/session'
import { cn } from '@/lib/cn'
import { Callout, Badge, Button, ButtonLink, Card, DocLinks, DomainBadge, EmptyState, pct, ProgressRing, scoreColor, SectionTitle, tone, VersionNote } from '@/components/ui'
import { StatusPicker } from '@/components/StatusPicker'
import { DiagramCanvas } from '@/components/diagram/DiagramCanvas'
import { FlashcardPlayer } from '@/components/flashcards/FlashcardPlayer'
import { StudySession } from '@/components/question/StudySession'
import { Icon } from '@/components/Icon'
import { NotFoundPage } from '../NotFoundPage'
import { BEYOND_LABEL } from '@/content/scope'

const SECTIONS = [
  { id: 'overview', label: 'Overview', phase: 'learn' },
  { id: 'concepts', label: 'Key Concepts', phase: 'learn' },
  { id: 'how', label: 'How It Works', phase: 'learn' },
  { id: 'when', label: 'When to Use It', phase: 'learn' },
  { id: 'tips', label: 'Exam Tips', phase: 'learn' },
  { id: 'mistakes', label: 'Common Mistakes', phase: 'learn' },
  { id: 'confused', label: 'Commonly Confused', phase: 'learn' },
  { id: 'diagram', label: 'Visual Diagram', phase: 'visualize' },
  { id: 'flashcards', label: 'Flashcards', phase: 'review' },
  { id: 'practice', label: 'Practice Questions', phase: 'practice' },
  { id: 'mastery', label: 'Your Mastery', phase: 'analyze' },
  { id: 'docs', label: 'References', phase: 'analyze' },
] as const

const PHASES = [
  { id: 'learn', label: 'Learn', anchor: 'overview', icon: 'book-open' },
  { id: 'visualize', label: 'Visualize', anchor: 'diagram', icon: 'workflow' },
  { id: 'review', label: 'Review', anchor: 'flashcards', icon: 'square-stack' },
  { id: 'practice', label: 'Practice', anchor: 'practice', icon: 'target' },
  { id: 'analyze', label: 'Analyze', anchor: 'mastery', icon: 'activity' },
]

function useActiveSection(ids: readonly string[]) {
  const [active, setActive] = useState(ids[0])
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-80px 0px -60% 0px' },
    )
    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (el) obs.observe(el)
    })
    return () => obs.disconnect()
  }, [ids])
  return active
}

export function TopicDetailPage() {
  const { slug = '' } = useParams()
  const topic = content.topicBySlug.get(slug)
  const visitTopic = useProgress((s) => s.visitTopic)
  const progress = useProgress()
  const [sessionKey, setSessionKey] = useState(0)
  const [practicing, setPracticing] = useState(false)
  const [diagramIdx, setDiagramIdx] = useState(0)
  const active = useActiveSection(SECTIONS.map((s) => s.id))

  useEffect(() => {
    if (topic) visitTopic(topic.slug, topic.title)
    setPracticing(false)
    setDiagramIdx(0)
  }, [topic, visitTopic])

  const questions = useMemo(() => questionsByTopic(slug), [slug])
  const sessionQuestions = useMemo(() => pickQuestions(questions.filter((q) => !q.caseStudyId), 5), [questions, sessionKey])
  if (!topic) return <NotFoundPage what="topic" />

  const domain = getDomain(topic.domain)
  const diagrams = diagramsByTopic(slug)
  const cards = flashcardsByTopic(slug)
  const comparisons = comparisonsByTopic(slug)
  const services = servicesByTopic(slug)
  const refs = quickrefByTopic(slug)
  const primaryQs = questions.filter((q) => q.topic === slug)
  const acc = accuracyFor(progress, primaryQs.map((q) => q.id))
  const cardsKnown = cards.filter((c) => progress.flashcards[c.id]?.status === 'know').length
  const activePhase = SECTIONS.find((s) => s.id === active)?.phase
  const siblings = content.topics.filter((t) => t.domain === topic.domain)
  const nextTopic = siblings[siblings.findIndex((t) => t.slug === slug) + 1]

  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1 text-sm text-muted">
        <Link to="/topics" className="hover:text-accent">
          Study Topics
        </Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span>{domain.shortName}</span>
      </nav>

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap gap-2">
            {topic.examScope === 'beyond' ? (
              <Badge color="amber" icon="compass">
                {BEYOND_LABEL}
              </Badge>
            ) : (
              <DomainBadge domain={topic.domain} />
            )}
            {topic.objectiveIds.map((o) => (
              <Badge key={o}>{topic.examScope === 'beyond' ? `Related: ${objectiveTitle(o)}` : objectiveTitle(o)}</Badge>
            ))}
          </div>
          <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            <span className="grid size-11 shrink-0 place-items-center rounded-md" style={tone(domain.color, ['fg', 'bg'])}>
              <Icon name={topic.icon} className="size-6" />
            </span>
            {topic.title}
          </h1>
          <p className="mt-2 max-w-3xl text-[15px] text-muted">{topic.summary}</p>
        </div>
        <div className="shrink-0">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-subtle">Your status</p>
          <StatusPicker slug={topic.slug} title={topic.title} />
        </div>
      </div>

      {/* Learning flow */}
      <ol className="no-print mb-8 grid grid-cols-5 gap-1 rounded-lg border border-border bg-surface p-1.5 shadow-card" aria-label="Learning flow">
        {PHASES.map((p, i) => (
          <li key={p.id}>
            <a
              href={`#${p.anchor}`}
              onClick={(e) => {
                e.preventDefault()
                document.getElementById(p.anchor)?.scrollIntoView({ behavior: 'smooth' })
              }}
              className={cn(
                'flex flex-col items-center gap-1 rounded-md px-1 py-2 text-xs font-medium transition-colors sm:flex-row sm:justify-center sm:gap-2 sm:text-sm',
                activePhase === p.id ? 'bg-accent-soft text-accent' : 'text-muted hover:bg-surface-2',
              )}
            >
              <Icon name={p.icon} className="size-4" />
              <span>
                <span className="hidden sm:inline">{i + 1}. </span>
                {p.label}
              </span>
            </a>
          </li>
        ))}
      </ol>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="min-w-0 space-y-10">
          {topic.examScope === 'beyond' && (
            <Callout color="amber" icon="compass" title="Beyond the AZ-104 exam">
              This topic isn't in the AZ-104 skills-measured outline. It's here to build wider context about related Azure offerings. Its
              questions and flashcards don't count toward your readiness score and never appear in practice exams.
            </Callout>
          )}
          {topic.versionNote && <VersionNote>{topic.versionNote}</VersionNote>}

          <section>
            <SectionTitle id="overview">Overview</SectionTitle>
            <div className="prose-study max-w-3xl text-[15px]">
              {topic.overview.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>

          <section>
            <SectionTitle id="concepts">Key Concepts</SectionTitle>
            <dl className="grid gap-3 sm:grid-cols-2">
              {topic.keyConcepts.map((k) => (
                <Card key={k.term} className="p-4">
                  <dt className="font-semibold text-accent">{k.term}</dt>
                  <dd className="mt-1 text-sm leading-relaxed">{k.definition}</dd>
                </Card>
              ))}
            </dl>
          </section>

          <section>
            <SectionTitle id="how">How It Works</SectionTitle>
            <ol className="space-y-3">
              {topic.howItWorks.map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent-solid text-xs font-semibold text-accent-fg">{i + 1}</span>
                  <p className="pt-0.5 text-[15px] leading-relaxed">{s}</p>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <SectionTitle id="when">When to Use It</SectionTitle>
            <ul className="grid gap-2 sm:grid-cols-2">
              {topic.whenToUse.map((s, i) => (
                <li key={i} className="flex gap-2 rounded-md border border-border bg-surface p-3 text-sm leading-relaxed">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                  {s}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <SectionTitle id="tips">Exam Tips</SectionTitle>
            <div className="rounded-lg border p-4" style={tone('purple', ['bg', 'bd'])}>
              <ul className="space-y-2.5">
                {topic.examTips.map((s, i) => (
                  <li key={i} className="flex gap-2 text-[15px] leading-relaxed">
                    <Lightbulb className="mt-1 size-4 shrink-0" style={{ color: 'var(--c-purple-fg)' }} aria-hidden />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section>
            <SectionTitle id="mistakes">Common Mistakes</SectionTitle>
            <ul className="space-y-2">
              {topic.commonMistakes.map((s, i) => (
                <li key={i} className="flex gap-2 rounded-md border border-danger/25 bg-danger-soft p-3 text-sm leading-relaxed">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
                  {s}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <SectionTitle id="confused">Commonly Confused Services</SectionTitle>
            <div className="grid gap-3 sm:grid-cols-2">
              {topic.confusedWith.map((c) => (
                <Card key={c.name} className="flex flex-col p-4">
                  <p className="font-semibold">
                    {topic.title.split(' (')[0]} <span className="text-subtle">vs</span> {c.name}
                  </p>
                  <p className="mt-1 flex-1 text-sm leading-relaxed text-muted">{c.difference}</p>
                  {c.comparison && (
                    <Link to={`/compare/${c.comparison}`} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
                      Full comparison <ArrowRight className="size-3.5" />
                    </Link>
                  )}
                </Card>
              ))}
            </div>
            {comparisons.filter((c) => !topic.confusedWith.some((x) => x.comparison === c.id)).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {comparisons
                  .filter((c) => !topic.confusedWith.some((x) => x.comparison === c.id))
                  .map((c) => (
                    <Link key={c.id} to={`/compare/${c.id}`} className="rounded-full border border-border bg-surface px-3 py-1 text-sm hover:border-accent hover:text-accent">
                      <Icon name="scale" className="mr-1 inline size-3.5" />
                      {c.title}
                    </Link>
                  ))}
              </div>
            )}
          </section>

          <section>
            <SectionTitle id="diagram">Visual Diagram</SectionTitle>
            {diagrams.length ? (
              <>
                {diagrams.length > 1 && (
                  <div className="mb-3 flex flex-wrap gap-2" role="tablist">
                    {diagrams.map((d, i) => (
                      <button
                        key={d.id}
                        role="tab"
                        aria-selected={i === diagramIdx}
                        onClick={() => setDiagramIdx(i)}
                        className={cn('rounded-full border px-3 py-1 text-sm', i === diagramIdx ? 'border-accent bg-accent-soft text-accent' : 'border-border text-muted')}
                      >
                        {d.title}
                      </button>
                    ))}
                  </div>
                )}
                {diagrams[diagramIdx] && (
                  <>
                    <DiagramCanvas key={diagrams[diagramIdx].id} diagram={diagrams[diagramIdx]} />
                    <div className="mt-3 rounded-lg border border-border bg-surface p-4">
                      <p className="mb-1.5 text-sm font-semibold">What the exam expects you to understand</p>
                      <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
                        {diagrams[diagramIdx].examExpects.map((x, i) => (
                          <li key={i}>{x}</li>
                        ))}
                      </ul>
                      <Link to={`/visual/${diagrams[diagramIdx].id}`} className="mt-2 inline-block text-sm text-accent hover:underline">
                        Open full diagram →
                      </Link>
                    </div>
                  </>
                )}
              </>
            ) : (
              <EmptyState icon="workflow" title="No diagram for this topic yet." />
            )}
          </section>

          <section>
            <SectionTitle id="flashcards">Flashcards</SectionTitle>
            {cards.length ? (
              <FlashcardPlayer cards={cards} compact />
            ) : (
              <EmptyState icon="square-stack" title="No flashcards for this topic yet." />
            )}
          </section>

          <section>
            <SectionTitle id="practice">Practice Questions</SectionTitle>
            {questions.length === 0 ? (
              <EmptyState icon="target" title="No questions for this topic yet." />
            ) : practicing ? (
              <StudySession key={sessionKey} questions={sessionQuestions} onRestart={() => setSessionKey((k) => k + 1)} compact />
            ) : (
              <Card className="flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">Quick check: {Math.min(5, questions.filter((q) => !q.caseStudyId).length)} questions</p>
                  <p className="text-sm text-muted">
                    Drawn from {questions.length} questions that cover this topic. You'll see a full explanation after each answer.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="primary" onClick={() => setPracticing(true)}>
                    <Play className="size-4" /> Start
                  </Button>
                  <ButtonLink to={`/practice/session?topic=${slug}&count=${Math.min(25, questions.length)}`}>All questions</ButtonLink>
                </div>
              </Card>
            )}
          </section>

          <section>
            <SectionTitle id="mastery">Your Mastery</SectionTitle>
            <Card className="grid gap-6 p-5 sm:grid-cols-[auto_1fr] sm:items-center">
              <ProgressRing value={acc.pct ?? 0} color={scoreColor(acc.pct)} label="Topic accuracy">
                <div>
                  <div className="text-2xl font-semibold">{pct(acc.pct)}</div>
                  <div className="text-xs text-muted">accuracy</div>
                </div>
              </ProgressRing>
              <div className="space-y-3 text-sm">
                <p>
                  <strong>{acc.answered}</strong> of {primaryQs.length} topic questions answered · <strong>{cardsKnown}</strong> of {cards.length} flashcards known
                </p>
                <p className="text-muted">
                  {acc.pct === null
                    ? 'Answer a few practice questions to measure your understanding.'
                    : acc.pct >= 85
                      ? 'Strong result. If concepts feel solid, mark this topic as Mastered.'
                      : acc.pct >= 65
                        ? 'Getting there. Re-read the exam tips and common mistakes, then practice again.'
                        : 'This looks like a weak area. Mark it Needs Review and revisit the diagram and comparisons.'}
                </p>
                <StatusPicker slug={topic.slug} title={topic.title} />
              </div>
            </Card>
          </section>

          <section>
            <SectionTitle id="docs">References</SectionTitle>
            <div className="grid gap-6 sm:grid-cols-2">
              <DocLinks links={topic.docLinks} title="Microsoft Learn & documentation" />
              <div className="space-y-4">
                {services.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-muted">Azure services</h3>
                    <div className="flex flex-wrap gap-2">
                      {services.map((s) => (
                        <Link key={s.id} to={`/services/${s.id}`} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-sm hover:border-accent hover:text-accent">
                          <Icon name={s.icon} className="size-3.5" />
                          {s.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {refs.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-muted">Cheat sheets</h3>
                    <div className="flex flex-wrap gap-2">
                      {refs.map((r) => (
                        <Link key={r.id} to={`/reference/${r.id}`} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-sm hover:border-accent hover:text-accent">
                          <Icon name={r.icon} className="size-3.5" />
                          {r.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {nextTopic && (
            <Link to={`/topics/${nextTopic.slug}`} className="group block">
              <Card className="flex items-center justify-between p-5 group-hover:border-accent/50">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-subtle">Next topic</p>
                  <p className="font-semibold group-hover:text-accent">{nextTopic.title}</p>
                </div>
                <ArrowRight className="size-5 text-accent" />
              </Card>
            </Link>
          )}
        </div>

        <aside className="no-print hidden lg:block">
          <nav aria-label="On this page" className="sticky top-24">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-subtle">On this page</p>
            <ul className="space-y-0.5 border-l border-border">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    onClick={(e) => {
                      e.preventDefault()
                      document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' })
                    }}
                    className={cn(
                      '-ml-px block border-l-2 py-1 pl-3 text-sm',
                      active === s.id ? 'border-accent font-medium text-accent' : 'border-transparent text-muted hover:text-text',
                    )}
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      </div>
    </div>
  )
}
