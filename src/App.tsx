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
import { Home } from './pages/Home';
import { ClassJournalDetail } from './pages/ClassJournalDetail';
import { MatchExplore } from './pages/match/MatchExplore';
import { MatchCreate } from './pages/match/MatchCreate';
import { MatchRoom } from './pages/match/MatchRoom';
import { Terms } from './pages/Terms';
import { CourtMap } from './pages/CourtMap';
import { Messages } from './pages/Messages';
import { CoachFinancials } from './pages/CoachFinancials';
import { CurriculumGuide } from './pages/CurriculumGuide';

export const App = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<AppLayout><Home /></AppLayout>} />
                <Route path="/login" element={<Login />} />
                <Route path="/class-info" element={<AppLayout><ClassInfo /></AppLayout>} />
                <Route path="/coaches" element={<AppLayout><CoachDirectory /></AppLayout>} />
                <Route path="/coach-detail/:slug" element={<AppLayout><CoachDetail /></AppLayout>} />
                <Route path="/shop" element={<AppLayout><Shop /></AppLayout>} />
                <Route path="/shop/:slug" element={<AppLayout><ShopDetail /></AppLayout>} />
                <Route path="/messages" element={<AppLayout><Messages /></AppLayout>} />
                
                <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
                <Route path="/journal/:id" element={<AppLayout><ClassJournalDetail /></AppLayout>} />
                
                <Route path="/coach/dashboard" element={<AppLayout><CoachDashboard /></AppLayout>} />
                <Route path="/coach/requests" element={<AppLayout><CoachRequests /></AppLayout>} />
                <Route path="/coach/schedule" element={<AppLayout><CoachSchedule /></AppLayout>} />
                <Route path="/coach/grade" element={<AppLayout><GradeSystem /></AppLayout>} />
                <Route path="/coach/financials" element={<AppLayout><CoachFinancials /></AppLayout>} />
                <Route path="/coach/curriculum" element={<AppLayout><CurriculumGuide /></AppLayout>} />
                
                <Route path="/community" element={<AppLayout><CommunityList /></AppLayout>} />
                <Route path="/community/post/:id" element={<AppLayout><PostDetail /></AppLayout>} />
                <Route path="/community/write" element={<AppLayout><PostWrite /></AppLayout>} />
                <Route path="/community/edit/:id" element={<AppLayout><PostWrite /></AppLayout>} />
                
                <Route path="/match" element={<AppLayout><MatchExplore /></AppLayout>} />
                <Route path="/match/create" element={<AppLayout><MatchCreate /></AppLayout>} />
                <Route path="/match/room/:id" element={<MatchRoom />} />
                <Route path="/terms" element={<AppLayout><Terms /></AppLayout>} />
                <Route path="/court-map" element={<AppLayout><CourtMap /></AppLayout>} />
                
                <Route path="/admin/*" element={<AppLayout><AdminDashboard /></AppLayout>} />

            </Routes>
        </BrowserRouter>
    );
};
