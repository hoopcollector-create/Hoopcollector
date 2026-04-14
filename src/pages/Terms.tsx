import React from 'react';
import { ShieldCheck, FileText, Scale, Info, ChevronRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Terms = () => {
    const navigate = useNavigate();

    return (
        <div style={container}>
            <button onClick={() => navigate(-1)} style={backBtn}><ArrowLeft size={18} /> BACK</button>
            
            <header style={header}>
                <div style={badge}>LEGAL & POLICY</div>
                <h1 style={title}>이용약관 및 정책</h1>
                <p style={subtitle}>훕콜렉터의 공정한 이용을 위한 운영 정책입니다.</p>
            </header>

            <div style={grid}>
                {/* 1. Ticket Policy */}
                <section style={card}>
                    <div style={cardHeader}>
                        <div style={iconBox}><Scale size={20} color="var(--color-primary)" /></div>
                        <h2 style={cardTitle}>수업권(티켓) 이용 정책</h2>
                    </div>
                    <ul style={list}>
                        <li>티켓은 지갑당 <strong>최대 30개</strong>까지 보유할 수 있습니다.</li>
                        <li>자산 보호 및 남용 방지를 위해 한도 도달 시 소진 후 추가 구매가 가능합니다.</li>
                        <li>수업 취소 시 환불 규정은 시작 24시간 전까지 100% 환급됩니다.</li>
                    </ul>
                </section>

                {/* 2. Point Policy */}
                <section style={card}>
                    <div style={cardHeader}>
                        <div style={iconBox}><Info size={20} color="#f59e0b" /></div>
                        <h2 style={cardTitle}>포인트 및 적립 정책</h2>
                    </div>
                    <ul style={list}>
                        <li><strong>1포인트(1P)는 현금 1원</strong>의 가치를 가집니다.</li>
                        <li>모든 현금 결제(스토어/수업) 시 <strong>결제액의 1%</strong>가 자동 적립됩니다.</li>
                        <li>QR 출석 성실 시 <strong>200P</strong> 보너스가 지급됩니다.</li>
                        <li>수업 일지 작성 및 소감 공유 시 각각 <strong>500P</strong>가 적립됩니다.</li>
                    </ul>
                </section>

                {/* 3. Privacy & Security */}
                <section style={card}>
                    <div style={cardHeader}>
                        <div style={iconBox}><ShieldCheck size={20} color="#10b981" /></div>
                        <h2 style={cardTitle}>보안 및 본인 인증</h2>
                    </div>
                    <ul style={list}>
                        <li>부정한 목적의 대량 구매 및 환불은 자금세탁 방지법에 의거하여 제한될 수 있습니다.</li>
                        <li>추후 안전한 거래를 위해 본인 인증 서비스가 도입될 예정입니다.</li>
                        <li>비정상적인 포인트 획득 시 예고 없이 회수될 수 있습니다.</li>
                    </ul>
                </section>

                {/* 4. Refund Policy */}
                <section style={card}>
                    <div style={cardHeader}>
                        <div style={iconBox}><FileText size={20} color="#ef4444" /></div>
                        <h2 style={cardTitle}>환불 및 취소 안내</h2>
                    </div>
                    <ul style={list}>
                        <li>무통장 입금 완료 후 티켓 지급 전 취소는 100% 가능합니다.</li>
                        <li>매칭 모임의 경우 주최자의 설정에 따라 취소 수수료가 발생할 수 있습니다.</li>
                        <li>스토어 상품은 단순 변심의 경우 왕복 배송비가 청구됩니다.</li>
                    </ul>
                </section>
            </div>

            <footer style={footer}>
                <p>© 2026 HOOPCOLLECTOR. All rights reserved.</p>
                <div style={{ display: 'flex', gap: 20, marginTop: 10 }}>
                    <span style={{ opacity: 0.4, fontSize: '0.8rem' }}>개인정보처리방침</span>
                    <span style={{ opacity: 0.4, fontSize: '0.8rem' }}>이용약관</span>
                </div>
            </footer>
        </div>
    );
};

const container: React.CSSProperties = { maxWidth: '1000px', margin: '0 auto', padding: '60px 24px', color: 'white' };
const backBtn: React.CSSProperties = { background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 40 };
const header: React.CSSProperties = { marginBottom: 60 };
const badge: React.CSSProperties = { display: 'inline-block', padding: '6px 14px', borderRadius: '100px', background: 'rgba(255,255,255,0.05)', fontSize: '0.75rem', fontWeight: 900, marginBottom: 16, color: 'var(--color-primary)', letterSpacing: '0.1em' };
const title: React.CSSProperties = { fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.04em', margin: 0 };
const subtitle: React.CSSProperties = { fontSize: '1.1rem', opacity: 0.4, marginTop: 12, fontWeight: 500 };

const grid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 32 };
const card: React.CSSProperties = { padding: 40, borderRadius: 32, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' };
const cardHeader: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 };
const iconBox: React.CSSProperties = { width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const cardTitle: React.CSSProperties = { fontSize: '1.25rem', fontWeight: 800, margin: 0 };
const list: React.CSSProperties = { padding: 0, margin: 0, listStyle: 'none', display: 'grid', gap: 16 };
const footer: React.CSSProperties = { marginTop: 100, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 40, textAlign: 'center' };
