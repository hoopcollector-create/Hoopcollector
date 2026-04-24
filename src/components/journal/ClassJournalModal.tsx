import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, BookOpen, Target, ChevronRight, CheckCircle2 } from 'lucide-react';
import { HoopSketchPad } from './HoopSketchPad';
import { BasketballLevel, CURRICULUM_DATA, SCORE_MEANING, LEVEL_ORDER } from '../../constants/curriculum';

interface ClassJournalModalProps {
    request: any;
    onClose: () => void;
    onSuccess: () => void;
}

export const ClassJournalModal: React.FC<ClassJournalModalProps> = ({ request, onClose, onSuccess }) => {
    const [step, setStep] = useState(1); // 1: Curriculum, 2: Text, 3: Sketch
    const [loading, setLoading] = useState(false);
    
    // Student & Session Data
    const [studentProfile, setStudentProfile] = useState<any>(null);
    const [sessionCount, setSessionCount] = useState<number>(1);
    
    // Form Data
    const [evaluations, setEvaluations] = useState<Record<string, number>>({});
    const [formData, setFormData] = useState({ feedback: "", homework: "" });
    const [visualLogUrl, setVisualLogUrl] = useState("");

    useEffect(() => {
        loadStudentData();
    }, []);

    async function loadStudentData() {
        const { data: profile } = await supabase.from('profiles').select('basketball_level').eq('id', request.student_id).single();
        if (profile) setStudentProfile(profile);

        const { count } = await supabase.from('class_journals').select('id', { count: 'exact', head: true }).eq('student_id', request.student_id);
        setSessionCount((count || 0) + 1);
    }

    const currentLevelId = (studentProfile?.basketball_level as BasketballLevel) || 'FOUNDATION';
    const currentCurriculum = CURRICULUM_DATA[currentLevelId];

    const handleEvaluation = (itemId: string, score: number) => {
        setEvaluations(prev => ({ ...prev, [itemId]: score }));
    };

    const handleSaveSketch = async (blob: Blob) => {
        setLoading(true);
        try {
            const fileName = `sketch-${request.id}-${Date.now()}.png`;
            const filePath = `journals/${fileName}`;

            const { error: uploadError } = await supabase.storage.from('hoop-assets').upload(filePath, blob);
            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('hoop-assets').getPublicUrl(filePath);
            setVisualLogUrl(data.publicUrl);
            alert("그림이 저장되었습니다. 최종 제출을 진행해주세요!");
        } catch (e: any) {
            alert("그림 저장 실패: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!formData.feedback) return alert("피드백 텍스트를 입력해 주세요.");
        
        setLoading(true);
        try {
            // Check Auto-Level-Up
            const evalValues = Object.values(evaluations);
            const avg = evalValues.length > 0 ? evalValues.reduce((a, b) => a + b, 0) / evalValues.length : 0;
            
            let upgradedLevel = null;
            if (avg >= 3.5) {
                const currentIdx = LEVEL_ORDER.indexOf(currentLevelId);
                if (currentIdx > -1 && currentIdx < LEVEL_ORDER.length - 1) {
                    upgradedLevel = LEVEL_ORDER[currentIdx + 1];
                }
            }

            // 1. Create Journal
            const { error: journalError } = await supabase.from('class_journals').insert({
                request_id: request.id,
                coach_id: request.coach_id,
                student_id: request.student_id,
                coach_feedback: formData.feedback,
                coach_homework: formData.homework,
                visual_log_url: visualLogUrl,
                session_number: sessionCount,
                curriculum_level: currentLevelId,
                evaluation_data: evaluations
            });
            if (journalError) throw journalError;

            // 2. Update status
            await supabase.from('class_requests')
                .update({ status: 'completed', completed_at: new Date().toISOString() })
                .eq('id', request.id);

            // 3. Upgrade if needed
            if (upgradedLevel) {
                await supabase.from('profiles').update({ basketball_level: upgradedLevel }).eq('id', request.student_id);
                await supabase.from('notifications').insert({ 
                    user_id: request.student_id, 
                    type: 'system', 
                    title: '🎉 레벨 업 달성!', 
                    content: `축하합니다! 코치님의 평가 결과 평균 3.5점 이상을 기록하여 ${upgradedLevel} 레벨로 승급하셨습니다!` 
                });
                alert(`학생이 ${upgradedLevel} 레벨로 승급되었습니다! (평균: ${avg.toFixed(1)}점)`);
            }

            onSuccess();
        } catch (e: any) {
            alert("제출 실패: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={overlay}>
            <div style={modal} className="glass-morphism">
                <div style={header}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={stepCircle}>{step}/3</div>
                        <div>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 900 }}>수업 일지 및 평가</h2>
                            <p style={{ fontSize: '0.8rem', opacity: 0.5, marginTop: 4 }}>
                                {request.student_name} 학생 | <span style={{ color: 'var(--color-primary)', fontWeight: 800 }}>제 {sessionCount}회차 수업</span>
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} style={closeBtn}><X size={20} /></button>
                </div>

                <div style={body} className="scroll-hidden">
                    {step === 1 ? (
                        <div style={{ display: 'grid', gap: '20px' }}>
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 800, marginBottom: 4 }}>현재 커리큘럼</div>
                                <h3 style={{ margin: 0, fontWeight: 900 }}>{currentCurriculum.title}</h3>
                                <p style={{ fontSize: '0.8rem', color: '#999', marginTop: 4 }}>{currentCurriculum.subtitle}</p>
                            </div>
                            
                            <div style={{ fontSize: '0.85rem', color: '#aaa', lineHeight: 1.5 }}>
                                오늘 수업에서 진행한 항목의 완성도를 평가해주세요. (선택 사항)
                                <br/>* 평가된 항목의 평균 점수가 3.5점 이상일 경우 학생은 다음 레벨로 자동 승급됩니다.
                            </div>

                            <div style={{ display: 'grid', gap: '12px', maxHeight: '350px', overflowY: 'auto', paddingRight: '10px' }}>
                                {currentCurriculum.items.map(item => (
                                    <div key={item.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                            <div>
                                                <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginRight: '6px' }}>{item.category}</span>
                                                <strong style={{ fontSize: '0.9rem' }}>{item.name}</strong>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px' }}>
                                            {[1, 2, 3, 4, 5].map(score => (
                                                <button 
                                                    key={score}
                                                    onClick={() => handleEvaluation(item.id, evaluations[item.id] === score ? 0 : score)}
                                                    style={{ 
                                                        flex: 1, padding: '8px 0', fontSize: '0.75rem', fontWeight: 800, borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s',
                                                        background: evaluations[item.id] === score ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
                                                        color: evaluations[item.id] === score ? 'white' : '#666',
                                                        border: `1px solid ${evaluations[item.id] === score ? 'var(--color-primary)' : 'transparent'}`
                                                    }}
                                                    title={SCORE_MEANING[score]}
                                                >
                                                    {score}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button onClick={() => setStep(2)} className="btn-primary" style={{ padding: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--color-coach)' }}>
                                다음: 피드백 작성 <ChevronRight size={18} style={{ marginLeft: 6 }} />
                            </button>
                        </div>
                    ) : step === 2 ? (
                        <div style={{ display: 'grid', gap: '24px' }}>
                            <div style={inputGroup}>
                                <label style={labelStyle}><BookOpen size={14} style={{ marginRight: 6 }} /> 코치 피드백</label>
                                <textarea 
                                    style={textarea} 
                                    placeholder="오늘 수업의 핵심 내용과 학생의 장점, 보완할 점을 적어주세요."
                                    value={formData.feedback}
                                    onChange={e => setFormData(prev => ({ ...prev, feedback: e.target.value }))}
                                />
                            </div>
                            <div style={inputGroup}>
                                <label style={labelStyle}><Target size={14} style={{ marginRight: 6 }} /> 혼자 연습할 내용 (HW)</label>
                                <textarea 
                                    style={textarea} 
                                    placeholder="다음 수업 전까지 학생이 집중해야 할 과제를 입력하세요."
                                    value={formData.homework}
                                    onChange={e => setFormData(prev => ({ ...prev, homework: e.target.value }))}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button onClick={() => setStep(1)} style={backBtn}>이전 (평가수정)</button>
                                <button onClick={() => setStep(3)} className="btn-primary" style={{ flex: 1, padding: '16px', background: 'var(--color-coach)' }}>다음: 비주얼 스케치 (선택)</button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '24px' }}>
                            <HoopSketchPad onSave={handleSaveSketch} saving={loading} />
                            
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button onClick={() => setStep(2)} style={backBtn}>이전</button>
                                <button 
                                    onClick={handleSubmit} 
                                    disabled={loading} 
                                    className="btn-primary" 
                                    style={{ flex: 1, padding: '16px', background: visualLogUrl ? 'var(--color-coach)' : 'rgba(255,255,255,0.05)', color: visualLogUrl ? 'white' : 'white' }}
                                >
                                    {loading ? "처리 중..." : (visualLogUrl ? "최종 제출하기" : "스케치 없이 제출하기")}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

/* Styles */
const overlay: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' };
const modal: React.CSSProperties = { width: '100%', maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: '#1a1a1c', borderRadius: '28px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' };
const header: React.CSSProperties = { padding: '24px 30px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 };
const stepCircle: React.CSSProperties = { width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-coach)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.9rem' };
const closeBtn: React.CSSProperties = { background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.5 };
const body: React.CSSProperties = { padding: '30px', overflowY: 'auto' };
const inputGroup: React.CSSProperties = { display: 'grid', gap: '10px' };
const labelStyle: React.CSSProperties = { fontSize: '0.75rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center' };
const textarea: React.CSSProperties = { width: '100%', minHeight: '120px', padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', fontSize: '0.95rem', outline: 'none', resize: 'none', lineHeight: 1.6 };
const backBtn: React.CSSProperties = { padding: '16px 20px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', color: 'white', border: '1px solid rgba(255,255,255,0.08)', fontWeight: 800, cursor: 'pointer' };
