import { beforeEach, describe, expect, it } from 'vitest'
import { LocalStorageRepository, migrate } from './storage'
import { emptyProgress, PROGRESS_VERSION } from './types'

describe('progress storage', () => {
  beforeEach(() => localStorage.clear())
  it('round-trips progress', () => {
    const repo = new LocalStorageRepository('t')
    const p = { ...emptyProgress(), studySeconds: 42 }
    repo.save(p)
    expect(repo.load().studySeconds).toBe(42)
  })
  it('returns empty progress for corrupt data', () => {
    localStorage.setItem('t', '{not json')
    expect(new LocalStorageRepository('t').load()).toEqual(emptyProgress())
  })
  it('fills missing fields on migrate', () => {
    const m = migrate({ studySeconds: 5 })
    expect(m.version).toBe(PROGRESS_VERSION)
    expect(m.exams).toEqual([])
    expect(m.studySeconds).toBe(5)
  })
})
