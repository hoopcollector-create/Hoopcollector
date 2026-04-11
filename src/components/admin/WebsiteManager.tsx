import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Trash2, Save, ToggleLeft, ToggleRight, ImageIcon } from 'lucide-react';

export const WebsiteManager = () => {
    const [banners, setBanners] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState("");

    useEffect(() => {
        loadBanners();
    }, []);

    async function loadBanners() {
        setLoading(true);
        const { data } = await supabase
            .from('home_banners')
            .select('*')
            .order('order_index', { ascending: true });
        setBanners(data || []);
        setLoading(false);
    }

    async function addBanner() {
        const { data, error } = await supabase.from('home_banners').insert({
            image_url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc',
            title: 'Premium Basketball Lesson',
            is_active: true,
            order_index: banners.length
        }).select().single();

        if (error) setMsg(error.message);
        else {
            setBanners([...banners, data]);
            setMsg("새 배너가 추가되었습니다.");
        }
    }

    async function updateBanner(id: string, updates: any) {
        const { error } = await supabase.from('home_banners').update(updates).eq('id', id);
        if (error) setMsg(error.message);
        else {
            setBanners(banners.map(b => b.id === id ? { ...b, ...updates } : b));
            setMsg("업데이트 되었습니다.");
        }
    }

    async function deleteBanner(id: string) {
        if (!confirm("이 배너를 삭제하시겠습니까?")) return;
        const { error } = await supabase.from('home_banners').delete().eq('id', id);
        if (error) setMsg(error.message);
        else {
            setBanners(banners.filter(b => b.id !== id));
            setMsg("삭제되었습니다.");
        }
    }

    return (
        <div style={{ color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>홈페이지 배너 관리</h2>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>홈페이지 첫 화면 슬라이더 광고를 직접 관리합니다.</p>
                </div>
                <button onClick={addBanner} style={addBtn}><Plus size={18} /> 배너 추가</button>
            </div>

            {msg && <div style={msgBox}>{msg}</div>}

            {loading ? <div style={{ opacity: 0.5 }}>로딩 중...</div> : (
                <div style={grid}>
                    {banners.map((banner) => (
                        <div key={banner.id} style={card}>
                            <div style={imgWrap}>
                                <img src={banner.image_url} alt="Banner Preview" style={img} />
                            </div>
                            <div style={info}>
                                <div style={inputGroup}>
                                    <label style={label}>이미지 URL</label>
                                    <input 
                                        style={input} 
                                        value={banner.image_url} 
                                        onChange={(e) => updateBanner(banner.id, { image_url: e.target.value })}
                                        onBlur={() => setMsg("")}
                                    />
                                </div>
                                <div style={inputGroup}>
                                    <label style={label}>헤드라인 (선택)</label>
                                    <input 
                                        style={input} 
                                        value={banner.title || ''} 
                                        onChange={(e) => updateBanner(banner.id, { title: e.target.value })}
                                    />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
                                    <button 
                                        onClick={() => updateBanner(banner.id, { is_active: !banner.is_active })}
                                        style={{ ...toggleBtn, color: banner.is_active ? '#4ade80' : 'rgba(255,255,255,0.3)' }}
                                    >
                                        {banner.is_active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                                        <span style={{ marginLeft: 8 }}>{banner.is_active ? '노출 중' : '비활성'}</span>
                                    </button>
                                    <button onClick={() => deleteBanner(banner.id)} style={deleteBtn}><Trash2 size={18} /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const grid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' };
const card: React.CSSProperties = { borderRadius: '24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' };
const imgWrap: React.CSSProperties = { width: '100%', aspectRatio: '16 / 9', background: '#000', borderBottom: '1px solid rgba(255,255,255,0.08)' };
const img: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'cover' };
const info: React.CSSProperties = { padding: '20px' };
const inputGroup: React.CSSProperties = { marginBottom: '12px' };
const label: React.CSSProperties = { display: 'block', fontSize: '0.7rem', fontWeight: 900, opacity: 0.4, marginBottom: '6px', textTransform: 'uppercase' };
const input: React.CSSProperties = { width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '0.85rem', outline: 'none' };
const addBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px', background: 'white', color: 'black', border: 'none', fontWeight: 900, cursor: 'pointer' };
const msgBox: React.CSSProperties = { padding: '12px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '12px', marginBottom: '1.5rem', fontWeight: 700, fontSize: '0.9rem' };
const toggleBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', background: 'transparent', border: 'none', fontWeight: 800, cursor: 'pointer' };
const deleteBtn: React.CSSProperties = { background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' };
