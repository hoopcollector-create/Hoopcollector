import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ChatList } from '../components/chat/ChatList';
import { ChatWindow } from '../components/chat/ChatWindow';
import { useNavigate, useLocation } from 'react-router-dom';

export const Messages = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [userId, setUserId] = useState<string>("");
    const [isCoachMode, setIsCoachMode] = useState<boolean>(false);
    const [selectedRoom, setSelectedRoom] = useState<{id: string, name: string, photo?: string} | null>(null);

    useEffect(() => {
        setup();
    }, []);

    async function setup() {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            navigate('/login');
            return;
        }
        setUserId(session.user.id);
        
        // check if user is admin or coach
        const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id);
        if (roles && roles.some(r => r.role === 'coach')) {
            setIsCoachMode(true);
        }

        // if location state has openChat, open it
        if (location.state?.openChat && location.state?.roomId) {
            setSelectedRoom({
                id: location.state.roomId,
                name: location.state.recipientName,
                photo: location.state.recipientPhoto
            });
            window.history.replaceState({}, document.title);
        }
    }

    if (!userId) return <div style={{ padding: 40, color: 'white', opacity: 0.5, textAlign: 'center' }}>로딩 중...</div>;

    const pageWrap: React.CSSProperties = {
        color: 'white',
        paddingBottom: '100px',
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: window.innerWidth <= 768 ? '0 16px' : '0'
    };

    return (
        <div style={pageWrap}>
            <div style={{ marginBottom: '2.5rem' }}>
                <h1 style={{ fontSize: window.innerWidth <= 768 ? '1.5rem' : '2rem', fontWeight: 900, marginBottom: '0.4rem', letterSpacing: '-0.02em', color: 'var(--color-primary)' }}>MESSAGES</h1>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>학생들과 코치들의 메시지를 확인하세요.</p>
            </div>

            <div style={{ height: 'calc(100vh - 200px)', display: 'grid', gridTemplateColumns: selectedRoom ? (window.innerWidth <= 768 ? '1fr' : '350px 1fr') : '1fr', gap: '2rem' }}>
                {(!selectedRoom || window.innerWidth > 768) && (
                    <div style={{ overflowY: 'auto' }}>
                        <ChatList 
                            currentUserId={userId} 
                            isCoachMode={isCoachMode}
                            onSelectRoom={(id, name, photo) => setSelectedRoom({ id, name, photo })} 
                        />
                    </div>
                )}
                {selectedRoom && (
                    <div style={{ height: '100%', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <ChatWindow 
                            roomId={selectedRoom.id}
                            currentUserId={userId}
                            recipientName={selectedRoom.name}
                            recipientPhoto={selectedRoom.photo}
                            onBack={window.innerWidth <= 768 ? () => setSelectedRoom(null) : undefined}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
