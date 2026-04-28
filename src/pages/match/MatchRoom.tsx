import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
    Info, Users, MessageSquare, Map as MapIcon, 
    Shield, ClipboardCheck, Star, Settings, 
    ArrowLeft, Share2, MoreVertical, Zap
} from 'lucide-react';

// Tab Components (To be created in next steps)
import { MatchInfoTab } from './MatchRoomTabs/MatchInfoTab';
import { MatchParticipantsTab } from './MatchRoomTabs/MatchParticipantsTab';
import { MatchChatTab } from './MatchRoomTabs/MatchChatTab';
import { MatchMapTab } from './MatchRoomTabs/MatchMapTab';
import { MatchTeamTab } from './MatchRoomTabs/MatchTeamTab';
import { MatchAttendanceTab } from './MatchRoomTabs/MatchAttendanceTab';
import { MatchReviewTab } from './MatchRoomTabs/MatchReviewTab';
import { MatchManageTab } from './MatchRoomTabs/MatchManageTab';

export const MatchRoom: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('chat'); // Default to Chat
    const [match, setMatch] = useState<any>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [participantStatus, setParticipantStatus] = useState<string | null>(null);
    const [otherDates, setOtherDates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMatchData();
    }, [id]);

    useEffect(() => {
        if (match?.is_recurring && match?.template_id) {
            loadOtherDates();
        }
    }, [match?.template_id]);

    async function loadOtherDates() {
        const { data } = await supabase
            .from('match_rooms')
            .select('id, start_at')
            .eq('template_id', match.template_id)
            .eq('status', 'open')
            .order('start_at', { ascending: true });
        setOtherDates(data || []);
    }

    async function loadMatchData() {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            setCurrentUser(session?.user || null);

            // Fetch Match Details
            const { data: room, error } = await supabase
                .from('match_rooms')
                .select('*, host:profiles!match_rooms_host_id_fkey(name, photo_url)')
                .eq('id', id)
                .single();

            if (error) throw error;
            setMatch(room);

            // Fetch My Participation Status
            if (session?.user) {
                const { data: part } = await supabase
                    .from('match_participants')
                    .select('status')
                    .eq('match_id', id)
                    .eq('user_id', session.user.id)
                    .single();
                setParticipantStatus(part?.status || null);

                // Fetch User Profile for Age Check
                const { data: prof } = await supabase.from('profiles').select('birthday, is_certified_host').eq('id', session.user.id).single();
                setUserProfile(prof);
            }
        } catch (e) {
            console.error(e);
            navigate('/match');
        } finally {
            setLoading(false);
        }
    }

    if (loading || !match) return <div style={loadingOverlay}>ROOM LOADING...</div>;

    const isHost = currentUser?.id === match.host_id;

    return (
        <div style={container}>
            {/* Room Header */}
            <header style={header}>
                <div style={headerTop}>
                    <button onClick={() => navigate('/match')} style={iconBtn}><ArrowLeft size={20}/></button>
                    <div style={headerContent}>
                        <div style={titleArea}>
                            <h1 style={title}>{match.title}</h1>
                            {match.is_recurring && (
                                <div style={dateSelectorWrap}>
                                    <select 
                                        value={match.id} 
                                        onChange={e => navigate(`/match/room/${e.target.value}`)}
                                        style={dateSelect}
                                    >
                                        {otherDates.map(d => (
                                            <option key={d.id} value={d.id}>
                                                {new Date(d.start_at).toLocaleDateString()} 경기
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                        <div style={badgeArea}>
                            <div style={typeBadge}>{match.match_type}</div>
                            <div style={statusBadge}>{match.status === 'open' ? '모집 중' : '마감'}</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button style={iconBtn}><Share2 size={18}/></button>
                        <button style={iconBtn}><MoreVertical size={18}/></button>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div style={tabScroller}>
                    <div style={tabContainer}>
                        <TabItem id="chat" label="채팅" icon={MessageSquare} activeTab={activeTab} setActiveTab={setActiveTab} />
                        <TabItem id="info" label="정보" icon={Info} activeTab={activeTab} setActiveTab={setActiveTab} />
                        <TabItem id="participants" label="참여자" icon={Users} activeTab={activeTab} setActiveTab={setActiveTab} />
                        <TabItem id="map" label="지도" icon={MapIcon} activeTab={activeTab} setActiveTab={setActiveTab} />
                        <TabItem id="team" label="팀" icon={Shield} activeTab={activeTab} setActiveTab={setActiveTab} />
                        <TabItem id="attendance" label="출석" icon={ClipboardCheck} activeTab={activeTab} setActiveTab={setActiveTab} />
                        <TabItem id="review" label="후기" icon={Star} activeTab={activeTab} setActiveTab={setActiveTab} />
                        {(isHost || currentUser?.role === 'admin') && (
                            <TabItem id="manage" label="관리" icon={Settings} activeTab={activeTab} setActiveTab={setActiveTab} />
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content View */}
            <main style={mainContent}>
                {activeTab === 'chat' && <MatchChatTab match={match} currentUser={currentUser} userProfile={userProfile} participantStatus={participantStatus} onJoinUpdate={loadMatchData} />}
                {activeTab === 'info' && <MatchInfoTab match={match} />}
                {activeTab === 'participants' && <MatchParticipantsTab matchId={match.id} hostId={match.host_id} isHost={isHost} />}
                {activeTab === 'map' && <MatchMapTab match={match} />}
                {activeTab === 'team' && <MatchTeamTab matchId={match.id} isHost={isHost} />}
                {activeTab === 'attendance' && <MatchAttendanceTab matchId={match.id} isHost={isHost} />}
                {activeTab === 'review' && <MatchReviewTab matchId={match.id} />}
                {activeTab === 'manage' && <MatchManageTab match={match} onUpdate={loadMatchData} />}
            </main>
        </div>
    );
};

const TabItem = ({ id, label, icon: Icon, activeTab, setActiveTab }: any) => (
    <button 
        onClick={() => setActiveTab(id)}
        style={activeTab === id ? activeTabStyle : inactiveTabStyle}
    >
        <Icon size={16} />
        <span>{label}</span>
        {activeTab === id && <div style={tabIndicator} />}
    </button>
);

// Styles
const container: React.CSSProperties = { display: 'flex', flexDirection: 'column', height: '100vh', background: '#070708', overflow: 'hidden' };
const header: React.CSSProperties = { background: '#121214', borderBottom: '1px solid rgba(255,255,255,0.08)', zIndex: 100 };
const headerTop: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', gap: '12px' };
const headerContent: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '12px' };
const titleArea: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '4px' };
const title: React.CSSProperties = { fontSize: '24px', fontWeight: 950, letterSpacing: '-0.02em', color: 'white' };
const dateSelectorWrap: React.CSSProperties = { marginTop: '4px' };
const dateSelect: React.CSSProperties = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'rgba(255,255,255,0.6)', padding: '6px 12px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', outline: 'none' };
const badgeArea: React.CSSProperties = { display: 'flex', gap: '8px' };
const typeBadge: React.CSSProperties = { fontSize: '10px', fontWeight: 900, color: 'var(--accent-primary)', textTransform: 'uppercase' };
const statusBadge: React.CSSProperties = { fontSize: '10px', fontWeight: 900, color: 'rgba(255,255,255,0.3)', padding: '2px 6px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', letterSpacing: '0.05em' };
const roomTitle: React.CSSProperties = { fontSize: '1.1rem', fontWeight: 850, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: '4px 0 0' };
const iconBtn: React.CSSProperties = { width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' };

const tabScroller: React.CSSProperties = { overflowX: 'auto', WebkitOverflowScrolling: 'touch' };
const tabContainer: React.CSSProperties = { display: 'flex', padding: '0 8px' };
const activeTabStyle: React.CSSProperties = { position: 'relative', display: 'flex', alignItems: 'center', gap: '8px', padding: '16px 20px', background: 'transparent', border: 'none', color: 'white', fontSize: '0.9rem', fontWeight: 800, cursor: 'pointer', flexShrink: 0 };
const inactiveTabStyle: React.CSSProperties = { ...activeTabStyle, color: 'rgba(255,255,255,0.4)', fontWeight: 600 };
const tabIndicator: React.CSSProperties = { position: 'absolute', bottom: 0, left: '20px', right: '20px', height: '3px', background: 'var(--accent-primary)', borderRadius: '3px 3px 0 0' };

const mainContent: React.CSSProperties = { flex: 1, overflowY: 'auto', position: 'relative' };
const loadingOverlay: React.CSSProperties = { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#070708', color: 'rgba(255,255,255,0.2)', fontSize: '1.5rem', fontWeight: 900, letterSpacing: '0.2em' };
