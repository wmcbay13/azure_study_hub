export interface NavItem {
  to: string
  label: string
  icon: string
}

export const NAV: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: 'gauge' },
  { to: '/topics', label: 'Study Topics', icon: 'book-open' },
  { to: '/visual', label: 'Visual Learning', icon: 'workflow' },
  { to: '/compare', label: 'Comparison Center', icon: 'scale' },
  { to: '/flashcards', label: 'Flashcards', icon: 'square-stack' },
  { to: '/practice', label: 'Practice Questions', icon: 'target' },
  { to: '/exam', label: 'Practice Exams', icon: 'clock' },
  { to: '/services', label: 'Service Explorer', icon: 'cloud' },
  { to: '/reference', label: 'Quick Reference', icon: 'file-text' },
  { to: '/progress', label: 'Study Progress', icon: 'activity' },
]
