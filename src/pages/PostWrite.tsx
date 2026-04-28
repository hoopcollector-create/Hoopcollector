import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Send, AlertCircle, FileText, Bell, HelpCircle, BookOpen, MessageCircle, Image as ImageIcon, X } from 'lucide-react';
import { ImageUploadField } from '../components/admin/ImageUploadField';

type CategoryId = 'notice' | 'qna' | 'curriculum' | 'journal' | 'feedback';

export const PostWrite = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>(); // for editing
    const [loading, setLoading] = useState(false);
    
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState<CategoryId>('qna');
    const [content, setContent] = useState("");
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        checkUser();
        if (id) loadPostForEdit();
    }, [id]);

    async function checkUser() {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            alert("로그인이 필요합니다.");
            navigate('/login');
            return;
        }
        setCurrentUser(session.user);
        
        // Check admin status for 'notice' category
        const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id).eq('role', 'admin').maybeSingle();
        setIsAdmin(!!roleData);
    }

    async function loadPostForEdit() {
        // logic for editing existing post
    }

    async function handleSubmit() {
        if (!title.trim() || !content.trim()) {
            alert("제목과 내용을 모두 입력해 주세요.");
            return;
        }
        if (category === 'notice' && !isAdmin) {
            alert("공지사항은 관리자만 작성할 수 있습니다.");
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase.from('posts').insert({
                author_id: currentUser.id,
                category,
                title,
                content,
                image_url: imageUrls[0] || null,
                image_urls: imageUrls
            }).select().single();

            if (error) throw error;

            // Handle reward for writing post
            await supabase.rpc('handle_post_write_reward', { target_post_id: data.id, target_category: category });

            alert("게시글이 등록되었습니다.");
            navigate(`/community/post/${data.id}`);
        } catch (e: any) {
            alert("저장 실패: " + e.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ color: 'white', maxWidth: '900px', margin: '0 auto' }}>
            <button onClick={() => navigate(-1)} style={backBtn}>
                <ArrowLeft size={18} style={{ marginRight: 8 }} /> 취소하고 돌아가기
            </button>

            <div style={container}>
                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '0.5rem' }}>글쓰기</h1>
                    <p style={{ color: 'rgba(255,255,255,0.6)' }}>코치 커뮤니티에 새로운 소식이나 경험을 공유해 주세요.</p>
                </div>

                <div style={formGrid}>
                    <div style={inputGroup}>
                        <label style={labelStyle}>카테고리</label>
                        <div style={categoryList}>
                            <CatTab id="notice" name="공지사항" icon={Bell} active={category === 'notice'} onClick={setCategory} disabled={!isAdmin} />
                            <CatTab id="qna" name="질문답변" icon={HelpCircle} active={category === 'qna'} onClick={setCategory} />
                            <CatTab id="curriculum" name="커리큘럼" icon={BookOpen} active={category === 'curriculum'} onClick={setCategory} />
                            <CatTab id="journal" name="수업일지" icon={FileText} active={category === 'journal'} onClick={setCategory} />
                            <CatTab id="feedback" name="개선피드백" icon={MessageCircle} active={category === 'feedback'} onClick={setCategory} />
                        </div>
                        {category === 'notice' && !isAdmin && (
                            <div style={adminWarn}><AlertCircle size={14} style={{ marginRight: 6 }} /> 공지사항은 관리자 계정만 작성 가능합니다.</div>
                        )}
                    </div>

                    <div style={inputGroup}>
                        <label style={labelStyle}>제목</label>
                        <input 
                            value={title} 
                            onChange={e => setTitle(e.target.value)} 
                            placeholder="제목을 입력해 주세요" 
                            style={inputStyle}
                        />
                    </div>

                    <div style={inputGroup}>
                        <label style={labelStyle}>내용</label>
                        <textarea 
                            value={content} 
                            onChange={e => setContent(e.target.value)} 
                            placeholder="내용을 입력해 주세요. 수업일지나 피드백을 작성하면 더 많은 토큰이 지급됩니다." 
                            style={textArea}
                        />
                    </div>

                    <div style={inputGroup}>
                        <label style={labelStyle}>이미지 첨부 (최대 3장)</label>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
                            {imageUrls.map((url, idx) => (
                                <div key={idx} style={imagePreviewWrap}>
                                    <img src={url} alt="Uploaded" style={imagePreview} />
                                    <button onClick={() => setImageUrls(prev => prev.filter((_, i) => i !== idx))} style={removeImgBtn}><X size={12} /></button>
                                </div>
                            ))}
                            {imageUrls.length < 3 && (
                                <div style={{ width: '100px' }}>
                                    <ImageUploadField 
                                        label=""
                                        value=""
                                        onChange={(url) => setImageUrls(prev => [...prev, url])}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={rewardInfo}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '8px', color: '#fbbf24' }}>적립 예상 혜택</div>
                        <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.7 }}>
                            일반 글 작성 시 <strong>3 토큰 / 5 활동점수</strong>가 즉시 적립됩니다.<br/>
                            (수업일지/피드백 작성 시 추가 보너스 지급)
                        </p>
                    </div>

                    <button onClick={handleSubmit} disabled={loading} style={submitBtn}>
                        <Send size={18} style={{ marginRight: 8 }} /> {loading ? "저장 중..." : "게시글 등록하기"}
                    </button>
                </div>
            </div>
        </div>
    );
};

const CatTab = ({ id, name, icon: Icon, active, onClick, disabled }: any) => (
    <button 
        type="button" 
        onClick={() => !disabled && onClick(id)} 
        style={{
            ...catBtn,
            opacity: disabled ? 0.3 : 1,
            cursor: disabled ? 'not-allowed' : 'pointer',
            borderColor: active ? 'white' : 'rgba(255,255,255,0.08)',
            background: active ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)',
            color: active ? 'white' : 'rgba(255,255,255,0.5)'
        }}
    >
        <Icon size={14} style={{ marginRight: 6 }} /> {name}
    </button>
);

const backBtn: React.CSSProperties = { background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', fontWeight: 700 };
const container: React.CSSProperties = { padding: '2.5rem', borderRadius: '32px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' };
const formGrid: React.CSSProperties = { display: 'grid', gap: '2rem' };
const inputGroup: React.CSSProperties = { display: 'grid', gap: '10px' };
const labelStyle: React.CSSProperties = { fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '16px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none', boxSizing: 'border-box', fontSize: '1rem' };
const textArea: React.CSSProperties = { ...inputStyle, height: '350px', resize: 'none' };
const categoryList: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '8px' };
const catBtn: React.CSSProperties = { padding: '10px 14px', borderRadius: '10px', border: '1px solid', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center' };
const submitBtn: React.CSSProperties = { padding: '16px', borderRadius: '16px', background: 'white', color: 'black', border: 'none', fontWeight: 900, fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const rewardInfo: React.CSSProperties = { padding: '1.25rem', borderRadius: '16px', background: 'rgba(251, 191, 36, 0.05)', border: '1px solid rgba(251, 191, 36, 0.1)' };
const adminWarn: React.CSSProperties = { fontSize: '0.8rem', color: '#ef4444', display: 'flex', alignItems: 'center', fontWeight: 600 };

const imagePreviewWrap: React.CSSProperties = { position: 'relative', width: '100px', height: '100px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' };
const imagePreview: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'cover' };
const removeImgBtn: React.CSSProperties = { position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' };

