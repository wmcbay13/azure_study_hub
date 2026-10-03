import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, MousePointerClick } from 'lucide-react'
import type { ColorToken, Diagram, DiagramNode } from '@/content/schema'
import { ICONS } from '../Icon'
import { Button, toneVar } from '../ui'
import { cn } from '@/lib/cn'

const NODE_W = 150
const NODE_H = 58

const size = (n: DiagramNode) => ({ w: n.w ?? NODE_W, h: n.h ?? NODE_H })

/** Point where the segment from the node centre towards (tx, ty) exits the node's rectangle. */
function exitPoint(n: DiagramNode, tx: number, ty: number, pad = 4) {
  const { w, h } = size(n)
  const dx = tx - n.x
  const dy = ty - n.y
  if (dx === 0 && dy === 0) return { x: n.x, y: n.y }
  const sx = dx ? (w / 2 + pad) / Math.abs(dx) : Infinity
  const sy = dy ? (h / 2 + pad) / Math.abs(dy) : Infinity
  const s = Math.min(sx, sy)
  return { x: n.x + dx * s, y: n.y + dy * s }
}

const COLORS: ColorToken[] = ['blue', 'teal', 'purple', 'orange', 'green', 'red', 'gray', 'amber', 'pink']

export function DiagramCanvas({ diagram, minWidth = 640 }: { diagram: Diagram; minWidth?: number }) {
  const [selected, setSelected] = useState<string | null>(null)
  const [step, setStep] = useState<number | null>(null)
  const nodes = useMemo(() => new Map(diagram.nodes.map((n) => [n.id, n])), [diagram])
  const highlight = step !== null ? new Set(diagram.steps[step]?.highlight) : null
  const sel = selected ? nodes.get(selected) : null
  const uid = diagram.id

  const isDim = (id: string) => highlight !== null && !highlight.has(id)

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-2xl border border-border bg-surface-2/60">
        <svg
          viewBox={`0 0 ${diagram.width} ${diagram.height}`}
          className="block h-auto w-full"
          style={{ minWidth: Math.min(minWidth, diagram.width) }}
          role="group"
          aria-label={`${diagram.title} diagram`}
        >
          <defs>
            <pattern id={`grid-${uid}`} width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="var(--border)" />
            </pattern>
            {COLORS.map((c) => (
              <marker key={c} id={`arrow-${uid}-${c}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 z" fill={toneVar(c)} />
              </marker>
            ))}
          </defs>
          <rect width={diagram.width} height={diagram.height} fill={`url(#grid-${uid})`} />

          {diagram.groups.map((g) => (
            <g key={g.id}>
              <rect
                x={g.x}
                y={g.y}
                width={g.w}
                height={g.h}
                rx={16}
                fill={toneVar(g.color, 'bg')}
                fillOpacity={0.55}
                stroke={toneVar(g.color, 'bd')}
                strokeWidth={1.5}
                strokeDasharray="6 4"
              />
              <text x={g.x + 14} y={g.y + 22} fontSize={13} fontWeight={700} fill={toneVar(g.color)}>
                {g.label}
              </text>
            </g>
          ))}

          {diagram.edges.map((e, i) => {
            const a = nodes.get(e.from)!
            const b = nodes.get(e.to)!
            const p1 = exitPoint(a, b.x, b.y)
            const p2 = exitPoint(b, a.x, a.y)
            const color = e.color ?? 'gray'
            const active = (selected && (e.from === selected || e.to === selected)) || (highlight && highlight.has(e.from) && highlight.has(e.to))
            const dim = highlight !== null && !(highlight.has(e.from) && highlight.has(e.to))
            const mx = (p1.x + p2.x) / 2
            const my = (p1.y + p2.y) / 2
            const lw = e.label ? e.label.length * 6.4 + 12 : 0
            return (
              <g key={i} opacity={dim ? 0.2 : 1} style={{ transition: 'opacity .2s' }}>
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={toneVar(color)}
                  strokeWidth={active ? 2.5 : 1.6}
                  strokeDasharray={e.style === 'dashed' ? '6 5' : undefined}
                  className={active && e.style !== 'dashed' ? 'edge-active' : undefined}
                  markerEnd={`url(#arrow-${uid}-${color})`}
                  markerStart={e.bidirectional ? `url(#arrow-${uid}-${color})` : undefined}
                />
                {e.label && (
                  <g>
                    <rect x={mx - lw / 2} y={my - 10} width={lw} height={20} rx={6} fill="var(--surface)" stroke={toneVar(color, 'bd')} />
                    <text x={mx} y={my + 4} textAnchor="middle" fontSize={11} fontWeight={600} fill={toneVar(color)}>
                      {e.label}
                    </text>
                  </g>
                )}
              </g>
            )
          })}

          {diagram.nodes.map((n) => {
            const { w, h } = size(n)
            const I = (n.icon && ICONS[n.icon]) || ICONS.cloud
            const isSel = selected === n.id
            return (
              <g
                key={n.id}
                transform={`translate(${n.x - w / 2} ${n.y - h / 2})`}
                role="button"
                tabIndex={0}
                aria-pressed={isSel}
                aria-label={`${n.label}${n.sublabel ? `, ${n.sublabel}` : ''}. Show details`}
                onClick={() => setSelected(isSel ? null : n.id)}
                onKeyDown={(ev) => {
                  if (ev.key === 'Enter' || ev.key === ' ') {
                    ev.preventDefault()
                    setSelected(isSel ? null : n.id)
                  }
                }}
                className="cursor-pointer outline-none [&:focus-visible>rect:first-child]:stroke-[var(--ring)]"
                opacity={isDim(n.id) ? 0.25 : 1}
                style={{ transition: 'opacity .2s' }}
              >
                <rect
                  width={w}
                  height={h}
                  rx={12}
                  fill="var(--surface)"
                  stroke={isSel ? toneVar(n.color) : toneVar(n.color, 'bd')}
                  strokeWidth={isSel ? 2.5 : 1.5}
                />
                <rect width={5} height={h - 16} x={0} y={8} rx={2.5} fill={toneVar(n.color)} />
                <rect x={12} y={h / 2 - 15} width={30} height={30} rx={8} fill={toneVar(n.color, 'bg')} />
                <I x={18} y={h / 2 - 9} width={18} height={18} color={toneVar(n.color)} strokeWidth={2} />
                <text x={50} y={n.sublabel ? h / 2 - 3 : h / 2 + 4.5} fontSize={13} fontWeight={650} fill="var(--text)">
                  {n.label}
                </text>
                {n.sublabel && (
                  <text x={50} y={h / 2 + 13} fontSize={11} fill="var(--muted)">
                    {n.sublabel}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      {diagram.legend.length > 0 && (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted" aria-label="Legend">
          {diagram.legend.map((l) => (
            <li key={l.label} className="flex items-center gap-1.5">
              <span className="size-3 rounded-sm border" style={{ background: toneVar(l.color, 'bg'), borderColor: toneVar(l.color) }} />
              {l.label}
            </li>
          ))}
        </ul>
      )}

      <div aria-live="polite" className={cn('rounded-2xl border p-4 transition-colors', sel ? '' : 'border-dashed border-border-strong')} style={sel ? { borderColor: toneVar(sel.color, 'bd'), background: toneVar(sel.color, 'bg') } : undefined}>
        {sel ? (
          <div>
            <p className="font-semibold" style={{ color: toneVar(sel.color) }}>
              {sel.label}
              {sel.sublabel && <span className="font-normal text-muted"> · {sel.sublabel}</span>}
            </p>
            <p className="mt-1 text-[15px] leading-relaxed">{sel.detail}</p>
          </div>
        ) : (
          <p className="flex items-center gap-2 text-sm text-muted">
            <MousePointerClick className="size-4" aria-hidden /> Click or tab to any component in the diagram to see what it does.
          </p>
        )}
      </div>

      {diagram.steps.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold">
              Walkthrough{' '}
              {step !== null && (
                <span className="text-muted">
                  · step {step + 1} of {diagram.steps.length}
                </span>
              )}
            </p>
            <div className="flex gap-2">
              {step === null ? (
                <Button size="sm" variant="primary" onClick={() => setStep(0)}>
                  Start walkthrough
                </Button>
              ) : (
                <>
                  <Button size="sm" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} aria-label="Previous step">
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setStep(step + 1 < diagram.steps.length ? step + 1 : step)}
                    disabled={step + 1 >= diagram.steps.length}
                    aria-label="Next step"
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setStep(null)}>
                    Exit
                  </Button>
                </>
              )}
            </div>
          </div>
          {step !== null && (
            <div className="mt-3" aria-live="polite">
              <p className="font-semibold text-accent">{diagram.steps[step].title}</p>
              <p className="mt-1 text-[15px] leading-relaxed">{diagram.steps[step].text}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
