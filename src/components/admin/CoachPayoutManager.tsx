import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CreditCard, CheckCircle, XCircle, Clock, Search, ExternalLink, User, DollarSign, Wallet } from 'lucide-react';

interface PayoutRequest {
    id: string;
    coach_id: string;
    amount: number;
    account_number: string;
    bank_name: string;
    status: 'pending' | 'approved' | 'rejected';
    id_card_url: string;
    bank_book_url: string;
    id_verified: boolean;
    created_at: string;
    profiles: {
        display_name: string;
        email: string;
    };
}

export const CoachPayoutManager: React.FC = () => {
    const [requests, setRequests] = useState<PayoutRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ pending: 0, totalPaid: 0 });

    useEffect(() => {
        fetchPayouts();
    }, []);

    const fetchPayouts = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('coach_payout_info')
            .select(`
                *,
                profiles:user_id (display_name, email)
            `)
            .order('created_at', { ascending: false });

        if (data) {
            setRequests(data as any);
            const pending = data.filter(r => r.status === 'pending').length;
            const total = data.filter(r => r.status === 'approved').reduce((acc, r) => acc + r.amount, 0);
            setStats({ pending, totalPaid: total });
        }
        setLoading(false);
    };

    const handleAction = async (id: string, status: 'approved' | 'rejected') => {
        const { error } = await supabase
            .from('coach_payout_info')
            .update({ status })
            .eq('id', id);

        if (!error) {
            fetchPayouts();
        }
    };

    return (
        <div style={container}>
            <div style={headerRow}>
                <h2 style={title}>코치 정산 및 본인인증 관리</h2>
                <div style={statsRow}>
                    <div style={statItem}>
                        <Clock size={16} color="var(--accent-primary)" />
                        <span>대기 중: {stats.pending}건</span>
                    </div>
                    <div style={statItem}>
                        <CheckCircle size={16} color="#4ade80" />
                        <span>총 정산액: {stats.totalPaid.toLocaleString()}원</span>
                    </div>
                </div>
            </div>

            <div style={tableWrapper}>
                <table style={table}>
                    <thead>
                        <tr style={theadRow}>
                            <th style={th}>코치 정보</th>
                            <th style={th}>계좌 정보</th>
                            <th style={th}>정산 금액</th>
                            <th style={th}>서류 확인</th>
                            <th style={th}>상태</th>
                            <th style={th}>관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={emptyCell}>정산 요청 내역이 없습니다.</td>
                            </tr>
                        ) : (
                            requests.map(req => (
                                <tr key={req.id} style={tr}>
                                    <td style={td}>
                                        <div style={coachInfo}>
                                            <div style={coachName}>{req.profiles?.display_name || '코치'}</div>
                                            <div style={coachEmail}>{req.profiles?.email}</div>
                                        </div>
                                    </td>
                                    <td style={td}>
                                        <div style={bankInfo}>
                                            {req.bank_name} <br/>
                                            <span style={accNum}>{req.account_number}</span>
                                        </div>
                                    </td>
                                    <td style={td}>
                                        <div style={amountText}>{req.amount.toLocaleString()}원</div>
                                    </td>
                                    <td style={td}>
                                        <div style={docsRow}>
                                            <a href={req.id_card_url} target="_blank" rel="noreferrer" style={docLink}>신분증 <ExternalLink size={12} /></a>
                                            <a href={req.bank_book_url} target="_blank" rel="noreferrer" style={docLink}>통장사본 <ExternalLink size={12} /></a>
                                        </div>
                                    </td>
                                    <td style={td}>
                                        <span style={{ 
                                            ...statusTag, 
                                            backgroundColor: req.status === 'approved' ? 'rgba(74, 222, 128, 0.1)' : req.status === 'rejected' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 107, 0, 0.1)',
                                            color: req.status === 'approved' ? '#4ade80' : req.status === 'rejected' ? '#ef4444' : 'var(--accent-primary)'
                                        }}>
                                            {req.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={td}>
                                        {req.status === 'pending' && (
                                            <div style={actionRow}>
                                                <button onClick={() => handleAction(req.id, 'approved')} style={approveBtn}><CheckCircle size={14} /> 승인</button>
                                                <button onClick={() => handleAction(req.id, 'rejected')} style={rejectBtn}><XCircle size={14} /> 거절</button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const container: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '24px' };
const headerRow: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const title: React.CSSProperties = { margin: 0, fontSize: '1.25rem', fontWeight: 800 };
const statsRow: React.CSSProperties = { display: 'flex', gap: '20px' };
const statItem: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' };

const tableWrapper: React.CSSProperties = { overflowX: 'auto', borderRadius: '16px', border: '1px solid var(--border-subtle)' };
const table: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' };
const theadRow: React.CSSProperties = { background: 'var(--bg-surface-L2)', borderBottom: '1px solid var(--border-subtle)' };
const th: React.CSSProperties = { padding: '16px', color: 'var(--text-muted)', fontWeight: 600 };
const tr: React.CSSProperties = { borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.2s' };
const td: React.CSSProperties = { padding: '16px', verticalAlign: 'middle' };

const coachInfo: React.CSSProperties = { display: 'flex', flexDirection: 'column' };
const coachName: React.CSSProperties = { fontWeight: 700, color: 'var(--text-primary)' };
const coachEmail: React.CSSProperties = { fontSize: '12px', color: 'var(--text-muted)' };

const bankInfo: React.CSSProperties = { fontWeight: 600, color: 'var(--text-secondary)' };
const accNum: React.CSSProperties = { fontSize: '12px', opacity: 0.6 };

const amountText: React.CSSProperties = { fontWeight: 800, color: 'var(--accent-primary)' };

const docsRow: React.CSSProperties = { display: 'flex', gap: '12px' };
const docLink: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-secondary)', textDecoration: 'none', fontSize: '12px', fontWeight: 600 };

const statusTag: React.CSSProperties = { padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 };

const actionRow: React.CSSProperties = { display: 'flex', gap: '8px' };
const approveBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', border: 'none', background: 'var(--accent-primary)', color: 'white', fontSize: '12px', fontWeight: 700, cursor: 'pointer' };
const rejectBtn: React.CSSProperties = { ...approveBtn, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' };

const emptyCell: React.CSSProperties = { padding: '60px', textAlign: 'center', color: 'var(--text-muted)' };
