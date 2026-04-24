import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Check, X, Clock, MapPin, User, BookOpen, Layers, Target, AlertCircle, Settings, Calendar } from 'lucide-react';
import { ClassJournalModal } from '../components/journal/ClassJournalModal';
import { AttendanceQR } from '../components/AttendanceQR';
import { Link } from 'react-router-dom';

type RequestStatus = "requested" | "accepted" | "completed" | "cancelled" | "rejected";

type ClassRequest = {
    id: string;
    student_id: string;
    coach_id: string | null;
    class_type: string;
    requested_start: string;
    duration_min: number;
    address: string | null;
    note: string | null;
    status: RequestStatus;
    created_at: string;
    region_id?: string | null;
    student_name?: string;
    student_phone?: string;
    reject_reason?: string | null;
};

export const CoachRequests = () => {
    const [viewMode, setViewMode] = useState<"designated" | "general" | "pending" | "upcoming">("designated");
    const [requests, setRequests] = useState<ClassRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [counts, setCounts] = useState({ designated: 0, general: 0, pending: 0, upcoming: 0 });
    const [msg, setMsg] = useState("");
    const [selectedRequest, setSelectedRequest] = useState<ClassRequest | null>(null);
    const [showJournalModal, setShowJournalModal] = useState(false);
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState<string>("일정 조율 불가(시간/장소)");
    
    // Coach regions for filtering general requests
    const [coachRegions, setCoachRegions] = useState<string[]>([]);
    const [regionIdMap, setRegionIdMap] = useState<Record<string, string>>({}); // name -> id

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        loadRequests();
    }, [viewMode, coachRegions, regionIdMap]);

    async function loadInitialData() {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            // 1. Fetch coach profile to get service regions
            const { data: cp } = await supabase
                .from('coach_profiles')
                .select('service_regions')
                .eq('user_id', session.user.id)
                .maybeSingle();
            
            const regions = cp?.service_regions || [];
            setCoachRegions(regions);

            // 2. Fetch all service regions to map names to IDs
            const { data: allRegions } = await supabase
                .from('service_regions')
                .select('id, display_name')
                .eq('active', true);
            
            const map: Record<string, string> = {};
            (allRegions || []).forEach(r => {
                map[r.display_name] = r.id;
            });
            setRegionIdMap(map);

        } catch (e) {
            console.error("Failed to load coach regions", e);
        }
    }

    async function loadRequests() {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            let query = supabase.from('class_requests').select('*');
            const now = new Date().toISOString();
            const regionIds = coachRegions.map(name => regionIdMap[name]).filter(Boolean);

            // Fetch counts
            const [cDes, cGen, cPen, cUp] = await Promise.all([
                supabase.from('class_requests').select('id', { count: 'exact', head: true }).eq('coach_id', session.user.id).eq('status', 'requested'),
                regionIds.length > 0 ? supabase.from('class_requests').select('id', { count: 'exact', head: true }).is('coach_id', null).eq('status', 'requested').in('region_id', regionIds) : { count: 0 },
                supabase.from('class_requests').select('id', { count: 'exact', head: true }).eq('coach_id', session.user.id).eq('status', 'accepted').lt('requested_start', now),
                supabase.from('class_requests').select('id', { count: 'exact', head: true }).eq('coach_id', session.user.id).eq('status', 'accepted').gt('requested_start', now)
            ]);

            setCounts({ 
                designated: cDes.count || 0, 
                general: cGen.count || 0, 
                pending: cPen.count || 0,
                upcoming: cUp.count || 0
            });

            if (viewMode === 'designated') {
                query = query.eq('coach_id', session.user.id).eq('status', 'requested');
            } else if (viewMode === 'general') {
                if (regionIds.length === 0) { setRequests([]); setLoading(false); return; }
                query = query.is('coach_id', null).eq('status', 'requested').in('region_id', regionIds);
            } else if (viewMode === 'pending') {
                query = query.eq('coach_id', session.user.id).eq('status', 'accepted').lt('requested_start', now);
            } else if (viewMode === 'upcoming') {
                query = query.eq('coach_id', session.user.id).eq('status', 'accepted').gt('requested_start', now);
            }

            const { data: reqs, error: reqError } = await query.order('requested_start', { ascending: viewMode === 'upcoming' });

            if (reqError) throw reqError;

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

    async function handleAction(id: string, newStatus: RequestStatus, reason?: string) {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const updates: any = { status: newStatus };
            if (newStatus === 'rejected' && reason) {
                updates.reject_reason = reason;
            }

            if (viewMode === 'general' && newStatus === 'accepted') {
                updates.coach_id = session.user.id;
            }

            let updateQuery = supabase.from('class_requests').update(updates).eq('id', id);
            
            if (viewMode === 'general' && newStatus === 'accepted') {
                // Add a check to ensure no one else has taken it yet
                updateQuery = updateQuery.is('coach_id', null);
            }

            const { error, data } = await updateQuery.select();

            if (error) throw error;
            if (viewMode === 'general' && newStatus === 'accepted' && (!data || data.length === 0)) {
                throw new Error("이미 다른 코치님이 선점한 수업입니다.");
            }

            if (newStatus === 'accepted' && selectedRequest) {
                // Auto reject overlapping requests for this coach
                const targetCoachId = selectedRequest.coach_id || session.user.id;
                await supabase
                    .from('class_requests')
                    .update({ status: 'rejected', reject_reason: '코치님이 해당 시간대에 다른 예약 일정을 확정했습니다.' })
                    .eq('coach_id', targetCoachId)
                    .eq('requested_start', selectedRequest.requested_start)
                    .neq('id', id)
                    .eq('status', 'requested');
            }

            setMsg(viewMode === 'general' && newStatus === 'accepted' 
                ? "해당 수업의 담당 코치로 배정되었습니다!" 
                : `요청이 ${newStatus === 'accepted' ? '승인' : '거절'}되었습니다.`);
            
            setSelectedRequest(null);
            setRejectingId(null);
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

            {/* View Mode Tabs */}
            <div style={tabsContainer}>
                <button 
                    onClick={() => { setViewMode("designated"); setSelectedRequest(null); }} 
                    style={{ ...tabBtn, background: viewMode === 'designated' ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)', color: viewMode === 'designated' ? 'white' : 'rgba(255,255,255,0.4)', borderColor: viewMode === 'designated' ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)' }}
                >
                    <Target size={16} /> 지목 신규
                    {counts.designated > 0 && <span style={tabBadge}>{counts.designated}</span>}
                </button>
                <button 
                    onClick={() => { setViewMode("general"); setSelectedRequest(null); }} 
                    style={{ ...tabBtn, background: viewMode === 'general' ? 'var(--color-coach)' : 'rgba(255,255,255,0.05)', color: viewMode === 'general' ? 'white' : 'rgba(255,255,255,0.4)', borderColor: viewMode === 'general' ? 'var(--color-coach)' : 'rgba(255,255,255,0.1)' }}
                >
                    <Layers size={16} /> 일반 클래스
                    {counts.general > 0 && <span style={tabBadge}>{counts.general}</span>}
                </button>
                <button 
                    onClick={() => { setViewMode("pending"); setSelectedRequest(null); }} 
                    style={{ ...tabBtn, background: viewMode === 'pending' ? '#ef4444' : 'rgba(255,255,255,0.05)', color: viewMode === 'pending' ? 'white' : 'rgba(255,255,255,0.4)', borderColor: viewMode === 'pending' ? '#ef4444' : 'rgba(255,255,255,0.1)' }}
                >
                    <Clock size={16} /> 완료 대기
                    {counts.pending > 0 && <span style={tabBadge}>{counts.pending}</span>}
                </button>
                <button 
                    onClick={() => { setViewMode("upcoming"); setSelectedRequest(null); }} 
                    style={{ ...tabBtn, background: viewMode === 'upcoming' ? '#34d399' : 'rgba(255,255,255,0.05)', color: viewMode === 'upcoming' ? 'white' : 'rgba(255,255,255,0.4)', borderColor: viewMode === 'upcoming' ? '#34d399' : 'rgba(255,255,255,0.1)' }}
                >
                    <Calendar size={16} /> 확정 일정
                </button>
            </div>

            {msg && <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.2)', color: 'var(--color-primary)', borderRadius: '12px', marginBottom: '1.5rem', fontWeight: 700, fontSize: '0.9rem' }}>{msg}</div>}

            {/* Empty State / Regional Setup Alert */}
            {viewMode === 'general' && coachRegions.length === 0 && (
                <div style={setupAlert}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                        <AlertCircle size={24} color="#f59e0b" />
                        <h3 style={{ margin: 0, fontWeight: 900 }}>활동 지역 미설정</h3>
                    </div>
                    <p style={{ opacity: 0.7, fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                        일반 클래스 신청을 확인하려면 프로필에서 <strong>활동 지역</strong>을 최소 1개 이상 설정해야 합니다.<br />
                        설정된 지역의 실시간 요청만 코치님께 노출됩니다.
                    </p>
                    <Link to="/coach" style={setupLink}>
                        <Settings size={16} /> 프로필 설정하러 가기
                    </Link>
                </div>
            )}

            <div style={{ 
                display: (viewMode === 'general' && coachRegions.length === 0) ? 'none' : 'grid', 
                gridTemplateColumns: selectedRequest ? (window.innerWidth <= 768 ? '1fr' : '1fr 1fr') : '1fr', 
                gap: '2.5rem'
            }} className="responsive-grid">
                
                <div style={{ display: 'grid', gap: '1rem', order: selectedRequest && window.innerWidth <= 768 ? 2 : 1 }}>
                    {loading && requests.length === 0 ? (
                        <div style={emptyBox}>요청을 불러오는 중...</div>
                    ) : requests.length === 0 ? (
                        <div style={emptyBox}>
                            {viewMode === 'designated' && "지정된 신규 수업 요청이 없습니다."}
                            {viewMode === 'general' && "현재 활동 지역에 가능한 일반 수업 요청이 없습니다."}
                            {viewMode === 'pending' && "일지가 작성되지 않은 '완료 대기' 수업이 없습니다."}
                            {viewMode === 'upcoming' && "확정된 향후 수업 일정이 없습니다."}
                        </div>
                    ) : (
                        <div style={{ padding: '4px', fontSize: '0.75rem', fontWeight: 900, color: 'rgba(255,255,255,0.2)', marginBottom: '8px', textTransform: 'uppercase' }}>
                            {viewMode === 'designated' && "New Designated Requests"}
                            {viewMode === 'general' && "Public Open Classes"}
                            {viewMode === 'pending' && "Needs Completion Journal"}
                            {viewMode === 'upcoming' && "Scheduled Sessions"}
                        </div>
                    )}
                    {requests.map(req => (
                            <div key={req.id} onClick={() => { setSelectedRequest(req); if(window.innerWidth <= 768) window.scrollTo({top: 400, behavior: 'smooth'}); }} style={{
                                ...card,
                                borderColor: selectedRequest?.id === req.id ? (viewMode === 'designated' ? 'var(--color-primary)' : 'var(--color-coach)') : 'rgba(255,255,255,0.08)',
                                background: selectedRequest?.id === req.id ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.03)'
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

                            {selectedRequest.status === 'requested' && !rejectingId && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                                    <button onClick={() => handleAction(selectedRequest.id, 'accepted')} style={{ ...actionBtn, background: viewMode === 'general' ? 'var(--color-coach)' : 'var(--color-primary)' }}>
                                        <Check size={18} style={{ marginRight: 8 }} /> {viewMode === 'general' ? '수업 선점하기' : '수업 승인'}
                                    </button>
                                    <button onClick={() => setRejectingId(selectedRequest.id)} style={{ ...actionBtn, background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}><X size={18} style={{ marginRight: 8 }} /> 거절</button>
                                </div>
                            )}

                            {rejectingId === selectedRequest.id && (
                                <div style={{ marginTop: '1rem', padding: '16px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#ef4444', marginBottom: '8px' }}>거절 사유 선택</div>
                                    <select 
                                        value={rejectReason} 
                                        onChange={e => setRejectReason(e.target.value)}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '12px', outline: 'none' }}
                                    >
                                        <option>일정 조율 불가(시간/장소)</option>
                                        <option>코치 개인 사정</option>
                                        <option>현재 수강생 초과로 인한 마감</option>
                                        <option>기타</option>
                                    </select>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => setRejectingId(null)} style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>취소</button>
                                        <button onClick={() => handleAction(selectedRequest.id, 'rejected', rejectReason)} style={{ flex: 1, padding: '10px', borderRadius: '8px', background: '#ef4444', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer' }}>거절 확정</button>
                                    </div>
                                </div>
                            )}


                            {selectedRequest.status === 'accepted' && (
                                <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
                                    <button 
                                        onClick={() => setShowJournalModal(true)} 
                                        style={{ ...actionBtn, background: 'var(--color-coach)' }}
                                    >
                                        <BookOpen size={18} style={{ marginRight: 8 }} /> 수업 완료 및 일지 작성
                                    </button>
                                    <AttendanceQR classRequestId={selectedRequest.id} isCoach={true} />
                                </div>
                            )}
                        </div>
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

const tabsContainer: React.CSSProperties = { display: 'flex', gap: '10px', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '8px' };
const tabBtn: React.CSSProperties = { minWidth: '120px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '14px', border: '1px solid', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9rem', position: 'relative' };
const tabBadge: React.CSSProperties = { minWidth: '18px', height: '18px', padding: '0 4px', background: 'white', color: 'black', borderRadius: '6px', fontSize: '10px', fontWeight: 950, display: 'flex', alignItems: 'center', justifyContent: 'center' };

const setupAlert: React.CSSProperties = { padding: '2rem', borderRadius: '24px', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', marginBottom: '2rem' };
const setupLink: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '12px', background: '#f59e0b', color: 'white', textDecoration: 'none', fontWeight: 900, fontSize: '0.85rem' };

const card: React.CSSProperties = { padding: '1.25rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', transition: 'all 0.2s' };
const statusBadge: React.CSSProperties = { padding: '4px 10px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase' };
const detailContainer: React.CSSProperties = { padding: '2rem', borderRadius: '24px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', height: 'fit-content', position: 'sticky', top: '24px' };
const detailSection: React.CSSProperties = { display: 'flex', flexDirection: 'column' };
const detailLabel: React.CSSProperties = { fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' };
const itemBox: React.CSSProperties = { padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', fontSize: '0.95rem' };
const actionBtn: React.CSSProperties = { padding: '14px', borderRadius: '14px', border: 'none', color: 'white', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const emptyBox: React.CSSProperties = { padding: '3rem', borderRadius: '20px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' };
