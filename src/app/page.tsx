'use client'

import { useState } from 'react'
import { useMemos } from '@/hooks/useMemos'
import { Memo, MemoFormData } from '@/types/memo'
import MemoList from '@/components/MemoList'
import MemoForm from '@/components/MemoForm'
import MemoDetail from '@/components/MemoDetail'

export default function Home() {
  const {
    memos,
    loading,
    searchQuery,
    selectedCategory,
    stats,
    createMemo,
    updateMemo,
    updateMemoSummary,
    updateMemoTags,
    deleteMemo,
    searchMemos,
    filterByCategory,
  } = useMemos()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingMemo, setEditingMemo] = useState<Memo | null>(null)
  const [viewingMemo, setViewingMemo] = useState<Memo | null>(null)

  const handleCreateMemo = async (formData: MemoFormData) => {
    await createMemo(formData)
    setIsFormOpen(false)
  }

  const handleUpdateMemo = async (formData: MemoFormData) => {
    if (editingMemo) {
      await updateMemo(editingMemo.id, formData)
      setEditingMemo(null)
    }
  }

  const handleViewMemo = (memo: Memo) => {
    setViewingMemo(memo)
  }

  const handleUpdateTags = async (id: string, tags: string[]) => {
    const updated = await updateMemoTags(id, tags)
    if (viewingMemo?.id === id) {
      setViewingMemo(updated)
    }
  }

  const handleSaveSummary = async (
    id: string,
    summary: string,
    suggestedTags: string[],
  ) => {
    await updateMemoSummary(id, summary, suggestedTags)
    if (viewingMemo?.id === id) {
      setViewingMemo(prev =>
        prev ? { ...prev, summary, suggestedTags } : null,
      )
    }
  }

  const handleEditMemo = (memo: Memo) => {
    setViewingMemo(null)
    setEditingMemo(memo)
    setIsFormOpen(true)
  }

  const handleDeleteMemo = async (id: string) => {
    await deleteMemo(id)
    if (viewingMemo?.id === id) {
      setViewingMemo(null)
    }
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingMemo(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-900">📝 메모 앱</h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsFormOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                새 메모
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MemoList
          memos={memos}
          loading={loading}
          searchQuery={searchQuery}
          selectedCategory={selectedCategory}
          onSearchChange={searchMemos}
          onCategoryChange={filterByCategory}
          onEditMemo={handleEditMemo}
          onDeleteMemo={handleDeleteMemo}
          onViewMemo={handleViewMemo}
          stats={stats}
        />
      </main>

      {/* 상세 보기 모달 */}
      {viewingMemo && (
        <MemoDetail
          memo={viewingMemo}
          onClose={() => setViewingMemo(null)}
          onEdit={handleEditMemo}
          onDelete={handleDeleteMemo}
          onUpdateTags={handleUpdateTags}
          onSaveSummary={handleSaveSummary}
        />
      )}

      {/* 모달 폼 */}
      <MemoForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={editingMemo ? handleUpdateMemo : handleCreateMemo}
        editingMemo={editingMemo}
      />
    </div>
  )
}
