import React, { useEffect, useState } from 'react';
import { Home, Compass, UserCircle, Search, Gift, Heart, Menu, X, ArrowLeft, LogOut, CheckCircle2, ShoppingBag, PlusCircle, PenTool, LayoutDashboard, Target, Users, MessageSquare, Calendar, Award, Instagram, MessageCircle, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate, useLocation, Link } from 'react-router-dom';

export interface SidebarProps {
    appMode: 'student' | 'coach';
    onModeChange: (mode: 'student' | 'coach') => void;
    isCoachVerified: boolean;
    onRequireCoachVerification: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ appMode, onModeChange, isCoachVerified, onRequireCoachVerification }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [session, setSession] = useState<any>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isCoachRole, setIsCoachRole] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    useEffect(() => {
        // Apply theme to body
        document.body.className = appMode === 'coach' ? 'theme-coach' : 'theme-student';

        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session) checkUserRoles(session.user.id);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session) checkUserRoles(session.user.id);
            else {
                setIsAdmin(false);
                setIsCoachRole(false);
            }
        });
        return () => subscription.unsubscribe();
    }, [appMode]);

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
        { name: "매칭 및 모임", icon: Target, link: "/match" },
        { name: "수업 보러가기", icon: Compass, link: "/class-info" },
        { name: "훕콜렉터 스토어", icon: ShoppingBag, link: "/shop" },
        { name: "코치 찾기", icon: Users, link: "/coaches" },
        { name: "커뮤니티", icon: MessageSquare, link: "/community" },
        { name: "정책 및 약관", icon: ShieldCheck, link: "/terms" }
    ];

    const coachMenuItems = [
        { name: "코치 대시보드", icon: LayoutDashboard, link: "/coach/dashboard" },
        { name: "매칭 및 구인", icon: Target, link: "/match" },
        { name: "수업 요청 관리", icon: Target, link: "/coach/requests" },
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
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 40 }} onClick={() => setIsMobileOpen(false)} />
            )}

            <button 
                onClick={() => setIsMobileOpen(true)}
                style={{ position: 'fixed', top: '20px', left: '20px', zIndex: 30, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                className="mobile-only"
            >
                <Menu size={20} />
            </button>

            <div style={{
                position: 'fixed', top: 0, left: 0, bottom: 0, width: 'var(--sidebar-width)', background: '#000000', borderRight: '1px solid rgba(255,255,255,0.05)',
                transform: isMobileOpen ? 'translateX(0%)' : (typeof window !== 'undefined' && window.innerWidth <= 768 ? 'translateX(-100%)' : 'translateX(0%)'), 
                transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)', zIndex: 50, display: 'flex', flexDirection: 'column',
            }} className="sidebar-container">
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
                                    background: isSelected ? 'rgba(255, 255, 255, 0.05)' : 'transparent', color: isSelected ? 'white' : 'rgba(255,255,255,0.4)', textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem', transition: 'all 0.2s'
                                }}>
                                    <item.icon size={18} style={{ opacity: isSelected ? 1 : 0.5 }} />
                                    {item.name}
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
                            <MessageCircle size={18} />
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
            
            <div className="desktop-only" style={{ width: 'var(--sidebar-width)', flexShrink: 0, height: '100vh' }}></div>
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
