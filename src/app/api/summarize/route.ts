import { GoogleGenAI } from '@google/genai'
import { NextRequest, NextResponse } from 'next/server'

interface SummarizeResponse {
  summary: string
  suggestedTags: string[]
}

function parseResponse(text: string): SummarizeResponse {
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        summary: typeof parsed.summary === 'string' ? parsed.summary : text,
        suggestedTags: Array.isArray(parsed.suggestedTags)
          ? parsed.suggestedTags.filter(
              (t: unknown): t is string => typeof t === 'string',
            )
          : [],
      }
    } catch {
      // JSON 파싱 실패 시 fallback
    }
  }
  return { summary: text, suggestedTags: [] }
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.' },
      { status: 500 },
    )
  }

  try {
    const { content } = await request.json()

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: '메모 내용이 필요합니다.' },
        { status: 400 },
      )
    }

    const ai = new GoogleGenAI({ apiKey })

    const prompt = `다음 메모 내용을 분석하여 아래 JSON 형식으로 응답해 주세요.
반드시 JSON만 출력하고, 다른 텍스트는 포함하지 마세요.

{
  "summary": "한국어로 핵심 내용을 3~5문장 이내로 요약",
  "suggestedTags": ["추천태그1", "추천태그2", "추천태그3"]
}

규칙:
- summary: 메모의 핵심 내용을 한국어로 간결하게 요약
- suggestedTags: 메모 내용과 관련된 키워드 태그 3~5개를 한국어로 추천 (짧고 명확한 단어)

---
${content}
---`

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
    })

    const rawText = response.text ?? ''
    const result = parseResponse(rawText)

    return NextResponse.json(result)
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : '요약 중 오류가 발생했습니다.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
