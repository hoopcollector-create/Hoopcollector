import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

// Subcomponents
import { UsersManager } from '../components/admin/UsersManager';
import { ProductsManager } from '../components/admin/ProductsManager';
import { ApprovalsManager } from '../components/admin/ApprovalsManager';
import { GradeReviewManager } from '../components/admin/GradeReviewManager';

type AdminTab = 'users' | 'products' | 'regions' | 'classes' | 'approvals' | 'grade_review' | 'manual_class';

const ClassesManager = () => (
    <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>수업 전체 현황</h2>
        <p style={{ color: 'rgba(255,255,255,0.6)' }}>실시간으로 매칭된 수업과 취소 내역을 모니터링하는 화면이 구현될 예정입니다.</p>
    </div>
);

const RegionsManager = () => (
    <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>지역 관리</h2>
        <p style={{ color: 'rgba(255,255,255,0.6)' }}>서비스 운영 가능 지역(시, 구 별)을 통제합니다.</p>
    </div>
);

const ManualClassManager = () => (
    <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>수기 결재 및 오프라인 예약 확정</h2>
        <p style={{ color: 'rgba(255,255,255,0.6)' }}>시스템 외적으로 잡힌 스케줄이나 무통장 입금 기반의 예약을 관리자가 직접 꽂아넣는 기능입니다.</p>
    </div>
);

export const AdminDashboard = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [msg] = useState('');

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
            const { data } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id).eq('role', 'admin').maybeSingle();
            if (!data) {
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

    if (loading) return <div style={{ color: 'white', padding: 40 }}>관리자 권한 확인 중...</div>;

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', color: 'white' }}>
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                   <h1 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '0.5rem' }}>관리자 포털</h1>
                   <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0 }}>전체 시스템(회원, 코치, 결제, 클래스, 승급)을 총괄 관리합니다.</p>
                </div>
            </div>

            {msg && <div style={{ padding: 14, borderRadius: 14, background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', marginBottom: 20 }}>{msg}</div>}

            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '2rem', paddingBottom: '8px', whiteSpace: 'nowrap', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <TabButton active={currentTab === 'users'} onClick={() => handleTabSwitch('users')}>회원 관리</TabButton>
                <TabButton active={currentTab === 'products'} onClick={() => handleTabSwitch('products')}>상품 통제</TabButton>
                <TabButton active={currentTab === 'regions'} onClick={() => handleTabSwitch('regions')}>지역 관리</TabButton>
                <TabButton active={currentTab === 'classes'} onClick={() => handleTabSwitch('classes')}>수업 현황</TabButton>
                <TabButton active={currentTab === 'approvals'} onClick={() => handleTabSwitch('approvals')}>코치 승인</TabButton>
                <TabButton active={currentTab === 'grade_review'} onClick={() => handleTabSwitch('grade_review')}>승급 심사</TabButton>
                <TabButton active={currentTab === 'manual_class'} onClick={() => handleTabSwitch('manual_class')}>수기 예약 관리</TabButton>
            </div>

            <section style={{ borderRadius: 22, border: "1px solid rgba(255,255,255,.10)", background: "rgba(255,255,255,.02)", padding: 24, minHeight: '600px' }}>
                {currentTab === 'users' && <UsersManager />}
                {currentTab === 'products' && <ProductsManager />}
                {currentTab === 'regions' && <RegionsManager />}
                {currentTab === 'classes' && <ClassesManager />}
                {currentTab === 'approvals' && <ApprovalsManager />}
                {currentTab === 'grade_review' && <GradeReviewManager />}
                {currentTab === 'manual_class' && <ManualClassManager />}
            </section>
        </div>
    );
};

const TabButton = ({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) => (
    <button onClick={onClick} style={{
        padding: "12px 20px", borderRadius: "12px", border: active ? "1px solid #3b82f6" : "1px solid rgba(255,255,255,.10)",
        background: active ? "rgba(59, 130, 246, 0.1)" : "rgba(255,255,255,.04)",
        color: active ? "#3b82f6" : "rgba(255,255,255,.5)",
        cursor: "pointer", fontWeight: active ? 800 : 600, fontSize: 14, transition: 'all 0.2s'
    }}>
        {children}
    </button>
);
