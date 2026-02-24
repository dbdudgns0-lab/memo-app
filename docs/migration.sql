-- Memo App: LocalStorage → Supabase 마이그레이션
-- Supabase SQL Editor에서 실행하세요.

-- 1. memos 테이블 생성
CREATE TABLE IF NOT EXISTS memos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'other',
  tags TEXT[] DEFAULT '{}',
  summary TEXT,
  suggested_tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. 카테고리 인덱스
CREATE INDEX IF NOT EXISTS idx_memos_category ON memos (category);

-- 3. 생성일 내림차순 인덱스 (최신 순 정렬)
CREATE INDEX IF NOT EXISTS idx_memos_created_at ON memos (created_at DESC);

-- 4. 전문 검색용 인덱스
CREATE INDEX IF NOT EXISTS idx_memos_search ON memos
  USING GIN (to_tsvector('simple', title || ' ' || content));

-- 5. updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_memos_updated_at ON memos;
CREATE TRIGGER trigger_memos_updated_at
  BEFORE UPDATE ON memos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. RLS(Row Level Security) 비활성화 (인증 없는 공개 앱)
ALTER TABLE memos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to memos"
  ON memos
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 7. 목업 데이터 삽입
INSERT INTO memos (id, title, content, category, tags, created_at, updated_at)
VALUES
  (
    gen_random_uuid(),
    '프로젝트 회의 준비',
    E'다음 주 월요일 오전 10시 프로젝트 킥오프 미팅을 위한 준비사항:\n\n- 프로젝트 범위 정의서 작성\n- 팀원별 역할 분담\n- 일정 계획 수립\n- 필요한 리소스 정리',
    'work',
    ARRAY['회의', '프로젝트', '준비'],
    now() - INTERVAL '2 days',
    now() - INTERVAL '2 days'
  ),
  (
    gen_random_uuid(),
    'React 18 새로운 기능 학습',
    E'React 18에서 새로 추가된 기능들을 학습해야 함:\n\n1. Concurrent Features\n2. Automatic Batching\n3. Suspense 개선사항\n4. useId Hook\n5. useDeferredValue Hook\n\n이번 주말에 공식 문서를 읽고 간단한 예제를 만들어보자.',
    'study',
    ARRAY['React', '학습', '개발'],
    now() - INTERVAL '5 days',
    now() - INTERVAL '1 day'
  ),
  (
    gen_random_uuid(),
    '새로운 앱 아이디어: 습관 트래커',
    E'매일 실천하고 싶은 습관들을 관리할 수 있는 앱:\n\n핵심 기능:\n- 습관 등록 및 관리\n- 일일 체크인\n- 진행 상황 시각화\n- 목표 달성 알림\n- 통계 분석\n\n기술 스택: React Native + Supabase\n출시 목표: 3개월 후',
    'idea',
    ARRAY['앱개발', '습관', 'React Native'],
    now() - INTERVAL '7 days',
    now() - INTERVAL '3 days'
  ),
  (
    gen_random_uuid(),
    '주말 여행 계획',
    E'이번 주말 제주도 여행 계획:\n\n토요일:\n- 오전: 한라산 등반\n- 오후: 성산일출봉 관광\n- 저녁: 흑돼지 맛집 방문\n\n일요일:\n- 오전: 우도 관광\n- 오후: 쇼핑 및 기념품 구매\n- 저녁: 공항 이동\n\n준비물: 등산화, 카메라, 선크림',
    'personal',
    ARRAY['여행', '제주도', '주말'],
    now() - INTERVAL '10 days',
    now() - INTERVAL '8 days'
  ),
  (
    gen_random_uuid(),
    '독서 목록',
    E'올해 읽고 싶은 책들:\n\n개발 관련:\n- 클린 코드 (로버트 C. 마틴)\n- 리팩토링 2판 (마틴 파울러)\n- 시스템 디자인 인터뷰 (알렉스 쉬)\n\n자기계발:\n- 아토믹 해빗 (제임스 클리어)\n- 데일 카네기 인간관계론\n\n소설:\n- 82년생 김지영 (조남주)\n- 미드나잇 라이브러리 (매트 헤이그)',
    'personal',
    ARRAY['독서', '책', '자기계발'],
    now() - INTERVAL '15 days',
    now() - INTERVAL '15 days'
  ),
  (
    gen_random_uuid(),
    '성능 최적화 아이디어',
    E'웹 애플리케이션 성능 최적화 방법들:\n\n프론트엔드:\n- 이미지 최적화 (WebP, lazy loading)\n- 코드 스플리팅\n- 번들 크기 최적화\n- 캐싱 전략\n\n백엔드:\n- 데이터베이스 쿼리 최적화\n- CDN 활용\n- 서버 사이드 렌더링\n- API 응답 캐싱\n\n모니터링:\n- Core Web Vitals 측정\n- 성능 예산 설정',
    'idea',
    ARRAY['성능', '최적화', '웹개발'],
    now() - INTERVAL '20 days',
    now() - INTERVAL '12 days'
  );
