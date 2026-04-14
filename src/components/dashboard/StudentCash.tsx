import React from 'react';
import { ClassType, PointsStats, PendingPurchase, Product, ReceiptType } from '../../types/dashboard';

interface StudentCashProps {
    classTypes: ClassType[];
    qtyList: number[];
    selectedClass: ClassType;
    setSelectedClass: (v: ClassType) => void;
    selectedQty: number;
    setSelectedQty: (v: number) => void;
    depositorName: string;
    setDepositorName: (v: string) => void;
    receiptType: ReceiptType;
    setReceiptType: (v: ReceiptType) => void;
    receiptValue: string;
    setReceiptValue: (v: string) => void;
    usePointsInput: string;
    setUsePointsInput: (v: string) => void;
    points: PointsStats | null;
    finalAmount: number;
    requestCash: (id: string) => Promise<void>;
    selectedProduct: Product | undefined;
    pointsDiscountWon: number;
    maxUsablePoints: number;
    pending: PendingPurchase[];
    loading: boolean;
    cancelPending: (id: string) => Promise<void>;
}

export const StudentCash = ({
    classTypes, qtyList, selectedClass, setSelectedClass, selectedQty, setSelectedQty,
    depositorName, setDepositorName, receiptType, setReceiptType, receiptValue, setReceiptValue,
    usePointsInput, setUsePointsInput, points, finalAmount, requestCash, selectedProduct,
    pointsDiscountWon, maxUsablePoints, pending, loading, cancelPending, estimatedReward
}: StudentCashProps) => {
    return (
        <div style={{ display: 'grid', gap: 24 }}>
            <div>
                <div style={sectionLabel}>수업 클래스 및 횟수 선택</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    {classTypes.map(t => <button key={t} onClick={() => setSelectedClass(t)} style={selectedClass === t ? tabOn : tabOff}>Class {t}</button>)}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    {qtyList.map(q => <button key={q} onClick={() => setSelectedQty(q)} style={selectedQty === q ? tabOn : tabOff}>{q}회</button>)}
                </div>
                <div style={{ padding: '12px', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '12px', fontSize: '0.8rem', color: '#f59e0b', marginTop: '12px', lineHeight: 1.5 }}>
                    * 자산 보호 및 남용 방지를 위해 지갑당 최대 30개의 티켓만 보유 가능합니다. (현재 소진 후 추가 구매 가능)
                </div>
            </div>

            <div style={priceSummaryCard}>
                <div style={priceLine}>
                    <span>티켓 원가</span><span>{selectedProduct?.price?.toLocaleString() || 0}원</span>
                </div>
                <div style={priceLine}>
                    <span>포인트 사용 (-{usePointsInput || 0})</span><span style={{ color: '#3b82f6' }}>-{pointsDiscountWon.toLocaleString()}원</span>
                </div>
                <hr style={divider} />
                <div style={{ ...priceLine, fontWeight: 900, fontSize: 18 }}>
                    <span>최종 이체 금액</span><span>{finalAmount.toLocaleString()}원</span>
                </div>
                {finalAmount > 0 && (
                    <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: '#3b82f6', fontWeight: 700 }}>
                        <span>✓ 구매 시 {Math.floor(finalAmount * 0.01).toLocaleString()}P 적립 (1%)</span>
                    </div>
                )}
            </div>

            <div>
                <div style={sectionLabel}>포인트 활용 (최대 {maxUsablePoints.toLocaleString()}p 사용 가능)</div>
                <input placeholder="포인트 금액" value={usePointsInput} onChange={e => setUsePointsInput(e.target.value)} style={{ ...input, marginTop: 8 }} />
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
                <div style={sectionLabel}>입금자명 (무통장 입금 확인용)</div>
                <input placeholder="예: 홍길동" value={depositorName} onChange={e => setDepositorName(e.target.value)} style={input} />

                <div style={sectionLabel}>현금영수증</div>
                <select value={receiptType} onChange={e => setReceiptType(e.target.value as any)} style={input}>
                    <option value="none">미발급</option>
                    <option value="income">개인(소득공제)</option>
                    <option value="expense">사업자(지출증빙)</option>
                </select>
                {receiptType !== "none" && <input placeholder="전화번호 / 사업자번호" value={receiptValue} onChange={e => setReceiptValue(e.target.value)} style={input} />}
            </div>

            <div style={bankInfoCard}>
                <strong>무통장 입금 계좌:</strong><br />기업은행 / 548-082903-04-014 / 신민철
            </div>

            <button onClick={() => requestCash(selectedProduct?.id || '')} disabled={loading || !selectedProduct || !depositorName} style={(!selectedProduct || !depositorName) ? { ...btnPrimary, opacity: 0.5 } : btnPrimary}>
                {loading ? "처리중..." : "무통장 입금 확인 요청"}
            </button>

            {pending.length > 0 && (
                <div style={{ marginTop: 24 }}>
                    <div style={{ fontWeight: 800, marginBottom: 16 }}>진행 중인 결제 대기 건</div>
                    {pending.map((p: any) => (
                        <div key={p.id} style={pendingCard}>
                            <div>Class {p.class_type} {p.ticket_qty}회 ({p.amount.toLocaleString()}원)</div>
                            <button onClick={() => cancelPending(p.id)} style={cancelMiniBtn}>취소</button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const priceSummaryCard: React.CSSProperties = { background: "rgba(255,255,255,.05)", padding: 20, borderRadius: 16, border: "1px solid rgba(255,255,255,.1)" };
const priceLine: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', marginBottom: 12 };
const divider: React.CSSProperties = { border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '12px 0' };
const input: React.CSSProperties = { width: "100%", padding: "14px", borderRadius: 14, border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.07)", color: "white", outline: "none", boxSizing: "border-box", fontSize: 14 };
const btnPrimary: React.CSSProperties = { width: "100%", padding: "14px", borderRadius: 14, border: "none", background: "white", color: "black", cursor: "pointer", fontWeight: 800, fontSize: 15 };
const sectionLabel: React.CSSProperties = { fontSize: 12, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase", color: "rgba(255,255,255,.62)" };
const tabOn: React.CSSProperties = { padding: "12px 10px", borderRadius: 14, border: "none", background: "#ffffff", color: "#000000", cursor: "pointer", fontWeight: 800, fontSize: 14 };
const tabOff: React.CSSProperties = { padding: "12px 10px", borderRadius: 14, border: "1px solid rgba(255,255,255,.10)", background: "rgba(255,255,255,.04)", color: "rgba(255,255,255,.5)", cursor: "pointer", fontWeight: 700, fontSize: 14 };
const bankInfoCard: React.CSSProperties = { background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6", padding: 16, borderRadius: 12, fontSize: 14 };
const pendingCard: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 10 };
const cancelMiniBtn: React.CSSProperties = { color: '#ef4444', background: 'transparent', border: '1px solid #ef4444', borderRadius: 8, padding: '4px 12px', cursor: 'pointer' };
