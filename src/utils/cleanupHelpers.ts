import { supabase } from '../lib/supabase';

/**
 * 시간이 경과했음에도 수락되지 않은(requested) 수업 신청을 자동 취소하고 학생에게 알림을 보냅니다.
 * 이 함수는 대시보드 진입 시 또는 앱 초기화 시 실행되어 백엔드 크론 작업을 보완합니다.
 */
export async function autoCancelExpiredRequests() {
    try {
        const now = new Date().toISOString();

        // 1. 시간이 지난 'requested' 상태의 수업 요청 조회
        const { data: expiredReqs, error: fetchError } = await supabase
            .from('class_requests')
            .select('id, student_id, class_type, requested_start')
            .eq('status', 'requested')
            .lt('requested_start', now);

        if (fetchError) throw fetchError;
        if (!expiredReqs || expiredReqs.length === 0) return;

        console.log(`[Cleanup] Found ${expiredReqs.length} expired requests. Proceeding with auto-cancellation...`);

        for (const req of expiredReqs) {
            try {
                // 2. 각 요청에 대해 환불 기능을 포함한 취소 RPC 호출
                const { error: cancelError } = await supabase.rpc('cancel_class_request', {
                    p_request_id: req.id
                });

                if (cancelError) {
                    console.error(`[Cleanup] Failed to cancel request ${req.id}:`, cancelError);
                    continue;
                }

                // 3. 학생에게 취소 알림 발송
                await supabase.from('notifications').insert({
                    user_id: req.student_id,
                    type: 'class',
                    title: '[수업 자동 취소]',
                    content: `신청하신 ${new Date(req.requested_start).toLocaleDateString()} 수업 요청이 코치 미수락 및 시간 경과로 인해 자동 취소되었습니다. 티켓이 환불되었습니다.`,
                    is_read: false
                });

                console.log(`[Cleanup] Successfully auto-cancelled request ${req.id}`);
            } catch (innerErr) {
                console.error(`[Cleanup] Error during processing request ${req.id}:`, innerErr);
            }
        }
    } catch (e) {
        console.error('[Cleanup] autoCancelExpiredRequests failed:', e);
    }
}
