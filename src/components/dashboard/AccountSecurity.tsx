import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Shield, Mail, Lock, RefreshCw, AlertCircle, CheckCircle2, Key, Send } from 'lucide-react';

export const AccountSecurity = () => {
    const [currentPassword, setCurrentPassword] = useState("");
    const [isVerified, setIsVerified] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState("");
    const [error, setError] = useState("");
    const [userEmail, setUserEmail] = useState("");

    useEffect(() => {
        const hash = window.location.hash;
        if (hash && hash.includes('type=recovery')) {
            setIsVerified(true);
            setMsg("비밀번호 재설정 모드입니다. 새로운 비밀번호를 설정해 주세요.");
        }

        // Load user email for display
        supabase.auth.getUser().then(({ data }) => {
            if (data.user?.email) setUserEmail(data.user.email);
        });
    }, []);

    async function handleVerifyPassword() {
        if (!currentPassword) return setError("현재 비밀번호를 입력해 주세요.");
        setLoading(true); setMsg(""); setError("");
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("세션이 만료되었습니다.");

            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: session.user.email!,
                password: currentPassword
            });

            if (signInError) throw new Error("비밀번호가 일치하지 않습니다.");
            
            setIsVerified(true);
            setMsg("본인 확인이 완료되었습니다. 정보를 수정할 수 있습니다.");
            setCurrentPassword("");
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleForgotPassword() {
        setLoading(true); setMsg(""); setError("");
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("세션이 만료되었습니다.");
            
            const { error } = await supabase.auth.resetPasswordForEmail(session.user.email!, {
                redirectTo: `${window.location.origin}/dashboard?tab=security#type=recovery`
            });
            if (error) throw error;
            setMsg("비밀번호 재설정 메일이 발송되었습니다. 메일함을 확인해 주세요.");
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    async function handlePasswordUpdate() {
        if (newPassword.length < 8) return setError("비밀번호는 8자 이상이어야 합니다.");
        setLoading(true); setMsg(""); setError("");
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            setMsg("비밀번호가 성공적으로 변경되었습니다.");
            setNewPassword("");
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleEmailUpdate() {
        if (!newEmail.includes("@")) return setError("유효한 이메일 형식이 아닙니다.");
        setLoading(true); setMsg(""); setError("");
        try {
            const { error } = await supabase.auth.updateUser({ email: newEmail });
            if (error) throw error;
            setMsg("이메일 변경 확인 메일이 발송되었습니다. 기존/신규 이메일 모두 확인이 필요합니다.");
            setNewEmail("");
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ display: 'grid', gap: '30px' }}>
            <div>
                <h3 style={sectionTitle}><Shield size={18} /> 계정 보안 및 설정</h3>
                <p style={sectionDesc}>비밀번호를 재설정하거나 이메일 주소를 변경할 수 있습니다.</p>
            </div>

            {msg && <div style={successBox}><CheckCircle2 size={16} /> {msg}</div>}
            {error && <div style={errorBox}><AlertCircle size={16} /> {error}</div>}

            {!isVerified ? (
                <div style={verifyGrid}>
                    {/* Verification Box */}
                    <div className="card-minimal" style={verifyCard}>
                        <div style={iconCircle}><Key size={24} color="var(--color-primary)" /></div>
                        <h4 style={cardHeaderTitle}>본인 확인</h4>
                        <p style={cardHeaderDesc}>보안을 위해 현재 비밀번호를 입력해 주세요.</p>
                        <input 
                            type="password" 
                            placeholder="현재 비밀번호" 
                            value={currentPassword}
                            onChange={e => setCurrentPassword(e.target.value)}
                            style={inputStyle}
                        />
                        <button 
                            onClick={handleVerifyPassword}
                            disabled={loading || !currentPassword}
                            style={currentPassword ? btnPrimary : btnDisabled}
                        >
                            {loading ? <RefreshCw className="spin" size={16} /> : "확인 및 진행"}
                        </button>
                    </div>

                    {/* Forgot Password Box */}
                    <div className="card-minimal" style={{ ...verifyCard, background: 'rgba(255,255,255,0.01)' }}>
                        <div style={{ ...iconCircle, background: 'rgba(255,255,255,0.03)' }}><Send size={24} color="rgba(255,255,255,0.3)" /></div>
                        <h4 style={cardHeaderTitle}>비밀번호 찾기</h4>
                        <p style={cardHeaderDesc}>비밀번호가 기억나지 않으신가요? 재설정 메일을 보내드립니다.</p>
                        <div style={emailBadge}>{userEmail || '이메일을 불러오는 중...'}</div>
                        <button 
                            onClick={handleForgotPassword}
                            disabled={loading}
                            style={secondaryBtn}
                        >
                            {loading ? <RefreshCw className="spin" size={16} /> : "재설정 메일 발송"}
                        </button>
                    </div>
                </div>
            ) : (
                <div style={cardGrid}>
                    <div className="card-minimal" style={securityCard}>
                        <div style={cardHeader}>
                            <Lock size={20} color="var(--color-primary)" />
                            <span style={cardTitle}>비밀번호 변경</span>
                        </div>
                        <p style={cardDesc}>보안을 위해 강력한 비밀번호를 사용하세요.</p>
                        <input 
                            type="password" 
                            placeholder="새 비밀번호 (8자 이상)" 
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            style={inputStyle}
                        />
                        <button 
                            onClick={handlePasswordUpdate}
                            disabled={loading || !newPassword}
                            style={newPassword ? btnPrimary : btnDisabled}
                        >
                            {loading ? <RefreshCw className="spin" size={16} /> : "비밀번호 업데이트"}
                        </button>
                    </div>

                    <div className="card-minimal" style={securityCard}>
                        <div style={cardHeader}>
                            <Mail size={20} color="var(--color-primary)" />
                            <span style={cardTitle}>이메일 변경</span>
                        </div>
                        <p style={cardDesc}>새 이메일로 인증 메일이 발송됩니다.</p>
                        <input 
                            type="email" 
                            placeholder="새 이메일 주소" 
                            value={newEmail}
                            onChange={e => setNewEmail(e.target.value)}
                            style={inputStyle}
                        />
                        <button 
                            onClick={handleEmailUpdate}
                            disabled={loading || !newEmail}
                            style={newEmail ? btnPrimary : btnDisabled}
                        >
                            {loading ? <RefreshCw className="spin" size={16} /> : "이메일 업데이트"}
                        </button>
                    </div>
                </div>
            )}

            <div style={infoBanner}>
                <AlertCircle size={16} />
                <span>이메일 변경 시 인증이 완료될 때까지 기존 이메일로 로그인이 유지됩니다.</span>
            </div>
        </div>
    );
};

