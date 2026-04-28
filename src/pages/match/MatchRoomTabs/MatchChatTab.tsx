import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { Send, User, Shield, Info, Zap } from 'lucide-react';
import { UserProfileModal } from '../../../components/UserProfileModal';
import { calcAge } from '../../../utils/dashboardHelpers';

interface MatchChatTabProps {
    match: any;
    currentUser: any;
    userProfile: any;
    participantStatus: string | null;
    onJoinUpdate: () => void;
}

export const MatchChatTab: React.FC<MatchChatTabProps> = ({ match, currentUser, userProfile, participantStatus, onJoinUpdate }) => {
    const matchId = match.id;
    const templateId = match.template_id;
    const isFull = match.current_players >= match.max_players;
    const [waitlistStatus, setWaitlistStatus] = useState<string | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadMessages();
        checkWaitlistStatus();
        const subscription = subscribeToMessages();
        return () => {
            subscription.unsubscribe();
        };
    }, [matchId, templateId]);

    async function checkWaitlistStatus() {
        if (!currentUser) return;
        const { data } = await supabase.from('match_waitlist')
            .select('status')
            .eq('match_id', matchId)
            .eq('user_id', currentUser.id)
            .single();
        if (data) setWaitlistStatus(data.status);
    }

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    async function loadMessages() {
        let query = supabase
            .from('match_messages')
            .select('*, profiles:profiles!match_messages_user_id_fkey(name, photo_url)');
            
        if (templateId) {
            query = query.eq('template_id', templateId);
        } else {
            query = query.eq('match_id', matchId);
        }

        const { data } = await query.order('created_at', { ascending: true });
        setMessages(data || []);
    }

    function subscribeToMessages() {
        const filter = templateId ? `template_id=eq.${templateId}` : `match_id=eq.${matchId}`;
        const channelId = templateId ? `template:${templateId}` : `match:${matchId}`;

        return supabase
            .channel(channelId)
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'match_messages', 
                filter: filter 
            }, (payload) => {
                loadMessages();
            })
            .subscribe();
    }

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    };

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newMessage.trim() || !currentUser || participantStatus !== 'joined') return;

        const { error } = await supabase.from('match_messages').insert({
            match_id: matchId,
            template_id: templateId || null,
            user_id: currentUser.id,
            message: newMessage.trim(),
            message_type: 'user'
        });

        if (error) alert('메시지 전송 실패: ' + error.message);
        else setNewMessage('');
    };

    const handleJoin = async () => {
        if (!currentUser) return alert('로그인이 필요합니다.');
        if (!userProfile?.birthday) return alert('프로필에서 생년월일을 먼저 설정해주세요.');

        const age = calcAge(userProfile.birthday);
        const isHost = match.host_id === currentUser.id;

        // Strict Age Range & Separation Logic
        if (age < 19) {
            // Youth: Only 'youth' matches
            if (match.age_group !== 'youth') {
                return alert('유소년 회원은 유소년 전용 매치에만 참여할 수 있습니다.');
            }
        } else if (age >= 20 && age < 30) {
            // 20s
            if (match.age_group !== '20s' && match.age_group !== 'all') {
                const msg = match.age_group === 'youth' ? '이 매치는 유소년 전용입니다.' : `이 매치는 ${match.age_group} 전용입니다. 20대 회원님은 참여하실 수 없습니다.`;
                if (!isHost) return alert(msg);
            }
        } else if (age >= 30 && age < 40) {
            // 30s
            if (match.age_group !== '30s' && match.age_group !== 'all') {
                const msg = match.age_group === 'youth' ? '이 매치는 유소년 전용입니다.' : `이 매치는 ${match.age_group} 전용입니다. 30대 회원님은 참여하실 수 없습니다.`;
                if (!isHost) return alert(msg);
            }
        } else if (age >= 40) {
            // 40s+
            if (match.age_group !== '40s' && match.age_group !== 'all') {
                const msg = match.age_group === 'youth' ? '이 매치는 유소년 전용입니다.' : `이 매치는 ${match.age_group} 전용입니다. 40대 이상 회원님만 참여하실 수 있습니다.`;
                if (!isHost) return alert(msg);
            }
        }

        setLoading(true);
        if (isFull) {
            // Join Waitlist
            const { error } = await supabase.from('match_waitlist').insert({
                match_id: matchId,
                user_id: currentUser.id
            });
            if (error) alert("대기 명단 등록 실패: " + error.message);
            else {
                alert("대기 명단에 등록되었습니다. 자리가 나면 자동으로 참여됩니다.");
                checkWaitlistStatus();
            }
        } else {
            // Join Match
            const { data, error } = await supabase.rpc('join_match_room', { p_match_id: matchId });
            if (error) alert(error.message);
            else onJoinUpdate();
        }
        setLoading(false);
    };

    return (
        <div style={container}>
            {/* Messages Area */}
            <div ref={scrollRef} style={messagesArea}>
                {messages.map((msg) => {
                    const isSystem = msg.message_type === 'system';
                    const isMe = msg.user_id === currentUser?.id;

                    if (isSystem) {
                        return (
                            <div key={msg.id} style={systemMsgWrap}>
                                <div style={systemMsg}>{msg.message}</div>
                            </div>
                        );
                    }

                    return (
                        <div key={msg.id} style={isMe ? myMsgRow : otherMsgRow}>
                            {!isMe && (
                                <div style={avatarWrap} onClick={() => setSelectedUserId(msg.user_id)}>
                                    {msg.profiles?.photo_url ? (
                                        <img src={msg.profiles.photo_url} style={avatar} />
                                    ) : (
                                        <div style={avatarFallback}><User size={14}/></div>
                                    )}
                                </div>
                            )}
                            <div style={msgContentWrap}>
                                {!isMe && <div style={userName} onClick={() => setSelectedUserId(msg.user_id)}>{msg.profiles?.name}</div>}
                                <div style={isMe ? myBubble : otherBubble}>
                                    {msg.message}
                                </div>
                                <div style={msgTime}>
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Bottom Actions */}
            <div style={bottomBar}>
                {participantStatus === 'joined' ? (
                    <form onSubmit={handleSend} style={inputWrap}>
                        <input 
                            placeholder="메시지를 입력하세요..." 
                            value={newMessage}
                            onChange={e => setNewMessage(e.target.value)}
                            style={input}
                        />
                        <button type="submit" style={sendBtn} disabled={!newMessage.trim()}>
                            <Send size={18} fill={newMessage.trim() ? "white" : "transparent"} />
                        </button>
                    </form>
                ) : waitlistStatus === 'waiting' ? (
                    <div style={joinPrompt}>
                        <div style={joinInfo}>
                            <Info size={14} />
                            <span>현재 대기 명단에 등록되어 있습니다.</span>
                        </div>
                        <button disabled style={btnWaiting}>
                            <span>대기 중...</span>
                        </button>
                    </div>
                ) : (
                    <div style={joinPrompt}>
                        <div style={joinInfo}>
                            <Info size={14} />
                            <span>대화에 참여하려면 모임에 참가 신청을 해주세요.</span>
                        </div>
                        <button onClick={handleJoin} disabled={loading} style={isFull ? joinBtnFull : joinBtn}>
                            <Zap size={18} fill="white" />
                            <span>{loading ? '처리 중...' : (isFull ? '대기 명단 등록하기' : '매치 참여하기')}</span>
                        </button>
                    </div>
                )}
            </div>
            
            {selectedUserId && (
                <UserProfileModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
            )}
        </div>
    );
};

// Styles
const container: React.CSSProperties = { display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' };
const messagesArea: React.CSSProperties = { flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' };

const systemMsgWrap: React.CSSProperties = { display: 'flex', justifyContent: 'center', margin: '8px 0' };
const systemMsg: React.CSSProperties = { padding: '6px 16px', borderRadius: '100px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', fontWeight: 700 };

const myMsgRow: React.CSSProperties = { display: 'flex', flexDirection: 'row-reverse', gap: '10px', alignItems: 'flex-end', marginLeft: '40px' };
const otherMsgRow: React.CSSProperties = { display: 'flex', gap: '10px', alignItems: 'flex-start', marginRight: '40px' };

const avatarWrap: React.CSSProperties = { flexShrink: 0, marginTop: '4px' };
const avatar: React.CSSProperties = { width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' };
const avatarFallback: React.CSSProperties = { width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)' };

const msgContentWrap: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '4px' };
const userName: React.CSSProperties = { fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', marginLeft: '4px' };
const otherBubble: React.CSSProperties = { padding: '12px 16px', borderRadius: '4px 16px 16px 16px', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '0.9rem', lineHeight: 1.5, wordBreak: 'break-all' };
const myBubble: React.CSSProperties = { ...otherBubble, borderRadius: '16px 16px 4px 16px', background: 'var(--accent-primary)', color: 'white', fontWeight: 600 };
const msgTime: React.CSSProperties = { fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)', fontWeight: 700, margin: '0 4px' };

const bottomBar: React.CSSProperties = { padding: '16px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))', background: '#121214', borderTop: '1px solid rgba(255,255,255,0.05)' };
const inputWrap: React.CSSProperties = { display: 'flex', gap: '10px', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '6px 6px 6px 16px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' };
const input: React.CSSProperties = { flex: 1, background: 'transparent', border: 'none', color: 'white', fontSize: '0.95rem', height: '36px' };
const sendBtn: React.CSSProperties = { width: '36px', height: '36px', borderRadius: '50%', background: 'transparent', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' };

const joinPrompt: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' };
const joinInfo: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 };
const joinBtn: React.CSSProperties = { width: '100%', height: '52px', borderRadius: '16px', background: 'var(--accent-primary)', color: 'white', border: 'none', fontWeight: 900, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 10px 20px rgba(249, 115, 22, 0.3)' };
const joinBtnFull: React.CSSProperties = { ...joinBtn, background: '#10b981', boxShadow: '0 10px 20px rgba(16, 185, 129, 0.3)' };
const btnWaiting: React.CSSProperties = { ...joinBtn, background: 'rgba(255,255,255,0.1)', boxShadow: 'none', cursor: 'not-allowed', color: 'rgba(255,255,255,0.4)' };
