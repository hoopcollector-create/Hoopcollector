import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { ArrowLeft, MapPin, Award, CheckCircle2, Calendar, MessageSquare, Star, Sparkles, ChevronRight, Save, X, Edit2, Plus } from "lucide-react";
import { ImageUploadField } from "../components/admin/ImageUploadField";

type PublicCoach = {
    coach_id: string;
    slug: string;
    display_name: string | null;
    coach_level: "A" | "B" | "C" | null;
    photo_url: string | null;
    experience_text: string | null;
    bio_text: string | null;
    service_regions: string[] | null;
    available_classes: string[] | null;
};

type Region = {
    id: string;
    display_name: string;
};


export const CoachDetail = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [coach, setCoach] = useState<PublicCoach | null>(null);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState("");
    
    // Auth & Edit State
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [allRegions, setAllRegions] = useState<Region[]>([]);
    const [editData, setEditData] = useState({
        experience_text: "",
        bio_text: "",
        service_regions: [] as string[],
        photo_url: ""
    });

    useEffect(() => {
        if (!slug) return;
        loadCoach(slug);
        checkUser();
        loadRegions();
    }, [slug]);

    async function checkUser() {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
            setCurrentUserId(session.user.id);
        }
    }

    async function loadRegions() {
        const { data } = await supabase.from('service_regions').select('id, display_name').eq('active', true).order('display_name');
        setAllRegions(data || []);
    }

    async function loadCoach(targetSlug: string) {
        setLoading(true);
        setMsg("");
        try {
            const { data, error } = await supabase
                .from("public_coach_profiles")
                .select("coach_id,slug,display_name,coach_level,photo_url,experience_text,bio_text,service_regions,available_classes")
                .eq("slug", targetSlug)
                .maybeSingle();

            if (error) throw error;
            if (!data) {
                setMsg("해당 코치를 찾을 수 없습니다.");
            } else {
                setCoach(data as PublicCoach);
                setEditData({
                    experience_text: data.experience_text || "",
                    bio_text: data.bio_text || "",
                    service_regions: data.service_regions || [],
                    photo_url: data.photo_url || ""
                });
            }
        } catch (e: any) {
            setMsg(e.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        if (!currentUserId || !coach) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from('coach_profiles')
                .update({
                    experience_text: editData.experience_text,
                    bio_text: editData.bio_text,
                    service_regions: editData.service_regions,
                    photo_url: editData.photo_url
                })
                .eq('user_id', coach.coach_id);

            if (error) throw error;
            
            setIsEditing(false);
            if (slug) loadCoach(slug);
            alert("프로필이 성공적으로 수정되었습니다.");
        } catch (e: any) {
            alert("저장 실패: " + e.message);
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

    if (loading) return <div style={pageWrap}><div style={{ color: 'white', padding: 40, opacity: 0.5 }}>LOADING COACH PROFILE...</div></div>;
    if (!coach) return <div style={pageWrap}><div style={{ color: 'white', padding: 40 }}>{msg || "코치 정보를 찾을 수 없습니다."}</div></div>;

    const isOwner = currentUserId === coach.coach_id;

    return (
        <div style={pageWrap}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', maxWidth: '1200px', margin: '0 auto 3rem auto' }}>
                <button onClick={() => navigate(-1)} style={backBtn}>
                    <ArrowLeft size={18} style={{ marginRight: 8 }} /> BACK TO LIST
                </button>
                
                {isOwner && !isEditing && (
                    <button onClick={() => setIsEditing(true)} style={editModeBtn}>
                        <Edit2 size={16} style={{ marginRight: 8 }} /> EDIT PROFILE
                    </button>
                )}
                
                {isEditing && (
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={() => setIsEditing(false)} style={cancelBtn}>취소</button>
                        <button onClick={handleSave} disabled={saving} style={saveBtn}>
                            {saving ? "저장 중..." : "변경사항 저장"}
                        </button>
                    </div>
                )}
            </div>

            <div style={container}>
                {/* Hero Layout */}
                <div style={heroLayout}>
                    <div style={photoSection}>
                        {isEditing ? (
                            <div style={{ background: 'var(--bg-surface-L1)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-subtle)', marginBottom: '1rem' }}>
                                <ImageUploadField 
                                    label="프로필 사진" 
                                    value={editData.photo_url} 
                                    onChange={(url) => setEditData(prev => ({ ...prev, photo_url: url }))}
                                    helperText="증명사진 혹은 활동 사진을 권장합니다."
                                />
                            </div>
                        ) : (
                            <div style={photoWrap}>
                                {coach.photo_url ? (
                                    <img src={coach.photo_url} alt={coach.display_name ?? ""} style={photo} />
                                ) : (
                                    <div style={photoFallback}>HC</div>
                                )}
                            </div>
                        )}
                    </div>

                    <div style={heroContent}>
                        <div style={topBadge}>HOOPCOLLECTOR ROSTER</div>
                        
                        <div style={nameRow}>
                            <h1 style={name}>{coach.display_name?.toUpperCase() ?? "UNNAMED"}</h1>
                            <div style={levelBadge}>{coach.coach_level ?? "-"}</div>
                        </div>

                        <div style={locationRow}>
                            <MapPin size={16} style={{ marginRight: 8, opacity: 0.4 }} />
                            <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>
                                {(coach.service_regions ?? []).join(" · ") || "활동 지역 미등록"}
                            </span>
                        </div>

                        <div style={infoGrid}>
                            <div style={infoItem}>
                                <div style={infoLabel}>PROGRAMS</div>
                                <div style={infoValue}>{(coach.available_classes ?? []).map(v => `CLASS ${v}`).join(" , ") || "-"}</div>
                            </div>
                        </div>

                        {!isEditing && (
                            <div style={ctaRow}>
                                <button style={primaryBtn} onClick={() => navigate('/dashboard')}>
                                    BOOK A CLASS
                                </button>
                                <button style={secondaryBtn}>
                                    SEND MESSAGE
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Details Section */}
                <div style={detailContent}>
                    <section className="card-minimal">
                        <h3 style={sectionTitle}>EXPERIENCE</h3>
                        {isEditing ? (
                            <textarea 
                                style={editTextArea} 
                                value={editData.experience_text}
                                onChange={e => setEditData(prev => ({ ...prev, experience_text: e.target.value }))}
                                placeholder="경력 사항을 입력해 주세요."
                            />
                        ) : (
                            <div style={bodyText}>{coach.experience_text || "등록된 경력 정보가 없습니다."}</div>
                        )}
                    </section>

                    <section className="card-minimal">
                        <h3 style={sectionTitle}>BIO</h3>
                        {isEditing ? (
                            <textarea 
                                style={{ ...editTextArea, minHeight: '200px' }} 
                                value={editData.bio_text}
                                onChange={e => setEditData(prev => ({ ...prev, bio_text: e.target.value }))}
                                placeholder="자기소개를 입력해 주세요."
                            />
                        ) : (
                            <div style={bodyText}>{coach.bio_text || "등록된 소개 글이 없습니다."}</div>
                        )}
                    </section>

                    {isEditing && (
                        <section className="card-minimal">
                            <h3 style={sectionTitle}>LOCATION SETTINGS</h3>
                            <div style={regionSelectorWrap}>
                                <div style={selectedRegionsRow}>
                                    {editData.service_regions.length === 0 ? (
                                        <span style={{ opacity: 0.4, fontSize: '0.85rem' }}>지역을 선택해 주세요 (최대 3개)</span>
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
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
};

/* Styles */
const pageWrap: React.CSSProperties = { color: "white", paddingBottom: "100px", maxWidth: '1200px', margin: '0 auto' };
const container: React.CSSProperties = { display: 'grid', gap: '4rem' };
const backBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontWeight: 900, fontSize: '0.75rem', letterSpacing: '0.1em' };

const editModeBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', padding: '10px 20px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 800, cursor: 'pointer', fontSize: '0.75rem', letterSpacing: '0.05em' };
const saveBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', padding: '10px 24px', borderRadius: '12px', background: 'white', color: 'black', border: 'none', fontWeight: 900, cursor: 'pointer', fontSize: '0.8rem' };
const cancelBtn: React.CSSProperties = { ...editModeBtn, color: 'rgba(255,255,255,0.4)' };

const heroLayout: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '4rem', alignItems: 'start' };
const photoSection: React.CSSProperties = { width: '100%' };
const photoWrap: React.CSSProperties = { width: '100%', aspectRatio: '1 / 1.2', borderRadius: '2px', overflow: 'hidden', background: '#0a0a0b' };
const photo: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'cover' };
const photoFallback: React.CSSProperties = { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: 900, color: 'rgba(255,255,255,0.05)' };

const heroContent: React.CSSProperties = { display: 'flex', flexDirection: 'column', paddingTop: '20px' };
const topBadge: React.CSSProperties = { fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)', marginBottom: '1.5rem' };
const nameRow: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' };
const name: React.CSSProperties = { fontSize: '4.5rem', fontWeight: 900, margin: 0, letterSpacing: '-0.04em', lineHeight: 1 };
const levelBadge: React.CSSProperties = { width: '70px', height: '70px', background: 'white', color: 'black', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '2rem' };

const locationRow: React.CSSProperties = { display: 'flex', alignItems: 'center', marginBottom: '3rem' };
const infoGrid: React.CSSProperties = { display: 'grid', gap: '2rem', marginBottom: '4rem' };
const infoItem: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '10px' };
const infoLabel: React.CSSProperties = { fontSize: '0.65rem', fontWeight: 900, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.15em' };
const infoValue: React.CSSProperties = { fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.01em' };

const ctaRow: React.CSSProperties = { display: 'flex', gap: '12px' };
const primaryBtn: React.CSSProperties = { flex: 1, padding: '20px', borderRadius: '2px', background: 'white', color: 'black', border: 'none', fontWeight: 900, fontSize: '1rem', cursor: 'pointer', letterSpacing: '0.05em' };
const secondaryBtn: React.CSSProperties = { flex: 1, padding: '20px', borderRadius: '2px', background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', letterSpacing: '0.05em' };

const detailContent: React.CSSProperties = { display: 'grid', gap: '20px' };
const sectionTitle: React.CSSProperties = { fontSize: '0.7rem', fontWeight: 900, color: 'rgba(255,255,255,0.3)', marginBottom: '2rem', textTransform: 'uppercase', letterSpacing: '0.2em' };
const bodyText: React.CSSProperties = { fontSize: '1.1rem', lineHeight: 1.8, color: 'rgba(255,255,255,0.7)', whiteSpace: 'pre-line', fontWeight: 500 };

const editTextArea: React.CSSProperties = { width: '100%', minHeight: '150px', padding: '1.5rem', borderRadius: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '1rem', lineHeight: 1.7, outline: 'none', fontFamily: 'inherit' };

const regionSelectorWrap: React.CSSProperties = { display: 'grid', gap: '16px' };
const selectedRegionsRow: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '10px', minHeight: '50px', padding: '12px', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)' };
const regionChipActive: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '8px 16px', borderRadius: '100px', background: 'white', color: 'black', fontSize: '0.85rem', fontWeight: 900, cursor: 'pointer' };
const allRegionsGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px', maxHeight: '200px', overflowY: 'auto' };
const regionOption: React.CSSProperties = { padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', textAlign: 'left' };
const regionOptionActive: React.CSSProperties = { ...regionOption, background: 'rgba(255,255,255,0.08)', border: '1px solid white', color: 'white' };