const sectionTitle: React.CSSProperties = { fontSize: '1.4rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' };
const sectionDesc: React.CSSProperties = { fontSize: '0.9rem', color: 'rgba(255,255,255,0.4)', marginBottom: '20px' };
const verifyGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' };
const verifyCard: React.CSSProperties = { padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px', border: '1px solid rgba(255,255,255,0.05)' };
const iconCircle: React.CSSProperties = { width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' };
const cardHeaderTitle: React.CSSProperties = { fontSize: '1.15rem', fontWeight: 900, margin: 0 };
const cardHeaderDesc: React.CSSProperties = { fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, marginBottom: '8px' };

const cardGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' };
const securityCard: React.CSSProperties = { padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' };
const cardHeader: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px' };
const cardTitle: React.CSSProperties = { fontWeight: 900, fontSize: '1.1rem' };
const cardDesc: React.CSSProperties = { fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 };

const inputStyle: React.CSSProperties = { width: '100%', padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' };
const btnPrimary: React.CSSProperties = { width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--color-primary)', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' };
const secondaryBtn: React.CSSProperties = { ...btnPrimary, background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' };
const btnDisabled: React.CSSProperties = { ...btnPrimary, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.2)', cursor: 'not-allowed' };

const successBox: React.CSSProperties = { padding: '12px 16px', borderRadius: '12px', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.2)', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' };
const errorBox: React.CSSProperties = { padding: '12px 16px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' };
const infoBanner: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '10px', padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' };
const emailBadge: React.CSSProperties = { fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.02)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' };
