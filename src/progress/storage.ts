/**
 * Persistence boundary for learner progress. The app only talks to a
 * ProgressRepository, so a cloud-backed implementation (with auth) can replace
 * LocalStorageRepository later without touching the store or UI.
 */
import { emptyProgress, PROGRESS_VERSION, type UserProgress } from './types'

export interface ProgressRepository {
  load(): UserProgress
  save(progress: UserProgress): void
  clear(): void
}

const KEY = 'ash-progress'

/** Upgrades older persisted shapes. Add a case per version bump. */
export function migrate(raw: unknown): UserProgress {
  const base = emptyProgress()
  if (!raw || typeof raw !== 'object') return base
  const data = raw as Partial<UserProgress>
  // v1 is the first version: fill any missing fields with defaults.
  return { ...base, ...data, version: PROGRESS_VERSION }
}

export class LocalStorageRepository implements ProgressRepository {
  constructor(private key = KEY) {}

  load(): UserProgress {
    try {
      const s = localStorage.getItem(this.key)
      return s ? migrate(JSON.parse(s)) : emptyProgress()
    } catch {
      return emptyProgress()
    }
  }

  save(progress: UserProgress) {
    try {
      localStorage.setItem(this.key, JSON.stringify(progress))
    } catch {
      // Storage unavailable (private mode, quota): progress stays in memory for this session.
    }
  }

  clear() {
    try {
      localStorage.removeItem(this.key)
    } catch {
      /* ignore */
    }
  }
}

export const repository: ProgressRepository = new LocalStorageRepository()
