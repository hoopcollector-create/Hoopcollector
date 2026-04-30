import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Bell, MessageSquare, Calendar, Award, Info, X, Smartphone, Download } from 'lucide-react';
import { useTranslation } from '../lib/i18n';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface AppNotification {
    id: string;
    type: 'chat' | 'class' | 'match' | 'system';
    title: string;
    content: string;
    link?: string;
    is_read: boolean;
    created_at: string;
}

export const NotificationCenter: React.FC = () => {
    const { isInstallable, isIOS, install } = usePWAInstall();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const { t } = useTranslation();

    useEffect(() => {
        if (!supabase) return;
        let channel: any;

        const setupSubscription = async () => {
            try {
                fetchNotifications();
                const newChannel = supabase.channel(`notif-changes-${Math.random()}`);
                newChannel
                    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload: any) => {
                        const newNotif = payload.new as AppNotification;
                        if (!newNotif) return;
                        setNotifications(prev => [newNotif, ...prev]);
                        setUnreadCount(prev => prev + 1);
                        if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'granted') {
                            new window.Notification(newNotif.title, { body: newNotif.content });
                        }
                    })
                    .subscribe();
                channel = newChannel;
            } catch (e) {
                console.error("Subscription error:", e);
            }
        };

        setupSubscription();
        return () => {
            if (channel) supabase.removeChannel(channel);
        };
    }, []);

    const fetchNotifications = async () => {
        try {
            if (!supabase) return;
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(20);

            if (data) {
                setNotifications(data);
                setUnreadCount(data.filter(n => !n.is_read).length);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', id);

            if (!error) {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'chat': return <MessageSquare size={16} color="#FF6B00" />;
            case 'class': return <Calendar size={16} color="#00C2FF" />;
            case 'match': return <Award size={16} color="#FFD700" />;
            default: return <Info size={16} color="#666" />;
        }
    };

    if (!notifications) return null;

    return (
        <div style={{ position: 'relative' }}>
            <button 
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }} 
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px', display: 'flex', position: 'relative' }}
            >
                <Bell size={20} color="white" />
                {unreadCount > 0 && (
                    <span style={{ position: 'absolute', top: 5, right: 5, background: '#f97316', color: 'white', fontSize: 10, borderRadius: '50%', width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 1000 }} onClick={() => setIsOpen(false)} />
                    <div 
                        className="notif-dropdown"
                        style={{ position: 'absolute', top: 45, right: -10, width: 300, background: '#161618', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', zIndex: 1001, overflow: 'hidden' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 900 }}>알림 ({unreadCount})</span>
                            <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer' }}><X size={16} /></button>
                        </div>

                        {/* PWA Install Banner inside Notifications */}
                        {isInstallable && (
                            <div style={{ padding: '16px', background: 'rgba(249, 115, 22, 0.08)', borderBottom: '1px solid rgba(249, 115, 22, 0.15)' }}>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Smartphone size={20} color="white" />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 900, color: 'white' }}>앱으로 더 편하게!</div>
                                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                                            {isIOS ? '홈 화면에 추가하여 이용하세요' : '앱을 설치하고 알림을 받아보세요'}
                                        </div>
                                    </div>
                                    {!isIOS && (
                                        <button 
                                            onClick={install}
                                            style={{ padding: '8px 12px', borderRadius: '8px', background: '#f97316', color: 'white', border: 'none', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                                        >
                                            설치
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        <div style={{ maxHeight: 350, overflowY: 'auto' }}>
                            {notifications.length === 0 ? (
                                <div style={{ padding: 40, textAlign: 'center', color: '#666', fontSize: '0.8rem' }}>알림이 없습니다.</div>
                            ) : (
                                notifications.map(n => (
                                    <div key={n.id} onClick={() => markAsRead(n.id)} style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.03)', opacity: n.is_read ? 0.5 : 1, cursor: 'pointer' }}>
                                        <div style={{ display: 'flex', gap: 12 }}>
                                            {getIcon(n.type)}
                                            <div>
                                                <div style={{ fontSize: '0.75rem', fontWeight: 800 }}>{n.title}</div>
                                                <div style={{ fontSize: '0.7rem', color: '#999', marginTop: 2 }}>{n.content}</div>
                                            </div>
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
