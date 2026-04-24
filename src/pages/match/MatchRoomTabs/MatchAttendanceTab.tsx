import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { User, CheckCircle2 } from 'lucide-react';

export const MatchAttendanceTab: React.FC<{ matchId: string; isHost: boolean }> = ({ matchId, isHost }) => {
    const [attendances, setAttendances] = useState<any[]>([]);

    useEffect(() => {
        loadAttendance();
    }, [matchId]);

    async function loadAttendance() {
        const { data: participants } = await supabase
            .from('match_participants')
            .select('*, profiles:profiles(name, photo_url)')
            .eq('match_id', matchId)
            .eq('status', 'joined');

        const { data: attData } = await supabase
            .from('match_attendance')
            .select('*')
            .eq('match_id', matchId);

        const merged = participants?.map(p => ({
            ...p,
            attendance: attData?.find(a => a.user_id === p.user_id) || { status: 'unchecked' }
        }));

        setAttendances(merged || []);
    }

    const updateStatus = async (userId: string, status: string) => {
        if (!isHost) return;
        const { data: { session } } = await supabase.auth.getSession();
        
        await supabase.from('match_attendance').upsert({
            match_id: matchId,
            user_id: userId,
            status: status,
            checked_by: session?.user.id,
            checked_at: new Date().toISOString()
        }, { onConflict: 'match_id,user_id' });
        
        loadAttendance();

        // System message for attendance (optional but good for tracking)
        if (status === 'no_show') {
            await supabase.from('match_messages').insert({
                match_id: matchId,
                message: `${(attendances.find(a => a.user_id === userId) as any)?.profiles?.name}님이 노쇼 처리되었습니다. 유의해주세요.`,
                message_type: 'system'
            });
        }
    };

    return (
        <div style={container}>
            <div style={header}>
                <h3 style={title}>출석 체크</h3>
                <p style={{ fontSize: '0.85rem', opacity: 0.5, marginTop: '4px' }}>모임 종료 후 정확한 기록을 남겨주세요. 노쇼 기록은 매너 점수에 반영될 수 있습니다.</p>
            </div>
            <div style={attList}>
                {attendances.length === 0 ? (
                    <div style={empty}>참여자가 없습니다.</div>
                ) : (
                    attendances.map(a => (
                        <div key={a.id} style={attCard}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                                {a.profiles?.photo_url ? (
                                    <img src={a.profiles.photo_url} style={avatar} />
                                ) : (
                                    <div style={avatarFallback}><User size={16}/></div>
                                )}
                                <span style={{ fontWeight: 800 }}>{a.profiles?.name}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <AttBtn active={a.attendance.status === 'attended'} label="참석" color="#10b981" onClick={() => updateStatus(a.user_id, 'attended')} disabled={!isHost} />
                                <AttBtn active={a.attendance.status === 'late'} label="지각" color="#f59e0b" onClick={() => updateStatus(a.user_id, 'late')} disabled={!isHost} />
                                <AttBtn active={a.attendance.status === 'no_show'} label="노쇼" color="#ef4444" onClick={() => updateStatus(a.user_id, 'no_show')} disabled={!isHost} />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const AttBtn = ({ active, label, color, onClick, disabled }: any) => (
    <button 
        onClick={onClick}
        disabled={disabled}
        style={{
            minWidth: '50px', padding: '10px 12px', borderRadius: '12px', border: 'none', fontSize: '0.8rem', fontWeight: 900, cursor: disabled ? 'default' : 'pointer',
            background: active ? color : 'rgba(255,255,255,0.05)',
            color: active ? 'white' : 'rgba(255,255,255,0.3)',
            transition: 'all 0.2s'
        }}
    >
        {label}
    </button>
);

const container: React.CSSProperties = { padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' };
const header: React.CSSProperties = { display: 'flex', flexDirection: 'column' };
const title: React.CSSProperties = { fontSize: '1.25rem', fontWeight: 900 };
const attList: React.CSSProperties = { display: 'grid', gap: '12px' };
const attCard: React.CSSProperties = { display: 'flex', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' };
const avatar: React.CSSProperties = { width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' };
const avatarFallback: React.CSSProperties = { width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)' };
const empty: React.CSSProperties = { textAlign: 'center', padding: '100px', opacity: 0.2, fontWeight: 900 };
