import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const HomeSlider = () => {
    const [banners, setBanners] = useState<any[]>([]);
    const [current, setCurrent] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadBanners();
    }, []);

    useEffect(() => {
        if (banners.length > 0) {
            const timer = setInterval(() => {
                next();
            }, 6000);
            return () => clearInterval(timer);
        }
    }, [current, banners]);

    async function loadBanners() {
        const { data } = await supabase
            .from('home_banners')
            .select('*')
            .eq('is_active', true)
            .order('order_index', { ascending: true });
        
        setBanners(data || []);
        setLoading(false);
    }

    const next = () => setCurrent(prev => (prev + 1) % banners.length);
    const prev = () => setCurrent(prev => (prev - 1 + banners.length) % banners.length);

    if (loading) return <div style={placeholderStyle}>HOOP COLLECTOR</div>;
    
    // Default fallback when no banners are active
    if (banners.length === 0) return (
        <div style={emptySliderStyle}>
            <div style={{ textAlign: 'center', maxWidth: '600px', padding: '0 20px' }}>
                <div style={badge}>WELCOME TO HOOP COLLECTOR</div>
                <h1 style={{ ...title, fontSize: '3rem' }}>현재 등록된 배너가 없습니다</h1>
                <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '2rem' }}>어드민 포털에서 홈페이지 첫 화면을 장식할 멋진 광고 사진들을 직접 등록해 보세요!</p>
                <Link to="/admin/website" style={primaryBtn}>배너 관리하러 가기</Link>
            </div>
        </div>
    );

    const activeBanner = banners[current];

    return (
        <div style={sliderContainer}>
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeBanner.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.2, ease: "easeInOut" }}
                    style={{ ...slide, backgroundImage: `url(${activeBanner.image_url})` }}
                >
                    <div style={overlay}>
                        <motion.div 
                            initial={{ y: 30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5, duration: 0.8 }}
                            style={content}
                        >
                            <div style={badge}>SPECIAL ADVERTISEMENT</div>
                            <h1 style={title}>{activeBanner.title || 'HOOP COLLECTOR'}</h1>
                            {activeBanner.subtitle && <p style={subtitle}>{activeBanner.subtitle}</p>}
                            <div style={ctaArea}>
                                <button style={primaryBtn}>자세히 보기</button>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Navigation Arrows */}
            {banners.length > 1 && (
                <>
                    <button onClick={prev} style={{ ...navBtn, left: '30px' }}><ChevronLeft size={32} /></button>
                    <button onClick={next} style={{ ...navBtn, right: '30px' }}><ChevronRight size={32} /></button>
                    
                    {/* Indicators */}
                    <div style={indicatorWrap}>
                        {banners.map((_, idx) => (
                            <div 
                                key={idx} 
                                onClick={() => setCurrent(idx)}
                                style={{ ...dot, background: idx === current ? 'white' : 'rgba(255,255,255,0.3)' }}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

const sliderContainer: React.CSSProperties = { position: 'relative', width: '100%', height: '80vh', overflow: 'hidden', background: '#000' };
const slide: React.CSSProperties = { width: '100%', height: '100%', backgroundSize: 'cover', backgroundPosition: 'center', position: 'absolute' };
const overlay: React.CSSProperties = { position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.5) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const content: React.CSSProperties = { textAlign: 'center', maxWidth: '800px', padding: '0 20px' };
const badge: React.CSSProperties = { fontSize: '0.8rem', fontWeight: 900, letterSpacing: '0.3em', color: 'rgba(255,255,255,0.6)', marginBottom: '1.5rem' };
const title: React.CSSProperties = { fontSize: 'clamp(3rem, 10vw, 6rem)', fontWeight: 950, marginBottom: '2rem', color: 'white', letterSpacing: '-0.04em', lineHeight: 1 };
const subtitle: React.CSSProperties = { fontSize: '1.2rem', color: 'rgba(255,255,255,0.8)', marginBottom: '3rem', fontWeight: 500 };
const ctaArea: React.CSSProperties = { display: 'flex', justifyContent: 'center', gap: '20px' };
const primaryBtn: React.CSSProperties = { padding: '18px 40px', borderRadius: '100px', background: 'white', color: 'black', border: 'none', fontWeight: 900, cursor: 'pointer', fontSize: '1rem', letterSpacing: '0.05em' };
const navBtn: React.CSSProperties = { position: 'absolute', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.5, zIndex: 10 };
const indicatorWrap: React.CSSProperties = { position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '12px', zIndex: 10 };
const dot: React.CSSProperties = { width: '10px', height: '10px', borderRadius: '50%', cursor: 'pointer', transition: 'all 0.3s' };
const placeholderStyle: React.CSSProperties = { width: '100%', height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#070708', color: 'rgba(255,255,255,0.05)', fontSize: '4rem', fontWeight: 950 };
const emptySliderStyle: React.CSSProperties = { width: '100%', height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(to bottom, #070708, #111)', borderBottom: '1px solid rgba(255,255,255,0.05)' };
