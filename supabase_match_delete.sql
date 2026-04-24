-- community_matches 삭제 정책 추가 (방장 및 관리자 전용)
DROP POLICY IF EXISTS "Matches can be deleted by host or admin" ON community_matches;

CREATE POLICY "Matches can be deleted by host or admin" ON community_matches
FOR DELETE
TO authenticated
USING (
  (auth.uid() = host_id) OR (public.is_admin())
);

-- 참고: public.is_admin()은 이전에 정의한 RBAC 핼퍼 함수를 사용합니다.
