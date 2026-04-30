import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { NaverMapSelector } from '../NaverMapSelector';
import { ClassType, Region } from '../../types/dashboard';
import { MapPin, Info, CheckCircle2 } from 'lucide-react';
import { toISOStringFromKST } from '../../utils/dashboardHelpers';
import { COUNTRIES, getCountryByCode } from '../../constants/countries';

interface UnifiedBookingFormProps {
    targetCoachId?: string | null;
    targetCoachName?: string | null;
    tickets?: Record<ClassType, number>;
    regions: Region[];
    onSuccess: () => void;
    onCancel?: () => void;
    isModal?: boolean;
}

export const UnifiedBookingForm: React.FC<UnifiedBookingFormProps> = ({
    targetCoachId = null,
    targetCoachName = null,
    tickets,
    regions,
    onSuccess,
    onCancel,
    isModal = false
}) => {
    // Fields
    const [classType, setClassType] = useState<ClassType>("A");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [regionId, setRegionId] = useState("");
    const [courtName, setCourtName] = useState("");
    const [address, setAddress] = useState("");
    const [lat, setLat] = useState<number | null>(null);
    const [lng, setLng] = useState<number | null>(null);
    const [note, setNote] = useState("");
    const [isCertification, setIsCertification] = useState(false);
    const [countryCode, setCountryCode] = useState("KR");
    const [timezone, setTimezone] = useState("Asia/Seoul");
    const [availableSlots, setAvailableSlots] = useState<any[]>([]);
    const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
    const [calendarDate, setCalendarDate] = useState(new Date());

    const [internalTickets, setInternalTickets] = useState<Record<ClassType, number>>({ A: 0, B: 0, C: 0 });
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        if (!tickets) {
            fetchInternalTickets();
        }
        if (targetCoachId) {
            loadAvailableSlots();
        }
    }, [tickets, targetCoachId]);

    const loadAvailableSlots = async () => {
        const { data } = await supabase
            .from('coach_slots')
            .select('*')
            .eq('coach_id', targetCoachId)
            // 예약된 슬롯도 모두 가져오도록 eq('is_booked', false) 필터 제거
            .eq('type', 'slot')
            .gte('start_at', new Date().toISOString())
            .order('start_at', { ascending: true });
        setAvailableSlots(data || []);
    };

    const fetchInternalTickets = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const { data } = await supabase.from("ticket_balances").select("class_type, balance").eq("user_id", session.user.id);
        const next: Record<ClassType, number> = { A: 0, B: 0, C: 0 };
        (data || []).forEach((r: any) => { next[r.class_type as ClassType] = r.balance ?? 0 });
        setInternalTickets(next);
    };

    const currentTickets = tickets || internalTickets;
    const canRequest = (currentTickets[classType] ?? 0) > 0;

    const handleLocationSelect = (selectedLat: number, selectedLng: number, selectedAddr: string) => {
        setLat(selectedLat);
        setLng(selectedLng);
        setAddress(selectedAddr);
        setErrorMsg("");
    };

    const handleSubmit = async () => {
        setMsg("");
        setErrorMsg("");

        if (!date || !time) return setErrorMsg("날짜와 시간을 선택해 주세요.");
        if (!regionId) return setErrorMsg("수업 지역(구/시)을 선택해 주세요.");
        if (!lat || !lng || !address) return setErrorMsg("지도에서 수업 장소를 선택해 주세요.");
        if (!canRequest) return setErrorMsg(`Class ${classType} 티켓이 부족합니다.`);

        setLoading(true);
        try {
            const iso = toISOStringFromKST(date, time);
            const fullAddress = courtName.trim() ? `${courtName.trim()} / ${address.trim()}` : address.trim();

            // RPC call to unified request function v4
            const { error } = await supabase.rpc("request_class_v4", {
                p_class_type: classType,
                p_requested_start: iso,
                p_duration_min: 60,
                p_address: fullAddress,
                p_note: note.trim() || null,
                p_ticket_cost: 1,
                p_region_id: regionId,
                p_coach_id: targetCoachId,
                p_lat: lat,
                p_lng: lng,
                p_country_code: countryCode,
                p_timezone: timezone,
                p_is_certification: isCertification,
                p_slot_id: selectedSlotId
            });

            if (error) {
                if (error.code === 'P0001' || error.message.includes('function')) {
                    throw new Error("서버 함수 업데이트(v4)가 필요합니다. 관리자에게 문의하세요.");
                }
                throw error;
            }

            setMsg("매칭 요청이 완료되었습니다!");
            setTimeout(() => onSuccess(), 1500);
        } catch (e: any) {
            setErrorMsg(e.message || "신청 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    const formContent = (
        <div style={containerStyle}>
            {targetCoachName && (
                <div style={coachBadge}>
                    <CheckCircle2 size={16} />
                    <span>{targetCoachName} 코치님 매칭 요청 중</span>
                </div>
            )}

            {/* Step 1: Country & Class Type */}
            <div style={gridRow}>
                <div>
                    <div style={sectionLabel}>국가 선택 (시간대 자동 설정)</div>
                    <select 
                        value={countryCode} 
                        onChange={e => {
                            const c = getCountryByCode(e.target.value);
                            setCountryCode(c.code);
                            setTimezone(c.timezone);
                        }} 
                        style={selectStyle}
                    >
                        {COUNTRIES.map(c => (
                            <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                        ))}
                    </select>
                    {countryCode !== 'KR' && (
                        <div style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '6px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Info size={12} /> 현지 통화 결제는 현재 준비 중입니다.
                        </div>
                    )}
                </div>
                <div>
                    <div style={sectionLabel}>SELECT COACH GRADE</div>
                    <div style={tabContainer}>
                        {(["A", "B", "C"] as ClassType[]).map(t => (
                            <button 
                                key={t} 
                                onClick={() => setClassType(t)} 
                                style={classType === t ? tabOn : tabOff}
                            >
                                {t} GRADE
                                <span style={ticketCount}>({currentTickets[t] ?? 0}장)</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Step 2: Date & Slot Selection with Mini Calendar */}
            {targetCoachId ? (
                <div style={{ display: 'grid', gap: '20px' }}>
                    <div>
                        <div style={sectionLabel}>날짜 선택</div>
                        <div style={miniCalendarContainer}>
                            <div style={calendarHeader}>
                                <button onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1))} style={calNavBtn}>&lt;</button>
                                <div style={{ fontWeight: 900 }}>{calendarDate.getFullYear()}년 {calendarDate.getMonth() + 1}월</div>
                                <button onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1))} style={calNavBtn}>&gt;</button>
                            </div>
                            <div style={calendarGrid}>
                                {['일','월','화','수','목','금','토'].map(d => <div key={d} style={calDayHeader}>{d}</div>)}
                                {(() => {
                                    const year = calendarDate.getFullYear();
                                    const month = calendarDate.getMonth();
                                    const firstDay = new Date(year, month, 1).getDay();
                                    const daysInMonth = new Date(year, month + 1, 0).getDate();
                                    const days = [];
                                    for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} />);
                                    for (let i = 1; i <= daysInMonth; i++) {
                                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
                                        const hasAvailableSlot = availableSlots.some(s => s.start_at.startsWith(dateStr) && !s.is_booked);
                                        const hasBookedSlot = availableSlots.some(s => s.start_at.startsWith(dateStr) && s.is_booked);
                                        const hasSlot = hasAvailableSlot || hasBookedSlot;
                                        const isSelected = date === dateStr;
                                        
                                        days.push(
                                            <div 
                                                key={i} 
                                                onClick={() => { setDate(dateStr); setSelectedSlotId(null); }}
                                                style={{
                                                    ...calDayCell,
                                                    background: isSelected ? 'var(--color-primary)' : 'transparent',
                                                    color: isSelected ? 'white' : (hasAvailableSlot ? 'white' : (hasBookedSlot ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)')),
                                                    fontWeight: isSelected || hasSlot ? 800 : 400,
                                                    cursor: 'pointer',
                                                    position: 'relative'
                                                }}
                                            >
                                                {i}
                                                {hasAvailableSlot && !isSelected && <div style={{...hasSlotDot, background: 'var(--color-primary)'}} />}
                                                {!hasAvailableSlot && hasBookedSlot && !isSelected && <div style={{...hasSlotDot, background: '#ef4444'}} />}
                                            </div>
                                        );
                                    }
                                    return days;
                                })()}
                            </div>
                        </div>
                    </div>

                    {date && (
                        <div>
                            <div style={sectionLabel}>{date} 코치 일정</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {availableSlots.filter(s => s.start_at.startsWith(date)).length > 0 ? (
                                    availableSlots.filter(s => s.start_at.startsWith(date)).map(slot => {
                                        const start = new Date(slot.start_at);
                                        const isSelected = selectedSlotId === slot.id;
                                        const isBooked = slot.is_booked;
                                        
                                        return (
                                            <button
                                                key={slot.id}
                                                onClick={() => {
                                                    if (isBooked) return;
                                                    setSelectedSlotId(slot.id);
                                                    setTime(start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
                                                }}
                                                disabled={isBooked}
                                                style={{
                                                    ...slotBtnStyle,
                                                    background: isBooked ? 'rgba(239, 68, 68, 0.05)' : (isSelected ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)'),
                                                    borderColor: isBooked ? 'rgba(239, 68, 68, 0.2)' : (isSelected ? 'white' : 'rgba(255,255,255,0.1)'),
                                                    color: isBooked ? '#ef4444' : (isSelected ? 'white' : 'rgba(255,255,255,0.7)'),
                                                    cursor: isBooked ? 'not-allowed' : 'pointer'
                                                }}
                                            >
                                                {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                {isBooked ? ' (예약 마감)' : ''}
                                            </button>
                                        );
                                    })
                                ) : (
                                    <div style={{ fontSize: '0.8rem', opacity: 0.4, padding: '10px' }}>해당 날짜에는 일정이 없습니다.</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div style={gridRow}>
                    <div>
                        <div style={sectionLabel}>날짜</div>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                        <div style={sectionLabel}>시간</div>
                        <input type="time" value={time} onChange={e => setTime(e.target.value)} style={inputStyle} />
                    </div>
                </div>
            )}

            {/* Step 3: Region */}
            <div>
                <div style={sectionLabel}>구/시 지역</div>
                <select value={regionId} onChange={e => setRegionId(e.target.value)} style={selectStyle}>
                    <option value="">지역 선택</option>
                    {regions.map(r => (
                        <option key={r.id} value={r.id} style={{ background: '#2a2a2d' }}>{r.display_name}</option>
                    ))}
                </select>
            </div>

            {/* Step 4: Map Location */}
            <div>
                <div style={sectionLabel}>매칭 장소 선택 (지도 클릭)</div>
                <div style={{ marginTop: 8 }}>
                    <NaverMapSelector onLocationSelected={handleLocationSelect} />
                </div>
                {address && (
                    <div style={addressDisplay}>
                        <MapPin size={16} color="var(--color-primary)" />
                        <span>{address}</span>
                    </div>
                )}
            </div>

            {/* Step 5: Details & Note */}
            <div>
                <div style={sectionLabel}>상세 위치 / 코트 이름 (선택)</div>
                <input 
                    placeholder="예: 3층 체육관, 정문 앞 코트 등" 
                    value={courtName} 
                    onChange={e => setCourtName(e.target.value)} 
                    style={inputStyle} 
                />
            </div>

            {/* Step 6: Certification Option */}
            <div style={{ padding: '16px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.1)', marginTop: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '12px' }}>
                    <input 
                        type="checkbox" 
                        checked={isCertification} 
                        onChange={e => setIsCertification(e.target.checked)}
                        style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                    />
                    <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--color-primary)' }}>레벨 테스트 / 인증 신청</div>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                            코칭 요청 시 코치가 실력을 판단하여 즉시 레벨 조정을 진행합니다.
                        </div>
                    </div>
                </label>
            </div>

            <div>
                <div style={sectionLabel}>메모 / 요구사항 (선택)</div>
                <textarea 
                    placeholder="코치에게 전달할 특이사항을 적어주세요." 
                    value={note} 
                    onChange={e => setNote(e.target.value)} 
                    style={textareaStyle} 
                />
            </div>

            {/* Status Messages */}
            {errorMsg && <div style={errorBanner}>{errorMsg}</div>}
            {msg && <div style={successBanner}>{msg}</div>}

            {/* Submit Actions */}
            <div style={actionRow}>
                {onCancel && <button onClick={onCancel} style={btnSecondary}>취소</button>}
                <button 
                    onClick={handleSubmit} 
                    disabled={loading || !canRequest} 
                    style={(!canRequest || loading) ? btnDisabled : btnPrimary}
                >
                    {loading ? "처리 중..." : (canRequest ? "매칭 요청하기" : "요청권 부족")}
                </button>
            </div>

            <div style={infoFooter}>
                <Info size={14} />
                <span>매칭 요청 시 요청권 1장이 즉시 사용됩니다. 본 요청은 독립 코치에게 전달되는 매칭 신청이며, 코칭의 일차적 책임은 코치에게 있습니다.</span>
            </div>
        </div>
    );

    if (isModal) {
        return (
            <div style={modalOverlay}>
                <div className="card-premium glass-morphism" style={modalContent}>
                    <div style={modalHeader}>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 900 }}>수업 예약 신청</h2>
                        <button onClick={onCancel} style={closeIconBtn}>&times;</button>
                    </div>
                    <div style={{ maxHeight: '75vh', overflowY: 'auto', paddingRight: '4px' }}>
                        {formContent}
                    </div>
                </div>
            </div>
        );
    }

    return formContent;
};

