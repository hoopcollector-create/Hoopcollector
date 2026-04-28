import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ShoppingBag, Search, ArrowRight } from 'lucide-react';
import { ShopProduct } from '../types/dashboard';

export const Shop = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState<ShopProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    const categories = ['All', 'Hoodie', 'Tshirt', 'Socks', 'Headwear'];

    useEffect(() => {
        loadShopData();
    }, []);

    async function loadShopData() {
        setLoading(true);
        const { data: pData, error: pError } = await supabase
            .from('shop_products')
            .select('*, shop_product_variants(point_price, stock_qty)')
            .eq('is_active', true);

        if (!pError && pData) {
            const processed = pData.map(p => {
                const variants = p.shop_product_variants || [];
                const minPrice = variants.length > 0 ? Math.min(...variants.map((v: any) => v.point_price)) : 0;
                const totalStock = variants.reduce((sum: number, v: any) => sum + v.stock_qty, 0);
                return { ...p, min_price: minPrice, total_stock: totalStock };
            }).sort((a, b) => {
                if (a.total_stock > 0 && b.total_stock === 0) return -1;
                if (a.total_stock === 0 && b.total_stock > 0) return 1;
                return 0;
            });
            setProducts(processed);
        }
        setLoading(false);
    }

    const filteredProducts = products.filter(p => {
        const matchCategory = activeCategory === 'All' || p.category === activeCategory;
        const matchSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCategory && matchSearch;
    });

    if (loading) return (
        <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#070708' }}>
            <div style={{ textAlign: 'center' }}>
                <div className="text-gradient" style={{ fontSize: '1.5rem', fontWeight: 900 }}>HOOPCOLLECTOR</div>
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', marginTop: '8px', letterSpacing: '0.2em' }}>COLLECTING PRODUCTS...</div>
            </div>
        </div>
    );

    return (
        <div style={{ width: '100%', background: '#070708' }}>
            {/* Hero Section - Brand Focus */}
            <header style={heroStyle}>
                <div style={heroOverlay} />
                <div style={{ zIndex: 2, textAlign: 'center', padding: '0 20px' }}>
                    <div style={badgeStyle}>PREMIUM BASKETBALL GEAR</div>
                    <h1 style={heroTitleStyle}>THE <span className="text-gradient">COLLECTION</span></h1>
                    <p style={heroSubtitleStyle}>훕콜렉터의 철학이 담긴 프리미엄 에센셜.</p>
                </div>
            </header>

            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px 100px' }}>
                {/* Clean Filter Bar */}
                <div style={filterBarContainer}>
                    <div className="hide-scrollbar" style={categoryScrollStyle}>
                        {categories.map(cat => (
                            <button 
                                key={cat} 
                                onClick={() => setActiveCategory(cat)}
                                style={{
                                    ...categoryBtnStyle,
                                    background: activeCategory === cat ? 'white' : 'rgba(255,255,255,0.03)',
                                    color: activeCategory === cat ? 'black' : 'rgba(255,255,255,0.4)',
                                    border: activeCategory === cat ? '1px solid white' : '1px solid rgba(255,255,255,0.05)'
                                }}
                            >
                                {cat.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Product Grid - Compact 2-column on Mobile */}
                {filteredProducts.length > 0 ? (
                    <div className="shop-grid" style={gridStyle}>
                        {filteredProducts.map(p => (
                            <div key={p.id} className="hover-lift shop-card-compact" style={cardStyle} onClick={() => navigate(`/shop/${p.slug}`)}>
                                <div style={imageContainerStyle}>
                                    {p.thumbnail_url ? (
                                        <img src={p.thumbnail_url} alt={p.title} style={imgStyle} />
                                    ) : (
                                        <div style={placeholderImgStyle}><ShoppingBag size={32} opacity={0.15} /></div>
                                    )}
                                    {p.total_stock === 0 && <div style={soldOutBadge}>OUT OF STOCK</div>}
                                </div>
                                <div style={{ marginTop: '12px' }}>
                                    <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--theme-primary)', marginBottom: '4px', letterSpacing: '0.05em' }}>{p.category.toUpperCase()}</div>
                                    <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0 0 6px 0', color: 'white', lineHeight: 1.2 }}>{p.title}</h3>
                                    <div style={{ fontSize: '1rem', fontWeight: 900, color: 'white' }}>
                                        {p.min_price?.toLocaleString()} <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>P</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '100px 0', opacity: 0.2 }}>
                        <ShoppingBag size={48} style={{ marginBottom: '20px' }} />
                        <p style={{ fontWeight: 700 }}>No products found.</p>
                    </div>
                )}
            </div>

            <style>{`
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};

/* Styles */
const heroStyle: React.CSSProperties = {
    height: '340px',
    background: '#070708',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: '40px',
    overflow: 'hidden'
};

const heroOverlay: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(circle at center, rgba(249, 115, 22, 0.05) 0%, transparent 70%)',
    zIndex: 1
};

const badgeStyle: React.CSSProperties = {
    fontSize: '0.7rem',
    fontWeight: 900,
    letterSpacing: '0.3em',
    color: 'var(--theme-primary)',
    marginBottom: '1.2rem'
};

const heroTitleStyle: React.CSSProperties = {
    fontSize: '3.2rem',
    fontWeight: 900,
    letterSpacing: '-0.05em',
    margin: 0,
    lineHeight: 1,
    color: 'white'
};

const heroSubtitleStyle: React.CSSProperties = {
    fontSize: '0.9rem',
    color: 'rgba(255,255,255,0.4)',
    marginTop: '1.2rem',
    fontWeight: 600,
    letterSpacing: '-0.02em'
};

const filterBarContainer: React.CSSProperties = {
    marginBottom: '32px',
    display: 'flex',
    justifyContent: 'center'
};

const categoryScrollStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    padding: '4px',
    width: '100%',
    justifyContent: 'center'
};

const categoryBtnStyle: React.CSSProperties = {
    padding: '8px 18px',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: 800,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
    border: 'none',
    outline: 'none'
};

const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: '32px 24px'
};

const cardStyle: React.CSSProperties = {
    cursor: 'pointer',
    padding: '8px',
    background: 'transparent'
};

const imageContainerStyle: React.CSSProperties = {
    aspectRatio: '1 / 1',
    background: 'linear-gradient(180deg, #161618 0%, #0a0a0b 100%)',
    borderRadius: '20px',
    overflow: 'hidden',
    position: 'relative',
    border: '1px solid rgba(255,255,255,0.05)'
};

const imgStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
};

const placeholderImgStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white'
};

const soldOutBadge: React.CSSProperties = {
    position: 'absolute',
    top: '12px',
    right: '12px',
    background: 'rgba(0,0,0,0.8)',
    backdropFilter: 'blur(8px)',
    color: 'white',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '0.6rem',
    fontWeight: 900,
    zIndex: 3,
    border: '1px solid rgba(255,255,255,0.1)'
};
