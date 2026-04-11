import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LayoutDashboard, Target, Calendar, CreditCard, TrendingUp, Users, Clock, ChevronRight, Award, Edit3, Save, X, Sparkles, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

type Region = {
    id: string;
    display_name: string;
};

export const CoachDashboard = () => {
    const [stats, setStats] = useState({
        pendingRequests: 0,
        upcomingClasses: 0,
        monthlyEarnings: 0,
        activeSlots: 0
    });
    const [profile, setProfile] = useState<any>(null);
    const [coachProfile, setCoachProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState("");

    // Edit states
    const [isEditing, setIsEditing] = useState(false);
    const [allRegions, setAllRegions] = useState<Region[]>([]);
    const [editData, setEditData] = useState({
        experience_text: "",
        bio_text: "",
        service_regions: [] as string[],
        photo_url: ""
    });

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            // 1. Get Profiles
            const [pRes, cpRes, regionsRes] = await Promise.all([
                supabase.from('profiles').select('*').eq('id', session.user.id).single(),
                supabase.from('coach_profiles').select('*').eq('user_id', session.user.id).single(),
                supabase.from('service_regions').select('id, display_name').eq('active', true).order('display_name')
            ]);

            const p = pRes.data;
            const cp = cpRes.data;
            
            setProfile(p);
            setCoachProfile(cp);
            setAllRegions(regionsRes.data || []);

            if (cp) {
                setEditData({
                    experience_text: cp.experience_text || "",
                    bio_text: cp.bio_text || "",
                    service_regions: cp.service_regions || [],
                    photo_url: cp.photo_url || ""
                });
            }

            // 2. Load Stats
            const [{ count: pendingCount }, { count: upcomingCount }, { count: slotCount }] = await Promise.all([
                supabase.from('class_requests').select('*', { count: 'exact', head: true }).eq('coach_id', session.user.id).eq('status', 'requested'),
                supabase.from('class_requests').select('*', { count: 'exact', head: true }).eq('coach_id', session.user.id).eq('status', 'accepted').gte('requested_start', new Date().toISOString()),
                supabase.from('coach_slots').select('id', { count: 'exact', head: true }).eq('coach_id', session.user.id).eq('is_booked', false).gte('start_at', new Date().toISOString())
            ]);

            setStats({
                pendingRequests: pendingCount || 0,
                upcomingClasses: upcomingCount || 0,
                activeSlots: slotCount || 0,
                monthlyEarnings: 0
            });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        setSaving(true);
        setMsg("");
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { error } = await supabase
                .from('coach_profiles')
                .update({
                    experience_text: editData.experience_text,
                    bio_text: editData.bio_text,
                    service_regions: editData.service_regions,
                    photo_url: editData.photo_url
                })
                .eq('user_id', session.user.id);

            if (error) throw error;
            
            setMsg("프로필이 성공적으로 업데이트되었습니다.");
            setIsEditing(false);
            loadData();
        } catch (e: any) {
            setMsg("오류 발생: " + e.message);
        } finally {
            setSaving(false);
        }
    }

    const toggleRegion = (regionName: string) => {
        if (editData.service_regions.includes(regionName)) {
            setEditData(prev => ({
                ...prev,
                service_regions: prev.service_regions.filter(r => r !== regionName)
            }));
        } else {
            if (editData.service_regions.length >= 3) {
                alert("활동 지역은 최대 3개까지만 선택 가능합니다.");
                return;
            }
            setEditData(prev => ({
                ...prev,
                service_regions: [...prev.service_regions, regionName]
            }));
        }
    };

    const displayGrade = coachProfile?.coach_level || profile?.coach_grade || 'C';

    return (
        <div style={{ color: 'white', paddingBottom: '3rem' }}>
            {/* Header */}
            <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 1.75rem)', fontWeight: 900, marginBottom: '0.5rem' }}>코치 대시보드</h1>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>오늘의 수업 일정과 커뮤니티 활동 성과를 확인하세요.</p>
                </div>
                <div style={gradeBadgeRow}>
                    <div style={gradeBadge}>{displayGrade} GRADE</div>
                    <div style={tokenChip}><Award size={14} style={{ marginRight: 6 }} /> {profile?.total_tokens || 0} TOKENS</div>
                </div>
            </div>

            {/* Progression Bar */}
            <div style={progressionCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <TrendingUp size={18} color="var(--color-primary)" />
                        <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>다음 등급({displayGrade === 'C' ? 'B' : 'A'})까지 성과</span>
                    </div>
                    <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>{profile?.activity_score || 0} / {displayGrade === 'C' ? '100' : '300'} 점</span>
                </div>
                <div style={progBarBg}>
                    <div style={{ ...progBarFill, width: `${Math.min(100, ((profile?.activity_score || 0) / (displayGrade === 'C' ? 100 : 300)) * 100)}%` }} />
                </div>
            </div>

            {/* Stats Grid */}
            <div style={statsGrid}>
                <StatCard title="대기 중인 요청" value={stats.pendingRequests} unit="건" icon={<Target color="#f59e0b" />} link="/coach/requests" />
                <StatCard title="예정된 수업" value={stats.upcomingClasses} unit="개" icon={<Calendar color="#3b82f6" />} link="/coach/requests" />
                <StatCard title="오픈된 슬롯" value={stats.activeSlots} unit="개" icon={<Clock color="#8b5cf6" />} link="/coach/schedule" />
                <StatCard title="이번 달 정산" value="-" unit="원" icon={<CreditCard color="#10b981" />} link="/coach/financials" />
            </div>

            {/* Profile Management Section */}
            <div style={{ marginTop: '3rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 900 }}>내 코치 프로필 관리</h2>
                    {!isEditing ? (
                        <button onClick={() => setIsEditing(true)} style={editModeBtn}>
                            <Edit3 size={18} style={{ marginRight: 8 }} /> 프로필 수정
                        </button>
                    ) : (
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => setIsEditing(false)} style={cancelBtn}>
                                <X size={18} style={{ marginRight: 8 }} /> 취소
                            </button>
                            <button onClick={handleSave} disabled={saving} style={saveBtn}>
                                <Save size={18} style={{ marginRight: 8 }} /> {saving ? "저장 중..." : "변경사항 저장"}
                            </button>
                        </div>
                    )}
                </div>

                {msg && <div style={msgBox}>{msg}</div>}

                <div style={profilePanel}>
                    <div style={profileGrid}>
                        {/* Photo & Basic Info */}
                        <div style={photoSection}>
                            <div style={photoWrap}>
                                {editData.photo_url ? (
                                    <img src={editData.photo_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={photoFallback}>HC</div>
                                )}
                            </div>
                            {isEditing && (
                                <div style={{ marginTop: '1rem', width: '100%' }}>
                                    <label style={labelStyle}>사진 URL</label>
                                    <input 
                                        style={inputStyle}
                                        value={editData.photo_url}
                                        onChange={e => setEditData(prev => ({ ...prev, photo_url: e.target.value }))}
                                        placeholder="https://..."
                                    />
                                </div>
                            )}
                        </div>

                        {/* Content Section */}
                        <div style={contentSection}>
                            <div style={fieldGroup}>
                                <label style={labelStyle}>주요 경력</label>
                                {isEditing ? (
                                    <textarea 
                                        style={textareaStyle}
                                        value={editData.experience_text}
                                        onChange={e => setEditData(prev => ({ ...prev, experience_text: e.target.value }))}
                                        placeholder="선수 경력, 지도 경력 등을 자유롭게 입력하세요."
                                    />
                                ) : (
                                    <div style={displayField}>{coachProfile?.experience_text || "등록된 경력이 없습니다."}</div>
                                )}
                            </div>

                            <div style={fieldGroup}>
                                <label style={labelStyle}>자기소개</label>
                                {isEditing ? (
                                    <textarea 
                                        style={{ ...textareaStyle, minHeight: '150px' }}
                                        value={editData.bio_text}
                                        onChange={e => setEditData(prev => ({ ...prev, bio_text: e.target.value }))}
                                        placeholder="학생들에게 보여줄 소개 글을 입려하세요."
                                    />
                                ) : (
                                    <div style={displayField}>{coachProfile?.bio_text || "등록된 소개 글이 없습니다."}</div>
                                )}
                            </div>

                            <div style={fieldGroup}>
                                <label style={labelStyle}>활동 지역 (최대 3개)</label>
                                {isEditing ? (
                                    <div style={regionSelectorWrap}>
                                        <div style={selectedRegionsRow}>
                                            {editData.service_regions.length === 0 ? (
                                                <span style={{ opacity: 0.4, fontSize: '0.85rem' }}>지역을 선택해 주세요</span>
                                            ) : (
                                                editData.service_regions.map(r => (
                                                    <span key={r} onClick={() => toggleRegion(r)} style={regionChipActive}>
                                                        {r} <X size={12} style={{ marginLeft: 4 }} />
                                                    </span>
                                                ))
                                            )}
                                        </div>
                                        <div style={allRegionsGrid}>
                                            {allRegions.map(r => (
                                                <button 
                                                    key={r.id} 
                                                    onClick={() => toggleRegion(r.display_name)}
                                                    style={editData.service_regions.includes(r.display_name) ? regionOptionActive : regionOption}
                                                >
                                                    {r.display_name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {(coachProfile?.service_regions || []).map((r: string) => (
                                            <span key={r} style={staticRegionChip}><MapPin size={12} style={{ marginRight: 4 }} /> {r}</span>
                                        ))}
                                        {(!coachProfile?.service_regions || coachProfile.service_regions.length === 0) && <div style={displayField}>등록된 지역이 없습니다.</div>}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '3rem' }}>
                <div style={panel}>
                    <h2 style={panelTitle}>빠른 도구</h2>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <QuickLink to="/coach/schedule" title="내 수업 일정 등록하기" desc="학생들이 수업을 신청할 수 있는 새로운 시간대를 활성화합니다." icon={<Calendar />} />
                        <QuickLink to="/coach/requests" title="수업 요청 수락/거절" desc="새로 들어온 수업 신청을 확인하고 일정을 확정합니다." icon={<Target />} />
                    </div>
                </div>

                <div style={{ ...panel, background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))' }}>
                    <h2 style={panelTitle}>코치 가이드</h2>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '1rem' }}>
                        <li style={guideItem}>● 수업 2시간 전에는 확정된 일정을 다시 확인해 주세요.</li>
                        <li style={guideItem}>● 개인 사정으로 취소 시 학생에게 미리 연락 부탁드립니다.</li>
                        <li style={guideItem}>● 가이드: 원활한 매칭을 위해 프로필 사진과 경력을 상세히 적어주세요.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

/* Components */
const StatCard = ({ title, value, unit, icon, link }: any) => (
    <Link to={link || '#'} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div style={statCardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>{title}</span>
                <div style={iconBox}>{icon}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '2rem', fontWeight: 900 }}>{value}</span>
                <span style={{ fontSize: '0.9rem', opacity: 0.5, fontWeight: 700 }}>{unit}</span>
            </div>
        </div>
    </Link>
);

const QuickLink = ({ to, title, desc, icon }: any) => (
    <Link to={to} style={quickLinkStyle}>
        <div style={{ ...iconBox, background: 'rgba(255,255,255,0.05)', marginRight: '1rem' }}>{icon}</div>
        <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '2px' }}>{title}</div>
            <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>{desc}</div>
        </div>
        <ChevronRight size={18} style={{ opacity: 0.3 }} />
    </Link>
);

/* Styles */
const statsGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' };
const statCardStyle: React.CSSProperties = { padding: '1.5rem', borderRadius: '24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', transition: 'transform 0.2s ease', cursor: 'pointer' };
const iconBox: React.CSSProperties = { width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const panel: React.CSSProperties = { padding: '2rem', borderRadius: '32px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' };
const panelTitle: React.CSSProperties = { fontSize: '1.25rem', fontWeight: 900, marginBottom: '1.5rem' };
const quickLinkStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', padding: '1.25rem', borderRadius: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', textDecoration: 'none', color: 'inherit' };
const guideItem: React.CSSProperties = { fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 };

const gradeBadgeRow: React.CSSProperties = { display: 'flex', gap: '8px', alignItems: 'center' };
const gradeBadge: React.CSSProperties = { padding: '8px 16px', borderRadius: '12px', background: 'var(--color-primary)', color: 'white', fontWeight: 900, fontSize: '0.85rem' };
const tokenChip: React.CSSProperties = { padding: '8px 16px', borderRadius: '12px', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.2)', color: '#fbbf24', fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center' };

const progressionCard: React.CSSProperties = { padding: '1.5rem', borderRadius: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '2.5rem' };
const progBarBg: React.CSSProperties = { width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '99px', overflow: 'hidden' };
const progBarFill: React.CSSProperties = { height: '100%', background: 'linear-gradient(to right, var(--color-primary), #8b5cf6)', borderRadius: '99px', transition: 'width 1s ease-out' };

const profilePanel: React.CSSProperties = { padding: '2.5rem', borderRadius: '32px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' };
const profileGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: '200px 1fr', gap: '3rem' };
const photoSection: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center' };
const photoWrap: React.CSSProperties = { width: '100%', aspectRatio: '1/1', borderRadius: '24px', overflow: 'hidden', background: '#111827', border: '1px solid rgba(255,255,255,0.1)' };
const photoFallback: React.CSSProperties = { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 900, color: 'rgba(255,255,255,0.1)' };

const contentSection: React.CSSProperties = { display: 'grid', gap: '2rem' };
const fieldGroup: React.CSSProperties = { display: 'grid', gap: '8px' };
const labelStyle: React.CSSProperties = { fontSize: '0.75rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' };
const displayField: React.CSSProperties = { fontSize: '1rem', color: 'rgba(255,255,255,0.8)', whiteSpace: 'pre-line', lineHeight: 1.6 };

const editModeBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', padding: '10px 20px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-primary)', border: '1px solid rgba(59, 130, 246, 0.2)', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem' };
const saveBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', padding: '10px 20px', borderRadius: '12px', background: 'white', color: 'black', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem' };
const cancelBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', padding: '10px 20px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' };

