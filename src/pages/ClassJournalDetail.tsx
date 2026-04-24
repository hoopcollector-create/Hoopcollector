import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Lock, Star, Sparkles, BookOpen, Target, Image as ImageIcon, CheckCircle2, BarChart3 } from 'lucide-react';
import { SCORE_MEANING, CURRICULUM_DATA, BasketballLevel } from '../constants/curriculum';

export const ClassJournalDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [journal, setJournal] = useState<any>(null);
    const [request, setRequest] = useState<any>(null);
    const [evalData, setEvalData] = useState({ score: 5, comment: "" });

    useEffect(() => {
        loadData();
    }, [id]);

    async function loadData() {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            // 1. Fetch Request
            const { data: req } = await supabase.from('class_requests').select('*').eq('id', id).single();
            setRequest(req);

            // 2. Fetch Journal
            const { data: jrnl } = await supabase.from('class_journals').select('*').eq('request_id', id).single();
            setJournal(jrnl);
            
            if (jrnl?.student_evaluation) {
                setEvalData({ score: jrnl.student_score, comment: jrnl.student_evaluation });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    const handleUnlock = async () => {
        if (!evalData.comment) return alert("오늘 수업에 대한 소감을 입력해 주세요.");
        
        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('class_journals')
                .update({
                    student_evaluation: evalData.comment,
                    student_score: evalData.score
                })
                .eq('request_id', id);

            if (error) throw error;
            loadData(); // Refresh to show unlocked content
        } catch (e: any) {
            alert("제출 실패: " + e.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div style={msgBox}>수업 일지를 불러오는 중...</div>;
    if (!journal) return (
        <div style={msgBox}>
            <BookOpen size={48} style={{ marginBottom: '1.5rem', opacity: 0.2 }} />
            <p>코치가 아직 일지를 작성하지 않았습니다.</p>
            <button onClick={() => navigate(-1)} style={backBtn}>돌아가기</button>
        </div>
    );

    const isLocked = !journal.student_evaluation;
    const curriculumLevel = (journal.curriculum_level as BasketballLevel) || 'FOUNDATION';
    const curriculum = CURRICULUM_DATA[curriculumLevel];
    const evaluationEntries = journal.evaluation_data ? Object.entries(journal.evaluation_data) : [];

    return (
        <div style={container}>
            <button onClick={() => navigate(-1)} style={topBackBtn}><ArrowLeft size={18} /> 수업 목록으로</button>
            
            <div style={header}>
                <div style={{ display: 'flex', gap: 10, marginBottom: '1rem' }}>
                    <div style={badge}>SESSION RECORD</div>
                    <div style={{ ...badge, color: 'var(--color-coach)' }}>#{journal.session_number} CLASS</div>
                </div>
                <h1 style={title}>수업 일지 및 평가</h1>
                <p style={subtitle}>{new Date(request?.requested_start).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</p>
            </div>

            <div style={grid}>
                {/* 1. My Evaluation (Student) */}
                <div className="card-minimal" style={{ padding: '30px' }}>
                    <h2 style={sectionTitle}><CheckCircle2 size={18} color="var(--color-primary)" /> MY EVALUATION</h2>
                    
                    {isLocked ? (
                        <div style={formWrap}>
                            <p style={formHint}>수업 피드백과 평가 리포트를 확인하려면 먼저 소감을 작성해 주세요. 🏀</p>
                            <div style={starRow}>
                                {[1, 2, 3, 4, 5].map(s => (
                                    <Star 
                                        key={s} 
                                        size={28} 
                                        fill={s <= evalData.score ? '#f59e0b' : 'transparent'} 
                                        color={s <= evalData.score ? '#f59e0b' : 'rgba(255,255,255,0.2)'}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => setEvalData(p => ({ ...p, score: s }))}
                                    />
                                ))}
                            </div>
                            <textarea 
                                style={textarea} 
                                placeholder="오늘 수업에서 가장 기억에 남는 점이나 스스로 칭찬하고 싶은 내용을 적어보세요."
                                value={evalData.comment}
                                onChange={e => setEvalData(p => ({ ...p, comment: e.target.value }))}
                            />
                            <button onClick={handleUnlock} disabled={submitting} className="btn-primary" style={unlockBtn}>
                                {submitting ? "제출 중..." : "소감 제출하고 피드백 보기"}
                            </button>
                        </div>
                    ) : (
                        <div style={doneBox}>
                            <div style={starRow}>
                                {[1, 2, 3, 4, 5].map(s => (
                                    <Star 
                                        key={s} 
                                        size={20} 
                                        fill={s <= journal.student_score ? '#f59e0b' : 'transparent'} 
                                        color={s <= journal.student_score ? '#f59e0b' : 'rgba(255,255,255,0.1)'}
                                    />
                                ))}
                            </div>
                            <p style={evalText}>"{journal.student_evaluation}"</p>
                            <div style={completedBadge}>평가 완료</div>
                        </div>
                    )}
                </div>

                {/* 2. Coach Feedback & Evaluation */}
                <div className="card-premium glass-morphism" style={{ padding: '30px', position: 'relative' }}>
                    <h2 style={sectionTitle}><Sparkles size={18} color="#f59e0b" /> COACH FEEDBACK \u0026 EVALUATION</h2>
                    
                    <div style={{ filter: isLocked ? 'blur(10px)' : 'none', opacity: isLocked ? 0.3 : 1, transition: 'all 0.5s ease' }}>
                        
                        {/* 2.1 Skill Evaluation Report */}
                        <div style={contentBlock}>
                            <div style={label}>커리큘럼 평가 리포트 ({curriculum?.title})</div>
                            <div style={{ display: 'grid', gap: '8px', marginTop: '12px' }}>
                                {evaluationEntries.length > 0 ? (
                                    evaluationEntries.map(([skillId, score]: any) => {
                                        const skillName = curriculum?.items.find(i => i.id === skillId)?.name || '기타 기술';
                                        return (
                                            <div key={skillId} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '10px' }}>
                                                <div style={{ flex: 1, fontSize: '0.85rem', fontWeight: 700 }}>{skillName}</div>
                                                <div style={{ display: 'flex', gap: 3 }}>
                                                    {[1,2,3,4,5].map(s => (
                                                        <div key={s} style={{ width: 12, height: 6, borderRadius: 2, background: s <= score ? '#10b981' : 'rgba(255,255,255,0.05)' }} />
                                                    ))}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', fontWeight: 900, width: 40, textAlign: 'right', color: '#10b981' }}>{SCORE_MEANING[score]}</div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>상세 기술 평가 데이터가 없습니다.</div>
                                )}
                            </div>
                        </div>

                        <div style={contentBlock}>
                            <div style={label}>코치의 피드백</div>
                            <p style={contentText}>{journal.coach_feedback}</p>
                        </div>
                        
                        <div style={contentBlock}>
                            <div style={label}>혼자 연습할 과제</div>
                            <div style={homeworkBox}>
                                <Target size={16} style={{ marginRight: 10, flexShrink: 0 }} />
                                <span>{journal.coach_homework || "오늘 배운 내용을 복습해 보세요!"}</span>
                            </div>
                        </div>

                        {journal.visual_log_url && (
                            <div style={contentBlock}>
                                <div style={label}>비주얼 로그 (전술/스케치)</div>
                                <div style={sketchWrap}>
                                    <img src={journal.visual_log_url} alt="Tactical Sketch" style={sketchImg} />
                                </div>
                            </div>
                        )}
                    </div>

                    {isLocked && (
                        <div style={lockOverlay}>
                            <div style={lockIconBox}><Lock size={32} /></div>
                            <p style={{ fontWeight: 800, fontSize: '0.9rem', opacity: 0.6 }}>나의 소감을 작성하면<br/>코치의 피드백이 공개됩니다.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

/* Styles */
const container: React.CSSProperties = { maxWidth: '1000px', margin: '0 auto', padding: '40px 20px', color: 'white' };
const topBackBtn: React.CSSProperties = { background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '2rem' };
const header: React.CSSProperties = { marginBottom: '3rem' };
const badge: React.CSSProperties = { display: 'inline-block', padding: '6px 14px', borderRadius: '100px', background: 'rgba(255,255,255,0.05)', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.1em', marginBottom: '1rem', color: 'var(--color-primary)' };
const title: React.CSSProperties = { fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.5rem', letterSpacing: '-0.03em' };
const subtitle: React.CSSProperties = { fontSize: '1rem', opacity: 0.4, fontWeight: 600 };

const grid: React.CSSProperties = { display: 'grid', gridTemplateColumns: window.innerWidth <= 800 ? '1fr' : '1fr 1.5fr', gap: '2.5rem', alignItems: 'start' };
const sectionTitle: React.CSSProperties = { fontSize: '1rem', fontWeight: 900, letterSpacing: '0.05em', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '10px' };

const formWrap: React.CSSProperties = { display: 'grid', gap: '20px' };
const formHint: React.CSSProperties = { fontSize: '0.9rem', opacity: 0.6, lineHeight: 1.6 };
const starRow: React.CSSProperties = { display: 'flex', gap: '10px' };
const textarea: React.CSSProperties = { width: '100%', minHeight: '120px', padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', fontSize: '0.95rem', outline: 'none', resize: 'none', lineHeight: 1.6 };
const unlockBtn: React.CSSProperties = { padding: '18px', borderRadius: '16px', border: 'none', fontWeight: 900, cursor: 'pointer' };

const lockOverlay: React.CSSProperties = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', zIndex: 10 };
const lockIconBox: React.CSSProperties = { width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.1)' };

const contentBlock: React.CSSProperties = { marginBottom: '2rem' };
const label: React.CSSProperties = { fontSize: '0.7rem', fontWeight: 900, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' };
const contentText: React.CSSProperties = { fontSize: '1.1rem', lineHeight: 1.8, opacity: 0.9, whiteSpace: 'pre-line' };
const homeworkBox: React.CSSProperties = { display: 'flex', padding: '20px', borderRadius: '16px', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.1)', color: '#f59e0b', fontWeight: 700, lineHeight: 1.6 };
const sketchWrap: React.CSSProperties = { width: '100%', borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' };
const sketchImg: React.CSSProperties = { width: '100%', display: 'block' };

const doneBox: React.CSSProperties = { display: 'grid', gap: '20px' };
const evalText: React.CSSProperties = { fontSize: '1.1rem', fontStyle: 'italic', opacity: 0.8, lineHeight: 1.6 };
const completedBadge: React.CSSProperties = { fontSize: '0.75rem', fontWeight: 900, color: 'var(--color-primary)', textTransform: 'uppercase' };

const msgBox: React.CSSProperties = { height: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', textAlign: 'center', padding: '20px' };
const backBtn: React.CSSProperties = { marginTop: '20px', padding: '10px 24px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer' };
