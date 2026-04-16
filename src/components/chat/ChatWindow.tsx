import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { chatService, ChatMessage } from '../../lib/chatService';
import { Send, User, ChevronLeft, Loader2, LogOut } from 'lucide-react';

interface ChatWindowProps {
    roomId: string;
    currentUserId: string;
    recipientName: string;
    recipientPhoto?: string;
    onBack?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ 
    roomId, currentUserId, recipientName, recipientPhoto, onBack 
}) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadMessages();
        
        // Subscribe to real-time updates
        const channel = chatService.subscribeToMessages(roomId, (msg) => {
            setMessages(prev => {
                // Avoid duplicates
                if (prev.some(m => m.id === msg.id)) return prev;
                return [...prev, msg];
            });
        });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [roomId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    async function loadMessages() {
        setLoading(true);
        try {
            const msgs = await chatService.getMessages(roomId);
            setMessages(msgs);
        } catch (error) {
            console.error('Failed to load messages:', error);
        } finally {
            setLoading(false);
        }
    }

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    };

    async function handleSend(e?: React.FormEvent) {
        e?.preventDefault();
        if (!newMessage.trim() || sending) return;

        setSending(true);
        try {
            await chatService.sendMessage(roomId, currentUserId, newMessage.trim());
            setNewMessage('');
        } catch (error) {
            console.error('Failed to send message:', error);
            alert('메시지 전송에 실패했습니다.');
        } finally {
            setSending(false);
        }
    }

    async function handleLeaveRoom() {
        if (!window.confirm("🚨 정말 채팅방을 나가시겠습니까?\n\n나가시면 채팅 대화 목록에서 영구히 삭제되며, 이전 단락 메시지들의 자체 복구가 어렵습니다.\n\n(단, 상대방이 다시 내게 새로운 메시지를 전송할 경우 방이 다시 활성화됩니다.)")) {
            return;
        }

        setLoading(true);
        try {
            await chatService.leaveRoom(roomId, currentUserId);
            // After successfully leaving, call onBack to hide window, or just refresh to re-render ChatList
            if (onBack) {
                onBack();
                window.location.reload(); 
            } else {
                window.location.reload();
            }
        } catch (error) {
            console.error('Failed to leave room:', error);
            alert('채팅방 나가기에 실패했습니다.');
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div style={container}>
                <div style={loaderWrap}><Loader2 className="animate-spin" /></div>
            </div>
        );
    }

    return (
        <div style={container}>
            {/* Header */}
            <div style={header}>
                {onBack && (
                    <button onClick={onBack} style={iconBtn}>
                        <ChevronLeft size={20} />
                    </button>
                )}
                <div style={avatar}>
                    {recipientPhoto ? (
                        <img src={recipientPhoto} alt={recipientName} style={avatarImg} />
                    ) : (
                        <User size={16} />
                    )}
                </div>
                <div style={headerInfo}>
                    <div style={name}>{recipientName}</div>
                    <div style={status}>실시간 대화 중</div>
                </div>
                <button onClick={handleLeaveRoom} style={leaveBtn} title="채팅방 나가기">
                    <LogOut size={18} />
                </button>
            </div>

            {/* Messages Area */}
            <div style={messageArea} ref={scrollRef}>
                {messages.length === 0 ? (
                    <div style={empty}>대화를 시작해 보세요.</div>
                ) : (
                    messages.map((msg) => (
                        <div 
                            key={msg.id} 
                            style={{
                                ...msgRow,
                                justifyContent: msg.sender_id === currentUserId ? 'flex-end' : 'flex-start'
                            }}
                        >
                            <div style={{
                                ...bubble,
                                background: msg.sender_id === currentUserId ? 'var(--color-primary)' : 'rgba(255,255,255,0.08)',
                                color: msg.sender_id === currentUserId ? 'white' : 'white',
                                borderTopRightRadius: msg.sender_id === currentUserId ? '4px' : '16px',
                                borderTopLeftRadius: msg.sender_id === currentUserId ? '16px' : '4px',
                            }}>
                                {msg.content}
                                <div style={time}>
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} style={inputGroup}>
                <input 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="메시지를 입력하세요..."
                    style={input}
                    disabled={sending}
                />
                <button type="submit" style={sendBtn} disabled={!newMessage.trim() || sending}>
                    {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
            </form>
        </div>
    );
};

// Styles
const container: React.CSSProperties = { display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-card)', borderRadius: '24px', border: '1px solid var(--border-subtle)', overflow: 'hidden' };
const header: React.CSSProperties = { padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.02)' };
const iconBtn: React.CSSProperties = { background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' };
const avatar: React.CSSProperties = { width: '36px', height: '36px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' };
const avatarImg: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'cover' };
const headerInfo: React.CSSProperties = { flex: 1 };
const name: React.CSSProperties = { fontWeight: 800, fontSize: '0.95rem' };
const status: React.CSSProperties = { fontSize: '0.7rem', color: '#4ade80', fontWeight: 600 };
const messageArea: React.CSSProperties = { flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' };
const msgRow: React.CSSProperties = { display: 'flex', width: '100%' };
const bubble: React.CSSProperties = { padding: '10px 14px', borderRadius: '16px', maxWidth: '75%', fontSize: '0.9rem', lineHeight: '1.5', position: 'relative' };
const time: React.CSSProperties = { fontSize: '0.65rem', opacity: 0.5, marginTop: '4px', textAlign: 'right' };
const inputGroup: React.CSSProperties = { padding: '16px 20px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '10px' };
const input: React.CSSProperties = { flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '10px 16px', color: 'white', outline: 'none', fontSize: '0.9rem' };
const sendBtn: React.CSSProperties = { width: '40px', height: '40px', borderRadius: '12px', background: 'var(--color-primary)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const empty: React.CSSProperties = { textAlign: 'center', marginTop: '40px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.3)' };
const loaderWrap: React.CSSProperties = { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' };
const leaveBtn: React.CSSProperties = { background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center', borderRadius: '8px', transition: 'background 0.2s' };
