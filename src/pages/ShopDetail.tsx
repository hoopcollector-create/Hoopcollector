import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ShoppingBag, ArrowLeft, MapPin, Search as SearchIcon, Plus, Check, CreditCard } from 'lucide-react';
import { ShippingAddress, ShopRequestStatus, ShopPurchaseRequest, ShopProduct, ShopVariant } from '../types/dashboard';

interface ProductDetail extends ShopProduct {
    variants: ShopVariant[];
}

export const ShopDetail = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [product, setProduct] = useState<ProductDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [msg, setMsg] = useState('');
    const [userId, setUserId] = useState<string | null>(null);
    const [userBalance, setUserBalance] = useState(0);

    // Purchase states
    const [selectedVariant, setSelectedVariant] = useState<ShopVariant | null>(null);
    const [qty, setQty] = useState(1);
    const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string>('');
    const [showAddressForm, setShowAddressForm] = useState(false);
    
    // Address Form
    const [addrLabel, setAddrLabel] = useState('');
    const [recipient, setRecipient] = useState('');
    const [phone, setPhone] = useState('');
    const [postcode, setPostcode] = useState('');
    const [addrRoad, setAddrRoad] = useState('');
    const [addrExtra, setAddrExtra] = useState('');
    const [detailAddr, setDetailAddr] = useState('');
    
    // Payment UI
    const [payerName, setPayerName] = useState('');
    const [receiptType, setReceiptType] = useState<'none' | 'income_deduction' | 'expense_proof'>('none');
    const [receiptValue, setReceiptValue] = useState('');
    const [note, setNote] = useState('');

    useEffect(() => {
        loadData();
        loadKakaoScript();
    }, [slug]);

    async function loadData() {
        if (!slug) return;
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setUserId(session.user.id);
                const { data: stat } = await supabase.from('user_points_stats').select('balance').eq('user_id', session.user.id).maybeSingle();
                setUserBalance(stat?.balance ?? 0);
                
                const { data: addr } = await supabase.from('shipping_addresses').select('*').eq('user_id', session.user.id).order('is_default', { ascending: false });
                if (addr) {
                    setAddresses(addr);
                    if (addr.length > 0) setSelectedAddressId(addr[0].id);
                }
            }

            const { data, error } = await supabase.from('shop_products').select('*, shop_product_variants(*)').eq('slug', slug).eq('is_active', true).maybeSingle();
            if (error) throw error;
            if (data) {
                setProduct({
                    ...data,
                    variants: data.shop_product_variants || []
                });
                if (data.shop_product_variants?.length > 0) {
                    setSelectedVariant(data.shop_product_variants[0]);
                }
            }
        } catch (e: any) {
            setMsg(e.message);
        } finally {
            setLoading(false);
        }
    }

    function loadKakaoScript() {
        if (document.getElementById('kakao-postcode-detail')) return;
        const script = document.createElement('script');
        script.id = 'kakao-postcode-detail';
        script.src = '//t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
        document.head.appendChild(script);
    }

    function openKakaoSearch() {
        if (!(window as any).daum) return;
        new (window as any).daum.Postcode({
            oncomplete: (data: any) => {
                setPostcode(data.zonecode);
                setAddrRoad(data.roadAddress);
                setAddrExtra(data.buildingName ? `(${data.buildingName})` : '');
            }
        }).open();
    }

    const totalPriceP = (selectedVariant?.point_price || 0) * qty;
    const canUsePoints = Math.min(userBalance, totalPriceP);
    const finalCash = totalPriceP - canUsePoints;
    const estimatedReward = Math.floor(finalCash * 0.01);

    async function handleOrder() {
        if (!userId) {
            navigate('/login');
            return;
        }
        if (!selectedVariant) return;
        if (!selectedAddressId && !showAddressForm) {
            setMsg('배송지를 선택해 주세요.');
            return;
        }
        if (!payerName.trim() && finalCash > 0) {
            setMsg('입금자명을 입력해 주세요.');
            return;
        }

        setSubmitting(true);
        try {
            let addressId = selectedAddressId;

            // 1. If form is open, save address first
            if (showAddressForm) {
                const { data: newAddr, error: addrErr } = await supabase.from('shipping_addresses').insert({
                    user_id: userId, label: addrLabel.trim(), recipient_name: recipient.trim(),
                    phone: phone.trim(), postcode, address_road: addrRoad,
                    address_extra: addrExtra, detail_address: detailAddr.trim(),
                    is_default: addresses.length === 0
                }).select().single();
                if (addrErr) throw addrErr;
                addressId = newAddr.id;
            }

            // 2. Create Purchase Request
            const { error: orderErr } = await supabase.from('shop_purchase_requests').insert({
                user_id: userId,
                product_slug: product!.slug,
                product_title: product!.title,
                size_label: selectedVariant.size_label,
                quantity: qty,
                original_point_price: selectedVariant.point_price,
                original_cash_amount: selectedVariant.point_price,
                points_used: canUsePoints,
                points_discount_won: canUsePoints,
                cash_amount: finalCash,
                payer_name: payerName.trim() || '포인트전액결제',
                cash_receipt_type: receiptType,
                cash_receipt_value: receiptValue.trim() || null,
                note: note.trim() || null,
                shipping_address_id: addressId,
                thumbnail_url: product!.thumbnail_url
            });

            if (orderErr) throw orderErr;

            setMsg('주문 요청이 완료되었습니다!\n마이페이지에서 정보를 확인해 주세요.');
            setTimeout(() => navigate('/dashboard'), 2000);
        } catch (e: any) {
            setMsg(e.message);
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) return <div style={centerStyle}>LOADING PRODUCT...</div>;
    if (!product) return <div style={centerStyle}>PRODUCT NOT FOUND</div>;

    const selectedAddr = addresses.find(a => a.id === selectedAddressId);

    return (
        <div style={containerStyle}>
            <button onClick={() => navigate('/shop')} style={backBtn}><ArrowLeft size={18} /> BACK TO STORE</button>
            
            <div style={contentGrid}>
                {/* Left: Image */}
                <div style={imageCol}>
                    <div style={imgWrapper}>
                        {product.thumbnail_url ? (
                            <img src={product.thumbnail_url} alt={product.title} style={imgStyle} />
                        ) : (
                            <div style={placeholderStyle}><ShoppingBag size={80} opacity={0.1} /></div>
                        )}
                    </div>
                </div>

                {/* Right: Info & Purchase */}
                <div style={infoCol}>
                    <div style={categoryTag}>{product.category.toUpperCase()}</div>
                    <h1 style={titleStyle}>{product.title}</h1>
                    <p style={descStyle}>{product.description}</p>

                    <div style={divider} />

                    {/* Variant Selection */}
                    <div style={section}>
                        <div style={labelStyle}>SELECT SIZE</div>
                        <div style={variantGrid}>
                            {product.variants.map(v => (
                                <button 
                                    key={v.id} 
                                    onClick={() => setSelectedVariant(v)}
                                    disabled={v.stock_qty <= 0}
                                    style={{
                                        ...variantBtn,
                                        background: selectedVariant?.id === v.id ? 'white' : 'transparent',
                                        color: selectedVariant?.id === v.id ? 'black' : 'white',
                                        opacity: v.stock_qty <= 0 ? 0.2 : 1
                                    }}
                                >
                                    {v.size_label}
                                    {v.stock_qty < 5 && v.stock_qty > 0 && <span style={stockWarn}>ONLY {v.stock_qty} LEFT</span>}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={divider} />

                    {/* Shipping Section */}
                    <div style={section}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <div style={labelStyle}>SHIPPING ADDRESS</div>
                            {!showAddressForm && (
                                <button onClick={() => setShowAddressForm(true)} style={addAddrBtn}><Plus size={14} /> NEW</button>
                            )}
                        </div>

                        {!showAddressForm ? (
                            <div style={shippingGrid}>
                                {addresses.map(addr => (
                                    <button 
                                        key={addr.id} 
                                        onClick={() => setSelectedAddressId(addr.id)}
                                        style={{
                                            ...addrCard,
                                            borderColor: selectedAddressId === addr.id ? 'white' : 'rgba(255,255,255,0.1)'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                            <div style={addrTitle}>{addr.label}</div>
                                            {selectedAddressId === addr.id && <Check size={14} />}
                                        </div>
                                        <div style={addrText}>{addr.recipient_name} / {addr.phone}</div>
                                        <div style={addrDetail}>{addr.address_road} {addr.detail_address}</div>
                                    </button>
                                ))}
                                {addresses.length === 0 && (
                                    <div style={emptyAddr}>
                                        {userId ? '등록된 배송지가 없습니다.' : '로그인 후 배송지를 관리하실 수 있습니다.'}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={addrForm}>
                                <div style={formRow}>
                                    <input placeholder="배송지명 (예: 집)" value={addrLabel} onChange={e=>setAddrLabel(e.target.value)} style={input} />
                                    <input placeholder="수령인" value={recipient} onChange={e=>setRecipient(e.target.value)} style={input} />
                                </div>
                                <div style={formRow}>
                                    <input placeholder="연락처" value={phone} onChange={e=>setPhone(e.target.value)} style={input} />
                                    <div style={{ display: 'flex', gap: 8, flex: 2 }}>
                                        <input placeholder="우편번호" value={postcode} readOnly style={{ ...input, flex: 1 }} />
                                        <button onClick={openKakaoSearch} style={searchBtn}><SearchIcon size={14} /></button>
                                    </div>
                                </div>
                                <input placeholder="기본 주소" value={addrRoad} readOnly style={input} />
                                <input placeholder="상세 주소" value={detailAddr} onChange={e=>setDetailAddr(e.target.value)} style={input} />
                                <button onClick={() => setShowAddressForm(false)} style={cancelAddrBtn}>기존 배송지 선택</button>
                            </div>
                        )}
                    </div>

                    <div style={divider} />

                    {/* Payment Summary */}
                    <div style={priceCard}>
                        <div style={priceRow}>
                            <div style={priceLabel}>상품 금액</div>
                            <div style={priceVal}>{(selectedVariant?.point_price || 0).toLocaleString()} P</div>
                        </div>
                        <div style={priceRow}>
                            <div style={{ ...priceLabel, color: 'var(--color-student)' }}>보유 포인트 할인</div>
                            <div style={{ ...priceVal, color: 'var(--color-student)' }}>-{canUsePoints.toLocaleString()} P</div>
                        </div>
                        <div style={{ ...divider, margin: '15px 0' }} />
                        <div style={priceRow}>
                            <div style={{ ...priceLabel, fontSize: 18, fontWeight: 900 }}>최종 결제 금액</div>
                            <div style={{ ...priceVal, fontSize: 24, fontWeight: 900 }}>{finalCash.toLocaleString()} <span style={{ fontSize: 14 }}>원</span></div>
                        </div>
                        {finalCash > 0 && (
                            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 700 }}>
                                <Check size={14} /> 구매 시 {estimatedReward.toLocaleString()}P 적립 (1%)
                            </div>
                        )}
                        {!userId && (
                            <p style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '12px', textAlign: 'right' }}>
                                * 로그인 시 포인트 할인을 적용받을 수 있습니다.
                            </p>
                        )}
                    </div>

                    {finalCash > 0 && (
                        <div style={cashForm}>
                            <div style={labelStyle}>PAYMENT INFO</div>
                            <input placeholder="입금자명" value={payerName} onChange={e=>setPayerName(e.target.value)} style={input} />
                            <div style={formRow}>
                                <select value={receiptType} onChange={e=>setReceiptType(e.target.value as any)} style={input}>
                                    <option value="none">현금영수증 미발행</option>
                                    <option value="income_deduction">개인소득공제</option>
                                    <option value="expense_proof">사업자지출증빙</option>
                                </select>
                                {receiptType !== 'none' && (
                                    <input placeholder="번호" value={receiptValue} onChange={e=>setReceiptValue(e.target.value)} style={input} />
                                )}
                            </div>
                            <div style={bankInfo}>무통장 입금 계좌: [은행명] 000-000-000000 (예금주: 훕콜렉터)</div>
                        </div>
                    )}

                    <button 
                        onClick={handleOrder} 
                        disabled={submitting || !!(userId && !selectedVariant)} 
                        style={{
                            ...orderBtn,
                            background: userId ? 'white' : 'transparent',
                            color: userId ? 'black' : 'white',
                            border: userId ? 'none' : '2px solid white'
                        }}
                    >
                        {submitting ? 'PROCESSING...' : (
                            userId ? (
                                <><ShoppingBag size={20} /> ORDER NOW</>
                            ) : (
                                <><CreditCard size={20} /> LOGIN TO PURCHASE</>
                            )
                        )}
                    </button>

                    {msg && <div style={msgBox}>{msg}</div>}
                </div>
            </div>
        </div>
    );
};

const containerStyle: React.CSSProperties = { maxWidth: 1200, margin: '0 auto', padding: '40px 24px 100px 24px', color: 'white' };
const centerStyle: React.CSSProperties = { height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 };
const backBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontWeight: 900, cursor: 'pointer', marginBottom: 40, fontSize: 13 };
const contentGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 60 };
const imgWrapper: React.CSSProperties = { aspectRatio: '1/1.2', borderRadius: 32, overflow: 'hidden', background: '#111827', border: '1px solid rgba(255,255,255,0.05)' };
const imgStyle: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'cover' };
const placeholderStyle: React.CSSProperties = { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const categoryTag: React.CSSProperties = { fontSize: 12, fontWeight: 900, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', marginBottom: 8 };
const titleStyle: React.CSSProperties = { fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.04em', margin: '0 0 20px 0' };
const descStyle: React.CSSProperties = { fontSize: 16, lineHeight: 1.6, opacity: 0.5, marginBottom: 40 };
const divider: React.CSSProperties = { height: 1, background: 'rgba(255,255,255,0.08)', margin: '30px 0' };
const section: React.CSSProperties = { display: 'grid', gap: 16 };
const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 900, letterSpacing: '0.05em', opacity: 0.4 };
const variantGrid: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 10 };
const variantBtn: React.CSSProperties = { padding: '12px 24px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', fontWeight: 800, cursor: 'pointer', position: 'relative', overflow: 'hidden' };
const stockWarn: React.CSSProperties = { position: 'absolute', top: 0, right: 0, fontSize: 8, background: '#ef4444', color: 'white', padding: '2px 4px' };
const shippingGrid: React.CSSProperties = { display: 'grid', gap: 10 };
const addrCard: React.CSSProperties = { padding: 16, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid', textAlign: 'left', cursor: 'pointer' };
const addrTitle: React.CSSProperties = { fontSize: 12, fontWeight: 900, opacity: 0.6 };
const addrText: React.CSSProperties = { fontSize: 15, fontWeight: 700, margin: '4px 0' };
const addrDetail: React.CSSProperties = { fontSize: 13, opacity: 0.4 };
const addAddrBtn: React.CSSProperties = { background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 };
const addrForm: React.CSSProperties = { display: 'grid', gap: 10, background: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' };
const formRow: React.CSSProperties = { display: 'flex', gap: 10 };
const input: React.CSSProperties = { width: '100%', padding: '14px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none', fontSize: 14, boxSizing: 'border-box' };
const searchBtn: React.CSSProperties = { padding: '0 16px', borderRadius: 12, border: 'none', background: 'white', color: 'black', cursor: 'pointer' };
const cancelAddrBtn: React.CSSProperties = { background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 800, cursor: 'pointer' };
const priceCard: React.CSSProperties = { background: 'rgba(255,255,255,0.02)', borderRadius: 24, padding: 24, border: '1px solid rgba(255,255,255,0.05)' };
const priceRow: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const priceLabel: React.CSSProperties = { fontSize: 15, fontWeight: 700, opacity: 0.5 };
const priceVal: React.CSSProperties = { fontSize: 18, fontWeight: 800 };
const cashForm: React.CSSProperties = { marginTop: 30, display: 'grid', gap: 12 };
const bankInfo: React.CSSProperties = { fontSize: 12, opacity: 0.4, fontStyle: 'italic' };
const orderBtn: React.CSSProperties = { width: '100%', padding: '20px', borderRadius: 18, background: 'white', color: 'black', border: 'none', fontWeight: 900, fontSize: 18, cursor: 'pointer', marginTop: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, transition: 'transform 0.2s' };
const msgBox: React.CSSProperties = { marginTop: 20, padding: 16, borderRadius: 12, background: 'rgba(59,130,246,0.1)', color: 'white', fontSize: 14, fontWeight: 700, whiteSpace: 'pre-line', border: '1px solid rgba(255,255,255,0.1)' };
const imageCol: React.CSSProperties = { position: 'sticky', top: 40, height: 'fit-content' };
const infoCol: React.CSSProperties = { display: 'flex', flexDirection: 'column' };
const emptyAddr: React.CSSProperties = { padding: '20px', textAlign: 'center', opacity: 0.3, fontSize: 14, border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 16 };
