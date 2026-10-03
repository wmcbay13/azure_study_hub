import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, Check, ChevronDown, X } from 'lucide-react'
import type { Question } from '@/content/schema'
import { content } from '@/content'
import type { GivenAnswer } from '@/progress/types'
import { isCorrectOption, isMultiSelect } from '@/lib/grading'
import { shuffle } from '@/lib/random'
import { cn } from '@/lib/cn'
import { DifficultyBadge, DomainBadge, Badge } from '../ui'

const LETTERS = 'ABCDEFGHIJ'

const TYPE_LABEL: Record<Question['questionType'], string> = {
  single: 'Multiple choice',
  multi: 'Multiple answer',
  scenario: 'Scenario',
  ordering: 'Ordering',
  matching: 'Matching',
  caseStudy: 'Case study',
}

interface Props {
  question: Question
  value: GivenAnswer | undefined
  onChange: (v: GivenAnswer) => void
  /** Show correct/incorrect marking on options. */
  revealed?: boolean
  showMeta?: boolean
}

export function QuestionView({ question: q, value, onChange, revealed = false, showMeta = true }: Props) {
  const caseStudy = q.caseStudyId ? content.caseStudyById.get(q.caseStudyId) : undefined
  const multi = isMultiSelect(q)
  const needed = Array.isArray(q.correctAnswer) ? q.correctAnswer.length : 1

  return (
    <div className="space-y-4">
      {showMeta && (
        <div className="flex flex-wrap items-center gap-2">
          <DomainBadge domain={q.domain} />
          <DifficultyBadge difficulty={q.difficulty} />
          <Badge>{TYPE_LABEL[q.questionType]}</Badge>
        </div>
      )}

      {caseStudy && <CaseStudyPanel id={caseStudy.id} />}

      {q.scenario && (
        <div className="rounded-xl border-l-4 border-accent bg-surface-2 px-4 py-3 text-[15px] leading-relaxed">{q.scenario}</div>
      )}

      <p className="text-[17px] font-semibold leading-snug">{q.question}</p>

      {q.questionType === 'ordering' ? (
        <OrderingInput q={q} value={value} onChange={onChange} revealed={revealed} />
      ) : q.questionType === 'matching' ? (
        <MatchingInput q={q} value={value} onChange={onChange} revealed={revealed} />
      ) : (
        <>
          {multi && (
            <p className="text-sm text-muted">
              Select <strong>{needed}</strong>. Each correct selection is part of the solution.
            </p>
          )}
          <ChoiceInput q={q} multi={multi} value={value} onChange={onChange} revealed={revealed} />
        </>
      )}
    </div>
  )
}

function ChoiceInput({ q, multi, value, onChange, revealed }: { q: Question; multi: boolean; value: GivenAnswer | undefined; onChange: (v: GivenAnswer) => void; revealed: boolean }) {
  const selected = new Set(Array.isArray(value) ? value : typeof value === 'string' ? [value] : [])
  const toggle = (id: string) => {
    if (revealed) return
    if (!multi) return onChange(id)
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onChange(q.options.map((o) => o.id).filter((x) => next.has(x)))
  }
  return (
    <div role={multi ? 'group' : 'radiogroup'} aria-label="Answer options" className="space-y-2">
      {q.options.map((o, i) => {
        const isSel = selected.has(o.id)
        const correct = isCorrectOption(q, o.id)
        const state = revealed ? (correct ? 'correct' : isSel ? 'wrong' : 'idle') : isSel ? 'selected' : 'idle'
        return (
          <button
            key={o.id}
            role={multi ? 'checkbox' : 'radio'}
            aria-checked={isSel}
            disabled={revealed}
            onClick={() => toggle(o.id)}
            className={cn(
              'flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-[15px] transition-colors',
              state === 'idle' && 'border-border bg-surface hover:border-border-strong hover:bg-surface-2',
              state === 'selected' && 'border-accent bg-accent-soft',
              state === 'correct' && 'border-success bg-success-soft',
              state === 'wrong' && 'border-danger bg-danger-soft',
              revealed && 'cursor-default',
            )}
          >
            <span
              className={cn(
                'grid size-6 shrink-0 place-items-center border text-xs font-bold',
                multi ? 'rounded-md' : 'rounded-full',
                state === 'idle' && 'border-border-strong text-muted',
                state === 'selected' && 'border-accent bg-accent text-accent-fg',
                state === 'correct' && 'border-success bg-success text-white',
                state === 'wrong' && 'border-danger bg-danger text-white',
              )}
              aria-hidden
            >
              {state === 'correct' ? <Check className="size-3.5" /> : state === 'wrong' ? <X className="size-3.5" /> : LETTERS[i]}
            </span>
            <span className="pt-0.5">{o.text}</span>
            {revealed && isSel && <span className="sr-only">(your answer)</span>}
            {revealed && correct && <span className="sr-only">(correct answer)</span>}
          </button>
        )
      })}
    </div>
  )
}

