import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export const CoachApplicationModal = ({ onClose }: { onClose: () => void }) => {
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');
    const [specialty, setSpecialty] = useState('');
    const [cert, setCert] = useState('');
    const [file, setFile] = useState<File | null>(null);

    async function handleSubmit() {
        if (!specialty.trim() || !cert.trim()) return setMsg('모든 항목을 입력해주세요.');
        setLoading(true); setMsg('');
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('로그인이 필요합니다.');

            let photoUrl = null;
            if (file) {
                const ext = file.name.split('.').pop();
                const path = `${session.user.id}-${Date.now()}.${ext}`;
                const { error: uploadError } = await supabase.storage.from('coach_profiles').upload(path, file);
                if (uploadError) throw uploadError;
                
                const { data } = supabase.storage.from('coach_profiles').getPublicUrl(path);
                photoUrl = data.publicUrl;
            }

            const { error } = await supabase.from('coach_profiles').upsert({
                user_id: session.user.id,
                specialty: specialty.trim(),
                certifications: [cert.trim()],
                photo_url: photoUrl,
                active: false
            }, { onConflict: 'user_id' });

            if (error) throw error;
            setMsg('코치 신청이 완료되었습니다! 관리자 승인 후 코치 모드를 이용할 수 있습니다.');
            setTimeout(() => onClose(), 3000);
        } catch (e: any) {
            setMsg(e.message || '신청 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#111827', padding: '2rem', borderRadius: '24px', maxWidth: '500px', width: '90%', border: '1px solid rgba(255,255,255,0.1)', position: 'relative' }}>
                <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.5rem' }}>✕</button>
                
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>코치 권한 신청</h2>
                <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '2rem' }}>훕콜렉터 코치로 활동하기 위해 프로필과 경력을 등록해 주세요.</p>
                
                {msg && <div style={{ padding: '12px', background: msg.includes('오류') || msg.includes('항목') ? 'var(--color-danger)' : 'rgba(59, 130, 246, 0.2)', color: msg.includes('오류') || msg.includes('항목') ? 'white' : 'var(--color-primary)', borderRadius: '12px', marginBottom: '1rem', fontSize: '0.9rem' }}>{msg}</div>}

                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>전문 분야</label>
                        <input value={specialty} onChange={e => setSpecialty(e.target.value)} placeholder="예: 스킬 트레이닝, 슈팅 교정" style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>자격 및 경력 요약</label>
                        <textarea value={cert} onChange={e => setCert(e.target.value)} placeholder="선수 경력이나 지도자 자격증 등을 적어주세요." style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', minHeight: '100px' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>프로필 사진</label>
                        <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} style={{ color: 'white', fontSize: '0.9rem' }} />
                    </div>

                    <button onClick={handleSubmit} disabled={loading} style={{ width: '100%', padding: '16px', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '14px', fontWeight: 800, fontSize: '1.1rem', marginTop: '1rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                        {loading ? '신청 중...' : '제출하기'}
                    </button>
                </div>
            </div>
        </div>
    );
};
