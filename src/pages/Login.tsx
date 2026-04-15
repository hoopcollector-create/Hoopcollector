import React, { useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Check, Circle, AlertCircle } from 'lucide-react';

export const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Get returnTo from query params
    const queryParams = new URLSearchParams(location.search);
    const returnTo = queryParams.get('returnTo');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [msg, setMsg] = useState('');
    const [loading, setLoading] = useState(false);

    // Profile fields for Sign Up
    const [name, setName] = useState('');
    const [birthday, setBirthday] = useState('');
    const [position, setPosition] = useState('G');
    const [experience, setExperience] = useState('');
    const [phone, setPhone] = useState('');

    // Password Validation Logic
    const passwordValidation = useMemo(() => {
        return {
            length: password.length >= 8,
            hasNumber: /\d/.test(password),
            hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
            match: isSignUp ? (password === confirmPassword && password !== '') : true
        };
    }, [password, confirmPassword, isSignUp]);

    const passwordStrength = useMemo(() => {
        let strength = 0;
        if (passwordValidation.length) strength++;
        if (passwordValidation.hasNumber) strength++;
        if (passwordValidation.hasSpecial) strength++;
        return strength;
    }, [passwordValidation]);

    const getStrengthColor = () => {
        if (passwordStrength === 0) return 'rgba(255,255,255,0.1)';
        if (passwordStrength === 1) return '#ef4444'; // Red
        if (passwordStrength === 2) return '#f59e0b'; // Yellow
        return '#22c55e'; // Green
    };

    const isFormValid = isSignUp 
        ? (Object.values(passwordValidation).every(v => v) && name && birthday && phone)
        : (email && password);

    async function handleAuth(e: React.FormEvent) {
        e.preventDefault();
        if (!isFormValid) return;

        setLoading(true);
        setMsg('');
        try {
            if (isSignUp) {
                const { data, error } = await supabase.auth.signUp({
                    email, 
                    password,
                    options: {
                        data: {
                            name,
                            birthday,
                            position,
                            experience_years: experience ? parseInt(experience, 10) : null,
                            phone: phone.replace(/[^0-9]/g, '')
                        }
                    }
                });
                if (error) throw error;
                if (data.user) {
                    setMsg('회원가입이 완료되었습니다! 로그인 해주세요.');
                    setIsSignUp(false);
                    setPassword('');
                    setConfirmPassword('');
                }
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                navigate(returnTo || '/dashboard');
            }
        } catch (e: any) {
            let errorMsg = e.message || '오류가 발생했습니다.';
            if (errorMsg.includes('Invalid login credentials')) errorMsg = '이메일 또는 비밀번호가 올바르지 않습니다.';
            else if (errorMsg.includes('Email not confirmed')) errorMsg = '이메일 인증이 필요합니다.';
            else if (errorMsg.includes('User already registered')) errorMsg = '이미 가입된 이메일입니다.';
            setMsg(errorMsg);
        } finally {
            setLoading(false);
        }
    }

    const inputStyle = { 
        width: '100%', 
        padding: '14px', 
        borderRadius: '12px', 
        background: 'rgba(255,255,255,0.05)', 
        border: '1px solid rgba(255,255,255,0.1)', 
        color: 'white', 
        marginBottom: '16px', 
        boxSizing: 'border-box' as const,
        fontSize: '0.9rem',
        outline: 'none'
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0b', color: 'white', padding: '1rem' }}>
            <div style={{ maxWidth: '440px', width: '100%', padding: '2.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 900, textAlign: 'center', marginBottom: '2.5rem', letterSpacing: '-0.03em' }}>
                    <span style={{ color: 'var(--theme-primary)' }}>HOOP</span> AUTH
                </h1>

                {msg && (
                    <div style={{ padding: '14px', background: msg.includes('완료') ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: 'white', borderRadius: '12px', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.85rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                        {msg}
                    </div>
                )}

                <form onSubmit={handleAuth}>
                    <input type="email" placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} />
                    
                    <div style={{ position: 'relative' }}>
                        <input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="비밀번호" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            required 
                            style={inputStyle} 
                        />
                        <button 
                            type="button" 
                            onClick={() => setShowPassword(!showPassword)} 
                            style={{ position: 'absolute', right: '14px', top: '14px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    {isSignUp && (
                        <>
                            {/* Password Strength Meter */}
                            <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginBottom: '12px', overflow: 'hidden' }}>
                                <div style={{ width: `${(passwordStrength / 3) * 100}%`, height: '100%', background: getStrengthColor(), transition: 'all 0.4s ease' }} />
                            </div>

                            {/* Checklist */}
                            <div style={{ marginBottom: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <CheckItem label="8자 이상" isValid={passwordValidation.length} />
                                <CheckItem label="숫자 포함" isValid={passwordValidation.hasNumber} />
                                <CheckItem label="특문 포함" isValid={passwordValidation.hasSpecial} />
                            </div>

                            <input 
                                type="password" 
                                placeholder="비밀번호 확인" 
                                value={confirmPassword} 
                                onChange={e => setConfirmPassword(e.target.value)} 
                                required 
                                style={{ ...inputStyle, border: !passwordValidation.match && confirmPassword ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)' }} 
                            />
                            {!passwordValidation.match && confirmPassword && (
                                <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '-12px', marginBottom: '16px' }}>비밀번호가 일치하지 않습니다.</div>
                            )}

                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', margin: '24px 0 24px' }}></div>
                            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '16px', color: 'rgba(255,255,255,0.4)' }}>PROFILE DETAILS</h3>
                            
                            <input type="text" placeholder="이름 (실명)" value={name} onChange={e => setName(e.target.value)} required style={inputStyle} />
                            <input type="text" placeholder="전화번호" value={phone} onChange={e => setPhone(e.target.value)} required style={inputStyle} />
                            
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>생년월일</label>
                                <input type="date" value={birthday} onChange={e => setBirthday(e.target.value)} required style={{ ...inputStyle, marginBottom: 0 }} />
                            </div>
                            
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>포지션</label>
                                <select value={position} onChange={e => setPosition(e.target.value)} style={{ ...inputStyle, marginBottom: 0 }}>
                                    <option value="G">가드 (Guard)</option>
                                    <option value="F">포워드 (Forward)</option>
                                    <option value="C">센터 (Center)</option>
                                </select>
                            </div>

                            <input type="number" placeholder="경력 (년 단위)" value={experience} onChange={e => setExperience(e.target.value)} style={inputStyle} />
                        </>
                    )}

                    <button 
                        type="submit" 
                        disabled={loading || (isSignUp && !isFormValid)} 
                        style={{ 
                            width: '100%', 
                            padding: '16px', 
                            borderRadius: '12px', 
                            background: (isSignUp && !isFormValid) ? 'rgba(255,255,255,0.05)' : 'var(--theme-primary)', 
                            color: (isSignUp && !isFormValid) ? 'rgba(255,255,255,0.2)' : 'white', 
                            border: 'none', 
                            fontWeight: 900, 
                            fontSize: '1rem', 
                            cursor: (loading || (isSignUp && !isFormValid)) ? 'not-allowed' : 'pointer', 
                            marginTop: '12px',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        {loading ? 'PROCESSING...' : (isSignUp ? 'REGISTER' : 'LOG IN')}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                    <button onClick={() => { setIsSignUp(!isSignUp); setMsg(''); }} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline' }}>
                        {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
                    </button>
                </div>
            </div>
        </div>
    );
};

const CheckItem = ({ label, isValid }: { label: string, isValid: boolean }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: isValid ? '#22c55e' : 'rgba(255,255,255,0.2)', transition: 'all 0.3s ease' }}>
        {isValid ? <Check size={12} strokeWidth={3} /> : <Circle size={12} opacity={0.5} />}
        {label}
    </div>
);
