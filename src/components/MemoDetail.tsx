'use client'

import { useEffect, useCallback, useState } from 'react'
import dynamic from 'next/dynamic'
import { Memo, MEMO_CATEGORIES } from '@/types/memo'

const MDPreview = dynamic(
  () => import('@uiw/react-md-editor').then(mod => mod.default.Markdown),
  { ssr: false },
)

interface MemoDetailProps {
  memo: Memo
  onClose: () => void
  onEdit: (memo: Memo) => void
  onDelete: (id: string) => void
  onUpdateTags: (id: string, tags: string[]) => void
  onSaveSummary: (id: string, summary: string, suggestedTags: string[]) => void
}

export default function MemoDetail({
  memo,
  onClose,
  onEdit,
  onDelete,
  onUpdateTags,
  onSaveSummary,
}: MemoDetailProps) {
  const [summary, setSummary] = useState<string>(memo.summary ?? '')
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [summaryError, setSummaryError] = useState<string>('')
  const [suggestedTags, setSuggestedTags] = useState<string[]>(
    memo.suggestedTags ?? [],
  )

  const hasSavedSummary = !!memo.summary

  const newSuggestedTags = suggestedTags.filter(
    tag => !memo.tags.includes(tag),
  )

  const handleSummarize = useCallback(async () => {
    setIsSummarizing(true)
    setSummaryError('')
    setSummary('')
    setSuggestedTags([])

    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: memo.content }),
      })

      const data = await res.json()

      if (!res.ok) {
        setSummaryError(data.error || '요약에 실패했습니다.')
        return
      }

      const newSummary: string = data.summary ?? ''
      const newTags: string[] = Array.isArray(data.suggestedTags)
        ? data.suggestedTags
        : []

      setSummary(newSummary)
      setSuggestedTags(newTags)
      onSaveSummary(memo.id, newSummary, newTags)
    } catch {
      setSummaryError('네트워크 오류가 발생했습니다.')
    } finally {
      setIsSummarizing(false)
    }
  }, [memo.content, memo.id, onSaveSummary])

  const handleAddTag = useCallback(
    (tag: string) => {
      if (!memo.tags.includes(tag)) {
        onUpdateTags(memo.id, [...memo.tags, tag])
      }
    },
    [memo.id, memo.tags, onUpdateTags],
  )

  const handleAddAllTags = useCallback(() => {
    if (newSuggestedTags.length > 0) {
      onUpdateTags(memo.id, [...memo.tags, ...newSuggestedTags])
    }
  }, [memo.id, memo.tags, newSuggestedTags, onUpdateTags])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    },
    [onClose],
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [handleKeyDown])

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleDelete = () => {
    if (window.confirm('정말로 이 메모를 삭제하시겠습니까?')) {
      onDelete(memo.id)
      onClose()
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      personal: 'bg-blue-100 text-blue-800',
      work: 'bg-green-100 text-green-800',
      study: 'bg-purple-100 text-purple-800',
      idea: 'bg-yellow-100 text-yellow-800',
      other: 'bg-gray-100 text-gray-800',
    }
    return colors[category] || colors.other
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
      data-testid="memo-detail-backdrop"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(memo.category)}`}
            >
              {MEMO_CATEGORIES[
                memo.category as keyof typeof MEMO_CATEGORIES
              ] || memo.category}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleSummarize}
              disabled={isSummarizing}
              className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={hasSavedSummary ? 'AI 요약 다시 생성' : 'AI 요약'}
              data-testid="memo-detail-summarize-btn"
            >
              {isSummarizing ? (
                <svg
                  className="w-5 h-5 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth={4}
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              )}
            </button>
            <button
              onClick={() => onEdit(memo)}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="편집"
              data-testid="memo-detail-edit-btn"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
            <button
              onClick={handleDelete}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="삭제"
              data-testid="memo-detail-delete-btn"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
            <div className="w-px h-6 bg-gray-200 mx-1" />
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="닫기 (ESC)"
              data-testid="memo-detail-close-btn"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {memo.title}
          </h2>

          {summaryError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
              <svg
                className="w-4 h-4 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {summaryError}
            </div>
          )}

          {isSummarizing && (
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 animate-spin text-amber-600"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth={4}
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span className="text-sm text-amber-700 font-medium">
                  AI가 메모를 요약하고 있습니다...
                </span>
              </div>
            </div>
          )}

          {summary && (
            <div
              className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg"
              data-testid="memo-summary-card"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-amber-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                  <span className="text-sm font-semibold text-amber-800">
                    AI 요약
                  </span>
                </div>
                <button
                  onClick={handleSummarize}
                  disabled={isSummarizing}
                  className="text-xs text-amber-600 hover:text-amber-800 font-medium transition-colors disabled:opacity-50"
                  data-testid="memo-summary-regenerate-btn"
                >
                  다시 생성
                </button>
              </div>
              <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap">
                {summary}
              </p>

              {newSuggestedTags.length > 0 && (
                <div className="mt-3 pt-3 border-t border-amber-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-amber-700">
                      추천 태그
                    </span>
                    <button
                      onClick={handleAddAllTags}
                      className="text-xs text-amber-600 hover:text-amber-800 font-medium transition-colors"
                      data-testid="add-all-tags-btn"
                    >
                      모두 추가
                    </button>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {newSuggestedTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => handleAddTag(tag)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs rounded-full transition-colors"
                        data-testid="suggested-tag"
                      >
                        #{tag}
                        <svg
                          className="w-3 h-3"
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
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div data-color-mode="light">
            <MDPreview source={memo.content} />
          </div>

          {memo.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-6 pt-4 border-t border-gray-100">
              {memo.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 푸터 - 날짜 정보 */}
        <div className="px-6 py-4 border-t border-gray-100 text-xs text-gray-400 flex justify-between">
          <span>작성: {formatDate(memo.createdAt)}</span>
          <span>수정: {formatDate(memo.updatedAt)}</span>
        </div>
      </div>
    </div>
  )
}
