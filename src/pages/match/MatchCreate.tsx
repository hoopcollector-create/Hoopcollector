import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { COUNTRIES, getCountryByCode } from '../../constants/countries';
import { 
    Clock, Calendar, MapPin, Users, Award, 
    ArrowLeft, ChevronRight, Check, Info,
    Zap, Repeat, DollarSign, PenTool
} from 'lucide-react';
import { NaverMapSelector } from '../../components/NaverMapSelector';

export const MatchCreate: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [isRecurring, setIsRecurring] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form Stats
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        match_type: '5대5',
        required_grade: 'all',
        max_players: 12,
        place_name: '',
        address: '',
        road_address: '',
        latitude: 0,
        longitude: 0,
        fee_type: 'free',
        fee_amount: 0,
        supplies: '',
        notice: '',
        country_code: 'KR',
        timezone: 'Asia/Seoul',
        // Recurring specific
        recurrence_type: 'weekly',
        recurrence_days: [] as string[],
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        start_time: '19:00',
        end_time: '21:00',
        // One-time specific
        single_date: new Date().toISOString().split('T')[0],
        age_group: 'all' // 'adult', 'youth', 'all'
    });

    const updateForm = (key: string, value: any) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const toggleDay = (day: string) => {
        const days = [...formData.recurrence_days];
        if (days.includes(day)) {
            updateForm('recurrence_days', days.filter(d => d !== day));
        } else {
            updateForm('recurrence_days', [...days, day]);
        }
    };

    const handleSubmit = async () => {
        if (!formData.title || !formData.place_name) return alert('필수 정보를 모두 입력해주세요.');
        setLoading(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('로그인이 필요합니다.');

            // Check certification for youth matches
            if (formData.age_group === 'youth') {
                const { data: prof } = await supabase.from('profiles').select('is_certified_host').eq('id', session.user.id).single();
                if (!prof?.is_certified_host) {
                    throw new Error('유소년 전용 매치는 훕콜렉터의 인증을 받은 호스트만 개설할 수 있습니다. 고객센터로 인증 요청을 해주세요.');
                }
            }

            if (isRecurring) {
                // Create Template & Generate Occurrences (via internal logic or direct insert for now)
                const { data: template, error: tError } = await supabase.from('match_templates').insert({
                    host_id: session.user.id,
                    title: formData.title,
                    description: formData.description,
                    match_type: formData.match_type,
                    required_grade: formData.required_grade,
                    max_players: formData.max_players,
                    place_name: formData.place_name,
                    address: formData.address,
                    road_address: formData.road_address,
                    latitude: formData.latitude,
                    longitude: formData.longitude,
                    fee_type: formData.fee_type,
                    fee_amount: formData.fee_amount,
                    supplies: formData.supplies,
                    notice: formData.notice,
                    recurrence_type: formData.recurrence_type,
                    recurrence_days: formData.recurrence_days,
                    start_date: formData.start_date,
                    end_date: formData.end_date || null,
                    start_time: formData.start_time,
                    end_time: formData.end_time,
                    age_group: formData.age_group
                }).select().single();

                if (tError) throw tError;

                // After template, trigger a call to generate initial occurrences
                // In production, you'd use rpc('generate_match_occurrences')
                await supabase.rpc('generate_match_occurrences');
                
                alert('반복 모임이 성공적으로 생성되었습니다!');
                navigate('/match');
            } else {
                // Create Single Match Room
                const [y, m, d] = formData.single_date.split('-').map(Number);
                const [sh, sm] = formData.start_time.split(':').map(Number);
                const [eh, em] = formData.end_time.split(':').map(Number);
                
                const startAt = new Date(y, m - 1, d, sh, sm);
                const endAt = new Date(y, m - 1, d, eh, em);

                const { data: room, error: rError } = await supabase.from('match_rooms').insert({
                    host_id: session.user.id,
                    title: formData.title,
                    description: formData.description,
                    match_type: formData.match_type,
                    required_grade: formData.required_grade,
                    max_players: formData.max_players,
                    start_at: startAt.toISOString(),
                    end_at: endAt.toISOString(),
                    occurrence_date: formData.single_date,
                    place_name: formData.place_name,
                    address: formData.address,
                    road_address: formData.road_address,
                    latitude: formData.latitude,
                    longitude: formData.longitude,
                    fee_type: formData.fee_type,
                    fee_amount: formData.fee_amount,
                    supplies: formData.supplies,
                    notice: formData.notice,
                    timezone: formData.timezone,
                    country_code: formData.country_code,
                    is_recurring: false,
                    age_group: formData.age_group
                }).select().single();

                if (rError) throw rError;

                alert('모임이 등록되었습니다!');
                navigate(`/match/room/${room.id}`);
            }
        } catch (e: any) {
            alert('오류가 발생했습니다: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={container}>
            {/* Top Navigation */}
            <div style={navHeader}>
                <button onClick={() => navigate(-1)} style={backBtn}><ArrowLeft size={20}/></button>
                <div style={stepIndicator}>STEP {step} / 3</div>
            </div>

            {step === 1 && (
                <div style={stepContent}>
                    <h2 style={stepTitle}>어떤 모임을 만드시나요?</h2>
                    <p style={stepSubtitle}>지속적인 정기전인지, 일회성 번개인지 선택해주세요.</p>
                    <div style={typeGrid}>
                        <div 
                            style={isRecurring ? typeCardInactive : typeCardActive} 
                            onClick={() => { setIsRecurring(false); setStep(2); }}
                        >
                            <Zap size={32} style={{ marginBottom: 12, color: 'var(--accent-primary)' }} />
                            <h3 style={cardHead}>일회성 모임</h3>
                            <p style={cardDesc}>오늘 하루만 가볍게 즐기는 번개 게임입니다.</p>
                        </div>
                        <div 
                            style={isRecurring ? typeCardActive : typeCardInactive} 
                            onClick={() => { setIsRecurring(true); setStep(2); }}
                        >
                            <Repeat size={32} style={{ marginBottom: 12, color: '#8b5cf6' }} />
                            <h3 style={cardHead}>정기/반복 모임</h3>
                            <p style={cardDesc}>매주 또는 격주로 계속 열리는 모임입니다.</p>
                        </div>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div style={stepContent}>
                    <h2 style={stepTitle}>기본 정보를 입력해주세요</h2>
                    <div style={formBox}>
                        <div style={formGroup}>
                            <label style={labelStyle}>모임 제목</label>
                            <input 
                                placeholder="예: 안양 실내 5대5 번개" 
                                value={formData.title}
                                onChange={e => updateForm('title', e.target.value)}
                                style={inputStyle}
                            />
                        </div>
                        <div style={formRow}>
                            <div style={formGroup}>
                                <label style={labelStyle}>종류</label>
                                <select value={formData.match_type} onChange={e => updateForm('match_type', e.target.value)} style={inputStyle}>
                                    <option>5대5</option>
                                    <option>3대3</option>
                                    <option>자유게임</option>
                                    <option>개인연습</option>
                                </select>
                            </div>
                            <div style={formGroup}>
                                <label style={labelStyle}>국가 선택 (시간대 자동 설정)</label>
                                <select 
                                    value={formData.country_code} 
                                    onChange={e => {
                                        const c = getCountryByCode(e.target.value);
                                        updateForm('country_code', c.code);
                                        updateForm('timezone', c.timezone);
                                    }} 
                                    style={inputStyle}
                                >
                                    {COUNTRIES.map(c => (
                                        <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={formGroup}>
                                <label style={labelStyle}>요구 등급</label>
                                <select value={formData.required_grade} onChange={e => updateForm('required_grade', e.target.value)} style={inputStyle}>
                                    <option value="all">전체 가능</option>
                                    <option value="C">C 이상</option>
                                    <option value="B">B 이상</option>
                                    <option value="A">A 이상</option>
                                </select>
                            </div>
                            <div style={formGroup}>
                                <label style={labelStyle}>연령대</label>
                                <select value={formData.age_group} onChange={e => updateForm('age_group', e.target.value)} style={inputStyle}>
                                    <option value="all">연령 무관 (전체)</option>
                                    <option value="youth">유소년 전용 (만 19세 미만)</option>
                                    <option value="20s">20대 전용 (20~29세)</option>
                                    <option value="30s">30대 전용 (30~39세)</option>
                                    <option value="40s">40대 이상 (40세~)</option>
                                </select>
                            </div>
                        </div>
                        <div style={formRow}>
                            <div style={formGroup}>
                                <label style={labelStyle}>최대 인원</label>
                                <input 
                                    type="number" 
                                    value={formData.max_players} 
                                    onChange={e => updateForm('max_players', parseInt(e.target.value))}
                                    style={inputStyle} 
                                />
                            </div>
                            <div style={formGroup}>
                                <label style={labelStyle}>참가비</label>
                                <input 
                                    type="number" 
                                    placeholder="무료는 0 입력"
                                    value={formData.fee_amount} 
                                    onChange={e => updateForm('fee_amount', parseInt(e.target.value))}
                                    style={inputStyle} 
                                />
                            </div>
                        </div>
                        {!isRecurring ? (
                            <div style={formGroup}>
                                <label style={labelStyle}>날짜 선택</label>
                                <input type="date" value={formData.single_date} onChange={e => updateForm('single_date', e.target.value)} style={inputStyle} />
                            </div>
                        ) : (
                            <div style={formGroup}>
                                <label style={labelStyle}>반복 요일</label>
                                <div style={dayRow}>
                                    {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
                                        <button 
                                            key={i} 
                                            onClick={() => toggleDay(i.toString())}
                                            style={formData.recurrence_days.includes(i.toString()) ? dayBtnActive : dayBtn}
                                        >
                                            {d}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div style={formRow}>
                            <div style={formGroup}>
                                <label style={labelStyle}>시작 시간</label>
                                <input type="time" value={formData.start_time} onChange={e => updateForm('start_time', e.target.value)} style={inputStyle} />
                            </div>
                            <div style={formGroup}>
                                <label style={labelStyle}>종료 시간</label>
                                <input type="time" value={formData.end_time} onChange={e => updateForm('end_time', e.target.value)} style={inputStyle} />
                            </div>
                        </div>
                        <div style={btnGroup}>
                            <button onClick={() => setStep(1)} style={prevBtn}>이전 단계</button>
                            <button onClick={() => setStep(3)} style={nextBtn}>장소 및 상세 설정 <ChevronRight size={18}/></button>
                        </div>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div style={stepContent}>
                    <h2 style={stepTitle}>장소를 지정해주세요</h2>
                    <div style={formBox}>
                        <div style={formGroup}>
                            <label style={labelStyle}>장소 좌표 및 주소 선택 (지도 클릭)</label>
                            <NaverMapSelector onLocationSelected={(lat, lng, addr) => {
                                updateForm('latitude', lat);
                                updateForm('longitude', lng);
                                updateForm('address', addr);
                                updateForm('place_name', addr.split(' ').slice(-2).join(' ')); // Semi-auto place name
                            }} />
                        </div>
                        <div style={formGroup}>
                            <label style={labelStyle}>상세 장소명 (코트 이름 등)</label>
                            <input 
                                placeholder="예: 안양체육관 C코트" 
                                value={formData.place_name}
                                onChange={e => updateForm('place_name', e.target.value)}
                                style={inputStyle}
                            />
                        </div>
                        <div style={formGroup}>
                            <label style={labelStyle}>모임 상세 설명 / 공지</label>
                            <textarea 
                                placeholder="모임에 대한 자세한 규칙이나 안내사항을 적어주세요." 
                                value={formData.description}
                                onChange={e => updateForm('description', e.target.value)}
                                style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }}
                            />
                        </div>
                        <div style={btnGroup}>
                            <button onClick={() => setStep(2)} style={prevBtn}>이전 단계</button>
                            <button onClick={handleSubmit} disabled={loading} style={submitBtn}>
                                {loading ? '모임 등록 중...' : (isRecurring ? '정기 모임 시작하기' : '모임 개설하기')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Styles
const container: React.CSSProperties = { padding: '24px', maxWidth: '600px', margin: '0 auto', minHeight: '100vh' };
const navHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' };
const backBtn: React.CSSProperties = { width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', cursor: 'pointer' };
const stepIndicator: React.CSSProperties = { fontSize: '0.85rem', fontWeight: 900, color: 'var(--accent-primary)' };

const stepContent: React.CSSProperties = { animation: 'fadeIn 0.3s ease-out' };
const stepTitle: React.CSSProperties = { fontSize: '2rem', fontWeight: 950, marginBottom: '12px', letterSpacing: '-0.02em' };
const stepSubtitle: React.CSSProperties = { color: 'rgba(255,255,255,0.5)', marginBottom: '32px' };

const typeGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' };
const typeCardInactive: React.CSSProperties = { padding: '32px 24px', borderRadius: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'all 0.2s' };
const typeCardActive: React.CSSProperties = { ...typeCardInactive, background: 'rgba(255,255,255,0.05)', borderColor: 'var(--accent-primary)', transform: 'translateY(-4px)', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' };
const cardHead: React.CSSProperties = { fontSize: '1.2rem', fontWeight: 850, marginBottom: '8px' };
const cardDesc: React.CSSProperties = { fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 };

const formBox: React.CSSProperties = { display: 'grid', gap: '24px' };
const formGroup: React.CSSProperties = { display: 'grid', gap: '8px' };
const formRow: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' };
const labelStyle: React.CSSProperties = { fontSize: '0.8rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '16px', borderRadius: '16px', background: 'var(--bg-surface-L1)', border: '1px solid var(--border-subtle)', color: 'white', fontSize: '1rem', boxSizing: 'border-box' };

const dayRow: React.CSSProperties = { display: 'flex', gap: '8px', flexWrap: 'wrap' };
const dayBtn: React.CSSProperties = { padding: '10px 16px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: 'white', fontWeight: 700, cursor: 'pointer' };
const dayBtnActive: React.CSSProperties = { ...dayBtn, background: '#8b5cf6', borderColor: '#a78bfa' };

const nextBtn: React.CSSProperties = { padding: '18px', borderRadius: '18px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 900, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' };
const prevBtn: React.CSSProperties = { ...nextBtn, background: 'transparent', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.05)' };
const btnGroup: React.CSSProperties = { display: 'flex', gap: '12px', marginTop: '20px' };
const submitBtn: React.CSSProperties = { ...nextBtn, flex: 2, background: 'var(--accent-primary)', border: 'none', boxShadow: '0 10px 25px rgba(249, 115, 22, 0.4)' };
