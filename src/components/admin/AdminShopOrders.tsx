import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { statusShopKo, fmtKST } from '../../utils/dashboardHelpers';
import { Search, CheckCircle, XCircle, Package, User, MapPin, CreditCard, Ticket, Smartphone } from 'lucide-react';

interface AdminOrder {
    id: string;
    product_title: string;
    size_label?: string;
    quantity: number;
    points_used: number;
    cash_amount: number;
    payer_name: string;
    status: 'pending' | 'paid' | 'cancelled' | 'refunded' | 'completed';
    created_at: string;
    shipping_recipient_name?: string;
    shipping_phone?: string;
    shipping_address_road?: string;
    shipping_detail_address?: string;
    shipping_postcode?: string;
    note?: string;
    type: 'shop' | 'ticket';
}

export const AdminShopOrders = () => {
    const [orders, setOrders] = useState<AdminOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [submittingId, setSubmittingId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'shop' | 'ticket'>('shop');
    const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'cancelled'>('pending');
    const [search, setSearch] = useState('');
    const [msg, setMsg] = useState('');

    useEffect(() => {
        loadOrders();
    }, [activeTab]);

    async function loadOrders() {
        setLoading(true);
        try {
            if (activeTab === 'shop') {
                const { data, error } = await supabase.from('shop_purchase_requests')
                    .select('*, profiles(name, phone)')
                    .order('created_at', { ascending: false });
                if (error) throw error;
                setOrders((data || []).map(o => ({ 
                    ...o, 
                    type: 'shop', 
                    user_name: (o.profiles as any)?.name,
                    user_phone: (o.profiles as any)?.phone
                })));
            } else {
                const { data, error } = await supabase.from('purchases')
                    .select('*, profiles(name, phone)')
                    .eq('method', 'cash')
                    .order('created_at', { ascending: false });
                if (error) throw error;
                setOrders((data || []).map(o => ({ 
                    ...o, 
                    type: 'ticket',
                    product_title: o.product_title || `티켓 구매 (${o.amount.toLocaleString()}원)`,
                    cash_amount: o.amount,
                    quantity: 1,
                    user_name: (o.profiles as any)?.name,
                    user_phone: (o.profiles as any)?.phone
                })));
            }
        } catch (e: any) {
            setMsg(e.message);
        } finally {
            setLoading(false);
        }
    }

    async function approveOrder(id: string, type: 'shop' | 'ticket') {
        if (!confirm('입금 확인 및 주문을 승인하시겠습니까?')) return;
        setSubmittingId(id);
        try {
            const rpcName = type === 'shop' ? 'approve_shop_purchase_request' : 'approve_cash_purchase';
            const { error } = await supabase.rpc(rpcName, { 
                [type === 'shop' ? 'p_request_id' : 'p_purchase_id']: id 
            });
            if (error) throw error;
            setMsg('승인 완료');
            loadOrders();
        } catch (e: any) {
            setMsg(e.message);
        } finally {
            setSubmittingId(null);
        }
    }

    async function rejectOrder(id: string, type: 'shop' | 'ticket') {
        if (!confirm('요청을 반려하시겠습니까? (포인트 환불 포함)')) return;
        setSubmittingId(id);
        try {
            const rpcName = type === 'shop' ? 'reject_shop_purchase_request' : 'cancel_cash_purchase';
            const { error } = await supabase.rpc(rpcName, { 
                [type === 'shop' ? 'p_request_id' : 'p_purchase_id']: id 
            });
            if (error) throw error;
            setMsg('반려 완료');
            loadOrders();
        } catch (e: any) {
            setMsg(e.message);
        } finally {
            setSubmittingId(null);
        }
    }

    const filteredOrders = useMemo(() => {
        return orders.filter(o => {
            const statusMatch = (filter === 'all') || 
                              (filter === 'pending' && o.status === 'pending') ||
                              (filter === 'paid' && (o.status === 'paid' || o.status === 'completed')) ||
                              (filter === 'cancelled' && o.status === 'cancelled');
            
            const searchStr = `${o.payer_name || ''} ${o.product_title || ''} ${(o as any).user_name || ''}`.toLowerCase();
            const searchMatch = searchStr.includes(search.toLowerCase());
            
            return statusMatch && searchMatch;
        });
    }, [orders, filter, search]);

    console.log("Current Orders State:", orders);

    return (
        <div style={{ padding: '0 0 40px 0' }}>
            <header style={{ marginBottom: 30 }}>
                <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }}>ORDERS & PAYMENTS</h2>
                <div style={tabContainer}>
                    <button onClick={() => setActiveTab('shop')} style={activeTab === 'shop' ? tabOn : tabOff}>
                        <Package size={16} /> 스토어 상품 주문
                    </button>
                    <button onClick={() => setActiveTab('ticket')} style={activeTab === 'ticket' ? tabOn : tabOff}>
                        <Ticket size={16} /> 티켓(수업권) 구매 요청
                    </button>
                </div>
            </header>

            {msg && <div style={msgBox}>{msg}</div>}

            <div style={controlsRow}>
                <div style={filterGroup}>
                    {['all', 'pending', 'paid', 'cancelled'].map(f => (
                        <button 
                            key={f} 
                            onClick={() => setFilter(f as any)}
                            style={filter === f ? filterBtnOn : filterBtnOff}
                        >
                            {statusShopKo(f).toUpperCase()}
                        </button>
                    ))}
                </div>
                <div style={searchWrapper}>
                    <Search size={18} opacity={0.3} />
                    <input 
                        placeholder="입금자명 또는 상품명 검색..." 
                        value={search} 
                        onChange={e => setSearch(e.target.value)} 
                        style={searchInput}
                    />
                </div>
            </div>

            <div style={grid}>
                {filteredOrders.map(order => (
                    <div key={order.id} style={orderCard}>
                        <div style={orderHeader}>
                            <div>
                                <div style={prodTitle}>{order.product_title}</div>
                                <div style={prodSub}>
                                    {order.type === 'shop' ? `${order.size_label || '-'} · ${order.quantity}개` : '수업 티켓 충전'} 
                                    {order.points_used > 0 && ` (${order.points_used.toLocaleString()}P 사용)`}
                                </div>
                            </div>
                            <div style={statusPill(order.status)}>{statusShopKo(order.status)}</div>
                        </div>

                        <div style={divider} />

                        <div style={infoGrid}>
                            <InfoBox icon={<User size={14} />} label="입금자 / 계정명" value={`${order.payer_name || '정보없음'} (${(order as any).user_name || '프로필정보없음'})`} />
                            <InfoBox icon={<Smartphone size={14} />} label="연락처" value={(order as any).user_phone || '정보없음'} />
                            <InfoBox icon={<CreditCard size={14} />} label="결제금액" value={`${(order.cash_amount || 0).toLocaleString()}원`} />
                            {order.type === 'shop' ? (
                                <InfoBox icon={<MapPin size={14} />} label="배송지" value={`${order.shipping_address_road || '-'} ${order.shipping_detail_address || ''}`} span2 />
                            ) : (
                                <InfoBox icon={<Ticket size={14} />} label="상품유형" value="무통장입금 티켓 충전" span2 />
                            )}
                            <InfoBox icon={<Package size={14} />} label="요청시간" value={fmtKST(order.created_at)} />
                        </div>

                        {order.status === 'pending' && (
                            <div style={btnRow}>
                                <button 
                                    onClick={() => approveOrder(order.id, order.type)} 
                                    disabled={!!submittingId} 
                                    style={btnApprove}
                                >
                                    {submittingId === order.id ? '...' : '입금 확인 / 승인'}
                                </button>
                                <button 
                                    onClick={() => rejectOrder(order.id, order.type)} 
                                    disabled={!!submittingId} 
                                    style={btnReject}
                                >
                                    반려
                                </button>
                            </div>
                        )}
                    </div>
                ))}

                {filteredOrders.length === 0 && !loading && (
                    <div style={emptyState}>요청 내역이 없습니다.</div>
                )}
            </div>
        </div>
    );
};

