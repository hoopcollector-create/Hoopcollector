import React from 'react';
import { ClassType, Region } from '../../types/dashboard';

interface StudentRequestProps {
    classType: ClassType;
    setClassType: (v: ClassType) => void;
    tickets: Record<string, number>;
    date: string;
    setDate: (v: string) => void;
    time: string;
    setTime: (v: string) => void;
    regionId: string;
    setRegionId: (v: string) => void;
    regions: Region[];
    courtName: string;
    setCourtName: (v: string) => void;
    address: string;
    setAddress: (v: string) => void;
    note: string;
    setNote: (v: string) => void;
    submitRequest: () => Promise<void>;
    loading: boolean;
}

const CLASS_TYPES: ClassType[] = ["A", "B", "C"];

export const StudentRequest = ({
    classType, setClassType, tickets, date, setDate, time, setTime,
    regionId, setRegionId, regions, courtName, setCourtName,
    address, setAddress, note, setNote, submitRequest, loading
}: StudentRequestProps) => {
    const canRequest = (tickets[classType] ?? 0) > 0;

    return (
        <div style={{ display: 'grid', gap: 20 }}>
            <div>
                <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>수업 신청</h2>
                <p style={{ opacity: 0.6 }}>보유중인 티켓을 사용해 코치에게 수업 예약을 요청합니다.</p>
            </div>
            <div>
                <div style={sectionLabel}>수업 종류 선택</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    {CLASS_TYPES.map(t => (
                        <button key={t} onClick={() => setClassType(t)} style={classType === t ? tabOn : tabOff}>Class {t}</button>
                    ))}
                </div>
                <div style={{ marginTop: 8, fontSize: 13, opacity: 0.8 }}>보유 티켓: {tickets[classType] ?? 0}장</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
                <div><div style={sectionLabel}>날짜</div><input type="date" value={date} onChange={e => setDate(e.target.value)} style={input} /></div>
                <div><div style={sectionLabel}>시간</div><input type="time" value={time} onChange={e => setTime(e.target.value)} style={input} /></div>
            </div>
            <div>
                <div style={sectionLabel}>구/시 지역</div>
                <select value={regionId} onChange={e => setRegionId(e.target.value)} style={selectStyle}>
                    <option value="">선택</option>
                    {regions.map((r: Region) => <option key={r.id} value={r.id} style={{ background: '#2a2a2d' }}>{r.display_name}</option>)}
                </select>
            </div>
            <div>
                <div style={sectionLabel}>상세 코트이름 / 주소</div>
                <input placeholder="체육관 또는 코트 명" value={courtName} onChange={e => setCourtName(e.target.value)} style={input} />
                <input placeholder="도로명/지번 주소" value={address} onChange={e => setAddress(e.target.value)} style={{ ...input, marginTop: 10 }} />
            </div>
            <div><div style={sectionLabel}>메모 / 요구사항</div><input placeholder="초보입니다" value={note} onChange={e => setNote(e.target.value)} style={input} /></div>
            <button onClick={submitRequest} disabled={loading || !canRequest} style={(!canRequest || loading) ? { ...btnPrimary, opacity: 0.5 } : btnPrimary}>
                {loading ? "처리중..." : (canRequest ? "수업 신청하기 (티켓 1장 차감)" : "티켓이 부족합니다")}
            </button>
        </div>
    );
};

const input: React.CSSProperties = { 
    width: "100%", 
    padding: "14px", 
    borderRadius: 14, 
    border: "1px solid rgba(255,255,255,.12)", 
    background: "rgba(255,255,255,.1)", 
    color: "white", 
    outline: "none", 
    boxSizing: "border-box", 
    fontSize: 14,
    colorScheme: 'dark'
};

const selectStyle: React.CSSProperties = {
    ...input,
    background: "#2a2a2d", // Dark grey background
    appearance: "none", // Remove OS default styling
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
    backgroundSize: "16px",
    cursor: "pointer"
};

const btnPrimary: React.CSSProperties = { width: "100%", padding: "14px", borderRadius: 14, border: "none", background: "white", color: "black", cursor: "pointer", fontWeight: 800, fontSize: 15 };
const sectionLabel: React.CSSProperties = { fontSize: 12, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase", color: "rgba(255,255,255,.62)" };
const tabOn: React.CSSProperties = { padding: "12px 10px", borderRadius: 14, border: "none", background: "var(--color-primary)", color: "#ffffff", cursor: "pointer", fontWeight: 800, fontSize: 14 };
const tabOff: React.CSSProperties = { padding: "12px 10px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,.04)", color: "rgba(255,255,255,.5)", cursor: "pointer", fontWeight: 700, fontSize: 14 };
