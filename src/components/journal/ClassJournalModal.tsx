import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Send, Save, BookOpen, Target } from 'lucide-react';
import { HoopSketchPad } from './HoopSketchPad';

interface ClassJournalModalProps {
    request: any;
    onClose: () => void;
    onSuccess: () => void;
}

export const ClassJournalModal: React.FC<ClassJournalModalProps> = ({ request, onClose, onSuccess }) => {
    const [step, setStep] = useState(1); // 1: Text, 2: Sketch
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        feedback: "",
        homework: ""
    });
    const [visualLogUrl, setVisualLogUrl] = useState("");

    const handleSaveSketch = async (blob: Blob) => {
        setLoading(true);
        try {
            const fileName = `sketch-${request.id}-${Date.now()}.png`;
            const filePath = `journals/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('class_visual_logs')
                .upload(filePath, blob);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('class_visual_logs').getPublicUrl(filePath);
            setVisualLogUrl(data.publicUrl);
            alert("그림이 저장되었습니다. 이제 최종 제출을 눌러주세요!");
        } catch (e: any) {
            alert("그림 저장 실패: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!formData.feedback) return alert("피드백을 입력해 주세요.");
        
        setLoading(true);
        try {
            // 1. Create Journal
            const { error: journalError } = await supabase
                .from('class_journals')
                .insert({
                    request_id: request.id,
                    coach_id: request.coach_id,
                    student_id: request.student_id,
                    coach_feedback: formData.feedback,
                    coach_homework: formData.homework,
                    visual_log_url: visualLogUrl
                });

            if (journalError) throw journalError;

            // 2. Update Request Status to 'completed'
            const { error: statusError } = await supabase
                .from('class_requests')
                .update({ status: 'completed', completed_at: new Date().toISOString() })
                .eq('id', request.id);

            if (statusError) throw statusError;

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
                        <div style={stepCircle}>{step}</div>
                        <div>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 900 }}>수업 일지 작성</h2>
                            <p style={{ fontSize: '0.8rem', opacity: 0.5 }}>{request.student_name} 학생의 성장을 기록하세요.</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={closeBtn}><X size={20} /></button>
                </div>

                <div style={body}>
                    {step === 1 ? (
                        <div style={{ display: 'grid', gap: '24px' }}>
                            <div style={inputGroup}>
                                <label style={labelStyle}><BookOpen size={14} style={{ marginRight: 6 }} /> 코치 피드백</label>
                                <textarea 
                                    style={textarea} 
                                    placeholder="오늘 수업의 핵심 내용과 학생의 장점을 적어주세요."
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
                            <button onClick={() => setStep(2)} className="btn-primary" style={{ padding: '16px', background: 'var(--color-coach)' }}>다음: 비주얼 스케치 작성</button>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '24px' }}>
                            <HoopSketchPad onSave={handleSaveSketch} saving={loading} />
                            
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button onClick={() => setStep(1)} style={backBtn}>이전으로</button>
                                <button 
                                    onClick={handleSubmit} 
                                    disabled={loading} 
                                    className="btn-primary" 
                                    style={{ flex: 1, padding: '16px', background: visualLogUrl ? 'var(--color-coach)' : 'rgba(255,255,255,0.05)', color: visualLogUrl ? 'white' : 'rgba(255,255,255,0.3)' }}
                                >
                                    {loading ? "처리 중..." : (visualLogUrl ? "일지 최종 제출" : "그림 없이 제출하기")}
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
const modal: React.CSSProperties = { width: '100%', maxWidth: '600px', background: '#1a1a1c', borderRadius: '28px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' };
const header: React.CSSProperties = { padding: '24px 30px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const stepCircle: React.CSSProperties = { width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-coach)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.9rem' };
const closeBtn: React.CSSProperties = { background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.5 };
const body: React.CSSProperties = { padding: '30px' };
const inputGroup: React.CSSProperties = { display: 'grid', gap: '10px' };
const labelStyle: React.CSSProperties = { fontSize: '0.75rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center' };
const textarea: React.CSSProperties = { width: '100%', minHeight: '120px', padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', fontSize: '0.95rem', outline: 'none', resize: 'none', lineHeight: 1.6 };
const backBtn: React.CSSProperties = { padding: '16px 24px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', color: 'white', border: '1px solid rgba(255,255,255,0.08)', fontWeight: 800, cursor: 'pointer' };
