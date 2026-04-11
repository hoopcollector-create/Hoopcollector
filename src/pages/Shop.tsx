import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ShoppingBag, Search, ChevronRight, ArrowRight, ArrowRightCircle } from 'lucide-react';

interface Product {
    id: string;
    title: string;
    description: string;
    thumbnail_url: string;
    category: string;
    slug: string;
    min_price?: number;
    total_stock?: number;
}

export const Shop = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    const categories = ['All', 'Hoodie', 'Tshirt', 'Socks', 'Headwear'];

    useEffect(() => {
        loadShopData();
    }, []);

    async function loadShopData() {
        setLoading(true);
        // Fetch products and their variants to get prices and stock
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

    if (loading) return <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>COLLECTING PRODUCTS...</div>;

    return (
        <div style={{ width: '100%', maxWidth: '1400px', margin: '0 auto', padding: '0 0 100px 0' }}>
            {/* Hero Section */}
            <header style={heroStyle}>
                <div style={{ zIndex: 2, textAlign: 'center' }}>
                    <div style={badgeStyle}>HOOP COLLECTOR STORE</div>
                    <h1 style={heroTitleStyle}>THE COLLECTION</h1>
                    <p style={heroSubtitleStyle}>Elevate your game with our premium basketball essentials.</p>
                </div>
            </header>

            <div style={{ padding: '0 24px' }}>
                {/* Search & Filter Bar */}
                <div style={filterBarContainer}>
                    <div style={categoryListStyle}>
                        {categories.map(cat => (
                            <button 
                                key={cat} 
                                onClick={() => setActiveCategory(cat)}
                                style={{
                                    ...categoryBtnStyle,
                                    background: activeCategory === cat ? 'white' : 'transparent',
                                    color: activeCategory === cat ? 'black' : 'rgba(255,255,255,0.4)',
                                    border: activeCategory === cat ? '1px solid white' : '1px solid rgba(255,255,255,0.1)'
                                }}
                            >
                                {cat.toUpperCase()}
                            </button>
                        ))}
                    </div>
                    <div style={searchContainerStyle}>
                        <Search size={18} style={{ opacity: 0.3 }} />
                        <input 
                            placeholder="Search products..." 
                            style={searchInputStyle}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Product Grid */}
                {filteredProducts.length > 0 ? (
                    <div style={gridStyle}>
                        {filteredProducts.map(p => (
                            <div key={p.id} style={cardStyle} className="product-card" onClick={() => navigate(`/shop/${p.slug}`)}>
                                <div style={imageContainerStyle}>
                                    {p.thumbnail_url ? (
                                        <img src={p.thumbnail_url} alt={p.title} style={imgStyle} />
                                    ) : (
                                        <div style={placeholderImgStyle}><ShoppingBag size={48} opacity={0.1} /></div>
                                    )}
                                    {p.total_stock === 0 && <div style={soldOutBadge}>SOLD OUT</div>}
                                    <div style={overlayStyle} className="card-overlay">
                                        <button style={viewBtnStyle}>VIEW DETAILS <ArrowRight size={16} style={{ marginLeft: 8 }} /></button>
                                    </div>
                                </div>
                                <div style={{ marginTop: '16px' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 900, color: 'rgba(255,255,255,0.3)', marginBottom: '4px', letterSpacing: '0.05em' }}>{p.category.toUpperCase()}</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>{p.title}</h3>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'white' }}>
                                            {p.min_price?.toLocaleString()} P
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '100px 0', opacity: 0.3 }}>
                        <ShoppingBag size={48} style={{ marginBottom: '20px' }} />
                        <p>No products found in this category.</p>
                    </div>
                )}
            </div>

            <style>{`
                .product-card:hover .card-overlay {
                    opacity: 1 !important;
                }
                .product-card:hover img {
                    transform: scale(1.05);
                }
            `}</style>
        </div>
    );
};

const heroStyle: React.CSSProperties = {
    height: '400px',
    background: '#0a0a0b',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: '60px',
    borderBottom: '1px solid rgba(255,255,255,0.05)'
};

const badgeStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    fontWeight: 900,
    letterSpacing: '0.2em',
    color: 'rgba(255,255,255,0.4)',
    marginBottom: '1rem'
};

const heroTitleStyle: React.CSSProperties = {
    fontSize: '5rem',
    fontWeight: 900,
    letterSpacing: '-0.04em',
    margin: 0,
    lineHeight: 1
};

const heroSubtitleStyle: React.CSSProperties = {
    fontSize: '1.1rem',
    color: 'rgba(255,255,255,0.4)',
    marginTop: '1.5rem',
    fontWeight: 500
};

const filterBarContainer: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '50px',
    flexWrap: 'wrap',
    gap: '20px'
};

const categoryListStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px'
};

const categoryBtnStyle: React.CSSProperties = {
    padding: '10px 20px',
    borderRadius: '100px',
    fontSize: '0.75rem',
    fontWeight: 800,
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    outline: 'none'
};

const searchContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '100px',
    padding: '0 20px',
    border: '1px solid rgba(255,255,255,0.05)',
    width: '100%',
    maxWidth: '300px'
};

const searchInputStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    color: 'white',
    padding: '12px 12px',
    fontSize: '0.9rem',
    outline: 'none',
    width: '100%'
};

const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '40px 30px'
};

const cardStyle: React.CSSProperties = {
    cursor: 'pointer'
};

const imageContainerStyle: React.CSSProperties = {
    aspectRatio: '1 / 1.2',
    background: '#111827',
    borderRadius: '24px',
    overflow: 'hidden',
    position: 'relative',
    border: '1px solid rgba(255,255,255,0.05)'
};

const imgStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
};

const placeholderImgStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
};

const overlayStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
    transition: 'opacity 0.4s ease',
    backdropFilter: 'blur(4px)'
};

const viewBtnStyle: React.CSSProperties = {
    background: 'white',
    color: 'black',
    border: 'none',
    padding: '14px 28px',
    borderRadius: '100px',
    fontWeight: 900,
    fontSize: '0.8rem',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer'
};

const soldOutBadge: React.CSSProperties = {
    position: 'absolute',
    top: '20px',
    right: '20px',
    background: 'black',
    color: 'white',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '0.7rem',
    fontWeight: 900,
    zIndex: 3
};
