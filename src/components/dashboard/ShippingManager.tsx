import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ShippingAddress } from '../../types/dashboard';
import { Search, MapPin, CheckCircle, Trash2, Plus } from 'lucide-react';

interface ShippingManagerProps {
    uid: string;
    loading: boolean;
    setLoading: (v: boolean) => void;
    setMsg: (v: string) => void;
}

declare global {
    interface Window {
        daum: any;
    }
}

export const ShippingManager = ({ uid, loading, setLoading, setMsg }: ShippingManagerProps) => {
    const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
    const [showForm, setShowForm] = useState(false);
    
    // Form fields
    const [label, setLabel] = useState('');
    const [recipient, setRecipient] = useState('');
    const [phone, setPhone] = useState('');
    const [postcode, setPostcode] = useState('');
    const [addressRoad, setAddressRoad] = useState('');
    const [addressExtra, setAddressExtra] = useState('');
    const [detailAddress, setDetailAddress] = useState('');
    const [isDefault, setIsDefault] = useState(false);

    useEffect(() => {
        loadAddresses();
        loadKakaoScript();
    }, [uid]);

    async function loadAddresses() {
        if (!uid) return;
        setLoading(true);
        const { data, error } = await supabase.from('shipping_addresses').select('*').eq('user_id', uid).order('is_default', { ascending: false }).order('created_at', { ascending: false });
        if (!error && data) setAddresses(data);
        setLoading(false);
    }

    function loadKakaoScript() {
        if (document.getElementById('kakao-postcode')) return;
        const script = document.createElement('script');
        script.id = 'kakao-postcode';
        script.src = '//t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
        document.head.appendChild(script);
    }

    function openKakaoSearch() {
        if (!window.daum || !window.daum.Postcode) {
            setMsg('주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.');
            return;
        }
        new window.daum.Postcode({
            oncomplete: (data: any) => {
                setPostcode(data.zonecode);
                setAddressRoad(data.roadAddress);
                setAddressExtra(data.buildingName ? `(${data.buildingName})` : '');
            }
        }).open();
    }

    async function saveAddress() {
        if (!label || !recipient || !phone || !postcode || !addressRoad) {
            setMsg('모든 필수 항목을 입력해 주세요.');
            return;
        }
        setLoading(true);
        try {
            if (isDefault) {
                // Reset other defaults
                await supabase.from('shipping_addresses').update({ is_default: false }).eq('user_id', uid);
            }
            
            const { error } = await supabase.from('shipping_addresses').insert({
                user_id: uid, label: label.trim(), recipient_name: recipient.trim(),
                phone: phone.trim(), postcode, address_road: addressRoad,
                address_extra: addressExtra, detail_address: detailAddress.trim(),
                is_default: isDefault
            });
            
            if (error) throw error;
            setMsg('배송지가 저장되었습니다.');
            setShowForm(false);
            resetForm();
            loadAddresses();
        } catch (e: any) {
            setMsg(e.message);
        } finally {
            setLoading(false);
        }
    }

    async function deleteAddress(id: string) {
        if (!confirm('배송지를 삭제하시겠습니까?')) return;
        setLoading(true);
        const { error } = await supabase.from('shipping_addresses').delete().eq('id', id);
        if (error) setMsg(error.message);
        else {
            setMsg('삭제 완료');
            loadAddresses();
        }
        setLoading(false);
    }

    function resetForm() {
        setLabel(''); setRecipient(''); setPhone(''); setPostcode('');
        setAddressRoad(''); setAddressExtra(''); setDetailAddress(''); setIsDefault(false);
    }

    return (
        <div style={{ marginTop: 40 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 18, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MapPin size={20} /> 배송지 관리
                </h3>
                <button 
                    onClick={() => setShowForm(!showForm)} 
                    style={{ ...btnGhost, color: showForm ? '#ef4444' : 'var(--color-student)' }}
                >
                    {showForm ? '닫기' : <><Plus size={16} style={{ marginRight: 4 }} /> 새 배송지 추가</>}
                </button>
            </div>

            {showForm && (
                <div style={formCard}>
                    <div style={grid2}>
                        <div><div style={inputLabel}>배송지 이름 (예: 집, 회사)</div><input value={label} onChange={e=>setLabel(e.target.value)} style={input} placeholder="예: 우리집" /></div>
                        <div><div style={inputLabel}>수령인</div><input value={recipient} onChange={e=>setRecipient(e.target.value)} style={input} /></div>
                    </div>
                    <div style={grid2}>
                        <div><div style={inputLabel}>연락처</div><input value={phone} onChange={e=>setPhone(e.target.value)} style={input} placeholder="010-0000-0000" /></div>
                        <div>
                            <div style={inputLabel}>우편번호</div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <input value={postcode} readOnly style={{ ...input, flex: 1 }} />
                                <button onClick={openKakaoSearch} style={searchBtn}>검색</button>
                            </div>
                        </div>
                    </div>
                    <div><div style={inputLabel}>기본주소</div><input value={addressRoad} readOnly style={input} /></div>
                    <div style={grid2}>
                        <div><div style={inputLabel}>참고항목</div><input value={addressExtra} readOnly style={input} /></div>
                        <div><div style={inputLabel}>상세주소</div><input value={detailAddress} onChange={e=>setDetailAddress(e.target.value)} style={input} /></div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, cursor: 'pointer' }} onClick={() => setIsDefault(!isDefault)}>
                        <div style={{ ...checkbox, borderColor: isDefault ? 'var(--color-student)' : 'rgba(255,255,255,0.2)' }}>
                            {isDefault && <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--color-student)' }} />}
                        </div>
                        <span style={{ fontSize: 13, opacity: 0.8 }}>기본 배송지로 설정</span>
                    </div>
                    <button onClick={saveAddress} disabled={loading} style={btnSave}>
                        {loading ? '저장 중...' : '배송지 저장'}
                    </button>
                </div>
            )}

            <div style={{ display: 'grid', gap: 12 }}>
                {addresses.map(addr => (
                    <div key={addr.id} style={addressCard}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                    <span style={addrLabel}>{addr.label}</span>
                                    {addr.is_default && <span style={defaultBadge}>기본</span>}
                                </div>
                                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{addr.recipient_name} <span style={{ fontSize: 14, fontWeight: 500, opacity: 0.5 }}>{addr.phone}</span></div>
                                <div style={{ fontSize: 14, opacity: 0.7, lineHeight: 1.5 }}>
                                    [{addr.postcode}] {addr.address_road} {addr.address_extra}
                                    <br />{addr.detail_address}
                                </div>
                            </div>
                            <button onClick={() => deleteAddress(addr.id)} style={deleteBtn}><Trash2 size={16} /></button>
                        </div>
                    </div>
                ))}
                {addresses.length === 0 && !showForm && <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.4, border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 16 }}>등록된 배송지가 없습니다.</div>}
            </div>
        </div>
    );
};