const InfoBox = ({ icon, label, value, span2 = false }: { icon: any, label: string, value: string, span2?: boolean }) => (
    <div style={{ ...infoBox, gridColumn: span2 ? 'span 2' : 'span 1' }}>
        <div style={infoLabel}>{icon} {label}</div>
        <div style={infoValue}>{value}</div>
    </div>
);

// Styles
const tabContainer: React.CSSProperties = { display: 'flex', gap: '12px', marginTop: '16px' };
const tabBase: React.CSSProperties = { padding: '10px 20px', borderRadius: '12px', cursor: 'pointer', fontWeight: 800, fontSize: '14px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '8px', transition: '0.2s' };
const tabOn: React.CSSProperties = { ...tabBase, background: 'var(--color-primary)', color: 'white', borderColor: 'transparent' };
const tabOff: React.CSSProperties = { ...tabBase, background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.4)' };

const msgBox: React.CSSProperties = { padding: '14px 20px', borderRadius: 12, background: 'rgba(59,130,246,0.1)', color: 'white', marginBottom: 24, fontSize: 13, fontWeight: 700, border: '1px solid rgba(255,255,255,0.1)' };
const controlsRow: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, flexWrap: 'wrap', gap: 20 };
const filterGroup: React.CSSProperties = { display: 'flex', gap: 8 };
const filterBtnOn: React.CSSProperties = { padding: '10px 16px', borderRadius: 10, border: 'none', background: 'white', color: 'black', fontWeight: 900, cursor: 'pointer', fontSize: 13 };
const filterBtnOff: React.CSSProperties = { padding: '10px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.4)', fontWeight: 800, cursor: 'pointer', fontSize: 13 };
const searchWrapper: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', width: '100%', maxWidth: 350 };
const searchInput: React.CSSProperties = { background: 'none', border: 'none', color: 'white', padding: '14px 0', outline: 'none', width: '100%', fontSize: 14 };
const grid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 };
const orderCard: React.CSSProperties = { padding: 20, borderRadius: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' };
const orderHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' };
const prodTitle: React.CSSProperties = { fontSize: 17, fontWeight: 900, marginBottom: 4 };
const prodSub: React.CSSProperties = { fontSize: 12, opacity: 0.4, fontWeight: 700 };
const divider: React.CSSProperties = { height: 1, background: 'rgba(255,255,255,0.05)', margin: '15px 0' };
const infoGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 };
const infoBox: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6 };
const infoLabel: React.CSSProperties = { fontSize: 10, fontWeight: 900, opacity: 0.3, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 };
const infoValue: React.CSSProperties = { fontSize: 13, fontWeight: 700, opacity: 0.8 };
const btnRow: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 80px', gap: 10, marginTop: 20 };
const btnApprove: React.CSSProperties = { padding: '14px', borderRadius: 12, border: 'none', background: 'white', color: 'black', fontWeight: 900, cursor: 'pointer', fontSize: 13 };
const btnReject: React.CSSProperties = { padding: '14px', borderRadius: 12, background: 'rgba(255,0,0,0.1)', color: '#ef4444', border: '1px solid rgba(255,0,0,0.2)', fontWeight: 800, cursor: 'pointer', fontSize: 13 };
const emptyState: React.CSSProperties = { padding: '60px 0', textAlign: 'center', opacity: 0.3, fontSize: 14, gridColumn: '1 / -1' };

function statusPill(status: string): React.CSSProperties {
    const s = (status || "").toLowerCase();
    let bg = 'rgba(255,255,255,0.05)';
    let color = 'rgba(255,255,255,0.3)';
    if (s === 'pending') { bg = 'rgba(234, 179, 8, 0.1)'; color = '#eab308'; }
    if (s === 'paid' || s === 'completed') { bg = 'rgba(34, 197, 94, 0.1)'; color = '#22c55e'; }
    if (s === 'cancelled') { bg = 'rgba(239, 68, 68, 0.1)'; color = '#ef4444'; }
    return { padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 900, background: bg, color };
}
