import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { Settings, Edit, Octagon, Trash2, Repeat } from 'lucide-react';

export const MatchManageTab: React.FC<{ match: any; onUpdate: () => void }> = ({ match, onUpdate }) => {
    const navigate = useNavigate();
    const isRecurring = match.is_recurring;

    const handleCancelOccurrence = async () => {
        if (!window.confirm('이번 회차만 취소하시겠습니까? 참여자들에게 알림이 전송됩니다.')) return;
        
        const { error } = await supabase.from('match_rooms').update({ status: 'cancelled' }).eq('id', match.id);
        if (!error) {
            await supabase.from('match_messages').insert({
                match_id: match.id,
                message: '방장이 이번 회차 모임을 취소했습니다.',
                message_type: 'system'
            });
            onUpdate();
        }
    };

    const handleDeleteRoom = async () => {
        if (!window.confirm('모임을 완전히 삭제하시겠습니까? 목록에서 제거됩니다.')) return;
        const { error } = await supabase.from('match_rooms').update({ status: 'deleted', is_hidden: true }).eq('id', match.id);
        if (!error) {
            alert('모임이 삭제되었습니다.');
            navigate('/match');
        }
    };

    const handleTerminateRecurring = async () => {
        if (!isRecurring || !match.template_id) return;
        if (!window.confirm('이 정기 모임의 모든 미래 회차를 종료하시겠습니까? 이미 생성된 회차들도 모두 취소됩니다.')) return;

        // 1. Terminate Template
        await supabase.from('match_templates').update({ is_active: false }).eq('id', match.template_id);
        // 2. Cancel Future Rooms
        await supabase.from('match_rooms').update({ status: 'cancelled' }).eq('template_id', match.template_id).gt('start_at', new Date().toISOString());

        alert('정기 모임이 완전히 종료되었습니다.');
        onUpdate();
    };

    return (
        <div style={container}>
            <div style={section}>
                <h3 style={title}>모임 관리 도구</h3>
                <p style={subtitle}>방장 및 관리자 권한으로 모임을 제어합니다.</p>
            </div>

            <div style={optionGrid}>
                {/* Edit Option */}
                <div style={optionCard}>
                    <div style={optionInfo}>
                        <h4 style={optTitle}>정보 수정</h4>
                        <p style={optDesc}>제목, 모집 인원, 공지사항 등을 수정합니다.</p>
                    </div>
                    <button style={optBtn} onClick={() => alert('수정 기능 준비 중입니다.')}><Edit size={16} /> 수정</button>
                </div>

                {/* Cancel Occurrence */}
                <div style={optionCard}>
                    <div style={optionInfo}>
                        <h4 style={optTitle}>이번 매치 취소</h4>
                        <p style={optDesc}>우천이나 장소 문제로 이번 일정을 취소합니다.</p>
                    </div>
                    <button onClick={handleCancelOccurrence} style={{ ...optBtn, color: '#f97316' }}>
                        <Octagon size={16} /> 취소 처리
                    </button>
                </div>

                {/* Recurring Options */}
                {isRecurring && (
                    <div style={{ ...optionCard, background: 'rgba(139, 92, 246, 0.05)', borderColor: 'rgba(139, 92, 246, 0.2)' }}>
                        <div style={optionInfo}>
                            <h4 style={{ ...optTitle, color: '#a78bfa' }}>정기 모임 전체 종료</h4>
                            <p style={{ ...optDesc, color: 'rgba(167, 139, 250, 0.6)' }}>앞으로 생길 모든 일정을 중단합니다.</p>
                        </div>
                        <button onClick={handleTerminateRecurring} style={{ ...optBtn, color: '#a78bfa' }}>
                            <Repeat size={16} /> 전체 종료
                        </button>
                    </div>
                )}

                {/* Delete Option */}
                <div style={{ ...optionCard, borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                    <div style={optionInfo}>
                        <h4 style={{ ...optTitle, color: '#ef4444' }}>방 삭제</h4>
                        <p style={optDesc}>모임을 영구적으로 삭제하고 목록에서 숨깁니다.</p>
                    </div>
                    <button onClick={handleDeleteRoom} style={{ ...optBtn, color: '#ef4444' }}>
                        <Trash2 size={16} /> 삭제
                    </button>
                </div>
            </div>
        </div>
    );
};

// Styles
const container: React.CSSProperties = { padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' };
const section: React.CSSProperties = { display: 'flex', flexDirection: 'column' };
const title: React.CSSProperties = { fontSize: '1.25rem', fontWeight: 950 };
const subtitle: React.CSSProperties = { color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', marginTop: '4px' };

const optionGrid: React.CSSProperties = { display: 'grid', gap: '16px' };
const optionCard: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', gap: '16px' };
const optionInfo: React.CSSProperties = { flex: 1 };
const optTitle: React.CSSProperties = { fontSize: '1rem', fontWeight: 900, marginBottom: '6px' };
const optDesc: React.CSSProperties = { fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 };
const optBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0 };
