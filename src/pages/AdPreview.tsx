import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Calendar, Clock, Target, Award, LayoutGrid, MonitorPlay, CheckCircle, Zap, Flame, Users, BookOpen, Sparkles, ClipboardList, ShieldCheck, MessageSquare, Star, ArrowRight, Layers } from 'lucide-react';

/**
 * AdPreview Component
 * A premium tool to preview Instagram-style advertisements for Hoopcollector.
 * Supports both Student (Orange) and Coach (Blue) themes.
 */
export const AdPreview = () => {
  const [viewType, setViewType] = useState<'student' | 'coach'>('student');
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

  // --- CONTENT DATA ---

  const studentSlides = [
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
          <div style={actualMatchCardStyle}>
            <div style={actualCardHeader}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={oneTimeBadgeStyle}><Flame size={10} fill="currentColor" /> 일회성</div>
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
        </div>
      )
    },
    {
      id: 4,
      title: "코치 레슨과 수업 기록을\n하나씩 쌓아보세요",
      visual: (
        <div style={{ ...visualContainerStyle, padding: '0 32px' }}>
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
          <div style={{ width: '100%', padding: '24px', background: 'rgba(255,255,255,0.03)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--color-student)' }}>LV.4 ALL-STAR</span>
              <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>2,450 XP</span>
            </div>
            <div style={actualXpBarBg}><div style={actualXpBarFill(75)} /></div>
          </div>
        </div>
      )
    },
    {
      id: 6,
      title: "",
      highlight: "Hoopcollector",
      visual: (
        <div style={{ ...visualContainerStyle, textAlign: 'center', gap: '32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <BasketballIcon size={64} style={{ color: 'var(--color-student)', margin: '0 auto' }} />
            <h1 style={{ fontSize: '2.5rem', fontWeight: 950, letterSpacing: '-0.05em' }}>Hoopcollector</h1>
            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)' }}>너의 농구를 수집하라</p>
          </div>
          <button style={finalCtaStyle}>지금 시작하기</button>
        </div>
      )
    }
  ];

  const coachSlides = [
    {
      id: 1,
      title: "농구 코치라면, 이제 수업도\n체계적으로 관리하세요",
      highlight: "Hoopcollector에서\n당신의 코칭을\n시작하세요",
      visual: (
        <div style={visualContainerStyle}>
          <div style={iconWrapperStyle}>
            <div style={{ ...glowEffectStyle, background: 'var(--color-coach)', opacity: 0.25 }}></div>
            <ClipboardList size={96} style={{ color: 'var(--color-coach)', position: 'relative', zIndex: 10 }} />
          </div>
          <div style={iconGroupStyle}>
            <Users size={24} style={{ color: 'rgba(255,255,255,0.2)' }} />
            <Calendar size={24} style={{ color: 'rgba(59, 130, 246, 0.3)' }} />
            <ShieldCheck size={24} style={{ color: 'var(--color-coach)' }} />
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: "지목 신규 요청부터\n지역별 일반 클래스까지",
      highlight: "수업 요청을\n한곳에서 확인하세요",
      visual: (
        <div style={{ ...visualContainerStyle, padding: '0 24px', gap: '16px' }}>
          {/* Tabs UI from CoachRequests.tsx */}
          <div style={{ display: 'flex', gap: 8, width: '100%', marginBottom: 8 }}>
            <div style={{ ...coachTabMini, background: 'var(--color-student)', color: 'white' }}>지목 신규 <span style={tabBadgeMini}>3</span></div>
            <div style={{ ...coachTabMini, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>일반 클래스</div>
          </div>
          
          <div style={actualMatchCardStyle}>
            <div style={actualCardHeader}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={coachUserIcon}><Users size={14} /></div>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'white' }}>김농구 학생</span>
              </div>
              <div style={{ ...actualGradeBadgeStyle, background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>대기 중</div>
            </div>
            <h3 style={actualCardTitle}>1:1 슛폼 교정 원데이 클래스</h3>
            <div style={actualInfoRow}>
              <div style={actualInfoItem}><Calendar size={14} /> <span>4/30 (금) 19:00</span></div>
              <div style={actualInfoItem}><MessageSquare size={14} /> <span style={{ fontSize: '0.75rem' }}>"릴리즈 포인트 피드백 원합니다"</span></div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
               <button style={{ flex: 1, padding: '10px', background: 'var(--color-coach)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '0.8rem' }}>수업 승인</button>
               <button style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', fontWeight: 800, fontSize: '0.8rem' }}>거절</button>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: "오늘의 수업과 확정 일정,\n정산 내역까지 한눈에",
      highlight: "스케줄 관리를\n더 효율적으로",
      visual: (
        <div style={{ ...visualContainerStyle, padding: '0 32px' }}>
          <div style={{ width: '100%', background: 'var(--bg-surface-L2)', borderRadius: '24px', padding: '24px', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'white' }}>5월 수업 현황</span>
              <Calendar size={18} style={{ color: 'var(--color-coach)' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
               <div style={{ padding: '16px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '16px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                 <div style={{ fontSize: '0.7rem', color: '#60a5fa', fontWeight: 800, marginBottom: '4px' }}>예정된 수업</div>
                 <div style={{ fontSize: '1.8rem', fontWeight: 950, color: 'white' }}>12<span style={{ fontSize: '0.9rem', opacity: 0.5 }}>건</span></div>
               </div>
               <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                 <div style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 800, marginBottom: '4px' }}>완료된 수업</div>
                 <div style={{ fontSize: '1.8rem', fontWeight: 950, color: 'white' }}>8<span style={{ fontSize: '0.9rem', opacity: 0.5 }}>건</span></div>
               </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 4,
      title: "학생별 피드백과 과제를 기록하여\n전문성을 높이세요",
      highlight: "학생 기록을 남기고\n맞춤형 수업을\n이어가세요",
      visual: (
        <div style={{ ...visualContainerStyle, padding: '0 32px' }}>
           <div className="card-premium glass-morphism" style={actualJournalContainer}>
            <div style={actualJournalHeader}>
              <div style={{ display: 'flex', gap: 10, marginBottom: '8px', justifyContent: 'space-between' }}>
                <div style={{ ...actualSessionBadge, background: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-coach)' }}>COACHING RECORD</div>
                <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>학생: 김농구</span>
              </div>
              <h2 style={actualJournalTitle}><CheckCircle size={16} color="var(--color-coach)" /> 3회차 평가 및 피드백</h2>
            </div>
            <div style={actualJournalBody}>
              <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                 <span style={{ fontSize: '0.65rem', color: 'var(--color-coach)', fontWeight: 800, marginBottom: '4px', display: 'block' }}>강점 (STRENGTHS)</span>
                 <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.4 }}>하체 밸런스 개선. 스피드 조절 능력 향상.</p>
              </div>
              <div style={{ ...actualHomeworkBox, borderColor: 'rgba(59, 130, 246, 0.2)', background: 'rgba(59, 130, 246, 0.05)', color: '#60a5fa' }}>
                <ClipboardList size={14} style={{ marginRight: 8, flexShrink: 0 }} />
                <span>다음 수업 전: 왼손 플로터 연습 100회 과제</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 5,
      title: "수업 횟수, 학생 리뷰가 곧\n코치의 강력한 포트폴리오",
      highlight: "당신의 코칭 이력을\n커리어로 쌓으세요",
      visual: (
        <div style={{ ...visualContainerStyle, padding: '0 32px' }}>
          <div style={{ width: '100%', padding: '24px', background: 'rgba(255,255,255,0.03)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', fontWeight: 900, fontSize: '1.5rem' }}>M</div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'white', marginBottom: '4px' }}>코치 마이클</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b', marginBottom: '20px' }}>
              {[1,2,3,4,5].map(s => <Star key={s} size={14} fill="currentColor" />)}
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'white', marginLeft: '4px' }}>5.0</span>
            </div>
            <div style={{ display: 'flex', width: '100%', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
               <div style={{ flex: 1, textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                 <div style={{ fontSize: '1.4rem', fontWeight: 950, color: 'white' }}>150+</div>
                 <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>누적 수업</div>
               </div>
               <div style={{ flex: 1, textAlign: 'center' }}>
                 <div style={{ fontSize: '1.4rem', fontWeight: 950, color: 'white' }}>45</div>
                 <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>수강 학생</div>
               </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 6,
      title: "수업, 학생, 기록, 성장까지.\n코치를 위한 모든 것.",
      highlight: "Hoopcollector",
      visual: (
        <div style={{ ...visualContainerStyle, textAlign: 'center', gap: '32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
              <BasketballIcon size={48} style={{ color: 'var(--color-coach)' }} />
            </div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 950, letterSpacing: '-0.05em' }}>Hoopcollector</h1>
            <p style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-coach)', marginTop: '-8px' }}>FOR COACHES</p>
          </div>
          <button style={{ ...finalCtaStyle, background: 'var(--color-coach)', color: 'white' }}>
            코치 등록하기 <ArrowRight size={18} style={{ marginLeft: 8, display: 'inline-block', verticalAlign: 'middle' }} />
          </button>
        </div>
      )
    }
  ];

  const slides = viewType === 'student' ? studentSlides : coachSlides;

  const nextSlide = () => setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));

  const SlideCard = ({ slide, index }: { slide: any, index: number }) => (
    <div style={slideCardContainer}>
      <div style={watermarkStyle}>
        <BasketballIcon size={16} style={{ color: viewType === 'student' ? 'var(--color-student)' : 'var(--color-coach)' }} />
        <span style={watermarkTextStyle}>HOOPCOLLECTOR {viewType === 'coach' && 'FOR COACHES'}</span>
      </div>
      <div style={slideContentStyle}>
        {slide.highlight && (
          <div style={textHeaderStyle}>
            <h1 style={slideMainTitleStyle}>
              {slide.highlight.split('\n').map((line: string, i: number) => (
                <React.Fragment key={i}>
                  {line}
                  {i !== slide.highlight.split('\n').length - 1 && <br/>}
                </React.Fragment>
              ))}
            </h1>
            {slide.title && (
              <h2 style={slideSubTitleStyle}>
                {slide.title.split('\n').map((line: string, i: number) => (
                  <React.Fragment key={i}>
                    {line}
                    {i !== slide.title.split('\n').length - 1 && <br/>}
                  </React.Fragment>
                ))}
              </h2>
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
        :root {
          --color-student: #F97316;
          --color-coach: #3B82F6;
          --bg-surface-L1: #111113;
          --bg-surface-L2: #1A1A1E;
          --border-subtle: rgba(255,255,255,0.1);
        }
        @keyframes radar-ping {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
      
      <div className="card-minimal" style={controlBarStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: 4 }}>광고 프리뷰 도구</h1>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>PROPORTION 4:5 (1080 x 1350px)</p>
          </div>
          
          <div style={themeToggleContainer}>
            <button 
              onClick={() => { setViewType('student'); setCurrentSlide(0); }} 
              style={{ ...themeToggleBtn, background: viewType === 'student' ? 'var(--color-student)' : 'transparent', color: viewType === 'student' ? 'white' : 'rgba(255,255,255,0.4)' }}
            >학생용</button>
            <button 
              onClick={() => { setViewType('coach'); setCurrentSlide(0); }} 
              style={{ ...themeToggleBtn, background: viewType === 'coach' ? 'var(--color-coach)' : 'transparent', color: viewType === 'coach' ? 'white' : 'rgba(255,255,255,0.4)' }}
            >코치용</button>
          </div>
        </div>

        <button onClick={() => setIsGridView(!isGridView)} style={toggleButtonStyle}>
          {isGridView ? <MonitorPlay size={16} /> : <LayoutGrid size={16} />}
          <span>{isGridView ? '슬라이드' : '그리드'}</span>
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
            <div className="card-premium glass-morphism" style={{ borderRadius: 32, overflow: 'hidden', borderColor: viewType === 'student' ? 'var(--color-student)' : 'var(--color-coach)' }}>
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
                    background: currentSlide === idx ? (viewType === 'student' ? 'var(--color-student)' : 'var(--color-coach)') : 'rgba(255,255,255,0.2)'
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

const controlBarStyle: React.CSSProperties = { width: '100%', maxWidth: '1200px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 32px', margin: '20px auto 40px', background: 'rgba(7, 7, 8, 0.8)', backdropFilter: 'blur(10px)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' };
const themeToggleContainer: React.CSSProperties = { display: 'flex', background: 'rgba(255,255,255,0.05)', padding: 4, borderRadius: 12 };
const themeToggleBtn: React.CSSProperties = { padding: '8px 16px', borderRadius: 8, border: 'none', fontSize: '0.8rem', fontWeight: 900, cursor: 'pointer', transition: '0.2s' };
const toggleButtonStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'white', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' };
const mainViewStyle: React.CSSProperties = { flex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px 40px' };
const gridContainerStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32, maxWidth: '1200px', width: '100%', paddingBottom: 80 };
const carouselWrapperStyle: React.CSSProperties = { position: 'relative', width: '100%', maxWidth: 400 };
const navBtnStyle: React.CSSProperties = { position: 'absolute', top: '50%', transform: 'translateY(-50%)', width: 48, height: 48, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' };
const indicatorContainerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'center', marginTop: 24, gap: 8 };
const dotIndicatorStyle: React.CSSProperties = { height: 8, borderRadius: 100, border: 'none', cursor: 'pointer', transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)' };

const slideCardContainer: React.CSSProperties = { width: '100%', aspectRatio: '4 / 5', background: 'var(--bg-surface-L1)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' };
const watermarkStyle: React.CSSProperties = { position: 'absolute', top: 24, left: 24, display: 'flex', alignItems: 'center', gap: 8, zIndex: 20 };
const watermarkTextStyle: React.CSSProperties = { fontSize: '0.65rem', fontWeight: 900, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' };
const slideContentStyle: React.CSSProperties = { flex: 1, padding: '80px 32px 32px', display: 'flex', flexDirection: 'column' };
const textHeaderStyle: React.CSSProperties = { marginBottom: 32, zIndex: 10, position: 'relative' };
const slideMainTitleStyle: React.CSSProperties = { fontSize: '2.1rem', fontWeight: 950, color: 'white', lineHeight: 1.15, letterSpacing: '-0.02em', whiteSpace: 'pre-line', marginBottom: '16px' };
const slideSubTitleStyle: React.CSSProperties = { fontSize: '1.05rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, whiteSpace: 'pre-line' };
const slideVisualArea: React.CSSProperties = { flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const visualContainerStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%', gap: 24 };

const iconWrapperStyle: React.CSSProperties = { position: 'relative' };
const glowEffectStyle: React.CSSProperties = { position: 'absolute', top: -16, left: -16, right: -16, bottom: -16, background: 'var(--color-student)', borderRadius: '50%', filter: 'blur(40px)', opacity: 0.2 };
const iconGroupStyle: React.CSSProperties = { display: 'flex', gap: 8 };

const radarContainerStyle: React.CSSProperties = { position: 'relative', width: 192, height: 192, background: 'rgba(255,255,255,0.02)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.05)' };
const radarPulseStyle: React.CSSProperties = { position: 'absolute', width: '100%', height: '100%', border: '1px solid rgba(249, 115, 22, 0.2)', borderRadius: '50%', animation: 'radar-ping 3s linear infinite' };
const radarInnerCircleStyle: React.CSSProperties = { position: 'absolute', width: '75%', height: '75%', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '50%' };
const radarCoreStyle: React.CSSProperties = { position: 'absolute', width: '50%', height: '50%', background: 'rgba(249, 115, 22, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(249, 115, 22, 0.2)' };
const mapMarkerStyle: React.CSSProperties = { position: 'absolute', padding: '6px 12px', borderRadius: '100px', color: 'white', fontSize: '0.6rem', fontWeight: 900, border: '2px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.4)', whiteSpace: 'nowrap' };

const actualMatchCardStyle: React.CSSProperties = { width: '100%', background: 'var(--bg-surface-L2)', padding: '20px', borderRadius: '24px', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '12px' };
const actualCardHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const recurringBadgeStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa', fontSize: '0.75rem', fontWeight: 900 };
const oneTimeBadgeStyle: React.CSSProperties = { ...recurringBadgeStyle, background: 'rgba(249, 115, 22, 0.15)', color: '#fb923c' };
const actualTypeText: React.CSSProperties = { fontSize: '0.85rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)' };
const actualGradeBadgeStyle: React.CSSProperties = { padding: '4px 10px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 900, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' };
const actualCardTitle: React.CSSProperties = { fontSize: '1.1rem', fontWeight: 850, lineHeight: 1.3, color: 'white' };
const actualInfoRow: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '8px' };
const actualInfoItem: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 };
const actualLocationBox: React.CSSProperties = { padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' };
const actualCardFooter: React.CSSProperties = { marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' };
const actualPlayerCount: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 700 };
const actualPriceText: React.CSSProperties = { fontSize: '1rem', fontWeight: 900, color: 'white' };

const coachTabMini: React.CSSProperties = { flex: 1, padding: '8px', borderRadius: 10, fontSize: '0.7rem', fontWeight: 900, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 };
const tabBadgeMini: React.CSSProperties = { width: 14, height: 14, borderRadius: 4, background: 'white', color: 'black', fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const coachUserIcon: React.CSSProperties = { width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' };

const actualJournalContainer: React.CSSProperties = { width: '100%', padding: '24px', borderRadius: '24px', background: 'var(--bg-surface-L2)' };
const actualJournalHeader: React.CSSProperties = { marginBottom: '20px' };
const actualSessionBadge: React.CSSProperties = { display: 'inline-block', padding: '4px 12px', borderRadius: '100px', background: 'rgba(255,255,255,0.05)', fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.1em', color: 'var(--color-primary)' };
const actualJournalTitle: React.CSSProperties = { fontSize: '1rem', fontWeight: 900, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '10px', color: 'white' };
const actualJournalBody: React.CSSProperties = { display: 'grid', gap: '12px' };
const actualSkillRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '10px' };
const actualHomeworkBox: React.CSSProperties = { display: 'flex', padding: '16px', borderRadius: '16px', border: '1px solid', fontWeight: 700, fontSize: '0.8rem' };

const actualXpBarBg: React.CSSProperties = { width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '100px', overflow: 'hidden' };
const actualXpBarFill = (progress: number): React.CSSProperties => ({ width: `${progress}%`, height: '100%', background: 'var(--color-student)', borderRadius: '100px' });

const urlBadgeStyle: React.CSSProperties = { display: 'inline-block', padding: '10px 20px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.9rem', fontWeight: 800, color: 'rgba(255,255,255,0.8)' };
const finalCtaStyle: React.CSSProperties = { marginTop: 16, padding: '20px 48px', borderRadius: 100, border: 'none', fontWeight: 950, fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 10px 30px rgba(255,255,255,0.1)', background: 'white', color: 'black' };
const pageNumberStyle: React.CSSProperties = { position: 'absolute', bottom: 16, right: 16, background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '0.65rem', fontWeight: 900, padding: '4px 8px', borderRadius: 6, backdropFilter: 'blur(10px)' };
