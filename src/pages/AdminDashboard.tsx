import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

// Subcomponents
import { UsersManager } from '../components/admin/UsersManager';
import { AdminShopManager } from '../components/admin/AdminShopManager';
import { ApprovalsManager } from '../components/admin/ApprovalsManager';
import { GradeReviewManager } from '../components/admin/GradeReviewManager';
import { AdminShopOrders } from '../components/admin/AdminShopOrders';
import { WebsiteManager } from '../components/admin/WebsiteManager';
import { MatchingStatus } from '../components/admin/MatchingStatus';
import { CoachPayoutManager } from '../components/admin/CoachPayoutManager';

type AdminTab = 'users' | 'shop' | 'shop_orders' | 'regions' | 'matching' | 'approvals' | 'payouts' | 'grade_review' | 'manual_class' | 'website';

const RegionsManager = () => (
    <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>지역 관리</h2>
        <p style={{ color: 'rgba(255,255,255,0.4)' }}>서비스 운영 가능 지역(시, 구 별)을 통제하거나 신규 분점을 관리합니다.</p>
    </div>
);

const ManualClassManager = () => (
    <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>수기 결재 및 오프라인 예약 확정</h2>
        <p style={{ color: 'rgba(255,255,255,0.4)' }}>관리자가 직접 예약을 생성하거나 오프라인 현장 결제 건을 시스템에 등록합니다.</p>
    </div>
);

export const AdminDashboard = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const currentTab = location.pathname.split('/').pop() as AdminTab || 'users';

    useEffect(() => {
        checkAdminAccess();
    }, [location.pathname]);

    async function checkAdminAccess() {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            navigate('/login');
            return;
        }
        
        try {
            const { data } = await supabase.from('user_roles').select('*').eq('user_id', session.user.id);
            const isAdmin = data?.some(r => (r.role || r.role_name || r.name) === 'admin');
            if (!isAdmin) {
                navigate('/dashboard'); 
            }
        } catch {
            navigate('/dashboard');
        } finally {
            setLoading(false);
        }
    }

    const handleTabSwitch = (tab: AdminTab) => {
        navigate(`/admin/${tab}`);
    };

    if (loading) return <div style={{ color: 'white', padding: 40, opacity: 0.5 }}>권한 확인 중...</div>;

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', color: 'white', padding: '0 20px' }}>
            <div style={{ marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>ADMIN PORTAL</h1>
                <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0, fontSize: '1rem' }}>시스템 전반에 대한 최고 권한 관리 센터입니다.</p>
            </div>

            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', marginBottom: '3rem', paddingBottom: '16px', whiteSpace: 'nowrap', scrollbarWidth: 'none' }}>
                <TabButton active={currentTab === 'users'} onClick={() => handleTabSwitch('users')}>회원 관리</TabButton>
                <TabButton active={currentTab === 'matching'} onClick={() => handleTabSwitch('matching')}>매칭 현황</TabButton>
                <TabButton active={currentTab === 'website'} onClick={() => handleTabSwitch('website')}>웹사이트 관리</TabButton>
                <TabButton active={currentTab === 'shop'} onClick={() => handleTabSwitch('shop')}>상품 관리</TabButton>
                <TabButton active={currentTab === 'shop_orders'} onClick={() => handleTabSwitch('shop_orders')}>주문 현황</TabButton>
                <TabButton active={currentTab === 'approvals'} onClick={() => handleTabSwitch('approvals')}>코치 승인</TabButton>
                <TabButton active={currentTab === 'payouts'} onClick={() => handleTabSwitch('payouts')}>정산 관리</TabButton>
                <TabButton active={currentTab === 'grade_review'} onClick={() => handleTabSwitch('grade_review')}>승급 심사</TabButton>
                <TabButton active={currentTab === 'regions'} onClick={() => handleTabSwitch('regions')}>지역 관리</TabButton>
            </div>

            <section className="card-minimal" style={{ minHeight: '600px', padding: '40px', borderRadius: '32px', background: 'var(--bg-surface-L1)', border: '1px solid var(--border-subtle)', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
                {currentTab === 'users' && <UsersManager />}
                {currentTab === 'shop' && <AdminShopManager />}
                {currentTab === 'shop_orders' && <AdminShopOrders />}
                {currentTab === 'regions' && <RegionsManager />}
                {currentTab === 'matching' && <MatchingStatus />}
                {currentTab === 'website' && <WebsiteManager />}
                {currentTab === 'approvals' && <ApprovalsManager />}
                {currentTab === 'payouts' && <CoachPayoutManager />}
                {currentTab === 'grade_review' && <GradeReviewManager />}
                {currentTab === 'manual_class' && <ManualClassManager />}
            </section>
        </div>
    );
};

const TabButton = ({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) => (
    <button onClick={onClick} style={{
        padding: "14px 28px", borderRadius: "16px", 
        border: active ? "1px solid var(--color-coach)" : "1px solid var(--border-subtle)",
        background: active ? "var(--color-coach)" : "var(--bg-surface-L1)",
        color: active ? "#ffffff" : "rgba(255,255,255,.4)",
        cursor: "pointer", fontWeight: 900, fontSize: '0.95rem', transition: 'all 0.3s',
        boxShadow: active ? "0 4px 20px rgba(59, 130, 246, 0.3)" : "none",
        transform: active ? "translateY(-2px)" : "none"
    }}>
        {children}
    </button>
);
