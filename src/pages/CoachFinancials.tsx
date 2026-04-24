import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Wallet, CreditCard, Clock, CheckCircle, AlertCircle, ArrowLeft, ArrowUpRight, FileText, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ImageUploadField } from '../components/admin/ImageUploadField';

interface PayoutRecord {
    id: string;
    amount: number;
    status: 'pending' | 'approved' | 'rejected';
    bank_name: string;
    account_number: string;
    created_at: string;
}

export const CoachFinancials = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [history, setHistory] = useState<PayoutRecord[]>([]);

    // Form states
    const [amount, setAmount] = useState('');
    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [idCardUrl, setIdCardUrl] = useState('');
    const [bankBookUrl, setBankBookUrl] = useState('');

    useEffect(() => {
        loadFinancialData();
    }, []);

    async function loadFinancialData() {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const [pRes, hRes] = await Promise.all([
                supabase.from('profiles').select('*').eq('id', session.user.id).single(),
                supabase.from('coach_payout_info').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false })
            ]);

            setProfile(pRes.data);
            setHistory(hRes.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    const handleRequestPayout = async (e: React.FormEvent) => {
        e.preventDefault();
        const requestAmount = parseInt(amount);
        if (isNaN(requestAmount) || requestAmount < 10000) {
            return alert("최소 정산 금액은 10,000원입니다.");
        }
        if (requestAmount > (profile?.total_tokens || 0)) {
            return alert("보유하신 토큰(정산 가능액)보다 많은 금액을 신청할 수 없습니다.");
        }
        if (!idCardUrl || !bankBookUrl) {
            return alert("신분증 및 통장 사본 업로드가 필요합니다.");
        }

        setSubmitting(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { error } = await supabase
                .from('coach_payout_info')
                .insert({
                    user_id: session.user.id,
                    amount: requestAmount,
                    bank_name: bankName,
                    account_number: accountNumber,
                    id_card_url: idCardUrl,
                    bank_book_url: bankBookUrl,
                    status: 'pending'
                });

            if (error) throw error;

            // Optional: Deduct tokens immediately or wait for approval?
            // Usually we wait for approval, but we can mark them as "frozen"
            
            alert("정산 신청이 완료되었습니다. 관리자 승인 후 목요일에 지급됩니다.");
            setAmount('');
            loadFinancialData();
        } catch (err: any) {
            alert("오류 발생: " + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div style={{ padding: 60, opacity: 0.5, textAlign: 'center', color: 'white' }}>FINANCIAL DATA LOADING...</div>;

    const totalPaid = history.filter(h => h.status === 'approved').reduce((acc, h) => acc + h.amount, 0);

    return (
        <div style={pageContainer}>
            <button onClick={() => navigate(-1)} style={backBtn}><ArrowLeft size={18} /> BACK</button>
            
            <header style={header}>
                <h1 style={title}>코치 정산 관리</h1>
                <p style={subtitle}>수업 성과를 현금으로 정산하고 내역을 관리하세요.</p>
            </header>

            <div style={dashboardGrid}>
                {/* Balance Card */}
                <div className="card-minimal" style={balanceCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={label}>정산 가능 잔액</div>
                            <div style={balanceAmount}>{(profile?.total_tokens || 0).toLocaleString()} <span style={{ fontSize: '1rem', opacity: 0.5 }}>P</span></div>
                        </div>
                        <div style={walletIcon}><Wallet size={24} color="var(--color-coach)" /></div>
                    </div>
                    <div style={balanceFooter}>
                        <span>누적 정산 완료액: <strong>{totalPaid.toLocaleString()}원</strong></span>
                    </div>
                </div>

                {/* Info Card */}
                <div className="card-minimal" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={infoIcon}><AlertCircle size={20} color="#f59e0b" /></div>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>정산 안내</div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.5, marginTop: 4 }}>매주 목요일 일괄 지급 (월요일 신청 마감)</div>
                        </div>
                    </div>
                </div>
            </div>

            <div style={mainGrid}>
                {/* Payout Form */}
                <section>
                    <h2 style={sectionTitle}>새 정산 신청</h2>
                    <div className="card-minimal" style={{ padding: '32px' }}>
                        <form onSubmit={handleRequestPayout} style={form}>
                            <div style={formGroup}>
                                <label style={inputLabel}>정산 신청 금액 (최소 10,000원)</label>
                                <div style={{ position: 'relative' }}>
                                    <input 
                                        type="number" 
                                        placeholder="금액을 입력하세요" 
                                        style={input} 
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        required
                                    />
                                    <span style={inputUnit}>원</span>
                                </div>
                            </div>

                            <div style={formRow}>
                                <div style={formGroup}>
                                    <label style={inputLabel}>은행명</label>
                                    <input 
                                        type="text" 
                                        placeholder="예: 신한은행" 
                                        style={input} 
                                        value={bankName}
                                        onChange={e => setBankName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div style={formGroup}>
                                    <label style={inputLabel}>계좌번호 (- 제외)</label>
                                    <input 
                                        type="text" 
                                        placeholder="1234567890" 
                                        style={input} 
                                        value={accountNumber}
                                        onChange={e => setAccountNumber(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div style={uploadGrid}>
                                <ImageUploadField 
                                    label="신분증 사본" 
                                    value={idCardUrl} 
                                    onChange={setIdCardUrl}
                                    helperText="주민번호 뒷자리는 가려주세요."
                                />
                                <ImageUploadField 
                                    label="통장 사본" 
                                    value={bankBookUrl} 
                                    onChange={setBankBookUrl}
                                    helperText="계좌번호가 선명하게 보여야 합니다."
                                />
                            </div>

                            <button type="submit" disabled={submitting} style={submitBtn}>
                                {submitting ? "신청 처리 중..." : "정산 신청하기"}
                            </button>
                        </form>
                    </div>
                </section>

                {/* History List */}
                <section>
                    <h2 style={sectionTitle}>정산 내역</h2>
                    <div style={historyList}>
                        {history.length === 0 ? (
                            <div style={emptyBox}>정산 내역이 없습니다.</div>
                        ) : (
                            history.map(item => (
                                <div key={item.id} className="card-minimal" style={historyCard}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={historyAmount}>{item.amount.toLocaleString()}원</div>
                                            <div style={historyDate}>{new Date(item.created_at).toLocaleDateString()} · {item.bank_name}</div>
                                        </div>
                                        <div style={{ 
                                            ...statusBadge, 
                                            backgroundColor: item.status === 'approved' ? 'rgba(74, 222, 128, 0.1)' : item.status === 'rejected' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 107, 0, 0.1)',
                                            color: item.status === 'approved' ? '#4ade80' : item.status === 'rejected' ? '#ef4444' : 'var(--accent-primary)'
                                        }}>
                                            {item.status.toUpperCase()}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};

// Styles
const pageContainer: React.CSSProperties = { maxWidth: '1200px', margin: '0 auto', padding: '40px 24px', color: 'white' };
const backBtn: React.CSSProperties = { background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 };
const header: React.CSSProperties = { marginBottom: 48 };
const title: React.CSSProperties = { fontSize: '2rem', fontWeight: 900, marginBottom: 8, letterSpacing: '-0.02em' };
const subtitle: React.CSSProperties = { fontSize: '1rem', opacity: 0.4 };

const dashboardGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '48px' };
const balanceCard: React.CSSProperties = { background: 'linear-gradient(135deg, var(--bg-surface-L2) 0%, #1a1a1c 100%)', border: '1px solid rgba(255,255,255,0.08)' };
const label: React.CSSProperties = { fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12 };
const balanceAmount: React.CSSProperties = { fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.02em' };
const walletIcon: React.CSSProperties = { width: '56px', height: '56px', borderRadius: '18px', background: 'rgba(255, 107, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const balanceFooter: React.CSSProperties = { marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem', color: 'var(--text-muted)' };
const infoIcon: React.CSSProperties = { width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' };

const mainGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)', gap: '48px' };
const sectionTitle: React.CSSProperties = { fontSize: '1.25rem', fontWeight: 800, marginBottom: '24px' };

const form: React.CSSProperties = { display: 'grid', gap: '24px' };
const formGroup: React.CSSProperties = { display: 'grid', gap: '8px' };
const formRow: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' };
const inputLabel: React.CSSProperties = { fontSize: '0.85rem', fontWeight: 700, opacity: 0.6 };
const input: React.CSSProperties = { width: '100%', padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', fontSize: '1rem', fontVariantNumeric: 'tabular-nums' };
const inputUnit: React.CSSProperties = { position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, opacity: 0.2 };
const uploadGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' };
const submitBtn: React.CSSProperties = { padding: '18px', borderRadius: '14px', background: 'var(--color-coach)', color: 'white', border: 'none', fontWeight: 900, fontSize: '1rem', cursor: 'pointer', marginTop: '12px', transition: 'all 0.2s' };

const historyList: React.CSSProperties = { display: 'grid', gap: '16px' };
const historyCard: React.CSSProperties = { padding: '24px' };
const historyAmount: React.CSSProperties = { fontSize: '1.1rem', fontWeight: 800 };
const historyDate: React.CSSProperties = { fontSize: '0.8rem', opacity: 0.4, marginTop: 4 };
const statusBadge: React.CSSProperties = { padding: '6px 12px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 900 };
const emptyBox: React.CSSProperties = { padding: '60px', textAlign: 'center', opacity: 0.4, fontSize: '0.9rem', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '24px' };
