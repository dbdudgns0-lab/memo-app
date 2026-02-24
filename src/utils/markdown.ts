/**
 * 마크다운 문법 기호를 제거하여 순수 텍스트를 반환한다.
 * 카드 미리보기 등 마크다운 렌더링 없이 내용만 표시할 때 사용.
 */
export function stripMarkdown(md: string): string {
  return (
    md
      // 코드 블록
      .replace(/```[\s\S]*?```/g, '')
      // 인라인 코드
      .replace(/`([^`]+)`/g, '$1')
      // 이미지
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
      // 링크
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // 헤딩
      .replace(/^#{1,6}\s+/gm, '')
      // 볼드/이탤릭
      .replace(/(\*{1,3}|_{1,3})(.+?)\1/g, '$2')
      // 취소선
      .replace(/~~(.+?)~~/g, '$1')
      // 인용문
      .replace(/^>\s+/gm, '')
      // 수평선
      .replace(/^[-*_]{3,}\s*$/gm, '')
      // 비순서 목록
      .replace(/^[\s]*[-*+]\s+/gm, '')
      // 순서 목록
      .replace(/^[\s]*\d+\.\s+/gm, '')
      // HTML 태그
      .replace(/<[^>]+>/g, '')
      // 연속 줄바꿈 정리
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  )
}
