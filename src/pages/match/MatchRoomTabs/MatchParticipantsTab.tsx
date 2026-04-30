import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { User, XCircle, Shield, Award, Users, ClipboardCheck } from 'lucide-react';

interface MatchParticipantsTabProps {
    matchId: string;
    hostId: string;
    isHost: boolean;
}

export const MatchParticipantsTab: React.FC<MatchParticipantsTabProps> = ({ matchId, hostId, isHost }) => {
    const [participants, setParticipants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadParticipants();
    }, [matchId]);

    async function loadParticipants() {
        setLoading(true);
        const { data } = await supabase
            .from('match_participants')
            .select('*, profiles:profiles!match_participants_user_id_fkey(name, photo_url, role)')
            .eq('match_id', matchId)
            .order('joined_at', { ascending: true });
        setParticipants(data || []);
        setLoading(false);
    }

    const handleApprove = async (userId: string) => {
        const { error } = await supabase
            .from('match_participants')
            .update({ status: 'joined', joined_at: new Date().toISOString() })
            .eq('match_id', matchId)
            .eq('user_id', userId);
        
        if (error) alert(error.message);
        else loadParticipants();
    };

    const handleReject = async (userId: string) => {
        if (!window.confirm('참가 신청을 거절하시겠습니까?')) return;
        const { error } = await supabase
            .from('match_participants')
            .delete()
            .eq('match_id', matchId)
            .eq('user_id', userId);
        
        if (error) alert(error.message);
        else loadParticipants();
    };

    const handleKick = async (userId: string) => {
        if (!window.confirm('해당 참여자를 강퇴하시겠습니까?')) return;
        const { error } = await supabase
            .from('match_participants')
            .delete()
            .eq('match_id', matchId)
            .eq('user_id', userId);
        
        if (error) alert(error.message);
        else loadParticipants();
    };

    const joined = participants.filter(p => p.status === 'joined');
    const pending = participants.filter(p => p.status === 'pending');
    const waitlisted = participants.filter(p => p.status === 'waitlisted');

    return (
        <div style={container}>
            {/* Pending Section (Host Only) */}
            {isHost && pending.length > 0 && (
                <div style={section}>
                    <div style={sectionHeader}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b' }}>
                            <ClipboardCheck size={16} />
                            <h3 style={sectionTitle}>승인 대기 중</h3>
                        </div>
                        <span style={{ ...countBadge, background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>{pending.length}명</span>
                    </div>
                    <div style={listGrid}>
                        {pending.map(p => (
                            <UserCard 
                                key={p.id} 
                                participant={p} 
                                isHost={isHost} 
                                onApprove={handleApprove} 
                                onReject={handleReject} 
                                hostId={hostId} 
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Joined Section */}
            <div style={section}>
                <div style={sectionHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Users size={16} />
                        <h3 style={sectionTitle}>참여자 명단</h3>
                    </div>
                    <span style={countBadge}>{joined.length}명</span>
                </div>
                <div style={listGrid}>
                    {joined.map(p => (
                        <UserCard key={p.id} participant={p} isHost={isHost} onKick={handleKick} hostId={hostId} />
                    ))}
                </div>
            </div>

            {/* Waitlist Section */}
            {waitlisted.length > 0 && (
                <div style={section}>
                    <div style={sectionHeader}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.4)' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} />
                            <h3 style={sectionTitle}>대기자 명단</h3>
                        </div>
                        <span style={{ ...countBadge, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>{waitlisted.length}명</span>
                    </div>
                    <div style={listGrid}>
                        {waitlisted.map(p => (
                            <UserCard key={p.id} participant={p} isHost={isHost} onKick={handleKick} hostId={hostId} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const UserCard = ({ participant, isHost, onKick, onApprove, onReject, hostId }: any) => {
    const isTargetHost = participant.user_id === hostId;
    const isPending = participant.status === 'pending';
    const canKick = isHost && !isTargetHost && !isPending;

    return (
        <div style={cardStyle}>
            <div style={avatarWrap}>
                {participant.profiles?.photo_url ? (
                    <img src={participant.profiles.photo_url} style={avatar} />
                ) : (
                    <div style={avatarFallback}><User size={20}/></div>
                )}
                {isTargetHost && <div style={hostBadge}><Shield size={10} fill="currentColor" /></div>}
            </div>
            <div style={userBasic}>
                <div style={userNameGroup}>
                    <span style={userName}>{participant.profiles?.name}</span>
                    {isPending && <span style={pendingLabel}>대기</span>}
                </div>
                <div style={userGrade}>Grade C</div>
            </div>

            {isPending && isHost && (
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => onReject(participant.user_id)} style={rejectBtn}>거절</button>
                    <button onClick={() => onApprove(participant.user_id)} style={approveBtn}>승인</button>
                </div>
            )}

            {canKick && (
                <button onClick={() => onKick(participant.user_id)} style={kickBtn} title="강퇴">
                    <XCircle size={18} />
                </button>
            )}
        </div>
    );
};

// Map Tab implementation in the same step
export const MatchMapTab: React.FC<{ match: any }> = ({ match }) => {
    const mapRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!mapRef.current || !window.naver || !match.latitude) return;

        const position = new window.naver.maps.LatLng(match.latitude, match.longitude);
        const map = new window.naver.maps.Map(mapRef.current, {
            center: position,
            zoom: 16,
            logoControl: false
        });

        new window.naver.maps.Marker({
            position,
            map,
            icon: {
                content: `<div style="background: var(--accent-primary); color: white; padding: 6px 12px; border-radius: 12px; font-weight: 900; border: 2px solid white; box-shadow: 0 4px 15px rgba(0,0,0,0.4);">${match.place_name}</div>`,
                anchor: new window.naver.maps.Point(20, 20)
            }
        });
    }, [match]);

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '24px' }}>
            <div ref={mapRef} style={{ flex: 1, borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }} />
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 900 }}>{match.place_name}</div>
                    <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>{match.address}</div>
                </div>
                <button 
                    onClick={() => window.open(`https://map.naver.com/v5/search/${encodeURIComponent(match.address)}`, '_blank')}
                    style={{ padding: '12px 20px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontWeight: 800, cursor: 'pointer' }}
                >
                    길찾기
                </button>
            </div>
        </div>
    );
};

// Styles
const container: React.CSSProperties = { padding: '24px', display: 'flex', flexDirection: 'column', gap: '40px' };
const section: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '20px' };
const sectionHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const sectionTitle: React.CSSProperties = { fontSize: '1rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' };
const countBadge: React.CSSProperties = { padding: '4px 10px', borderRadius: '8px', background: 'rgba(249, 115, 22, 0.1)', color: 'var(--accent-primary)', fontSize: '0.85rem', fontWeight: 900 };

const listGrid: React.CSSProperties = { display: 'grid', gap: '12px' };
const cardStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' };
const avatarWrap: React.CSSProperties = { position: 'relative', flexShrink: 0 };
const avatar: React.CSSProperties = { width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' };
const avatarFallback: React.CSSProperties = { width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)' };
const hostBadge: React.CSSProperties = { position: 'absolute', bottom: -2, right: -2, width: '20px', height: '20px', borderRadius: '50%', background: '#8b5cf6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #121214' };

const userBasic: React.CSSProperties = { flex: 1 };
const userNameGroup: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px' };
const userName: React.CSSProperties = { fontSize: '1rem', fontWeight: 850 };
const userGrade: React.CSSProperties = { fontSize: '0.8rem', fontWeight: 700, color: '#10b981', marginTop: '2px' };

const kickBtn: React.CSSProperties = { padding: '8px', color: 'rgba(239, 68, 68, 0.4)', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'color 0.2s' };
const approveBtn: React.CSSProperties = { padding: '8px 16px', borderRadius: '8px', background: 'var(--accent-primary)', color: 'white', border: 'none', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer' };
const rejectBtn: React.CSSProperties = { padding: '8px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer' };
const pendingLabel: React.CSSProperties = { padding: '2px 6px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase' };
