import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Star, ThumbsUp, MapPin, Smile, Frown, MessageSquare } from 'lucide-react';

export const MatchReviewTab: React.FC<{ matchId: string }> = ({ matchId }) => {
    const [review, setReview] = useState({
        fun: false,
        balanced_level: false,
        good_manner: false,
        good_place: false,
        want_again: false,
        level_gap: false,
        no_show_issue: false,
        comment: ''
    });
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const toggle = (key: string) => setReview(prev => ({ ...prev, [key as any]: !(prev as any)[key] }));

    const handleSubmit = async () => {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return alert('로그인 후 이용 가능합니다.');

        const { error } = await supabase.from('match_reviews').upsert({
            match_id: matchId,
            user_id: session.user.id,
            ...review
        }, { onConflict: 'match_id,user_id' });

        if (error) alert(error.message);
        else setSubmitted(true);
        setLoading(false);
    };

    if (submitted) return (
        <div style={emptyBox}>
            <div style={starCircle}><Star size={32} fill="white" /></div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '8px' }}>참중해주셔서 감사합니다!</h3>
            <p style={{ opacity: 0.5 }}>소중한 후기가 더 좋은 모임을 만듭니다.</p>
        </div>
    );

    return (
        <div style={container}>
            <h2 style={title}>오늘 게임은 어떠셨나요?</h2>
            <div style={reviewGrid}>
                <ReviewItem active={review.fun} label="정말 재미있었어요" onClick={() => toggle('fun')} emoji="🔥" />
                <ReviewItem active={review.good_manner} label="참여자들 매너가 좋았어요" onClick={() => toggle('good_manner')} emoji="🤝" />
                <ReviewItem active={review.balanced_level} label="실력이 비슷해서 팽팽했어요" onClick={() => toggle('balanced_level')} emoji="⚖️" />
                <ReviewItem active={review.good_place} label="장소가 마음에 들었어요" onClick={() => toggle('good_place')} emoji="🏀" />
                <ReviewItem active={review.want_again} label="다음에 또 오고 싶어요" onClick={() => toggle('want_again')} emoji="💯" />
                <ReviewItem active={review.level_gap} label="수준 차이가 컸어요" onClick={() => toggle('level_gap')} emoji="⚠️" />
            </div>

            <div style={{ marginTop: '24px' }}>
                <label style={label}>상세 후기 (선택)</label>
                <textarea 
                    placeholder="다른 참여자들에게 도움이 될 한마디를 남겨주세요." 
                    value={review.comment}
                    onChange={e => setReview(prev => ({ ...prev, comment: e.target.value }))}
                    style={textarea}
                />
            </div>

            <button onClick={handleSubmit} disabled={loading} style={submitBtn}>
                {loading ? '등록 중...' : '후기 제출하기'}
            </button>
        </div>
    );
};

const ReviewItem = ({ active, label, onClick, emoji }: any) => (
    <button onClick={onClick} style={active ? activeReview : inactiveReview}>
        <span style={{ fontSize: '1.2rem' }}>{emoji}</span>
        <span style={{ fontWeight: 700 }}>{label}</span>
    </button>
);

// Styles
const container: React.CSSProperties = { padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' };
const title: React.CSSProperties = { fontSize: '1.25rem', fontWeight: 950, marginBottom: '8px' };

const reviewGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr', gap: '12px' };
const inactiveReview: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left' };
const activeReview: React.CSSProperties = { ...inactiveReview, background: 'rgba(255,255,255,0.1)', borderColor: 'white', color: 'white' };

const label: React.CSSProperties = { fontSize: '0.8rem', fontWeight: 900, opacity: 0.4, textTransform: 'uppercase', marginBottom: '8px', display: 'block' };
const textarea: React.CSSProperties = { width: '100%', padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.04)', border: 'none', color: 'white', fontSize: '1rem', minHeight: '100px', boxSizing: 'border-box' };
const submitBtn: React.CSSProperties = { width: '100%', padding: '18px', borderRadius: '18px', background: 'var(--accent-primary)', border: 'none', color: 'white', fontWeight: 900, fontSize: '1.1rem', cursor: 'pointer', marginTop: '12px' };

const emptyBox: React.CSSProperties = { padding: '100px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' };
const starCircle: React.CSSProperties = { width: '80px', height: '80px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', boxShadow: '0 15px 30px rgba(249, 115, 22, 0.3)' };
