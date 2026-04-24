# 훕콜렉터 코칭 커리큘럼 기반 수업 일지 및 평가 시스템 도입

훕콜렉터의 독자적인 코칭 커리큘럼(4단계 레벨 및 세부 스킬 트리)을 `ClassJournalModal` 및 학생 대시보드에 연동하여 단순 텍스트 피드백을 전문성을 갖춘 커리큘럼 평가 시스템으로 고도화합니다.

## User Review Required

> [!WARNING]
> 데이터베이스 스키마 수정(컬럼 추가)이 필요합니다. 적용 직후 기존에 작성하던 일지 포맷과 호환되게끔 JSONB 구조를 채택할 예정입니다. 평가 커리큘럼 로직이 방대하므로 평가 항목을 프론트엔드 레벨에서 상수(Constants)로 관리할지, DB 테이블 화 할지에 대한 피드백이 필요합니다. (초기 단계에서는 유지보수가 편리한 프론트엔드 하드코딩 모델을 제안합니다.)

## Proposed Changes

---

### [Database Schema Updates (Supabase)]

기존 `class_journals`와 `profiles` 테이블 구조에 커리큘럼 레벨업 및 성적 평가 데이터를 보관할 컬럼을 추가합니다.

#### [NEW] `update_curriculum_schema.sql`
- **`class_journals` 테이블 추가 컬럼**:
  - `session_number` (INT): 해당 일지가 학생의 몇 회차 수업인지 기록
  - `curriculum_level` (INT): 이번 수업에서 진행한/평가한 훕콜렉터 레벨 (1~4)
  - `evaluation_data` (JSONB): 각 항목(Finish, Move, Ball Handling 등)의 1~5점 평가 점수 데이터 보관
- **`profiles` 테이블 추가 컬럼**:
  - `basketball_level` (INT DEFAULT 1): 학생의 현재 훕콜렉터 농구 레벨 (1: Foundation, 2: Control, 3: Attack, 4: Game Apply)

---

### [Frontend Constants & Curriculum Engine]

#### [NEW] `src/constants/curriculum.ts`
- 훕콜렉터 1~4 레벨의 세부 카테고리(Ball Handling, Move, Cut, Action)와 평가 항목을 정의하는 파일
- **평가 시스템 로직**: 평균 점수 3.5 이상 시 승급 가능 기준을 계산하는 헬퍼 함수 포함

---

### [Class Journal (Coach Feedback Form)]

#### [MODIFY] `src/components/journal/ClassJournalModal.tsx`
- **Session Auto-Calculation**: 모달 로드 시 해당 학생의 완료된 `class_requests` 건수를 카운트하여 자동으로 `n번째 수업`임을 계산.
- **UI/UX 개편 (Step 추가)**:
  - **Step 1. Curriculum Evaluation**: 훕콜렉터 1~4 단계 중 하나를 선택하고, 세부 항목(양손 레이업, 크로스 드리블 등)을 1~5점으로 평가.
  - **Step 2. Text Feedback**: 기존의 코치 피드백 + 숙제 텍스트 작성. (평가에서 받은 점수가 부족한 부분을 숙제로 자동으로 추천해 줄 수 있는 힌트 기능 제공)
  - **Step 3. Visual Log**: 기존의 HoopSketchPad.
- **Level Up 로직**: 점수가 평균 3.5점을 넘을 경우, 코치에게 "학생을 레벨 2(혹은 다음 레벨)로 승급시키시겠습니까?" 와 같은 체크박스 토글 권한 부여. 제출 시 `profiles` 테이블의 레벨이 영구 업데이트됨.

---

### [Student Profile & Dashboard]

#### [MODIFY] `src/pages/Dashboard.tsx` (or Student Dashboard Components)
- 학생의 대시보드 상단 프로필 영역에 자신의 현재 `basketball_level` (예: "LV.2 CONTROL")을 멋지게 표시.
- 과거 수업 일지를 열람할 때, 방사형 차트나 바 차트(또는 리스트 형태)로 자신의 훕콜렉터 세부 훈련 점수를 확인할 수 있도록 UI 렌더링.

## Open Questions

> [!IMPORTANT]
> 1. **평가 항목 길이**: 훕콜렉터 기술 구조가 방대한데, 매 수업마다 "모든 항목"을 평가해야 하나요? 아니면 "오늘 수업에서 다룬 항목" 3~5가지만 선택해서 평가하는 형태가 좋을까요?
> 2. **레벨업 승인 로직**: 평균 3.5가 넘으면 코치가 직접 체크해야만 승급되는 방식이 맞을까요?

## Verification Plan

### Automated Tests
- DB 컬럼 추가 후 앱 재빌드 및 `npm run dev` 크래시 여부 확인.

### Manual Verification
- 코치 계정으로 로그인하여 이미 예약/완료된 학생의 '일지 작성' 클릭.
- n회차 자동 카운팅 확인.
- 1~5점 점수 입력 및 제출 시 에러 발생 체크.
- 학생 계정으로 로그인 시 대시보드에 갱신된 레벨(Level) 표시 여부 확인.
