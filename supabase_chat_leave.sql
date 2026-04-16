-- 훕콜렉터 채팅방 나가기(Leave) 및 기록 완전 파기 스크립트 

-- 1. 유저의 나가기 이력 컬럼 추가
ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS left_student_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS left_coach_at TIMESTAMP WITH TIME ZONE;
COMMENT ON COLUMN chat_rooms.left_student_at IS '학생이 채팅방을 나간 시간 (NULL이면 현재 대화 중이라는 의미)';
COMMENT ON COLUMN chat_rooms.left_coach_at IS '코치가 채팅방을 나간 시간 (NULL이면 현재 대화 중이라는 의미)';

-- 2. "양쪽이 모두 방을 나갔고, 가장 늦게 나간 사람 기준으로도 30일이 초과된" 삭제 전용 RLS 룰 생성
-- 누구나 트리거를 건드려서 삭제할 수 있도록 만들되, "조건에 해당하는 좀비방" 만 지워지도록 방어합니다.
CREATE POLICY "Allow anyone to delete an abandoned 30-day chat room"
ON chat_rooms FOR DELETE
USING (
    left_student_at IS NOT NULL AND 
    left_coach_at IS NOT NULL AND 
    (left_student_at < now() - interval '30 days') AND
    (left_coach_at < now() - interval '30 days')
);

-- (참고) 테이블 데이터가 꼬이거나 직접 DB 콘솔 쿼리를 날릴 필요성은 없어졌습니다. 
-- 앞으로 클라이언트 단에서 getUserRooms 조회 시 30일 좀비방이 걸리면 앱 단에서 조용하게 삭제 트랜잭션이 발동됩니다!
