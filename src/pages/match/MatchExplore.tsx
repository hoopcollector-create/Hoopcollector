import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
    Search, Filter, Map as MapIcon, LayoutList, Plus, 
    Calendar, Users, Award, MapPin, ChevronRight, 
    Clock, Zap, LayoutGrid, Heart, Flame
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCountryByTimezone } from '../../constants/countries';
import { useNaverMap } from '../../hooks/useNaverMap';

// Types from SQL schema
interface MatchRoom {
    id: string;
    title: string;
    description: string;
    match_type: string;
    required_grade: string;
    max_players: number;
    current_players: number;
    start_at: string;
    end_at: string;
    occurrence_date: string;
    place_name: string;
    address: string;
    fee_type: string;
    fee_amount: number;
    status: string;
    is_recurring: boolean;
    template_id?: string | null;
    timezone?: string;
    latitude: number;
    longitude: number;
    likes_count: number;
    comments_count: number;
    host_id: string;
    host?: { name: string; photo_url: string };
}

const REGIONS = ['전국', '서울', '경기', '인천', '강원', '충청', '전라', '경상', '제주'];

const FilterBtn = ({ active, label, onClick }: any) => (
    <button 
        onClick={onClick}
        style={active ? activeFilter : inactiveFilter}
    >
        {label}
    </button>
);

