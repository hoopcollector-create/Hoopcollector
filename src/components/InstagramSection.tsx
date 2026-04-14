import React from 'react';
import { Instagram, ExternalLink, Heart, MessageCircle } from 'lucide-react';

export const InstagramSection = () => {
    const posts = [
        { id: 1, img: '/images/insta_1.png' },
        { id: 2, img: '/images/insta_2.png' },
        { id: 3, img: '/images/insta_3.png' },
        { id: 4, img: '/images/insta_4.png' }
    ];

    return (
        <section style={containerStyle}>
            <div style={headerStyle}>
                <div style={badgeStyle}>INSTAGRAM FEED</div>
                <h2 style={titleStyle}>@hoop_collector</h2>
                <p style={subtitleStyle}>농구 열정으로 가득 찬 훕콜렉터의 일상을 만나보세요.</p>
            </div>

            <div style={gridStyle}>
                {posts.map(post => (
                    <div key={post.id} style={cardStyle} className="insta-card">
                        <img src={post.img} alt={`Hoopcollector Instagram ${post.id}`} style={imgStyle} />
                        <div style={overlayStyle}>
                            <a 
                                href="https://www.instagram.com/hoop_collector/" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={linkBtnStyle}
                            >
                                VIEW ON INSTAGRAM <ExternalLink size={14} style={{ marginLeft: 8 }} />
                            </a>
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
                .insta-card:hover .insta-overlay {
                    opacity: 1 !important;
                }
                .insta-card:hover img {
                    transform: scale(1.03);
                }
            `}</style>
        </section>
    );
};

const containerStyle: React.CSSProperties = {
    padding: window.innerWidth <= 768 ? '60px 20px' : '100px 24px',
    maxWidth: '1200px',
    margin: '0 auto',
};

const headerStyle: React.CSSProperties = {
    textAlign: 'center',
    marginBottom: '80px'
};

const badgeStyle: React.CSSProperties = {
    fontSize: '0.7rem',
    fontWeight: 900,
    letterSpacing: '0.2em',
    color: 'rgba(255,255,255,0.4)',
    marginBottom: '1rem'
};

const titleStyle: React.CSSProperties = {
    fontSize: window.innerWidth <= 768 ? '2rem' : '3rem',
    fontWeight: 900,
    marginBottom: '1rem',
    letterSpacing: '-0.04em'
};

const subtitleStyle: React.CSSProperties = {
    color: 'rgba(255,255,255,0.4)',
    fontSize: '1rem',
    fontWeight: 500
};

const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '4px', // Tighter grid for more modern minimalist look
    background: 'rgba(255,255,255,0.05)',
    padding: '4px',
    borderRadius: '2px'
};

const cardStyle: React.CSSProperties = {
    position: 'relative',
    aspectRatio: '1 / 1',
    overflow: 'hidden',
    cursor: 'pointer'
};

const imgStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
};

const overlayStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
    transition: 'opacity 0.4s ease',
    padding: '2rem'
};

// Re-defining overlay to work with CSS class
const linkBtnStyle: React.CSSProperties = {
    padding: '12px 24px',
    borderRadius: '100px',
    background: 'white',
    color: 'black',
    textDecoration: 'none',
    fontWeight: 900,
    fontSize: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    letterSpacing: '0.05em'
};
