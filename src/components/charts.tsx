import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { PracticeExamResult } from '@/progress/types'
import { dayKey } from '@/lib/date'
import { pct } from './ui'

/** Single-series line of practice exam scores over time, with hover tooltip. */
export function ScoreTrend({ exams, height = 160 }: { exams: PracticeExamResult[]; height?: number }) {
  const [hover, setHover] = useState<number | null>(null)
  const data = [...exams].sort((a, b) => a.finishedAt - b.finishedAt).slice(-12)
  if (data.length === 0) return null
  const W = 480
  const H = height
  const pad = { l: 34, r: 12, t: 12, b: 22 }
  const iw = W - pad.l - pad.r
  const ih = H - pad.t - pad.b
  const x = (i: number) => pad.l + (data.length === 1 ? iw / 2 : (i / (data.length - 1)) * iw)
  const y = (v: number) => pad.t + ih - (v / 100) * ih
  const path = data.map((e, i) => `${i ? 'L' : 'M'}${x(i)},${y(e.score)}`).join(' ')
  const h = hover !== null ? data[hover] : null

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Practice exam scores over time" onMouseLeave={() => setHover(null)}>
        {[0, 50, 100].map((g) => (
          <g key={g}>
            <line x1={pad.l} x2={W - pad.r} y1={y(g)} y2={y(g)} stroke="var(--border)" strokeWidth={1} />
            <text x={pad.l - 6} y={y(g) + 4} textAnchor="end" fontSize={10} fill="var(--subtle)">
              {g}%
            </text>
          </g>
        ))}
        <path d={path} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" />
        {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + ih} stroke="var(--border-strong)" strokeDasharray="3 3" />}
        {data.map((e, i) => (
          <g key={e.id}>
            <circle cx={x(i)} cy={y(e.score)} r={hover === i ? 5.5 : 4} fill="var(--accent)" stroke="var(--surface)" strokeWidth={2} />
            {/* Hit target wider than the mark */}
            <rect
              x={x(i) - iw / Math.max(2, data.length) / 2}
              y={pad.t}
              width={iw / Math.max(2, data.length)}
              height={ih}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              tabIndex={0}
              aria-label={`Exam ${i + 1}: ${Math.round(e.score)}%`}
            />
          </g>
        ))}
        <text x={pad.l} y={H - 4} fontSize={10} fill="var(--subtle)">
          oldest
        </text>
        <text x={W - pad.r} y={H - 4} fontSize={10} fill="var(--subtle)" textAnchor="end">
          latest
        </text>
      </svg>
      {h && hover !== null && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs shadow-pop"
          style={{ left: `${(x(hover) / W) * 100}%`, top: 0 }}
        >
          <div className="font-semibold">{pct(h.score)}</div>
          <div className="text-muted">{new Date(h.finishedAt).toLocaleDateString()}</div>
        </div>
      )}
    </div>
  )
}

/** Last N weeks of study days as a GitHub-style calendar (studied / not studied). */
export function StudyCalendar({ days, weeks = 14 }: { days: string[]; weeks?: number }) {
  const set = new Set(days)
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const end = new Date(today)
  end.setDate(end.getDate() + (6 - end.getDay()))
  const cells: { key: string; studied: boolean; future: boolean }[] = []
  for (let i = weeks * 7 - 1; i >= 0; i--) {
    const d = new Date(end)
    d.setDate(end.getDate() - i)
    const key = dayKey(d.getTime())
    cells.push({ key, studied: set.has(key), future: d > today })
  }
  return (
    <div>
      <div className="grid grid-flow-col grid-rows-7 gap-1" role="img" aria-label={`Study calendar: ${cells.filter((c) => c.studied).length} study days in the last ${weeks} weeks`}>
        {cells.map((c) => (
          <span
            key={c.key}
            title={`${c.key}${c.studied ? ' — studied' : ''}`}
            className="aspect-square w-full min-w-2.5 rounded-[3px]"
            style={{ background: c.future ? 'transparent' : c.studied ? 'var(--accent)' : 'var(--surface-3)' }}
          />
        ))}
      </div>
      <div className="mt-2 flex items-center justify-end gap-3 text-xs text-muted">
        <span className="flex items-center gap-1">
          <span className="size-2.5 rounded-[3px] bg-surface-3" /> No study
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2.5 rounded-[3px] bg-accent" /> Studied
        </span>
      </div>
    </div>
  )
}

/** Labelled horizontal bars; label + value are text so identity never relies on color. */
export function BarList({
  rows,
  emptyLabel = '—',
}: {
  rows: { id: string; label: string; value: number | null; color: string; href?: string; detail?: string; action?: React.ReactNode }[]
  emptyLabel?: string
}) {
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.id} className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)_auto] items-center gap-3 text-sm sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)_auto]">
          {r.href ? (
            <Link to={r.href} className="truncate font-medium hover:text-accent">
              {r.label}
            </Link>
          ) : (
            <span className="truncate font-medium">{r.label}</span>
          )}
          <div className="h-2.5 overflow-hidden rounded-full bg-surface-3" title={r.detail}>
            {r.value !== null && <div className="h-full rounded-full" style={{ width: `${Math.max(2, r.value)}%`, background: r.color }} />}
          </div>
          <span className="flex items-center gap-2">
            <span className="w-12 text-right font-semibold tabular-nums">{r.value === null ? <span className="text-xs font-normal text-subtle">{emptyLabel}</span> : pct(r.value)}</span>
            {r.action}
          </span>
        </li>
      ))}
    </ul>
  )
}
