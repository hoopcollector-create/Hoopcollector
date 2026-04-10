import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Eye, ThumbsUp, Send, MessageSquare, Award, Trash2 } from 'lucide-react';

type Post = {
    id: string;
    category: string;
    author_id: string;
    title: string;
    content: string;
    view_count: number;
    like_count: number;
    created_at: string;
    profiles: { name: string | null; avatar_url: string | null; } | null;
};

type Comment = {
    id: string;
    author_id: string;
    content: string;
    created_at: string;
    profiles: { name: string | null; avatar_url: string | null; } | null;
};

export const PostDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [post, setPost] = useState<Post | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        if (id) {
            loadPostData();
            checkUser();
        }
    }, [id]);

    async function checkUser() {
        const { data: { session } } = await supabase.auth.getSession();
        setCurrentUser(session?.user || null);
    }

    async function loadPostData() {
        setLoading(true);
        try {
            // 1. Load Post
            const { data: postData, error: postError } = await supabase
                .from('posts')
                .select('*')
                .eq('id', id)
                .maybeSingle();

            if (postError) throw postError;
            if (!postData) return;

            // 1-1. Fetch Author Profile manually
            const { data: authorProf } = await supabase.from('profiles').select('name, avatar_url').eq('id', postData.author_id).maybeSingle();
            setPost({ ...postData, profiles: authorProf });

            // 2. Increment View Count & Rewards
            if (id) {
                await supabase.rpc('increment_view_count', { post_id: id });
                await supabase.rpc('handle_post_read_reward', { target_post_id: id });
            }

            // 3. Load Comments
            const { data: commentData } = await supabase
                .from('comments')
                .select('*')
                .eq('post_id', id)
                .eq('is_deleted', false)
                .order('created_at', { ascending: true });

            if (commentData && commentData.length > 0) {
                const authorIds = Array.from(new Set(commentData.map(c => c.author_id)));
                const { data: cProfs } = await supabase.from('profiles').select('id, name, avatar_url').in('id', authorIds);
                const cProfMap = (cProfs || []).reduce((acc: any, p: any) => {
                    acc[p.id] = p;
                    return acc;
                }, {});

                const mergedComments = commentData.map(c => ({
                    ...c,
                    profiles: cProfMap[c.author_id] || { name: '익명', avatar_url: null }
                }));
                setComments(mergedComments);
            } else {
                setComments([]);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    async function submitComment() {
        if (!newComment.trim() || !currentUser || !id) return;
        try {
            const { error } = await supabase.from('comments').insert({
                post_id: id,
                author_id: currentUser.id,
                content: newComment
            });
            if (error) throw error;
            
            // Comment reward (Atomic)
            await supabase.rpc('handle_comment_reward', { target_post_id: id });
            
            setNewComment("");
            await loadPostData();
        } catch (e: any) {
            alert("댓글 작성 실패: " + e.message);
        }
    }

    async function deletePost() {
        if (!window.confirm("정말 이 글을 삭제하시겠습니까?")) return;
        try {
            const { error } = await supabase.from('posts').update({ is_deleted: true }).eq('id', id);
            if (error) throw error;
            navigate('/community');
        } catch (e: any) {
            alert("삭제 실패: " + e.message);
        }
    }

    if (loading && !post) return <div style={{ padding: 40, color: 'white' }}>로딩 중...</div>;
    if (!post) return <div style={{ padding: 40, color: 'white' }}>게시글을 찾을 수 없습니다.</div>;

    const isAuthor = currentUser?.id === post.author_id;

    return (
        <div style={{ color: 'white', maxWidth: '900px', margin: '0 auto' }}>
            <button onClick={() => navigate('/community')} style={backBtn}>
                <ArrowLeft size={18} style={{ marginRight: 8 }} /> 목록으로
            </button>

            <article style={article}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                    <div>
                        <span style={categoryBadge}>{post.category.toUpperCase()}</span>
                        <h1 style={titleStyle}>{post.title}</h1>
                        <div style={metaRow}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={avatarSmall}>{post.profiles?.name?.[0]}</div>
                                <span style={authorName}>{post.profiles?.name || '익명'}</span>
                            </div>
                            <span style={dot}>•</span>
                            <span>{new Date(post.created_at).toLocaleString()}</span>
                            <span style={dot}>•</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Eye size={14} /> {post.view_count}</span>
                        </div>
                    </div>
                    {isAuthor && (
                        <button onClick={deletePost} style={delBtn}><Trash2 size={18} /></button>
                    )}
                </div>

                <div style={contentBody}>
                    {post.content}
                </div>

                <div style={actionRow}>
                    <button style={likeBtn}><ThumbsUp size={18} style={{ marginRight: 8 }} /> 좋아요 {post.like_count}</button>
                    <div style={tokenTip}>
                        <Award size={14} style={{ marginRight: 6 }} /> 이 글을 읽어 <strong>1 토큰</strong>을 획득했습니다.
                    </div>
                </div>
            </article>

            {/* Comments Section */}
            <section style={{ marginTop: '3rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center' }}>
                    <MessageSquare size={20} style={{ marginRight: 10 }} /> 댓글 {comments.length}
                </h2>

                <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
                    {comments.map(comment => (
                        <div key={comment.id} style={commentCard}>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <div style={avatarSmall}>{comment.profiles?.name?.[0]}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{comment.profiles?.name}</span>
                                        <span style={{ fontSize: '0.75rem', opacity: 0.4 }}>{new Date(comment.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div style={{ fontSize: '0.95rem', lineHeight: 1.5, opacity: 0.9 }}>{comment.content}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Comment Input */}
                {currentUser ? (
                    <div style={commentInputContainer}>
                        <textarea 
                            value={newComment} 
                            onChange={e => setNewComment(e.target.value)} 
                            placeholder="건전한 커뮤니티를 위해 따뜻한 댓글을 남겨주세요." 
                            style={commentArea}
                        />
                        <button onClick={submitComment} style={sendBtn} disabled={!newComment.trim()}>
                            <Send size={18} style={{ marginRight: 8 }} /> 댓글 등록
                        </button>
                    </div>
                ) : (
                    <div style={emptyBox}>로그인 후 댓글을 작성할 수 있습니다.</div>
                )}
            </section>
        </div>
    );
};

const backBtn: React.CSSProperties = { background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', fontWeight: 700 };
const article: React.CSSProperties = { padding: '2.5rem', borderRadius: '28px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' };
const categoryBadge: React.CSSProperties = { fontSize: '0.7rem', fontWeight: 900, color: 'var(--color-primary)', background: 'rgba(59, 130, 246, 0.1)', padding: '4px 10px', borderRadius: '6px', letterSpacing: '0.05em' };
const titleStyle: React.CSSProperties = { fontSize: '2rem', fontWeight: 950, margin: '14px 0', lineHeight: 1.3 };
const metaRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' };
const dot: React.CSSProperties = { opacity: 0.3 };
const avatarSmall: React.CSSProperties = { width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, color: 'white' };
const authorName: React.CSSProperties = { fontWeight: 700, color: 'rgba(255,255,255,0.8)' };
const contentBody: React.CSSProperties = { marginTop: '2.5rem', fontSize: '1.1rem', lineHeight: 1.8, color: 'rgba(255,255,255,0.9)', whiteSpace: 'pre-line', minHeight: '200px' };
const actionRow: React.CSSProperties = { marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const likeBtn: React.CSSProperties = { padding: '10px 20px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', fontWeight: 700 };
const tokenTip: React.CSSProperties = { display: 'flex', alignItems: 'center', fontSize: '0.85rem', color: '#fbbf24', background: 'rgba(251, 191, 36, 0.1)', padding: '8px 16px', borderRadius: '10px' };
const commentCard: React.CSSProperties = { padding: '1.25rem', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' };
const commentInputContainer: React.CSSProperties = { display: 'grid', gap: '12px' };
const commentArea: React.CSSProperties = { width: '100%', height: '100px', padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none', resize: 'none', boxSizing: 'border-box' };
const sendBtn: React.CSSProperties = { padding: '14px', borderRadius: '14px', background: 'white', color: 'black', border: 'none', fontWeight: 900, cursor: 'pointer', justifySelf: 'end', display: 'flex', alignItems: 'center' };
const delBtn: React.CSSProperties = { padding: '8px', borderRadius: '8px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.6 };
const emptyBox: React.CSSProperties = { padding: '2rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', color: 'rgba(255,255,255,0.3)' };
