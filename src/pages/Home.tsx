import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { HomeSlider } from '../components/HomeSlider';
import { InstagramSection } from '../components/InstagramSection';
import { Compass, Users, Award, ShieldCheck, ArrowRight, BookOpen, Target } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Home = () => {
    const [settings, setSettings] = useState<any>(null);
    const [userCount, setUserCount] = useState<number>(0);
    const [coachCount, setCoachCount] = useState<number>(0);

    useEffect(() => {
        loadSettings();
    }, []);

    async function loadSettings() {
        // 1. Load site settings
        const { data } = await supabase.from('site_settings').select('*').eq('id', 'main').maybeSingle();
        if (data) setSettings(data);

        // 2. Load real user count
        const { count: users } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        setUserCount(users || 0);

        // 3. Load real coach count
        const { count: coaches } = await supabase.from('public_coach_profiles').select('*', { count: 'exact', head: true });
        setCoachCount(coaches || 0);
    }

    // Default values
    const ctaTitle = settings?.home_cta_title || '지금 바로 농구 수업을 시작해보세요';
    const ctaDesc = settings?.home_cta_description || '훕콜렉터의 전문 코치진이 여러분의 실력 향상을 위해 대기하고 있습니다.\n내 주변의 최적화된 클래스를 찾아보세요.';
    const ctaBtnText = settings?.home_cta_button_text || '수업 보러가기';
    const ctaBtnUrl = settings?.home_cta_button_url || '/class-info';
    const ctaBg = settings?.home_cta_bg_image;

    return (
        <div style={{ color: 'white', overflow: 'hidden' }}>
            {/* Hero Slider Section */}
            <HomeSlider />

            {/* Main Action: View Classes - Now at the Top */}
            <section style={{ 
                ...mainCtaSection, 
                backgroundImage: ctaBg ? `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${ctaBg})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            }}>
                <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
                    <div style={badgeStyle}>BASKETBALL LESSONS</div>
                    <h2 style={{ ...titleStyle, marginBottom: '2rem' }}>{ctaTitle}</h2>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.2rem', marginBottom: '3rem', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                        {ctaDesc}
                    </p>
                    <Link to={ctaBtnUrl} style={ctaBtn}>{ctaBtnText} <ArrowRight size={20} style={{ marginLeft: 10 }} /></Link>
                </div>
            </section>

            {/* Features Section - Now scrolled down */}
            <section style={{ padding: '100px 20px', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                    <div style={badgeStyle}>OUR SERVICES</div>
                    <h2 style={titleStyle}>무엇을 도와드릴까요?</h2>
                </div>

                <div style={featureGrid}>
                    <FeatureCard 
                        to="/coaches" 
                        icon={<Users size={32} />} 
                        title="실력파 코치진" 
                        desc="검증된 전문가들과 함께 실력을 키워보세요."
                    />
                    <FeatureCard 
                        to="/shop" 
                        icon={<Award size={32} />} 
                        title="훕스 숍" 
                        desc="농구인을 위한 프리미엄 기어와 포인트를 확인하세요."
                    />
                    <FeatureCard 
                        to="/match" 
                        icon={<Target size={32} />} 
                        title="매칭 및 모임" 
                        desc="내 주변의 픽업 게임을 찾고 새로운 팀원과 함께 경기하세요."
                    />
                </div>
            </section>

            {/* Trust Section */}
            <section style={trustSection}>
                <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px', textAlign: 'center' }}>
                    <div style={trustItem}>
                        <div style={trustIcon}><BookOpen size={40} /></div>
                        <div style={trustValue}>일관된 교육</div>
                        <div style={trustLabel}>체계적인 수업 커리큘럼</div>
                    </div>
                    <div style={trustItem}>
                        <div style={trustIcon}><Users size={40} /></div>
                        <div style={trustValue}>{coachCount.toLocaleString()}+</div>
                        <div style={trustLabel}>활성 전문 코치</div>
                    </div>
                    <div style={trustItem}>
                        <div style={trustIcon}><Users size={40} /></div>
                        <div style={trustValue}>{userCount.toLocaleString()}+</div>
                        <div style={trustLabel}>활성 학생 회원</div>
                    </div>
                </div>
            </section>
        </div>
    );
};

const FeatureCard = ({ to, icon, title, desc }: any) => (
    <Link to={to} style={cardStyle} className="feature-card">
        <div style={iconBox}>{icon}</div>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 850, marginBottom: '1rem' }}>{title}</h3>
        <p style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginBottom: '2rem' }}>{desc}</p>
        <div style={cardFooter}>Learn More <ArrowRight size={16} style={{ marginLeft: 6 }} /></div>
    </Link>
);

const mainCtaSection: React.CSSProperties = { padding: '120px 20px', background: 'var(--bg-surface-L1)', borderBottom: '1px solid var(--border-subtle)' };
const badgeStyle: React.CSSProperties = { fontSize: '0.75rem', fontWeight: 900, letterSpacing: '0.3em', color: 'var(--color-coach)', marginBottom: '1.5rem' };
const titleStyle: React.CSSProperties = { fontSize: '3.5rem', fontWeight: 900, letterSpacing: '-0.03em' };
const featureGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' };
const cardStyle: React.CSSProperties = { padding: '50px 40px', borderRadius: '32px', background: 'var(--bg-surface-L1)', border: '1px solid var(--border-subtle)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', textDecoration: 'none', color: 'white', transition: 'all 0.4s' };
const iconBox: React.CSSProperties = { width: '64px', height: '64px', borderRadius: '20px', background: 'var(--bg-surface-L2)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2.5rem', color: 'var(--color-coach)' };
const cardFooter: React.CSSProperties = { display: 'flex', alignItems: 'center', fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-coach)' };

const trustSection: React.CSSProperties = { padding: '100px 20px', background: '#0a0a0b', borderTop: '1px solid var(--border-subtle)' };
const trustIcon: React.CSSProperties = { color: 'rgba(255,255,255,0.2)', marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' };
const trustValue: React.CSSProperties = { fontSize: '2rem', fontWeight: 900, marginBottom: '6px' };
const trustLabel: React.CSSProperties = { fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 };
const trustItem: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center' };

const ctaBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '20px 50px', borderRadius: '100px', background: 'white', color: 'black', textDecoration: 'none', fontWeight: 900, fontSize: '1.1rem', letterSpacing: '0.05em', boxShadow: '0 10px 30px rgba(255,255,255,0.1)' };
