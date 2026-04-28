-- 훕콜렉터: 레벨 인증 및 패스트트랙 시스템 구축 SQL

-- 1. 수업 신청 테이블에 인증 신청 여부 컬럼 추가
ALTER TABLE public.class_requests 
ADD COLUMN IF NOT EXISTS is_certification BOOLEAN DEFAULT FALSE;

-- 2. 인증 판정 결과를 저장할 컬럼 추가 (수업 일지에 통합)
ALTER TABLE public.class_journals
ADD COLUMN IF NOT EXISTS certified_level INTEGER; -- 코치가 판정한 레벨 (1, 2, 3...)

-- 3. 레벨 인증 시 XP 보너스를 지급하는 전용 함수 생성
CREATE OR REPLACE FUNCTION certify_student_level(
    p_journal_id UUID,
    p_target_level INTEGER
)
RETURNS VOID AS $$
DECLARE
    v_student_id UUID;
    v_target_xp INTEGER;
BEGIN
    -- 1. 학생 ID 조회
    SELECT student_id INTO v_student_id FROM public.class_journals WHERE id = p_journal_id;
    
    -- 2. 목표 레벨에 따른 XP 문턱값 계산 
    -- 공식: Level = FLOOR(SQRT(p_xp / 250.0)) + 1
    -- Level 2 필요 XP: (2-1)^2 * 250 = 250
    -- Level 3 필요 XP: (3-1)^2 * 250 = 1000
    -- Level 4 필요 XP: (4-1)^2 * 250 = 2250
    
    IF p_target_level = 2 THEN v_target_xp := 250;
    ELSIF p_target_level = 3 THEN v_target_xp := 1000;
    ELSIF p_target_level = 4 THEN v_target_xp := 2250;
    ELSE v_target_xp := 0;
    END IF;

    -- 3. 학생의 XP를 해당 레벨의 최소치로 업데이트 (이미 더 높다면 유지)
    UPDATE public.profiles
    SET activity_score = GREATEST(activity_score, v_target_xp)
    WHERE id = v_student_id;

    -- 4. 일지에 판정 결과 기록
    UPDATE public.class_journals
    SET certified_level = p_target_level
    WHERE id = p_journal_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 인증 비용(1,000원) 정책 안내용 주석
COMMENT ON COLUMN public.class_requests.is_certification IS 'TRUE일 경우 레벨 인증 절차가 포함된 수업이며, 추가 비용 1,000원이 발생합니다.';
