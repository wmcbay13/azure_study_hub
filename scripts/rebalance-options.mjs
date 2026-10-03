// One-off authoring helper: deterministically shuffles choice options per question
// (seeded by question id) and relabels them a, b, c… so correct answers are evenly
// distributed. Safe to re-run: it reshuffles from the current order.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'

const dir = new URL('../content/questions/', import.meta.url)
const hash = (s) => [...s].reduce((h, c) => (Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0), 2166136261)
function rng(seed) {
  let x = seed || 1
  return () => ((x ^= x << 13), (x ^= x >>> 17), (x ^= x << 5), (x >>> 0) / 4294967296)
}

for (const f of readdirSync(dir)) {
  if (f === 'case-studies.json') continue
  const path = new URL(f, dir)
  const qs = JSON.parse(readFileSync(path, 'utf8'))
  for (const q of qs) {
    if (q.questionType === 'ordering' || q.questionType === 'matching') continue
    const r = rng(hash(q.id + ':v2'))
    const opts = [...q.options]
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1))
      ;[opts[i], opts[j]] = [opts[j], opts[i]]
    }
    const map = Object.fromEntries(opts.map((o, i) => [o.id, String.fromCharCode(97 + i)]))
    q.options = opts.map((o) => ({ ...o, id: map[o.id] }))
    q.correctAnswer = Array.isArray(q.correctAnswer) ? q.correctAnswer.map((id) => map[id]).sort() : map[q.correctAnswer]
    q.incorrectAnswerExplanations = Object.fromEntries(
      Object.entries(q.incorrectAnswerExplanations).map(([k, v]) => [map[k], v]).sort(([a], [b]) => a.localeCompare(b)),
    )
  }
  writeFileSync(path, JSON.stringify(qs, null, 2) + '\n')
}
