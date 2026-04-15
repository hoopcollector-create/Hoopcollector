import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Award, MapPin, Calendar, Plus, Search, Filter, ChevronRight, UserCircle, Shield, LucideIcon, X, Clock } from 'lucide-react';

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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // New Match Fields
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [matchDate, setMatchDate] = useState('');
    const [matchTime, setMatchTime] = useState('');
    const [maxPlayers, setMaxPlayers] = useState(10);
    const [minGrade, setMinGrade] = useState('C');

    useEffect(() => {
        fetchMatches();
    }, [filter]);

    const fetchMatches = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('community_matches')
            .select(`
                *,
                profiles (display_name, photo_url, activity_score)
            `)
            .order('match_time', { ascending: true });

        if (data) {
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

    const handleCreateMatch = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("로그인이 필요합니다.");

            const fullMatchTime = `${matchDate}T${matchTime}:00Z`;

            const { error } = await supabase
                .from('community_matches')
                .insert({
                    title,
                    description,
                    location,
                    match_time: fullMatchTime,
                    max_players: maxPlayers,
                    min_grade: minGrade,
                    host_id: session.user.id,
                    status: 'open'
                });

            if (error) throw error;

            // Reset and close
            setIsModalOpen(false);
            setTitle('');
            setDescription('');
            setLocation('');
            setMatchDate('');
            setMatchTime('');
            fetchMatches();
        } catch (err: any) {
            alert(err.message || "매치 생성 중 오류가 발생했습니다.");
        } finally {
            setIsSubmitting(false);
        }
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
                <button style={createBtn} onClick={() => setIsModalOpen(true)}>
                    <Plus size={20} />
                    <span>매치 만들기</span>
                </button>
            </div>

            <div style={matchGrid}>
                {loading ? (
                    <div style={emptyBox}>로딩 중...</div>
                ) : matches.length === 0 ? (
                    <div style={emptyBox}>현재 진행 중인 매칭이 없습니다.</div>
                ) : (
                    matches.map(match => (
                        <div key={match.id} style={matchCard}>
                            <div style={cardHeader}>
                                <div style={hostInfo}>
                                    <img src={match.profiles?.photo_url || ""} style={hostAvatar} alt="" />
                                    <div>
                                        <div style={hostName}>{match.profiles?.display_name || '익명'}</div>
                                        <div style={hostScore}>Score: {match.profiles?.activity_score || 0}</div>
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

            {/* Create Match Modal */}
            {isModalOpen && (
                <div style={modalOverlay}>
                    <div style={modalContent}>
                        <div style={modalHeader}>
                            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900 }}>매치 고유 설정</h2>
                            <button onClick={() => setIsModalOpen(false)} style={closeBtn}><X size={24} /></button>
                        </div>
                        
                        <form onSubmit={handleCreateMatch} style={formStyle}>
                            <div style={formGroup}>
                                <label style={labelStyle}>매치 제목</label>
                                <input 
                                    type="text" 
                                    placeholder="예: 강남역 코트 3대3 하실 분" 
                                    value={title} 
                                    onChange={e => setTitle(e.target.value)}
                                    required
                                    style={inputStyle} 
                                />
                            </div>

                            <div style={formRow}>
                                <div style={formGroup}>
                                    <label style={labelStyle}>날짜</label>
                                    <input 
                                        type="date" 
                                        value={matchDate} 
                                        onChange={e => setMatchDate(e.target.value)}
                                        required
                                        style={inputStyle} 
                                    />
                                </div>
                                <div style={formGroup}>
                                    <label style={labelStyle}>시간</label>
                                    <input 
                                        type="time" 
                                        value={matchTime} 
                                        onChange={e => setMatchTime(e.target.value)}
                                        required
                                        style={inputStyle} 
                                    />
                                </div>
                            </div>

                            <div style={formGroup}>
                                <label style={labelStyle}>장소</label>
                                <div style={{ position: 'relative' }}>
                                    <MapPin size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'rgba(255,255,255,0.3)' }} />
                                    <input 
                                        type="text" 
                                        placeholder="경기 장소 또는 코트 이름" 
                                        value={location} 
                                        onChange={e => setLocation(e.target.value)}
                                        required
                                        style={{ ...inputStyle, paddingLeft: '40px' }} 
                                    />
                                </div>
                            </div>

                            <div style={formRow}>
                                <div style={formGroup}>
                                    <label style={labelStyle}>최대 인원</label>
                                    <input 
                                        type="number" 
                                        min="2"
                                        max="30"
                                        value={maxPlayers} 
                                        onChange={e => setMaxPlayers(parseInt(e.target.value))}
                                        required
                                        style={inputStyle} 
                                    />
                                </div>
                                <div style={formGroup}>
                                    <label style={labelStyle}>최소 등급</label>
                                    <select 
                                        value={minGrade} 
                                        onChange={e => setMinGrade(e.target.value)}
                                        style={inputStyle}
                                    >
                                        <option value="C">C (Bronze)</option>
                                        <option value="B">B (Silver)</option>
                                        <option value="A">A (Gold)</option>
                                        <option value="PRO">PRO</option>
                                    </select>
                                </div>
                            </div>

                            <div style={formGroup}>
                                <label style={labelStyle}>상세 설명</label>
                                <textarea 
                                    placeholder="경기 규칙이나 준비물 등을 적어주세요." 
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
                                />
                            </div>

                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                style={{
                                    ...createBtn, 
                                    width: '100%', 
                                    marginTop: '12px', 
                                    justifyContent: 'center',
                                    opacity: isSubmitting ? 0.7 : 1
                                }}
                            >
                                {isSubmitting ? '매치 등록 중...' : '매치 개설하기'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// ... (Sub-components: StatItem, DetailItem) - Keep as is but check profiles safely
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
const heroSection: React.CSSProperties = { padding: '60px 0', textAlign: 'center' };
const heroBadge: React.CSSProperties = { display: 'inline-block', padding: '6px 16px', borderRadius: '100px', backgroundColor: 'rgba(255, 107, 0, 0.1)', color: 'var(--accent-primary)', fontSize: '12px', fontWeight: 700, marginBottom: '20px' };
const heroTitle: React.CSSProperties = { fontSize: '48px', fontWeight: 900, lineHeight: 1.1, marginBottom: '24px' };
const heroSubtitle: React.CSSProperties = { fontSize: '18px', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 40px auto' };
const statsRow: React.CSSProperties = { display: 'flex', justifyContent: 'center', gap: '40px' };
const statBox: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px' };
const statIcon: React.CSSProperties = { width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'var(--bg-surface-L2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' };
const statValue: React.CSSProperties = { fontSize: '20px', fontWeight: 700 };
const statLabel: React.CSSProperties = { fontSize: '13px', color: 'var(--text-muted)' };
const boardControls: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '40px 0 32px 0' };
const filterTabs: React.CSSProperties = { display: 'flex', gap: '12px' };
const tab: React.CSSProperties = { padding: '10px 20px', borderRadius: '12px', border: '1px solid var(--border-subtle)', backgroundColor: 'transparent', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600, cursor: 'pointer' };
const activeTab: React.CSSProperties = { ...tab, backgroundColor: 'var(--bg-surface-L2)', borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)' };
const createBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', backgroundColor: 'var(--accent-primary)', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' };
const matchGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' };
const matchCard: React.CSSProperties = { background: 'var(--bg-surface-L1)', borderRadius: '24px', border: '1px solid var(--border-subtle)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' };
const cardHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' };
const hostInfo: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px' };
const hostAvatar: React.CSSProperties = { width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', background: 'rgba(255,255,255,0.05)' };
const hostName: React.CSSProperties = { fontSize: '14px', fontWeight: 600 };
const hostScore: React.CSSProperties = { fontSize: '11px', color: 'var(--text-muted)' };
const statusBadge: React.CSSProperties = { padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, color: 'var(--accent-secondary)' };
const matchTitle: React.CSSProperties = { fontSize: '20px', fontWeight: 800, margin: 0 };
const matchDetails: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '16px' };
const detailItem: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' };
const cardFooter: React.CSSProperties = { marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' };
const playerCount: React.CSSProperties = { fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 };
const joinBtn: React.CSSProperties = { padding: '10px 18px', borderRadius: '10px', backgroundColor: 'var(--bg-surface-L2)', color: 'white', border: '1px solid var(--border-subtle)', fontSize: '14px', fontWeight: 700, cursor: 'pointer' };
const emptyBox: React.CSSProperties = { gridColumn: '1 / -1', padding: '100px', textAlign: 'center', background: 'var(--bg-surface-L1)', borderRadius: '24px', border: '2px dashed var(--border-subtle)', color: 'var(--text-muted)' };

// Global Modal Styles
const modalOverlay: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' };
const modalContent: React.CSSProperties = { width: '100%', maxWidth: '500px', background: '#121214', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.1)', padding: '32px', boxSizing: 'border-box' };
const modalHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' };
const closeBtn: React.CSSProperties = { background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' };
const formStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '20px' };
const formGroup: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '8px' };
const formRow: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' };
const labelStyle: React.CSSProperties = { fontSize: '0.85rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginLeft: '4px' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '0.95rem', boxSizing: 'border-box' };
