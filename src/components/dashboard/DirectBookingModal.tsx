import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, MapPin, Clock } from 'lucide-react';
import { NaverMapSelector } from '../NaverMapSelector';
import { estimateTravelTimeMin, getDistanceKms } from '../../lib/routingUtils';
import { ClassType } from '../../types/dashboard';

interface DirectBookingModalProps {
    coachId: string;
    coachName: string;
    onClose: () => void;
    onSuccess: () => void;
}

export const DirectBookingModal: React.FC<DirectBookingModalProps> = ({ coachId, coachName, onClose, onSuccess }) => {
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [classType, setClassType] = useState<ClassType>("A");
    
    // Auth & Tickets
    const [userId, setUserId] = useState<string | null>(null);
    const [tickets, setTickets] = useState<Record<string, number>>({});
    
    // Location state
    const [lat, setLat] = useState<number | null>(null);
    const [lng, setLng] = useState<number | null>(null);
    const [address, setAddress] = useState("");
    const [courtName, setCourtName] = useState("");
    
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState("");
    const [warningMsg, setWarningMsg] = useState("");
    const [existingSchedules, setExistingSchedules] = useState<any[]>([]);

    // Setup initial data
    useEffect(() => {
        checkAuthAndTickets();
    }, []);

    async function checkAuthAndTickets() {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            setMsg("로그인이 필요합니다.");
            return;
        }
        setUserId(session.user.id);
        
        // Fetch tickets
        const { data } = await supabase.from("ticket_balances").select("class_type, balance").eq("user_id", session.user.id);
        const next: Record<ClassType, number> = { A: 0, B: 0, C: 0 };
        (data || []).forEach((r: any) => { next[r.class_type as ClassType] = r.balance ?? 0 });
        setTickets(next);
    }

    const handleLocationSelect = (selectedLat: number, selectedLng: number, selectedAddr: string) => {
        setLat(selectedLat);
        setLng(selectedLng);
        setAddress(selectedAddr);
        validateSchedule(date, time, selectedLat, selectedLng);
    };

    const handleDateTimeChange = (newDate: string, newTime: string) => {
        setDate(newDate);
        setTime(newTime);
        if (lat && lng) validateSchedule(newDate, newTime, lat, lng);
    };

    const validateSchedule = async (d: string, t: string, selectedLat: number, selectedLng: number) => {
        setWarningMsg("");
        if (!d || !t || !selectedLat || !selectedLng) return;

        const targetTime = new Date(`${d}T${t}:00+09:00`).getTime();
        
        // Fetch coach's existing schedule for the day if not loaded
        let schedules = existingSchedules;
        if (schedules.length === 0) {
            const { data } = await supabase
                .from('class_requests')
                .select('requested_start, duration_min, address, lat, lng')
                .eq('coach_id', coachId)
                .in('status', ['accepted', 'completed'])
                .gte('requested_start', `${d}T00:00:00+09:00`)
                .lte('requested_start', `${d}T23:59:59+09:00`);
            schedules = data || [];
            setExistingSchedules(schedules);
        }

        // Check for overlaps and travel time
        for (const req of schedules) {
            const reqStart = new Date(req.requested_start).getTime();
            const reqEnd = reqStart + ((req.duration_min || 60) * 60000);
            
            // Check direct time overlap (target time up to 60 mins later)
            const targetEnd = targetTime + 60 * 60000; 
            if (targetTime < reqEnd && targetEnd > reqStart) {
                setWarningMsg("코치님의 해당 시간에 이미 확정된 수업이 있습니다. 다른 시간을 선택해주세요.");
                return;
            }

            // Estimate travel time
            if (req.lat && req.lng) {
                const dist = getDistanceKms(selectedLat, selectedLng, req.lat, req.lng);
                const travelMins = estimateTravelTimeMin(dist, 'transit'); // Default to transit safely
                
                // If requested time is AFTER the existing class
                if (targetTime >= reqEnd) {
                    if (targetTime < reqEnd + (travelMins * 60000)) {
                        setWarningMsg(`이전 수업 장소(${req.address?.substring(0,6)}...)에서 이동하기에 시간이 촉박할 수 있습니다. (예상 대중교통 이동시간: ${travelMins}분). 좀 더 여유있게 시간을 잡아주세요.`);
                        return;
                    }
                }
                // If requested time is BEFORE the existing class
                if (targetEnd <= reqStart) {
                    if (targetEnd + (travelMins * 60000) > reqStart) {
                        setWarningMsg(`다음 수업 장소로 코치님이 이동할 시간이 부족합니다. (예상 이동시간: ${travelMins}분). 시간을 앞당겨주세요.`);
                        return;
                    }
                }
            }
        }
    };

    const handleSubmit = async () => {
        if (!userId) {
            alert("로그인이 필요합니다.");
            return;
        }
        if (!date || !time) return setMsg("날짜와 시간을 선택해주세요.");
        if (!lat || !lng || !address) return setMsg("지도에서 수업 장소를 선택해주세요.");
        if ((tickets[classType] ?? 0) <= 0) return setMsg(`Class ${classType} 티켓이 없습니다. 결제 후 이용해주세요.`);

        setLoading(true);
        setMsg("");
        try {
            // ISO 생성
            const requested_start = `${date}T${time}:00+09:00`;
            const fullAddress = courtName.trim() ? `${courtName.trim()} / ${address}` : address;

            // Supabase RPC 호출. 만약 기존 request_class가 coach_id 파라미터를 받지 못한다면, 직접 Insert 후 티켓 수동 차감이 필요할 수 있음.
            // 여기서는 기존 시스템과의 충돌을 피하기 위해 class_requests 테이블에 Insert하고, 트리거가 없다면 ticket 차감 RPC를 태우거나 바로 직접 처리합니다.
            // (구현계획 1차 본에서는 class_requests 에 insert)
            
            const { error: insertError } = await supabase.from('class_requests').insert({
                student_id: userId,
                coach_id: coachId,
                class_type: classType,
                requested_start,
                duration_min: 60,
                address: fullAddress,
                lat,
                lng,
                status: 'requested',
                ticket_deducted: false
            });

            if (insertError) throw insertError;
            
            // Note: 실제 프로덕션에서는 티켓 차감이 원자적(Atomic)으로 이루어져야 합니다.
            // RPC(request_class)를 덮어쓰지 않고 직접 업데이트
            await supabase.rpc('decrement_ticket', { p_user_id: userId, p_class_type: classType, p_amount: 1 });
            
            alert(`${coachName} 코치님께 수업 신청이 완료되었습니다!`);
            onSuccess();
        } catch (e: any) {
            setMsg(e?.message || "오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    const hasTickets = (tickets[classType] ?? 0) > 0;

    return (
        <div style={modalOverlay}>
            <div className="card-premium glass-morphism" style={modalContent}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 900 }}>{coachName} 코치 지정 예약</h2>
                    <button onClick={onClose} style={closeBtn}><X size={20} /></button>
                </div>

                {msg && <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '12px', marginBottom: '1rem', fontWeight: 700, fontSize: '0.85rem' }}>{msg}</div>}

                <div style={{ display: 'grid', gap: '1.5rem', maxHeight: '70vh', overflowY: 'auto', paddingRight: '10px' }}>
                    
                    {/* Class Type */}
                    <div>
                        <div style={label}>수업 종류</div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                            {(["A", "B", "C"] as ClassType[]).map(t => (
                                <button key={t} onClick={() => setClassType(t)} style={classType === t ? tabActive : tabInactive}>
                                    Class {t} <span style={{opacity: 0.5, fontSize:'0.75rem', marginLeft:4}}>(남은 티켓: {tickets[t] ?? 0}장)</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Date/Time */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <div style={label}>날짜</div>
                            <input type="date" value={date} onChange={e => handleDateTimeChange(e.target.value, time)} style={input} />
                        </div>
                        <div>
                            <div style={label}>시간</div>
                            <input type="time" value={time} onChange={e => handleDateTimeChange(date, e.target.value)} style={input} />
                        </div>
                    </div>

                    {warningMsg && (
                        <div style={{ padding: '12px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700, lineHeight: 1.5 }}>
                            ⚠️ {warningMsg}
                        </div>
                    )}

                    {/* Naver Map Selection */}
                    <div>
                        <div style={label}>수업 장소 선택</div>
                        <div style={{ marginTop: '8px', marginBottom: '12px' }}>
                            <input 
                                placeholder="상세 코트 이름 또는 체육관 명칭 (선택)" 
                                value={courtName} 
                                onChange={e => setCourtName(e.target.value)} 
                                style={input} 
                            />
                        </div>
                        <NaverMapSelector onLocationSelected={handleLocationSelect} />
                        {address && (
                            <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                                <MapPin size={16} /> {address}
                            </div>
                        )}
                    </div>

                </div>

                <div style={{ marginTop: '2rem', display: 'flex', gap: '12px' }}>
                    <button onClick={onClose} style={cancelBtn}>취소</button>
                    <button onClick={handleSubmit} disabled={loading || !hasTickets} style={hasTickets && !loading ? submitBtn : disabledBtn}>
                        {loading ? "처리중..." : (hasTickets ? "지정 예약 신청하기" : "보유 티켓 부족")}
                    </button>
                </div>
            </div>
        </div>
    );
};

const modalOverlay: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' };
const modalContent: React.CSSProperties = { width: '100%', maxWidth: '600px', padding: '2rem', border: '1px solid rgba(255,255,255,0.1)', background: 'var(--bg-surface-L1)' };
const closeBtn: React.CSSProperties = { background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' };
const label: React.CSSProperties = { fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' };
const input: React.CSSProperties = { 
    width: '100%', 
    padding: '14px', 
    borderRadius: '12px', 
    border: '1px solid rgba(255,255,255,0.1)', 
    background: 'rgba(0,0,0,0.3)', 
    color: 'white', 
    outline: 'none',
    colorScheme: 'dark' // Ensures native picker icons are visible
};
const tabActive: React.CSSProperties = { flex: 1, padding: '12px', borderRadius: '12px', background: 'white', color: 'black', border: 'none', fontWeight: 800, cursor: 'pointer' };
const tabInactive: React.CSSProperties = { flex: 1, padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 700, cursor: 'pointer' };
const cancelBtn: React.CSSProperties = { flex: 1, padding: '16px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer' };
const submitBtn: React.CSSProperties = { flex: 2, padding: '16px', borderRadius: '14px', background: 'var(--color-primary)', color: 'white', border: 'none', fontWeight: 900, cursor: 'pointer' };
const disabledBtn: React.CSSProperties = { flex: 2, padding: '16px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 900, cursor: 'not-allowed' };
