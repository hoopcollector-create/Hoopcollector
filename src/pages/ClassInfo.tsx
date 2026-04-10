import React from 'react';
import { Check, ArrowRight, Zap, Target, Trophy, Clock, MapPin, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ClassInfo = () => {
    const classData = [
        {
            type: 'C',
            name: 'Class C (Basic)',
            price: 45000,
            desc: '농구의 기초와 기본기를 탄탄히 다지고 싶은 분들을 위한 프로그램',
            features: ['기본 드리블 및 핸들링', '정확한 슈팅 폼 교정', '기초 풋워크 및 레이업'],
            color: '#3b82f6'
        },
        {
            type: 'B',
            name: 'Class B (Advanced)',
            price: 50000,
            desc: '실전 기술과 응용 동작을 통해 게임 지배력을 높이고 싶은 분들',
            features: ['응용 드리블 및 돌파 기술', '다양한 상황에서의 슈팅', '1:1 개인 전술 및 디펜스'],
            color: '#8b5cf6',
            popular: true
        },
        {
            type: 'A',
            name: 'Class A (Elite)',
            price: 55000,
            desc: '선수급 디테일과 고강도 트레이닝을 원하는 엘리트 프로그램',
            features: ['전문적인 전술 이해 및 실행', '포지션별 특화 트레이닝', '고강도 피지컬 및 스킬 콤보'],
            color: '#f59e0b'
        }
    ];

    const formatPrice = (p: number) => p.toLocaleString() + '원';

    return (
        <div style={{ background: '#0a0a0b', color: 'white', minHeight: '100vh', paddingBottom: '5rem' }}>
            {/* Hero Section */}
            <section style={{ 
                padding: '6rem 1rem 4rem', 
                textAlign: 'center', 
                background: 'radial-gradient(circle at 50% 10%, rgba(59, 130, 246, 0.15), transparent 50%)' 
            }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '99px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.9rem', color: 'var(--color-primary)', fontWeight: 600, marginBottom: '1.5rem' }}>
                        <Sparkles size={16} />
                        Professional Training
                    </div>
                    <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 4rem)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '1.5rem' }}>
                        언제 어디서든 가능한<br/>
                        <span className="text-gradient">프리미엄 농구 레슨</span>
                    </h1>
                    <p style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: '2.5rem' }}>
                        훕콜렉터는 장소에 구애받지 않습니다. 집 앞 코트, 학교 체육관 등 <br/>
                        당신이 있는 곳 어디든 전문 코치가 찾아갑니다.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <Link to="/login" style={{ padding: '16px 32px', borderRadius: '14px', background: 'white', color: 'black', textDecoration: 'none', fontWeight: 800, fontSize: '1rem' }}>
                            지금 신청하기
                        </Link>
                        <a href="#pricing" style={{ padding: '16px 32px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', color: 'white', textDecoration: 'none', fontWeight: 700, border: '1px solid rgba(255,255,255,0.1)' }}>
                            가격표 보기
                        </a>
                    </div>
                </div>
            </section>

            {/* Core Features */}
            <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                <div style={featureCard}>
                    <div style={iconCircle}><Clock size={24} color="#3b82f6"/></div>
                    <h3 style={featureTitle}>시간의 유연함</h3>
                    <p style={featureText}>코치와 협의하여 새벽부터 야간까지 당신의 스케줄에 맞춘 수업이 가능합니다.</p>
                </div>
                <div style={featureCard}>
                    <div style={iconCircle}><MapPin size={24} color="#8b5cf6"/></div>
                    <h3 style={featureTitle}>장소의 자유</h3>
                    <p style={featureText}>실내 체육관 대관부터 야외 우레탄 코트까지, 당신이 선호하는 장소에서 수업합니다.</p>
                </div>
                <div style={featureCard}>
                    <div style={iconCircle}><Target size={24} color="#f59e0b"/></div>
                    <h3 style={featureTitle}>맞춤형 커리큘럼</h3>
                    <p style={featureText}>개인의 신체 조건과 숙련도에 따라 매 수업 최적화된 훈련 프로그램을 제공합니다.</p>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" style={{ maxWidth: '1200px', margin: '0 auto', padding: '6rem 1rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem' }}>투명한 가격 정책</h2>
                    <p style={{ color: 'rgba(255,255,255,0.6)' }}>모든 레슨은 60분 기준으로 진행되며, 번들 구매 시 큰 할인 혜택을 드립니다.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
                    {classData.map((cls) => (
                        <div key={cls.type} style={{ 
                            padding: '2.5rem', 
                            borderRadius: '32px', 
                            background: 'rgba(255,255,255,0.03)', 
                            border: cls.popular ? `2px solid ${cls.color}` : '1px solid rgba(255,255,255,0.1)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            {cls.popular && (
                                <div style={{ position: 'absolute', top: '20px', right: '-35px', background: cls.color, color: 'white', padding: '4px 40px', transform: 'rotate(45deg)', fontSize: '0.8rem', fontWeight: 900 }}>
                                    POPULAR
                                </div>
                            )}
                            <div style={{ color: cls.color, fontWeight: 800, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1rem' }}>
                                Class {cls.type}
                            </div>
                            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1rem' }}>{cls.name}</h3>
                            <div style={{ marginBottom: '2rem' }}>
                                <span style={{ fontSize: '2.5rem', fontWeight: 900 }}>{formatPrice(cls.price)}</span>
                                <span style={{ color: 'rgba(255,255,255,0.5)', marginLeft: '8px' }}>/ 1회</span>
                            </div>

                            <div style={{ display: 'grid', gap: '1rem', marginBottom: '2.5rem' }}>
                                {cls.features.map((f, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem' }}>
                                        <Check size={18} color={cls.color} />
                                        {f}
                                    </div>
                                ))}
                            </div>

                            <div style={{ padding: '1.5rem', borderRadius: '20px', background: 'rgba(255,255,255,0.05)', marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                                    <span style={{ opacity: 0.6 }}>5회 패키지 (5% 할인)</span>
                                    <span style={{ fontWeight: 700 }}>{formatPrice(cls.price * 5 * 0.95)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                    <span style={{ opacity: 0.6 }}>10회 패키지 (10% 할인)</span>
                                    <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{formatPrice(cls.price * 10 * 0.9)}</span>
                                </div>
                            </div>

                            <Link to="/login" style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                gap: '8px', 
                                width: '100%', 
                                padding: '16px', 
                                borderRadius: '16px', 
                                background: cls.popular ? cls.color : 'rgba(255,255,255,0.1)', 
                                color: 'white', 
                                textDecoration: 'none', 
                                fontWeight: 800,
                                transition: 'transform 0.2s'
                            }}>
                                바로 예약하기 <ArrowRight size={18} />
                            </Link>
                        </div>
                    ))}
                </div>
            </section>

            {/* Curriculum Section */}
            <section style={{ maxWidth: '1000px', margin: '0 auto', padding: '6rem 1rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <h2 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '1rem' }}>성장을 위한 로드맵</h2>
                    <p style={{ color: 'rgba(255,255,255,0.6)' }}>단계별 트레이닝을 통해 확실한 변화를 경험하세요.</p>
                </div>

                <div style={{ display: 'grid', gap: '3rem', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '0', bottom: '0', left: '24px', width: '2px', background: 'linear-gradient(to bottom, var(--color-primary), var(--color-warning), transparent)' }}></div>
                    
                    <div style={curriculumStep}>
                        <div style={stepNumber}>1</div>
                        <div style={stepContent}>
                            <h4 style={stepTitle}>1회차: 진단 및 기본기 확립</h4>
                            <p style={stepDesc}>현재 역량을 분석하고 잘못된 슈팅 메커니즘이나 드리블 습관을 교정합니다.</p>
                        </div>
                    </div>

                    <div style={curriculumStep}>
                        <div style={stepNumber}>5</div>
                        <div style={stepContent}>
                            <h4 style={stepTitle}>5회차: 기술 응용 및 실전 진입</h4>
                            <p style={stepDesc}>익힌 기술을 실제 수비 상황에서 어떻게 활용하는지 배우며 실전 감각을 키웁니다.</p>
                        </div>
                    </div>

                    <div style={curriculumStep}>
                        <div style={stepNumber}>10</div>
                        <div style={stepContent}>
                            <h4 style={stepTitle}>10회차: 게임 지배 및 완성</h4>
                            <p style={stepDesc}>다양한 상황에서의 의사결정 능력을 높이고 자신만의 시그니처 무브를 완성합니다.</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

const featureCard: React.CSSProperties = { padding: '2.5rem', borderRadius: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' };
const iconCircle: React.CSSProperties = { width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' };
const featureTitle: React.CSSProperties = { fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.75rem' };
const featureText: React.CSSProperties = { fontSize: '0.95rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 };

const curriculumStep: React.CSSProperties = { display: 'flex', gap: '2rem', alignItems: 'flex-start', position: 'relative', zIndex: 1 };
const stepNumber: React.CSSProperties = { width: '50px', height: '50px', borderRadius: '50%', background: '#111827', border: '2px solid var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.25rem', color: 'var(--color-primary)', flexShrink: 0 };
const stepContent: React.CSSProperties = { paddingTop: '0.5rem' };
const stepTitle: React.CSSProperties = { fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' };
const stepDesc: React.CSSProperties = { fontSize: '1rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 };
