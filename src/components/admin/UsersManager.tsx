import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { User, Shield, Award, ExternalLink, Search, Filter, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export const UsersManager = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'coach'>('all');
    
    useEffect(() => { 
        loadUsers(); 
    }, [roleFilter]); // Reload when role filter changes
    
    async function loadUsers() {
        setLoading(true);
        let query = supabase.from('profiles').select('*');
        
        if (roleFilter === 'coach') {
            query = query.not('coach_grade', 'is', null);
        } else if (roleFilter === 'student') {
            query = query.is('coach_grade', null);
        }
        
        const { data } = await query.order('created_at', { ascending: false }).limit(100);
        setUsers(data || []);
        setLoading(false);
    }

    // Client-side search filtering for immediate feedback
    const filteredUsers = users.filter(u => {
        const nameMatch = (u.name || u.display_name || '').toLowerCase().includes(searchTerm.toLowerCase());
        const emailMatch = (u.email || '').toLowerCase().includes(searchTerm.toLowerCase());
        return nameMatch || emailMatch;
    });

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', gap: '20px', flexWrap: 'wrap' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>회원 관리</h2>
                    <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0 }}>전체 회원 목록을 조회하고 필터를 통해 특정 사용자를 검색합니다.</p>
                </div>
                
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {/* Role Filter */}
                    <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <FilterButton active={roleFilter === 'all'} onClick={() => setRoleFilter('all')}>전체</FilterButton>
                        <FilterButton active={roleFilter === 'student'} onClick={() => setRoleFilter('student')}>학생</FilterButton>
                        <FilterButton active={roleFilter === 'coach'} onClick={() => setRoleFilter('coach')}>코치</FilterButton>
                    </div>

                    {/* Search Bar */}
                    <div style={{ position: 'relative', width: '280px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                        <input 
                            type="text" 
                            placeholder="이름 또는 이메일 검색..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ 
                                width: '100%', 
                                padding: '12px 16px 12px 42px', 
                                borderRadius: '12px', 
                                background: 'rgba(255,255,255,0.05)', 
                                border: '1px solid rgba(255,255,255,0.1)', 
                                color: 'white',
                                outline: 'none',
                                fontSize: '0.9rem'
                            }} 
                        />
                        {searchTerm && (
                            <button 
                                onClick={() => setSearchTerm('')}
                                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'white', opacity: 0.5, cursor: 'pointer' }}
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div style={{ overflowX: 'auto', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
                            <th style={{ padding: '20px' }}>사용자</th>
                            <th style={{ padding: '20px' }}>역할</th>
                            <th style={{ padding: '20px' }}>연락처</th>
                            <th style={{ padding: '20px' }}>활동 정보</th>
                            <th style={{ padding: '20px', textAlign: 'right' }}>관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>데이터를 불러오는 중...</td></tr>
                        ) : filteredUsers.length > 0 ? (
                            filteredUsers.map((u: any) => (
                                <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }} className="hover-bright">
                                    <td style={{ padding: '15px 20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                {u.photo_url ? (
                                                    <img src={u.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <User size={18} style={{ opacity: 0.3 }} />
                                                )}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{u.name || u.display_name || 'N/A'}</div>
                                                <div style={{ fontSize: '0.75rem', opacity: 0.4 }}>{u.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '15px 20px' }}>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '8px', background: u.coach_grade ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            {u.coach_grade ? <Shield size={12} color="#3b82f6" /> : <User size={12} style={{ opacity: 0.5 }} />}
                                            <span style={{ fontSize: '0.8rem', color: u.coach_grade ? '#3b82f6' : 'white', fontWeight: 600 }}>
                                                {u.coach_grade ? `코치 (${u.coach_grade})` : '학생'}
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '15px 20px', fontSize: '0.85rem', opacity: 0.8 }}>{u.phone || '-'}</td>
                                    <td style={{ padding: '15px 20px' }}>
                                        <div style={{ display: 'flex', gap: '15px', fontSize: '0.85rem' }}>
                                            <div title="보유 토큰" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Award size={14} color="#f59e0b" /> {u.total_tokens?.toLocaleString() || 0}</div>
                                            <div title="활동 점수" style={{ opacity: 0.5 }}>{u.activity_score?.toLocaleString() || 0} pts</div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '15px 20px', textAlign: 'right' }}>
                                        <Link 
                                            to={u.coach_grade ? `/coach-detail/${u.id}` : `/dashboard?uid=${u.id}`} 
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: 'white', textDecoration: 'none', fontSize: '0.75rem', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 700, transition: 'all 0.2s' }}
                                            className="hover-lift"
                                        >
                                            <ExternalLink size={12} /> 상세보기
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={5} style={{ padding: '100px 40px', textAlign: 'center', opacity: 0.3 }}>검색 결과가 없습니다.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const FilterButton = ({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) => (
    <button 
        onClick={onClick}
        style={{ 
            padding: '8px 16px', 
            borderRadius: '8px', 
            border: 'none', 
            background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
            color: active ? 'white' : 'rgba(255,255,255,0.4)',
            fontSize: '0.85rem',
            fontWeight: active ? 700 : 500,
            cursor: 'pointer',
            transition: 'all 0.2s'
        }}
    >
        {children}
    </button>
);
