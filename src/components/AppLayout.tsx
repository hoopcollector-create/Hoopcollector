import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { CoachApplicationModal } from './CoachApplicationModal';
import { NotificationCenter } from './NotificationCenter';
import { PWAInstallPrompt } from './PWAInstallPrompt';
import { supabase } from '../lib/supabase';
import { Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
    const [appMode, setAppMode] = useState<'student' | 'coach'>('student');
    const [isCoachVerified, setIsCoachVerified] = useState(false);
    const [showCoachModal, setShowCoachModal] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        checkCoachStatus();
        
        // Auto-cleanup expired class requests
        import('../utils/cleanupHelpers').then(module => {
            module.autoCancelExpiredRequests();
        });
    }, []);

    async function checkCoachStatus() {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            // 1. Check user_roles first (Ultimate authority)
            const { data: roles, error: roleErr } = await supabase.from('user_roles').select('*').eq('user_id', session.user.id);
            
            if (roleErr) console.error("Role check error:", roleErr);

            const hasPower = roles?.some(r => {
                const val = (r.role || r.role_name || r.name || "").toLowerCase();
                return val === 'coach' || val === 'admin';
            });

            // 2. Check coach_profiles (Operational status)
            const { data: coachProp } = await supabase
                .from('coach_profiles')
                .select('active')
                .eq('user_id', session.user.id)
                .maybeSingle();
            
            if (hasPower || coachProp?.active) {
                setIsCoachVerified(true);
            } else {
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
                isOpen={isMenuOpen}
                setIsOpen={setIsMenuOpen}
            />

            {/* Mobile Header Bar */}
            <header className="mobile-header mobile-only" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px' }}>
                <div style={{ width: '44px' }}>{/* Spacer for balance */}</div>
                <Link to="/" className="mobile-header-logo" onClick={() => setIsMenuOpen(false)} style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                    <img src="/logo.png" alt="HOOPCOLLECTOR" style={{ height: '20px', display: 'block' }} />
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button 
                        className="menu-toggle-btn"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label="Toggle Menu"
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                    <NotificationCenter />
                </div>
            </header>
            
            <div className="desktop-only" style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 100 }}>
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
