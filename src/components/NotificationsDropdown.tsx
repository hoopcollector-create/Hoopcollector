import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Bell, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const NotificationsDropdown = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        loadNotifications();
        const subscription = supabase.channel('notifications')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
                loadNotifications();
            })
            .subscribe();

        return () => { subscription.unsubscribe(); };
    }, []);

    async function loadNotifications() {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data } = await supabase.from('notifications')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false })
            .limit(20);

        if (data) {
            setNotifications(data);
            setUnreadCount(data.filter((n: any) => !n.is_read).length);
        }
    }

    async function markAsRead(id: string) {
        await supabase.from('notifications').update({ is_read: true }).eq('id', id);
        loadNotifications();
    }

    async function markAllAsRead() {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        await supabase.from('notifications').update({ is_read: true }).eq('user_id', session.user.id).eq('is_read', false);
        loadNotifications();
    }

    const handleClick = (n: any) => {
        markAsRead(n.id);
        setIsOpen(false);
        if (n.link) navigate(n.link);
    };

    return (
        <div style={container}>
            <button onClick={() => setIsOpen(!isOpen)} style={bellBtn}>
                <Bell size={20} color={unreadCount > 0 ? "white" : "rgba(255,255,255,0.4)"} />
                {unreadCount > 0 && <div style={badge}>{unreadCount > 9 ? '9+' : unreadCount}</div>}
            </button>

            {isOpen && (
                <>
                    <div style={overlay} onClick={() => setIsOpen(false)} />
                    <div style={dropdown}>
                        <div style={header}>
                            <h3 style={title}>알림</h3>
                            {unreadCount > 0 && (
                                <button onClick={markAllAsRead} style={readAllBtn}>
                                    <CheckCircle size={14} /> 모두 읽음
                                </button>
                            )}
                        </div>
                        <div style={list}>
                            {notifications.length === 0 ? (
                                <div style={emptyState}>새로운 알림이 없습니다.</div>
                            ) : (
                                notifications.map(n => (
                                    <div key={n.id} onClick={() => handleClick(n)} style={n.is_read ? itemRead : itemUnread}>
                                        <div style={itemContent}>
                                            <div style={n.is_read ? itemTitleRead : itemTitleUnread}>{n.title}</div>
                                            <div style={itemMessage}>{n.message}</div>
                                            <div style={itemDate}>{new Date(n.created_at).toLocaleString()}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

// Styles
const container: React.CSSProperties = { position: 'relative' };
const bellBtn: React.CSSProperties = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' };
const badge: React.CSSProperties = { position: 'absolute', top: '-4px', right: '-4px', background: '#ef4444', color: 'white', fontSize: '10px', fontWeight: 900, width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #070708' };

const overlay: React.CSSProperties = { position: 'fixed', inset: 0, zIndex: 99 };
const dropdown: React.CSSProperties = { position: 'absolute', top: '50px', left: 0, width: '280px', background: '#121214', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', zIndex: 100, boxShadow: '0 10px 40px rgba(0,0,0,0.5)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '400px' };

const header: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' };
const title: React.CSSProperties = { fontSize: '1rem', fontWeight: 900, color: 'white', margin: 0 };
const readAllBtn: React.CSSProperties = { background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' };

const list: React.CSSProperties = { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' };
const emptyState: React.CSSProperties = { padding: '40px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', fontWeight: 600 };

const itemBase: React.CSSProperties = { padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.02)', cursor: 'pointer', display: 'flex', gap: '12px', transition: 'background 0.2s' };
const itemUnread: React.CSSProperties = { ...itemBase, background: 'rgba(255,255,255,0.02)' };
const itemRead: React.CSSProperties = { ...itemBase, background: 'transparent', opacity: 0.6 };

const itemContent: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '4px' };
const itemTitleUnread: React.CSSProperties = { fontSize: '0.85rem', fontWeight: 900, color: 'white' };
const itemTitleRead: React.CSSProperties = { fontSize: '0.85rem', fontWeight: 700, color: 'white' };
const itemMessage: React.CSSProperties = { fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 };
const itemDate: React.CSSProperties = { fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginTop: '4px' };
