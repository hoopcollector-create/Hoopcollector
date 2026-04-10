import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle2, TrendingUp, Info, ArrowUpCircle } from 'lucide-react';

type Grade = 'C' | 'B' | 'A';

export const GradeSystem = () => {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [requesting, setRequesting] = useState(false);
    const [msg, setMsg] = useState("");

    useEffect(() => {
        loadProfile();
    }, []);

    async function loadProfile() {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
            setProfile(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    async function requestUpgrade(targetGrade: Grade) {
        if (!profile) return;
        setRequesting(true);
        try {
            const { error } = await supabase.from('grade_review_requests').insert({
                user_id: profile.id,
                target_grade: targetGrade,
                status: 'pending'
            });
            if (error) throw error;
            setMsg(`${targetGrade} 등급으로의 승급 심사가 요청되었습니다.`);
        } catch (e: any) {
            setMsg("요청 실패: " + e.message);
        } finally {
            setRequesting(false);
        }
    }

    if (loading) return <div style={{ padding: 40, color: 'white' }}>불러오는 중...</div>;

    const currentGrade = profile?.coach_grade || 'C';

    return (
        <div style={{ color: 'white' }}>
            <div style={{ marginBottom: '2.5rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '0.5rem' }}>등급 및 승급 시스템</h1>
                <p style={{ color: 'rgba(255,255,255,0.6)' }}>커뮤니티 활동 성과에 따라 등급이 결정되며, 등급이 높을수록 더 많은 권한이 부여됩니다.</p>
            </div>

            {msg && <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.2)', color: 'var(--color-primary)', borderRadius: '12px', marginBottom: '1.5rem', fontWeight: 700 }}>{msg}</div>}

            <div style={grid}>
                {/* Left: Tiers Info */}
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <GradeCard 
                        grade="C" 
                        name="Basic Coach (기본 코치)" 
                        active={currentGrade === 'C'} 
                        requirements="회원가입 및 코치 승인 시 기본 부여"
                        benefits="수업 일정 관리 가능, 커뮤니티 글쓰기 가능"
                    />
                    <GradeCard 
                        grade="B" 
                        name="Active Coach (활동 코치)" 
                        active={currentGrade === 'B'} 
                        requirements="토큰 50개 이상 + 활동 점수 100점 이상 + 관리자 심사"
                        benefits="프로필 상단 노출, 커리큘럼 작성 권한 강화"
                        onAction={currentGrade === 'C' ? () => requestUpgrade('B') : undefined}
                    />
                    <GradeCard 
                        grade="A" 
                        name="Lead Coach (리드 코치)" 
                        active={currentGrade === 'A'} 
                        requirements="토큰 150개 이상 + 활동 점수 300점 이상 + 관리자 심사"
                        benefits="플랫폼 메인 홍보, 신규 코치 멘토링 권한"
                        onAction={currentGrade === 'B' ? () => requestUpgrade('A') : undefined}
                    />
                </div>

                {/* Right: My Stats */}
                <div style={statsPanel}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '1.5rem', display: 'flex', alignItems: 'center' }}>
                        <TrendingUp size={20} style={{ marginRight: 10, color: 'var(--color-primary)' }} /> 현재 나의 성과
                    </h2>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <div style={statRow}>
                            <span style={statLabel}>보유 토큰</span>
                            <span style={statValue}>{profile?.total_tokens || 0}</span>
                        </div>
                        <div style={statRow}>
                            <span style={statLabel}>활동 점수</span>
                            <span style={statValue}>{profile?.activity_score || 0}</span>
                        </div>
                        <div style={line} />
                        {requesting && <div style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 800 }}>처리 중...</div>}
                        <div style={infoBox}>
                            <Info size={16} style={{ marginRight: 8, flexShrink: 0 }} />
                            <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.5 }}>
                                등급 승급은 성과를 충족하신 후 위 '승급 요청' 버튼을 누르시면 관리자 검토 후 최종 확정됩니다.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const GradeCard = ({ grade, name, active, requirements, benefits, onAction }: any) => (
    <div style={{ ...card, borderColor: active ? 'var(--color-primary)' : 'rgba(255,255,255,0.08)', background: active ? 'rgba(59, 130, 246, 0.05)' : 'rgba(255,255,255,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ ...gradeIcon, background: active ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)' }}>{grade}</div>
                <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 900, margin: 0 }}>{name}</h3>
                    {active && <span style={currentTag}><CheckCircle2 size={12} style={{ marginRight: 4 }} /> 현재 등급</span>}
                </div>
            </div>
            {onAction && <button onClick={onAction} style={upgradeBtn}><ArrowUpCircle size={14} style={{ marginRight: 6 }} /> 승급 요청</button>}
        </div>
        <div style={{ display: 'grid', gap: '10px', fontSize: '0.9rem' }}>
            <div style={detailRow}><strong style={{ width: '60px', opacity: 0.5 }}>요건:</strong> <span>{requirements}</span></div>
            <div style={detailRow}><strong style={{ width: '60px', opacity: 0.5 }}>혜택:</strong> <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>{benefits}</span></div>
        </div>
    </div>
);

const grid: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' };
const card: React.CSSProperties = { padding: '2rem', borderRadius: '28px', border: '1px solid', transition: 'all 0.3s' };
const gradeIcon: React.CSSProperties = { width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 950, color: 'white' };
const currentTag: React.CSSProperties = { fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-primary)', background: 'rgba(59, 130, 246, 0.1)', padding: '2px 8px', borderRadius: '99px', marginTop: '4px', display: 'inline-flex', alignItems: 'center' };
const upgradeBtn: React.CSSProperties = { padding: '8px 16px', borderRadius: '10px', background: 'white', color: 'black', border: 'none', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center' };
const detailRow: React.CSSProperties = { display: 'flex', gap: '10px' };

const statsPanel: React.CSSProperties = { padding: '2rem', borderRadius: '32px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', height: 'fit-content' };
const statRow: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' };
const statLabel: React.CSSProperties = { fontSize: '0.95rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)' };
const statValue: React.CSSProperties = { fontSize: '1.5rem', fontWeight: 900, color: 'white' };
const line: React.CSSProperties = { height: '1px', background: 'rgba(255,255,255,0.08)', margin: '1rem 0' };
const infoBox: React.CSSProperties = { padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', display: 'flex', color: 'rgba(255,255,255,0.5)' };
