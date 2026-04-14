import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Check, X, Clock, MapPin, User, BookOpen } from 'lucide-react';
import { ClassJournalModal } from '../components/journal/ClassJournalModal';
import { AttendanceQR } from '../components/AttendanceQR';

type RequestStatus = "requested" | "accepted" | "completed" | "cancelled" | "rejected";

type ClassRequest = {
    id: string;
    student_id: string;
    coach_id: string;
    class_type: string;
    requested_start: string;
    duration_min: number;
    address: string | null;
    note: string | null;
    status: RequestStatus;
    created_at: string;
    student_name?: string;
    student_phone?: string;
};

export const CoachRequests = () => {
    const [requests, setRequests] = useState<ClassRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState("");
    const [selectedRequest, setSelectedRequest] = useState<ClassRequest | null>(null);
    const [showJournalModal, setShowJournalModal] = useState(false);

    useEffect(() => {
        loadRequests();
    }, []);

    async function loadRequests() {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            // 1. Fetch Requests
            const { data: reqs, error: reqError } = await supabase
                .from('class_requests')
                .select('*')
                .eq('coach_id', session.user.id)
                .order('created_at', { ascending: false });

            if (reqError) throw reqError;

            // 2. Fetch Student Profiles Manually (Avoid Relationship errors)
            const studentIds = Array.from(new Set((reqs || []).map(r => r.student_id)));
            if (studentIds.length > 0) {
                const { data: profs } = await supabase.from('profiles').select('id, name, phone').in('id', studentIds);
                
                const profMap = (profs || []).reduce((acc: any, p: any) => {
                    acc[p.id] = p;
                    return acc;
                }, {});

                const list = (reqs || []).map((r: any) => ({
                    ...r,
                    student_name: profMap[r.student_id]?.name || "익명 회원",
                    student_phone: profMap[r.student_id]?.phone || "번호 없음"
                }));
                setRequests(list);
            } else {
                setRequests([]);
            }
        } catch (e: any) {
            setMsg(e.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleAction(id: string, newStatus: RequestStatus) {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('class_requests')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;
            setMsg(`요청이 ${newStatus === 'accepted' ? '승인' : '거절'}되었습니다.`);
            setSelectedRequest(null);
            await loadRequests();
        } catch (e: any) {
            setMsg(e.message);
        } finally {
            setLoading(false);
        }
    }

    const fmtDate = (iso: string) => new Date(iso).toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', weekday: 'short' });

    return (
        <div style={{ color: 'white' }}>
            <div style={{ marginBottom: '2rem' }} className="page-header">
                <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 1.75rem)', fontWeight: 900, marginBottom: '0.5rem' }}>수업 요청 관리</h1>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>학생들이 신청한 실시간 수업 요청 목록입니다.</p>
            </div>

            {msg && <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.2)', color: 'var(--color-primary)', borderRadius: '12px', marginBottom: '1.5rem', fontWeight: 700, fontSize: '0.9rem' }}>{msg}</div>}

            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: selectedRequest ? (window.innerWidth <= 768 ? '1fr' : '1fr 1fr') : '1fr', 
                gap: '2.5rem' 
            }} className="responsive-grid">
                {/* List View */}
                <div style={{ display: 'grid', gap: '1rem', order: selectedRequest && window.innerWidth <= 768 ? 2 : 1 }}>
                    {loading && requests.length === 0 ? (
                        <div style={emptyBox}>요청을 불러오는 중...</div>
                    ) : requests.length === 0 ? (
                        <div style={emptyBox}>새로운 수업 요청이 없습니다.</div>
                    ) : (
                        requests.map(req => (
                            <div key={req.id} onClick={() => { setSelectedRequest(req); if(window.innerWidth <= 768) window.scrollTo({top: 400, behavior: 'smooth'}); }} style={{
                                ...card,
                                borderColor: selectedRequest?.id === req.id ? 'var(--color-primary)' : 'rgba(255,255,255,0.08)',
                                background: selectedRequest?.id === req.id ? 'rgba(59, 130, 246, 0.05)' : 'rgba(255,255,255,0.03)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <User size={18} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{req.student_name} 학생</div>
                                            <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>{new Date(req.created_at).toLocaleDateString()} 신청</div>
                                        </div>
                                    </div>
                                    <div style={{ ...statusBadge, background: req.status === 'requested' ? 'rgba(245, 158, 11, 0.2)' : req.status === 'accepted' ? 'rgba(34, 197, 94, 0.2)' : req.status === 'completed' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.1)', color: req.status === 'requested' ? '#f59e0b' : req.status === 'accepted' ? '#4ade80' : req.status === 'completed' ? '#3b82f6' : 'rgba(255,255,255,0.6)' }}>
                                        {req.status === 'requested' ? '대기중' : req.status === 'accepted' ? '승인됨' : req.status === 'completed' ? '완료됨' : req.status}
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gap: '6px', fontSize: '0.85rem', opacity: 0.8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Clock size={14} /> {fmtDate(req.requested_start)} ({req.duration_min}분)</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={14} /> {req.address || "장소 협의 필요"}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Detail View */}
                {selectedRequest && (
                    <div style={{ ...detailContainer, order: window.innerWidth <= 768 ? 1 : 2 }} className="card-premium glass-morphism">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>수업 상세정보</h2>
                            <button onClick={() => setSelectedRequest(null)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20} /></button>
                        </div>

                        <div style={{ display: 'grid', gap: '1.5rem' }}>
                            <div style={detailSection}>
                                <div style={detailLabel}>학생 정보</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>{selectedRequest.student_name?.[0] || 'U'}</div>
                                    <div>
                                        <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{selectedRequest.student_name}</div>
                                        <div style={{ fontSize: '0.9rem', opacity: 0.6 }}>{selectedRequest.student_phone}</div>
                                    </div>
                                </div>
                            </div>

                            <div style={detailSection}>
                                <div style={detailLabel}>수업 내용</div>
                                <div style={{ marginTop: '8px', display: 'grid', gap: '8px' }}>
                                    <div style={itemBox}><strong>클래스:</strong> Class {selectedRequest.class_type}</div>
                                    <div style={itemBox}><strong>일시:</strong> {fmtDate(selectedRequest.requested_start)}</div>
                                    <div style={itemBox}><strong>장소:</strong> {selectedRequest.address || "미정"}</div>
                                </div>
                            </div>

                            <div style={detailSection}>
                                <div style={detailLabel}>학생 요청사항</div>
                                <div style={{ marginTop: '8px', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', minHeight: '80px', fontSize: '0.95rem', lineHeight: 1.6 }}>
                                    {selectedRequest.note || "특이사항 없음"}
                                </div>
                            </div>

                            {selectedRequest.status === 'requested' && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                                    <button onClick={() => handleAction(selectedRequest.id, 'accepted')} style={{ ...actionBtn, background: 'var(--color-primary)' }}><Check size={18} style={{ marginRight: 8 }} /> 수업 승인</button>
                                    <button onClick={() => handleAction(selectedRequest.id, 'rejected')} style={{ ...actionBtn, background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}><X size={18} style={{ marginRight: 8 }} /> 거절</button>
                                </div>
                            )}

                                    {selectedRequest.status === 'accepted' && (
                                        <>
                                            <button 
                                                onClick={() => setShowJournalModal(true)} 
                                                style={{ ...actionBtn, background: 'var(--color-coach)', width: '100%', marginTop: '1rem' }}
                                            >
                                                <BookOpen size={18} style={{ marginRight: 8 }} /> 수업 완료 및 일지 작성
                                            </button>
                                            <div style={{ marginTop: '1rem' }}>
                                                <AttendanceQR classRequestId={selectedRequest.id} isCoach={true} />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {showJournalModal && (
                <ClassJournalModal 
                    request={selectedRequest}
                    onClose={() => setShowJournalModal(false)}
                    onSuccess={() => {
                        setShowJournalModal(false);
                        setSelectedRequest(null);
                        setMsg("수업 일지가 성공적으로 생성되었습니다.");
                        loadRequests();
                    }}
                />
            )}
        </div>
    );
};

const card: React.CSSProperties = { padding: '1.25rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', transition: 'all 0.2s' };
const statusBadge: React.CSSProperties = { padding: '4px 10px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase' };
const detailContainer: React.CSSProperties = { padding: '2rem', borderRadius: '24px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', height: 'fit-content', position: 'sticky', top: '24px' };
const detailSection: React.CSSProperties = { display: 'flex', flexDirection: 'column' };
const detailLabel: React.CSSProperties = { fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' };
const itemBox: React.CSSProperties = { padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', fontSize: '0.95rem' };
const actionBtn: React.CSSProperties = { padding: '14px', borderRadius: '14px', border: 'none', color: 'white', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const emptyBox: React.CSSProperties = { padding: '3rem', borderRadius: '20px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', textAlign: 'center', color: 'rgba(255,255,255,0.4)' };
