import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, Award, Zap, Calendar } from 'lucide-react';

interface UserProfileModalProps {
    userId: string;
    onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ userId, onClose }) => {
    const [profile, setProfile] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userId) loadUserProfile();
    }, [userId]);

    async function loadUserProfile() {
        setLoading(true);
        try {
            // Fetch Profile
            const { data: pData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
            
            // Fetch Stats
            const { data: sData } = await supabase
                .from('user_points_stats')
                .select('level, tier, xp_total, completed_count')
                .eq('user_id', userId)
                .single();

            setProfile(pData);
            setStats(sData || { level: 1, tier: 'ROOKIE', xp_total: 0, completed_count: 0 });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return null; // Or a loading spinner

    return (
        <div style={modalOverlay} onClick={onClose}>
            <div style={modalContent} onClick={e => e.stopPropagation()}>
                <button style={closeBtn} onClick={onClose}>&times;</button>
                
                <div style={header}>
                    <div style={avatarWrap}>
                        {profile?.photo_url ? (
                            <img src={profile.photo_url} style={avatar} alt="Profile" />
                        ) : (
                            <div style={avatarFallback}><User size={32} /></div>
                        )}
                    </div>
                    <div style={headerText}>
                        <h2 style={name}>{profile?.name || '익명 사용자'}</h2>
                        <div style={classBadge}>CLASS {profile?.basketball_level || 'C'}</div>
                    </div>
                </div>

                <div style={statsGrid}>
                    <div style={{...statCard, background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(249, 115, 22, 0.05) 100%)', borderColor: 'rgba(249, 115, 22, 0.2)'}}>
                        <Zap size={16} color="var(--color-primary)" />
                        <div style={statValue}>LV.{stats?.level}</div>
                        <div style={{...statLabel, color: 'var(--color-primary)', fontWeight: 900}}>{stats?.tier}</div>
                    </div>
                    <div style={statCard}>
                        <Award size={16} color="#f59e0b" />
                        <div style={statValue}>{stats?.xp_total}</div>
                        <div style={statLabel}>누적 XP</div>
                    </div>
                    <div style={statCard}>
                        <Calendar size={16} color="#10b981" />
                        <div style={statValue}>{stats?.completed_count}회</div>
                        <div style={statLabel}>참여 횟수</div>
                    </div>
                </div>

                <div style={details}>
                    <DetailRow label="포지션" value={profile?.position ? `${profile.position}` : '-'} />
                    <DetailRow label="농구 경력" value={profile?.experience_years ? `${profile.experience_years}년` : '-'} />
                    <DetailRow label="활동 지역" value="서울/경기 (추후 연동)" />
                </div>
            </div>
        </div>
    );
};

const DetailRow = ({ label, value }: { label: string, value: string }) => (
    <div style={detailRow}>
        <div style={detailLabel}>{label}</div>
        <div style={detailValue}>{value}</div>
    </div>
);

// Styles
const modalOverlay: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(5px)' };
const modalContent: React.CSSProperties = { width: '100%', maxWidth: '360px', background: '#121214', borderRadius: '24px', padding: '24px', border: '1px solid rgba(255,255,255,0.1)', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' };
const closeBtn: React.CSSProperties = { position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '24px', cursor: 'pointer', lineHeight: 1 };

const header: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' };
const avatarWrap: React.CSSProperties = { width: '64px', height: '64px', borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.1)' };
const avatar: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'cover' };
const avatarFallback: React.CSSProperties = { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' };
const headerText: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' };
const name: React.CSSProperties = { fontSize: '1.2rem', fontWeight: 900, color: 'white', margin: 0 };
const classBadge: React.CSSProperties = { padding: '2px 8px', borderRadius: '6px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white', fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.05em' };

const statsGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '24px' };
const statCard: React.CSSProperties = { padding: '12px 8px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', border: '1px solid rgba(255,255,255,0.05)' };
const statValue: React.CSSProperties = { fontSize: '1rem', fontWeight: 900, color: 'white' };
const statLabel: React.CSSProperties = { fontSize: '0.65rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)' };

const details: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '16px' };
const detailRow: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' };
const detailLabel: React.CSSProperties = { color: 'rgba(255,255,255,0.4)', fontWeight: 700 };
const detailValue: React.CSSProperties = { color: 'white', fontWeight: 800 };
