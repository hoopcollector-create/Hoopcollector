import React from 'react';
import { Instagram, ExternalLink } from 'lucide-react';

export const InstagramSection = () => {
    return (
        <section style={containerStyle}>
            <div style={cardStyle} className="insta-banner">
                <div style={contentStyle}>
                    <div style={iconBox}>
                        <Instagram size={32} />
                    </div>
                    <div style={textContent}>
                        <div style={badgeStyle}>CONNECT WITH US</div>
                        <h2 style={titleStyle}>훕콜렉터 공식 인스타그램</h2>
                        <p style={subtitleStyle}>
                            최신 농구 소식과 훈련 꿀팁, 그리고 훕콜렉터의 일상을 가장 먼저 확인하세요.
                        </p>
                    </div>
                    <a 
                        href="https://www.instagram.com/hoop_collector/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={linkBtnStyle}
                        className="btn-premium"
                    >
                        @hoop_collector 팔로우하기 <ExternalLink size={16} style={{ marginLeft: 8 }} />
                    </a>
                </div>
            </div>

            <style>{`
                .insta-banner {
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                .insta-banner:hover {
                    transform: translateY(-5px);
                    border-color: rgba(255, 107, 0, 0.3) !important;
                    background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255, 107, 0, 0.05) 100%) !important;
                }
                .btn-premium {
                    transition: all 0.3s ease;
                }
                .btn-premium:hover {
                    background: #f8f9fa !important;
                    transform: scale(1.02);
                }
            `}</style>
        </section>
    );
};

const containerStyle: React.CSSProperties = {
    padding: '80px 24px',
    maxWidth: '1000px',
    margin: '0 auto',
};

const cardStyle: React.CSSProperties = {
    padding: '60px 40px',
    borderRadius: '32px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center'
};

const contentStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '24px',
    maxWidth: '600px'
};

const iconBox: React.CSSProperties = {
    width: '72px',
    height: '72px',
    borderRadius: '24px',
    background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    boxShadow: '0 10px 30px rgba(220, 39, 67, 0.3)',
    marginBottom: '8px'
};

const textContent: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
};

const badgeStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    fontWeight: 900,
    letterSpacing: '0.2em',
    color: 'var(--color-coach)',
    opacity: 0.8
};

const titleStyle: React.CSSProperties = {
    fontSize: '2.5rem',
    fontWeight: 900,
    letterSpacing: '-0.03em',
    margin: 0
};

const subtitleStyle: React.CSSProperties = {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '1.1rem',
    lineHeight: 1.6,
    margin: 0
};

const linkBtnStyle: React.CSSProperties = {
    marginTop: '16px',
    padding: '18px 40px',
    borderRadius: '100px',
    background: 'white',
    color: 'black',
    textDecoration: 'none',
    fontWeight: 900,
    fontSize: '1rem',
    display: 'flex',
    alignItems: 'center',
    boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
};