const inputStyle: React.CSSProperties = { width: '100%', padding: '12px', borderRadius: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '0.9rem' };
const textareaStyle: React.CSSProperties = { ...inputStyle, minHeight: '100px', resize: 'vertical', lineHeight: 1.6 };

const regionSelectorWrap: React.CSSProperties = { display: 'grid', gap: '12px' };
const selectedRegionsRow: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '6px', minHeight: '40px', padding: '8px', borderRadius: '12px', background: 'rgba(0,0,0,0.3)' };
const regionChipActive: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: '8px', background: 'var(--color-primary)', color: 'white', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' };
const allRegionsGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '6px', maxHeight: '160px', overflowY: 'auto' };
const regionOption: React.CSSProperties = { padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', textAlign: 'left' };
const regionOptionActive: React.CSSProperties = { ...regionOption, background: 'rgba(59, 130, 246, 0.2)', border: '1px solid var(--color-primary)', color: 'white' };
const staticRegionChip: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '6px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', fontWeight: 700 };
const msgBox: React.CSSProperties = { padding: '1rem', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', marginBottom: '1.5rem', fontWeight: 700, fontSize: '0.9rem' };

const StatCard = ({ title, value, unit, icon, link }: any) => (
    <Link to={link || '#'} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div style={statCardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>{title}</span>
                <div style={iconBox}>{icon}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '2rem', fontWeight: 900 }}>{value}</span>
                <span style={{ fontSize: '0.9rem', opacity: 0.5, fontWeight: 700 }}>{unit}</span>
            </div>
        </div>
    </Link>
);

