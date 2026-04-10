import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LayoutDashboard, Target, Calendar, CreditCard, TrendingUp, Users, Clock, ChevronRight, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CoachDashboard = () => {
    const [stats, setStats] = useState({
        pendingRequests: 0,
        upcomingClasses: 0,
        monthlyEarnings: 0,
        activeSlots: 0
    });
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    async function loadStats() {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            // Load Profile with Tokens/Grade
            const { data: p } = await supabase.from('profiles').select('coach_grade, total_tokens, activity_score').eq('id', session.user.id).single();
            setProfile(p);

            // 1. Pending Requests
            const { count: pendingCount } = await supabase
                .from('class_requests')
                .select('*', { count: 'exact', head: true })
                .eq('coach_id', session.user.id)
                .eq('status', 'requested');

            // 2. Upcoming Classes
            const { count: upcomingCount } = await supabase
                .from('class_requests')
                .select('*', { count: 'exact', head: true })
                .eq('coach_id', session.user.id)
                .eq('status', 'accepted')
                .gte('requested_start', new Date().toISOString());

            // 3. Active Slots
            const { count: slotCount } = await supabase
                .from('coach_slots')
                .select('id', { count: 'exact', head: true })
                .eq('coach_id', session.user.id)
                .eq('is_booked', false)
                .gte('start_at', new Date().toISOString());

            setStats({
                pendingRequests: pendingCount || 0,
                upcomingClasses: upcomingCount || 0,
                activeSlots: slotCount || 0,
                monthlyEarnings: 0 // logic to be added later
            });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ color: 'white' }}>
            <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }} className="page-header">
                <div>
                    <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 1.75rem)', fontWeight: 900, marginBottom: '0.5rem' }}>코치 대시보드</h1>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>오늘의 수업 일정과 커뮤니티 활동 성과를 확인하세요.</p>
                </div>
                <div style={gradeBadgeRow} className="mobile-flex">
                    <div style={gradeBadge}>{profile?.coach_grade || 'C'} GRADE</div>
                    <div style={tokenChip}><Award size={14} style={{ marginRight: 6 }} /> {profile?.total_tokens || 0} TOKENS</div>
                </div>
            </div>

            {/* Progression Bar */}
            <div style={progressionCard} className="card-premium">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <TrendingUp size={18} color="var(--color-primary)" />
                        <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>다음 등급({profile?.coach_grade === 'C' ? 'B' : 'A'})까지 성과</span>
                    </div>
                    <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>{profile?.activity_score || 0} / {profile?.coach_grade === 'C' ? '100' : '300'} 점</span>
                </div>
                <div style={progBarBg}>
                    <div style={{ ...progBarFill, width: `${Math.min(100, ((profile?.activity_score || 0) / (profile?.coach_grade === 'C' ? 100 : 300)) * 100)}%` }} />
                </div>
            </div>

            {/* Stats Grid */}
            <div style={statsGrid} className="responsive-grid">
                <StatCard title="대기 중인 요청" value={stats.pendingRequests} unit="건" icon={<Target color="#f59e0b" />} link="/coach/requests" />
                <StatCard title="예정된 수업" value={stats.upcomingClasses} unit="개" icon={<Calendar color="#3b82f6" />} link="/coach/requests" />
                <StatCard title="오픈된 슬롯" value={stats.activeSlots} unit="개" icon={<Clock color="#8b5cf6" />} link="/coach/schedule" />
                <StatCard title="이번 달 정산" value="-" unit="원" icon={<CreditCard color="#10b981" />} link="/coach/financials" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '3rem' }} className="responsive-grid">
                {/* Quick Actions */}
                <div style={panel}>
                    <h2 style={panelTitle}>빠른 도구</h2>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <QuickLink to="/coach/schedule" title="내 수업 일정 등록하기" desc="학생들이 수업을 신청할 수 있는 새로운 시간대를 활성화합니다." icon={<Calendar />} />
                        <QuickLink to="/coach/requests" title="수업 요청 수락/거절" desc="새로 들어온 수업 신청을 확인하고 일정을 확정합니다." icon={<Target />} />
                    </div>
                </div>

                {/* Productivity / Info Panel */}
                <div style={{ ...panel, background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))' }}>
                    <h2 style={panelTitle}>코치 가이드</h2>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '1rem' }}>
                        <li style={guideItem}>● 수업 2시간 전에는 확정된 일정을 다시 확인해 주세요.</li>
                        <li style={guideItem}>● 개인 사정으로 취소 시 학생에게 미리 연락 부탁드립니다.</li>
                        <li style={guideItem}>● 새로운 소식: 정산 시스템이 다음 달 업데이트될 예정입니다.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, unit, icon, link }: any) => (
    <Link to={link || '#'} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div style={statCardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>{title}</span>
                <div style={iconBox}>{icon}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '2rem', fontWeight: 900 }}>{value}</span>
                <span style={{ fontSize: '0.9rem', opacity: 0.5, fontWeight: 700 }}>{unit}</span>
            </div>
        </div>
    </Link>
);

const QuickLink = ({ to, title, desc, icon }: any) => (
    <Link to={to} style={quickLinkStyle}>
        <div style={{ ...iconBox, background: 'rgba(255,255,255,0.05)', marginRight: '1rem' }}>{icon}</div>
        <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '2px' }}>{title}</div>
            <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>{desc}</div>
        </div>
        <ChevronRight size={18} style={{ opacity: 0.3 }} />
    </Link>
);

const statsGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' };
const statCardStyle: React.CSSProperties = { padding: '1.5rem', borderRadius: '24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', transition: 'transform 0.2s ease', cursor: 'pointer' };
const iconBox: React.CSSProperties = { width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const panel: React.CSSProperties = { padding: '2rem', borderRadius: '32px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' };
const panelTitle: React.CSSProperties = { fontSize: '1.25rem', fontWeight: 900, marginBottom: '1.5rem' };
const quickLinkStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', padding: '1.25rem', borderRadius: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', textDecoration: 'none', color: 'inherit', transition: 'all 0.2s' };
const guideItem: React.CSSProperties = { fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 };

const gradeBadgeRow: React.CSSProperties = { display: 'flex', gap: '8px', alignItems: 'center' };
const gradeBadge: React.CSSProperties = { padding: '8px 16px', borderRadius: '12px', background: 'var(--color-primary)', color: 'white', fontWeight: 900, fontSize: '0.85rem' };
const tokenChip: React.CSSProperties = { padding: '8px 16px', borderRadius: '12px', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.2)', color: '#fbbf24', fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center' };

const progressionCard: React.CSSProperties = { padding: '1.5rem', borderRadius: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '2.5rem' };
const progBarBg: React.CSSProperties = { width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '99px', overflow: 'hidden' };
const progBarFill: React.CSSProperties = { height: '100%', background: 'linear-gradient(to right, var(--color-primary), #8b5cf6)', borderRadius: '99px', transition: 'width 1s ease-out' };

