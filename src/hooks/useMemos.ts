'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Memo, MemoFormData } from '@/types/memo'
import {
  fetchMemos as fetchMemosAction,
  createMemo as createMemoAction,
  updateMemo as updateMemoAction,
  deleteMemo as deleteMemoAction,
  updateMemoSummary as updateMemoSummaryAction,
  updateMemoTags as updateMemoTagsAction,
} from '@/actions/memos'

export const useMemos = () => {
  const [memos, setMemos] = useState<Memo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const loaded = await fetchMemosAction()
        setMemos(loaded)
      } catch (error) {
        console.error('Failed to load memos:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const createMemo = useCallback(
    async (formData: MemoFormData): Promise<Memo> => {
      const newMemo = await createMemoAction(formData)
      setMemos(prev => [newMemo, ...prev])
      return newMemo
    },
    [],
  )

  const updateMemo = useCallback(
    async (id: string, formData: MemoFormData): Promise<void> => {
      const existingMemo = memos.find(memo => memo.id === id)
      if (!existingMemo) return

      const contentChanged = existingMemo.content !== formData.content
      const updatedMemo = await updateMemoAction(id, formData, contentChanged)
      setMemos(prev => prev.map(memo => (memo.id === id ? updatedMemo : memo)))
    },
    [memos],
  )

  const updateMemoSummary = useCallback(
    async (
      id: string,
      summary: string,
      suggestedTags: string[],
    ): Promise<void> => {
      const updatedMemo = await updateMemoSummaryAction(
        id,
        summary,
        suggestedTags,
      )
      setMemos(prev => prev.map(memo => (memo.id === id ? updatedMemo : memo)))
    },
    [],
  )

  const updateMemoTags = useCallback(
    async (id: string, tags: string[]): Promise<Memo> => {
      const updatedMemo = await updateMemoTagsAction(id, tags)
      setMemos(prev => prev.map(memo => (memo.id === id ? updatedMemo : memo)))
      return updatedMemo
    },
    [],
  )

  const deleteMemo = useCallback(async (id: string): Promise<void> => {
    await deleteMemoAction(id)
    setMemos(prev => prev.filter(memo => memo.id !== id))
  }, [])

  const searchMemos = useCallback((query: string): void => {
    setSearchQuery(query)
  }, [])

  const filterByCategory = useCallback((category: string): void => {
    setSelectedCategory(category)
  }, [])

  const getMemoById = useCallback(
    (id: string): Memo | undefined => {
      return memos.find(memo => memo.id === id)
    },
    [memos],
  )

  const filteredMemos = useMemo(() => {
    let filtered = memos

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(memo => memo.category === selectedCategory)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        memo =>
          memo.title.toLowerCase().includes(query) ||
          memo.content.toLowerCase().includes(query) ||
          memo.tags.some(tag => tag.toLowerCase().includes(query)),
      )
    }

    return filtered
  }, [memos, selectedCategory, searchQuery])

  const stats = useMemo(() => {
    const totalMemos = memos.length
    const categoryCounts = memos.reduce(
      (acc, memo) => {
        acc[memo.category] = (acc[memo.category] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return {
      total: totalMemos,
      byCategory: categoryCounts,
      filtered: filteredMemos.length,
    }
  }, [memos, filteredMemos])

  return {
    memos: filteredMemos,
    allMemos: memos,
    loading,
    searchQuery,
    selectedCategory,
    stats,

    createMemo,
    updateMemo,
    updateMemoSummary,
    updateMemoTags,
    deleteMemo,
    getMemoById,

    searchMemos,
    filterByCategory,
  }
}
