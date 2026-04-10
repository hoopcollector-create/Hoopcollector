import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [msg, setMsg] = useState('');
    const [loading, setLoading] = useState(false);

    // Profile fields for Sign Up
    const [name, setName] = useState('');
    const [birthday, setBirthday] = useState('');
    const [position, setPosition] = useState('G');
    const [experience, setExperience] = useState('');
    const [phone, setPhone] = useState('');

    async function handleAuth(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setMsg('');
        try {
            if (isSignUp) {
                if (!name || !birthday || !phone) {
                    throw new Error("이름, 생년월일, 전화번호는 필수입니다.");
                }
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
                    // Profile is auto-created in Dashboard if missing, but metadata handles it.
                    setMsg('회원가입이 완료되었습니다! 로그인 해주세요.');
                    setIsSignUp(false);
                }
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                navigate('/dashboard');
            }
        } catch (e: any) {
            let errorMsg = e.message || '오류가 발생했습니다.';
            
            // Supabase 영문 에러 메시지 한국어 변환
            if (errorMsg.includes('Invalid login credentials')) {
                errorMsg = '이메일 또는 비밀번호가 올바르지 않습니다.';
            } else if (errorMsg.includes('Email not confirmed')) {
                errorMsg = '이메일 인증이 필요합니다. 메일함을 확인해주세요.';
            } else if (errorMsg.includes('User already registered')) {
                errorMsg = '이미 가입된 이메일 계정입니다.';
            } else if (errorMsg.includes('Password should be at least 6 characters')) {
                errorMsg = '비밀번호는 최소 6자 이상이어야 합니다.';
            } else if (errorMsg.includes('Unable to validate email address')) {
                errorMsg = '유효하지 않은 이메일 형식입니다.';
            }

            setMsg(errorMsg);
        } finally {
            setLoading(false);
        }
    }

    const inputStyle = { width: '100%', padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', marginBottom: '16px', boxSizing: 'border-box' as const };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0b', color: 'white', padding: '1rem' }}>
            <div style={{ maxWidth: '440px', width: '100%', padding: 'clamp(1.5rem, 5vw, 2.5rem)', background: 'rgba(255,255,255,0.02)', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)' }} className="card-premium">
                <h1 style={{ fontSize: 'clamp(1.5rem, 6vw, 2rem)', fontWeight: 900, textAlign: 'center', marginBottom: '2rem' }}>
                    <span style={{ color: 'var(--color-primary)' }}>통합</span> 인증
                </h1>

                {msg && <div style={{ padding: '12px', background: msg.includes('오류') || msg.includes('필수') ? 'var(--color-danger)' : 'rgba(59, 130, 246, 0.2)', color: 'white', borderRadius: '12px', marginBottom: '1rem', textAlign: 'center' }}>{msg}</div>}

                <form onSubmit={handleAuth}>
                    <input type="email" placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} />
                    <input type="password" placeholder="비밀번호" value={password} onChange={e => setPassword(e.target.value)} required style={inputStyle} />

                    {isSignUp && (
                        <>
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '16px 0 24px' }}></div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '16px' }}>기본 프로필 입력</h3>
                            
                            <input type="text" placeholder="이름 (실명)" value={name} onChange={e => setName(e.target.value)} required style={inputStyle} />
                            <input type="text" placeholder="전화번호 ('-' 생략)" value={phone} onChange={e => setPhone(e.target.value)} required style={inputStyle} />
                            
                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>생년월일</label>
                            <input type="date" value={birthday} onChange={e => setBirthday(e.target.value)} required style={inputStyle} />
                            
                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>포지션</label>
                            <select value={position} onChange={e => setPosition(e.target.value)} style={inputStyle}>
                                <option value="G">가드 (Guard)</option>
                                <option value="F">포워드 (Forward)</option>
                                <option value="C">센터 (Center)</option>
                            </select>

                            <input type="number" placeholder="농구 경력 (년 단위, 선택)" value={experience} onChange={e => setExperience(e.target.value)} style={inputStyle} />
                        </>
                    )}

                    <button type="submit" disabled={loading} style={{ width: '100%', padding: '16px', borderRadius: '12px', background: 'var(--color-primary)', color: 'white', border: 'none', fontWeight: 800, fontSize: '1.1rem', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '8px' }}>
                        {loading ? '처리 중...' : (isSignUp ? '가입하기' : '로그인')}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                    <button onClick={() => { setIsSignUp(!isSignUp); setMsg(''); }} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', textDecoration: 'underline' }}>
                        {isSignUp ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
                    </button>
                </div>
            </div>
        </div>
    );
};
