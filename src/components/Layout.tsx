import { Suspense, useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Flame, Menu, Monitor, Moon, PanelLeft, Search, Sun, X } from 'lucide-react'
import { NAV } from '@/lib/nav'
import { useTheme, type ThemePref } from '@/lib/theme'
import { cn } from '@/lib/cn'
import { useProgress } from '@/progress/store'
import { streak } from '@/progress/analytics'
import { Icon } from './Icon'
import { SearchDialog } from './SearchDialog'

function Logo({ compact }: { compact?: boolean }) {
  return (
    <NavLink to="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
      <span className="grid size-9 shrink-0 place-items-center rounded-md bg-accent-solid text-white shadow-card">
        <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
          <path d="M6.5 19h11a4.5 4.5 0 0 0 .6-8.96A6 6 0 0 0 6.7 9.1 5 5 0 0 0 6.5 19z" />
        </svg>
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="block text-[15px]">Azure Study Hub</span>
          <span className="block text-[11px] font-medium text-subtle">AZ-104 Administrator prep</span>
        </span>
      )}
    </NavLink>
  )
}

function NavItems({ collapsed, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  return (
    <nav aria-label="Main" className="flex flex-col gap-0.5">
      {NAV.map((n) => (
        <NavLink
          key={n.to}
          to={n.to}
          end={n.to === '/'}
          onClick={onNavigate}
          title={collapsed ? n.label : undefined}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              collapsed && 'justify-center px-0',
              isActive ? 'bg-accent-soft text-accent' : 'text-muted hover:bg-surface-2 hover:text-text',
            )
          }
        >
          <Icon name={n.icon} className="size-[18px] shrink-0" />
          {!collapsed && n.label}
        </NavLink>
      ))}
    </nav>
  )
}

const THEMES: { id: ThemePref; icon: typeof Sun; label: string }[] = [
  { id: 'light', icon: Sun, label: 'Light' },
  { id: 'dark', icon: Moon, label: 'Dark' },
  { id: 'system', icon: Monitor, label: 'System' },
]

function ThemeToggle() {
  const [pref, setPref] = useTheme()
  return (
    <div className="flex rounded-md border border-border bg-surface-2 p-0.5" role="radiogroup" aria-label="Color theme">
      {THEMES.map(({ id, icon: I, label }) => (
        <button
          key={id}
          role="radio"
          aria-checked={pref === id}
          title={label}
          onClick={() => setPref(id)}
          className={cn('grid size-7 place-items-center rounded-lg', pref === id ? 'bg-surface text-accent shadow-card' : 'text-subtle hover:text-text')}
        >
          <I className="size-4" aria-hidden />
          <span className="sr-only">{label}</span>
        </button>
      ))}
    </div>
  )
}

function useStudyTimer() {
  const addStudyTime = useProgress((s) => s.addStudyTime)
  useEffect(() => {
    const TICK = 30
    const id = setInterval(() => {
      if (document.visibilityState === 'visible' && document.hasFocus()) addStudyTime(TICK)
    }, TICK * 1000)
    return () => clearInterval(id)
  }, [addStudyTime])
}

export function Footer() {
  return (
    <footer className="mt-12 border-t border-border px-4 py-6 text-center text-xs leading-relaxed text-subtle sm:px-8">
      <p className="mx-auto max-w-3xl">
        Azure Study Hub is an independent learning resource and is not affiliated with or endorsed by Microsoft. Microsoft Azure,
        Microsoft Learn, and related product names are trademarks of Microsoft.
      </p>
      <p className="mx-auto mt-2 max-w-3xl">
        Azure changes frequently — confirm limits, pricing and portal behavior against{' '}
        <a className="text-accent hover:underline" href="https://learn.microsoft.com/azure/" target="_blank" rel="noreferrer">
          Microsoft Learn
        </a>
        . Practice questions are original and are not real exam questions.
      </p>
    </footer>
  )
}

export function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('ash-sidebar') === 'collapsed'
    } catch {
      return false
    }
  })
  const [searchOpen, setSearchOpen] = useState(false)
  const location = useLocation()
  const days = useProgress((s) => s.studyDays)
  const { current } = streak(days)
  useStudyTimer()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen((o) => !o)
      } else if (e.key === '/' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
    setMobileOpen(false)
  }, [location.pathname])

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      try {
        localStorage.setItem('ash-sidebar', c ? 'expanded' : 'collapsed')
      } catch {
        /* ignore */
      }
      return !c
    })
  }

  return (
    <div className="min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2">
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-border bg-surface transition-[width] lg:flex',
          collapsed ? 'w-[72px]' : 'w-64',
        )}
      >
        <div className={cn('flex h-16 items-center px-4', collapsed && 'justify-center px-0')}>
          <Logo compact={collapsed} />
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <NavItems collapsed={collapsed} />
        </div>
        <div className={cn('border-t border-border p-3', collapsed && 'flex justify-center')}>
          <button
            onClick={toggleCollapsed}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-subtle hover:bg-surface-2 hover:text-text"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <PanelLeft className="size-4" />
            {!collapsed && 'Collapse'}
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-surface shadow-pop">
            <div className="flex h-16 items-center justify-between px-4">
              <Logo />
              <button onClick={() => setMobileOpen(false)} className="rounded-lg p-2 hover:bg-surface-2" aria-label="Close menu">
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-2">
              <NavItems onNavigate={() => setMobileOpen(false)} />
            </div>
          </aside>
        </div>
      )}

      <div className={cn('flex min-h-dvh flex-col transition-[padding]', collapsed ? 'lg:pl-[72px]' : 'lg:pl-64')}>
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-bg/85 px-4 backdrop-blur sm:px-6">
          <button onClick={() => setMobileOpen(true)} className="rounded-lg p-2 hover:bg-surface-2 lg:hidden" aria-label="Open menu">
            <Menu className="size-5" />
          </button>
          <div className="lg:hidden">
            <Logo compact />
          </div>
          <button
            onClick={() => setSearchOpen(true)}
            className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm text-subtle shadow-card hover:border-border-strong sm:max-w-md"
          >
            <Search className="size-4 shrink-0" aria-hidden />
            <span className="truncate">Search Azure topics…</span>
            <kbd className="ml-auto hidden rounded-md border border-border bg-surface-2 px-1.5 font-mono text-[11px] sm:inline">Ctrl K</kbd>
          </button>
          <div className="ml-auto flex items-center gap-2">
            <span
              className="hidden items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 text-sm font-semibold sm:flex"
              title="Study streak (days)"
            >
              <Flame className={cn('size-4', current ? 'text-orange-500' : 'text-subtle')} aria-hidden />
              {current}
              <span className="sr-only">day study streak</span>
            </span>
            <ThemeToggle />
          </div>
        </header>
        <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Suspense fallback={<div className="py-20 text-center text-sm text-muted">Loading…</div>}>
            <Outlet />
          </Suspense>
        </main>
        <Footer />
      </div>
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}
