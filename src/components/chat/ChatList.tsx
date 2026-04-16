import React, { useState, useEffect } from 'react';
import { chatService } from '../../lib/chatService';
import { User, MessageSquare, Loader2 } from 'lucide-react';

interface ChatListProps {
    currentUserId: string;
    isCoachMode?: boolean;
    onSelectRoom: (roomId: string, recipientName: string, recipientPhoto?: string) => void;
}

type FilterTab = "all" | "student" | "coach";

export const ChatList: React.FC<ChatListProps> = ({ currentUserId, isCoachMode, onSelectRoom }) => {
    const [rooms, setRooms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterTab>("all");

    useEffect(() => {
        loadRooms();
    }, [currentUserId]);

    async function loadRooms() {
        setLoading(true);
        try {
            const data = await chatService.getUserRooms(currentUserId);
            setRooms(data || []);
        } catch (error) {
            console.error('Failed to load chat rooms:', error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return <div style={loaderWrap}><Loader2 className="animate-spin" /></div>;
    }

    if (rooms.length === 0) {
        return (
            <div style={emptyState}>
                <MessageSquare size={48} style={{ opacity: 0.1, marginBottom: 16 }} />
                <p>아직 대화 내역이 없습니다.</p>
                <p style={{ fontSize: '0.8rem', opacity: 0.5, marginTop: 4 }}>코치 프로필에서 메시지를 보내보세요.</p>
            </div>
        );
    }

    const filteredRooms = rooms.filter(room => {
        if (filter === "all") return true;
        if (filter === "coach") return room.is_counterpart_coach === true;
        if (filter === "student") return room.is_counterpart_coach === false;
        return true;
    });

    return (
        <div style={listContainer}>
            {isCoachMode && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', padding: '0 8px' }}>
                    <button onClick={() => setFilter("all")} style={filter === "all" ? tabActive : tabInactive}>전체</button>
                    <button onClick={() => setFilter("student")} style={filter === "student" ? tabActive : tabInactive}>학생</button>
                    <button onClick={() => setFilter("coach")} style={filter === "coach" ? tabActive : tabInactive}>코치</button>
                </div>
            )}
            
            {filteredRooms.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', opacity: 0.5, fontSize: '0.9rem' }}>
                    해당하는 대화 내역이 없습니다.
                </div>
            ) : (
                filteredRooms.map((room) => {
                const isStudent = room.student_id === currentUserId;
                const recipient = isStudent ? room.coach : room.student;
                const recipientName = recipient?.name || '익명 사용자';
                const recipientPhoto = recipient?.photo_url;

                return (
                    <div 
                        key={room.id} 
                        onClick={() => onSelectRoom(room.id, recipientName, recipientPhoto)}
                        style={roomItem}
                        className="hover-card"
                    >
                        <div style={avatar}>
                            {recipientPhoto ? (
                                <img src={recipientPhoto} alt={recipientName} style={avatarImg} />
                            ) : (
                                <User size={20} />
                            )}
                        </div>
                        <div style={content}>
                            <div style={topRow}>
                                <span style={name}>{recipientName}</span>
                                <span style={time}>
                                    {room.last_message_at ? new Date(room.last_message_at).toLocaleDateString() : ''}
                                </span>
                            </div>
                            <div style={lastMsg}>
                                {room.last_message || '대화를 시작해 보세요.'}
                            </div>
                        </div>
                    </div>
                );
            })}
            )}
        </div>
    );
};

// Styles
const tabActive: React.CSSProperties = { flex: 1, padding: '10px', borderRadius: '10px', background: 'var(--color-primary)', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: '0.8rem' };
const tabInactive: React.CSSProperties = { flex: 1, padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' };

const listContainer: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '8px' };
const roomItem: React.CSSProperties = { display: 'flex', gap: '14px', padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'all 0.2s' };
const avatar: React.CSSProperties = { width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 };
const avatarImg: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'cover' };
const content: React.CSSProperties = { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' };
const topRow: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' };
const name: React.CSSProperties = { fontWeight: 800, fontSize: '0.95rem' };
const time: React.CSSProperties = { fontSize: '0.7rem', opacity: 0.4 };
const lastMsg: React.CSSProperties = { fontSize: '0.85rem', opacity: 0.6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
const emptyState: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.4)', textAlign: 'center' };
const loaderWrap: React.CSSProperties = { display: 'flex', justifyContent: 'center', padding: '40px' };
