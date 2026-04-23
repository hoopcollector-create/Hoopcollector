export type BasketballLevel = 'FOUNDATION' | 'CONTROL' | 'ATTACK' | 'GAME_APPLY';

export interface CurriculumItem {
    id: string;
    category: 'Ball Handling' | 'Move' | 'Cut' | 'Action';
    name: string;
    description?: string;
}

export interface CurriculumLevel {
    id: BasketballLevel;
    title: string;
    subtitle: string;
    items: CurriculumItem[];
}

export const SCORE_MEANING: Record<number, string> = {
    1: '수행 불가',
    2: '불안정',
    3: '수행 가능',
    4: '안정',
    5: '자동화'
};

export const CURRICULUM_DATA: Record<BasketballLevel, CurriculumLevel> = {
    'FOUNDATION': {
        id: 'FOUNDATION',
        title: 'LEVEL 1. FOUNDATION',
        subtitle: '최우선: 슛·레이업 마무리 및 기본 움직임',
        items: [
            { id: 'f-m-1', category: 'Move', name: '정지 슛 (릴리즈/손 모양/밸런스)' },
            { id: 'f-m-2', category: 'Move', name: '근거리 슛 (반복 안정)' },
            { id: 'f-m-3', category: 'Move', name: '레이업 (좌/우 양손)' },
            { id: 'f-m-4', category: 'Move', name: '원투스텝 레이업' },
            { id: 'f-m-5', category: 'Move', name: '드리블 후 레이업' },
            { id: 'f-m-6', category: 'Move', name: '트리플 쓰렛 (Triple Threat)' },
            { id: 'f-m-7', category: 'Move', name: '잽스텝 (Jab Step)' },
            { id: 'f-m-8', category: 'Move', name: '립스루 (Rip Through)' },
            { id: 'f-m-9', category: 'Move', name: '펌프페이크 (Pump Fake)' },
            { id: 'f-bh-1', category: 'Ball Handling', name: '크로스 드리블 (앞뒤 이동)' },
            { id: 'f-bh-2', category: 'Ball Handling', name: '레그 스루 (지그재그)' },
            { id: 'f-bh-3', category: 'Ball Handling', name: '스핀 무브 (방향 전환)' },
            { id: 'f-bh-4', category: 'Ball Handling', name: '비하인드 백 (적응)' },
            { id: 'f-c-1', category: 'Cut', name: '기본 컷 / 공간 이동' }
        ]
    },
    'CONTROL': {
        id: 'CONTROL',
        title: 'LEVEL 2. CONTROL',
        subtitle: '마무리 + 움직임의 완벽한 연결',
        items: [
            { id: 'c-m-1', category: 'Move', name: '다양한 각도 양손 레이업' },
            { id: 'c-m-2', category: 'Move', name: '미드레인지 슛' },
            { id: 'c-m-3', category: 'Move', name: '캐치 앤 슛' },
            { id: 'c-m-4', category: 'Move', name: '원드리블 슛' },
            { id: 'c-m-5', category: 'Move', name: '유로스텝 (Euro Step)' },
            { id: 'c-m-6', category: 'Move', name: 'Pinoy Step' },
            { id: 'c-m-7', category: 'Move', name: '스텝백 (Step Back)' },
            { id: 'c-m-8', category: 'Move', name: '헤지테이션 (Hesitation)' },
            { id: 'c-bh-1', category: 'Ball Handling', name: '크로스 (타이밍 조절)' },
            { id: 'c-bh-2', category: 'Ball Handling', name: '레그 스루 (위치 컨트롤)' },
            { id: 'c-bh-3', category: 'Ball Handling', name: '스핀 무브 (중심 이동)' },
            { id: 'c-bh-4', category: 'Ball Handling', name: '비하인드 백 (속도 변화)' },
            { id: 'c-c-1', category: 'Cut', name: 'Pop / Lift' },
            { id: 'c-c-2', category: 'Cut', name: 'Curl / Backdoor Cut' },
            { id: 'c-a-1', category: 'Action', name: 'Pick & Roll 기초 / 2:2' }
        ]
    },
    'ATTACK': {
        id: 'ATTACK',
        title: 'LEVEL 3. ATTACK',
        subtitle: '공격자로서의 상황 선택과 1:1 파괴력',
        items: [
            { id: 'a-m-1', category: 'Move', name: '컨택 피니시 (Contact Finish)' },
            { id: 'a-m-2', category: 'Move', name: '플로터 (Floater)' },
            { id: 'a-m-3', category: 'Move', name: '리버스 레이업' },
            { id: 'a-m-4', category: 'Move', name: '풀업 점퍼 (Pull-up Jumper)' },
            { id: 'a-m-5', category: 'Move', name: '스텝백 슛 (Step-back Shot)' },
            { id: 'a-bh-1', category: 'Ball Handling', name: '콤보 드리블 (Combo)' },
            { id: 'a-bh-2', category: 'Ball Handling', name: '리액션 드리블 (수비 반응)' },
            { id: 'a-c-1', category: 'Cut', name: '45 Cut' },
            { id: 'a-c-2', category: 'Cut', name: 'UCLA Cut / Iverson Cut' },
            { id: 'a-a-1', category: 'Action', name: 'Pick & Roll 응용 / Spain PNR / 3:3' }
        ]
    },
    'GAME_APPLY': {
        id: 'GAME_APPLY',
        title: 'LEVEL 4. GAME APPLY',
        subtitle: '실전 게임 적용 및 팀 전술 이해',
        items: [
            { id: 'g-m-1', category: 'Move', name: '경기 중 컨택 마무리' },
            { id: 'g-m-2', category: 'Move', name: '올바른 타이밍의 빠른 슛' },
            { id: 'g-m-3', category: 'Move', name: '3점 슛 (3pt Shot)' },
            { id: 'g-bh-1', category: 'Ball Handling', name: '실전 게임 드리블' },
            { id: 'g-bh-2', category: 'Ball Handling', name: '압박 상태 제한 드리블' },
            { id: 'g-c-1', category: 'Cut', name: '팀 로테이션 및 오프볼 무브먼트' },
            { id: 'g-a-1', category: 'Action', name: '5-out 전술 이해' },
            { id: 'g-a-2', category: 'Action', name: 'Horns / Flex / Zoom Action' }
        ]
    }
};

export const LEVEL_ORDER: BasketballLevel[] = ['FOUNDATION', 'CONTROL', 'ATTACK', 'GAME_APPLY'];
