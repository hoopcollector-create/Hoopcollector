import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Award, MapPin, Calendar, Plus, Search, Filter, ChevronRight, UserCircle, Shield, LucideIcon } from 'lucide-react';

interface Match {
    id: string;
    title: string;
    description: string;
    location: string;
    match_time: string;
    max_players: number;
    min_grade: string;
    host_id: string;
    status: string;
    profiles: { 
        display_name: string;
        photo_url: string;
        activity_score: number;
    };
    participants_count: number;
}

export const MatchBoard: React.FC = () => {
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchMatches();
    }, [filter]);

    const fetchMatches = async () => {
        setLoading(true);
        // We simulate a join by fetching matches and then participant counts
        const { data, error } = await supabase
            .from('community_matches')
            .select(`
                *,
                profiles (display_name, photo_url, activity_score)
            `)
            .order('match_time', { ascending: true });

        if (data) {
            // Enhanced fetch: Get participant counts
            const matchesWithCounts = await Promise.all(data.map(async (m) => {
                const { count } = await supabase
                    .from('community_match_participants')
                    .select('*', { count: 'exact', head: true })
                    .eq('match_id', m.id)
                    .eq('status', 'approved');
                return { ...m, participants_count: count || 0 };
            }));
            setMatches(matchesWithCounts as any);
        }
        setLoading(false);
    };

    return (
        <div style={pageContainer}>
            <div style={heroSection}>
                <div style={heroBadge}>HOOPCOLLECTOR MATCH</div>
                <h1 style={heroTitle}>주변 훕콜렉터들과<br />함께 코트를 점령하세요</h1>
                <p style={heroSubtitle}>티어 기반 매칭으로 실력이 비슷한 동료를 찾고 포인트를 획득하세요.</p>
                
                <div style={statsRow}>
                    <StatItem icon={Users} label="활성 매칭" value={matches.length.toString()} />
                    <StatItem icon={Award} label="획득 가능 포인트" value="1,200+" />
                </div>
            </div>

            <div style={boardControls}>
                <div style={filterTabs}>
                    <button style={filter === 'all' ? activeTab : tab} onClick={() => setFilter('all')}>전체 보기</button>
                    <button style={filter === 'my' ? activeTab : tab} onClick={() => setFilter('my')}>내 신청</button>
                    <button style={filter === 'recruitment' ? activeTab : tab} onClick={() => setFilter('recruitment')}>코치 구인</button>
                </div>
                <button style={createBtn}>
                    <Plus size={20} />
                    <span>매치 만들기</span>
                </button>
            </div>

            <div style={matchGrid}>
                {loading ? (
                    <div>로딩 중...</div>
                ) : matches.length === 0 ? (
                    <div style={emptyBox}>현재 진행 중인 매칭이 없습니다.</div>
                ) : (
                    matches.map(match => (
                        <div key={match.id} style={matchCard}>
                            <div style={cardHeader}>
                                <div style={hostInfo}>
                                    <img src={match.profiles.photo_url || ""} style={hostAvatar} alt="" />
                                    <div>
                                        <div style={hostName}>{match.profiles.display_name}</div>
                                        <div style={hostScore}>Score: {match.profiles.activity_score}</div>
                                    </div>
                                </div>
                                <div style={{ ...statusBadge, backgroundColor: match.status === 'open' ? 'rgba(0, 194, 255, 0.1)' : 'rgba(255,255,255,0.05)' }}>
                                    {match.status.toUpperCase()}
                                </div>
                            </div>

                            <h3 style={matchTitle}>{match.title}</h3>
                            
                            <div style={matchDetails}>
                                <DetailItem icon={MapPin} text={match.location} />
                                <DetailItem icon={Calendar} text={new Date(match.match_time).toLocaleString()} />
                                <DetailItem icon={Shield} text={`${match.min_grade}+ 티어`} />
                            </div>

                            <div style={cardFooter}>
                                <div style={playerCount}>
                                    <span style={{ color: 'var(--accent-primary)' }}>{match.participants_count}</span>
                                    <span> / {match.max_players} 명 참여 중</span>
                                </div>
                                <button style={joinBtn}>참여 신청</button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const StatItem = ({ icon: Icon, label, value }: { icon: LucideIcon, label: string, value: string }) => (
    <div style={statBox}>
        <div style={statIcon}><Icon size={18} /></div>
        <div>
            <div style={statValue}>{value}</div>
            <div style={statLabel}>{label}</div>
        </div>
    </div>
);

const DetailItem = ({ icon: Icon, text }: { icon: LucideIcon, text: string }) => (
    <div style={detailItem}>
        <Icon size={14} color="var(--text-muted)" />
        <span>{text}</span>
    </div>
);

// CSS Styles
const pageContainer: React.CSSProperties = { padding: '24px', maxWidth: '1200px', margin: '0 auto' };

const heroSection: React.CSSProperties = {
    padding: '60px 0',
    textAlign: 'center',
    background: 'radial-gradient(circle at top right, rgba(255, 107, 0, 0.1), transparent 40%)'
};

const heroBadge: React.CSSProperties = {
    display: 'inline-block',
    padding: '6px 16px',
    borderRadius: '100px',
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
    color: 'var(--accent-primary)',
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '1px',
    marginBottom: '20px'
};

const heroTitle: React.CSSProperties = {
    fontSize: '48px',
    fontWeight: 900,
    lineHeight: 1.1,
    color: 'var(--text-primary)',
    marginBottom: '24px'
};

const heroSubtitle: React.CSSProperties = {
    fontSize: '18px',
    color: 'var(--text-secondary)',
    maxWidth: '600px',
    margin: '0 auto 40px auto',
    lineHeight: 1.6
};

const statsRow: React.CSSProperties = { display: 'flex', justifyContent: 'center', gap: '40px' };

const statBox: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px' };

const statIcon: React.CSSProperties = {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    backgroundColor: 'var(--bg-surface-L2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--accent-primary)'
};

const statValue: React.CSSProperties = { fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' };
const statLabel: React.CSSProperties = { fontSize: '13px', color: 'var(--text-muted)' };

const boardControls: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: '40px 0 32px 0',
    padding: '0 8px'
};

const filterTabs: React.CSSProperties = { display: 'flex', gap: '12px' };

const tab: React.CSSProperties = {
    padding: '10px 20px',
    borderRadius: '12px',
    border: '1px solid var(--border-subtle)',
    backgroundColor: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer'
};

const activeTab: React.CSSProperties = {
    ...tab,
    backgroundColor: 'var(--bg-surface-L2)',
    borderColor: 'var(--accent-primary)',
    color: 'var(--accent-primary)'
};

const createBtn: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    borderRadius: '12px',
    backgroundColor: 'var(--accent-primary)',
    color: 'white',
    border: 'none',
    fontWeight: 700,
    cursor: 'pointer'
};

const matchGrid: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '24px'
};

const matchCard: React.CSSProperties = {
    background: 'var(--bg-surface-L1)',
    borderRadius: '24px',
    border: '1px solid var(--border-subtle)',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
};

const cardHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' };

const hostInfo: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px' };

const hostAvatar: React.CSSProperties = { width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' };

const hostName: React.CSSProperties = { fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' };

const hostScore: React.CSSProperties = { fontSize: '11px', color: 'var(--text-muted)' };

const statusBadge: React.CSSProperties = {
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--accent-secondary)'
};

const matchTitle: React.CSSProperties = {
    margin: 0,
    fontSize: '20px',
    fontWeight: 800,
    color: 'var(--text-primary)',
    lineHeight: 1.3
};

const matchDetails: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '16px',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: '16px'
};

const detailItem: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: 'var(--text-secondary)'
};

const cardFooter: React.CSSProperties = {
    marginTop: 'auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '16px',
    borderTop: '1px solid var(--border-subtle)'
};

const playerCount: React.CSSProperties = { fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 };

const joinBtn: React.CSSProperties = {
    padding: '10px 18px',
    borderRadius: '10px',
    backgroundColor: 'var(--bg-surface-L2)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-subtle)',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer'
};

const emptyBox: React.CSSProperties = {
    gridColumn: '1 / -1',
    padding: '100px',
    textAlign: 'center',
    background: 'var(--bg-surface-L1)',
    borderRadius: '24px',
    border: '2px dashed var(--border-subtle)',
    color: 'var(--text-muted)'
};
