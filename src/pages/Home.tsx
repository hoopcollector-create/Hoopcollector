import React from 'react';
import { HomeSlider } from '../components/HomeSlider';
import { InstagramSection } from '../components/InstagramSection';
import { Compass, Users, Award, ShieldCheck, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Home = () => {
    return (
        <div style={{ color: 'white', overflow: 'hidden' }}>
            {/* Hero Slider Section */}
            <HomeSlider />

            {/* Main Action: View Classes - Now at the Top */}
            <section style={mainCtaSection}>
                <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
                    <div style={badgeStyle}>BASKETBALL LESSONS</div>
                    <h2 style={{ ...titleStyle, marginBottom: '2rem' }}>지금 바로 농구 수업을 시작해보세요</h2>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.2rem', marginBottom: '3rem', lineHeight: 1.6 }}>
                        훕콜렉터의 전문 코치진이 여러분의 실력 향상을 위해 대기하고 있습니다.<br/>
                        내 주변의 최적화된 클래스를 찾아보세요.
                    </p>
                    <Link to="/class-info" style={ctaBtn}>수업 보러가기 <ArrowRight size={20} style={{ marginLeft: 10 }} /></Link>
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
                        to="/admin" 
                        icon={<ShieldCheck size={32} />} 
                        title="관리자 포털" 
                        desc="사이트 설정을 변경하고 운영 현황을 관리하세요."
                    />
                </div>
            </section>

            {/* Trust Section */}
            <section style={trustSection}>
                <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px', textAlign: 'center' }}>
                    <div style={trustItem}>
                        <div style={trustIcon}><ShieldCheck size={40} /></div>
                        <div style={trustValue}>100% 검증</div>
                        <div style={trustLabel}>등록 코치 자격 확인</div>
                    </div>
                    <div style={trustItem}>
                        <div style={trustIcon}><Users size={40} /></div>
                        <div style={trustValue}>5,000+</div>
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

const mainCtaSection: React.CSSProperties = { padding: '120px 20px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' };
const badgeStyle: React.CSSProperties = { fontSize: '0.75rem', fontWeight: 900, letterSpacing: '0.3em', color: 'var(--color-coach)', marginBottom: '1.5rem' };
const titleStyle: React.CSSProperties = { fontSize: '3.5rem', fontWeight: 900, letterSpacing: '-0.03em' };
const featureGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' };
const cardStyle: React.CSSProperties = { padding: '50px 40px', borderRadius: '32px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', textDecoration: 'none', color: 'white', transition: 'all 0.4s' };
const iconBox: React.CSSProperties = { width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2.5rem', color: 'var(--color-coach)' };
const cardFooter: React.CSSProperties = { display: 'flex', alignItems: 'center', fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-coach)' };

const trustSection: React.CSSProperties = { padding: '100px 20px', background: 'rgba(0,0,0,0.2)' };
const trustIcon: React.CSSProperties = { color: 'rgba(255,255,255,0.2)', marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' };
const trustValue: React.CSSProperties = { fontSize: '2rem', fontWeight: 900, marginBottom: '6px' };
const trustLabel: React.CSSProperties = { fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 };
const trustItem: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center' };

const ctaBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '20px 50px', borderRadius: '100px', background: 'white', color: 'black', textDecoration: 'none', fontWeight: 900, fontSize: '1.1rem', letterSpacing: '0.05em' };
