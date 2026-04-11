import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { ClassInfo } from './pages/ClassInfo';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard';
import { CoachDirectory } from './pages/CoachDirectory';
import { CoachDetail } from './pages/CoachDetail';
import { CoachDashboard } from './pages/CoachDashboard';
import { CoachRequests } from './pages/CoachRequests';
import { CoachSchedule } from './pages/CoachSchedule';
import { CommunityList } from './pages/CommunityList';
import { PostDetail } from './pages/PostDetail';
import { PostWrite } from './pages/PostWrite';
import { GradeSystem } from './pages/GradeSystem';
import { Shop } from './pages/Shop';
import { ShopDetail } from './pages/ShopDetail';

// Placeholder standard components for routes that might be missing
const LandingPage = () => <Navigate to="/class-info" replace />;
const CoachFinancials = () => <div style={{ color: 'white', padding: 40 }}>내 정산내역 (준비중)</div>;

export const App = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/class-info" element={<AppLayout><ClassInfo /></AppLayout>} />
                <Route path="/coaches" element={<AppLayout><CoachDirectory /></AppLayout>} />
                <Route path="/coach-detail/:slug" element={<AppLayout><CoachDetail /></AppLayout>} />
                <Route path="/shop" element={<AppLayout><Shop /></AppLayout>} />
                <Route path="/shop/:slug" element={<AppLayout><ShopDetail /></AppLayout>} />
                
                <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
                
                <Route path="/coach/dashboard" element={<AppLayout><CoachDashboard /></AppLayout>} />
                <Route path="/coach/requests" element={<AppLayout><CoachRequests /></AppLayout>} />
                <Route path="/coach/schedule" element={<AppLayout><CoachSchedule /></AppLayout>} />
                <Route path="/coach/grade" element={<AppLayout><GradeSystem /></AppLayout>} />
                <Route path="/coach/financials" element={<AppLayout><CoachFinancials /></AppLayout>} />
                
                <Route path="/community" element={<AppLayout><CommunityList /></AppLayout>} />
                <Route path="/community/post/:id" element={<AppLayout><PostDetail /></AppLayout>} />
                <Route path="/community/write" element={<AppLayout><PostWrite /></AppLayout>} />
                <Route path="/community/edit/:id" element={<AppLayout><PostWrite /></AppLayout>} />
                
                <Route path="/admin/*" element={<AppLayout><AdminDashboard /></AppLayout>} />
            </Routes>
        </BrowserRouter>
    );
};
