import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { 
    Calendar, Clock, MapPin, Users, Award, 
    DollarSign, Package, Megaphone, Info, Zap,
    ChevronRight, Heart, MessageSquare, Send
} from 'lucide-react';
import { UserProfileModal } from '../../../components/UserProfileModal';
import { useTranslation } from '../../../lib/i18n';

interface MatchInfoTabProps {
    match: any;
}

export const MatchInfoTab: React.FC<MatchInfoTabProps> = ({ match }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const isRecurring = match.is_recurring;
    const startAt = new Date(match.start_at);
    const endAt = new Date(match.end_at);
    
    const [futureRooms, setFutureRooms] = useState<any[]>([]);
    const [likes, setLikes] = useState(match.likes_count || 0);
    const [hasLiked, setHasLiked] = useState(false);
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    useEffect(() => {
        if (isRecurring && match.template_id) {
            loadFutureRooms();
        }
        checkLikeStatus();
        loadComments();
    }, [match.id, match.template_id]);

    async function checkLikeStatus() {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const { data } = await supabase.from('match_likes').select('id').eq('match_id', match.id).eq('user_id', session.user.id).maybeSingle();
        setHasLiked(!!data);
    }

    async function loadComments() {
        const targetId = match.template_id || match.id;
        const { data } = await supabase
            .from('match_comments')
            .select('*, profiles(name, photo_url)')
            .eq(match.template_id ? 'match_id' : 'match_id', match.id) // Simplified to room for now, can be template
            .order('created_at', { ascending: true });
        setComments(data || []);
    }

    const handleLike = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return alert("로그인이 필요합니다.");

        if (hasLiked) {
            await supabase.from('match_likes').delete().eq('match_id', match.id).eq('user_id', session.user.id);
            setLikes((prev: number) => prev - 1);
            setHasLiked(false);
        } else {
            await supabase.from('match_likes').insert({ match_id: match.id, user_id: session.user.id });
            setLikes((prev: number) => prev + 1);
            setHasLiked(true);
        }
    };

    const postComment = async () => {
        if (!newComment.trim()) return;
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return alert("로그인이 필요합니다.");

        setLoading(true);
        const { error } = await supabase.from('match_comments').insert({
            match_id: match.id,
            user_id: session.user.id,
            content: newComment.trim()
        });

        if (error) alert(error.message);
        else {
            setNewComment("");
            loadComments();
        }
        setLoading(false);
    };

    async function loadFutureRooms() {
        const { data } = await supabase
            .from('match_rooms')
            .select('id, start_at, occurrence_date')
            .eq('template_id', match.template_id)
            .eq('status', 'open')
            .neq('id', match.id) // Current room exclude
            .gt('start_at', new Date().toISOString())
            .order('start_at', { ascending: true })
            .limit(5);
        setFutureRooms(data || []);
    }

    const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    const dateStr = `${startAt.getFullYear()}년 ${startAt.getMonth() + 1}월 ${startAt.getDate()}일 (${dayNames[startAt.getDay()]})`;
    
    // Viewer's local time
    const viewerTime = `${startAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} ~ ${endAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`;
    
    // Match's local time (where the court is)
    const matchTimezone = match.timezone || 'Asia/Seoul';
    const matchLocalTime = startAt.toLocaleTimeString('ko-KR', { timeZone: matchTimezone, hour: '2-digit', minute: '2-digit', hour12: false });
    const matchLocalEnd = endAt.toLocaleTimeString('ko-KR', { timeZone: matchTimezone, hour: '2-digit', minute: '2-digit', hour12: false });
    const matchLocalDate = startAt.toLocaleDateString('ko-KR', { timeZone: matchTimezone, month: 'long', day: 'numeric', weekday: 'short' });

    const isDifferentTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone !== matchTimezone;

    return (
        <div style={container}>
            {/* Host Announcement */}
            {match.notice && (
                <div style={noticeBox}>
                    <div style={noticeHeader}>
                        <Megaphone size={16} />
                        <span>공지사항</span>
                    </div>
                    <div style={noticeContent}>
                        {match.notice}
                    </div>
                </div>
            )}

            {/* Core Info Grid */}
            <div style={infoGrid}>
                <InfoItem 
                    icon={Calendar} 
                    label="날짜" 
                    value={isDifferentTimezone ? matchLocalDate : dateStr} 
                    subValue={isDifferentTimezone ? `(내 시간: ${dateStr})` : null}
                />
                <InfoItem 
                    icon={Clock} 
                    label="시간" 
                    value={`${matchLocalTime} ~ ${matchLocalEnd}`} 
                    subValue={isDifferentTimezone ? `(내 시간: ${viewerTime})` : null}
                />
                <div style={fullRow}>
                    <InfoItem icon={MapPin} label="장소" value={match.place_name} subValue={`${match.address} (${matchTimezone})`} />
                </div>
                <InfoItem icon={Award} label="참여 조건" value={match.required_grade === 'all' ? '전체 등급 가능' : `${match.required_grade} 이상 전용`} />
                <InfoItem 
                    icon={Users} 
                    label="연령대" 
                    value={
                        match.age_group === 'youth' ? '유소년 전용 (만 19세 미만)' :
                        match.age_group === '20s' ? '20대 전용 (20~29세)' :
                        match.age_group === '30s' ? '30대 전용 (30~39세)' :
                        match.age_group === '40s' ? '40대 이상 전용' : '연령 무관'
                    } 
                />
                <InfoItem icon={Users} label="모집 인원" value={`최대 ${match.max_players}명`} />
                <InfoItem icon={DollarSign} label="참가비" value={match.fee_amount > 0 ? `${match.fee_amount.toLocaleString()}원` : '무료'} />
                <InfoItem icon={Package} label="준비물" value={match.supplies || '농구화, 유니폼'} />
            </div>

            {/* Description Section */}
            <div style={section}>
                <h3 style={sectionTitle}>모입 상세 설명</h3>
                <div style={description}>
                    {match.description || '상세 설명이 없습니다.'}
                </div>
            </div>

            {/* Social Actions */}
            <div style={socialActions}>
                <button onClick={handleLike} style={hasLiked ? likeBtnActive : likeBtn}>
                    <Heart size={20} fill={hasLiked ? "currentColor" : "none"} style={{ transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', transform: hasLiked ? 'scale(1.2)' : 'scale(1)' }} />
                    <span>좋아요 {likes}</span>
                </button>
                <div style={socialStat}>
                    <MessageSquare size={20} />
                    <span>댓글 {comments.length}</span>
                </div>
            </div>

            {/* Comments Section */}
            <div style={section}>
                <h3 style={sectionTitle}>댓글 {comments.length}개</h3>
                
                <div style={commentList}>
                    {comments.map(c => (
                        <div key={c.id} style={commentItem}>
                            <img 
                                src={c.profiles?.photo_url || "https://images.unsplash.com/photo-1546514355-7fdc90ccbd03?q=80&w=100&auto=format&fit=crop"} 
                                style={{...commentAvatar, cursor: 'pointer'}} 
                                alt="" 
                                onClick={() => setSelectedUserId(c.user_id)}
                            />
                            <div style={commentContent}>
                                <div style={commentHeader}>
                                    <span style={{...commentAuthor, cursor: 'pointer'}} onClick={() => setSelectedUserId(c.user_id)}>
                                        {c.profiles?.name || "익명"}
                                    </span>
                                    <span style={commentDate}>{new Date(c.created_at).toLocaleDateString()}</span>
                                </div>
                                <div style={commentText}>{c.content}</div>
                            </div>
                        </div>
                    ))}
                    {comments.length === 0 && (
                        <div style={emptyComments}>첫 번째 댓글을 남겨보세요!</div>
                    )}
                </div>

                <div style={commentInputWrap}>
                    <input 
                        placeholder="매크로 방지를 위해 정성스런 댓글을 부탁드려요..." 
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && postComment()}
                        style={commentInput}
                    />
                    <button onClick={postComment} disabled={loading} style={sendBtn}>
                        <Send size={18} />
                    </button>
                </div>
            </div>

            {/* Recurring Info & Future Schedules */}
            {isRecurring && (
                <div style={section}>
                    <div style={recurringHeader}>
                        <Zap size={16} fill="#a78bfa" color="#a78bfa" />
                        <h3 style={{ ...sectionTitle, marginBottom: 0 }}>정기 모임 일정 안내</h3>
                    </div>
                    <p style={recurringDesc}>이 모임은 매주 정기적으로 진행됩니다. 다른 회차 일정도 확인해 보세요.</p>
                    
                    {futureRooms.length > 0 ? (
                        <div style={scheduleList}>
                            {futureRooms.map(room => (
                                <button 
                                    key={room.id} 
                                    onClick={() => navigate(`/match/room/${room.id}`)}
                                    style={scheduleItem}
                                >
                                    <div style={scheduleDate}>
                                        <Calendar size={14} />
                                        <span>{new Date(room.start_at).toLocaleDateString()}</span>
                                    </div>
                                    <ChevronRight size={14} opacity={0.3} />
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div style={emptySchedules}>예정된 다음 일정이 아직 없습니다.</div>
                    )}
                </div>
            )}
            
            {selectedUserId && (
                <UserProfileModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
            )}
        </div>
    );
};

const InfoItem = ({ icon: Icon, label, value, subValue }: any) => (
    <div style={infoItemWrap}>
        <div style={iconBox}><Icon size={18} /></div>
        <div style={textWrap}>
            <div style={itemLabel}>{label}</div>
            <div style={itemValue}>{value}</div>
            {subValue && <div style={itemSubValue}>{subValue}</div>}
        </div>
    </div>
);

// Styles
const container: React.CSSProperties = { padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' };

const noticeBox: React.CSSProperties = { padding: '24px', borderRadius: '24px', background: 'rgba(249, 115, 22, 0.05)', border: '1px solid rgba(249, 115, 22, 0.2)', display: 'flex', flexDirection: 'column', gap: '12px' };
const noticeHeader: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)', fontSize: '0.85rem', fontWeight: 900 };
const noticeContent: React.CSSProperties = { fontSize: '1rem', fontWeight: 700, lineHeight: 1.6, color: 'white', whiteSpace: 'pre-wrap' };

const infoGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' };
const fullRow: React.CSSProperties = { gridColumn: '1 / -1' };

const infoItemWrap: React.CSSProperties = { display: 'flex', gap: '16px', alignItems: 'flex-start' };
const iconBox: React.CSSProperties = { width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)', flexShrink: 0 };
const textWrap: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '2px' };
const itemLabel: React.CSSProperties = { fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' };
const itemValue: React.CSSProperties = { fontSize: '1rem', fontWeight: 800, color: 'white' };
const itemSubValue: React.CSSProperties = { fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', marginTop: '4px' };

const section: React.CSSProperties = { borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '32px' };
const sectionTitle: React.CSSProperties = { fontSize: '1.1rem', fontWeight: 900, marginBottom: '16px' };
const description: React.CSSProperties = { fontSize: '0.95rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.7)', whiteSpace: 'pre-wrap', background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '16px' };

const recurringHeader: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' };
const recurringDesc: React.CSSProperties = { fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', marginBottom: '16px' };
const scheduleList: React.CSSProperties = { display: 'grid', gap: '8px' };
const scheduleItem: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', color: 'white', cursor: 'pointer', textAlign: 'left' };
const scheduleDate: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 700 };
const emptySchedules: React.CSSProperties = { padding: '16px', textAlign: 'center', fontSize: '0.85rem', color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' };

const socialActions: React.CSSProperties = { display: 'flex', gap: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '32px' };
const likeBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700, transition: '0.2s' };
const likeBtnActive: React.CSSProperties = { ...likeBtn, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' };
const socialStat: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem', fontWeight: 700 };

const commentList: React.CSSProperties = { display: 'grid', gap: '20px', marginBottom: '24px' };
const commentItem: React.CSSProperties = { display: 'flex', gap: '12px' };
const commentAvatar: React.CSSProperties = { width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' };
const commentContent: React.CSSProperties = { flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' };
const commentHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const commentAuthor: React.CSSProperties = { fontSize: '0.85rem', fontWeight: 900, color: 'white' };
const commentDate: React.CSSProperties = { fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' };
const commentText: React.CSSProperties = { fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 };
const emptyComments: React.CSSProperties = { padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.9rem', fontStyle: 'italic' };

const commentInputWrap: React.CSSProperties = { display: 'flex', gap: '10px', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' };
const commentInput: React.CSSProperties = { flex: 1, background: 'transparent', border: 'none', color: 'white', padding: '12px 16px', fontSize: '0.9rem', outline: 'none' };
const sendBtn: React.CSSProperties = { width: '44px', height: '44px', borderRadius: '12px', background: 'var(--accent-primary)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
