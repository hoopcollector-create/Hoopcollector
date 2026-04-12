import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Trash2, Save, ToggleLeft, ToggleRight, ImageIcon, AlertCircle, Type, ExternalLink, Link as LinkIcon } from 'lucide-react';
import { ImageUploadField } from './ImageUploadField';

export const WebsiteManager = () => {
    const [activeTab, setActiveTab] = useState<'banners' | 'settings'>('banners');
    const [banners, setBanners] = useState<any[]>([]);
    const [settings, setSettings] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        await Promise.all([loadBanners(), loadSettings()]);
        setLoading(false);
    }

    async function loadSettings() {
        const { data, error } = await supabase.from('site_settings').select('*').eq('id', 'main').maybeSingle();
        if (data) {
            setSettings(data);
        } else if (error && error.code !== 'PGRST116') {
            console.error('Error loading settings:', error);
        }
    }

    async function updateSettings(updates: any) {
        setMsg("설정 저장 중...");
        const { error } = await supabase.from('site_settings').upsert({ id: 'main', ...updates });
        if (error) {
            setMsg("저장 실패: " + error.message);
        } else {
            setSettings({ ...settings, ...updates });
            setMsg("전역 설정이 저장되었습니다.");
        }
    }

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
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>WEBSITE CONTROL CENTER</h1>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.95rem' }}>홈페이지 첫 화면의 광고와 전역 설정을 실시간으로 제어합니다.</p>
                </div>
                {activeTab === 'banners' && (
                    <button onClick={addBanner} style={addBtn}><Plus size={20} /> 신규 광고 배너 추가</button>
                )}
            </div>

            {/* Tab Navigation */}
            <div style={tabNav}>
                <button 
                    onClick={() => setActiveTab('banners')} 
                    style={activeTab === 'banners' ? activeTabStyle : tabStyle}
                >
                    배너 슬라이더 관리
                </button>
                <button 
                    onClick={() => setActiveTab('settings')} 
                    style={activeTab === 'settings' ? activeTabStyle : tabStyle}
                >
                    홈페이지 전역 설정
                </button>
            </div>

            {msg && <div style={msgBox}>{msg}</div>}

            {loading ? <div style={{ opacity: 0.5 }}>로드 중...</div> : (
                activeTab === 'banners' ? (
                    <>
                        {/* Practical Guide */}
                        <div style={guideBox}>
                            <div style={{ fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <AlertCircle size={18} color="var(--color-coach)" /> 관리자 가이드
                            </div>
                            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                                <li><strong>이미지 업로드</strong>: 파일을 직접 선택하여 서버로 업로드할 수 있습니다.</li>
                                <li><strong>정렬 순서</strong>: 번호가 낮을수록 슬라이더의 앞부분에 나타납니다.</li>
                                <li><strong>노출 상태</strong>: '비활성'으로 설정하면 홈페이지에서 즉시 사라집니다.</li>
                            </ul>
                        </div>
                <div style={grid}>
                    {banners.length === 0 ? (
                        <div style={emptyPlaceholder} onClick={addBanner}>
                            <ImageIcon size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                            <div>아직 등록된 광고가 없습니다.</div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.5, marginTop: '8px' }}>여기를 눌러 첫 번째 배너를 만들어보세요!</div>
                        </div>
                    ) : banners.map((banner) => (
                        <div key={banner.id} style={{ ...card, border: banner.is_active ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(255,255,255,0.08)' }}>
                            <div style={imgWrap}>
                                <img src={banner.image_url} alt="Banner Preview" style={{ ...img, opacity: banner.is_active ? 1 : 0.3 }} />
                                {!banner.is_active && <div style={inactiveOverlay}>비활성 상태</div>}
                            </div>
                            <div style={info}>
                                <div style={{ marginBottom: '20px' }}>
                                    <ImageUploadField 
                                        label="배너 배경 이미지"
                                        value={banner.image_url}
                                        onChange={(url) => updateBanner(banner.id, { image_url: url })}
                                        helperText="권장 사이즈: 1920x1080px (16:9 비율)"
                                    />
                                </div>
                                <div style={inputGroup}>
                                    <label style={label}>배너 타이틀 (선택 사항)</label>
                                    <input 
                                        style={input} 
                                        value={banner.title || ''} 
                                        placeholder="홈페이지에 표시될 굵은 글씨"
                                        onChange={(e) => updateBanner(banner.id, { title: e.target.value })}
                                    />
                                </div>

                                <div style={linkSection}>
                                    <div style={{ fontWeight: 800, fontSize: '0.7rem', color: 'var(--color-coach)', marginBottom: '12px', letterSpacing: '0.1em' }}>LINK & CALL TO ACTION</div>
                                    
                                    <div style={inputGroup}>
                                        <label style={subLabel}>이미지 클릭 시 이동 (URL)</label>
                                        <div style={iconInputWrap}>
                                            <ExternalLink size={14} style={inputIcon} />
                                            <input 
                                                style={subInput} 
                                                value={banner.link_url || ''} 
                                                placeholder="/class-info or https://..."
                                                onChange={(e) => updateBanner(banner.id, { link_url: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        <div style={inputGroup}>
                                            <label style={subLabel}>버튼 문구</label>
                                            <div style={iconInputWrap}>
                                                <Type size={14} style={inputIcon} />
                                                <input 
                                                    style={subInput} 
                                                    value={banner.button_text || ''} 
                                                    placeholder="바로가기"
                                                    onChange={(e) => updateBanner(banner.id, { button_text: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div style={inputGroup}>
                                            <label style={subLabel}>버튼 주소 (URL)</label>
                                            <div style={iconInputWrap}>
                                                <LinkIcon size={14} style={inputIcon} />
                                                <input 
                                                    style={subInput} 
                                                    value={banner.button_url || ''} 
                                                    placeholder="/shop or https://..."
                                                    onChange={(e) => updateBanner(banner.id, { button_url: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div style={{ display: 'flex', gap: '12px', marginTop: '1.5rem' }}>
                                    <button 
                                        onClick={() => updateBanner(banner.id, { is_active: !banner.is_active })}
                                        style={{ ...actionBtnBase, flex: 1, background: banner.is_active ? '#3b82f6' : 'rgba(255,255,255,0.1)', color: 'white' }}
                                    >
                                        {banner.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                        <span style={{ marginLeft: 8 }}>{banner.is_active ? '노출 중' : '비활성'}</span>
                                    </button>
                                    <button onClick={() => deleteBanner(banner.id)} style={deleteBtnStyle}>
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    </div>
                ) : (
                    <div style={{ maxWidth: '800px' }}>
                        <div style={card}>
                            <div style={info}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '1.5rem', color: 'var(--color-coach)' }}>메인 CTA 섹션 설정</h3>
                                
                                <div style={{ marginBottom: '2rem' }}>
                                    <ImageUploadField 
                                        label="섹션 배경 이미지"
                                        value={settings?.home_cta_bg_image || ''}
                                        onChange={(url) => updateSettings({ home_cta_bg_image: url })}
                                        helperText="메인 하단 광고 영역의 배경 이미지입니다."
                                    />
                                </div>

                                <div style={inputGroup}>
                                    <label style={label}>메인 타이틀</label>
                                    <input 
                                        style={input} 
                                        value={settings?.home_cta_title || ''} 
                                        onChange={(e) => setSettings({ ...settings, home_cta_title: e.target.value })}
                                        onBlur={() => updateSettings({ home_cta_title: settings.home_cta_title })}
                                    />
                                </div>

                                <div style={inputGroup}>
                                    <label style={label}>설명 문구</label>
                                    <textarea 
                                        style={{ ...input, minHeight: '100px', resize: 'vertical' }} 
                                        value={settings?.home_cta_description || ''} 
                                        onChange={(e) => setSettings({ ...settings, home_cta_description: e.target.value })}
                                        onBlur={() => updateSettings({ home_cta_description: settings.home_cta_description })}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div style={inputGroup}>
                                        <label style={label}>버튼 문구</label>
                                        <input 
                                            style={input} 
                                            value={settings?.home_cta_button_text || ''} 
                                            onChange={(e) => setSettings({ ...settings, home_cta_button_text: e.target.value })}
                                            onBlur={() => updateSettings({ home_cta_button_text: settings.home_cta_button_text })}
                                        />
                                    </div>
                                    <div style={inputGroup}>
                                        <label style={label}>버튼 연결 주소 (URL)</label>
                                        <input 
                                            style={input} 
                                            value={settings?.home_cta_button_url || ''} 
                                            onChange={(e) => setSettings({ ...settings, home_cta_button_url: e.target.value })}
                                            onBlur={() => updateSettings({ home_cta_button_url: settings.home_cta_button_url })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            )}
        </div>
    );
};

const guideBox: React.CSSProperties = { padding: '24px', borderRadius: '20px', background: 'var(--bg-surface-L2)', border: '1px solid var(--border-distinct)', marginBottom: '2.5rem', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' };
const emptyPlaceholder: React.CSSProperties = { gridColumn: '1 / -1', padding: '100px', borderRadius: '32px', background: 'var(--bg-surface-L1)', border: '2px dashed var(--border-subtle)', textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s' };
const inactiveOverlay: React.CSSProperties = { position: 'absolute', inset: 0, background: 'rgba(7,7,8,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 950, color: '#ef4444', fontSize: '0.9rem', backdropFilter: 'blur(4px)' };
const actionBtnBase: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', borderRadius: '12px', border: 'none', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' };
const deleteBtnStyle: React.CSSProperties = { padding: '12px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', cursor: 'pointer', transition: 'all 0.2s' };

const grid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '32px' };
const card: React.CSSProperties = { borderRadius: '28px', background: 'var(--bg-surface-L1)', border: '1px solid var(--border-subtle)', overflow: 'hidden', transition: 'all 0.3s', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' };
const imgWrap: React.CSSProperties = { width: '100%', aspectRatio: '16 / 9', background: '#000', position: 'relative', borderBottom: '1px solid var(--border-subtle)' };
const img: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.3s' };
const info: React.CSSProperties = { padding: '28px' };
const inputGroup: React.CSSProperties = { marginBottom: '20px' };
const label: React.CSSProperties = { display: 'block', fontSize: '0.75rem', fontWeight: 900, opacity: 0.5, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-coach)' };
const input: React.CSSProperties = { width: '100%', padding: '14px 18px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-distinct)', color: 'white', fontSize: '0.95rem', outline: 'none', transition: 'all 0.2s' };
const addBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '10px', padding: '16px 32px', borderRadius: '16px', background: 'white', color: 'black', border: 'none', fontWeight: 950, cursor: 'pointer', boxShadow: '0 10px 30px rgba(255,255,255,0.2)', transition: 'all 0.2s' };
const msgBox: React.CSSProperties = { padding: '16px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-coach)', borderRadius: '16px', marginBottom: '2.5rem', fontWeight: 900, textAlign: 'center', border: '1px solid rgba(59, 130, 246, 0.2)' };

const linkSection: React.CSSProperties = { marginTop: '20px', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' };
const subLabel: React.CSSProperties = { display: 'block', fontSize: '0.65rem', fontWeight: 900, opacity: 0.3, marginBottom: '6px', textTransform: 'uppercase' };
const iconInputWrap: React.CSSProperties = { position: 'relative', display: 'flex', alignItems: 'center' };
const inputIcon: React.CSSProperties = { position: 'absolute', left: '14px', opacity: 0.3 };
const subInput: React.CSSProperties = { ...input, padding: '10px 14px 10px 38px', fontSize: '0.85rem', borderRadius: '10px' };

const tabNav: React.CSSProperties = { display: 'flex', gap: '8px', marginBottom: '2.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1px' };
const tabStyle: React.CSSProperties = { padding: '12px 24px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s', borderBottom: '2px solid transparent' };
const activeTabStyle: React.CSSProperties = { ...tabStyle, color: 'white', borderBottom: '2px solid var(--color-coach)' };
