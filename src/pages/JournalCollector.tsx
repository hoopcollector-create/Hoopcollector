import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { 
    BookOpen, Target, Sparkles, Calendar, 
    ChevronRight, LayoutGrid, BarChart3, 
    Award, TrendingUp, Search, Filter as FilterIcon,
    Star, Clock, MapPin, Lock, CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BasketballLevel, CURRICULUM_DATA, LEVEL_ORDER } from '../constants/curriculum';

// Styles moved to Top to avoid TDZ (Black Screen) errors
const container: React.CSSProperties = { maxWidth: '1100px', margin: '0 auto', padding: '40px 24px', paddingBottom: '120px' };
const header: React.CSSProperties = { marginBottom: '3rem' };
const brandIcon: React.CSSProperties = { width: '48px', height: '48px', background: 'var(--color-primary)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 20px rgba(59, 130, 246, 0.3)' };
const badge: React.CSSProperties = { padding: '6px 12px', borderRadius: '100px', background: 'rgba(255,255,255,0.05)', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)' };
const title: React.CSSProperties = { fontSize: '2.75rem', fontWeight: 950, letterSpacing: '-0.04em', marginBottom: '8px' };
const subtitle: React.CSSProperties = { color: 'rgba(255,255,255,0.4)', fontSize: '1.1rem', fontWeight: 500 };

const roadmapSection: React.CSSProperties = { marginBottom: '3rem' };
const roadmapHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' };
const sectionTitle: React.CSSProperties = { fontSize: '1.1rem', fontWeight: 900, letterSpacing: '0.05em' };
const currentBadge: React.CSSProperties = { padding: '4px 12px', borderRadius: '8px', background: 'var(--color-primary)', color: 'white', fontSize: '0.75rem', fontWeight: 900 };
const roadmapGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' };
const roadmapCard: React.CSSProperties = { padding: '20px', borderRadius: '20px', transition: 'all 0.3s' };
const lvNum: React.CSSProperties = { fontSize: '0.8rem', fontWeight: 900 };

const overviewGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: window.innerWidth <= 768 ? '1fr' : '1.5fr 1fr', gap: '24px', marginBottom: '3rem' };
const statsCard: React.CSSProperties = { padding: '24px', borderRadius: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' };
const skillsCard: React.CSSProperties = { ...statsCard };
const cardLabel: React.CSSProperties = { fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' };
const chartArea: React.CSSProperties = { height: '180px', marginBottom: '20px' };

const statsFooter: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '30px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' };
const statItem: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '4px' };
const statVal: React.CSSProperties = { fontSize: '1.5rem', fontWeight: 900 };
const statLabel: React.CSSProperties = { fontSize: '0.65rem', fontWeight: 800, opacity: 0.3 };
const statDivider: React.CSSProperties = { width: '1px', height: '30px', background: 'rgba(255,255,255,0.05)' };

const skillList: React.CSSProperties = { display: 'grid', gap: '16px' };
const skillItem: React.CSSProperties = { display: 'flex', flexDirection: 'column' };
const skillName: React.CSSProperties = { fontSize: '0.8rem', fontWeight: 800, opacity: 0.6 };
const skillScore: React.CSSProperties = { fontSize: '0.85rem', fontWeight: 900, color: 'var(--color-primary)' };
const progressBarBg: React.CSSProperties = { height: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '100px', overflow: 'hidden' };
const progressBarFill: React.CSSProperties = { height: '100%', background: 'var(--color-primary)', borderRadius: '100px', transition: 'width 1s ease-out' };

