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

function truncate(text: string | null | undefined, max = 80) {
    if (!text) return "";
    if (text.length <= max) return text;
    return text.slice(0, max).trim() + "…";
}

export const CoachDirectory = () => {
    const [rows, setRows] = useState<PublicCoach[]>([]);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState("");

    const [search, setSearch] = useState("");
    const [selectedRegion, setSelectedRegion] = useState("전체");
    const [selectedClass, setSelectedClass] = useState("전체");

    useEffect(() => {
        loadCoaches();
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
        <div style={{ color: 'white', maxWidth: '1200px', margin: '0 auto', paddingBottom: '100px' }}>
            {/* Hero Section */}
            <section style={hero}>
                <div style={heroBadge}>HOOPCOLLECTOR ROSTER</div>
                <h1 style={heroTitle}>FIND YOUR COACH</h1>
                <p style={heroDesc}>경력과 실력이 검증된 훕콜렉터의 코치진을 만나보세요. 원하는 지역과 레벨에 맞춰 최적의 매칭을 제공합니다.</p>

                <div style={searchPanel}>
                    <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                        <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="이름, 경력, 지역 등으로 검색하세요."
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

                    <div style={filterBlock}>
                        <div style={filterHead}>PROGRAMS</div>
                        <div style={chipRow}>
                            {classOptions.map((cls) => (
                                <button key={cls} onClick={() => setSelectedClass(cls)} style={selectedClass === cls ? chipOn : chipOff}>
                                    {cls === "전체" ? "ALL" : `CLASS ${cls}`}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Coach List */}
            <section style={{ marginTop: '5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
                    <div>
                        <h2 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.02e,' }}>COACHES</h2>
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '1rem', fontWeight: 700 }}>{filteredRows.length} ACTIVE COACHES</p>
                    </div>
                </div>

                {loading ? (
                    <div style={emptyBox}>COLLECTING DATA...</div>
                ) : msg ? (
                    <div style={{ ...emptyBox, borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171' }}>ERROR: {msg}</div>
                ) : filteredRows.length === 0 ? (
                    <div style={emptyBox}>코치를 찾을 수 없습니다.</div>
                ) : (
                    <div className="coach-grid">
                        {filteredRows.map((coach) => (
                            <Link key={coach.coach_id} to={`/coach-detail/${coach.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                <article className="card-minimal hover-lift" style={{ padding: 0, height: '100%', cursor: 'pointer' }}>
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

                                    <div style={cardBody}>
                                        <div style={coachName}>{coach.display_name ?? "UNNAMED"}</div>
                                        
                                        <div style={regionPills}>
                                            {(coach.service_regions ?? []).slice(0, 3).map((region) => (
                                                <span key={region} style={miniPill}><MapPin size={10} style={{ marginRight: 4, opacity: 0.5 }} /> {region}</span>
                                            ))}
                                        </div>

                                        <div style={line} />

                                        <div style={infoList}>
                                            <div style={infoRow}>
                                                <div style={infoLabel}>경력</div>
                                                <div style={infoValue}>{truncate(coach.experience_text, 50) || "상세 프로필 참조"}</div>
                                            </div>
                                        </div>

                                        <div style={viewMoreBtn}>VIEW PROFILE <ChevronRight size={14} style={{ marginLeft: 6, opacity: 0.5 }} /></div>
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
const hero: React.CSSProperties = { paddingBottom: '3rem' };
const heroBadge: React.CSSProperties = { fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)', marginBottom: '1.5rem' };
const heroTitle: React.CSSProperties = { fontSize: '3.5rem', fontWeight: 900, marginBottom: '1rem', letterSpacing: '-0.04em' };
const heroDesc: React.CSSProperties = { color: 'rgba(255,255,255,0.4)', fontSize: '1.2rem', lineHeight: 1.6, maxWidth: '700px', marginBottom: '3rem' };

const searchPanel: React.CSSProperties = { padding: '2rem', borderRadius: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' };
const searchInput: React.CSSProperties = { width: '100%', padding: '18px 20px 18px 50px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: '1rem', outline: 'none' };

const filterBlock: React.CSSProperties = { marginTop: '2rem' };
const filterHead: React.CSSProperties = { fontSize: '0.65rem', fontWeight: 900, color: 'rgba(255,255,255,0.3)', marginBottom: '1rem', letterSpacing: '0.15em' };
const chipRow: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '8px' };
const chipOn: React.CSSProperties = { padding: '8px 18px', borderRadius: '100px', background: 'white', color: 'black', border: 'none', fontSize: '0.8rem', fontWeight: 900, cursor: 'pointer' };
const chipOff: React.CSSProperties = { padding: '8px 18px', borderRadius: '100px', background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.06)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' };

const thumbWrap: React.CSSProperties = { position: 'relative', width: '100%', aspectRatio: '1 / 1', overflow: 'hidden', background: '#0a0a0b' };
const thumb: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'cover' };
const thumbFallback: React.CSSProperties = { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 900, color: 'rgba(255,255,255,0.05)' };
const topBadgeRow: React.CSSProperties = { position: 'absolute', bottom: 20, right: 20 };
const levelBadge: React.CSSProperties = { width: '44px', height: '44px', background: 'white', color: 'black', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.2rem' };

const cardBody: React.CSSProperties = { padding: '2rem' };
const coachName: React.CSSProperties = { fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.6rem', letterSpacing: '-0.02em' };
const regionPills: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '1.5rem' };
const miniPill: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700 };
const line: React.CSSProperties = { height: '1px', background: 'rgba(255,255,255,0.05)', margin: '1.5rem 0' };
const infoList: React.CSSProperties = { marginBottom: '2rem' };
const infoRow: React.CSSProperties = { fontSize: '0.9rem', lineHeight: 1.6 };
const infoLabel: React.CSSProperties = { color: 'rgba(255,255,255,0.3)', fontWeight: 900, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' };
const infoValue: React.CSSProperties = { color: 'rgba(255,255,255,0.6)', fontWeight: 500 };
const viewMoreBtn: React.CSSProperties = { fontSize: '0.75rem', fontWeight: 900, letterSpacing: '0.1em', color: 'white', display: 'flex', alignItems: 'center' };
const emptyBox: React.CSSProperties = { padding: '100px 0', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '24px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontWeight: 800, letterSpacing: '0.1em' };
