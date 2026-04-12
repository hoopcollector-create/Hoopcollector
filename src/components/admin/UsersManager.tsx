import { supabase } from '../../lib/supabase';
import { User, Shield, Award, Edit2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export const UsersManager = () => {
    const [users, setUsers] = useState<any[]>([]);
    
    useEffect(() => { loadUsers(); }, []);
    
    async function loadUsers() {
        const { data } = await supabase.from('profiles').select('*').limit(50);
        setUsers(data || []);
    }

    return (
        <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>회원 관리</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '1.5rem' }}>가입된 모든 학생과 코치의 기본 정보를 열람합니다.</p>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <th style={{ padding: '15px' }}>사용자</th>
                            <th style={{ padding: '15px' }}>등급/역할</th>
                            <th style={{ padding: '15px' }}>연락처</th>
                            <th style={{ padding: '15px' }}>활동 정보</th>
                            <th style={{ padding: '15px' }}>관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u: any) => (
                            <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                                <td style={{ padding: '15px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-surface-L3)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                                            {u.photo_url ? (
                                                <img src={u.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <User size={18} style={{ opacity: 0.3 }} />
                                            )}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700 }}>{u.name || u.display_name || 'N/A'}</div>
                                            <div style={{ fontSize: '0.75rem', opacity: 0.4 }}>{u.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '15px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            {u.coach_grade ? <Shield size={12} color="var(--color-coach)" /> : <User size={12} />}
                                            <span style={{ fontSize: '0.85rem' }}>{u.coach_grade ? `코치 (${u.coach_grade})` : '학생'}</span>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '15px', fontSize: '0.85rem' }}>{u.phone || '-'}</td>
                                <td style={{ padding: '15px' }}>
                                    <div style={{ display: 'flex', gap: '15px', fontSize: '0.85rem' }}>
                                        <div title="토큰"><Award size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />{u.total_tokens || 0}</div>
                                        <div title="활동 점수">{u.activity_score || 0} pts</div>
                                    </div>
                                </td>
                                <td style={{ padding: '15px' }}>
                                    {u.coach_grade && (
                                        <Link 
                                            to={`/coach/${u.id}`} 
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', background: 'var(--bg-surface-L3)', color: 'white', textDecoration: 'none', fontSize: '0.75rem', border: '1px solid var(--border-subtle)' }}
                                        >
                                            <ExternalLink size={12} /> 프로필 관리
                                        </Link>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
