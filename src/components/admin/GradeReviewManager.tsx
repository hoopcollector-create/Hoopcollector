import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export const GradeReviewManager = () => {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => { loadRequests(); }, []);

    async function loadRequests() {
        const { data } = await supabase.from('grade_review_requests').select('*, profiles:user_id(name, total_tokens, activity_score)').eq('status', 'pending');
        setRequests(data || []);
    }

    async function handleReview(req: any, newStatus: 'approved' | 'rejected') {
        setLoading(true);
        try {
            await supabase.from('grade_review_requests').update({ status: newStatus, reviewed_at: new Date().toISOString() }).eq('id', req.id);
            if (newStatus === 'approved') {
                // Update basic profile grade
                await supabase.from('profiles').update({ coach_grade: req.target_grade }).eq('id', req.user_id);
                // Sync with public coach profile level
                await supabase.from('coach_profiles').update({ coach_level: req.target_grade }).eq('user_id', req.user_id);
            }
            alert(`승급 심사가 ${newStatus === 'approved' ? '승인' : '거절'}되었습니다.`);
            loadRequests();
        } catch (e: any) {
            alert(e.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>코치 승급 심사</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '1.5rem' }}>코치들의 등급 상향(C→B, B→A) 요청을 검토합니다.</p>
            {requests.length === 0 ? <p style={{ color: 'rgba(255,255,255,0.4)' }}>대기 중인 승급 요청이 없습니다.</p> : (
                <div style={{ display: 'grid', gap: '16px' }}>
                    {requests.map((r: any) => (
                        <div key={r.id} style={{ padding: '20px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{r.profiles?.name} 코치</div>
                                <div style={{ padding: '4px 12px', background: '#3b82f6', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 900 }}>TO {r.target_grade} GRADE</div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                                <div><span style={{ opacity: 0.5 }}>현재 토큰:</span> {r.profiles?.total_tokens}</div>
                                <div><span style={{ opacity: 0.5 }}>활동 점수:</span> {r.profiles?.activity_score}</div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button onClick={() => handleReview(r, 'approved')} disabled={loading} style={{ padding: '8px 24px', borderRadius: '8px', background: '#3b82f6', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }}>심사 승인</button>
                                <button onClick={() => handleReview(r, 'rejected')} disabled={loading} style={{ padding: '8px 24px', borderRadius: '8px', background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', fontWeight: 700, cursor: 'pointer' }}>거절</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
