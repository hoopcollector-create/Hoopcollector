import React from 'react';
import { Check, ArrowRight, Zap, Target, Trophy, Clock, MapPin, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { InstagramSection } from '../components/InstagramSection';

export const ClassInfo = () => {
    const navigate = useNavigate();
    const classData = [
        {
            type: 'C',
            name: 'Standard Coach',
            price: 45000,
            desc: '검증된 기본기와 체계적인 교육 커리큘럼을 보유한 정규 코치진 과정',
            features: ['기본 드리블/슛 메커니즘', '기초 풋워크 및 밸런스', '개인별 맞춤형 피드백']
        },
        {
            type: 'B',
            name: 'Senior Coach',
            price: 50000,
            desc: '풍부한 지도 경험과 실전 전술 노하우를 겸비한 시니어 코치진 과정',
            features: ['상황별 응용 기술 전수', '1:1 및 팀 전술 이해', '실전 경기 지배력 강화'],
            popular: true
        },
        {
            type: 'A',
            name: 'Master Coach',
            price: 55000,
            desc: '선수 경력 및 최상위 수준의 디테일을 전수하는 마스터 코치진의 엘리트 과정',
            features: ['프로급 스킬 디테일', '포지션 특화 심화 교육', '고강도 전문 트레이닝']
        }
    ];

    const formatPrice = (p: number) => p.toLocaleString() + '원';

    const handleReserveClick = async (type?: string) => {
        const { data: { session } } = await supabase.auth.getSession();
        
        const targetPath = `/dashboard?tab=request${type ? `&type=${type}` : ''}`;
        
        if (session) {
            navigate(targetPath);
        } else {
            navigate(`/login?returnTo=${encodeURIComponent(targetPath)}`);
        }
    };

    return (
        <div style={{ background: '#000000', color: 'white', minHeight: '100vh', paddingBottom: '100px', width: '100%' }}>
            {/* Hero Section */}
            <section style={{ padding: '120px 24px 80px', textAlign: 'center' }}>
                <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                    <div style={badgeStyle}><Sparkles size={14} style={{ marginRight: 8 }} /> PROFESSIONAL TRAINING</div>
                    <h1 style={heroTitleStyle}>BETTER BASKETBALL<br/><span style={{ color: 'var(--color-student)' }}>FOR EVERYONE</span></h1>
                    <p style={heroSubtitleStyle}>
                        훕콜렉터는 장소에 구애받지 않습니다. 당신이 있는 곳 어디든 <br/>
                        검증된 전문 코치가 직접 찾아가 잠재력을 깨워드립니다.
                    </p>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '40px' }}>
                        <button 
                            onClick={() => handleReserveClick()}
                            className="btn-primary" 
                            style={{ padding: '16px 40px', fontSize: '1rem', border: 'none', cursor: 'pointer' }}
                        >
                            지금 신청하기
                        </button>
                        <a href="#pricing" style={btnOutlineStyle}>가격 정책 보기</a>
                    </div>
                </div>
            </section>

            {/* Core Features */}
            <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 80px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                <div className="card-minimal">
                    <Clock size={24} style={{ marginBottom: '20px', color: 'rgba(255,255,255,0.3)' }}/>
                    <h3 style={featureTitleStyle}>시간의 유연함</h3>
                    <p style={featureTextStyle}>새벽부터 야간까지 당신의 스케줄에 맞춘 수업이 가능합니다.</p>
                </div>
                <div className="card-minimal">
                    <MapPin size={24} style={{ marginBottom: '20px', color: 'rgba(255,255,255,0.3)' }}/>
                    <h3 style={featureTitleStyle}>장소의 자유</h3>
                    <p style={featureTextStyle}>가장 가까운 코트에서 당신이 선호하는 장소에서 수업합니다.</p>
                </div>
                <div className="card-minimal">
                    <Target size={24} style={{ marginBottom: '20px', color: 'rgba(255,255,255,0.3)' }}/>
                    <h3 style={featureTitleStyle}>맞춤형 교육</h3>
                    <p style={featureTextStyle}>개인의 신체 조건과 숙련도에 따라 최적화된 프로그램을 제공합니다.</p>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 24px' }}>
                <div style={{ marginBottom: '60px' }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1rem', letterSpacing: '-0.02em' }}>PRICING POLICY</h2>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1.1rem' }}>모든 레슨은 60분 기준으로 진행됩니다.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                    {classData.map((cls) => (
                        <div key={cls.type} className="card-minimal" style={{ position: 'relative', overflow: 'hidden', padding: '40px', borderColor: cls.popular ? 'var(--color-student)' : 'rgba(255,255,255,0.05)' }}>
                            {cls.popular && <div style={popularBadgeStyle}>POPULAR</div>}
                            <div style={{ fontWeight: 900, fontSize: '0.8rem', color: 'var(--color-student)', letterSpacing: '0.1em', marginBottom: '1rem' }}>{cls.type} GRADE COACH</div>
                            <h3 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '1.5rem' }}>{cls.name}</h3>
                            <div style={{ marginBottom: '2.5rem' }}>
                                <span style={{ fontSize: '2.5rem', fontWeight: 900 }}>{formatPrice(cls.price)}</span>
                                <span style={{ color: 'rgba(255,255,255,0.3)', marginLeft: '8px', fontSize: '1rem' }}>/ Session</span>
                            </div>

                            <div style={{ display: 'grid', gap: '14px', marginBottom: '3rem' }}>
                                {cls.features.map((f, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem' }}>
                                        <Check size={16} /> {f}
                                    </div>
                                ))}
                            </div>

                            <button 
                                onClick={() => handleReserveClick(cls.type)}
                                className="btn-primary" 
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%', border: 'none', cursor: 'pointer', background: cls.popular ? 'var(--color-student)' : 'rgba(255,255,255,0.05)' }}
                            >
                                예약하기 <ArrowRight size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {/* Curriculum Roadmap */}
            <section style={{ maxWidth: '1000px', margin: '0 auto', padding: '100px 24px' }}>
                <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1rem' }}>ROADMAP</h2>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1.1rem' }}>성장을 위한 단계별 커리큘럼</p>
                </div>

                <div style={{ display: 'grid', gap: '40px' }}>
                    {[
                        { step: '01', title: '진단 및 기본기', desc: '현재 역량을 분석하고 잘못된 슈팅 메커니즘을 교정합니다.' },
                        { step: '05', title: '실전 기술 응용', desc: '수비 상황에서 기술을 활용화는 실전 감각을 키웁니다.' },
                        { step: '10', title: '게임 완성', desc: '다양한 상황에서의 의사결정 능력을 높이고 피니시 기술을 완성합니다.' }
                    ].map(item => (
                        <div key={item.step} style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
                            <div style={roadmapStepStyle}>{item.step}</div>
                            <div>
                                <h4 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>{item.title}</h4>
                                <p style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Instagram Section */}
            <InstagramSection />
        </div>
    );
};

const badgeStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '8px 16px', borderRadius: '100px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: 800, marginBottom: '2rem', letterSpacing: '0.05em' };
const heroTitleStyle: React.CSSProperties = { fontSize: 'clamp(3rem, 10vw, 5rem)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 0.95, marginBottom: '2rem' };
const heroSubtitleStyle: React.CSSProperties = { fontSize: '1.25rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, fontWeight: 500 };
const btnOutlineStyle: React.CSSProperties = { padding: '16px 40px', borderRadius: '12px', background: 'transparent', color: 'white', textDecoration: 'none', fontWeight: 700, border: '1px solid rgba(255,255,255,0.1)', fontSize: '1rem' };
const featureTitleStyle: React.CSSProperties = { fontSize: '1.3rem', fontWeight: 800, marginBottom: '10px' };
const featureTextStyle: React.CSSProperties = { fontSize: '1rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 };
const popularBadgeStyle: React.CSSProperties = { position: 'absolute', top: '16px', right: '16px', background: 'var(--color-student)', color: 'white', padding: '6px 12px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 900 };
const roadmapStepStyle: React.CSSProperties = { fontSize: '2rem', fontWeight: 900, color: 'var(--color-student)', opacity: 0.8, marginTop: '-5px' };
