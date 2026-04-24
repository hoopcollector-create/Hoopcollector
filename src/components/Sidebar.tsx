import React, { useEffect, useState } from 'react';
import { Home, Compass, UserCircle, Search, Gift, Heart, Menu, X, ArrowLeft, LogOut, CheckCircle2, ShoppingBag, PlusCircle, PenTool, LayoutDashboard, Target, Users, MessageSquare, Calendar, Award, Instagram, MessageCircle, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate, useLocation, Link } from 'react-router-dom';

export interface SidebarProps {
    appMode: 'student' | 'coach';
    onModeChange: (mode: 'student' | 'coach') => void;
    isCoachVerified: boolean;
    onRequireCoachVerification: () => void;
    isOpen?: boolean;
    setIsOpen?: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
    appMode, onModeChange, isCoachVerified, onRequireCoachVerification,
    isOpen: externalOpen, setIsOpen: setExternalOpen 
}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [session, setSession] = useState<any>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isCoachRole, setIsCoachRole] = useState(false);
    const [unreadChatCount, setUnreadChatCount] = useState(0);
    const [activeRequestsCount, setActiveRequestsCount] = useState(0);

    
    // Internal state fallback if not provided
    const [internalOpen, setInternalOpen] = useState(false);
    const isMobileOpen = externalOpen !== undefined ? externalOpen : internalOpen;
    const setIsMobileOpen = setExternalOpen !== undefined ? setExternalOpen : setInternalOpen;

    useEffect(() => {
        // Apply theme to body
        document.body.className = appMode === 'coach' ? 'theme-coach' : 'theme-student';

        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session) checkUserRoles(session.user.id);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session) {
                checkUserRoles(session.user.id);
                fetchUnreadChats(session.user.id);
            } else {
                setIsAdmin(false);
                setIsCoachRole(false);
                setUnreadChatCount(0);
            }
        });

        // Initialize chats for initial session load
        supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
            if (currentSession) {
                fetchUnreadChats(currentSession.user.id);
                fetchActiveRequests(currentSession.user.id);
                setupChatSubscription(currentSession.user.id);
            }
        });

        return () => subscription.unsubscribe();
    }, [appMode]);

    let chatSubChannel: any = null;
    async function fetchUnreadChats(uid: string) {
        const { data: rooms } = await supabase
            .from('chat_rooms')
            .select('id')
            .or(`student_id.eq.${uid},coach_id.eq.${uid}`);
            
        if (!rooms || rooms.length === 0) return;
        const roomIds = rooms.map(r => r.id);

        const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .in('room_id', roomIds)
            .neq('sender_id', uid)
            .eq('is_read', false);
            
        setUnreadChatCount(count || 0);
    }

    async function fetchActiveRequests(uid: string) {
        try {
            const { data: cp } = await supabase.from('coach_profiles').select('service_regions').eq('user_id', uid).maybeSingle();
            const regions = cp?.service_regions || [];
            const { data: regionRecs } = await supabase.from('service_regions').select('id').in('display_name', regions);
            const regionIds = (regionRecs || []).map(r => r.id);

            const { count: designatedNew } = await supabase.from('class_requests').select('id', { count: 'exact', head: true }).eq('coach_id', uid).eq('status', 'requested');
            
            let generalNew = 0;
            if (regionIds.length > 0) {
                const { count } = await supabase.from('class_requests').select('id', { count: 'exact', head: true }).is('coach_id', null).eq('status', 'requested').in('region_id', regionIds);
                generalNew = count || 0;
            }

            const { count: pendingCompletion } = await supabase.from('class_requests')
                .select('id', { count: 'exact', head: true })
                .eq('coach_id', uid)
                .eq('status', 'accepted')
                .lt('requested_start', new Date().toISOString());

            setActiveRequestsCount((designatedNew || 0) + generalNew + (pendingCompletion || 0));
        } catch (e) {
            console.error("Failed to fetch active requests count", e);
        }
    }

    function setupChatSubscription(uid: string) {
        if (chatSubChannel) return;
        chatSubChannel = supabase.channel('sidebar-unreads')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload: any) => {
                if (payload.new && payload.new.sender_id !== uid) {
                    setUnreadChatCount(prev => prev + 1);
                }
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (payload: any) => {
                if (payload.new && payload.new.sender_id !== uid && payload.new.is_read) {
                    setUnreadChatCount(prev => Math.max(0, prev - 1));
                }
            })
            .subscribe();
    }

    async function checkUserRoles(uid: string) {
        try {
            const { data } = await supabase.from('user_roles').select('role').eq('user_id', uid);
            if (data) {
                setIsAdmin(data.some(r => r.role === 'admin'));
                setIsCoachRole(data.some(r => r.role === 'coach'));
            }
        } catch (e) {
            console.error(e);
        }
    }

    async function handleLogout() {
        await supabase.auth.signOut();
        navigate('/');
    }

    const unauthMenuItems = [
        { name: "훕콜렉터 안내", icon: Compass, link: "/class-info" },
        { name: "스토어", icon: ShoppingBag, link: "/shop" }
    ];

    const studentMenuItems = [
        { name: "대시보드", icon: Home, link: "/dashboard" },
        { name: "메시지 보관함", icon: MessageCircle, link: "/messages" },
        { name: "매칭 및 모임", icon: Target, link: "/match" },
        { name: "수업 보러가기", icon: Compass, link: "/class-info" },
        { name: "훕콜렉터 스토어", icon: ShoppingBag, link: "/shop" },
        { name: "훕콜렉터 코트 맵", icon: MapPin, link: "/court-map" },
        { name: "코치 찾기", icon: Users, link: "/coaches" },
        { name: "커뮤니티", icon: MessageSquare, link: "/community" },
        { name: "정책 및 약관", icon: ShieldCheck, link: "/terms" }
    ];


    const coachMenuItems = [
        { name: "코치 대시보드", icon: LayoutDashboard, link: "/coach/dashboard" },
        { name: "메시지 보관함", icon: MessageCircle, link: "/messages" },
        { name: "수업 요청 관리", icon: Target, link: "/coach/requests" },
        { name: "매칭 및 구인", icon: Target, link: "/match" },
        { name: "스케줄 관리", icon: Calendar, link: "/coach/schedule" },
        { name: "등급 및 승급", icon: Award, link: "/coach/grade" },
        { name: "스토어", icon: ShoppingBag, link: "/shop" },
        { name: "정책 및 약관", icon: ShieldCheck, link: "/terms" }
    ];

    const adminMenuItems = [
        { name: "회원관리", icon: UserCircle, link: "/admin/users" },
        { name: "쇼핑몰 관리", icon: ShoppingBag, link: "/admin/shop" },
        { name: "가입승인", icon: CheckCircle2, link: "/admin/approvals" },
        { name: "지역관리", icon: MapPin, link: "/admin/regions" }
    ];

    function getMenuItems() {
        if (!session) return unauthMenuItems;
        return appMode === 'coach' ? coachMenuItems : studentMenuItems;
    }

    const handleModeSwitch = (mode: 'student' | 'coach') => {
        if (mode === 'coach' && !isCoachVerified && !isAdmin) {
            onRequireCoachVerification();
            return;
        }
        onModeChange(mode);
    };

    return (
        <>
            {isMobileOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1050 }} onClick={() => setIsMobileOpen(false)} />
            )}

            <div
                style={{
                    position: 'fixed', top: 0, left: 0, bottom: 0,
                    width: 'min(280px, 85vw)',
                    background: '#070708',
                    borderRight: '1px solid rgba(255,255,255,0.05)',
                    transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    zIndex: 1100, display: 'flex', flexDirection: 'column',
                    boxShadow: isMobileOpen ? '0 0 50px rgba(0,0,0,0.5)' : 'none'
                }}
                className={`sidebar-container${isMobileOpen ? ' is-open' : ''}`}
            >
                <div style={{ padding: '40px 32px' }}>
                    <Link to="/" onClick={() => setIsMobileOpen(false)} style={{ color: 'white', fontSize: '1.4rem', fontWeight: 900, textDecoration: 'none', letterSpacing: '-0.04em' }}>
                        HOOP<span style={{ opacity: 0.4 }}>COLLECTOR</span>
                    </Link>
                </div>

                {session && (
                    <div style={{ padding: '0 24px 32px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '14px', padding: '4px', display: 'flex', gap: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <button
                                onClick={() => handleModeSwitch('student')}
                                style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                                    background: appMode === 'student' ? 'var(--color-student)' : 'transparent', color: appMode === 'student' ? 'white' : 'rgba(255,255,255,0.4)', transition: 'all 0.3s' }}
                            >
                                STUDENT
                            </button>
                            <button
                                onClick={() => handleModeSwitch('coach')}
                                style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                                    background: appMode === 'coach' ? 'var(--color-coach)' : 'transparent', color: appMode === 'coach' ? 'white' : 'rgba(255,255,255,0.4)', transition: 'all 0.3s' }}
                            >
                                COACH
                            </button>
                        </div>
                    </div>
                )}

                <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px' }}>
                    <nav style={{ display: 'grid', gap: '4px' }}>
                        {getMenuItems().map(item => {
                            const isSelected = location.pathname === item.link;
                            return (
                                <Link key={item.link} to={item.link} onClick={() => setIsMobileOpen(false)} style={{
                                    display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px', borderRadius: '12px',
                                    background: isSelected ? 'rgba(255, 255, 255, 0.05)' : 'transparent', color: isSelected ? 'white' : 'rgba(255,255,255,0.4)', textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem', transition: 'all 0.2s', position: 'relative'
                                }}>
                                    <item.icon size={18} style={{ opacity: isSelected ? 1 : 0.5 }} />
                                    {item.name}
                                    {item.link === "/messages" && unreadChatCount > 0 && (
                                        <span style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: '#ef4444', color: 'white', fontSize: '10px', fontWeight: 900, borderRadius: '100px', padding: '2px 6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {unreadChatCount > 9 ? '9+' : unreadChatCount}
                                        </span>
                                    )}
                                    {item.link === "/coach/requests" && activeRequestsCount > 0 && (
                                        <span style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: '#3b82f6', color: 'white', fontSize: '10px', fontWeight: 900, borderRadius: '100px', padding: '2px 6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {activeRequestsCount > 9 ? '9+' : activeRequestsCount}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {isAdmin && (
                        <div style={{ marginTop: '2.5rem' }}>
                            <div style={{ padding: '0 16px', fontSize: '0.7rem', fontWeight: 900, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.1em' }}>Management</div>
                            <nav style={{ display: 'grid', gap: '2px' }}>
                                {adminMenuItems.map(item => {
                                    const isSelected = location.pathname.startsWith(item.link);
                                    return (
                                        <Link key={item.link} to={item.link} onClick={() => setIsMobileOpen(false)} style={{
                                            display: 'flex', alignItems: 'center', gap: '14px', padding: '10px 16px', borderRadius: '10px',
                                            background: isSelected ? 'rgba(255,255,255,0.05)' : 'transparent', color: isSelected ? 'white' : 'rgba(255,255,255,0.3)', textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem'
                                        }}>
                                            <item.icon size={16} />
                                            {item.name}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>
                    )}
                </div>

                <div style={{ padding: '32px 16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', justifyContent: 'center' }}>
                        <a href="https://www.instagram.com/hoop_collector/" target="_blank" rel="noreferrer" style={snsIconStyle}>
                            <Instagram size={18} />
                        </a>
                        <a href="#" target="_blank" rel="noreferrer" style={snsIconStyle}>
                            <Users size={18} />
                        </a>
                    </div>
                    
                    {session ? (
                        <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <UserCircle size={18} />
                                </div>
                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'white', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{session.user.email}</div>
                                </div>
                                <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}>
                                    <LogOut size={16} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <Link to="/login" onClick={() => setIsMobileOpen(false)} style={btnLoginStyle}>
                            START JOURNEY
                        </Link>
                    )}
                </div>
            </div>
            
            <div className="desktop-only sidebar-spacer"></div>
        </>
    );
};

const snsIconStyle: React.CSSProperties = {
    width: '36px',
    height: '36px',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.03)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'rgba(255,255,255,0.3)',
    transition: 'all 0.2s',
    textDecoration: 'none',
    border: '1px solid rgba(255,255,255,0.05)'
};

const btnLoginStyle: React.CSSProperties = {
    display: 'block',
    width: '100%',
    padding: '16px',
    borderRadius: '14px',
    background: 'white',
    color: 'black',
    textAlign: 'center',
    fontWeight: 900,
    textDecoration: 'none',
    fontSize: '0.85rem',
    letterSpacing: '0.05em'
};

function MapPin(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg> }
