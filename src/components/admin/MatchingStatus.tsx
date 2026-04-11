import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { MapPin, User, Users, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export const MatchingStatus = () => {
    const [matches, setMatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedRegion, setSelectedRegion] = useState<string>("전체");

    useEffect(() => {
        loadMatches();
    }, []);

    async function loadMatches() {
        setLoading(true);
        // 1. Fetch class requests with basic info
        const { data: reqs } = await supabase
            .from('class_requests')
            .select('*')
            .order('created_at', { ascending: false });

        if (!reqs) {
            setLoading(false);
            return;
        }

        // 2. Fetch involved profiles (Students & Coaches)
        const userIds = Array.from(new Set([
            ...reqs.map(r => r.student_id),
            ...reqs.map(r => r.coach_id)
        ]));

        const { data: profs } = await supabase.from('profiles').select('id, name, phone').in('id', userIds);
        const profMap = (profs || []).reduce((acc: any, p: any) => { acc[p.id] = p; return acc; }, {});

        const enriched = reqs.map(r => ({
            ...r,
            student_name: profMap[r.student_id]?.name || '익명 학생',
            coach_name: profMap[r.coach_id]?.name || '미배정 코치',
            // Simple region extraction from address
            region: r.address?.split(' ')[0] || '미정'
        }));

        setMatches(enriched);
        setLoading(false);
    }

    const regions = ["전체", ...Array.from(new Set(matches.map(m => m.region)))];
    const filteredMatches = selectedRegion === "전체" ? matches : matches.filter(m => m.region === selectedRegion);

    return (
        <div style={{ color: 'white' }}>
            <div style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>지역별 매칭 및 수업 현황</h2>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>전국 지역별 학생-코치 매칭 상태를 실시간으로 모니터링합니다.</p>
            </div>

            {/* Region Filter Chips */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '2rem' }}>
                {regions.map(r => (
                    <button 
                        key={r}
                        onClick={() => setSelectedRegion(r)}
                        style={{
                            ...chipStyle,
                            background: selectedRegion === r ? 'var(--color-coach)' : 'rgba(255,255,255,0.05)',
                            color: selectedRegion === r ? 'white' : 'rgba(255,255,255,0.5)',
                            borderColor: selectedRegion === r ? 'var(--color-coach)' : 'rgba(255,255,255,0.1)'
                        }}
                    >
                        {r}
                    </button>
                ))}
            </div>

            {loading ? <div style={{ opacity: 0.5 }}>로딩 중...</div> : (
                <div style={tableWrap}>
                    <table style={table}>
                        <thead>
                            <tr style={headerRow}>
                                <th style={th}>매칭 일시</th>
                                <th style={th}>지역</th>
                                <th style={th}>학생</th>
                                <th style={th}>담당 코치</th>
                                <th style={th}>진행 상태</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMatches.length === 0 ? (
                                <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>해당 지역에 진행 중인 수업이 없습니다.</td></tr>
                            ) : filteredMatches.map(m => (
                                <tr key={m.id} style={row}>
                                    <td style={td}>{new Date(m.created_at).toLocaleDateString()}</td>
                                    <td style={td}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <MapPin size={14} style={{ color: 'var(--color-coach)' }} />
                                            {m.region}
                                        </div>
                                    </td>
                                    <td style={td}>
                                        <div style={{ fontWeight: 700 }}>{m.student_name}</div>
                                    </td>
                                    <td style={td}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Users size={14} style={{ opacity: 0.5 }} />
                                            <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{m.coach_name}</span>
                                        </div>
                                    </td>
                                    <td style={td}>
                                        <StatusBadge status={m.status} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

const StatusBadge = ({ status }: { status: string }) => {
    const config: any = {
        requested: { label: '대기 중', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
        accepted: { label: '수업 진행중', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
        completed: { label: '완료됨', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
        cancelled: { label: '취소됨', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' }
    };
    const s = config[status] || { label: status, color: '#fff', bg: 'rgba(255,255,255,0.1)' };
    return (
        <span style={{ 
            padding: '4px 12px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 800,
            background: s.bg, color: s.color, border: `1px solid ${s.color}22`
        }}>
            {s.label}
        </span>
    );
};

const chipStyle: React.CSSProperties = { padding: '8px 16px', borderRadius: '100px', border: '1px solid', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' };
const tableWrap: React.CSSProperties = { background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' };
const table: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', textAlign: 'left' };
const th: React.CSSProperties = { padding: '16px 20px', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', opacity: 0.4, borderBottom: '1px solid rgba(255,255,255,0.05)' };
const td: React.CSSProperties = { padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.9rem' };
const headerRow: React.CSSProperties = { background: 'rgba(255,255,255,0.02)' };
const row: React.CSSProperties = { transition: 'background 0.2s' };