// Styles
const containerStyle: React.CSSProperties = { display: 'grid', gap: '20px' };
const sectionLabel: React.CSSProperties = { fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' };
const gridRow: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' };

const inputBase: React.CSSProperties = {
    width: '100%',
    padding: '14px',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: '#1a1a1c',
    color: 'white',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
    colorScheme: 'dark'
};

const inputStyle: React.CSSProperties = { ...inputBase };
const textareaStyle: React.CSSProperties = { ...inputBase, height: '80px', resize: 'none' };
const selectStyle: React.CSSProperties = { 
    ...inputBase, 
    background: '#2a2a2d', 
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    backgroundSize: '16px'
};

const tabContainer: React.CSSProperties = { display: 'flex', gap: '8px' };
const tabBase: React.CSSProperties = { flex: 1, padding: '12px', borderRadius: '12px', cursor: 'pointer', fontWeight: 800, fontSize: '13px', border: 'none', transition: '0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center' };
const tabOn: React.CSSProperties = { ...tabBase, background: 'var(--color-primary)', color: 'white' };
const tabOff: React.CSSProperties = { ...tabBase, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)' };
const ticketCount: React.CSSProperties = { fontSize: '10px', opacity: 0.7, marginTop: '2px' };

const addressDisplay: React.CSSProperties = { marginTop: '12px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(255,255,255,0.05)' };

const actionRow: React.CSSProperties = { display: 'flex', gap: '12px', marginTop: '10px' };
const btnBase: React.CSSProperties = { flex: 1, padding: '16px', borderRadius: '14px', border: 'none', fontWeight: 900, cursor: 'pointer', fontSize: '15px' };
const btnPrimary: React.CSSProperties = { ...btnBase, background: 'white', color: 'black' };
const btnSecondary: React.CSSProperties = { ...btnBase, background: 'rgba(255,255,255,0.05)', color: 'white' };
const btnDisabled: React.CSSProperties = { ...btnBase, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.2)', cursor: 'not-allowed' };

const errorBanner: React.CSSProperties = { padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 800 };
const successBanner: React.CSSProperties = { padding: '12px', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 800 };
const infoFooter: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', justifyContent: 'center' };

const coachBadge: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--color-primary)', fontSize: '0.85rem', fontWeight: 800, width: 'fit-content' };

// Calendar Styles
const miniCalendarContainer: React.CSSProperties = { background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', padding: '16px' };
const calendarHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' };
const calNavBtn: React.CSSProperties = { background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem', padding: '0 10px' };
const calendarGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' };
const calDayHeader: React.CSSProperties = { textAlign: 'center', fontSize: '0.7rem', fontWeight: 900, color: 'rgba(255,255,255,0.3)', marginBottom: '8px' };
const calDayCell: React.CSSProperties = { aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', fontSize: '0.85rem', transition: 'all 0.2s' };
const hasSlotDot: React.CSSProperties = { position: 'absolute', bottom: '4px', width: '4px', height: '4px', borderRadius: '50%', background: 'var(--color-primary)' };
const slotBtnStyle: React.CSSProperties = { padding: '10px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer' };

const modalOverlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px' };
const modalContent: React.CSSProperties = { width: '100%', maxWidth: '600px', maxHeight: '90vh', background: '#111112', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '32px', padding: '32px', position: 'relative', display: 'flex', flexDirection: 'column' };
const modalHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' };
const closeIconBtn: React.CSSProperties = { background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '2rem', cursor: 'pointer', lineHeight: 1, padding: '0 8px' };
