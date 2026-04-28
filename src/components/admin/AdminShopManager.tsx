import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2, Save, X, Package, Tag, Layers, Image as ImageIcon } from 'lucide-react';
import { ShopProduct, ShopVariant } from '../../types/dashboard';
import { ImageUploadField } from './ImageUploadField';


export const AdminShopManager = () => {
    const [products, setProducts] = useState<ShopProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingProduct, setEditingProduct] = useState<ShopProduct | null>(null);
    const [variants, setVariants] = useState<ShopVariant[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadProducts();
    }, []);

    async function loadProducts() {
        setLoading(true);
        const { data, error } = await supabase.from('shop_products').select('*').order('created_at', { ascending: false });
        if (!error && data) setProducts(data);
        setLoading(false);
    }

    async function loadVariants(productId: string) {
        const { data, error } = await supabase.from('shop_product_variants').select('*').eq('product_id', productId);
        if (!error && data) setVariants(data);
    }

    const startEdit = async (p: ShopProduct) => {
        setEditingProduct(p);
        await loadVariants(p.id);
    };

    const startNew = () => {
        setEditingProduct({
            id: '',
            title: '',
            description: '',
            thumbnail_url: '',
            category: 'Hoodie',
            slug: '',
            is_active: true
        });
        setVariants([]);
    };

    const handleSave = async () => {
        if (!editingProduct) return;
        setIsSaving(true);

        // Strictly define only the columns that exist in the database
        const pData = {
            title: editingProduct.title,
            description: editingProduct.description,
            thumbnail_url: editingProduct.thumbnail_url,
            image_urls: (editingProduct as any).image_urls || [],
            category: editingProduct.category,
            slug: editingProduct.slug,
            is_active: editingProduct.is_active
        };
        const isNew = !editingProduct.id;

        try {
            let productId = editingProduct.id;

            if (isNew) {
                const { data, error } = await supabase.from('shop_products').insert([pData]).select().single();
                if (error) {
                    console.error('Insert Error:', error);
                    throw error;
                }
                productId = data.id;
            } else {
                const { error } = await supabase.from('shop_products').update(pData).eq('id', productId);
                if (error) throw error;
            }

            // Save variants
            for (const v of variants) {
                const vData = { ...v, product_id: productId };
                const isNewV = v.id.startsWith('new-');
                
                if (isNewV) {
                    const cleanV: any = { ...vData };
                    delete cleanV.id;
                    const { error: vInsertError } = await supabase.from('shop_product_variants').insert([cleanV]);
                    if (vInsertError) throw vInsertError;
                } else {
                    const cleanV: any = { ...vData };
                    delete cleanV.id;
                    const { error: vUpdateError } = await supabase.from('shop_product_variants').update(cleanV).eq('id', v.id);
                    if (vUpdateError) throw vUpdateError;
                }
            }

            alert("성공적으로 저장되었습니다.");
            setEditingProduct(null);
            loadProducts();
        } catch (e: any) {
            console.error('Final Save Error:', e);
            const errorMsg = e.message || 'Unknown error';
            const errorDetails = e.details || '';
            const errorHint = e.hint || '';
            alert(`오류 발생: ${errorMsg}\n${errorDetails}\n${errorHint}`);
        } finally {
            setIsSaving(false);
        }
    };

    const addVariant = () => {
        setVariants([...variants, {
            id: 'new-' + Date.now(),
            product_id: editingProduct?.id || '',
            size_label: 'FREE',
            point_price: 0,
            stock_qty: 0,
            is_active: true
        }]);
    };

    if (loading) return <div style={{ padding: 40, textAlign: 'center', opacity: 0.5 }}>로딩 중...</div>;

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900 }}>쇼핑몰 상품 관리</h2>
                <button onClick={startNew} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={18} /> 새 상품 등록
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {products.map(p => (
                    <div key={p.id} className="card-minimal" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div style={{ width: '100%', aspectRatio: '1/1', background: '#111827', borderRadius: '12px', overflow: 'hidden' }}>
                            {p.thumbnail_url ? (
                                <img src={p.thumbnail_url} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>
                                    <ImageIcon size={40} />
                                </div>
                            )}
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 900, color: 'rgba(255,255,255,0.3)', marginBottom: '4px' }}>{p.category.toUpperCase()}</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '8px' }}>{p.title}</div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={() => startEdit(p)} style={{ flex: 1, padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                    <Edit2 size={14} /> 수정
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Edit Modal */}
            {editingProduct && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px' }}>
                    <div className="admin-modal-content" style={{ background: '#000000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', width: '100%', maxWidth: '800px', maxHeight: '95vh', overflowY: 'auto', padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 900 }}>{editingProduct.id ? '상품 정보 수정' : '새 상품 등록'}</h3>
                            <button onClick={() => setEditingProduct(null)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <div className="admin-grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                            {/* Basic Info */}
                            <div style={{ display: 'grid', gap: '16px' }}>
                                <div>
                                    <label style={labelStyle}>상품 제목</label>
                                    <input style={inputStyle} value={editingProduct.title || ''} onChange={e => setEditingProduct({...editingProduct, title: e.target.value})} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <div>
                                        <label style={labelStyle}>슬러그 (URL)</label>
                                        <input style={inputStyle} value={editingProduct.slug || ''} onChange={e => setEditingProduct({...editingProduct, slug: e.target.value})} placeholder="ex: black-hoodie" />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>카테고리</label>
                                        <select style={inputStyle} value={editingProduct.category} onChange={e => setEditingProduct({...editingProduct, category: e.target.value})}>
                                            <option value="Hoodie">Hoodie</option>
                                            <option value="Tshirt">T-Shirt</option>
                                            <option value="Socks">Socks</option>
                                            <option value="Headwear">Headwear</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <ImageUploadField 
                                        label="상품 썸네일 이미지"
                                        value={editingProduct.thumbnail_url || ''}
                                        onChange={(url) => setEditingProduct({...editingProduct, thumbnail_url: url})}
                                        helperText="권장: 1:1 비율"
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>상품 설명</label>
                                    <textarea style={{...inputStyle, minHeight: '80px'}} value={editingProduct.description || ''} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} />
                                </div>

                                {/* Multi-Image Section with Guide */}
                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                                        <ImageIcon size={18} color="var(--color-primary)" />
                                        <label style={{ ...labelStyle, marginBottom: 0 }}>상세 이미지 및 촬영 가이드</label>
                                    </div>
                                    
                                    <div style={photoGuideGrid}>
                                        <PhotoGuideBox title="① 앞면" desc="정면 전체 샷" />
                                        <PhotoGuideBox title="② 뒷면" desc="등판/프린팅 확인" />
                                        <PhotoGuideBox title="③ 로고" desc="자수/로고 근접 샷" />
                                        <PhotoGuideBox title="④ 안감/라벨" desc="재질 및 사이즈 택" />
                                    </div>

                                    <div style={{ display: 'grid', gap: '12px', marginTop: '15px' }}>
                                        {((editingProduct as any).image_urls || []).map((url: string, idx: number) => (
                                            <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <input style={{ ...inputStyle, flex: 1, fontSize: '0.8rem' }} value={url} readOnly />
                                                <button onClick={() => {
                                                    const newUrls = [...((editingProduct as any).image_urls || [])];
                                                    newUrls.splice(idx, 1);
                                                    setEditingProduct({ ...editingProduct, image_urls: newUrls } as any);
                                                }} style={removePhotoBtn}>삭제</button>
                                            </div>
                                        ))}
                                        <ImageUploadField 
                                            label="+ 사진 추가하기"
                                            value=""
                                            onChange={(url) => {
                                                const current = (editingProduct as any).image_urls || [];
                                                if (current.length >= 5) return alert("최대 5장까지 등록 가능합니다.");
                                                setEditingProduct({ ...editingProduct, image_urls: [...current, url] } as any);
                                            }}
                                            helperText="순서대로 앞면, 뒷면, 디테일 컷을 올려주세요."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Variants Info */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                    <label style={labelStyle}>사이즈 및 가격 옵션</label>
                                    <button onClick={addVariant} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}>+ 옵션 추가</button>
                                </div>
                                <div style={{ display: 'grid', gap: '12px' }}>
                                    {variants.map((v, idx) => (
                                        <div key={v.id} style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                                <div>
                                                    <label style={{ ...labelStyle, fontSize: '0.65rem', marginBottom: '4px' }}>사이즈</label>
                                                    <input style={vInputStyle} placeholder="FREE" value={v.size_label} onChange={e => {
                                                        const newV = [...variants];
                                                        newV[idx] = { ...newV[idx], size_label: e.target.value };
                                                        setVariants(newV);
                                                    }} />
                                                </div>
                                                <div>
                                                    <label style={{ ...labelStyle, fontSize: '0.65rem', marginBottom: '4px' }}>가격(P)</label>
                                                    <input type="number" style={vInputStyle} value={v.point_price} onChange={e => {
                                                        const val = parseInt(e.target.value) || 0;
                                                        const newV = [...variants];
                                                        newV[idx] = { ...newV[idx], point_price: val };
                                                        setVariants(newV);
                                                    }} />
                                                </div>
                                                <div>
                                                    <label style={{ ...labelStyle, fontSize: '0.65rem', marginBottom: '4px' }}>재고</label>
                                                    <input type="number" style={vInputStyle} value={v.stock_qty} onChange={e => {
                                                        const val = parseInt(e.target.value) || 0;
                                                        const newV = [...variants];
                                                        newV[idx] = { ...newV[idx], stock_qty: val };
                                                        setVariants(newV);
                                                    }} />
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                <button onClick={() => setVariants(variants.filter((_, i) => i !== idx))} style={{ background: 'rgba(255,0,0,0.1)', border: 'none', color: '#ff4444', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Trash2 size={12} /> 옵션 삭제
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {variants.length === 0 && <div style={{ fontSize: '0.85rem', opacity: 0.3, textAlign: 'center', padding: '20px' }}>등록된 옵션이 없습니다.</div>}
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '30px', display: 'flex', flexWrap: 'wrap', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '24px' }}>
                            <button onClick={() => setEditingProduct(null)} style={{ flex: 1, minWidth: '120px', padding: '14px', borderRadius: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontWeight: 700, cursor: 'pointer' }}>취소</button>
                            <button onClick={handleSave} disabled={isSaving} className="btn-primary" style={{ flex: 2, minWidth: '200px', padding: '14px' }}>
                                {isSaving ? '저장 중...' : '상품 정보 저장하기'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const labelStyle: React.CSSProperties = { fontSize: '0.75rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', fontSize: '0.9rem', outline: 'none' };
const vInputStyle: React.CSSProperties = { ...inputStyle, padding: '8px 10px', fontSize: '0.8rem' };

const photoGuideGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' };
const photoGuideItem: React.CSSProperties = { background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '10px', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)' };
const removePhotoBtn: React.CSSProperties = { padding: '8px 12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: '0.75rem' };

const PhotoGuideBox = ({ title, desc }: { title: string, desc: string }) => (
    <div style={photoGuideItem}>
        <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--color-primary)', marginBottom: '4px' }}>{title}</div>
        <div style={{ fontSize: '0.6rem', opacity: 0.5, lineHeight: 1.2 }}>{desc}</div>
    </div>
);
