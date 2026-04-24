import React from 'react';
import { Profile, TicketRow, PointsStats, PositionType } from '../../types/dashboard';
import { ImageUploadField } from '../admin/ImageUploadField';

interface StudentHomeProps {
    tickets: Record<string, number>;
    points: PointsStats | null;
    activeCount: number;
    editProfile: boolean;
    setEditProfile: (v: boolean) => void;
    name: string;
    setName: (v: string) => void;
    birthday: string;
    setBirthday: (v: string) => void;
    position: PositionType;
    setPosition: (v: PositionType) => void;
    exp: string;
    setExp: (v: string) => void;
    phone: string;
    setPhone: (v: string) => void;
    saveProfile: () => Promise<void>;
    ageText: string;
    loading: boolean;
    photoUrl: string;
    setPhotoUrl: (v: string) => void;
    recentJournals?: any[];
}

export const StudentHome = ({
    tickets, points, activeCount, editProfile, setEditProfile, 
    name, setName, birthday, setBirthday, position, setPosition, 
    exp, setExp, phone, setPhone, saveProfile, ageText, loading,
    photoUrl, setPhotoUrl, recentJournals 
}: StudentHomeProps) => {
    return (
        <div>
            <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 16 }}>내 계정 및 프로필</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 20 }}>
                <div style={cardMini}>
                    <div style={cardLabel}>예약 진행 중</div>
                    <div style={cardValue}>{activeCount}</div>
                </div>
                <div style={cardMini}>
                    <div style={cardLabel}>Class A 티켓</div>
                    <div style={cardValue}>{tickets.A}</div>
                </div>
                <div style={cardMini}>
                    <div style={cardLabel}>Class B 티켓</div>
                    <div style={cardValue}>{tickets.B}</div>
                </div>
                <div style={cardMini}>
                    <div style={cardLabel}>Class C 티켓</div>
                    <div style={cardValue}>{tickets.C}</div>
                </div>
            </div>

            <div style={{ background: "rgba(255,255,255,.03)", padding: 24, borderRadius: 20, border: "1px solid rgba(255,255,255,.08)" }}>
                {!editProfile ? (
                    <div style={{ 
                        display: 'flex', 
                        flexDirection: window.innerWidth <= 600 ? 'column' : 'row', 
                        gap: window.innerWidth <= 600 ? 24 : 32, 
                        alignItems: window.innerWidth <= 600 ? 'center' : 'center' 
                    }}>
                        <div style={{ ...photoWrap, flexShrink: 0 }}>
                            {photoUrl ? (
                                <img src={photoUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={photoFallback}>HC</div>
                            )}
                        </div>
                        <div style={{ display: 'grid', gap: 12, width: '100%' }}>
                        <InfoLine label="이름" value={name || "-"} />
                        <InfoLine label="생일/나이" value={`${birthday || "-"} (${ageText})`} />
                        <InfoLine label="전화번호" value={phone || "-"} />
                        <InfoLine label="포지션" value={position || "-"} />
                        <InfoLine label="농구 경력" value={exp ? `${exp}년` : "-"} />
                            <button style={{ ...btnPrimary, marginTop: 12, background: 'rgba(255,255,255,0.1)', color: 'white' }} onClick={() => setEditProfile(true)}>프로필 수정</button>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: 24 }}>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: 20, borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
                            <ImageUploadField 
                                label="프로필 사진" 
                                value={photoUrl} 
                                onChange={setPhotoUrl}
                                helperText="선명한 정면 사진을 권장합니다."
                            />
                        </div>
                        <div style={{ display: 'grid', gap: 12 }}>
                        <div><div style={sectionLabel}>Name</div><input value={name} onChange={e=>setName(e.target.value)} style={input}/></div>
                        <div><div style={sectionLabel}>Phone</div><input value={phone} onChange={e=>setPhone(e.target.value)} style={input}/></div>
                        <div><div style={sectionLabel}>Birthday</div><input type="date" value={birthday} onChange={e=>setBirthday(e.target.value)} style={input}/></div>
                        <div><div style={sectionLabel}>Position</div>
                            <select value={position} onChange={e=>setPosition(e.target.value as any)} style={input}>
                                <option value="G">G (Guard)</option><option value="F">F (Forward)</option><option value="C">C (Center)</option>
                            </select>
                        </div>
                        <div><div style={sectionLabel}>Experience (Yrs)</div><input value={exp} onChange={e=>setExp(e.target.value)} style={input}/></div>
                        
                        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                            <button style={btnPrimary} onClick={saveProfile} disabled={loading}>{loading ? "Saving..." : "저장하기"}</button>
                            <button style={{ ...btnPrimary, background: "transparent", color: "white", border: "1px solid rgba(255,255,255,.1)" }} onClick={() => setEditProfile(false)}>취소</button>
                        </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Recent Journals History Section */}
            {!editProfile && recentJournals && recentJournals.length > 0 && (
                <div style={{ marginTop: 40 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>나의 성장 히스토리</h2>
                        <span style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 800 }}>전체 보기</span>
                    </div>
                    <div style={{ 
                        display: 'flex', 
                        gap: 16, 
                        overflowX: 'auto', 
                        paddingBottom: 16,
                        maskImage: 'linear-gradient(to right, black 85%, transparent 100%)'
                    }}>
                        {recentJournals.map((j) => (
                            <div key={j.id} style={journalCard}>
                                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                                    <div style={journalThumb}>
                                        {j.visual_log_url ? (
                                            <img src={j.visual_log_url} alt="Sketch" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ opacity: 0.2 }}>No Sketch</div>
                                        )}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>{new Date(j.class_requests?.requested_start).toLocaleDateString()}</div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>Session #{j.session_number}</div>
                                    </div>
                                </div>
                                <p style={{ 
                                    fontSize: '0.85rem', 
                                    opacity: 0.8, 
                                    lineHeight: 1.5, 
                                    height: '3em', 
                                    overflow: 'hidden', 
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    marginBottom: 12
                                }}>
                                    {j.coach_feedback}
                                </p>
                                <a href={`/journal/${j.request_id}`} style={{ textDecoration: 'none' }}>
                                    <button style={viewBtn}>피드백 확인</button>
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const journalCard: React.CSSProperties = { 
    minWidth: '240px', 
    maxWidth: '240px', 
    padding: '16px', 
    background: 'rgba(255,255,255,0.03)', 
    borderRadius: '20px', 
    border: '1px solid rgba(255,255,255,0.05)',
    flexShrink: 0
};

const journalThumb: React.CSSProperties = { 
    width: '44px', 
    height: '44px', 
    borderRadius: '10px', 
    background: '#000', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    fontSize: '0.6rem',
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.1)'
};

const viewBtn: React.CSSProperties = { 
    width: '100%', 
    padding: '8px', 
    borderRadius: '10px', 
    background: 'rgba(255,255,255,0.05)', 
    color: 'white', 
    border: 'none', 
    fontSize: '0.8rem', 
    fontWeight: 800,
    cursor: 'pointer'
};

const InfoLine = ({ label, value }: { label: string, value: string }) => (
    <div style={{ 
        display: 'grid', 
        gridTemplateColumns: window.innerWidth <= 400 ? '1fr' : '100px 1fr', 
        gap: window.innerWidth <= 400 ? 2 : 12,
        fontSize: 14 
    }}>
        <div style={{ opacity: 0.6, fontWeight: 700 }}>{label}</div>
        <div style={{ fontWeight: 600, wordBreak: 'break-all' }}>{value}</div>
    </div>
);

const cardMini: React.CSSProperties = { padding: 14, borderRadius: 14, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)" };
const cardLabel: React.CSSProperties = { fontSize: 12, opacity: 0.6 };
const cardValue: React.CSSProperties = { fontSize: 24, fontWeight: 800 };
const input: React.CSSProperties = { width: "100%", padding: "14px", borderRadius: 14, border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.07)", color: "white", outline: "none", boxSizing: "border-box", fontSize: 14 };
const btnPrimary: React.CSSProperties = { width: "100%", padding: "14px", borderRadius: 14, border: "none", background: "white", color: "black", cursor: "pointer", fontWeight: 800, fontSize: 15 };
const sectionLabel: React.CSSProperties = { fontSize: 12, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase", color: "rgba(255,255,255,.62)" };

const photoWrap: React.CSSProperties = { width: '120px', height: '120px', borderRadius: '24px', overflow: 'hidden', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' };
const photoFallback: React.CSSProperties = { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 900, color: 'rgba(255,255,255,0.1)' };
