import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CornerDownLeft, Search, X } from 'lucide-react'
import { content } from '@/content'
import { buildSearchDocs, createSearch, groupResults, KIND_ICON, KIND_LABEL } from '@/lib/search'
import { cn } from '@/lib/cn'
import { Icon } from './Icon'

let searchFn: ReturnType<typeof createSearch> | null = null
export const getSearch = () => (searchFn ??= createSearch(buildSearchDocs(content)))

const SUGGESTIONS = ['private endpoint', 'RBAC inheritance', 'storage redundancy', 'NSG', 'availability zone']

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const results = useMemo(() => getSearch()(q, 30), [q])
  const grouped = useMemo(() => groupResults(results), [results])
  const flat = grouped.flatMap(([, items]) => items)

  useEffect(() => {
    if (open) {
      setQ('')
      setActive(0)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  if (!open) return null

  const go = (href: string) => {
    onClose()
    navigate(href)
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
    else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, flat.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter') {
      if (flat[active]) go(flat[active].href)
      else if (q.trim()) go(`/search?q=${encodeURIComponent(q)}`)
    }
  }

  let i = -1
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[10vh] backdrop-blur-sm" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className="w-full max-w-2xl overflow-hidden rounded-lg border border-border bg-surface shadow-pop"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={onKey}
      >
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="size-5 text-subtle" aria-hidden />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setActive(0)
            }}
            placeholder="Search topics, services, flashcards, questions…"
            className="h-14 w-full bg-transparent text-[15px] outline-none placeholder:text-subtle"
            aria-label="Search query"
            role="combobox"
            aria-expanded={flat.length > 0}
            aria-controls="search-results"
          />
          <button onClick={onClose} className="rounded-lg p-1 text-subtle hover:bg-surface-2" aria-label="Close search">
            <X className="size-5" />
          </button>
        </div>
        <div id="search-results" className="max-h-[60vh] overflow-y-auto p-2" role="listbox">
          {q.trim().length < 2 ? (
            <div className="p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-subtle">Try</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => setQ(s)} className="rounded-full border border-border px-3 py-1 text-sm hover:bg-surface-2">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : flat.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted">No results for “{q}”.</p>
          ) : (
            grouped.map(([kind, items]) => (
              <div key={kind} className="mb-2">
                <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-subtle">{KIND_LABEL[kind]}</p>
                {items.slice(0, 6).map((r) => {
                  i++
                  const idx = i
                  return (
                    <button
                      key={r.kind + r.id}
                      role="option"
                      aria-selected={idx === active}
                      onMouseEnter={() => setActive(idx)}
                      onClick={() => go(r.href)}
                      className={cn('flex w-full items-start gap-3 rounded-md px-3 py-2 text-left', idx === active && 'bg-accent-soft')}
                    >
                      <Icon name={KIND_ICON[r.kind]} className="mt-0.5 size-4 shrink-0 text-accent" />
                      <span className="min-w-0">
                        <span className="line-clamp-1 text-sm font-medium">{r.title}</span>
                        <span className="line-clamp-1 text-xs text-muted">{r.snippet}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>
        <div className="flex items-center justify-between border-t border-border px-4 py-2 text-xs text-subtle">
          <span>↑↓ to navigate · Esc to close</span>
          {q.trim().length >= 2 && (
            <button onClick={() => go(`/search?q=${encodeURIComponent(q)}`)} className="flex items-center gap-1 text-accent hover:underline">
              See all results <CornerDownLeft className="size-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
