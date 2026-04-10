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
        <div style={{ color: 'white' }}>
            {/* Hero Section */}
            <section style={hero}>
                <div style={heroBadge}><Sparkles size={14} style={{ marginRight: 6 }} /> HOOPCOLLECTOR COACH</div>
                <h1 style={heroTitle}>전문 코치 찾기</h1>
                <p style={heroDesc}>경력과 실력이 검증된 훕콜렉터의 코치진을 만나보세요. 원하는 지역과 레벨에 맞춰 최적의 매칭을 제공합니다.</p>

                <div style={searchPanel}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="코치 이름, 소개, 경력으로 검색"
                            style={searchInput}
                        />
                    </div>

                    <div style={filterBlock}>
                        <div style={filterHead}>활동 지역</div>
                        <div style={chipRow}>
                            {regionOptions.map((region) => (
                                <button key={region} onClick={() => setSelectedRegion(region)} style={selectedRegion === region ? chipOn : chipOff}>
                                    {region}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={filterBlock}>
                        <div style={filterHead}>교육 클래스</div>
                        <div style={chipRow}>
                            {classOptions.map((cls) => (
                                <button key={cls} onClick={() => setSelectedClass(cls)} style={selectedClass === cls ? chipOn : chipOff}>
                                    {cls === "전체" ? "전체" : `Class ${cls}`}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Coach List */}
            <section style={{ marginTop: '3rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 900 }}>Coach List</h2>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>총 {filteredRows.length}명의 코치를 찾았습니다.</p>
                    </div>
                </div>

                {loading ? (
                    <div style={emptyBox}>데이터를 불러오는 중입니다...</div>
                ) : msg ? (
                    <div style={{ ...emptyBox, borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171' }}>오류 발생: {msg}</div>
                ) : filteredRows.length === 0 ? (
                    <div style={emptyBox}>조건에 맞는 코치가 없습니다. 다른 필터를 선택해 보세요.</div>
                ) : (
                    <div style={gridStyle}>
                        {filteredRows.map((coach) => (
                            <Link key={coach.coach_id} to={`/coach-detail/${coach.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                <article style={card}>
                                    <div style={thumbWrap}>
                                        {coach.photo_url ? (
                                            <img src={coach.photo_url} alt={coach.display_name ?? ""} style={thumb} />
                                        ) : (
                                            <div style={thumbFallback}>HC</div>
                                        )}
                                        <div style={thumbOverlay} />
                                        <div style={topBadgeRow}>
                                            <span style={coachChip}>Coach</span>
                                            <span style={levelBadge}>{coach.coach_level ?? "-"}</span>
                                        </div>
                                    </div>

                                    <div style={cardBody}>
                                        <div style={coachName}>{coach.display_name ?? "Unnamed Coach"}</div>
                                        
                                        <div style={regionPills}>
                                            {(coach.service_regions ?? []).slice(0, 2).map((region) => (
                                                <span key={region} style={miniPill}><MapPin size={10} style={{ marginRight: 4 }} /> {region}</span>
                                            ))}
                                            {(coach.service_regions ?? []).length > 2 && (
                                                <span style={miniPillMuted}>+ {(coach.service_regions ?? []).length - 2}</span>
                                            )}
                                        </div>

                                        <div style={line} />

                                        <div style={infoList}>
                                            <div style={infoRow}>
                                                <div style={infoLabel}>클래스</div>
                                                <div style={infoValue}>{(coach.available_classes ?? []).map(v => `Class ${v}`).join(", ") || "-"}</div>
                                            </div>
                                            <div style={infoRow}>
                                                <div style={infoLabel}>경력</div>
                                                <div style={infoValue}>{truncate(coach.experience_text, 40) || "-"}</div>
                                            </div>
                                        </div>

                                        <button style={detailBtn}>프로필 상세보기 <ChevronRight size={14} style={{ marginLeft: 4 }} /></button>
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
const hero: React.CSSProperties = { padding: '2rem', borderRadius: '24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' };
const heroBadge: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '6px 12px', borderRadius: '99px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-primary)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1rem' };
const heroTitle: React.CSSProperties = { fontSize: '2.5rem', fontWeight: 950, marginBottom: '0.5rem', letterSpacing: '-0.02em' };
const heroDesc: React.CSSProperties = { color: 'rgba(255,255,255,0.6)', fontSize: '1rem', lineHeight: 1.6, maxWidth: '600px', marginBottom: '2rem' };

const searchPanel: React.CSSProperties = { background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' };
const searchInput: React.CSSProperties = { width: '100%', padding: '14px 14px 14px 44px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', boxSizing: 'border-box', outline: 'none' };

const filterBlock: React.CSSProperties = { marginTop: '1.5rem' };
const filterHead: React.CSSProperties = { fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '0.75rem', letterSpacing: '0.05em' };
const chipRow: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '8px' };
const chipOn: React.CSSProperties = { padding: '8px 16px', borderRadius: '99px', background: 'white', color: '#000000', border: 'none', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer' };
const chipOff: React.CSSProperties = { padding: '8px 16px', borderRadius: '99px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' };

const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' };
const card: React.CSSProperties = { borderRadius: '22px', overflow: 'hidden', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', transition: 'all 0.3s ease', cursor: 'pointer', height: '100%' };
const thumbWrap: React.CSSProperties = { position: 'relative', width: '100%', aspectRatio: '4 / 3', overflow: 'hidden' };
const thumb: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'cover' };
const thumbFallback: React.CSSProperties = { width: '100%', height: '100%', background: '#1f2937', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 900, color: 'rgba(255,255,255,0.2)' };
const thumbOverlay: React.CSSProperties = { position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.6))' };
const topBadgeRow: React.CSSProperties = { position: 'absolute', top: 12, left: 12, right: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const coachChip: React.CSSProperties = { padding: '4px 8px', background: 'rgba(0,0,0,0.5)', borderRadius: '6px', color: 'white', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', backdropFilter: 'blur(4px)' };
const levelBadge: React.CSSProperties = { width: '32px', height: '32px', background: 'rgba(59, 130, 246, 0.8)', borderRadius: '8px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.9rem' };

const cardBody: React.CSSProperties = { padding: '1.25rem' };
const coachName: React.CSSProperties = { fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' };
const regionPills: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '1rem' };
const miniPill: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '4px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', fontWeight: 700 };
const miniPillMuted: React.CSSProperties = { ...miniPill, opacity: 0.5 };
const line: React.CSSProperties = { height: '1px', background: 'rgba(255,255,255,0.1)', margin: '1rem 0' };
const infoList: React.CSSProperties = { display: 'grid', gap: '0.75rem', marginBottom: '1.25rem' };
const infoRow: React.CSSProperties = { display: 'grid', gridTemplateColumns: '60px 1fr', gap: '8px', fontSize: '0.85rem' };
const infoLabel: React.CSSProperties = { color: 'rgba(255,255,255,0.4)', fontWeight: 700 };
const infoValue: React.CSSProperties = { color: 'rgba(255,255,255,0.9)', fontWeight: 600 };
const detailBtn: React.CSSProperties = { width: '100%', padding: '12px', background: 'rgba(255,255,255,0.08)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const emptyBox: React.CSSProperties = { padding: '3rem', borderRadius: '24px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontWeight: 600 };
