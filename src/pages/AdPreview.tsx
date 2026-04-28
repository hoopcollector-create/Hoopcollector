import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Calendar, Clock, Target, Award, LayoutGrid, MonitorPlay, CheckCircle, Zap, Flame, Users, BookOpen, Sparkles } from 'lucide-react';

/**
 * AdPreview Component
 * A premium tool to preview Instagram-style advertisements for Hoopcollector.
 * Synchronized with the actual website UI for authenticity.
 */
export const AdPreview = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isGridView, setIsGridView] = useState(false);

  // Basketball Icon Component
  const BasketballIcon = ({ size = 24, style = {} }: { size?: number, style?: React.CSSProperties }) => (
    <svg 
      width={size}
      height={size}
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      style={style}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10" />
      <path d="M12 2a15.3 15.3 0 0 0-4 10 15.3 15.3 0 0 0 4 10" />
    </svg>
  );

  const slides = [
    {
      id: 1,
      title: "같이 뛸 사람이 없다면?",
      highlight: "이제 농구를\n수집해보세요",
      visual: (
        <div style={visualContainerStyle}>
          <div style={iconWrapperStyle}>
            <div style={glowEffectStyle}></div>
            <BasketballIcon size={96} style={{ color: 'var(--color-student)', position: 'relative', zIndex: 10 }} />
          </div>
          <div style={iconGroupStyle}>
            <Target size={24} style={{ color: 'rgba(255,255,255,0.2)' }} />
            <Target size={24} style={{ color: 'rgba(249, 115, 22, 0.3)' }} />
            <Target size={24} style={{ color: 'var(--color-student)' }} />
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: "내 주변 매치를\nHoopcollector에서\n찾으세요",
      visual: (
        <div style={visualContainerStyle}>
          <div style={radarContainerStyle}>
            <div style={radarPulseStyle}></div>
            <div style={radarInnerCircleStyle}></div>
            <div style={radarCoreStyle}>
              <MapPin size={40} style={{ color: 'var(--color-student)' }} />
            </div>
            
            {/* Map Markers Style from ExplorationMap */}
            <div style={{ ...mapMarkerStyle, top: '10%', left: '10%', background: '#8b5cf6' }}>강남 정기전</div>
            <div style={{ ...mapMarkerStyle, bottom: '15%', right: '5%', background: '#f97316' }}>망원 3vs3</div>
            <div style={{ ...mapMarkerStyle, top: '40%', right: '15%', background: '#f97316', opacity: 0.6 }}>반포 매치</div>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: "실력·지역·시간에 맞는\n오늘의 경기를\n골라 담으세요",
      visual: (
        <div style={{ ...visualContainerStyle, padding: '0 24px', gap: '16px' }}>
          {/* Actual MatchCard UI from MatchExplore.tsx */}
          <div style={actualMatchCardStyle}>
            <div style={actualCardHeader}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={oneTimeBadgeStyle}><Flame size={10} fill="currentColor" /> 일회성</div>
                <div style={{ fontSize: '1rem' }}>🇰🇷</div>
                <span style={actualTypeText}>3대3</span>
              </div>
              <div style={actualGradeBadgeStyle}>전체등급</div>
            </div>
            <h3 style={actualCardTitle}>망원 한강공원 픽업게임</h3>
            <div style={actualInfoRow}>
              <div style={actualInfoItem}><Calendar size={14} /> <span>4/28 (화)</span></div>
              <div style={actualInfoItem}><Clock size={14} /> <span>19:00</span></div>
            </div>
            <div style={actualLocationBox}>
              <MapPin size={14} style={{ color: '#f97316' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>망원 한강공원 농구장</span>
            </div>
            <div style={actualCardFooter}>
              <div style={actualPlayerCount}><Users size={14} /> <span>4 / 6명</span></div>
              <div style={actualPriceText}>무료</div>
            </div>
          </div>
          
          <div style={{ ...actualMatchCardStyle, transform: 'translateX(20px)', opacity: 0.4 }}>
            <div style={actualCardHeader}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={recurringBadgeStyle}><Zap size={10} fill="currentColor" /> 정기 매치</div>
                <span style={actualTypeText}>5대5</span>
              </div>
            </div>
            <h3 style={actualCardTitle}>화요일 야간 실내 정기전</h3>
          </div>
        </div>
      )
    },
    {
      id: 4,
      title: "코치 레슨과 수업 기록을\n하나씩 쌓아보세요",
      visual: (
        <div style={{ ...visualContainerStyle, padding: '0 32px' }}>
          {/* Actual Journal UI from ClassJournalDetail.tsx */}
          <div className="card-premium glass-morphism" style={actualJournalContainer}>
            <div style={actualJournalHeader}>
              <div style={{ display: 'flex', gap: 10, marginBottom: '8px' }}>
                <div style={actualSessionBadge}>SESSION RECORD</div>
                <div style={{ ...actualSessionBadge, color: 'var(--color-coach)' }}>#5 CLASS</div>
              </div>
              <h2 style={actualJournalTitle}><Sparkles size={16} color="#f59e0b" /> COACH FEEDBACK</h2>
            </div>
            <div style={actualJournalBody}>
              <div style={actualSkillRow}>
                <div style={{ flex: 1, fontSize: '0.75rem', fontWeight: 700 }}>슈팅 릴리즈</div>
                <div style={{ display: 'flex', gap: 3 }}>
                  {[1,2,3,4,5].map(s => <div key={s} style={{ width: 10, height: 4, borderRadius: 2, background: s <= 4 ? '#10b981' : 'rgba(255,255,255,0.05)' }} />)}
                </div>
              </div>
              <div style={actualSkillRow}>
                <div style={{ flex: 1, fontSize: '0.75rem', fontWeight: 700 }}>드리블 안정성</div>
                <div style={{ display: 'flex', gap: 3 }}>
                  {[1,2,3,4,5].map(s => <div key={s} style={{ width: 10, height: 4, borderRadius: 2, background: s <= 3 ? '#10b981' : 'rgba(255,255,255,0.05)' }} />)}
                </div>
              </div>
              <div style={actualHomeworkBox}>
                <Target size={14} style={{ marginRight: 8, flexShrink: 0 }} />
                <span>릴리즈 포인트 교정 연습 50회</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 5,
      title: "경기 참여로 XP를 모으고\n내 농구 레벨을 올리세요",
      visual: (
        <div style={{ ...visualContainerStyle, padding: '0 32px', gap: '32px' }}>
          {/* Actual XP Progress UI from StudentHome.tsx */}
          <div style={{ width: '100%', padding: '24px', background: 'rgba(255,255,255,0.03)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--color-student)' }}>LV.4 ALL-STAR</span>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>2,450 XP</span>
            </div>
            <div style={actualXpBarBg}>
              <div style={actualXpBarFill(75)} />
            </div>
            <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
              <div style={actualClassBadge}>CLASS A</div>
              <div style={actualPointsBadge}>12,500 P</div>
            </div>
          </div>
          
          <div style={xpCardStyle}>
            <div style={xpIconStyle}>
              <Award size={20} style={{ color: 'white' }} />
            </div>
            <div>
              <p style={noteTitleStyle}>이번 주 획득 XP</p>
              <p style={noteDescStyle}>+150 XP (경기 참여 2회)</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 6,
      title: "",
      visual: (
        <div style={{ ...visualContainerStyle, textAlign: 'center', gap: '40px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <BasketballIcon size={64} style={{ color: 'var(--color-student)', margin: '0 auto' }} />
            <h1 style={{ fontSize: '2.5rem', fontWeight: 950, letterSpacing: '-0.05em' }}>Hoopcollector</h1>
            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)' }}>
              너의 농구를 수집하라
            </p>
          </div>
          <div style={{ width: 48, height: 4, background: 'var(--color-student)', borderRadius: 100, margin: '0 auto' }}></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Your Basketball Life Partner</p>
            <div style={urlBadgeStyle}><span>hoopcollector.vercel.app</span></div>
          </div>
          <button style={finalCtaStyle}>지금 시작하기</button>
        </div>
      )
    }
  ];

  const nextSlide = () => setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));

  const SlideCard = ({ slide, index }: { slide: any, index: number }) => (
    <div style={slideCardContainer}>
      <div style={watermarkStyle}>
        <BasketballIcon size={16} style={{ color: 'var(--color-student)' }} />
        <span style={watermarkTextStyle}>HOOPCOLLECTOR</span>
      </div>
      <div style={slideContentStyle}>
        {slide.title && (
          <div style={textHeaderStyle}>
            <h2 style={slideSubTitleStyle}>{slide.title}</h2>
            {slide.highlight && (
              <h1 style={slideMainTitleStyle}>
                {slide.highlight.split('\n').map((line: string, i: number) => (
                  <React.Fragment key={i}>
                    {line}
                    {i === 0 && <br/>}
                  </React.Fragment>
                ))}
              </h1>
            )}
          </div>
        )}
        <div style={slideVisualArea}>{slide.visual}</div>
      </div>
      {isGridView && <div style={pageNumberStyle}>{index + 1} / 6</div>}
    </div>
  );

  return (
    <div className="main-layout" style={{ minHeight: '100vh', background: '#070708', color: 'white' }}>
      <style>{`
        @keyframes radar-ping {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
      <div className="card-minimal" style={controlBarStyle}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: 4 }}>인스타그램 광고 프리뷰</h1>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>PROPORTION 4:5 (1080 x 1350px) | SYNCED WITH WEBSITE UI</p>
        </div>
        <button onClick={() => setIsGridView(!isGridView)} style={toggleButtonStyle}>
          {isGridView ? <MonitorPlay size={16} /> : <LayoutGrid size={16} />}
          <span>{isGridView ? '슬라이드로 보기' : '모아보기'}</span>
        </button>
      </div>
      <div style={mainViewStyle}>
        {isGridView ? (
          <div style={gridContainerStyle}>
            {slides.map((slide, index) => (
              <div key={slide.id} className="hover-lift">
                <SlideCard slide={slide} index={index} />
              </div>
            ))}
          </div>
        ) : (
          <div style={carouselWrapperStyle}>
            <div className="card-premium glass-morphism" style={{ borderRadius: 32, overflow: 'hidden' }}>
              <SlideCard slide={slides[currentSlide]} index={currentSlide} />
            </div>
            <button onClick={prevSlide} style={{ ...navBtnStyle, left: -60 }}><ChevronLeft size={24} /></button>
            <button onClick={nextSlide} style={{ ...navBtnStyle, right: -60 }}><ChevronRight size={24} /></button>
            <div style={indicatorContainerStyle}>
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  style={{
                    ...dotIndicatorStyle,
                    width: currentSlide === idx ? 24 : 8,
                    background: currentSlide === idx ? 'var(--color-student)' : 'rgba(255,255,255,0.2)'
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- STYLES ---

// Global & Control Bar
const controlBarStyle: React.CSSProperties = { width: '100%', maxWidth: '1200px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 32px', marginBottom: 40, position: 'sticky', top: 20, zIndex: 100 };
const toggleButtonStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'white', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', transition: '0.2s' };
const mainViewStyle: React.CSSProperties = { flex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' };
const gridContainerStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32, maxWidth: '1200px', width: '100%', paddingBottom: 80 };
const carouselWrapperStyle: React.CSSProperties = { position: 'relative', width: '100%', maxWidth: 400 };
const navBtnStyle: React.CSSProperties = { position: 'absolute', top: '50%', transform: 'translateY(-50%)', width: 48, height: 48, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer', transition: '0.2s' };
const indicatorContainerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'center', marginTop: 24, gap: 8 };
const dotIndicatorStyle: React.CSSProperties = { height: 8, borderRadius: 100, border: 'none', cursor: 'pointer', transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)' };

// Slide Card Structure
const slideCardContainer: React.CSSProperties = { width: '100%', aspectRatio: '4 / 5', background: 'var(--bg-surface-L1)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' };
const watermarkStyle: React.CSSProperties = { position: 'absolute', top: 24, left: 24, display: 'flex', alignItems: 'center', gap: 8, zIndex: 20 };
const watermarkTextStyle: React.CSSProperties = { fontSize: '0.7rem', fontWeight: 900, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em' };
const slideContentStyle: React.CSSProperties = { flex: 1, padding: '80px 32px 32px', display: 'flex', flexDirection: 'column' };
const textHeaderStyle: React.CSSProperties = { marginBottom: 32, zIndex: 10, position: 'relative' };
const slideSubTitleStyle: React.CSSProperties = { fontSize: '1.25rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4, whiteSpace: 'pre-line', marginBottom: 8 };
const slideMainTitleStyle: React.CSSProperties = { fontSize: '2.25rem', fontWeight: 950, color: 'white', lineHeight: 1.1, letterSpacing: '-0.02em', whiteSpace: 'pre-line' };
const slideVisualArea: React.CSSProperties = { flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const visualContainerStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%', gap: 24 };

// Visual Components (Shared)
const iconWrapperStyle: React.CSSProperties = { position: 'relative' };
const glowEffectStyle: React.CSSProperties = { position: 'absolute', top: -16, left: -16, right: -16, bottom: -16, background: 'var(--color-student)', borderRadius: '50%', filter: 'blur(40px)', opacity: 0.2 };
const iconGroupStyle: React.CSSProperties = { display: 'flex', gap: 8 };

// Radar Slide
const radarContainerStyle: React.CSSProperties = { position: 'relative', width: 192, height: 192, background: 'rgba(255,255,255,0.02)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.05)' };
const radarPulseStyle: React.CSSProperties = { position: 'absolute', width: '100%', height: '100%', border: '1px solid rgba(249, 115, 22, 0.2)', borderRadius: '50%', animation: 'radar-ping 3s linear infinite' };
const radarInnerCircleStyle: React.CSSProperties = { position: 'absolute', width: '75%', height: '75%', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '50%' };
const radarCoreStyle: React.CSSProperties = { position: 'absolute', width: '50%', height: '50%', background: 'rgba(249, 115, 22, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(249, 115, 22, 0.2)' };
const mapMarkerStyle: React.CSSProperties = { position: 'absolute', padding: '6px 12px', borderRadius: '100px', color: 'white', fontSize: '0.65rem', fontWeight: 900, border: '2px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.4)', whiteSpace: 'nowrap' };

// ACTUAL MatchCard UI Synchronization
const actualMatchCardStyle: React.CSSProperties = { width: '100%', background: 'var(--bg-surface-L2)', padding: '24px', borderRadius: '24px', border: '1px solid var(--border-subtle)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '16px' };
const actualCardHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const recurringBadgeStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa', fontSize: '0.75rem', fontWeight: 900 };
const oneTimeBadgeStyle: React.CSSProperties = { ...recurringBadgeStyle, background: 'rgba(249, 115, 22, 0.15)', color: '#fb923c' };
const actualTypeText: React.CSSProperties = { fontSize: '0.85rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)' };
const actualGradeBadgeStyle: React.CSSProperties = { padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 900, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' };
const actualCardTitle: React.CSSProperties = { fontSize: '1.25rem', fontWeight: 850, lineHeight: 1.3, color: 'white' };
const actualInfoRow: React.CSSProperties = { display: 'flex', gap: '16px' };
const actualInfoItem: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 };
const actualLocationBox: React.CSSProperties = { padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' };
const actualCardFooter: React.CSSProperties = { marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' };
const actualPlayerCount: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 700 };
const actualPriceText: React.CSSProperties = { fontSize: '1rem', fontWeight: 900, color: 'white' };

// ACTUAL Journal UI Synchronization
const actualJournalContainer: React.CSSProperties = { width: '100%', padding: '24px', borderRadius: '24px', background: 'var(--bg-surface-L2)' };
const actualJournalHeader: React.CSSProperties = { marginBottom: '20px' };
const actualSessionBadge: React.CSSProperties = { display: 'inline-block', padding: '4px 12px', borderRadius: '100px', background: 'rgba(255,255,255,0.05)', fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.1em', color: 'var(--color-primary)' };
const actualJournalTitle: React.CSSProperties = { fontSize: '1rem', fontWeight: 900, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '10px' };
const actualJournalBody: React.CSSProperties = { display: 'grid', gap: '12px' };
const actualSkillRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '10px' };
const actualHomeworkBox: React.CSSProperties = { display: 'flex', padding: '16px', borderRadius: '16px', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.1)', color: '#f59e0b', fontWeight: 700, fontSize: '0.85rem' };

// ACTUAL XP Bar Synchronization
const actualXpBarBg: React.CSSProperties = { width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '100px', overflow: 'hidden' };
const actualXpBarFill = (progress: number): React.CSSProperties => ({ width: `${progress}%`, height: '100%', background: 'var(--color-student)', borderRadius: '100px' });
const actualClassBadge: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: '8px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white', fontSize: '0.7rem', fontWeight: 950, letterSpacing: '0.05em' };
const actualPointsBadge: React.CSSProperties = { ...actualClassBadge, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' };

// Misc & Utils
const xpCardStyle: React.CSSProperties = { width: '100%', padding: 20, background: 'rgba(255,255,255,0.03)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 16 };
const xpIconStyle: React.CSSProperties = { width: 40, height: 40, background: 'var(--color-student)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const urlBadgeStyle: React.CSSProperties = { display: 'inline-block', padding: '10px 20px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.9rem', fontWeight: 800, color: 'rgba(255,255,255,0.8)' };
const finalCtaStyle: React.CSSProperties = { marginTop: 16, padding: '20px 48px', background: 'white', color: 'black', borderRadius: 100, border: 'none', fontWeight: 950, fontSize: '1.1rem', boxShadow: '0 10px 30px rgba(255,255,255,0.1)', cursor: 'pointer' };
const pageNumberStyle: React.CSSProperties = { position: 'absolute', bottom: 16, right: 16, background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '0.65rem', fontWeight: 900, padding: '4px 8px', borderRadius: 6, backdropFilter: 'blur(10px)' };
const noteTitleStyle: React.CSSProperties = { fontSize: '0.9rem', fontWeight: 800, color: 'white' };
const noteDescStyle: React.CSSProperties = { fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: 2 };
