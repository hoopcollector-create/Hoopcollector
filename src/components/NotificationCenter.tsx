import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Bell, MessageSquare, Calendar, Award, Info, X, Check } from 'lucide-react';

interface Notification {
    id: string;
    type: 'chat' | 'class' | 'match' | 'system';
    title: string;
    content: string;
    link?: string;
    is_read: boolean;
    created_at: string;
}

export const NotificationCenter: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        fetchNotifications();

        // Real-time subscription
        const channel = supabase
            .channel('public:notifications')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, payload => {
                const newNotif = payload.new as Notification;
                setNotifications(prev => [newNotif, ...prev]);
                setUnreadCount(prev => prev + 1);
                
                // Show browser notification if possible
                if (Notification.permission === 'granted') {
                    new Notification(newNotif.title, { body: newNotif.content });
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchNotifications = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20);

        if (data) {
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.is_read).length);
        }
    };

    const markAsRead = async (id: string) => {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id);

        if (!error) {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'chat': return <MessageSquare size={18} color="#FF6B00" />;
            case 'class': return <Calendar size={18} color="#00C2FF" />;
            case 'match': return <Award size={18} color="#FFD700" />;
            default: return <Info size={18} color="#AAAAAA" />;
        }
    };

    return (
        <div style={container}>
            <button onClick={() => setIsOpen(!isOpen)} style={bellButton}>
                <Bell size={24} color="var(--text-primary)" />
                {unreadCount > 0 && <span style={badge}>{unreadCount}</span>}
            </button>

            {isOpen && (
                <div style={dropdown}>
                    <div style={notifHeader}>
                        <h4 style={{ margin: 0 }}>알림 센터</h4>
                        <button onClick={() => setIsOpen(false)} style={closeBtn}><X size={18} /></button>
                    </div>

                    <div style={notifList}>
                        {notifications.length === 0 ? (
                            <div style={emptyState}>새로운 알림이 없습니다.</div>
                        ) : (
                            notifications.map(notif => (
                                <div 
                                    key={notif.id} 
                                    style={{ ...notifItem, opacity: notif.is_read ? 0.6 : 1 }}
                                    onClick={() => markAsRead(notif.id)}
                                >
                                    <div style={notifIcon}>{getIcon(notif.type)}</div>
                                    <div style={notifContent}>
                                        <div style={notifTitle}>{notif.title}</div>
                                        <div style={notifBody}>{notif.content}</div>
                                        <div style={notifTime}>{new Date(notif.created_at).toLocaleString()}</div>
                                    </div>
                                    {!notif.is_read && <div style={unreadDot} />}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const container: React.CSSProperties = { position: 'relative' };

const bellButton: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    position: 'relative',
    padding: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
};

const badge: React.CSSProperties = {
    position: 'absolute',
    top: '4px',
    right: '4px',
    backgroundColor: 'var(--accent-primary)',
    color: 'white',
    fontSize: '10px',
    fontWeight: 700,
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid var(--bg-surface-L1)'
};

const dropdown: React.CSSProperties = {
    position: 'absolute',
    top: '50px',
    right: '0',
    width: '320px',
    maxHeight: '480px',
    background: 'var(--bg-surface-L1)',
    borderRadius: '16px',
    border: '1px solid var(--border-subtle)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
};

const notifHeader: React.CSSProperties = {
    padding: '16px',
    borderBottom: '1px solid var(--border-subtle)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'var(--bg-surface-L2)'
};

const closeBtn: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer'
};

const notifList: React.CSSProperties = {
    overflowY: 'auto',
    flex: 1
};

const notifItem: React.CSSProperties = {
    padding: '16px',
    borderBottom: '1px solid var(--border-subtle)',
    display: 'flex',
    gap: '12px',
    cursor: 'pointer',
    transition: 'background 0.2s',
    position: 'relative'
};

const notifIcon: React.CSSProperties = {
    flexShrink: 0,
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: 'rgba(255,255,255,0.05)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
};

const notifTitle: React.CSSProperties = {
    fontWeight: 600,
    fontSize: '14px',
    color: 'var(--text-primary)',
    marginBottom: '2px'
};

const notifBody: React.CSSProperties = {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    lineHeight: 1.4
};

const notifTime: React.CSSProperties = {
    fontSize: '11px',
    color: 'var(--text-muted)',
    marginTop: '6px'
};

const unreadDot: React.CSSProperties = {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: 'var(--accent-primary)',
    position: 'absolute',
    right: '16px',
    top: '40%'
};

const emptyState: React.CSSProperties = {
    padding: '40px 20px',
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontSize: '14px'
};

const notifContent: React.CSSProperties = { flex: 1 };
