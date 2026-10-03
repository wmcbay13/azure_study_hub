import type { ComponentProps, CSSProperties, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { ExternalLink, Info } from 'lucide-react'
import type { ColorToken, Difficulty, DocLink, DomainId } from '@/content/schema'
import { getDomain } from '@/content'
import { cn } from '@/lib/cn'
import { Icon } from './Icon'

/** Inline style for a categorical color token. */
export const tone = (c: ColorToken, parts: ('fg' | 'bg' | 'bd')[] = ['fg', 'bg', 'bd']): CSSProperties => ({
  ...(parts.includes('fg') && { color: `var(--c-${c}-fg)` }),
  ...(parts.includes('bg') && { background: `var(--c-${c}-bg)` }),
  ...(parts.includes('bd') && { borderColor: `var(--c-${c}-bd)` }),
})
export const toneVar = (c: ColorToken, part: 'fg' | 'bg' | 'bd' | 'mk' = 'fg') => `var(--c-${c}-${part})`

export function Card({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('rounded-2xl border border-border bg-surface shadow-card', className)} {...props} />
}

export function CardHeader({ title, icon, action, subtitle }: { title: ReactNode; icon?: ReactNode; action?: ReactNode; subtitle?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 pt-5">
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
          {icon}
          {title}
        </h2>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
const variants: Record<Variant, string> = {
  primary: 'bg-accent text-accent-fg hover:bg-accent-hover shadow-card',
  secondary: 'border border-border bg-surface hover:bg-surface-2 text-text shadow-card',
  ghost: 'hover:bg-surface-2 text-text',
  danger: 'bg-danger text-white hover:opacity-90',
}
const sizes = { sm: 'h-8 px-3 text-sm gap-1.5', md: 'h-10 px-4 text-sm gap-2', lg: 'h-11 px-5 text-[15px] gap-2' }
const btnBase =
  'inline-flex items-center justify-center rounded-xl font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap'

export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  ...props
}: ComponentProps<'button'> & { variant?: Variant; size?: keyof typeof sizes }) {
  return <button type="button" className={cn(btnBase, variants[variant], sizes[size], className)} {...props} />
}

export function ButtonLink({
  variant = 'secondary',
  size = 'md',
  className,
  ...props
}: LinkProps & { variant?: Variant; size?: keyof typeof sizes }) {
  return <Link className={cn(btnBase, variants[variant], sizes[size], className)} {...props} />
}

export function Badge({ children, color = 'gray', className, icon }: { children: ReactNode; color?: ColorToken; className?: string; icon?: string }) {
  return (
    <span
      className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap', className)}
      style={tone(color)}
    >
      {icon && <Icon name={icon} className="size-3" />}
      {children}
    </span>
  )
}

export function DomainBadge({ domain, short = true }: { domain: DomainId; short?: boolean }) {
  const d = getDomain(domain)
  return (
    <Badge color={d.color} icon={d.icon}>
      {short ? d.shortName : d.name}
    </Badge>
  )
}

const DIFF: Record<Difficulty, { label: string; color: ColorToken }> = {
  beginner: { label: 'Beginner', color: 'green' },
  intermediate: { label: 'Intermediate', color: 'blue' },
  exam: { label: 'Exam Level', color: 'purple' },
  challenging: { label: 'Challenging', color: 'red' },
}
export const difficultyLabel = (d: Difficulty) => DIFF[d].label
export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return <Badge color={DIFF[difficulty].color}>{DIFF[difficulty].label}</Badge>
}

