import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Shield, RefreshCcw, User, CheckCircle2 } from 'lucide-react';

export const MatchTeamTab: React.FC<{ matchId: string; isHost: boolean }> = ({ matchId, isHost }) => {
    const [participants, setParticipants] = useState<any[]>([]);
    const [teams, setTeams] = useState<any>({ white: [], black: [], unassigned: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [matchId]);

    async function loadData() {
        setLoading(true);
        const { data: participantsData } = await supabase
            .from('match_participants')
            .select('*, profiles:profiles(name, photo_url)')
            .eq('match_id', matchId)
            .eq('status', 'joined');

        const { data: teamMembers } = await supabase
            .from('match_team_members')
            .select('*')
            .eq('match_id', matchId);

        const whiteIds = teamMembers?.filter((m: any) => m.team_name === 'white').map((m: any) => m.user_id) || [];
        const blackIds = teamMembers?.filter((m: any) => m.team_name === 'black').map((m: any) => m.user_id) || [];

        const newTeams = {
            white: participantsData?.filter(p => whiteIds.includes(p.user_id)) || [],
            black: participantsData?.filter(p => blackIds.includes(p.user_id)) || [],
            unassigned: participantsData?.filter(p => !whiteIds.includes(p.user_id) && !blackIds.includes(p.user_id)) || []
        };

        setTeams(newTeams);
        setLoading(false);
    }

    const handleAssign = async (userId: string, teamName: string | null) => {
        if (!isHost) return;

        // Simplified for now: just update record in a match_team_members style (or local list if simple)
        // Let's use a simplified UPSERT logic for team members
        if (teamName) {
            await supabase.from('match_team_members').upsert({
                match_id: matchId,
                user_id: userId,
                team_name: teamName
            }, { onConflict: 'match_id,user_id' });
        } else {
            await supabase.from('match_team_members').delete().match({ match_id: matchId, user_id: userId });
        }
        
        loadData();
    };

    const autoSplit = async () => {
        if (!isHost) return;
        const all = [...teams.white, ...teams.black, ...teams.unassigned];
        // Random shuffle
        const shuffled = all.sort(() => Math.random() - 0.5);
        const mid = Math.ceil(shuffled.length / 2);
        
        const whiteTeam = shuffled.slice(0, mid);
        const blackTeam = shuffled.slice(mid);

        // Bulk upsert
        const inserts = [
            ...whiteTeam.map(t => ({ match_id: matchId, user_id: t.user_id, team_name: 'white' })),
            ...blackTeam.map(t => ({ match_id: matchId, user_id: t.user_id, team_name: 'black' }))
        ];

        await supabase.from('match_team_members').upsert(inserts, { onConflict: 'match_id,user_id' });
        loadData();
        
        // Notify chat
        await supabase.from('match_messages').insert({
            match_id: matchId,
            message: '방장이 팀을 랜덤으로 배정했습니다.',
            message_type: 'system'
        });
    };

    return (
        <div style={container}>
            <div style={header}>
                <h3 style={title}>팀 배정</h3>
                {isHost && (
                    <button onClick={autoSplit} style={autoBtn}>
                        <RefreshCcw size={16} /> 랜덤 배정
                    </button>
                )}
            </div>

            <div style={teamGrid}>
                <TeamBox 
                    name="흰팀" 
                    color="#fff" 
                    bg="rgba(255,255,255,0.05)" 
                    members={teams.white} 
                    isHost={isHost} 
                    onMove={(uid: string) => handleAssign(uid, 'black')}
                    onRemove={(uid: string) => handleAssign(uid, null)}
                />
                <TeamBox 
                    name="검정팀" 
                    color="#000" 
                    bg="rgba(255,255,255,0.02)" 
                    members={teams.black} 
                    isHost={isHost} 
                    onMove={(uid: string) => handleAssign(uid, 'white')}
                    onRemove={(uid: string) => handleAssign(uid, null)}
                />
            </div>

            {teams.unassigned.length > 0 && (
                <div style={unassignedBox}>
                    <h4 style={label}>미배정 인원 ({teams.unassigned.length})</h4>
                    <div style={unassignedList}>
                        {teams.unassigned.map((p: any) => (
                            <div key={p.id} style={pCard}>
                                <span style={pName}>{p.profiles?.name}</span>
                                {isHost && (
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <button onClick={() => handleAssign(p.user_id, 'white')} style={assignBtn}>흰팀</button>
                                        <button onClick={() => handleAssign(p.user_id, 'black')} style={assignBtn}>검정팀</button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const TeamBox = ({ name, bg, members, isHost, onMove, onRemove }: any) => (
    <div style={{ ...tBox, background: bg }}>
        <div style={tHeader}>{name} ({members.length})</div>
        <div style={tList}>
            {members.map((m: any) => (
                <div key={m.id} style={mRow}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>{m.profiles?.name}</span>
                    {isHost && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => onMove(m.user_id)} style={changeBtn}>전환</button>
                            <button onClick={() => onRemove(m.user_id)} style={removeBtn}>해제</button>
                        </div>
                    )}
                </div>
            ))}
            {members.length === 0 && <div style={empty}>배정된 인원 없음</div>}
        </div>
    </div>
);

// Attendance Tab
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
        await supabase.from('match_attendance').upsert({
            match_id: matchId,
            user_id: userId,
            status: status,
            checked_by: (await supabase.auth.getSession()).data.session?.user.id,
            checked_at: new Date().toISOString()
        }, { onConflict: 'match_id,user_id' });
        loadAttendance();
    };

    return (
        <div style={container}>
            <div style={header}>
                <h3 style={title}>출석 체크</h3>
                <p style={{ fontSize: '0.8rem', opacity: 0.5 }}>모임 종료 후 정확한 기록을 남겨주세요.</p>
            </div>
            <div style={attList}>
                {attendances.map(a => (
                    <div key={a.id} style={attCard}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                            <div style={attAvatar}><User size={16}/></div>
                            <span style={{ fontWeight: 800 }}>{a.profiles?.name}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <AttBtn active={a.attendance.status === 'attended'} label="참석" color="#10b981" onClick={() => updateStatus(a.user_id, 'attended')} disabled={!isHost} />
                            <AttBtn active={a.attendance.status === 'late'} label="지각" color="#f59e0b" onClick={() => updateStatus(a.user_id, 'late')} disabled={!isHost} />
                            <AttBtn active={a.attendance.status === 'no_show'} label="노쇼" color="#ef4444" onClick={() => updateStatus(a.user_id, 'no_show')} disabled={!isHost} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const AttBtn = ({ active, label, color, onClick, disabled }: any) => (
    <button 
        onClick={onClick}
        disabled={disabled}
        style={{
            padding: '6px 12px', borderRadius: '8px', border: 'none', fontSize: '0.8rem', fontWeight: 900, cursor: disabled ? 'default' : 'pointer',
            background: active ? color : 'rgba(255,255,255,0.05)',
            color: active ? 'white' : 'rgba(255,255,255,0.3)'
        }}
    >
        {label}
    </button>
);

// Styles
const container: React.CSSProperties = { padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' };
const header: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexDirection: 'column', gap: '4px' };
const title: React.CSSProperties = { fontSize: '1.25rem', fontWeight: 900 };
const autoBtn: React.CSSProperties = { alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontWeight: 800, cursor: 'pointer' };

const teamGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' };
const tBox: React.CSSProperties = { borderRadius: '24px', padding: '20px', border: '1px solid rgba(255,255,255,0.05)' };
const tHeader: React.CSSProperties = { fontSize: '0.85rem', fontWeight: 900, marginBottom: '16px', opacity: 0.5, textTransform: 'uppercase' };
const tList: React.CSSProperties = { display: 'grid', gap: '10px' };
const mRow: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' };
const changeBtn: React.CSSProperties = { fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent-primary)', background: 'transparent', border: 'none', cursor: 'pointer' };
const removeBtn: React.CSSProperties = { ...changeBtn, color: '#ef4444' };
const empty: React.CSSProperties = { textAlign: 'center', padding: '20px', fontSize: '0.8rem', opacity: 0.2 };

const unassignedBox: React.CSSProperties = { marginTop: '12px' };
const label: React.CSSProperties = { fontSize: '0.9rem', fontWeight: 900, marginBottom: '16px', opacity: 0.4 };
const unassignedList: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' };
const pCard: React.CSSProperties = { padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const pName: React.CSSProperties = { fontWeight: 700 };
const assignBtn: React.CSSProperties = { padding: '6px 10px', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' };

const attList: React.CSSProperties = { display: 'grid', gap: '12px' };
const attCard: React.CSSProperties = { display: 'flex', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' };
const attAvatar: React.CSSProperties = { width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)' };