const formCard: React.CSSProperties = { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 20, marginBottom: 20, display: 'grid', gap: 16 };
const inputLabel: React.CSSProperties = { fontSize: 11, fontWeight: 800, textTransform: 'uppercase', opacity: 0.5, marginBottom: 6, letterSpacing: '0.05em' };
const input: React.CSSProperties = { width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: 14, outline: 'none' };
const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 };
const searchBtn: React.CSSProperties = { padding: '0 20px', borderRadius: 12, border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer' };
const btnSave: React.CSSProperties = { marginTop: 10, padding: 14, borderRadius: 12, border: 'none', background: 'var(--color-student)', color: 'white', fontWeight: 900, fontSize: 15, cursor: 'pointer' };
const btnGhost: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center' };
const checkbox: React.CSSProperties = { width: 20, height: 20, borderRadius: 6, border: '2px solid', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const addressCard: React.CSSProperties = { padding: 16, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' };
const addrLabel: React.CSSProperties = { fontSize: 11, fontWeight: 900, padding: '2px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.1)', opacity: 0.8 };
const defaultBadge: React.CSSProperties = { fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 4, background: 'var(--color-student)', color: 'white' };
const deleteBtn: React.CSSProperties = { padding: 8, borderRadius: 8, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', cursor: 'pointer' };
