import React, { useEffect, useState } from 'react';
import { Home, Compass, UserCircle, Search, Gift, Heart, Menu, X, ArrowLeft, LogOut, CheckCircle2, ShoppingBag, PlusCircle, PenTool, LayoutDashboard, Target, Users, MessageSquare, Calendar, Award } from 'lucide-react';
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
    }, []);

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
        { name: "훕콜렉터 클래스 둘러보기", icon: Compass, link: "/class-info" }
    ];

    const studentMenuItems = [
        { name: "내 대시보드", icon: Home, link: "/dashboard" },
        { name: "수업 보러가기", icon: Compass, link: "/class-info" },
        { name: "코치 찾기", icon: Users, link: "/coaches" },
        { name: "커뮤니티", icon: MessageSquare, link: "/community" }
    ];

    const coachMenuItems = [
        { name: "코치 대시보드", icon: LayoutDashboard, link: "/coach/dashboard" },
        { name: "수업 요청 관리", icon: Target, link: "/coach/requests" },
        { name: "스케줄 관리", icon: Calendar, link: "/coach/schedule" },
        { name: "등급 및 승급", icon: Award, link: "/coach/grade" },
        { name: "내 정산내역", icon: Gift, link: "/coach/financials" }
    ];

    const adminMenuItems = [
        { name: "회원관리", icon: UserCircle, link: "/admin/users" },
        { name: "상품관리", icon: ShoppingBag, link: "/admin/products" },
        { name: "지역관리", icon: MapPin, link: "/admin/regions" },
        { name: "수업/일정현황", icon: Compass, link: "/admin/classes" },
        { name: "가입승인", icon: CheckCircle2, link: "/admin/approvals" },
        { name: "수업승인(수기)", icon: PlusCircle, link: "/admin/manual_class" }
    ];

    function getMenuItems() {
        if (!session) return unauthMenuItems;
        let items = appMode === 'coach' ? [...coachMenuItems] : [...studentMenuItems];
        return items;
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
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }} onClick={() => setIsMobileOpen(false)} />
            )}

            <button 
                onClick={() => setIsMobileOpen(true)}
                style={{ position: 'fixed', top: '16px', left: '16px', zIndex: 30, background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                className="mobile-only"
            >
                <Menu size={24} />
            </button>

            <div style={{
                position: 'fixed', top: 0, left: 0, bottom: 0, width: 'var(--sidebar-width)', background: '#111827', borderRight: '1px solid rgba(255,255,255,0.1)',
                transform: isMobileOpen ? 'translateX(0%)' : (typeof window !== 'undefined' && window.innerWidth <= 768 ? 'translateX(-100%)' : 'translateX(0%)'), 
                transition: 'transform 0.3s ease', zIndex: 50, display: 'flex', flexDirection: 'column',
            }} className="sidebar-container">
                <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Link to="/" onClick={() => setIsMobileOpen(false)} style={{ color: 'var(--color-primary)', fontSize: '1.5rem', fontWeight: 900, textDecoration: 'none' }}>
                        Hoop<span style={{ color: 'white' }}>collector</span>
                    </Link>
                    <button onClick={() => setIsMobileOpen(false)} className="mobile-only" style={{ background: 'transparent', border: 'none', color: 'white' }}>
                        <X size={24} />
                    </button>
                </div>

                {session && (
                    <div style={{ padding: '0 24px 20px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '4px', display: 'flex', gap: '4px' }}>
                            <button
                                onClick={() => handleModeSwitch('student')}
                                style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', fontWeight: 700, fontSize: '0.9rem',
                                    background: appMode === 'student' ? 'rgba(255,255,255,0.1)' : 'transparent', color: appMode === 'student' ? 'white' : 'rgba(255,255,255,0.5)', transition: 'all 0.2s' }}
                            >
                                👤 학생
                            </button>
                            <button
                                onClick={() => handleModeSwitch('coach')}
                                style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', fontWeight: 700, fontSize: '0.9rem',
                                    background: appMode === 'coach' ? 'var(--color-primary)' : 'transparent', color: appMode === 'coach' ? 'white' : 'rgba(255,255,255,0.5)', transition: 'all 0.2s' }}
                            >
                                ✨ 코치
                            </button>
                        </div>
                    </div>
                )}

                <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px' }}>
                    <nav style={{ display: 'grid', gap: '8px' }}>
                        {getMenuItems().map(item => {
                            const isSelected = location.pathname.startsWith(item.link);
                            return (
                                <Link key={item.link} to={item.link} onClick={() => setIsMobileOpen(false)} style={{
                                    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px',
                                    background: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'transparent', color: isSelected ? 'var(--color-primary)' : 'rgba(255,255,255,0.7)', textDecoration: 'none', fontWeight: 700, transition: 'all 0.2s'
                                }}>
                                    <item.icon size={20} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {isAdmin && (
                        <div style={{ marginTop: '2rem' }}>
                            <div style={{ padding: '0 16px', fontSize: '0.8rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '8px' }}>Admin Area</div>
                            <nav style={{ display: 'grid', gap: '4px' }}>
                                {adminMenuItems.map(item => {
                                    const isSelected = location.pathname.startsWith(item.link);
                                    return (
                                        <Link key={item.link} to={item.link} onClick={() => setIsMobileOpen(false)} style={{
                                            display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', borderRadius: '8px',
                                            background: isSelected ? 'rgba(255,255,255,0.1)' : 'transparent', color: isSelected ? 'white' : 'rgba(255,255,255,0.5)', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem'
                                        }}>
                                            <item.icon size={18} />
                                            {item.name}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>
                    )}
                </div>

                {session ? (
                    <div style={{ padding: '20px 16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', marginBottom: '12px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                                <UserCircle size={24} />
                            </div>
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'white', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{session.user.email}</div>
                                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>{isCoachRole ? "코치 계정" : (isAdmin ? '관리자' : '일반 회원')}</div>
                            </div>
                        </div>
                        <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
                            <LogOut size={18} /> 로그아웃
                        </button>
                    </div>
                ) : (
                    <div style={{ padding: '24px 16px' }}>
                        <Link to="/login" onClick={() => setIsMobileOpen(false)} style={{ display: 'block', width: '100%', padding: '16px', borderRadius: '14px', background: 'white', color: 'black', textAlign: 'center', fontWeight: 800, textDecoration: 'none' }}>
                            시작하기
                        </Link>
                    </div>
                )}
            </div>
            
            <div className="desktop-only" style={{ width: 'var(--sidebar-width)', flexShrink: 0 }}></div>
        </>
    );
};
function MapPin(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg> }
