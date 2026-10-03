/**
 * Validates every content file against its Zod schema, checks cross-references,
 * and reports content counts. Run with `npm run validate:content`.
 * Pass --min to also enforce the seed-content minimums.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { buildContent, ContentError } from '../src/content/build'

const root = join(import.meta.dirname, '..', 'content')

function readDir(dir: string, filter: (f: string) => boolean = () => true): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  const walk = (d: string) => {
    for (const name of readdirSync(d)) {
      const p = join(d, name)
      if (statSync(p).isDirectory()) walk(p)
      else if (name.endsWith('.json') && filter(name)) {
        try {
          out[relative(root, p)] = JSON.parse(readFileSync(p, 'utf8'))
        } catch (e) {
          throw new ContentError([`${relative(root, p)}: invalid JSON (${(e as Error).message})`])
        }
      }
    }
  }
  walk(join(root, dir))
  return out
}

try {
  const { content, problems } = buildContent(
    {
      objectives: JSON.parse(readFileSync(join(root, 'objectives.json'), 'utf8')),
      topics: readDir('topics'),
      services: readDir('services'),
      questions: readDir('questions', (f) => f !== 'case-studies.json'),
      caseStudies: readDir('questions', (f) => f === 'case-studies.json'),
      flashcards: readDir('flashcards'),
      diagrams: readDir('diagrams'),
      comparisons: readDir('comparisons'),
      quickref: readDir('quickref'),
    },
    { strict: false },
  )

  const counts = {
    topics: content.topics.length,
    services: content.services.length,
    questions: content.questions.length,
    caseStudies: content.caseStudies.length,
    flashcards: content.flashcards.length,
    diagrams: content.diagrams.length,
    comparisons: content.comparisons.length,
    quickref: content.quickref.length,
  }
  console.table(counts)

  const byType: Record<string, number> = {}
  const byDomain: Record<string, number> = {}
  const byDiff: Record<string, number> = {}
  for (const q of content.questions) {
    byType[q.questionType] = (byType[q.questionType] ?? 0) + 1
    byDomain[q.domain] = (byDomain[q.domain] ?? 0) + 1
    byDiff[q.difficulty] = (byDiff[q.difficulty] ?? 0) + 1
  }
  console.log('questions by domain', byDomain)
  console.log('questions by type', byType)
  console.log('questions by difficulty', byDiff)

  if (process.argv.includes('--min')) {
    const mins = { topics: 20, questions: 150, flashcards: 100, diagrams: 10, comparisons: 10, quickref: 10, services: 25 }
    for (const [k, v] of Object.entries(mins))
      if (counts[k as keyof typeof counts] < v) problems.push(`expected at least ${v} ${k}, found ${counts[k as keyof typeof counts]}`)
  }

  if (problems.length) {
    console.error(`\n✗ ${problems.length} content problem(s):\n- ${problems.join('\n- ')}`)
    process.exit(1)
  }
  console.log('\n✓ content valid')
} catch (e) {
  console.error(e instanceof ContentError ? e.message : e)
  process.exit(1)
}
