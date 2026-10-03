import { describe, expect, it } from 'vitest'
import { buildSearchDocs, createSearch } from './search'
import { content } from '@/content'

const search = createSearch(buildSearchDocs(content))

describe('global search', () => {
  it.each([
    ['private endpoint', 'private-service-endpoints'],
    ['RBAC', 'azure-rbac'],
    ['storage redundancy', 'storage-redundancy'],
    ['NSG', 'nsg-asg'],
    ['availability zone', 'vm-availability'],
  ])('"%s" surfaces the %s topic first among topics, near the top', (q, slug) => {
    const results = search(q, 8)
    expect(results.map((d) => d.id)).toContain(slug)
    expect(results.find((d) => d.kind === 'topic')?.id).toBe(slug)
  })
  it('ignores one-character queries', () => {
    expect(search('a')).toEqual([])
  })
})
