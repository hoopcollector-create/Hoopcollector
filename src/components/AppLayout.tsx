import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { CoachApplicationModal } from './CoachApplicationModal';
import { NotificationCenter } from './NotificationCenter';
import { PWAInstallPrompt } from './PWAInstallPrompt';
import { supabase } from '../lib/supabase';

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
    const [appMode, setAppMode] = useState<'student' | 'coach'>('student');
    const [isCoachVerified, setIsCoachVerified] = useState(false);
    const [showCoachModal, setShowCoachModal] = useState(false);

    useEffect(() => {
        checkCoachStatus();
    }, []);

    async function checkCoachStatus() {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            // 1. Check user_roles first (Ultimate authority)
            const { data: roles, error: roleErr } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id);
            
            if (roleErr) console.error("Role check error:", roleErr);

            const hasPower = roles?.some(r => 
                r.role?.toLowerCase() === 'coach' || 
                r.role?.toLowerCase() === 'admin'
            );

            // 2. Check coach_profiles (Operational status)
            const { data: coachProp } = await supabase
                .from('coach_profiles')
                .select('active')
                .eq('user_id', session.user.id)
                .maybeSingle();
            
            if (hasPower || coachProp?.active) {
                console.log("Coach verification successful. Role:", roles);
                setIsCoachVerified(true);
            } else {
                console.log("Coach verification failed. User is not a coach/admin in user_roles.");
                setIsCoachVerified(false);
            }
        } catch (e) {
            console.error("Coach status check failed:", e);
        }
    }

    const handleRequireCoachVerification = () => {
        setShowCoachModal(true);
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0b', color: 'white' }}>
            <Sidebar 
                appMode={appMode} 
                onModeChange={setAppMode} 
                isCoachVerified={isCoachVerified}
                onRequireCoachVerification={handleRequireCoachVerification}
            />
            
            <div style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 100 }}>
                <NotificationCenter />
            </div>
            
            <main className="main-layout">
                <div style={{ 
                    width: '100%', 
                    maxWidth: '1200px',
                    margin: '0 auto'
                }} className="main-content-wrapper">
                    {children}
                </div>
            </main>

            {showCoachModal && (
                <CoachApplicationModal onClose={() => setShowCoachModal(false)} />
            )}

            <PWAInstallPrompt />
        </div>
    );
};
