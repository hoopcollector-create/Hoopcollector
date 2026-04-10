import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { MessageSquare, Bell, HelpCircle, BookOpen, FileText, MessageCircle, Eye, ThumbsUp, Plus, Clock, Filter } from 'lucide-react';

type CategoryId = 'notice' | 'qna' | 'curriculum' | 'journal' | 'feedback';

type Post = {
    id: string;
    category: CategoryId;
    author_id: string;
    title: string;
    content: string;
    view_count: number;
    like_count: number;
    created_at: string;
    profiles: { name: string | null; avatar_url: string | null; } | null;
};

const CATEGORIES: { id: CategoryId; name: string; icon: any; color: string }[] = [
    { id: 'notice', name: '공지사항', icon: Bell, color: '#ef4444' },
    { id: 'qna', name: '질문답변', icon: HelpCircle, color: '#3b82f6' },
    { id: 'curriculum', name: '커리큘럼', icon: BookOpen, color: '#10b981' },
    { id: 'journal', name: '수업일지', icon: FileText, color: '#8b5cf6' },
    { id: 'feedback', name: '개선피드백', icon: MessageCircle, color: '#f59e0b' },
];

export const CommunityList = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'all'>('all');
    const [search, setSearch] = useState("");

    useEffect(() => {
        loadPosts();
    }, []);

    async function loadPosts() {
        setLoading(true);
        try {
            // 1. Fetch Posts
            const { data: postsData, error: postsError } = await supabase
                .from('posts')
                .select('*')
                .eq('is_deleted', false)
                .order('created_at', { ascending: false });

            if (postsError) throw postsError;

            // 2. Fetch Author Profiles Manually
            if (postsData && postsData.length > 0) {
                const authorIds = Array.from(new Set(postsData.map(p => p.author_id)));
                const { data: profs } = await supabase.from('profiles').select('id, name, avatar_url').in('id', authorIds);
                
                const profMap = (profs || []).reduce((acc: any, p: any) => {
                    acc[p.id] = p;
                    return acc;
                }, {});

                const merged = postsData.map(p => ({
                    ...p,
                    profiles: profMap[p.author_id] || null
                }));
                setPosts(merged);
            } else {
                setPosts([]);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    const filteredPosts = useMemo(() => {
        let list = posts;
        if (selectedCategory !== 'all') {
            list = list.filter(p => p.category === selectedCategory);
        }
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(p => p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q));
        }
        return list;
    }, [posts, selectedCategory, search]);

    return (
        <div style={{ color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }} className="page-header">
                <div>
                    <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 1.75rem)', fontWeight: 900, marginBottom: '0.5rem' }}>커뮤니티</h1>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>코치님들의 경험과 지식을 나누는 공간입니다.</p>
                </div>
                <Link to="/community/write" style={writeBtn}>
                    <Plus size={18} style={{ marginRight: 8 }} /> 글쓰기
                </Link>
            </div>

            {/* Category Filter */}
            <div style={filterContainer}>
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
                    <button 
                        onClick={() => setSelectedCategory('all')} 
                        style={selectedCategory === 'all' ? categoryBtnOn : categoryBtnOff}
                    >전체</button>
                    {CATEGORIES.map(cat => (
                        <button 
                            key={cat.id} 
                            onClick={() => setSelectedCategory(cat.id)} 
                            style={selectedCategory === cat.id ? { ...categoryBtnOn, borderColor: cat.color, color: cat.color } : categoryBtnOff}
                        >
                            <cat.icon size={14} style={{ marginRight: 6 }} />
                            {cat.name}
                        </button>
                    ))}
                </div>
                <div style={searchRow}>
                    <Filter size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
                    <input 
                        value={search} 
                        onChange={e => setSearch(e.target.value)} 
                        placeholder="제목이나 내용 검색..." 
                        style={searchInput}
                    />
                </div>
            </div>

            {/* Posts List */}
            <div style={{ display: 'grid', gap: '0.75rem' }}>
                {loading ? (
                    <div style={emptyBox}>로딩 중...</div>
                ) : filteredPosts.length === 0 ? (
                    <div style={emptyBox}>게시글이 없습니다.</div>
                ) : (
                    filteredPosts.map(post => (
                        <Link key={post.id} to={`/community/post/${post.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div style={postCard}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <div style={{ ...categoryLabel, background: CATEGORIES.find(c => c.id === post.category)?.color + '20', color: CATEGORIES.find(c => c.id === post.category)?.color }}>
                                        {CATEGORIES.find(c => c.id === post.category)?.name}
                                    </div>
                                    <div style={timeText}><Clock size={12} style={{ marginRight: 4 }} /> {new Date(post.created_at).toLocaleDateString()}</div>
                                </div>
                                <h3 style={postTitle}>{post.title}</h3>
                                <p style={postSnippet}>{post.content.slice(0, 120)}{post.content.length > 120 ? '...' : ''}</p>
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={avatarSmall}>{post.profiles?.name?.[0] || '익'}</div>
                                        <span style={authorName}>{post.profiles?.name || '익명'}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '16px', opacity: 0.5, fontSize: '0.85rem' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Eye size={14} /> {post.view_count}</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><ThumbsUp size={14} /> {post.like_count}</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
};

const filterContainer: React.CSSProperties = { display: 'grid', gridTemplateColumns: window.innerWidth <= 768 ? '1fr' : '1fr minmax(200px, 300px)', gap: '1rem', marginBottom: '2rem', alignItems: 'center' };
const searchRow: React.CSSProperties = { position: 'relative' };
const searchInput: React.CSSProperties = { width: '100%', padding: '12px 14px 12px 40px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', outline: 'none', boxSizing: 'border-box' };
const categoryBtnOff: React.CSSProperties = { padding: '10px 16px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', fontWeight: 700 };
const categoryBtnOn: React.CSSProperties = { ...categoryBtnOff, background: 'rgba(255,255,255,0.1)', color: 'white', borderColor: 'rgba(255,255,255,0.2)' };
const writeBtn: React.CSSProperties = { padding: '12px 20px', borderRadius: '14px', background: 'white', color: 'black', textDecoration: 'none', fontWeight: 900, display: 'flex', alignItems: 'center' };
const postCard: React.CSSProperties = { padding: '1.5rem', borderRadius: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', transition: 'all 0.2s', cursor: 'pointer' };
const categoryLabel: React.CSSProperties = { padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800 };
const postTitle: React.CSSProperties = { fontSize: '1.2rem', fontWeight: 800, margin: '8px 0', lineHeight: 1.4 };
const postSnippet: React.CSSProperties = { fontSize: '0.95rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, margin: 0 };
const avatarSmall: React.CSSProperties = { width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800 };
const authorName: React.CSSProperties = { fontSize: '0.85rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)' };
const timeText: React.CSSProperties = { fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center' };
const emptyBox: React.CSSProperties = { padding: '4rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px dashed rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' };
