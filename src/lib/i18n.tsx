import { useState, useEffect, createContext, useContext } from 'react';

export type Language = 'ko' | 'en' | 'ja' | 'zh';

const translations = {
    ko: {
        common: {
            save: "저장",
            cancel: "취소",
            delete: "삭제",
            loading: "로딩 중...",
            confirm: "확인",
            back: "뒤로",
            more: "더 보기"
        },
        sidebar: {
            dashboard: "대시보드",
            match: "매치 및 모임",
            court: "코트 지도",
            coach: "코치 찾기",
            community: "커뮤니티",
            shop: "스토어",
            messages: "메시지 보관함",
            logout: "로그아웃",
            management: "관리자 메뉴",
            start_journey: "시작하기",
            mode_student: "STUDENT",
            mode_coach: "COACH",
            class_info: "수업 보러가기",
            terms: "정책 및 약관",
            coach_requests: "수업 요청 관리",
            coach_history: "수업기록 보관함",
            coach_schedule: "스케줄 관리",
            coach_grade: "등급 및 승급",
            coach_curriculum: "커리큘럼 열람실",
            coach_financials: "정산 및 수익관리",
            admin_users: "회원관리",
            admin_shop: "쇼핑몰 관리",
            admin_approvals: "가입승인",
            admin_regions: "지역관리"
        },
        dashboard: { home: "홈", booking: "예약", history: "내역", wallet: "지갑", security: "보안" },
        match: { create: "매치 만들기", filter_all: "전체", filter_pickup: "픽업 게임", filter_lesson: "레슨", filter_club: "클럽", join: "참여하기", wait: "대기 등록", full: "모집 완료" }
    },
    en: {
        common: { save: "Save", cancel: "Cancel", delete: "Delete", loading: "Loading...", confirm: "Confirm", back: "Back", more: "More" },
        sidebar: {
            dashboard: "Dashboard",
            match: "Explore Matches",
            court: "Court Map",
            coach: "Find Coach",
            community: "Community",
            shop: "Store",
            messages: "Messages",
            logout: "Logout",
            management: "Management",
            start_journey: "START JOURNEY",
            mode_student: "STUDENT",
            mode_coach: "COACH",
            class_info: "Browse Classes",
            terms: "Policy & Terms",
            coach_requests: "Requests",
            coach_history: "Archive",
            coach_schedule: "Schedule",
            coach_grade: "Grade & Level",
            coach_curriculum: "Curriculum",
            coach_financials: "Financials",
            admin_users: "User Admin",
            admin_shop: "Shop Admin",
            admin_approvals: "Approvals",
            admin_regions: "Regions"
        },
        dashboard: { home: "Home", booking: "Booking", history: "History", wallet: "Wallet", security: "Security" },
        match: { create: "Create Match", filter_all: "All", filter_pickup: "Pickup", filter_lesson: "Lesson", filter_club: "Club", join: "Join Now", wait: "Waitlist", full: "Full" }
    },
    ja: {
        common: { save: "保存", cancel: "キャンセル", delete: "削除", loading: "読み込み中...", confirm: "確認", back: "戻る", more: "もっと見る" },
        sidebar: {
            dashboard: "ダッシュボード",
            match: "マッチ探す",
            court: "コート地図",
            coach: "コーチ探す",
            community: "コミュニティ",
            shop: "ストア",
            messages: "メッセージ",
            logout: "ログアウト",
            management: "管理メニュー",
            start_journey: "スタート",
            mode_student: "STUDENT",
            mode_coach: "COACH",
            class_info: "レッスン一覧",
            terms: "規約とポリシー",
            coach_requests: "リクエスト",
            coach_history: "履歴",
            coach_schedule: "スケジュール",
            coach_grade: "ランク",
            coach_curriculum: "カリキュラム",
            coach_financials: "収익管理",
            admin_users: "会員管理",
            admin_shop: "ショップ管理",
            admin_approvals: "承認",
            admin_regions: "地域管理"
        },
        dashboard: { home: "ホーム", booking: "予約", history: "履歴", wallet: "ウォレット", security: "セキュリティ" },
        match: { create: "マッチ作成", filter_all: "すべて", filter_pickup: "ピックアップ", filter_lesson: "レッスン", filter_club: "クラブ", join: "参加する", wait: "待機登録", full: "募集終了" }
    },
    zh: {
        common: { save: "保存", cancel: "取消", delete: "删除", loading: "加载中...", confirm: "确认", back: "返回", more: "更多" },
        sidebar: {
            dashboard: "控制面板",
            match: "寻找比赛",
            court: "球场地图",
            coach: "寻找教练",
            community: "社区",
            shop: "商店",
            messages: "消息",
            logout: "登出",
            management: "管理菜单",
            start_journey: "开始之旅",
            mode_student: "STUDENT",
            mode_coach: "COACH",
            class_info: "浏览课程",
            terms: "政策与条款",
            coach_requests: "预约管理",
            coach_history: "课程存档",
            coach_schedule: "日程管理",
            coach_grade: "等级升级",
            coach_curriculum: "课程中心",
            coach_financials: "结算收益",
            admin_users: "会员管理",
            admin_shop: "商店管理",
            admin_approvals: "审核",
            admin_regions: "区域管理"
        },
        dashboard: { home: "主页", booking: "预约", history: "历史", wallet: "钱包", security: "安全" },
        match: { create: "创建比赛", filter_all: "全部", filter_pickup: "接波", filter_lesson: "课程", filter_club: "俱乐部", join: "立即加入", wait: "等候名单", full: "招募完成" }
    }
};

type TranslationKeys = typeof translations.ko;

interface I18nContextType {
    lang: Language;
    setLang: (lang: Language) => void;
    t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [lang, setLang] = useState<Language>(() => {
        return (localStorage.getItem('hc_lang') as Language) || 'ko';
    });

    useEffect(() => {
        localStorage.setItem('hc_lang', lang);
        document.documentElement.lang = lang;
    }, [lang]);

    const t = (keyPath: string) => {
        const keys = keyPath.split('.');
        let current: any = translations[lang];
        for (const key of keys) {
            if (current[key] === undefined) return keyPath;
            current = current[key];
        }
        return current;
    };

    return (
        <I18nContext.Provider value={{ lang, setLang, t }}>
            {children}
        </I18nContext.Provider>
    );
};

export const useTranslation = () => {
    const context = useContext(I18nContext);
    if (!context) throw new Error('useTranslation must be used within I18nProvider');
    return context;
};
