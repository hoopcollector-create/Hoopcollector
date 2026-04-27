import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { Search, MapPin, Target, Sparkles, ChevronRight } from 'lucide-react';

type ClassType = "A" | "B" | "C";

type PublicCoach = {
    coach_id: string;
    slug: string;
    display_name: string | null;
    coach_level: ClassType | null;
    photo_url: string | null;
    experience_text: string | null;
    bio_text: string | null;
    service_regions: string[] | null;
    available_classes: string[] | null;
};

function levelOrder(level: ClassType | null) {
    if (level === "A") return 0;
    if (level === "B") return 1;
    if (level === "C") return 2;
    return 9;
}

export const CoachDirectory = () => {
    const [rows, setRows] = useState<PublicCoach[]>([]);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState("");
    const [search, setSearch] = useState("");
    const [selectedRegion, setSelectedRegion] = useState("전체");
    const [selectedClass, setSelectedClass] = useState("전체");
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        loadCoaches();
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    async function loadCoaches() {
        setLoading(true);
        setMsg("");
        try {
            const { data, error } = await supabase
                .from("public_coach_profiles")
                .select("coach_id,slug,display_name,coach_level,photo_url,experience_text,bio_text,service_regions,available_classes");

            if (error) throw error;

            const list = ((data ?? []) as PublicCoach[]).sort((a, b) => {
                const lv = levelOrder(a.coach_level) - levelOrder(b.coach_level);
                if (lv !== 0) return lv;
                return (a.display_name ?? "").localeCompare(a.display_name ?? "", "ko");
            });

            setRows(list);
        } catch (e: any) {
            setMsg(e.message);
        } finally {
            setLoading(false);
        }
    }

    const regionOptions = useMemo(() => {
        const set = new Set<string>();
        rows.forEach((row) => {
            (row.service_regions ?? []).forEach((region) => {
                const v = String(region || "").trim();
                if (v) set.add(v);
            });
        });
        return ["전체", ...Array.from(set).sort((a, b) => a.localeCompare(b, "ko"))];
    }, [rows]);

    const classOptions = useMemo(() => {
        const set = new Set<string>();
        rows.forEach((row) => {
            (row.available_classes ?? []).forEach((c) => {
                const v = String(c || "").trim();
                if (v) set.add(v);
            });
        });
        return ["전체", ...Array.from(set).sort()];
    }, [rows]);

    const filteredRows = useMemo(() => {
        const q = search.trim().toLowerCase();
        return rows.filter((row) => {
            const matchesRegion = selectedRegion === "전체" || (row.service_regions ?? []).includes(selectedRegion);
            if (!matchesRegion) return false;
            const matchesClass = selectedClass === "전체" || (row.available_classes ?? []).includes(selectedClass);
            if (!matchesClass) return false;
            if (!q) return true;
            const haystack = [
                row.display_name ?? "",
                row.experience_text ?? "",
                row.bio_text ?? "",
                ...(row.service_regions ?? []),
                ...(row.available_classes ?? []),
            ].join(" ").toLowerCase();
            return haystack.includes(q);
        });
    }, [rows, search, selectedRegion, selectedClass]);

    return (
        <div style={{ color: 'white', maxWidth: '1200px', margin: '0 auto', paddingBottom: '100px', padding: isMobile ? '0 16px' : '0' }}>
            {/* Hero Section */}
            <section style={hero}>
                <div style={heroBadge}>HOOPCOLLECTOR ROSTER</div>
                <h1 style={{ ...heroTitle, fontSize: isMobile ? '2.5rem' : '3.5rem' }}>FIND YOUR COACH</h1>
                <p style={heroDesc}>경력과 실력이 검증된 훕콜렉터의 코치진을 만나보세요.</p>

                <div style={searchPanel}>
                    <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                        <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="이름, 경력, 지역 검색"
                            style={searchInput}
                        />
                    </div>

                    <div style={filterBlock}>
                        <div style={filterHead}>LOCATIONS</div>
                        <div style={chipRow}>
                            {regionOptions.map((region) => (
                                <button key={region} onClick={() => setSelectedRegion(region)} style={selectedRegion === region ? chipOn : chipOff}>
                                    {region}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Coach List */}
            <section style={{ marginTop: isMobile ? '3rem' : '5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
                    <div>
                        <h2 style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 900 }}>COACHES</h2>
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem', fontWeight: 700 }}>{filteredRows.length} ACTIVE COACHES</p>
                    </div>
                </div>

                {loading ? (
                    <div style={emptyBox}>COLLECTING DATA...</div>
                ) : msg ? (
                    <div style={{ ...emptyBox, borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171' }}>ERROR: {msg}</div>
                ) : filteredRows.length === 0 ? (
                    <div style={emptyBox}>코치를 찾을 수 없습니다.</div>
                ) : (
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', 
                        gap: isMobile ? '16px' : '30px' 
                    }}>
                        {filteredRows.map((coach) => (
                            <Link key={coach.coach_id} to={`/coach-detail/${coach.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                <article className="card-minimal hover-lift" style={{ 
                                    padding: 0, 
                                    height: isMobile ? '450px' : 'auto', 
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    overflow: 'hidden'
                                }}>
                                    <div style={thumbWrap}>
                                        {coach.photo_url ? (
                                            <img src={coach.photo_url} alt={coach.display_name ?? ""} style={thumb} />
                                        ) : (
                                            <div style={thumbFallback}>HC</div>
                                        )}
                                        <div style={topBadgeRow}>
                                            <span style={levelBadge}>{coach.coach_level ?? "-"}</span>
                                        </div>
                                    </div>

                                    <div style={{ ...cardBody, flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <div style={coachName}>{coach.display_name ?? "UNNAMED"}</div>
                                        
                                        <div style={regionPills}>
                                            {(coach.service_regions ?? []).slice(0, 2).map((region) => (
                                                <span key={region} style={miniPill}><MapPin size={10} style={{ marginRight: 4, opacity: 0.5 }} /> {region}</span>
                                            ))}
                                        </div>

                                        <div style={line} />

                                        <div style={{ flex: 1, overflow: 'hidden' }}>
                                            <div style={infoLabel}>경력 / 소개</div>
                                            <div style={{ 
                                                fontSize: '0.85rem', 
                                                lineHeight: 1.5, 
                                                color: 'rgba(255,255,255,0.6)',
                                                display: '-webkit-box',
                                                WebkitLineClamp: isMobile ? 2 : 3,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden'
                                            }}>
                                                {coach.experience_text || coach.bio_text || "상세 프로필 참조"}
                                            </div>
                                        </div>

                                        <div style={{ ...viewMoreBtn, marginTop: 'auto', paddingTop: '16px' }}>
                                            VIEW PROFILE <ChevronRight size={14} style={{ marginLeft: 6, opacity: 0.5 }} />
                                        </div>
                                    </div>
                                </article>
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

/* Styles */
const hero: React.CSSProperties = { paddingBottom: '2rem' };
const heroBadge: React.CSSProperties = { fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)', marginBottom: '1rem' };
const heroTitle: React.CSSProperties = { fontWeight: 900, marginBottom: '0.5rem', letterSpacing: '-0.04em' };
const heroDesc: React.CSSProperties = { color: 'rgba(255,255,255,0.4)', fontSize: '1rem', lineHeight: 1.5, maxWidth: '700px', marginBottom: '2rem' };

const searchPanel: React.CSSProperties = { padding: '1.5rem', borderRadius: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' };
const searchInput: React.CSSProperties = { width: '100%', padding: '14px 14px 14px 44px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' };

const filterBlock: React.CSSProperties = { marginTop: '1.5rem' };
const filterHead: React.CSSProperties = { fontSize: '0.6rem', fontWeight: 900, color: 'rgba(255,255,255,0.3)', marginBottom: '0.8rem', letterSpacing: '0.1em' };
const chipRow: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '6px' };
const chipOn: React.CSSProperties = { padding: '6px 14px', borderRadius: '100px', background: 'white', color: 'black', border: 'none', fontSize: '0.75rem', fontWeight: 900, cursor: 'pointer' };
const chipOff: React.CSSProperties = { padding: '6px 14px', borderRadius: '100px', background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.06)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' };

const thumbWrap: React.CSSProperties = { position: 'relative', width: '100%', aspectRatio: '1 / 1', overflow: 'hidden', background: '#0a0a0b', flexShrink: 0 };
const thumb: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'cover' };
const thumbFallback: React.CSSProperties = { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 900, color: 'rgba(255,255,255,0.05)' };
const topBadgeRow: React.CSSProperties = { position: 'absolute', bottom: 12, right: 12 };
const levelBadge: React.CSSProperties = { width: '36px', height: '36px', background: 'white', color: 'black', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1rem' };

const cardBody: React.CSSProperties = { padding: '1.5rem' };
const coachName: React.CSSProperties = { fontSize: '1.25rem', fontWeight: 900, marginBottom: '0.4rem', letterSpacing: '-0.02em' };
const regionPills: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '1rem' };
const miniPill: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700 };
const line: React.CSSProperties = { height: '1px', background: 'rgba(255,255,255,0.05)', margin: '1rem 0' };
const infoLabel: React.CSSProperties = { color: 'rgba(255,255,255,0.3)', fontWeight: 900, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' };
const viewMoreBtn: React.CSSProperties = { fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.1em', color: 'white', display: 'flex', alignItems: 'center' };
const emptyBox: React.CSSProperties = { padding: '80px 0', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '24px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontWeight: 800, letterSpacing: '0.1em' };
