import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

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
                            <th style={{ padding: '12px' }}>이름</th>
                            <th style={{ padding: '12px' }}>등급</th>
                            <th style={{ padding: '12px' }}>전화번호</th>
                            <th style={{ padding: '12px' }}>토큰</th>
                            <th style={{ padding: '12px' }}>활동점수</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u: any) => (
                            <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '12px' }}>{u.name}</td>
                                <td style={{ padding: '12px' }}><span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.2)', fontSize: '0.75rem' }}>{u.coach_grade || '-'}</span></td>
                                <td style={{ padding: '12px' }}>{u.phone || '-'}</td>
                                <td style={{ padding: '12px' }}>{u.total_tokens || 0}</td>
                                <td style={{ padding: '12px' }}>{u.activity_score || 0}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
