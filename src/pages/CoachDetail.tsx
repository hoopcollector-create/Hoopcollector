import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { ArrowLeft, MapPin, Award, CheckCircle2, Calendar, MessageSquare, Star, Sparkles, ChevronRight } from "lucide-react";

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

export const CoachDetail = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [coach, setCoach] = useState<PublicCoach | null>(null);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState("");

    useEffect(() => {
        if (!slug) return;
        loadCoach(slug);
    }, [slug]);

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
            }
        } catch (e: any) {
            setMsg(e.message);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <div style={pageWrap}><div style={{ color: 'white', padding: 40 }}>불러오는 중...</div></div>;
    if (!coach) return <div style={pageWrap}><div style={{ color: 'white', padding: 40 }}>{msg || "코치 정보를 찾을 수 없습니다."}</div></div>;

    return (
        <div style={pageWrap}>
            <button onClick={() => navigate(-1)} style={backBtn}>
                <ArrowLeft size={18} style={{ marginRight: 8 }} /> 목록으로 돌아가기
            </button>

            <div style={container}>
                {/* Hero Card */}
                <section style={heroCard}>
                    <div style={photoWrap}>
                        {coach.photo_url ? (
                            <img src={coach.photo_url} alt={coach.display_name ?? ""} style={photo} />
                        ) : (
                            <div style={photoFallback}>HC</div>
                        )}
                    </div>

                    <div style={heroContent}>
                        <div style={topBadge}><Sparkles size={14} style={{ marginRight: 6 }} /> HOOPCOLLECTOR CERTIFIED</div>
                        
                        <div style={titleRow}>
                            <h1 style={name}>{coach.display_name ?? "Unnamed Coach"}</h1>
                            <div style={levelBadge}>{coach.coach_level ?? "-"}</div>
                        </div>

                        <div style={infoGrid}>
                            <div style={infoItem}>
                                <div style={infoLabel}>가능 클래스</div>
                                <div style={infoValue}>{(coach.available_classes ?? []).map(v => `Class ${v}`).join(", ") || "-"}</div>
                            </div>
                            <div style={infoItem}>
                                <div style={infoLabel}>활동 지역</div>
                                <div style={infoValue}>{(coach.service_regions ?? []).join(", ") || "-"}</div>
                            </div>
                        </div>

                        <div style={ctaRow}>
                            <button style={primaryBtn} onClick={() => navigate('/dashboard')}>
                                <Calendar size={18} style={{ marginRight: 8 }} /> 수업 신청하기
                            </button>
                            <button style={secondaryBtn}>
                                <MessageSquare size={18} style={{ marginRight: 8 }} /> 문의하기
                            </button>
                        </div>
                    </div>
                </section>

                {/* Details Section */}
                <div style={detailGrid}>
                    <section style={sectionCard}>
                        <h3 style={sectionTitle}><Award size={20} style={{ marginRight: 10, color: 'var(--color-primary)' }} /> 주요 경력</h3>
                        <div style={bodyText}>{coach.experience_text || "등록된 경력 정보가 없습니다."}</div>
                    </section>

                    <section style={sectionCard}>
                        <h3 style={sectionTitle}><CheckCircle2 size={20} style={{ marginRight: 10, color: '#4ade80' }} /> 자기소개</h3>
                        <div style={bodyText}>{coach.bio_text || "등록된 소개 글이 없습니다."}</div>
                    </section>
                </div>
            </div>
        </div>
    );
};

/* Styles */
const pageWrap: React.CSSProperties = { color: "white", paddingBottom: "4rem" };
const container: React.CSSProperties = { maxWidth: '1000px', margin: '0 auto', display: 'grid', gap: '2rem' };
const backBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', marginBottom: '1.5rem', fontWeight: 700 };

const heroCard: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(250px, 320px) 1fr', gap: '2.5rem', padding: '2.5rem', borderRadius: '32px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', alignItems: 'center' };
const photoWrap: React.CSSProperties = { width: '100%', aspectRatio: '1 / 1', borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' };
const photo: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'cover' };
const photoFallback: React.CSSProperties = { width: '100%', height: '100%', background: '#1f2937', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: 900, color: 'rgba(255,255,255,0.1)' };

const heroContent: React.CSSProperties = { display: 'flex', flexDirection: 'column' };
const topBadge: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '6px 14px', borderRadius: '99px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', width: 'fit-content', marginBottom: '1.5rem' };
const titleRow: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' };
const name: React.CSSProperties = { fontSize: '3rem', fontWeight: 950, margin: 0, letterSpacing: '-0.03em' };
const levelBadge: React.CSSProperties = { width: '60px', height: '60px', background: 'var(--color-primary)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 950, fontSize: '1.5rem' };

const infoGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' };
const infoItem: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '4px' };
const infoLabel: React.CSSProperties = { fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' };
const infoValue: React.CSSProperties = { fontSize: '1.1rem', fontWeight: 700 };

const ctaRow: React.CSSProperties = { display: 'flex', gap: '1rem' };
const primaryBtn: React.CSSProperties = { flex: 1, padding: '16px', borderRadius: '16px', background: 'white', color: 'black', border: 'none', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const secondaryBtn: React.CSSProperties = { flex: 1, padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };

const detailGrid: React.CSSProperties = { display: 'grid', gap: '1.5rem' };
const sectionCard: React.CSSProperties = { padding: '2rem', borderRadius: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' };
const sectionTitle: React.CSSProperties = { display: 'flex', alignItems: 'center', fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.25rem' };
const bodyText: React.CSSProperties = { fontSize: '1rem', lineHeight: 1.8, color: 'rgba(255,255,255,0.7)', whiteSpace: 'pre-line' };
