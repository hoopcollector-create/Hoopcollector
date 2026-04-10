# Hoopcollector

당신의 농구 라이프 파트너, **Hoopcollector** 관리 플랫폼입니다.

## 🚀 기술 스택
- **Frontend**: React + TypeScript + Vite
- **Backend/Auth**: Supabase
- **Deployment**: Vercel

## 🛠 주요 기능
- 농구 코치 및 클래스 관리
- 실시간 예약 및 일정 관리
- 커뮤니티 게시판 및 게시글 관리
- 관리자 대시보드 및 승인 시스템

## 📦 설치 및 실행

### 필수 조건
- Node.js (v18+)
- npm 또는 yarn

### 로컬 실행
```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### 환경 변수 설정
`.env` 파일에 다음 항목을 설정하세요:
- `VITE_SUPABASE_URL`: Supabase 프로젝트 URL
- `VITE_SUPABASE_ANON_KEY`: Supabase 익명 키

## 🌐 배포 (Vercel)
이 프로젝트는 Vercel에 최적화되어 있습니다. GitHub 저장소를 연결하면 자동으로 배포됩니다.
