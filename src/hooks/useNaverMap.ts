import { useState, useEffect } from 'react';

export const useNaverMap = () => {
    const [isLoaded, setIsLoaded] = useState(!!(window.naver && window.naver.maps && window.naver.maps.Service));
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (window.naver && window.naver.maps && window.naver.maps.Service) {
            setIsLoaded(true);
            return;
        }

        const clientId = import.meta.env.VITE_NAVER_MAP_CLIENT_ID || 'v5mt48x1bn';
        const scriptId = 'naver-map-script-v3';

        let script = document.getElementById(scriptId) as HTMLScriptElement;

        // Geocoder 서브모듈 등 완벽하게 로딩되었는지 확인용 함수
        const waitForService = () => {
            const checkReady = setInterval(() => {
                if (window.naver && window.naver.maps && window.naver.maps.Service) {
                    setIsLoaded(true);
                    clearInterval(checkReady);
                }
            }, 50);
            
            // 5초 타임아웃
            setTimeout(() => clearInterval(checkReady), 5000);
        };

        if (!script) {
            script = document.createElement('script');
            script.id = scriptId;
            // document.write 차단을 방지하기 위해 정적 <head> 태그 대신 동적 생성 + async 필수
            script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}&submodules=geocoder`;
            script.async = true; // 비동기 로딩으로 document.write 경고 및 서브모듈 차단 회피
            document.head.appendChild(script);

            script.onload = waitForService;

            script.onerror = () => {
                setError("지도 스크립트를 불러올 수 없습니다. 네트워크 문제이거나 브라우저 설정 때문일 수 있습니다.");
            };
        } else {
            // 스크립트가 이미 DOM에 존재하면 준비될 때까지 기다림 (HMR 등 대비)
            waitForService();
        }

        // 인증 실패 시 에러 감지 (네이버 맵 콜백)
        (window as any).navermap_auth_error = (error: any) => {
            console.error("Naver Map Auth Error Detail:", error);
            setError("네이버 지도 인증 실패 (Error 200). NCP 콘솔에 도메인 정상 등록 여부를 확인하세요.");
        };

    }, []);

    return { isLoaded, error };
};
