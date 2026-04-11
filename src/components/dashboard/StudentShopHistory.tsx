import React from 'react';
import { ShopPurchaseRequest } from '../../types/dashboard';
import { statusShopKo, fmtDateKST } from '../../utils/dashboardHelpers';
import { Package, Clock, CreditCard } from 'lucide-react';

interface StudentShopHistoryProps {
    requests: ShopPurchaseRequest[];
    loading: boolean;
}

export const StudentShopHistory = ({ requests, loading }: StudentShopHistoryProps) => {
    return (
        <div style={{ marginTop: 40 }}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Package size={20} /> 최근 쇼핑 주문 내역
            </h3>

            <div style={{ display: 'grid', gap: 12 }}>
                {requests.map(req => (
                    <div key={req.id} style={orderCard}>
                        <div style={{ display: 'flex', gap: 16 }}>
                            <div style={imgContainer}>
                                {req.thumbnail_url ? (
                                    <img src={req.thumbnail_url} alt={req.product_title} style={imgStyle} />
                                ) : (
                                    <Package size={24} opacity={0.2} />
                                )}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                                    <div>
                                        <div style={productTitle}>{req.product_title}</div>
                                        <div style={productSub}>{req.size_label} · {req.quantity}개</div>
                                    </div>
                                    <div style={statusPill(req.status)}>{statusShopKo(req.status)}</div>
                                </div>
                                <div style={infoRow}>
                                    <div style={infoItem}><CreditCard size={12} /> {(req.cash_amount).toLocaleString()}원 {req.points_used > 0 && <span style={{ opacity: 0.5 }}>(+{req.points_used.toLocaleString()}P)</span>}</div>
                                    <div style={infoItem}><Clock size={12} /> {fmtDateKST(req.created_at)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                
                {requests.length === 0 && !loading && (
                    <div style={{ textAlign: 'center', padding: '60px 0', opacity: 0.4, border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 16 }}>
                        최근 주문 내역이 없습니다.
                    </div>
                )}
                
                {loading && requests.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.3 }}>내역을 불러오는 중...</div>
                )}
            </div>
        </div>
    );
};

const orderCard: React.CSSProperties = { padding: 16, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' };
const imgContainer: React.CSSProperties = { width: 64, height: 64, borderRadius: 12, overflow: 'hidden', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const imgStyle: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'cover' };
const productTitle: React.CSSProperties = { fontSize: 16, fontWeight: 800, marginBottom: 2 };
const productSub: React.CSSProperties = { fontSize: 13, opacity: 0.5, fontWeight: 600 };
const infoRow: React.CSSProperties = { display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' };
const infoItem: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 4 };

function statusPill(status: string): React.CSSProperties {
    const s = (status || "").toLowerCase();
    let bg = 'rgba(255,255,255,0.05)';
    let color = 'rgba(255,255,255,0.4)';
    
    if (s === 'pending') { bg = 'rgba(234, 179, 8, 0.1)'; color = '#eab308'; }
    if (s === 'paid') { bg = 'rgba(34, 197, 94, 0.1)'; color = '#22c55e'; }
    if (s === 'cancelled' || s === 'refunded') { bg = 'rgba(239, 68, 68, 0.1)'; color = '#ef4444'; }
    
    return { padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 900, background: bg, color };
}