function OrderingInput({ q, value, onChange, revealed }: { q: Question; value: GivenAnswer | undefined; onChange: (v: GivenAnswer) => void; revealed: boolean }) {
  const order = Array.isArray(value) && value.length === q.options.length ? value : null
  // Start from a shuffled order that differs from the answer.
  useEffect(() => {
    if (order) return
    const ids = q.options.map((o) => o.id)
    let s = shuffle(ids)
    const ca = q.correctAnswer as string[]
    for (let i = 0; i < 5 && s.every((id, j) => id === ca[j]); i++) s = shuffle(ids)
    onChange(s)
  }, [q.id])
  if (!order) return null
  const ca = q.correctAnswer as string[]
  const move = (i: number, d: -1 | 1) => {
    const j = i + d
    if (j < 0 || j >= order.length) return
    const next = [...order]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }
  const text = (id: string) => q.options.find((o) => o.id === id)?.text
  return (
    <div>
      {!revealed && <p className="mb-2 text-sm text-muted">Use the arrows to put the steps in the correct order.</p>}
      <ol className="space-y-2" aria-label="Order the items">
        {order.map((id, i) => {
          const ok = ca[i] === id
          return (
            <li
              key={id}
              className={cn(
                'flex items-center gap-3 rounded-xl border px-3 py-2.5 text-[15px]',
                !revealed && 'border-border bg-surface',
                revealed && (ok ? 'border-success bg-success-soft' : 'border-danger bg-danger-soft'),
              )}
            >
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-surface-3 text-xs font-bold">{i + 1}</span>
              <span className="flex-1">{text(id)}</span>
              {revealed ? (
                !ok && <span className="text-xs font-medium text-danger">should be #{ca.indexOf(id) + 1}</span>
              ) : (
                <span className="flex gap-1">
                  <button onClick={() => move(i, -1)} disabled={i === 0} className="rounded-lg p-1.5 hover:bg-surface-2 disabled:opacity-30" aria-label={`Move "${text(id)}" up`}>
                    <ArrowUp className="size-4" />
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    disabled={i === order.length - 1}
                    className="rounded-lg p-1.5 hover:bg-surface-2 disabled:opacity-30"
                    aria-label={`Move "${text(id)}" down`}
                  >
                    <ArrowDown className="size-4" />
                  </button>
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function MatchingInput({ q, value, onChange, revealed }: { q: Question; value: GivenAnswer | undefined; onChange: (v: GivenAnswer) => void; revealed: boolean }) {
  const map = value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  const ca = q.correctAnswer as Record<string, string>
  const targets = q.matchTargets ?? []
  return (
    <div>
      {!revealed && <p className="mb-2 text-sm text-muted">Match each item to the best option. Options can be used more than once.</p>}
      <div className="space-y-2">
        {q.options.map((o) => {
          const chosen = map[o.id]
          const ok = chosen === ca[o.id]
          return (
            <div
              key={o.id}
              className={cn(
                'grid gap-2 rounded-xl border px-3 py-2.5 sm:grid-cols-[1fr_minmax(0,16rem)] sm:items-center',
                !revealed && 'border-border bg-surface',
                revealed && (ok ? 'border-success bg-success-soft' : 'border-danger bg-danger-soft'),
              )}
            >
              <label htmlFor={`m-${q.id}-${o.id}`} className="text-[15px]">
                {o.text}
              </label>
              <div className="relative">
                <select
                  id={`m-${q.id}-${o.id}`}
                  value={chosen ?? ''}
                  disabled={revealed}
                  onChange={(e) => onChange({ ...map, [o.id]: e.target.value })}
                  className="h-10 w-full appearance-none rounded-lg border border-border bg-surface pr-8 pl-3 text-sm disabled:opacity-100"
                >
                  <option value="" disabled>
                    Choose…
                  </option>
                  {targets.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.text}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute top-3 right-2.5 size-4 text-subtle" aria-hidden />
              </div>
              {revealed && !ok && (
                <p className="text-xs font-medium text-success sm:col-span-2">Correct: {targets.find((t) => t.id === ca[o.id])?.text}</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CaseStudyPanel({ id }: { id: string }) {
  const cs = content.caseStudyById.get(id)!
  const [open, setOpen] = useState(true)
  return (
    <div className="rounded-2xl border border-border bg-surface-2">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between px-4 py-3 text-left" aria-expanded={open}>
        <span className="text-sm font-semibold">
          <span className="text-accent">Case study:</span> {cs.title}
        </span>
        <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      {open && (
        <div className="max-h-80 space-y-3 overflow-y-auto border-t border-border px-4 py-3 text-sm leading-relaxed">
          {cs.overview.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          <div>
            <h4 className="mb-1 font-semibold">Existing environment</h4>
            <ul className="list-disc space-y-1 pl-5">
              {cs.existingEnvironment.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-1 font-semibold">Requirements</h4>
            <ul className="list-disc space-y-1 pl-5">
              {cs.requirements.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
