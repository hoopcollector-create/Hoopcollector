import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export const ProductsManager = () => {
    const [products, setProducts] = useState<any[]>([]);
    useEffect(() => { loadProducts(); }, []);
    async function loadProducts() {
        const { data } = await supabase.from('products').select('*').order('class_type').order('ticket_qty');
        setProducts(data || []);
    }

    return (
        <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>판매 상품 관리</h2>
            <div style={{ display: 'grid', gap: '12px' }}>
                {products.map((p: any) => (
                    <div key={p.id} style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontWeight: 800, marginBottom: '4px' }}>Class {p.class_type} - {p.ticket_qty}회권</div>
                            <div style={{ color: '#3b82f6' }}>{p.price.toLocaleString()}원</div>
                        </div>
                        <div style={{ padding: '4px 12px', borderRadius: '999px', fontSize: '0.8rem', background: p.active ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: p.active ? '#4ade80' : '#f87171' }}>
                            {p.active ? '판매중' : '중단'}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
