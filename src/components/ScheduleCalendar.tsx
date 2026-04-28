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
    const [ruleDay, setRuleDay] = useState(1); // Mon defaults
    const [ruleStart, setRuleStart] = useState("18:00");
    const [ruleEnd, setRuleEnd] = useState("19:00");

    // Form states
    const [newTitle, setNewTitle] = useState("");
    const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
    const [newStartTime, setNewStartTime] = useState("09:00");
    const [newEndTime, setNewEndTime] = useState("10:00");
    const [newType, setNewType] = useState<'class' | 'personal'>('personal');

    useEffect(() => {
        loadEvents();
        if (showRulesModal) loadRules();
    }, [viewDate, showRulesModal]);

    async function loadRules() {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const { data } = await supabase.from('coach_slot_rules').select('*').eq('coach_id', session.user.id);
        setRules(data || []);
    }

    async function handleAddRule() {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { error } = await supabase.from('coach_slot_rules').insert({
                coach_id: session.user.id,
                day_of_week: ruleDay,
                start_time: ruleStart,
                end_time: ruleEnd
            });

            if (error) throw error;
            setMsg("반복 규칙이 추가되었습니다.");
            loadRules();
        } catch (e: any) {
            setErrorMsg(e.message);
        }
    }

    async function handleDeleteRule(id: string) {
        const { error } = await supabase.from('coach_slot_rules').delete().eq('id', id);
        if (!error) loadRules();
    }

    async function generateSlotsFromRules() {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            // Generate for next 4 weeks
            const newSlots: any[] = [];
            const now = new Date();
            
            for (let i = 0; i < 28; i++) {
                const targetDate = new Date();
                targetDate.setDate(now.getDate() + i);
                const dayOfWeek = targetDate.getDay();

                const matchedRules = rules.filter(r => r.day_of_week === dayOfWeek);
                matchedRules.forEach(r => {
                    const startAt = new Date(targetDate.toISOString().split('T')[0] + 'T' + r.start_time);
                    const endAt = new Date(targetDate.toISOString().split('T')[0] + 'T' + r.end_time);

                    newSlots.push({
                        coach_id: session.user.id,
                        title: "반복 일정 (레슨 가능)",
                        start_at: startAt.toISOString(),
                        end_at: endAt.toISOString(),
                        type: 'slot',
                        is_booked: false,
                        status: 'open'
                    });
                });
            }

            if (newSlots.length > 0) {
                const { error } = await supabase.from('coach_slots').insert(newSlots);
                if (error) throw error;
                setMsg(`${newSlots.length}개의 슬롯이 자동 생성되었습니다.`);
                loadEvents();
                setShowRulesModal(false);
            } else {
                setMsg("생성할 규칙이 없습니다.");
            }
        } catch (e: any) {
            setErrorMsg(e.message);
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
            // Explicitly selecting columns to avoid issues with missing 'role' column
            const { data: slots } = await supabase
                .from('coach_slots')
                .select('id, coach_id, title, start_at, end_at, type, is_booked')
                .eq('coach_id', session.user.id);
            
            // 2. Fetch Accepted Requests (Classes)
            const { data: reqs } = await supabase.from('class_requests')
                .select('*')
                .eq('coach_id', session.user.id)
                .eq('status', 'accepted');

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

    async function handleAddEvent() {
        if (!newTitle) return setErrorMsg("일정 제목을 입력해주세요.");
        
        const startAt = new Date(`${newDate}T${newStartTime}:00`);
        const endAt = new Date(`${newDate}T${newEndTime}:00`);

        if (endAt <= startAt) {
            return setErrorMsg("종료 시간은 시작 시간보다 늦어야 합니다.");
        }

        setLoading(true);
        setErrorMsg(""); // Clear previous errors
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const payload: any = {
                coach_id: session.user.id,
                title: newTitle,
                start_at: startAt.toISOString(),
                end_at: endAt.toISOString(),
                type: newType,
                is_booked: false,
                status: 'open'
            };

            const { error } = await supabase.from('coach_slots').insert(payload);

            if (error) {
                console.error("Supabase Error:", error);
                // If it fails again, let's show the full error for precise debugging
                throw new Error(`${error.message} (코드: ${error.code})`);
            }

            setMsg("성공적으로 일정이 등록되었습니다.");
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
                                <p style={{ fontSize: '0.85rem', opacity: 0.5, marginTop: '4px' }}>요일별로 반복되는 고정 수업 가능 시간을 설정하세요.</p>
                            </div>
                            <button onClick={() => setShowRulesModal(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X/></button>
                        </div>

                        {/* Add New Rule Form */}
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '16px', marginBottom: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 80px', gap: '12px', alignItems: 'flex-end' }}>
                                <div>
                                    <label style={label}>요일</label>
                                    <select value={ruleDay} onChange={e => setRuleDay(parseInt(e.target.value))} style={input}>
                                        {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => <option key={i} value={i}>{d}요일</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={label}>시작</label>
                                    <input type="time" value={ruleStart} onChange={e => setRuleStart(e.target.value)} style={input} />
                                </div>
                                <div>
                                    <label style={label}>종료</label>
                                    <input type="time" value={ruleEnd} onChange={e => setRuleEnd(e.target.value)} style={input} />
                                </div>
                                <button onClick={handleAddRule} style={{ ...saveBtn, marginTop: 0, padding: '12px' }}>추가</button>
                            </div>
                        </div>

                        {/* Rules List */}
                        <div style={{ maxHeight: '30vh', overflowY: 'auto', marginBottom: '24px' }}>
                            <label style={{ ...label, marginBottom: '12px' }}>현재 설정된 규칙</label>
                            {rules.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '30px', opacity: 0.3, fontSize: '0.9rem' }}>등록된 반복 규칙이 없습니다.</div>
                            ) : (
                                <div style={{ display: 'grid', gap: '8px' }}>
                                    {rules.map(r => (
                                        <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                                            <div style={{ fontWeight: 700 }}>
                                                <span style={{ color: 'var(--color-primary)', marginRight: '8px' }}>{['일', '월', '화', '수', '목', '금', '토'][r.day_of_week]}요일</span>
                                                {r.start_time} ~ {r.end_time}
                                            </div>
                                            <button onClick={() => handleDeleteRule(r.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}><Trash2 size={16} /></button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '24px', textAlign: 'center' }}>
                            <button onClick={generateSlotsFromRules} disabled={loading} style={{ ...saveBtn, background: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                {loading ? '생성 중...' : <><Zap size={18} /> 설정된 규칙으로 4주치 슬롯 자동 생성</>}
                            </button>
                            <p style={{ fontSize: '0.75rem', opacity: 0.4, marginTop: '12px' }}>기존 슬롯과 겹치는 경우 중복 생성될 수 있습니다.</p>
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

                        return (
                            <div 
                                key={i} 
                                onClick={() => handleDayClick(d)}
                                style={{ 
                                    ...dayCell, 
                                    opacity: d.current ? 1 : 0.3, 
                                    background: viewMode !== 'month' ? 'rgba(255,255,255,0.01)' : 'transparent',
                                    cursor: viewMode === 'month' ? 'pointer' : 'default'
                                }}
                                className={viewMode === 'month' ? "hover-bright" : ""}
                            >
                                <div style={dayNumber}>{d.day}</div>
                                <div style={eventsList}>
                                    {dayEvents.map(ev => (
                                        <div key={ev.id} style={{ 
                                            ...eventChip, 
                                            padding: viewMode === 'month' ? '4px 8px' : '10px 12px',
                                            fontSize: viewMode === 'month' ? '0.75rem' : '0.85rem',
                                            background: ev.type === 'class' ? 'rgba(59, 130, 246, 0.2)' : ev.type === 'personal' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.05)',
                                            color: ev.type === 'class' ? '#60a5fa' : ev.type === 'personal' ? '#a78bfa' : 'white',
                                            borderLeft: `4px solid ${ev.type === 'class' ? '#3b82f6' : ev.type === 'personal' ? '#8b5cf6' : 'rgba(255,255,255,0.2)'}`,
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                        }}>
                                            <div style={{ fontWeight: 800 }}>{ev.title}</div>
                                            {viewMode !== 'month' && (
                                                <div style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: '4px' }}>
                                                    {ev.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ~ {ev.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Modal */}
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
                            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }} className="mobile-only-grid">
                                <div>
                                    <label style={label}>날짜</label>
                                    <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} style={input} />
                                </div>
                                <div>
                                    <label style={label}>유형</label>
                                    <select value={newType} onChange={e => setNewType(e.target.value as any)} style={input}>
                                        <option value="personal">개인 일정</option>
                                        <option value="class">레슨 가능 슬롯</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="mobile-only-grid">
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
const input: React.CSSProperties = { width: '100%', padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', boxSizing: 'border-box' };
const saveBtn: React.CSSProperties = { width: '100%', padding: '16px', borderRadius: '16px', background: 'white', color: 'black', border: 'none', fontWeight: 950, fontSize: '1rem', cursor: 'pointer', marginTop: '1rem' };
const backBtnStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' };
