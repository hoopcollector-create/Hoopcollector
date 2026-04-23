-- 훕콜렉터 코칭 커리큘럼 평가 및 레벨업 시스템 테이블 스키마 업데이트

-- 1. profiles 테이블: 학생의 현재 농구 레벨 관리 컬럼 추가
-- 기본값은 루키 티어를 대체할 첫 번째 단계인 'FOUNDATION'
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS basketball_level TEXT DEFAULT 'FOUNDATION';

COMMENT ON COLUMN public.profiles.basketball_level IS '훕콜렉터 학생 인증 레벨 (FOUNDATION, CONTROL, ATTACK, GAME_APPLY)';

-- 2. class_journals 테이블: 평가 데이터 저장을 위한 컬럼 추가
ALTER TABLE public.class_journals
ADD COLUMN IF NOT EXISTS session_number INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS curriculum_level TEXT,
ADD COLUMN IF NOT EXISTS evaluation_data JSONB;

COMMENT ON COLUMN public.class_journals.session_number IS '학생 기준 해당 수업 회차 (과거 누적 완료 건수 + 1)';
COMMENT ON COLUMN public.class_journals.curriculum_level IS '진행된 수업의 훕콜렉터 커리큘럼 레벨';
COMMENT ON COLUMN public.class_journals.evaluation_data IS '항목별 평가 상세 데이터 (스킬명, 1~5 완성도 점수 배열)';
