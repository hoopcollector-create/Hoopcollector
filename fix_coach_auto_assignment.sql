-- 훕콜렉터: 코치 등급 자동 부여 방지 및 데이터 정제 스크립트

-- 1. 프로필 생성 시 코치 등급이 자동으로 들어가는 기본값 설정을 삭제합니다.
-- 이제 새로운 회원은 coach_grade가 NULL(또는 설정된 기본값 없음)인 상태로 가입됩니다.
ALTER TABLE public.profiles ALTER COLUMN coach_grade DROP DEFAULT;

-- 2. (선택 사항) 명시적으로 NULL을 기본값으로 지정하고 싶을 경우
-- ALTER TABLE public.profiles ALTER COLUMN coach_grade SET DEFAULT NULL;

-- 3. 현재 코치 역할을 정식으로 부여받지 않았음에도 등급이 적혀있는 학생들의 데이터를 초기화합니다.
-- (실수로 코치로 표시되던 회원들을 일반 학생으로 되돌리는 작업)
UPDATE public.profiles 
SET coach_grade = NULL 
WHERE coach_grade IS NOT NULL 
AND id NOT IN (
    SELECT user_id 
    FROM public.user_roles 
    WHERE role = 'coach'
);

COMMENT ON COLUMN public.profiles.coach_grade IS '코치 등급 (A, B, C). 관리자 승인 전에는 NULL이어야 함.';
