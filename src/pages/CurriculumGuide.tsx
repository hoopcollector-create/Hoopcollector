import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CURRICULUM_DATA, LEVEL_ORDER, BasketballLevel } from '../constants/curriculum';
import { Lock, Unlock, ChevronRight, Award, Shield, Target, BookOpen, Sparkles, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CurriculumGuide = () => {
    const navigate = useNavigate();
    const [userGrade, setUserGrade] = useState<'A' | 'B' | 'C'>('C');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserGrade = async () => {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const { data } = await supabase
                    .from('profiles')
                    .select('coach_grade')
                    .eq('id', session.user.id)
                    .single();
                
                if (data?.coach_grade) {
                    setUserGrade(data.coach_grade as any);
                }
            }
            setLoading(false);
        };
        fetchUserGrade();
    }, []);

    const isUnlocked = (required: 'A' | 'B' | 'C') => {
        const priority = { 'A': 3, 'B': 2, 'C': 1 };
        return priority[userGrade] >= priority[required];
    };

    if (loading) return <div style={{ padding: 60, color: 'white', opacity: 0.5, textAlign: 'center' }}>커리큘럼 라이브러리 로딩 중...</div>;

    return (
        <div style={pageContainer}>
            <button onClick={() => navigate(-1)} style={backBtn}><ArrowLeft size={18} /> BACK</button>
            
            <header style={header}>
                <div style={badge}>COACH TRAINING PROGRAM</div>
                <h1 style={title}>커리큘럼 열람실</h1>
                <p style={subtitle}>코치 등급에 따라 해제되는 훕콜렉터 표준 트레이닝 시스템입니다.</p>
                
                <div style={gradeStatus}>
                    <Shield size={20} color="var(--color-primary)" />
                    <span>현재 나의 등급: <strong>{userGrade} GRADE</strong></span>
                </div>
            </header>

            <div style={grid}>
                {LEVEL_ORDER.map(levelKey => {
                    const level = CURRICULUM_DATA[levelKey];
                    const unlocked = isUnlocked(level.requiredGrade);

                    return (
                        <div key={levelKey} className="card-premium" style={{ 
                            ...cardStyle, 
                            border: unlocked ? '1px solid var(--border-subtle)' : '1px solid rgba(239, 68, 68, 0.2)',
                            background: unlocked ? 'var(--bg-surface-L1)' : 'rgba(10, 10, 11, 0.8)'
                        }}>
                            {!unlocked && (
                                <div style={lockOverlay}>
                                    <div style={lockIconBox}>
                                        <Lock size={32} color="#ef4444" />
                                    </div>
                                    <div style={lockText}>
                                        <div style={{ fontWeight: 900, fontSize: '1.1rem', color: '#ef4444' }}>LOCKED</div>
                                        <div style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '4px' }}>{level.requiredGrade} 등급 승급 시 공개</div>
                                    </div>
                                    <button 
                                        onClick={() => navigate('/coach/grade')}
                                        style={upgradeShortcutBtn}
                                    >
                                        승급 조건 확인하기
                                    </button>
                                </div>
                            )}

                            <div style={{ filter: unlocked ? 'none' : 'blur(12px)', opacity: unlocked ? 1 : 0.3, transition: 'all 0.4s' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                                    <div>
                                        <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--color-primary)', letterSpacing: '0.1em', marginBottom: '8px' }}>{level.id}</div>
                                        <h2 style={cardTitle}>{level.title}</h2>
                                        <p style={cardSubtitle}>{level.subtitle}</p>
                                    </div>
                                    <div style={gradeReqBadge}>{level.requiredGrade} REQ.</div>
                                </div>

                                <div style={itemList}>
                                    {level.items.map(item => (
                                        <div key={item.id} style={curriculumItem}>
                                            <div style={categoryTag}>{item.category}</div>
                                            <div style={itemName}>{item.name}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Styles
const pageContainer: React.CSSProperties = { maxWidth: '1200px', margin: '0 auto', padding: '48px 24px', color: 'white' };
const backBtn: React.CSSProperties = { background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 };
const header: React.CSSProperties = { marginBottom: 60 };
const badge: React.CSSProperties = { display: 'inline-block', padding: '6px 14px', borderRadius: '100px', background: 'rgba(59, 130, 246, 0.1)', fontSize: '0.7rem', fontWeight: 900, marginBottom: 16, color: 'var(--color-primary)', letterSpacing: '0.1em' };
const title: React.CSSProperties = { fontSize: '2.5rem', fontWeight: 950, letterSpacing: '-0.04em', margin: 0 };
const subtitle: React.CSSProperties = { fontSize: '1.1rem', opacity: 0.4, marginTop: 12, fontWeight: 500 };
const gradeStatus: React.CSSProperties = { marginTop: '24px', display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '12px 20px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', fontSize: '0.9rem' };

const grid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '32px' };
const cardStyle: React.CSSProperties = { padding: '40px', borderRadius: '32px', position: 'relative', overflow: 'hidden' };

const cardTitle: React.CSSProperties = { fontSize: '1.4rem', fontWeight: 900, margin: 0 };
const cardSubtitle: React.CSSProperties = { fontSize: '0.85rem', opacity: 0.5, marginTop: '8px', fontWeight: 700 };
const gradeReqBadge: React.CSSProperties = { padding: '4px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', fontSize: '0.65rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)' };

const itemList: React.CSSProperties = { display: 'grid', gap: '10px' };
const curriculumItem: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)' };
const categoryTag: React.CSSProperties = { fontSize: '0.6rem', fontWeight: 900, padding: '3px 8px', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-primary)', whiteSpace: 'nowrap' };
const itemName: React.CSSProperties = { fontSize: '0.85rem', fontWeight: 700, opacity: 0.9 };

const lockOverlay: React.CSSProperties = { position: 'absolute', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center' };
const lockIconBox: React.CSSProperties = { width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', border: '1px solid rgba(239, 68, 68, 0.1)' };
const lockText: React.CSSProperties = { marginBottom: '24px' };
const upgradeShortcutBtn: React.CSSProperties = { padding: '12px 24px', borderRadius: '12px', background: '#ef4444', color: 'white', border: 'none', fontWeight: 900, fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 8px 24px rgba(239, 68, 68, 0.3)' };