export const MatchExplore: React.FC = () => {
    const navigate = useNavigate();
    const { isLoaded: mapLoaded } = useNaverMap();
    
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    const [matches, setMatches] = useState<MatchRoom[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all'); // all, my
    const [matchType, setMatchType] = useState('all'); 
    const [ageGroup, setAgeGroup] = useState('all'); 
    const [statusFilter, setStatusFilter] = useState('all'); // all, open
    const [selectedRegion, setSelectedRegion] = useState('전국');

    useEffect(() => {
        loadMatches();
    }, [filterType, matchType, ageGroup, statusFilter]);

    async function loadMatches() {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            
            let query = supabase
                .from('match_rooms')
                .select('*, host:profiles(name, photo_url)')
                .eq('is_hidden', false)
                .order('start_at', { ascending: true });

            if (filterType === 'my') {
                if (!session) {
                    setMatches([]);
                    setLoading(false);
                    return;
                }

                const { data: myParts } = await supabase
                    .from('match_participants')
                    .select('match_id')
                    .eq('user_id', session.user.id);
                
                const matchIds = myParts?.map(p => p.match_id) || [];
                
                const conditions = [`host_id.eq.${session.user.id}`];
                if (matchIds.length > 0) {
                    conditions.push(`id.in.(${matchIds.map(id => id).join(',')})`);
                }
                
                query = query.or(conditions.join(','));
            } else {
                query = query.eq('status', 'open');
            }

            if (matchType !== 'all') {
                query = query.eq('match_type', matchType);
            }

            if (ageGroup !== 'all') {
                query = query.eq('age_group', ageGroup);
            }

            const { data, error } = await query;
            if (error) throw error;

            let filteredData = data || [];

            // Client side status filtering (since current_players is a calculated or dynamic value)
            if (statusFilter === 'open') {
                filteredData = filteredData.filter((m: any) => m.current_players < m.max_players);
            }

            const uniqueMatches: MatchRoom[] = [];
            const templateIds = new Set();

            (filteredData || []).forEach((m: MatchRoom) => {
                if (!m.is_recurring || !m.template_id) {
                    uniqueMatches.push(m);
                } else if (!templateIds.has(m.template_id)) {
                    templateIds.add(m.template_id);
                    uniqueMatches.push(m);
                }
            });
            setMatches(uniqueMatches);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    const filteredMatches = matches.filter(m => {
        const matchesQuery = m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           m.place_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (m as any).match_code?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesRegion = selectedRegion === '전국' || 
                             (m.address && m.address.startsWith(selectedRegion)) ||
                             (m.place_name && m.place_name.includes(selectedRegion));

        return matchesQuery && matchesRegion;
    });

    return (
        <div style={container}>
            {/* Header Section */}
            <div style={header}>
                <div>
                    <h1 style={title}>게임 매칭 & 모임</h1>
                    <p style={subtitle}>지도와 목록에서 주변 농구 모임을 찾아보세요.</p>
                </div>
                <button onClick={() => navigate('/match/create')} style={createBtn}>
                    <Plus size={20} strokeWidth={3} />
                    <span>개설하기</span>
                </button>
            </div>

            {/* Tab Navigation */}
            <div style={tabContainer}>
                <button 
                    onClick={() => setFilterType('all')} 
                    style={filterType === 'all' ? activeTab : inactiveTab}
                >전체 탐색</button>
                <button 
                    onClick={() => setFilterType('my')} 
                    style={filterType === 'my' ? activeTab : inactiveTab}
                >나의 모임</button>
                <div style={filterType === 'all' ? tabUnderlineLeft : tabUnderlineRight} />
            </div>

            {/* Region Selection */}
            <div style={regionBar}>
                {REGIONS.map(region => (
                    <button 
                        key={region}
                        onClick={() => setSelectedRegion(region)}
                        style={selectedRegion === region ? activeRegion : inactiveRegion}
                    >
                        {region}
                    </button>
                ))}
            </div>

            {/* Filter & View Switcher */}
            <div style={controlBar}>
                <div style={searchBox}>
                    <Search size={18} style={{ opacity: 0.4 }} />
                    <input 
                        placeholder="장소 또는 제목 검색..." 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={searchInput} 
                    />
                </div>
                
                <div style={{ ...filterBar, width: '100%', overflowX: 'auto', paddingBottom: '4px' }}>
                    <FilterBtn active={matchType === 'all'} label="전체종류" onClick={() => setMatchType('all')} />
                    <FilterBtn active={matchType === '5대5'} label="5대5" onClick={() => setMatchType('5대5')} />
                    <FilterBtn active={matchType === '3대3'} label="3대3" onClick={() => setMatchType('3대3')} />
                    <FilterBtn active={matchType === '자유게임'} label="자유게임" onClick={() => setMatchType('자유게임')} />
                    <FilterBtn active={matchType === '개인연습'} label="개인연습" onClick={() => setMatchType('개인연습')} />
                </div>

                <div style={{ ...filterBar, marginTop: '8px', width: '100%', overflowX: 'auto', paddingBottom: '4px' }}>
                    <FilterBtn active={ageGroup === 'all'} label="전체연령" onClick={() => setAgeGroup('all')} />
                    <FilterBtn active={ageGroup === 'youth'} label="유소년" onClick={() => setAgeGroup('youth')} />
                    <FilterBtn active={ageGroup === '20s'} label="20대" onClick={() => setAgeGroup('20s')} />
                    <FilterBtn active={ageGroup === '30s'} label="30대" onClick={() => setAgeGroup('30s')} />
                    <FilterBtn active={ageGroup === '40s'} label="40대+" onClick={() => setAgeGroup('40s')} />
                </div>

                <div style={{ ...filterBar, marginTop: '8px', width: '100%', overflowX: 'auto', paddingBottom: '4px' }}>
                    <FilterBtn active={statusFilter === 'all'} label="모든 상태" onClick={() => setStatusFilter('all')} />
                    <FilterBtn active={statusFilter === 'open'} label="🔥 모집 중만 보기" onClick={() => setStatusFilter('open')} />
                </div>

                <div style={actionGroup}>
                    <div style={viewSwitch}>
                        <button 
                            onClick={() => setViewMode('list')} 
                            style={viewMode === 'list' ? activeSwitch : inactiveSwitch}
                        >
                            <LayoutList size={18} />
                        </button>
                        <button 
                            onClick={() => setViewMode('map')} 
                            style={viewMode === 'map' ? activeSwitch : inactiveSwitch}
                        >
                            <MapIcon size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div style={contentArea}>
                {viewMode === 'list' ? (
                    <div style={matchGrid}>
                        {loading ? (
                            <div style={loadingBox}>모임을 불러오는 중...</div>
                        ) : filteredMatches.length === 0 ? (
                            <div style={emptyBox}>현재 조건에 맞는 모임이 없습니다.</div>
                        ) : (
                            filteredMatches.map(match => (
                                <MatchCard key={match.id} match={match} onClick={() => navigate(`/match/room/${match.id}`)} />
                            ))
                        )}
                    </div>
                ) : (
                    <ExplorationMap matches={filteredMatches} navigate={navigate} />
                )}
            </div>
        </div>
    );
};

// Sub-component: Match Card
const MatchCard: React.FC<{ match: MatchRoom, onClick: () => void }> = ({ match, onClick }) => {
    const dateObj = new Date(match.start_at);
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const dateStr = `${dateObj.getMonth() + 1}/${dateObj.getDate()} (${dayNames[dateObj.getDay()]})`;
    const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

    const cardThemeStyle = match.is_recurring ? recurringCard : oneTimeCard;

    return (
        <div style={{ ...cardStyle, ...cardThemeStyle }} onClick={onClick} className="card-premium hover-lift">
            <div style={cardHeader}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {match.is_recurring ? (
                        <div style={recurringBadge}>
                            <Zap size={10} fill="currentColor" /> 정기 매치
                        </div>
                    ) : (
                        <div style={oneTimeBadge}>
                            <Flame size={10} fill="currentColor" /> 일회성
                        </div>
                    )}
                    <div style={countryBadgeStyle}>
                        {getCountryByTimezone(match.timezone || 'Asia/Seoul').flag}
                    </div>
                    <span style={typeText}>{match.match_type}</span>
                </div>
                <div style={gradeBadge(match.required_grade)}>
                    {match.required_grade === 'all' ? '전체등급' : `${match.required_grade} 이상`}
                </div>
            </div>

            <h3 style={cardTitle}>
                <span style={codeText}>#{ (match as any).match_code }</span> {match.title}
            </h3>

            <div style={infoRow}>
                <div style={infoItem}>
                    <Calendar size={14} />
                    <span>{dateStr}</span>
                </div>
                <div style={infoItem}>
                    <Clock size={14} />
                    <span>{timeStr}</span>
                </div>
            </div>

            <div style={locationBox}>
                <MapPin size={14} style={{ color: match.is_recurring ? '#8b5cf6' : '#f97316' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{match.place_name}</span>
            </div>

            <div style={cardFooter}>
                <div style={playerCount}>
                    <Users size={14} />
                    <span>{match.current_players} / {match.max_players}명</span>
                </div>
                <div style={priceText}>
                    {match.fee_amount > 0 ? `${match.fee_amount.toLocaleString()}원` : '무료'}
                </div>
            </div>
        </div>
    );
};

// Sub-component: Naver Map View
const ExplorationMap: React.FC<{ matches: MatchRoom[], navigate: any }> = ({ matches, navigate }) => {
    const mapRef = React.useRef<HTMLDivElement>(null);
    const { isLoaded } = useNaverMap();

    useEffect(() => {
        if (!isLoaded || !mapRef.current || !window.naver) return;

        const initMap = (lat: number, lng: number) => {
            const map = new window.naver.maps.Map(mapRef.current!, {
                center: new window.naver.maps.LatLng(lat, lng),
                zoom: 13,
                logoControl: false,
                mapDataControl: false,
            });

            matches.forEach(m => {
                if (!m.latitude || !m.longitude) return;
                
                const marker = new window.naver.maps.Marker({
                    position: new window.naver.maps.LatLng(m.latitude, m.longitude),
                    map: map,
                    icon: {
                        content: `
                            <div style="background: ${m.is_recurring ? '#8b5cf6' : '#f97316'}; color: white; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 900; border: 2px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.4); white-space: nowrap; transition: all 0.2s transform;">
                                ${m.title}
                            </div>
                        `,
                        anchor: new window.naver.maps.Point(20, 20)
                    }
                });

                const infoWindow = new window.naver.maps.InfoWindow({
                    content: `
                        <div style="padding: 16px; background: #121214; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; color: white; min-width: 220px; box-shadow: 0 10px 40px rgba(0,0,0,0.6); font-family: sans-serif;">
                            <div style="font-size: 15px; font-weight: 950; margin-bottom: 10px; color: white;">${m.title}</div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="background: ${m.is_recurring ? 'rgba(139, 92, 246, 0.15)' : 'rgba(249, 115, 22, 0.15)'}; color: ${m.is_recurring ? '#a78bfa' : '#f97316'}; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 900;">${m.match_type}</span>
                                <span style="font-size: 13px; font-weight: 800; color: white;">${m.fee_amount > 0 ? m.fee_amount.toLocaleString() + '원' : '무료'}</span>
                            </div>
                            <div style="margin-top: 12px; font-size: 11px; color: rgba(255,255,255,0.4); font-weight: 700;">${m.place_name}</div>
                        </div>
                    `,
                    borderWidth: 0,
                    backgroundColor: 'transparent',
                    anchorSkew: true,
                });

                window.naver.maps.Event.addListener(marker, 'mouseover', () => {
                    infoWindow.open(map, marker);
                });

                window.naver.maps.Event.addListener(marker, 'mouseout', () => {
                    infoWindow.close();
                });

                window.naver.maps.Event.addListener(marker, 'click', () => {
                    navigate(`/match/room/${m.id}`);
                });
            });
        };

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                p => initMap(p.coords.latitude, p.coords.longitude),
                () => initMap(37.5665, 126.9780)
            );
        } else {
            initMap(37.5665, 126.9780);
        }
    }, [isLoaded, matches]);

    return (
        <div style={mapWrap}>
            <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: '24px' }} />
        </div>
    );
};