const QuickLink = ({ to, title, desc, icon }: any) => (
    <Link to={to} style={quickLinkStyle}>
        <div style={{ ...iconBox, background: 'rgba(255,255,255,0.05)', marginRight: '1rem' }}>{icon}</div>
        <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '2px' }}>{title}</div>
            <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>{desc}</div>
        </div>
        <ChevronRight size={18} style={{ opacity: 0.3 }} />
    </Link>
);

const statsGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' };
const statCardStyle: React.CSSProperties = { padding: '1.5rem', borderRadius: '24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', transition: 'transform 0.2s ease', cursor: 'pointer' };
const iconBox: React.CSSProperties = { width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const panel: React.CSSProperties = { padding: '2rem', borderRadius: '32px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' };
const panelTitle: React.CSSProperties = { fontSize: '1.25rem', fontWeight: 900, marginBottom: '1.5rem' };
const quickLinkStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', padding: '1.25rem', borderRadius: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', textDecoration: 'none', color: 'inherit', transition: 'all 0.2s' };
const guideItem: React.CSSProperties = { fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 };

const gradeBadgeRow: React.CSSProperties = { display: 'flex', gap: '8px', alignItems: 'center' };
const gradeBadge: React.CSSProperties = { padding: '8px 16px', borderRadius: '12px', background: 'var(--color-primary)', color: 'white', fontWeight: 900, fontSize: '0.85rem' };
const tokenChip: React.CSSProperties = { padding: '8px 16px', borderRadius: '12px', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.2)', color: '#fbbf24', fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center' };

const progressionCard: React.CSSProperties = { padding: '1.5rem', borderRadius: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '2.5rem' };
const progBarBg: React.CSSProperties = { width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '99px', overflow: 'hidden' };
const progBarFill: React.CSSProperties = { height: '100%', background: 'linear-gradient(to right, var(--color-primary), #8b5cf6)', borderRadius: '99px', transition: 'width 1s ease-out' };

