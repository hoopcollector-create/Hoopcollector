import React from 'react';
import { Link } from 'react-router-dom';
import { MyRequest, Filter } from '../../types/dashboard';
import { statusKo, fmtDateKST, fmtTimeKST, canCancelStatus } from '../../utils/dashboardHelpers';
import { AttendanceQR } from '../AttendanceQR';

interface StudentHistoryProps {
    rows: MyRequest[];
    cancelledRows: MyRequest[];
    filter: Filter;
    setFilter: (v: Filter) => void;
    showCancelled: boolean;
    setShowCancelled: (v: boolean) => void;
    cancelRequest: (id: string) => Promise<void>;
    reportCoachNoShow: (id: string) => Promise<void>;
    loading: boolean;
    regionMap: Map<string, string>;
}

export const StudentHistory = ({
    rows, filter, setFilter, cancelRequest, reportCoachNoShow, loading, regionMap
}: StudentHistoryProps) => {
    return (
        <div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                {["all", "requested", "accepted", "completed"].map(k => (
                    <button key={k} style={filter === k ? tabOn : tabOff} onClick={() => setFilter(k as Filter)}>{statusKo(k)}</button>
                ))}
            </div>
            <div style={{ display: "grid", gap: 12 }}>
                {rows.map((r: MyRequest) => (
                    <div key={r.id} style={historyCard}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <div style={{ fontWeight: 800, fontSize: 16 }}>Class {r.class_type}</div>
                            <div style={statusBadge}>{statusKo(r.status)}</div>
                        </div>
                        <div style={{ display: 'grid', gap: 6, opacity: 0.8, fontSize: 14 }}>
                            <div>📅 {fmtDateKST(r.requested_start)} {fmtTimeKST(r.requested_start)}</div>
                            <div>📍 {regionMap.get(r.region_id!) || r.address || '장소미정'}</div>
                            <div>⏳ {r.duration_min}분</div>
                        </div>
                        {canCancelStatus(r.status) && (
                            <button style={cancelBtn} onClick={() => cancelRequest(r.id)} disabled={loading}>
                                예약 취소 (환불규정 적용)
                            </button>
                        )}
                        {r.status === 'accepted' && (
                            <div style={{ marginTop: 16, display: 'grid', gap: '8px' }}>
                                <AttendanceQR classRequestId={r.id} isCoach={false} />
                                {new Date(r.requested_start) < new Date() && (
                                    <button 
                                        style={{ ...cancelBtn, marginTop: 8 }} 
                                        onClick={() => reportCoachNoShow(r.id)} 
                                        disabled={loading}
                                    >
                                        코치가 오지 않았어요 (노쇼 신고)
                                    </button>
                                )}
                            </div>
                        )}
                        {r.status === 'completed' && (
                            <Link to={`/journal/${r.id}`} style={{ textDecoration: 'none' }}>
                                <button style={journalBtn}>
                                    수업 일지 확인
                                </button>
                            </Link>
                        )}
                    </div>
                ))}
                {rows.length === 0 && <div style={{ opacity: 0.6, textAlign: 'center', padding: '40px 0' }}>내역이 없습니다.</div>}
            </div>
        </div>
    );
};

const historyCard: React.CSSProperties = { padding: 16, borderRadius: 16, border: "1px solid rgba(255,255,255,.10)", background: "rgba(255,255,255,.05)" };
const statusBadge: React.CSSProperties = { padding: "4px 10px", borderRadius: 999, background: 'rgba(255,255,255,0.1)', fontSize: 12, fontWeight: 900 };
const cancelBtn: React.CSSProperties = { width: '100%', background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', marginTop: 16, padding: 10, borderRadius: 12, fontWeight: 800, cursor: 'pointer' };
const journalBtn: React.CSSProperties = { width: '100%', background: 'var(--color-primary)', color: 'white', border: 'none', marginTop: 16, padding: 10, borderRadius: 12, fontWeight: 800, cursor: 'pointer' };
const tabOn: React.CSSProperties = { padding: "12px 10px", borderRadius: 14, border: "none", background: "#ffffff", color: "#000000", cursor: "pointer", fontWeight: 800, fontSize: 14 };
const tabOff: React.CSSProperties = { padding: "12px 10px", borderRadius: 14, border: "1px solid rgba(255,255,255,.10)", background: "rgba(255,255,255,.04)", color: "rgba(255,255,255,.5)", cursor: "pointer", fontWeight: 700, fontSize: 14 };