// Styles
const container: React.CSSProperties = { padding: '24px', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' };
const header: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' };
const title: React.CSSProperties = { fontSize: '40px', fontWeight: 950, letterSpacing: '-0.04em', marginBottom: '8px' };
const subtitle: React.CSSProperties = { color: 'rgba(255,255,255,0.5)', fontSize: '1.1rem' };
const createBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 24px', borderRadius: '16px', background: 'var(--accent-primary)', color: 'white', border: 'none', fontWeight: 900, cursor: 'pointer', boxShadow: '0 10px 20px rgba(249, 115, 22, 0.3)' };

const tabContainer: React.CSSProperties = { display: 'flex', position: 'relative', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '8px' };
const activeTab: React.CSSProperties = { flex: 1, padding: '16px', background: 'transparent', border: 'none', color: 'white', fontWeight: 900, fontSize: '1rem', cursor: 'pointer' };
const inactiveTab: React.CSSProperties = { ...activeTab, color: 'rgba(255,255,255,0.3)', fontWeight: 700 };
const tabUnderlineLeft: React.CSSProperties = { position: 'absolute', bottom: 0, left: 0, width: '50%', height: '2px', background: 'var(--accent-primary)', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' };
const tabUnderlineRight: React.CSSProperties = { ...tabUnderlineLeft, left: '50%' };

const regionBar: React.CSSProperties = { display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px', maskImage: 'linear-gradient(to right, black 90%, transparent 100%)' };
const activeRegion: React.CSSProperties = { padding: '10px 20px', borderRadius: '14px', background: 'white', color: 'black', border: 'none', fontWeight: 900, fontSize: '0.9rem', cursor: 'pointer', whiteSpace: 'nowrap' };
const inactiveRegion: React.CSSProperties = { ...activeRegion, background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.4)', fontWeight: 700, border: '1px solid rgba(255,255,255,0.08)' };

const controlBar: React.CSSProperties = { display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' };
const filterBar: React.CSSProperties = { display: 'flex', gap: '8px' };
const activeFilter: React.CSSProperties = { padding: '8px 16px', borderRadius: '100px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' };
const inactiveFilter: React.CSSProperties = { ...activeFilter, background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.3)', fontWeight: 600, border: '1px solid transparent' };

const searchBox: React.CSSProperties = { flex: 1, minWidth: '280px', display: 'flex', alignItems: 'center', gap: '12px', padding: '0 20px', height: '56px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' };
const searchInput: React.CSSProperties = { background: 'transparent', border: 'none', color: 'white', fontSize: '1rem', width: '100%', outline: 'none' };

const actionGroup: React.CSSProperties = { display: 'flex', gap: '12px', alignItems: 'center' };
const viewSwitch: React.CSSProperties = { display: 'flex', padding: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' };
const activeSwitch: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' };
const inactiveSwitch: React.CSSProperties = { ...activeSwitch, background: 'transparent', color: 'rgba(255,255,255,0.4)', fontWeight: 600 };

const contentArea: React.CSSProperties = { minHeight: '600px' };
const matchGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' };
const mapWrap: React.CSSProperties = { width: '100%', height: '70vh', background: '#121214', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' };

const cardStyle: React.CSSProperties = { background: 'var(--bg-surface-L1)', padding: '24px', borderRadius: '24px', border: '1px solid var(--border-subtle)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '16px', transition: 'all 0.3s ease' };
const oneTimeCard: React.CSSProperties = { borderLeft: '4px solid #f97316' };
const recurringCard: React.CSSProperties = { borderLeft: '4px solid #8b5cf6', boxShadow: 'inset 0 0 40px rgba(139, 92, 246, 0.05)' };

const cardHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const recurringBadge: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa', fontSize: '0.75rem', fontWeight: 900 };
const oneTimeBadge: React.CSSProperties = { ...recurringBadge, background: 'rgba(249, 115, 22, 0.15)', color: '#fb923c' };

const typeText: React.CSSProperties = { fontSize: '0.85rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)' };
const countryBadgeStyle: React.CSSProperties = { fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const cardTitle: React.CSSProperties = { fontSize: '1.25rem', fontWeight: 850, lineHeight: 1.3, display: 'flex', gap: '8px', alignItems: 'center' };
const codeText: React.CSSProperties = { fontSize: '0.9rem', color: 'rgba(255,255,255,0.2)', fontWeight: 700, letterSpacing: '0.05em' };
const infoRow: React.CSSProperties = { display: 'flex', gap: '16px' };
const infoItem: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 };
const locationBox: React.CSSProperties = { padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' };
const cardFooter: React.CSSProperties = { marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' };
const playerCount: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 700 };
const priceText: React.CSSProperties = { fontSize: '1rem', fontWeight: 900, color: 'white' };

const gradeBadge = (grade: string): React.CSSProperties => ({
    padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 900,
    background: grade === 'all' ? 'rgba(255,255,255,0.05)' : 'rgba(16, 185, 129, 0.1)',
    color: grade === 'all' ? 'rgba(255,255,255,0.5)' : '#10b981',
    border: `1px solid ${grade === 'all' ? 'rgba(255,255,255,0.1)' : 'rgba(16, 185, 129, 0.2)'}`
});

const loadingBox: React.CSSProperties = { gridColumn: '1/-1', textAlign: 'center', padding: '100px', fontSize: '1.2rem', fontWeight: 900, opacity: 0.2 };
const emptyBox: React.CSSProperties = { ...loadingBox };