const tabBar: React.CSSProperties = { display: 'flex', gap: '12px', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' };
const tabOn: React.CSSProperties = { padding: '8px 16px', background: 'transparent', border: 'none', color: 'white', fontWeight: 900, fontSize: '0.85rem', cursor: 'pointer', borderBottom: '2px solid var(--color-primary)' };
const tabOff: React.CSSProperties = { ...tabOn, color: 'rgba(255,255,255,0.3)', borderBottom: '2px solid transparent' };

const collectionGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' };
const collectionCard: React.CSSProperties = { background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', cursor: 'pointer' };
const cardThumb: React.CSSProperties = { width: '100%', aspectRatio: '1.6 / 1', background: '#000', position: 'relative', overflow: 'hidden' };
const thumbImg: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 };
const thumbFallback: React.CSSProperties = { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const sessionBadge: React.CSSProperties = { position: 'absolute', top: '16px', left: '16px', padding: '4px 10px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 900 };

const cardContent: React.CSSProperties = { padding: '20px' };
const cardHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' };
const coachInfo: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px' };
const coachAvatar: React.CSSProperties = { width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' };
const avatarImg: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'cover' };
const coachName: React.CSSProperties = { fontSize: '0.8rem', fontWeight: 800, opacity: 0.6 };
const dateText: React.CSSProperties = { fontSize: '0.75rem', opacity: 0.3, fontWeight: 700 };

const cardTitle: React.CSSProperties = { fontSize: '1.15rem', fontWeight: 900, marginBottom: '8px' };
const cardSnippet: React.CSSProperties = { fontSize: '0.9rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginBottom: '20px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' };
const cardFooter: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.03)' };
const tag: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 800, color: '#f59e0b' };

const emptyBox: React.CSSProperties = { gridColumn: '1/-1', textAlign: 'center', padding: '100px 20px', color: 'rgba(255,255,255,0.2)', fontWeight: 800, fontSize: '1.1rem' };

interface JournalEntry {
    id: string;
    request_id: string;
    coach_id: string;
    student_id: string;
    coach_feedback: string;
    coach_homework: string;
    visual_log_url: string;
    session_number: number;
    curriculum_level: string;
    evaluation_data: Record<string, number>;
    created_at: string;
    request?: {
        requested_start: string;
        address: string;
    };
    coach?: {
        name: string;
        photo_url: string;
    };
}

export const JournalCollector = () => {
    const navigate = useNavigate();
    const [journals, setJournals] = useState<JournalEntry[]>([]);
    const [currentLevel, setCurrentLevel] = useState<BasketballLevel>('FOUNDATION');
    const [loading, setLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState<'all' | 'visual' | 'stats'>('all');

    useEffect(() => {
        loadJournals();
    }, []);

    async function loadJournals() {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            // Fetch Journals
            const { data, error } = await supabase
                .from('class_journals')
                .select('*, request:class_requests(requested_start, address), coach:profiles!coach_id(name, photo_url)')
                .eq('student_id', session.user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setJournals(data || []);

            // Fetch Current Level
            const { data: profile } = await supabase
                .from('profiles')
                .select('basketball_level')
                .eq('id', session.user.id)
                .maybeSingle();
            
            if (profile?.basketball_level) {
                setCurrentLevel(profile.basketball_level as BasketballLevel);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    // Stats Logic: Calculate average scores over time
    const statsData = useMemo(() => {
        if (journals.length === 0) return [];
        return [...journals].reverse().map(j => {
            const evals = Object.values(j.evaluation_data || {});
            const avg = evals.length > 0 ? evals.reduce((a, b) => a + b, 0) / evals.length : 0;
            return {
                date: new Date(j.created_at).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' }),
                score: avg,
                session: j.session_number
            };
        });
    }, [journals]);

    // Aggregate skill progress
    const skillStats = useMemo(() => {
        const skills: Record<string, { total: number, count: number }> = {};
        journals.forEach(j => {
            Object.entries(j.evaluation_data || {}).forEach(([skillId, score]) => {
                if (!skills[skillId]) skills[skillId] = { total: 0, count: 0 };
                skills[skillId].total += score;
                skills[skillId].count += 1;
            });
        });
        return Object.entries(skills).map(([id, data]) => ({
            id,
            avg: data.total / data.count,
            count: data.count
        })).sort((a, b) => b.avg - a.avg);
    }, [journals]);

    return (
        <div style={container}>
            {/* Header: Branding Focus */}
            <header style={header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '1.5rem' }}>
                    <div style={brandIcon}><BookOpen size={24} color="white" /></div>
                    <div style={badge}>COLLECTOR EDITION</div>
                </div>
                <h1 style={title}>GROWTH COLLECTOR</h1>
                <p style={subtitle}>코치진의 정밀 피드백과 당신의 땀방울이 모인 성장 수집함입니다.</p>
            </header>

            {/* Level Roadmap Section */}
            <section style={roadmapSection}>
                <div style={roadmapHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Award size={18} color="var(--color-primary)" />
                        <h2 style={sectionTitle}>COLLECTOR ROADMAP</h2>
                    </div>
                    <div style={currentBadge}>LEVEL {LEVEL_ORDER.indexOf(currentLevel) + 1}</div>
                </div>
                <div style={roadmapGrid}>
                    {LEVEL_ORDER.map((lvId, idx) => {
                        const lvData = CURRICULUM_DATA[lvId];
                        const isCurrent = currentLevel === lvId;
                        const isPassed = LEVEL_ORDER.indexOf(currentLevel) > idx;
                        const isLocked = LEVEL_ORDER.indexOf(currentLevel) < idx;

                        return (
                            <div key={lvId} style={{
                                ...roadmapCard,
                                opacity: isLocked ? 0.4 : 1,
                                border: isCurrent ? '1px solid var(--color-primary)' : '1px solid rgba(255,255,255,0.05)',
                                background: isCurrent ? 'rgba(59, 130, 246, 0.05)' : 'rgba(255,255,255,0.02)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                    <div style={{ ...lvNum, color: isCurrent ? 'var(--color-primary)' : 'rgba(255,255,255,0.2)' }}>L.{idx + 1}</div>
                                    {isPassed ? <CheckCircle2 size={16} color="#10b981" /> : isLocked ? <Lock size={16} opacity={0.3} /> : <Sparkles size={16} color="var(--color-primary)" />}
                                </div>
                                <div style={{ fontWeight: 900, fontSize: '0.9rem', marginBottom: '4px' }}>{lvData.title.split('. ')[1]}</div>
                                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>{lvData.subtitle}</div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Growth Overview Card */}
            {journals.length > 0 && (
                <section style={overviewGrid}>
                    <div className="card-premium glass-morphism" style={statsCard}>
                        <div style={cardLabel}><TrendingUp size={16} /> PERFORMANCE TRACKER</div>
                        <div style={chartArea}>
                            <GrowthChart data={statsData} />
                        </div>
                        <div style={statsFooter}>
                            <div style={statItem}>
                                <div style={statVal}>{journals.length}</div>
                                <div style={statLabel}>COLLECTED</div>
                            </div>
                            <div style={statDivider} />
                            <div style={statItem}>
                                <div style={statVal}>{statsData[statsData.length-1]?.score.toFixed(1)}</div>
                                <div style={statLabel}>AVG SCORE</div>
                            </div>
                        </div>
                    </div>

                    <div className="card-premium glass-morphism" style={skillsCard}>
                        <div style={cardLabel}><BarChart3 size={16} /> SKILL PROFICIENCY</div>
                        <div style={skillList}>
                            {skillStats.slice(0, 4).map(skill => (
                                <div key={skill.id} style={skillItem}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={skillName}>SKILL #{skill.id.slice(0,4)}</span>
                                        <span style={skillScore}>{skill.avg.toFixed(1)}</span>
                                    </div>
                                    <div style={progressBarBg}>
                                        <div style={{ ...progressBarFill, width: `${(skill.avg / 5) * 100}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Collection Navigation */}
            <div style={tabBar}>
                <button onClick={() => setSelectedTab('all')} style={selectedTab === 'all' ? tabOn : tabOff}>ALL JOURNALS</button>
                <button onClick={() => setSelectedTab('visual')} style={selectedTab === 'visual' ? tabOn : tabOff}>VISUAL LOGS</button>
                <button onClick={() => setSelectedTab('stats')} style={selectedTab === 'stats' ? tabOn : tabOff}>STATISTICS</button>
            </div>

            {/* Main Collection Grid */}
            <div style={collectionGrid}>
                {loading ? (
                    <div style={emptyBox}>ACCESSING ARCHIVES...</div>
                ) : journals.length === 0 ? (
                    <div style={emptyBox}>아직 수집된 기록이 없습니다. 수업 후 첫 번째 일지를 획득해 보세요!</div>
                ) : (
                    journals
                    .filter(j => {
                        if (selectedTab === 'visual') return !!j.visual_log_url;
                        return true;
                    })
                    .map(journal => (
                        <div key={journal.id} onClick={() => navigate(`/journal/${journal.request_id}`)} style={collectionCard} className="hover-lift">
                            <div style={cardThumb}>
                                {journal.visual_log_url ? (
                                    <img src={journal.visual_log_url} alt="Sketch" style={thumbImg} />
                                ) : (
                                    <div style={thumbFallback}><BookOpen size={32} opacity={0.1} /></div>
                                )}
                                <div style={sessionBadge}>#{journal.session_number}</div>
                            </div>
                            <div style={cardContent}>
                                <div style={cardHeader}>
                                    <div style={coachInfo}>
                                        <div style={coachAvatar}>
                                            {journal.coach?.photo_url ? <img src={journal.coach.photo_url} style={avatarImg} /> : <Award size={14} />}
                                        </div>
                                        <span style={coachName}>{journal.coach?.name || 'COACH'}</span>
                                    </div>
                                    <div style={dateText}>{new Date(journal.created_at).toLocaleDateString()}</div>
                                </div>
                                <h3 style={cardTitle}>수업 피드백 및 리포트</h3>
                                <p style={cardSnippet}>{journal.coach_feedback.slice(0, 80)}...</p>
                                <div style={cardFooter}>
                                    <div style={tag}><Star size={12} fill="#f59e0b" color="#f59e0b" /> {Object.values(journal.evaluation_data).length} Evaluation Items</div>
                                    <ChevronRight size={16} opacity={0.3} />
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

// Custom SVG Growth Chart for "Wow" effect
const GrowthChart = ({ data }: { data: any[] }) => {
    if (data.length < 2) return <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>더 많은 수업 기록이 필요합니다.</div>;
    
    const width = 400;
    const height = 150;
    const padding = 20;
    
    const points = data.map((d, i) => {
        const x = padding + (i / (data.length - 1)) * (width - padding * 2);
        const y = height - padding - (d.score / 5) * (height - padding * 2);
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%' }}>
            <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
                </linearGradient>
            </defs>
            {/* Grid Lines */}
            {[1, 2, 3, 4, 5].map(v => (
                <line 
                    key={v}
                    x1={padding} y1={height - padding - (v / 5) * (height - padding * 2)} 
                    x2={width - padding} y2={height - padding - (v / 5) * (height - padding * 2)} 
                    stroke="rgba(255,255,255,0.05)" 
                    strokeWidth="1"
                />
            ))}
            {/* Area */}
            <path 
                d={`M${padding},${height - padding} L${points} L${width - padding},${height - padding} Z`} 
                fill="url(#chartGradient)" 
            />
            {/* Line */}
            <polyline 
                points={points} 
                fill="none" 
                stroke="var(--color-primary)" 
                strokeWidth="3" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
            />
            {/* Dots */}
            {data.map((d, i) => {
                const x = padding + (i / (data.length - 1)) * (width - padding * 2);
                const y = height - padding - (d.score / 5) * (height - padding * 2);
                return <circle key={i} cx={x} cy={y} r="4" fill="white" stroke="var(--color-primary)" strokeWidth="2" />;
            })}
        </svg>
    );
};
