// SA10: Unit tests for repository layer
import { describe, it, expect, vi } from 'vitest'
import { createArticlesRepo } from '../../../src/repository'

describe('Articles Repository', () => {
  const mockDb = {
    prepare: vi.fn().mockReturnThis(),
    bind: vi.fn().mockReturnThis(),
    all: vi.fn().mockResolvedValue({ results: [] }),
    first: vi.fn().mockResolvedValue(null),
    run: vi.fn().mockResolvedValue({}),
  }

  const repo = createArticlesRepo(mockDb as any)

  it('findAll returns empty array when no articles exist', async () => {
    mockDb.all.mockResolvedValueOnce({ results: [] })
    const result = await repo.findAll()
    expect(result).toEqual([])
  })

  it('findBySlug returns null for non-existent article', async () => {
    mockDb.first.mockResolvedValueOnce(null)
    const result = await repo.findBySlug('nonexistent')
    expect(result).toBeNull()
  })

  it('search returns empty array for no matches', async () => {
    mockDb.all.mockResolvedValueOnce({ results: [] })
    const result = await repo.search('zzzzz')
    expect(result).toEqual([])
  })

  it('findPopular handles edge cases', async () => {
    mockDb.all.mockResolvedValueOnce({ results: [] })
    const result = await repo.findPopular(10)
    expect(result).toEqual([])
  })

  it('findLatest handles empty database', async () => {
    mockDb.all.mockResolvedValueOnce({ results: [] })
    const result = await repo.findLatest(10)
    expect(result).toEqual([])
  })
})