export function ProgressBar({ value, color, className, label }: { value: number; color?: string; className?: string; label?: string }) {
  const v = Math.max(0, Math.min(100, value))
  return (
    <div
      className={cn('h-2 w-full overflow-hidden rounded-full bg-surface-3', className)}
      role="progressbar"
      aria-valuenow={Math.round(v)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${v}%`, background: color ?? 'var(--accent)' }} />
    </div>
  )
}

export function ProgressRing({
  value,
  size = 120,
  stroke = 10,
  color = 'var(--accent)',
  children,
  label,
}: {
  value: number
  size?: number
  stroke?: number
  color?: string
  children?: ReactNode
  label?: string
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const v = Math.max(0, Math.min(100, value))
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }} role="img" aria-label={label ?? `${Math.round(v)}%`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (v / 100) * c}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  )
}

export function PageHeader({
  title,
  description,
  icon,
  actions,
  eyebrow,
}: {
  title: ReactNode
  description?: ReactNode
  icon?: string
  actions?: ReactNode
  eyebrow?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <div className="mb-2">{eyebrow}</div>}
        <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight sm:text-3xl">
          {icon && (
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
              <Icon name={icon} className="size-5" />
            </span>
          )}
          <span className="min-w-0">{title}</span>
        </h1>
        {description && <p className="mt-2 max-w-3xl text-[15px] text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function SectionTitle({ id, children, icon }: { id?: string; children: ReactNode; icon?: ReactNode }) {
  return (
    <h2 id={id} className="mb-3 flex scroll-mt-24 items-center gap-2 text-lg font-semibold tracking-tight">
      {icon}
      {children}
    </h2>
  )
}

export function EmptyState({ icon = 'compass', title, children }: { icon?: string; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border-strong p-8 text-center">
      <Icon name={icon} className="size-8 text-subtle" />
      <p className="font-medium">{title}</p>
      {children && <div className="text-sm text-muted">{children}</div>}
    </div>
  )
}

export function DocLinks({ links, title = 'Official documentation' }: { links: DocLink[]; title?: string }) {
  if (!links.length) return null
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-muted">{title}</h3>
      <ul className="space-y-1.5">
        {links.map((l) => (
          <li key={l.url}>
            <a
              href={l.url}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-start gap-1.5 text-sm text-accent hover:underline"
            >
              <ExternalLink className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              {l.title}
              <span className="sr-only">(opens in new tab)</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function VersionNote({ children }: { children?: ReactNode }) {
  if (!children) return null
  return (
    <div className="flex gap-2 rounded-xl border px-3 py-2 text-sm" style={tone('amber')}>
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div>
        <span className="font-semibold">Version-sensitive: </span>
        {children}
      </div>
    </div>
  )
}

export function Callout({ color = 'blue', icon = 'lightbulb', title, children }: { color?: ColorToken; icon?: string; title: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-2xl border p-4" style={{ ...tone(color, ['bg', 'bd']) }}>
      <div className="mb-1.5 flex items-center gap-2 text-sm font-semibold" style={tone(color, ['fg'])}>
        <Icon name={icon} className="size-4" />
        {title}
      </div>
      <div className="text-[15px] text-text">{children}</div>
    </div>
  )
}

export function Stat({ label, value, icon, hint, color = 'blue' }: { label: string; value: ReactNode; icon: string; hint?: ReactNode; color?: ColorToken }) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl" style={tone(color, ['fg', 'bg'])}>
        <Icon name={icon} className="size-5" />
      </span>
      <div className="min-w-0">
        <div className="text-xl font-bold tabular-nums leading-tight">{value}</div>
        <div className="text-xs leading-tight text-muted">{label}</div>
        {hint && <div className="truncate text-xs text-subtle">{hint}</div>}
      </div>
    </Card>
  )
}

export function Chip({ active, className, ...props }: ComponentProps<'button'> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        'rounded-full border px-3 py-1 text-sm transition-colors',
        active ? 'border-accent bg-accent-soft font-medium text-accent' : 'border-border bg-surface text-muted hover:bg-surface-2 hover:text-text',
        className,
      )}
      {...props}
    />
  )
}

export const pct = (v: number | null | undefined) => (v == null ? '—' : `${Math.round(v)}%`)

/** Colour for a 0–100 score: red < 60, amber < 80, green otherwise. */
export const scoreColor = (v: number | null | undefined) =>
  v == null ? 'var(--subtle)' : v < 60 ? 'var(--danger)' : v < 80 ? 'var(--warning)' : 'var(--success)'
