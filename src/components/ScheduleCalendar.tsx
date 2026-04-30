import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalIcon, Clock, User, Check, X, Trash2, Zap, ArrowLeft } from 'lucide-react';
import { useTranslation } from '../lib/i18n';

interface Event {
    id: string;
    title: string;
    start: Date;
    end: Date;
    type: 'class' | 'personal' | 'slot';
    status?: string;
    student_name?: string;
}

export const ScheduleCalendar = () => {
    const [viewDate, setViewDate] = useState(new Date());
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showRulesModal, setShowRulesModal] = useState(false);
    const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
    const [msg, setMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const { t } = useTranslation();

    // Recurring rules state
    const [rules, setRules] = useState<any[]>([]);
    const [ruleType, setRuleType] = useState<'slot' | 'personal'>('slot');
    const [ruleDay, setRuleDay] = useState(1); // Mon defaults
    const [ruleStart, setRuleStart] = useState("18:00");
    const [ruleEnd, setRuleEnd] = useState("19:00");

    // Form states
    const [newTitle, setNewTitle] = useState("");
    const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
    const [newStartTime, setNewStartTime] = useState("09:00");
    const [newEndTime, setNewEndTime] = useState("10:00");
    const [newType, setNewType] = useState<'slot' | 'personal'>('personal');
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

    useEffect(() => {
        loadEvents();
        if (showRulesModal) loadRules();
    }, [viewDate, showRulesModal]);

    async function loadRules() {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            const { data, error } = await supabase
                .from('coach_slot_rules')
                .select('*')
                .eq('coach_id', session.user.id)
                .order('day_of_week', { ascending: true })
                .order('start_time', { ascending: true });
            
            if (error) {
                console.error("Rules Fetch Error:", error);
                return;
            }
            setRules(data || []);
        } catch (e) {
            console.error("Rules Exception:", e);
        }
    }

    async function handleAddRule() {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { error } = await supabase.from('coach_slot_rules').insert({
                coach_id: session.user.id,
                day_of_week: ruleDay,
                start_time: ruleStart,
                end_time: ruleEnd,
                type: ruleType
            });

            if (error) {
                console.error("Rules Insert Error Detail:", error);
                throw new Error(`${error.message} (상세: ${JSON.stringify(error)})`);
            }
            setMsg("반복 규칙이 추가되었습니다.");
            loadRules();
        } catch (e: any) {
            console.error("Full catch error:", e);
            setErrorMsg(e.message);
        }
    }

    async function handleDeleteRule(id: string) {
        const { error } = await supabase.from('coach_slot_rules').delete().eq('id', id);
        if (!error) loadRules();
    }

    // Timezone-safe ISO string formatter
    const toLocalISOString = (date: Date) => {
        const offset = date.getTimezoneOffset();
        const offsetAbs = Math.abs(offset);
        const iso = new Date(date.getTime() - (offset * 60 * 1000)).toISOString().slice(0, -1);
        return `${iso}${offset <= 0 ? '+' : '-'}${String(Math.floor(offsetAbs / 60)).padStart(2, '0')}:${String(offsetAbs % 60).padStart(2, '0')}`;
    };

    async function generateSlotsFromRules() {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            
            const endDate = new Date();
            endDate.setDate(todayStart.getDate() + 28);

            // 1. 기존 스케줄 중 "예약되지 않은" 빈 시간대(slot)와 개인 일정 모두 삭제하여 초기화
            await supabase
                .from('coach_slots')
                .delete()
                .eq('coach_id', session.user.id)
                .eq('is_booked', false) // 예약된 건 안전하게 보호
                .gte('start_at', todayStart.toISOString())
                .lte('start_at', endDate.toISOString());

            // 2. 예약이 확정된 "바쁜 시간(수업/예약)" 데이터 미리 가져오기 (겹침 방지용)
            const { data: busySlots } = await supabase
                .from('coach_slots')
                .select('start_at, end_at')
                .eq('coach_id', session.user.id)
                .eq('is_booked', true)
                .gte('start_at', todayStart.toISOString());
            
            const { data: busyReqs } = await supabase
                .from('class_requests')
                .select('requested_start, duration_min')
                .eq('coach_id', session.user.id)
                .eq('status', 'accepted')
                .gte('requested_start', todayStart.toISOString());

            // 바쁜 시간들을 (start_time, end_time) 배열로 정리
            const busyTimes: { start: number, end: number }[] = [];
            (busySlots || []).forEach(s => {
                busyTimes.push({ start: new Date(s.start_at).getTime(), end: new Date(s.end_at).getTime() });
            });
            (busyReqs || []).forEach(r => {
                const sTime = new Date(r.requested_start).getTime();
                busyTimes.push({ start: sTime, end: sTime + (r.duration_min || 60) * 60000 });
            });

            // 겹치는지 확인하는 헬퍼 함수
            const isOverlapping = (s: number, e: number) => {
                return busyTimes.some(busy => (s < busy.end) && (e > busy.start));
            };

            // 3. 규칙에 따라 1시간 단위 슬롯 쪼개서 생성
            const newSlots: any[] = [];
            
            for (let i = 0; i < 28; i++) {
                const targetDate = new Date();
                targetDate.setDate(todayStart.getDate() + i);
                const dayOfWeek = targetDate.getDay();

                const matchedRules = rules.filter(r => r.day_of_week === dayOfWeek);
                matchedRules.forEach(r => {
                    const datePart = targetDate.toLocaleDateString('sv-SE'); 
                    const startAt = new Date(`${datePart}T${r.start_time}`);
                    const endAt = new Date(`${datePart}T${r.end_time}`);

                    if (r.type === 'slot') {
                        // 1시간 단위로 쪼개기
                        let curr = new Date(startAt);
                        while (curr < endAt) {
                            const next = new Date(curr.getTime() + 60 * 60000);
                            if (next > endAt) break;

                            // 이미 예약된 수업과 겹치면 해당 시간(1시간)은 패스!
                            if (!isOverlapping(curr.getTime(), next.getTime())) {
                                newSlots.push({
                                    coach_id: session.user.id,
                                    title: "레슨 가능",
                                    start_at: toLocalISOString(curr),
                                    end_at: toLocalISOString(next),
                                    type: 'slot',
                                    is_booked: false,
                                    status: 'open',
                                    is_recurring: true
                                });
                            }
                            curr = next;
                        }
                    } else {
                        // 개인 일정(수업 불가)은 쪼개지 않고 통째로 등록, 단 예약과 겹치지 않을 때만
                        if (!isOverlapping(startAt.getTime(), endAt.getTime())) {
                            newSlots.push({
                                coach_id: session.user.id,
                                title: "개인 일정 (수업 불가)",
                                start_at: toLocalISOString(startAt),
                                end_at: toLocalISOString(endAt),
                                type: r.type,
                                is_booked: false,
                                status: 'open',
                                is_recurring: true
                            });
                        }
                    }
                });
            }

            if (newSlots.length > 0) {
                // 한 번에 1000개가 넘어가면 에러가 날 수 있으므로 안전하게 처리
                for (let i = 0; i < newSlots.length; i += 500) {
                    const chunk = newSlots.slice(i, i + 500);
                    const { error } = await supabase.from('coach_slots').insert(chunk);
                    if (error) throw error;
                }
                setMsg(`기존 예약 시간을 제외하고 총 ${newSlots.length}개의 1시간 단위 일정이 생성되었습니다!`);
                loadEvents();
                setShowRulesModal(false);
            } else {
                setMsg("생성 가능한 빈 시간이 없습니다. (모두 예약됨 혹은 규칙 없음)");
            }
        } catch (e: any) {
            console.error("Generation Failed:", e);
            setErrorMsg(`생성 실패: ${e.message}`);
        } finally {
            setLoading(false);
        }
    }

    async function loadEvents() {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            // 1. Fetch Slots (Coach's own schedule)
            const { data: slots, error: slotErr } = await supabase
                .from('coach_slots')
                .select('id, coach_id, title, start_at, end_at, type, is_booked')
                .eq('coach_id', session.user.id);
            
            if (slotErr) {
                console.error("Slots Fetch Error:", slotErr);
            }

            // 2. Fetch Accepted Requests (Classes)
            const { data: reqs, error: reqErr } = await supabase.from('class_requests')
                .select('*')
                .eq('coach_id', session.user.id)
                .eq('status', 'accepted');

            if (reqErr) {
                console.error("Requests Fetch Error:", reqErr);
            }

            // 3. Profiles Sync
            const studentIds = Array.from(new Set((reqs || []).map(r => r.student_id)));
            let profMap: any = {};
            if (studentIds.length > 0) {
                const { data: profs } = await supabase.from('profiles').select('id, name').in('id', studentIds);
                profMap = (profs || []).reduce((acc: any, p: any) => {
                    acc[p.id] = p;
                    return acc;
                }, {});
            }

            // 4. Merge
            const merged: Event[] = [];
            
            (slots || []).forEach(s => {
                merged.push({
                    id: s.id,
                    title: s.title || (s.is_booked ? '예약된 수업' : '레슨 가능'),
                    start: new Date(s.start_at),
                    end: s.end_at ? new Date(s.end_at) : new Date(new Date(s.start_at).getTime() + 60*60*1000),
                    type: s.type === 'personal' ? 'personal' : 'slot'
                });
            });

            (reqs || []).forEach(r => {
                merged.push({
                    id: r.id,
                    title: `🏀 ${profMap[r.student_id]?.name || '익명'} 학생 수업`,
                    start: new Date(r.requested_start),
                    end: new Date(new Date(r.requested_start).getTime() + (r.duration_min || 60)*60*1000),
                    type: 'class',
                    student_name: profMap[r.student_id]?.name
                });
            });

            setEvents(merged);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    async function handleDeleteEvent(eventId: string, type: 'class' | 'personal' | 'slot') {
        if (!window.confirm("정말 이 일정을 삭제하시겠습니까?")) return;
        
        try {
            setLoading(true);
            if (type === 'class') {
                // Class deletion might need more complex logic (notifying student, etc.)
                // For now, let's assume we can't delete accepted classes directly from here
                // or use a different endpoint. Let's restrict it to coach_slots.
                alert("예약된 수업은 '내 수업 관리' 메뉴에서 취소/변경해주세요.");
            } else {
                const { error } = await supabase
                    .from('coach_slots')
                    .delete()
                    .eq('id', eventId);
                
                if (error) throw error;
                setMsg("일정이 삭제되었습니다.");
                setSelectedEvent(null);
                loadEvents();
            }
        } catch (e: any) {
            setErrorMsg("삭제 실패: " + e.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleAddEvent() {
        if (!newTitle) return setErrorMsg("일정 제목을 입력해주세요.");
        
        const startAt = new Date(`${newDate}T${newStartTime}:00`);
        const endAt = new Date(`${newDate}T${newEndTime}:00`);

        if (endAt <= startAt) {
            return setErrorMsg("종료 시간은 시작 시간보다 늦어야 합니다.");
        }

        const isBusyType = (t: string) => t === 'personal' || t === 'class';
        
        // 1. 기존 일정과 겹치는지 확인 (슬롯 타입은 무시)
        const overlap = (newType === 'personal') ? events.find(ev => {
            if (!isBusyType(ev.type)) return false; 
            return (startAt.getTime() < ev.end.getTime()) && (endAt.getTime() > ev.start.getTime());
        }) : null;

        if (overlap) {
            return setErrorMsg(`⚠️ 해당 시간에 이미 고정된 일정('${overlap.title}')이 존재합니다. 확인 후 다시 시도해 주세요.`);
        }

        setLoading(true);
        setErrorMsg(""); 
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const slotsToInsert: any[] = [];

            if (newType === 'slot') {
                // 2. 수동 등록 시에도 1시간 단위로 쪼개서 넣기
                let curr = new Date(startAt);
                while (curr < endAt) {
                    const next = new Date(curr.getTime() + 60 * 60000);
                    if (next > endAt) break;

                    // 이 1시간 슬롯이 기존 바쁜 일정과 겹치지 않는지 확인
                    const slotOverlap = events.find(ev => {
                        if (!isBusyType(ev.type)) return false;
                        return (curr.getTime() < ev.end.getTime()) && (next.getTime() > ev.start.getTime());
                    });

                    if (!slotOverlap) {
                        slotsToInsert.push({
                            coach_id: session.user.id,
                            title: newTitle,
                            start_at: toLocalISOString(curr),
                            end_at: toLocalISOString(next),
                            type: 'slot',
                            is_booked: false,
                            status: 'open'
                        });
                    }
                    curr = next;
                }
            } else {
                // 개인 일정은 쪼개지 않고 하나로 등록
                slotsToInsert.push({
                    coach_id: session.user.id,
                    title: newTitle,
                    start_at: toLocalISOString(startAt),
                    end_at: toLocalISOString(endAt),
                    type: newType,
                    is_booked: false,
                    status: 'open'
                });
            }

            if (slotsToInsert.length === 0) {
                throw new Error("겹치는 일정을 제외하니 등록 가능한 시간이 없습니다.");
            }

            const { error } = await supabase.from('coach_slots').insert(slotsToInsert);
            if (error) throw new Error(`${error.message} (코드: ${error.code})`);

            setMsg(slotsToInsert.length > 1 ? `성공적으로 ${slotsToInsert.length}개의 일정이 등록되었습니다.` : "성공적으로 일정이 등록되었습니다.");
            setShowModal(false);
            setNewTitle("");
            await loadEvents();
        } catch (e: any) {
            setErrorMsg(e.message);
        } finally {
            setLoading(false);
        }
    }

    // Calendar Data Helpers
    const monthData = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days = [];
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = firstDay - 1; i >= 0; i--) days.push({ day: prevMonthLastDay - i, month: month - 1, year, current: false });
        for (let i = 1; i <= daysInMonth; i++) days.push({ day: i, month, year, current: true });
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) days.push({ day: i, month: month + 1, year, current: false });
        return days;
    }, [viewDate]);

    const weekData = useMemo(() => {
        const d = new Date(viewDate);
        const day = d.getDay();
        const diff = d.getDate() - day; // Adjust to Sunday
        const sunday = new Date(d.setDate(diff));
        
        const days = [];
        for (let i = 0; i < 7; i++) {
            const temp = new Date(sunday);
            temp.setDate(sunday.getDate() + i);
            days.push({ day: temp.getDate(), month: temp.getMonth(), year: temp.getFullYear(), current: true });
        }
        return days;
    }, [viewDate]);

    const navigate = (offset: number) => {
        const next = new Date(viewDate);
        if (viewMode === 'month') next.setMonth(next.getMonth() + offset);
        else if (viewMode === 'week') next.setDate(next.getDate() + (offset * 7));
        else if (viewMode === 'day') next.setDate(next.getDate() + offset);
        setViewDate(next);
    };

    const handleDayClick = (d: { day: number, month: number, year: number }) => {
        if (viewMode === 'month') {
            const selectedDate = new Date(d.year, d.month, d.day);
            setViewDate(selectedDate);
            setViewMode('day');
        }
    };

    const handleEventClick = (e: React.MouseEvent, ev: Event) => {
        e.stopPropagation();
        setSelectedEvent(ev);
    };

    const fmtTitle = () => {
        if (viewMode === 'month') return `${viewDate.getFullYear()}년 ${viewDate.getMonth() + 1}월`;
        if (viewMode === 'day') return `${viewDate.getFullYear()}년 ${viewDate.getMonth() + 1}월 ${viewDate.getDate()}일`;
        // Week range
        const start = weekData[0];
        const end = weekData[6];
        return `${start.month + 1}/${start.day} ~ ${end.month + 1}/${end.day}`;
    };

    return (
        <div style={container}>
            {/* Header */}
            <div style={{ ...header, flexWrap: 'wrap', gap: '1rem' }} className="page-header">
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        {viewMode !== 'month' && (
                            <button 
                                onClick={() => setViewMode('month')} 
                                style={backBtnStyle}
                            >
                                <ArrowLeft size={16} /> 월간 보기
                            </button>
                        )}
                        <h2 style={{ ...title, fontSize: 'clamp(1.2rem, 5vw, 1.75rem)', margin: 0 }}>{fmtTitle()}</h2>
                    </div>
                    <p style={subtitle}>코치님의 전체 스케줄을 확인하고 관리하세요.</p>
                    <p style={{ ...subtitle, color: 'var(--color-coach)', fontWeight: 800, marginTop: '6px', fontSize: '0.82rem', lineHeight: 1.6 }}>
                        💡 <b>매칭 방식 안내:</b> 학생이 시간을 제안하면 코치님이 수락하는 방식입니다. <br/>
                        <b>수업이 불가능한 시간</b>을 미리 '일정 추가'로 등록해두면, 들어오는 요청과 겹치는지 쉽게 판단할 수 있습니다.
                    </p>
                </div>
                <div style={{ ...headerActions, flexWrap: 'wrap' }}>
                    <div style={viewTabs}>
                        <button onClick={() => setViewMode('month')} style={viewMode === 'month' ? tabOn : tabOff}>월</button>
                        <button onClick={() => setViewMode('week')} style={viewMode === 'week' ? tabOn : tabOff}>주</button>
                        <button onClick={() => setViewMode('day')} style={viewMode === 'day' ? tabOn : tabOff}>일</button>
                    </div>
                    <button onClick={() => setShowRulesModal(true)} style={{ ...addBtn, background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <Clock size={18} style={{ marginRight: 8 }} /> {t('dashboard.booking')} 규칙 설정
                    </button>
                    <button onClick={() => setShowModal(true)} style={addBtn}>
                        <Plus size={18} style={{ marginRight: 8 }} /> 일정 추가
                    </button>
                </div>
            </div>

            {/* Recurring Rules Modal */}
            {showRulesModal && (
                <div style={modalOverlay}>
                    <div style={{ ...modalBody, maxWidth: '600px' }} className="card-premium glass-morphism">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 900 }}>매주 반복 일정 관리</h3>
                                <p style={{ fontSize: '0.85rem', opacity: 0.5, marginTop: '4px' }}>요일별로 반복되는 고정 수업 가능 또는 불가 시간을 설정하세요.</p>
                            </div>
                            <button onClick={() => setShowRulesModal(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X/></button>
                        </div>

                        {/* Add New Rule Form */}
                        <div style={{ display: 'grid', gap: '15px', background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                                <button 
                                    onClick={() => setRuleType('slot')}
                                    style={{ 
                                        flex: 1, padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 900,
                                        background: ruleType === 'slot' ? 'var(--color-coach)' : 'rgba(255,255,255,0.05)',
                                        color: ruleType === 'slot' ? 'white' : 'rgba(255,255,255,0.3)'
                                    }}
                                >수업 가능</button>
                                <button 
                                    onClick={() => setRuleType('personal')}
                                    style={{ 
                                        flex: 1, padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 900,
                                        background: ruleType === 'personal' ? '#8b5cf6' : 'rgba(255,255,255,0.05)',
                                        color: ruleType === 'personal' ? 'white' : 'rgba(255,255,255,0.3)'
                                    }}
                                >개인 일정</button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '10px' }}>
                                <select value={ruleDay} onChange={e => setRuleDay(parseInt(e.target.value))} style={input}>
                                    {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => <option key={i} value={i}>{d}요일</option>)}
                                </select>
                                <input type="time" value={ruleStart} onChange={e => setRuleStart(e.target.value)} style={input} />
                                <input type="time" value={ruleEnd} onChange={e => setRuleEnd(e.target.value)} style={input} />
                            </div>
                            <button onClick={handleAddRule} style={{ ...saveBtn, marginTop: 0, background: ruleType === 'slot' ? 'var(--color-coach)' : '#8b5cf6', color: 'white' }}>
                                규칙 추가하기
                            </button>
                        </div>

                        {/* Rules List */}
                        <div style={{ maxHeight: '25vh', overflowY: 'auto', marginBottom: '24px' }}>
                            <label style={{ ...label, marginBottom: '12px' }}>현재 설정된 규칙</label>
                            {rules.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '30px', opacity: 0.3, fontSize: '0.9rem' }}>등록된 반복 규칙이 없습니다.</div>
                            ) : (
                                <div style={{ display: 'grid', gap: '10px' }}>
                                    {rules.map(r => (
                                        <div key={r.id} style={{ 
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                                            padding: '12px 18px', background: 'rgba(255,255,255,0.03)', borderRadius: '14px',
                                            borderLeft: `4px solid ${r.type === 'personal' ? '#8b5cf6' : 'var(--color-coach)'}`
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ color: r.type === 'personal' ? '#8b5cf6' : 'var(--color-coach)', background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '8px' }}>
                                                    {r.type === 'personal' ? <X size={14} /> : <Check size={14} />}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 900, fontSize: '1rem' }}>
                                                        {['일', '월', '화', '수', '목', '금', '토'][r.day_of_week]}요일 {r.start_time} ~ {r.end_time}
                                                    </div>
                                                    <div style={{ fontSize: '0.7rem', opacity: 0.3, marginTop: '2px', fontWeight: 700 }}>
                                                        {r.type === 'personal' ? '개인 일정 (수업 불가)' : '수업 가능 시간'}
                                                    </div>
                                                </div>
                                            </div>
                                            <button onClick={() => handleDeleteRule(r.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}><Trash2 size={16} /></button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '24px', textAlign: 'center' }}>
                            <button onClick={generateSlotsFromRules} disabled={loading} style={{ ...saveBtn, background: 'white', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                {loading ? '생성 중...' : <><Zap size={18} /> 설정된 규칙으로 4주치 일정 일괄 생성</>}
                            </button>
                            <p style={{ fontSize: '0.75rem', opacity: 0.4, marginTop: '12px' }}>일괄 생성 시 기존 일정과 겹치지 않게 주의해 주세요.</p>
                        </div>
                    </div>
                </div>
            )}

            {msg && (
                <div style={{ padding: '16px 24px', background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', borderRadius: '16px', marginBottom: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                    <span>✅ {msg}</span>
                    <X size={16} onClick={() => setMsg("")} style={{ cursor: 'pointer' }} />
                </div>
            )}

            {/* Navigation */}
            <div style={navBar}>
                <div style={navGroup}>
                    <button onClick={() => setViewDate(new Date())} style={navBtn}>오늘</button>
                    <button onClick={() => navigate(-1)} style={navIconBtn}><ChevronLeft size={20}/></button>
                    <button onClick={() => navigate(1)} style={navIconBtn}><ChevronRight size={20}/></button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div style={gridContainer} className="card-premium">
                <div style={weekHeader}>
                    {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
                        <div key={d} style={{ ...weekDay, display: viewMode === 'day' && i !== viewDate.getDay() ? 'none' : 'block' }}>{d}</div>
                    ))}
                </div>
                <div style={{ ...daysGrid, gridTemplateColumns: viewMode === 'day' ? '1fr' : 'repeat(7, 1fr)', gridAutoRows: viewMode === 'month' ? 'minmax(80px, auto)' : 'minmax(400px, auto)' }}>
                    {(viewMode === 'month' ? monthData : viewMode === 'week' ? weekData : [{ day: viewDate.getDate(), month: viewDate.getMonth(), year: viewDate.getFullYear(), current: true }]).map((d, i) => {
                        const dayEvents = events.filter(e => 
                            e.start.getDate() === d.day && 
                            e.start.getMonth() === d.month && 
                            e.start.getFullYear() === d.year
                        );

                        if (viewMode === 'day') {
                            // Render 24-hour timeline for Day View
                            const hours = Array.from({ length: 24 }, (_, i) => i);
                            return (
                                <div key={i} style={{ ...dayTimelineContainer, minHeight: '1200px' }}>
                                    {hours.map(h => (
                                        <div key={h} style={timelineRow}>
                                            <div style={timeLabel}>{h === 12 ? '정오' : (h < 12 ? `오전 ${h}시` : `오후 ${h - 12}시`)}</div>
                                            <div style={timeGridLine} />
                                        </div>
                                    ))}
                                    
                                    {/* Availability Slots (Background Layer) */}
                                    {dayEvents.filter(ev => ev.type === 'slot').map(ev => {
                                        const startMin = ev.start.getHours() * 60 + ev.start.getMinutes();
                                        const duration = (ev.end.getTime() - ev.start.getTime()) / (1000 * 60);
                                        return (
                                            <div key={ev.id} style={{
                                                position: 'absolute',
                                                left: '80px',
                                                right: '10px',
                                                top: `${startMin * (60/60)}px`,
                                                height: `${duration * (60/60)}px`,
                                                background: 'rgba(59, 130, 246, 0.15)',
                                                borderLeft: '4px solid var(--color-coach)',
                                                borderRadius: '4px',
                                                zIndex: 1,
                                                padding: '8px',
                                                fontSize: '0.75rem',
                                                color: 'var(--color-coach)',
                                                fontWeight: 800
                                            }}>
                                                수업 가능 시간
                                            </div>
                                        );
                                    })}

                                    {/* Real Events (Top Layer) */}
                                    {dayEvents.filter(ev => ev.type !== 'slot').map(ev => {
                                        const startMin = ev.start.getHours() * 60 + ev.start.getMinutes();
                                        const duration = (ev.end.getTime() - ev.start.getTime()) / (1000 * 60);
                                        return (
                                            <div key={ev.id} 
                                                onClick={(e) => handleEventClick(e, ev)}
                                                style={{
                                                    position: 'absolute',
                                                    left: '100px',
                                                    right: '20px',
                                                    top: `${startMin * (60/60)}px`,
                                                    height: `${Math.max(40, duration * (60/60))}px`,
                                                    background: ev.type === 'class' ? 'rgba(59, 130, 246, 0.95)' : 'rgba(139, 92, 246, 0.95)',
                                                    borderRadius: '12px',
                                                    zIndex: 5,
                                                    padding: '12px',
                                                    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                                                    color: 'white',
                                                    border: '1px solid rgba(255,255,255,0.2)',
                                                    cursor: 'pointer'
                                                }}>
                                                <div style={{ fontWeight: 900, fontSize: '0.9rem', marginBottom: '4px' }}>{ev.title}</div>
                                                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                                                    {ev.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ~ {ev.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        }

                        return (
                            <div 
                                key={i} 
                                onClick={() => handleDayClick(d)}
                                style={{ 
                                    ...dayCell, 
                                    opacity: d.current ? 1 : 0.3, 
                                    background: viewMode !== 'month' ? 'rgba(255,255,255,0.01)' : 'transparent',
                                    cursor: viewMode === 'month' ? 'pointer' : 'default',
                                    minHeight: viewMode === 'month' ? '100px' : '400px'
                                }}
                                className={viewMode === 'month' ? "hover-bright" : ""}
                            >
                                <div style={dayNumber}>{d.day}</div>
                                <div style={eventsList}>
                                    {dayEvents
                                        .sort((a, b) => {
                                            const priority: Record<string, number> = { class: 1, personal: 2, slot: 3 };
                                            return (priority[a.type] || 99) - (priority[b.type] || 99);
                                        })
                                        .map(ev => {
                                            const isSlot = ev.type === 'slot';
                                            const slotStyle: React.CSSProperties = {
                                                background: 'rgba(59, 130, 246, 0.05)',
                                                border: '1px dashed rgba(59, 130, 246, 0.3)',
                                                color: 'rgba(96, 165, 250, 0.6)',
                                                fontSize: '0.7rem',
                                                padding: '2px 6px',
                                                borderRadius: '4px'
                                            };
                                            const solidStyle: React.CSSProperties = {
                                                padding: viewMode === 'month' ? '4px 8px' : '10px 12px',
                                                fontSize: viewMode === 'month' ? '0.75rem' : '0.85rem',
                                                background: ev.type === 'class' ? 'rgba(59, 130, 246, 0.9)' : 'rgba(139, 92, 246, 0.85)',
                                                color: 'white',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                                borderLeft: `4px solid ${ev.type === 'class' ? '#ffffff' : '#fbcfe8'}`,
                                            };

                                            return (
                                                <div 
                                                    key={ev.id} 
                                                    onClick={(e) => handleEventClick(e, ev)}
                                                    style={{ 
                                                        ...eventChip, 
                                                        ...(isSlot ? slotStyle : solidStyle),
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <div style={{ fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {isSlot ? `🕒 ${ev.start.getHours()}:${String(ev.start.getMinutes()).padStart(2, '0')} 가능` : ev.title}
                                                    </div>
                                                    {viewMode !== 'month' && (
                                                        <div style={{ fontSize: '0.7rem', opacity: isSlot ? 0.5 : 0.8, marginTop: '2px', fontWeight: 700 }}>
                                                            {ev.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ~ {ev.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Event Detail / Delete Modal */}
            {selectedEvent && (
                <div style={modalOverlay}>
                    <div style={{ ...modalBody, maxWidth: '400px' }} className="card-premium glass-morphism">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 900 }}>일정 상세 정보</h3>
                            <button onClick={() => setSelectedEvent(null)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X/></button>
                        </div>

                        <div style={{ display: 'grid', gap: '20px' }}>
                            <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 800, marginBottom: '6px', textTransform: 'uppercase' }}>일정명</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'white' }}>{selectedEvent.title}</div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div style={{ padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)' }}>
                                    <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 800, marginBottom: '4px' }}>시작</div>
                                    <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{selectedEvent.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                </div>
                                <div style={{ padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)' }}>
                                    <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 800, marginBottom: '4px' }}>종료</div>
                                    <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{selectedEvent.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                </div>
                            </div>

                            {selectedEvent.type !== 'class' && (
                                <button 
                                    onClick={() => handleDeleteEvent(selectedEvent.id, selectedEvent.type)} 
                                    disabled={loading}
                                    style={{ ...saveBtn, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', marginTop: '10px' }}
                                >
                                    {loading ? '삭제 중...' : <><Trash2 size={18} style={{ marginRight: 8 }} /> 일정 삭제하기</>}
                                </button>
                            )}

                            {selectedEvent.type === 'class' && (
                                <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', fontSize: '0.8rem', fontWeight: 700, textAlign: 'center', lineHeight: 1.5 }}>
                                    예약된 수업은 학생과 협의 후 <br/> 수업 관리 메뉴에서 처리해 주세요.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Add Event Modal */}
            {showModal && (
                <div style={modalOverlay}>
                    <div style={modalBody} className="card-premium glass-morphism">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 900 }}>일정 추가</h3>
                            <button onClick={() => { setShowModal(false); setErrorMsg(""); }} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X/></button>
                        </div>

                        {errorMsg && (
                            <div style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '0.85rem', marginBottom: '1.5rem', fontWeight: 700, lineHeight: 1.5 }}>
                                ⚠️ {errorMsg}
                            </div>
                        )}
                        
                        <div style={{ display: 'grid', gap: '1.5rem' }}>
                            <div>
                                <label style={label}>일정 제목</label>
                                <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="예: 개인 훈련, 센터 미팅..." style={input} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }} className="mobile-stack">
                                <div>
                                    <label style={label}>날짜</label>
                                    <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} style={input} />
                                </div>
                                <div>
                                    <label style={label}>유형</label>
                                    <select value={newType} onChange={e => setNewType(e.target.value as any)} style={input}>
                                        <option value="personal">🔒 개인 일정 (수업 불가)</option>
                                        <option value="slot">🟢 레슨 가능 슬롯</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="mobile-stack">
                                <div>
                                    <label style={label}>시작 시간</label>
                                    <input type="time" value={newStartTime} onChange={e => setNewStartTime(e.target.value)} style={input} />
                                </div>
                                <div>
                                    <label style={label}>종료 시간</label>
                                    <input type="time" value={newEndTime} onChange={e => setNewEndTime(e.target.value)} style={input} />
                                </div>
                            </div>
                            <button onClick={handleAddEvent} disabled={loading} style={saveBtn}>{loading ? '저장 중...' : '저장하기'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Styles
const container: React.CSSProperties = { color: 'white', padding: '1rem' };
const header: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' };
const title: React.CSSProperties = { fontSize: '1.75rem', fontWeight: 950, marginBottom: '0.5rem' };
const subtitle: React.CSSProperties = { color: 'rgba(255,255,255,0.5)', fontSize: '0.95rem' };
const headerActions: React.CSSProperties = { display: 'flex', gap: '1rem', alignItems: 'center' };
const addBtn: React.CSSProperties = { background: 'var(--color-primary)', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '12px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center' };
const viewTabs: React.CSSProperties = { display: 'flex', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '10px' };
const tabOn: React.CSSProperties = { padding: '6px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer' };
const tabOff: React.CSSProperties = { padding: '6px 16px', borderRadius: '8px', background: 'transparent', color: 'rgba(255,255,255,0.4)', border: 'none', fontWeight: 700, cursor: 'pointer' };

const navBar: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' };
const navGroup: React.CSSProperties = { display: 'flex', gap: '8px', alignItems: 'center' };
const navBtn: React.CSSProperties = { padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', fontWeight: 700, cursor: 'pointer' };
const navIconBtn: React.CSSProperties = { width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', cursor: 'pointer' };

const gridContainer: React.CSSProperties = { borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', overflow: 'hidden' };
const weekHeader: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)' };
const weekDay: React.CSSProperties = { padding: '8px 4px', textAlign: 'center', fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' };
const daysGrid: React.CSSProperties = { display: 'grid', transition: 'all 0.3s ease' };
const dayCell: React.CSSProperties = { borderRight: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '8px 4px', transition: 'all 0.2s' };
const dayNumber: React.CSSProperties = { fontSize: '0.75rem', fontWeight: 800, marginBottom: '4px', opacity: 0.6 };
const eventsList: React.CSSProperties = { display: 'grid', gap: '4px' };
const eventChip: React.CSSProperties = { borderRadius: '6px', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };

const modalOverlay: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalBody: React.CSSProperties = { width: '90%', maxWidth: '500px', background: '#111827', padding: '2.5rem', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.1)' };
const label: React.CSSProperties = { display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '8px' };
const input: React.CSSProperties = { 
    width: '100%', 
    padding: '14px', 
    borderRadius: '12px', 
    background: '#1f2937', // Solid dark background to override browser defaults
    border: '1px solid rgba(255,255,255,0.1)', 
    color: 'white', 
    boxSizing: 'border-box',
    outline: 'none',
    appearance: 'none', // Remove default arrow for custom look if needed, but keeping for now for usability
    WebkitAppearance: 'none',
    backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FFFFFF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 14px top 50%',
    backgroundSize: '12px auto'
};
const saveBtn: React.CSSProperties = { width: '100%', padding: '16px', borderRadius: '16px', background: 'white', color: 'black', border: 'none', fontWeight: 950, fontSize: '1rem', cursor: 'pointer', marginTop: '1rem' };
const backBtnStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' };

// Timeline Styles
const dayTimelineContainer: React.CSSProperties = { position: 'relative', width: '100%', background: 'rgba(255,255,255,0.01)', borderRadius: '24px', overflow: 'hidden' };
const timelineRow: React.CSSProperties = { display: 'flex', alignItems: 'flex-start', height: '60px', borderBottom: '1px solid rgba(255,255,255,0.03)' };
const timeLabel: React.CSSProperties = { width: '80px', fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center', fontWeight: 800, paddingTop: '4px' };
const timeGridLine: React.CSSProperties = { flex: 1, height: '1px' };
