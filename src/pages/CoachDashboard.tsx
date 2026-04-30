import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LayoutDashboard, Target, Calendar, CreditCard, TrendingUp, Users, Clock, ChevronRight, Award, Edit3, Save, X, Sparkles, MapPin, MessageSquare, User as UserIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { ImageUploadField } from '../components/admin/ImageUploadField';

type Region = {
    id: string;
    display_name: string;
};

export const CoachDashboard = () => {
    const location = useLocation();
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
    const [recentJournals, setRecentJournals] = useState<any[]>([]);

    // Edit states
    const [isEditing, setIsEditing] = useState(false);
    const [allRegions, setAllRegions] = useState<Region[]>([]);
    const [editData, setEditData] = useState({
        experience_text: "",
        bio_text: "",
        service_regions: [] as string[],
        photo_url: "",
        auto_accept: false
    });

    useEffect(() => {
        loadData();
    }, [location.search]);

    async function loadData() {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

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
                    photo_url: cp.photo_url || "",
                    auto_accept: cp.auto_accept || false
                });
            }

            const [{ count: pendingCount }, { count: upcomingCount }, { count: slotCount }] = await Promise.all([
                supabase.from('class_requests').select('*', { count: 'exact', head: true }).eq('coach_id', session.user.id).eq('status', 'requested'),
                supabase.from('class_requests').select('*', { count: 'exact', head: true }).eq('coach_id', session.user.id).eq('status', 'accepted').gte('requested_start', new Date().toISOString()),
                supabase.from('coach_slots').select('id', { count: 'exact', head: true }).eq('coach_id', session.user.id).eq('is_booked', false).gte('start_at', new Date().toISOString())
            ]);

            const { data: journals } = await supabase
                .from('class_journals')
                .select('*, profiles:student_id(name), class_requests(requested_start)')
                .eq('coach_id', session.user.id)
                .order('created_at', { ascending: false })
                .limit(5);

            setRecentJournals(journals || []);
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
                    photo_url: editData.photo_url,
                    auto_accept: editData.auto_accept
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

    if (loading) return <div style={{ padding: 40, opacity: 0.5, textAlign: 'center' }}>COLLECTING DASHBOARD DATA...</div>;

    return (
        <div style={{ color: 'white', paddingBottom: '100px', width: '100%', maxWidth: '1200px', margin: '0 auto', padding: window.innerWidth <= 768 ? '0 16px' : '0' }}>
            <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: window.innerWidth <= 600 ? 'flex-start' : 'center', flexDirection: window.innerWidth <= 600 ? 'column' : 'row', gap: '1.5rem' }}>
                <div style={{ width: '100%' }}>
                    <h1 style={{ fontSize: window.innerWidth <= 768 ? '1.5rem' : '2rem', fontWeight: 900, marginBottom: '0.4rem', letterSpacing: '-0.02em' }}>COACH CENTER</h1>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>전략적인 수업 관리와 성과를 한눈에 확인하세요.</p>
                </div>
                <div style={gradeBadgeRow}>
                    <div style={gradeBadge}>{displayGrade} GRADE</div>
                    <div style={tokenChip}><Award size={14} style={{ marginRight: 6 }} /> {profile?.total_tokens || 0} TOKENS</div>
                </div>
            </div>
            
            {/* Progression Bar */}
            <div className="card-minimal" style={{ marginBottom: '3rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <TrendingUp size={18} color="var(--color-coach)" />
                        <span style={{ fontWeight: 900, fontSize: '0.9rem', letterSpacing: '0.02em' }}>NEXT GRADE PROGRESSION</span>
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, opacity: 0.4 }}>{profile?.activity_score || 0} / {displayGrade === 'C' ? '100' : '300'} XP</span>
                </div>
                <div style={progBarBg}>
                    <div style={{ ...progBarFill, width: `${Math.min(100, ((profile?.activity_score || 0) / (displayGrade === 'C' ? 100 : 300)) * 100)}%` }} />
                </div>
            </div>

            {/* Stats Grid */}
            <div style={statsGrid}>
                <StatCard title="대기 중인 요청" value={stats.pendingRequests} unit="건" icon={<Target size={18} opacity={0.5} />} link="/coach/requests" />
                <StatCard title="예정된 수업" value={stats.upcomingClasses} unit="개" icon={<Calendar size={18} opacity={0.5} />} link="/coach/requests" />
                <StatCard title="오픈된 슬롯" value={stats.activeSlots} unit="개" icon={<Clock size={18} opacity={0.5} />} link="/coach/schedule" />
                <StatCard title="이번 달 정산" value="-" unit="원" icon={<CreditCard size={18} opacity={0.5} />} link="/coach/financials" />
            </div>

            {/* Profile Management Section */}
            <div style={{ marginTop: '4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.6rem', fontWeight: 900, letterSpacing: '-0.02em' }}>PROFILE MANAGER</h2>
                    {!isEditing ? (
                        <button onClick={() => setIsEditing(true)} style={editModeBtn}>
                            <Edit3 size={16} style={{ marginRight: 8 }} /> EDIT PROFILE
                        </button>
                    ) : (
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => setIsEditing(false)} style={cancelBtn}>취소</button>
                            <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ background: 'var(--color-coach)', padding: '10px 24px' }}>
                                {saving ? "저장 중..." : "변경사항 저장"}
                            </button>
                        </div>
                    )}
                </div>

                {msg && <div style={msgBox}>{msg}</div>}

                <div className="card-minimal" style={{ padding: '0' }}>
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
                                <div style={{ marginTop: '2rem', width: '100%' }}>
                                    <ImageUploadField 
                                        label="프로필 사진" 
                                        value={editData.photo_url} 
                                        onChange={(url) => setEditData(prev => ({ ...prev, photo_url: url }))}
                                        helperText="증명사진 혹은 활동 사진을 권장합니다."
                                    />
                                </div>
                            )}
                        </div>

                        {/* Content Section */}
                        <div style={contentSection}>
                            <div style={fieldGroup}>
                                <label style={labelStyle}>EXPERIENCE</label>
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
                                <label style={labelStyle}>BIO</label>
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
                                <label style={labelStyle}>LOCATIONS (MAX 3)</label>
                                {isEditing ? (
                                    <div style={regionSelectorWrap}>
                                        <div style={selectedRegionsRow}>
                                            {editData.service_regions.length === 0 ? (
                                                <span style={{ opacity: 0.3, fontSize: '0.8rem' }}>지역을 선택해 주세요</span>
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
                                            <span key={r} style={staticRegionChip}><MapPin size={12} style={{ marginRight: 6 }} /> {r}</span>
                                        ))}
                                        {(!coachProfile?.service_regions || coachProfile.service_regions.length === 0) && <div style={displayField}>등록된 지역이 없습니다.</div>}
                                    </div>
                                )}
                            </div>

                            <div style={fieldGroup}>
                                <label style={labelStyle}>자동 승인 설정</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: '4px' }}>수업 자동 매치 (자동 수락)</div>
                                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', lineHeight: 1.4 }}>
                                            활성화 시, 코치님이 등록한 일정과 겹치지 않는 모든 제안이 <b>즉시 확정</b>됩니다.<br/>
                                            <span style={{ color: 'var(--color-coach)', fontWeight: 800 }}>⚠️ 주의: 비어있는 모든 시간에 신청이 들어올 수 있으므로, 수업이 어려운 시간은 반드시 미리 일정을 등록해 주세요.</span>
                                        </div>
                                    </div>
                                    {isEditing ? (
                                        <button 
                                            onClick={() => setEditData(prev => ({ ...prev, auto_accept: !prev.auto_accept }))}
                                            style={{ 
                                                width: '50px', height: '26px', borderRadius: '100px', border: 'none', cursor: 'pointer', position: 'relative',
                                                background: editData.auto_accept ? 'var(--color-coach)' : 'rgba(255,255,255,0.1)',
                                                transition: 'all 0.3s'
                                            }}
                                        >
                                            <div style={{ 
                                                width: '20px', height: '20px', background: 'white', borderRadius: '50%', position: 'absolute', top: '3px',
                                                left: editData.auto_accept ? '27px' : '3px', transition: 'all 0.3s'
                                            }} />
                                        </button>
                                    ) : (
                                        <div style={{ color: coachProfile?.auto_accept ? 'var(--color-coach)' : 'rgba(255,255,255,0.2)', fontWeight: 900, fontSize: '0.9rem' }}>
                                            {coachProfile?.auto_accept ? 'ON' : 'OFF'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '3rem' }}>
                <div className="card-minimal">
                    <h2 style={panelTitleStyle}>QUICK TOOLS</h2>
                    <div style={{ display: 'grid', gap: '10px' }}>
                        <QuickLink to="/coach/schedule" title="수업 일정 활성화" desc="학습 신청 가능한 시간대를 설정합니다." icon={<Calendar size={18} />} />
                        <QuickLink to="/coach/requests" title="수업 요청 관리" desc="새로운 수업 신청을 수락/거절합니다." icon={<Target size={18} />} />
                    </div>
                </div>

                <div className="card-minimal">
                    <h2 style={panelTitleStyle}>COACH GUIDE</h2>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '16px' }}>
                        <li style={guideItemStyle}>● 수업 2시간 전 확정 일정을 다시 확인해 주세요.</li>
                        <li style={guideItemStyle}>● 개인 사정으로 취소 시 학생에게 미리 연락 부탁드립니다.</li>
                    </ul>
                </div>

                {/* Recent Feedback Archive Section */}
                {recentJournals && recentJournals.length > 0 && (
                    <div style={{ gridColumn: '1 / -1', marginTop: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ ...panelTitleStyle, marginBottom: 0 }}>STUDENT SUCCESS LOG</h2>
                            <Link to="/coach/requests" style={{ fontSize: '0.85rem', color: 'var(--color-coach)', fontWeight: 800, textDecoration: 'none' }}>전체 기록 보기</Link>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                            {recentJournals.map(j => (
                                <div key={j.id} style={{ ...quickLinkStyle, background: 'rgba(255,255,255,0.01)', padding: '20px' }}>
                                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center', width: '100%' }}>
                                        <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: '#000', overflow: 'hidden', flexShrink: 0, border: '1px solid rgba(255,255,255,0.05)' }}>
                                            {j.visual_log_url ? <img src={j.visual_log_url} alt="Sketch" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.2, fontSize: '0.6rem' }}>NO SKETCH</div>}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.75rem', opacity: 0.4, marginBottom: '2px' }}>{new Date(j.class_requests?.requested_start).toLocaleDateString()}</div>
                                            <div style={{ fontWeight: 900, fontSize: '1.05rem' }}>{j.profiles?.name} 학생 <span style={{ fontSize: '0.8rem', opacity: 0.5, fontWeight: 500 }}>#{j.session_number}</span></div>
                                            <p style={{ fontSize: '0.8rem', opacity: 0.6, margin: '6px 0 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5 }}>
                                                {j.coach_feedback}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

/* Components */
const StatCard = ({ title, value, unit, icon, link }: any) => (
    <Link to={link || '#'} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="card-minimal" style={{ height: '100%', transition: 'all 0.2s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{title}</span>
                <div style={iconBox}>{icon}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-0.02em' }}>{value}</span>
                <span style={{ fontSize: '0.9rem', opacity: 0.3, fontWeight: 800 }}>{unit}</span>
            </div>
        </div>
    </Link>
);

const QuickLink = ({ to, title, desc, icon }: any) => (
    <Link to={to} style={quickLinkStyle}>
        <div style={{ ...iconBox, background: 'rgba(255,255,255,0.02)', marginRight: '14px' }}>{icon}</div>
        <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '2px' }}>{title}</div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>{desc}</div>
        </div>
        <ChevronRight size={16} style={{ opacity: 0.2 }} />
    </Link>
);

/* Styles */
const statsGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' };
const iconBox: React.CSSProperties = { width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const panelTitleStyle: React.CSSProperties = { fontSize: '1.2rem', fontWeight: 900, marginBottom: '20px', letterSpacing: '0.02em' };
const quickLinkStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)', textDecoration: 'none', color: 'inherit', transition: 'all 0.2s' };
const guideItemStyle: React.CSSProperties = { fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 };
const tabBtn: React.CSSProperties = { border: 'none', padding: '10px 20px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 900, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center' };

const gradeBadgeRow: React.CSSProperties = { display: 'flex', gap: '10px', alignItems: 'center' };
const gradeBadge: React.CSSProperties = { padding: '8px 18px', borderRadius: '12px', background: 'var(--color-coach)', color: 'white', fontWeight: 900, fontSize: '0.8rem', letterSpacing: '0.05em' };
const tokenChip: React.CSSProperties = { padding: '8px 18px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', fontWeight: 800, fontSize: '0.8rem', display: 'flex', alignItems: 'center' };

const progBarBg: React.CSSProperties = { width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '99px', overflow: 'hidden' };
const progBarFill: React.CSSProperties = { height: '100%', background: 'var(--color-coach)', borderRadius: '99px', transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' };

const profileGrid: React.CSSProperties = { 
    display: 'grid', 
    gridTemplateColumns: window.innerWidth <= 800 ? '1fr' : '240px 1fr', 
    gap: window.innerWidth <= 800 ? '20px' : '40px', 
    padding: window.innerWidth <= 800 ? '20px' : '40px' 
};
const photoSection: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center' };
const photoWrap: React.CSSProperties = { width: window.innerWidth <= 800 ? '160px' : '100%', aspectRatio: '1/1', borderRadius: '20px', overflow: 'hidden', background: '#0a0a0b', border: '1px solid rgba(255,255,255,0.05)' };
const photoFallback: React.CSSProperties = { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 900, color: 'rgba(255,255,255,0.05)' };

const contentSection: React.CSSProperties = { display: 'grid', gap: '30px' };
const fieldGroup: React.CSSProperties = { display: 'grid', gap: '10px' };
const labelStyle: React.CSSProperties = { fontSize: '0.7rem', fontWeight: 900, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' };
const displayField: React.CSSProperties = { fontSize: '1rem', color: 'rgba(255,255,255,0.6)', whiteSpace: 'pre-line', lineHeight: 1.7 };

const editModeBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', padding: '10px 20px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 800, cursor: 'pointer', fontSize: '0.8rem', letterSpacing: '0.02em' };
const cancelBtn: React.CSSProperties = { ...editModeBtn, color: 'rgba(255,255,255,0.4)' };

const inputStyle: React.CSSProperties = { 
    width: '100%', 
    padding: '14px 16px', 
    borderRadius: '12px', 
    background: '#1a1a1c', 
    border: '1px solid rgba(255,255,255,0.1)', 
    color: 'white', 
    fontSize: '0.95rem', 
    outline: 'none',
    boxSizing: 'border-box'
};
const textareaStyle: React.CSSProperties = { ...inputStyle, minHeight: '100px', resize: 'vertical', lineHeight: 1.6 };

const regionSelectorWrap: React.CSSProperties = { display: 'grid', gap: '12px' };
const selectedRegionsRow: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '8px', minHeight: '44px', padding: '10px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' };
const regionChipActive: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '6px 14px', borderRadius: '100px', background: 'var(--color-coach)', color: 'white', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer' };
const allRegionsGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px', maxHeight: '180px', overflowY: 'auto', padding: '4px' };
const regionOption: React.CSSProperties = { padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' };
const regionOptionActive: React.CSSProperties = { ...regionOption, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-coach)', color: 'white' };
const staticRegionChip: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '8px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '100px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', fontWeight: 800 };
const msgBox: React.CSSProperties = { padding: '1rem 1.5rem', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.05)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.1)', marginBottom: '1.5rem', fontWeight: 800, fontSize: '0.9rem' };


