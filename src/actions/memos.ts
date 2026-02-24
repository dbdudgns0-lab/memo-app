'use server'

import { supabase } from '@/utils/supabase'
import { Memo, MemoFormData } from '@/types/memo'

interface MemoRow {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  summary: string | null
  suggested_tags: string[] | null
  created_at: string
  updated_at: string
}

function toMemo(row: MemoRow): Memo {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    category: row.category,
    tags: row.tags ?? [],
    summary: row.summary ?? undefined,
    suggestedTags: row.suggested_tags ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function fetchMemos(): Promise<Memo[]> {
  const { data, error } = await supabase
    .from('memos')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data as MemoRow[]).map(toMemo)
}

export async function fetchMemoById(id: string): Promise<Memo | null> {
  const { data, error } = await supabase
    .from('memos')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return toMemo(data as MemoRow)
}

export async function createMemo(formData: MemoFormData): Promise<Memo> {
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('memos')
    .insert({
      title: formData.title,
      content: formData.content,
      category: formData.category,
      tags: formData.tags,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return toMemo(data as MemoRow)
}

export async function updateMemo(
  id: string,
  formData: MemoFormData,
  clearSummary: boolean = false,
): Promise<Memo> {
  const updateData: Record<string, unknown> = {
    title: formData.title,
    content: formData.content,
    category: formData.category,
    tags: formData.tags,
  }

  if (clearSummary) {
    updateData.summary = null
    updateData.suggested_tags = null
  }

  const { data, error } = await supabase
    .from('memos')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return toMemo(data as MemoRow)
}

export async function deleteMemo(id: string): Promise<void> {
  const { error } = await supabase.from('memos').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function updateMemoSummary(
  id: string,
  summary: string,
  suggestedTags: string[],
): Promise<Memo> {
  const { data, error } = await supabase
    .from('memos')
    .update({
      summary,
      suggested_tags: suggestedTags,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return toMemo(data as MemoRow)
}

export async function updateMemoTags(
  id: string,
  tags: string[],
): Promise<Memo> {
  const { data, error } = await supabase
    .from('memos')
    .update({ tags })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return toMemo(data as MemoRow)
}
