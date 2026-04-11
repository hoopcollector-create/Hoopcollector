import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export const ApprovalsManager = () => {
    const [coachApps, setCoachApps] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    
    useEffect(() => { loadApps(); }, []);
    
    async function loadApps() {
        const { data } = await supabase.from('coach_profiles').select('user_id, profiles(name, phone), specialty, certifications, active').eq('active', false);
        setCoachApps(data || []);
    }

    async function approve(userId: string) {
        setLoading(true);
        try {
            // 1. Set coach role
            await supabase.from('user_roles').insert({ user_id: userId, role: 'coach' });
            // 2. Activate application and set initial level
            await supabase.from('coach_profiles').update({ active: true, coach_level: 'C' }).eq('user_id', userId);
            // 3. Ensure Grade C in profile
            await supabase.from('profiles').update({ coach_grade: 'C' }).eq('id', userId);
            
            alert("코치 승인이 완료되었습니다. (Grade C 부여)");
            loadApps();
        } catch (e: any) {
            alert(e.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>코치 지원 승인 결재</h2>
            {coachApps.length === 0 ? <p style={{ color: 'rgba(255,255,255,0.6)' }}>대기 중인 코치 신청이 없습니다.</p> : (
                <div style={{ display: 'grid', gap: '16px' }}>
                    {coachApps.map((c: any) => (
                        <div key={c.id} style={{ padding: '20px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '8px' }}>{c.profiles?.name || '지원자'} ({c.profiles?.phone || '번호 없음'})</div>
                            <div style={{ marginBottom: '4px' }}><span style={{ opacity: 0.5 }}>전문 분야:</span> {c.specialty}</div>
                            <div style={{ marginBottom: '16px' }}><span style={{ opacity: 0.5 }}>경력 사항:</span> {c.certifications?.join(', ') || '-'}</div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button onClick={() => approve(c.id)} disabled={loading} style={{ padding: '8px 24px', borderRadius: '8px', background: '#3b82f6', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }}>승인하기</button>
                                <button style={{ padding: '8px 24px', borderRadius: '8px', background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', fontWeight: 700, cursor: 'pointer' }}>반려하기</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
