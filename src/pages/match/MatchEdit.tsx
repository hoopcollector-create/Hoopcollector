import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate, useParams } from 'react-router-dom';
import { 
    Clock, Calendar, MapPin, Users, Award, 
    ArrowLeft, ChevronRight, Check, Info,
    Zap, Repeat, DollarSign, PenTool, Save
} from 'lucide-react';
import { NaverMapSelector } from '../../components/NaverMapSelector';

export const MatchEdit: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [match, setMatch] = useState<any>(null);

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
        timezone: 'Asia/Seoul',
        single_date: '',
        start_time: '',
        end_time: ''
    });

    useEffect(() => {
        loadMatchData();
    }, [id]);

    const loadMatchData = async () => {
        try {
            const { data, error } = await supabase
                .from('match_rooms')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            setMatch(data);

            const startAt = new Date(data.start_at);
            const endAt = new Date(data.end_at);

            setFormData({
                title: data.title || '',
                description: data.description || '',
                match_type: data.match_type || '5대5',
                required_grade: data.required_grade || 'all',
                max_players: data.max_players || 12,
                place_name: data.place_name || '',
                address: data.address || '',
                road_address: data.road_address || '',
                latitude: data.latitude || 0,
                longitude: data.longitude || 0,
                fee_type: data.fee_type || (data.fee_amount > 0 ? 'paid' : 'free'),
                fee_amount: data.fee_amount || 0,
                supplies: data.supplies || '',
                notice: data.notice || '',
                timezone: data.timezone || 'Asia/Seoul',
                single_date: data.occurrence_date || startAt.toISOString().split('T')[0],
                start_time: startAt.toTimeString().slice(0, 5),
                end_time: endAt.toTimeString().slice(0, 5)
            });
        } catch (e: any) {
            alert('정보를 불러오는데 실패했습니다: ' + e.message);
            navigate('/match');
        } finally {
            setLoading(false);
        }
    };

    const updateForm = (key: string, value: any) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async () => {
        if (!formData.title || !formData.place_name) return alert('필수 정보를 모두 입력해주세요.');
        setSaving(true);

        try {
            const [y, m, d] = formData.single_date.split('-').map(Number);
            const [sh, sm] = formData.start_time.split(':').map(Number);
            const [eh, em] = formData.end_time.split(':').map(Number);
            
            const startAt = new Date(y, m - 1, d, sh, sm);
            const endAt = new Date(y, m - 1, d, eh, em);

            const { error } = await supabase
                .from('match_rooms')
                .update({
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
                    fee_amount: formData.fee_amount,
                    supplies: formData.supplies,
                    notice: formData.notice,
                    timezone: formData.timezone
                })
                .eq('id', id);

            if (error) throw error;

            alert('정보가 수정되었습니다.');
            navigate(`/match/room/${id}`);
        } catch (e: any) {
            alert('수정 중 오류가 발생했습니다: ' + e.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div style={loadingOverlay}>LOADING...</div>;

    return (
        <div style={container}>
            {/* Top Navigation */}
            <div style={navHeader}>
                <button onClick={() => navigate(-1)} style={backBtn}><ArrowLeft size={20}/></button>
                <h2 style={headerTitle}>모임 정보 수정</h2>
            </div>

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

                <div style={formGroup}>
                    <label style={labelStyle}>방장 공지사항 (상단 노출)</label>
                    <input 
                        placeholder="예: 지각 금지! 화이트/다크 유니폼 지참" 
                        value={formData.notice}
                        onChange={e => updateForm('notice', e.target.value)}
                        style={{ ...inputStyle, borderColor: 'var(--accent-primary)' }}
                    />
                </div>

                <div style={formRow}>
                    <div style={formGroup}>
                        <label style={labelStyle}>타임존 (지역 시간)</label>
                        <select value={formData.timezone} onChange={e => updateForm('timezone', e.target.value)} style={inputStyle}>
                            <option value="Asia/Seoul">한국 (KST)</option>
                            <option value="Asia/Tokyo">일본 (JST)</option>
                            <option value="America/New_York">뉴욕 (EST/EDT)</option>
                            <option value="America/Los_Angeles">LA (PST/PDT)</option>
                            <option value="Europe/London">런던 (GMT/BST)</option>
                            <option value="Europe/Paris">파리 (CET/CEST)</option>
                            <option value="Asia/Shanghai">중국 (CST)</option>
                            <option value="Asia/Singapore">싱가포르/대만</option>
                            <option value="Australia/Sydney">시드니 (AEST/AEDT)</option>
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

                <div style={formGroup}>
                    <label style={labelStyle}>날짜 선택</label>
                    <input type="date" value={formData.single_date} onChange={e => updateForm('single_date', e.target.value)} style={inputStyle} />
                </div>

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

                <div style={formGroup}>
                    <label style={labelStyle}>준비물</label>
                    <input 
                        placeholder="예: 농구화, 유니폼, 개인 음료수" 
                        value={formData.supplies}
                        onChange={e => updateForm('supplies', e.target.value)}
                        style={inputStyle}
                    />
                </div>

                <div style={formGroup}>
                    <label style={labelStyle}>장소 정보 (지도에서 위치 재선택 가능)</label>
                    <div style={{ marginBottom: '10px' }}>
                        <NaverMapSelector 
                            defaultLocation={{ lat: formData.latitude, lng: formData.longitude }}
                            onLocationSelected={(lat, lng, addr) => {
                                updateForm('latitude', lat);
                                updateForm('longitude', lng);
                                updateForm('address', addr);
                                if (!formData.place_name) {
                                    updateForm('place_name', addr.split(' ').slice(-2).join(' '));
                                }
                            }} 
                        />
                    </div>
                    <div style={formGroup}>
                        <label style={labelSubStyle}>상세 장소명</label>
                        <input 
                            placeholder="예: 안양체육관 C코트" 
                            value={formData.place_name}
                            onChange={e => updateForm('place_name', e.target.value)}
                            style={inputStyle}
                        />
                    </div>
                    <div style={formGroup}>
                        <label style={labelSubStyle}>현재 주소</label>
                        <input 
                            value={formData.address}
                            readOnly
                            style={{ ...inputStyle, background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.5)' }}
                        />
                    </div>
                </div>

                <div style={formGroup}>
                    <label style={labelStyle}>모임 상세 설명</label>
                    <textarea 
                        placeholder="모임에 대한 자세한 규칙이나 안내사항을 적어주세요." 
                        value={formData.description}
                        onChange={e => updateForm('description', e.target.value)}
                        style={{ ...inputStyle, minHeight: '150px', resize: 'vertical' }}
                    />
                </div>

                <button onClick={handleSubmit} disabled={saving} style={submitBtn}>
                    {saving ? '저장 중...' : <><Save size={18} /> 정보 수정 완료</>}
                </button>
            </div>
        </div>
    );
};

// Styles
const container: React.CSSProperties = { padding: '24px', maxWidth: '600px', margin: '0 auto', minHeight: '100vh', paddingBottom: '80px' };
const navHeader: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' };
const backBtn: React.CSSProperties = { width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', cursor: 'pointer' };
const headerTitle: React.CSSProperties = { fontSize: '1.5rem', fontWeight: 900 };

const formBox: React.CSSProperties = { display: 'grid', gap: '24px' };
const formGroup: React.CSSProperties = { display: 'grid', gap: '8px' };
const formRow: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' };
const labelStyle: React.CSSProperties = { fontSize: '0.85rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' };
const labelSubStyle: React.CSSProperties = { fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '1rem', boxSizing: 'border-box' };

const submitBtn: React.CSSProperties = { padding: '18px', borderRadius: '18px', background: 'var(--accent-primary)', color: 'white', border: 'none', fontWeight: 900, fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.2s', marginTop: '20px', boxShadow: '0 10px 25px rgba(249, 115, 22, 0.3)' };

const loadingOverlay: React.CSSProperties = { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#070708', color: 'rgba(255,255,255,0.2)', fontSize: '1.2rem', fontWeight: 900 };
