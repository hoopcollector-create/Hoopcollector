import React from 'react';
import { 
    Calendar, Clock, MapPin, Users, Award, 
    DollarSign, Package, Megaphone, Info, Zap
} from 'lucide-react';

interface MatchInfoTabProps {
    match: any;
}

export const MatchInfoTab: React.FC<MatchInfoTabProps> = ({ match }) => {
    const isRecurring = match.is_recurring;
    const startAt = new Date(match.start_at);
    const endAt = new Date(match.end_at);
    
    const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    const dateStr = `${startAt.getFullYear()}년 ${startAt.getMonth() + 1}월 ${startAt.getDate()}일 (${dayNames[startAt.getDay()]})`;
    const timeRange = `${startAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} ~ ${endAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`;

    return (
        <div style={container}>
            {/* Host Announcement */}
            {match.notice && (
                <div style={noticeBox}>
                    <div style={noticeHeader}>
                        <Megaphone size={16} />
                        <span>방장 공지사항</span>
                    </div>
                    <div style={noticeContent}>
                        {match.notice}
                    </div>
                </div>
            )}

            {/* Core Info Grid */}
            <div style={infoGrid}>
                <InfoItem icon={Calendar} label="날짜" value={dateStr} />
                <InfoItem icon={Clock} label="시간" value={timeRange} />
                <div style={fullRow}>
                    <InfoItem icon={MapPin} label="장소" value={match.place_name} subValue={match.address} />
                </div>
                <InfoItem icon={Award} label="참여 조건" value={match.required_grade === 'all' ? '전체 등급 가능' : `${match.required_grade} 이상 전용`} />
                <InfoItem icon={Users} label="모집 인원" value={`최대 ${match.max_players}명 참여 가능`} />
                <InfoItem icon={DollarSign} label="참가비" value={match.fee_amount > 0 ? `${match.fee_amount.toLocaleString()}원` : '무료'} />
                <InfoItem icon={Package} label="준비물" value={match.supplies || '농구화, 유니폼'} />
            </div>

            {/* Description Section */}
            <div style={section}>
                <h3 style={sectionTitle}>모입 상세 설명</h3>
                <div style={description}>
                    {match.description || '상세 설명이 없습니다.'}
                </div>
            </div>

            {/* Recurring Info if applies */}
            {isRecurring && (
                <div style={recurringFooter}>
                    <Zap size={14} fill="currentColor" />
                    <span>이 모임은 정기적으로 개최되는 <strong>정기 모임</strong>입니다.</span>
                </div>
            )}
        </div>
    );
};

const InfoItem = ({ icon: Icon, label, value, subValue }: any) => (
    <div style={infoItemWrap}>
        <div style={iconBox}><Icon size={18} /></div>
        <div style={textWrap}>
            <div style={itemLabel}>{label}</div>
            <div style={itemValue}>{value}</div>
            {subValue && <div style={itemSubValue}>{subValue}</div>}
        </div>
    </div>
);

// Styles
const container: React.CSSProperties = { padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' };

const noticeBox: React.CSSProperties = { padding: '24px', borderRadius: '24px', background: 'rgba(249, 115, 22, 0.05)', border: '1px solid rgba(249, 115, 22, 0.2)', display: 'flex', flexDirection: 'column', gap: '12px' };
const noticeHeader: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)', fontSize: '0.85rem', fontWeight: 900 };
const noticeContent: React.CSSProperties = { fontSize: '1rem', fontWeight: 700, lineHeight: 1.6, color: 'white', whiteSpace: 'pre-wrap' };

const infoGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' };
const fullRow: React.CSSProperties = { gridColumn: '1 / -1' };

const infoItemWrap: React.CSSProperties = { display: 'flex', gap: '16px', alignItems: 'flex-start' };
const iconBox: React.CSSProperties = { width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)', flexShrink: 0 };
const textWrap: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '2px' };
const itemLabel: React.CSSProperties = { fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' };
const itemValue: React.CSSProperties = { fontSize: '1rem', fontWeight: 800, color: 'white' };
const itemSubValue: React.CSSProperties = { fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', marginTop: '4px' };

const section: React.CSSProperties = { borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '32px' };
const sectionTitle: React.CSSProperties = { fontSize: '1.1rem', fontWeight: 900, marginBottom: '16px' };
const description: React.CSSProperties = { fontSize: '0.95rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.7)', whiteSpace: 'pre-wrap', background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '16px' };

const recurringFooter: React.CSSProperties = { padding: '16px 20px', borderRadius: '16px', background: 'rgba(139, 92, 246, 0.05)', color: '#a78bfa', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '10px', marginTop: '20px' };
