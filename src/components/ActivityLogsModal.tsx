import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { History, X } from 'lucide-react';

interface ActivityLogsModalProps {
    userId: string;
    onClose: () => void;
}

export const ActivityLogsModal: React.FC<ActivityLogsModalProps> = ({ userId, onClose }) => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLogs();
    }, [userId]);

    async function loadLogs() {
        setLoading(true);
        const { data } = await supabase
            .from('activity_logs')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50);
        
        setLogs(data || []);
        setLoading(false);
    }

    return (
        <div style={modalOverlay} onClick={onClose}>
            <div style={modalContent} onClick={e => e.stopPropagation()}>
                <div style={header}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <History size={20} color="var(--color-primary)" />
                        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900 }}>XP / 포인트 내역</h2>
                    </div>
                    <button style={closeBtn} onClick={onClose}><X size={20} /></button>
                </div>

                <div style={listContainer}>
                    {loading ? (
                        <div style={emptyText}>내역을 불러오는 중...</div>
                    ) : logs.length === 0 ? (
                        <div style={emptyText}>활동 내역이 없습니다.</div>
                    ) : (
                        logs.map(log => (
                            <div key={log.id} style={logItem}>
                                <div style={logMain}>
                                    <div style={logDesc}>{log.description}</div>
                                    <div style={logDate}>{new Date(log.created_at).toLocaleString()}</div>
                                </div>
                                <div style={logValues}>
                                    {log.xp_amount > 0 && <span style={xpTag}>+{log.xp_amount} XP</span>}
                                    {log.xp_amount < 0 && <span style={{...xpTag, background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444'}}>{log.xp_amount} XP</span>}
                                    {log.point_amount > 0 && <span style={pointTag}>+{log.point_amount} P</span>}
                                    {log.point_amount < 0 && <span style={{...pointTag, background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444'}}>{log.point_amount} P</span>}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

// Styles
const modalOverlay: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(5px)' };
const modalContent: React.CSSProperties = { width: '100%', maxWidth: '400px', background: '#121214', borderRadius: '24px', padding: '24px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', maxHeight: '80vh' };
const header: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' };
const closeBtn: React.CSSProperties = { background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex' };

const listContainer: React.CSSProperties = { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '8px' };
const emptyText: React.CSSProperties = { textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '40px 0', fontSize: '0.9rem', fontWeight: 600 };

const logItem: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' };
const logMain: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '4px' };
const logDesc: React.CSSProperties = { fontSize: '0.85rem', fontWeight: 800, color: 'white' };
const logDate: React.CSSProperties = { fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700 };

const logValues: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' };
const xpTag: React.CSSProperties = { fontSize: '0.7rem', fontWeight: 900, color: 'var(--color-primary)', background: 'rgba(249, 115, 22, 0.1)', padding: '2px 6px', borderRadius: '4px' };
const pointTag: React.CSSProperties = { fontSize: '0.7rem', fontWeight: 900, color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', padding: '2px 6px', borderRadius: '4px' };
