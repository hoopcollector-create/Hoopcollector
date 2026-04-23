import { useState, useEffect } from 'react';

/**
 * 네이버 지도 API 스크립트를 전역에서 한 번만 로드하도록 관리하는 훅입니다.
 */
/**
 * 네이버 지도 API 스크립트를 전역에서 한 번만 로드하도록 관리하는 훅입니다.
 */
export const useNaverMap = () => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // v1.0.2: Force rebuild for Vercel sync & reliable ID loading
        const clientId = import.meta.env.VITE_NAVER_MAP_CLIENT_ID || 'v5mt48x1bn';
        const scriptId = 'naver-map-script';
        
        // 1. 이미 네이버 객체가 로드 완료된 상태인지 확인
        if (window.naver && window.naver.maps && window.naver.maps.Service) {
            setIsLoaded(true);
            return;
        }

        // 2. 스크립트 로드 함수 정의
        const handleLoad = () => {
            // Geocoder 서비스까지 확실히 준비될 때까지 잠시 대기
            const checkReady = setInterval(() => {
                if (window.naver && window.naver.maps && window.naver.maps.Service) {
                    setIsLoaded(true);
                    clearInterval(checkReady);
                }
            }, 100);
            
            // 5초 후에도 준비 안되면 에러 처리
            setTimeout(() => clearInterval(checkReady), 5000);
        };

        const handleError = () => {
            setError("지도 스크립트를 불러올 수 없습니다. 네트워크를 확인해 주세요.");
        };

        // 3. 네이버 인증 실패 전역 핸들러
        (window as any).navermap_auth_error = (error: any) => {
            console.error("Naver Map Auth Error Detail:", error);
            setError("네이버 지도 인증 실패: NCP 콘솔에서 'Web 서비스 URL'에 현재 도메인이 등록되어 있는지, 그리고 'Web Dynamic Map' 서비스가 활성화되어 있는지 확인해 주세요.");
        };

        // 4. 스크립트 로드 상태 확인 및 생성
        let script = document.getElementById(scriptId) as HTMLScriptElement;

        if (!script) {
            script = document.createElement('script');
            script.id = scriptId;
            script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}&submodules=geocoder`;
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
            
            script.addEventListener('load', handleLoad);
            script.addEventListener('error', handleError);
        } else {
            // 이미 스크립트가 있다면 이벤트 리스너만 추가 (아직 로딩 중일 수 있으므로)
            if (script.hasAttribute('data-loaded')) {
                handleLoad();
            } else {
                script.addEventListener('load', handleLoad);
                script.addEventListener('error', handleError);
            }
        }

        return () => {
            if (script) {
                script.removeEventListener('load', handleLoad);
                script.removeEventListener('error', handleError);
            }
        };
    }, []);

    return { isLoaded, error };
};
