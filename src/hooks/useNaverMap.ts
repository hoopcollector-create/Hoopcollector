import { useState, useEffect } from 'react';

/**
 * 네이버 지도 API 스크립트를 전역에서 한 번만 로드하도록 관리하는 훅입니다.
 */
export const useNaverMap = () => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // 이미 로드되어 있는 경우
        if (window.naver && window.naver.maps) {
            setIsLoaded(true);
            return;
        }

        // .env에서 먼저 찾고, 없으면 사용자가 알려준 ID를 직접 사용 (확실한 연동 보장)
        const clientId = import.meta.env.VITE_NAVER_MAP_CLIENT_ID || 'v5mt48x1bn';
        
        if (!clientId || clientId === 'YOUR_CLIENT_ID') {
            const msg = "VITE_NAVER_MAP_CLIENT_ID가 설정되지 않았습니다. .env 파일을 확인해 주세요.";
            console.error(msg);
            setError(msg);
            return;
        }

        // 스크립트 중복 방지를 위해 이미 DOM에 있는지 확인
        const scriptId = 'naver-map-script';
        let script = document.getElementById(scriptId) as HTMLScriptElement;

        if (!script) {
            script = document.createElement('script');
            script.id = scriptId;
            script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}&submodules=geocoder`;
            script.async = true;
            document.head.appendChild(script);
        }

        const handleLoad = () => setIsLoaded(true);
        const handleError = () => {
            const msg = "네이버 지도 스크립트 로드에 실패했습니다. 네트워크 연결이나 도메인 설정을 확인해 주세요.";
            console.error(msg);
            setError(msg);
        };

        // 네이버 지도 인증 실패 시 전역 핸들러 등록
        (window as any).navermap_auth_error = () => {
            const msg = "네이버 지도 인증에 실패했습니다. [내 애플리케이션 > 서비스 설정]에서 'Web Dynamic Map'이 활성화되어 있는지, 그리고 현재 도메인(localhost 등)이 정확히 등록되어 있는지 확인해 주세요.";
            console.error(msg);
            setError(msg);
        };

        script.addEventListener('load', handleLoad);
        script.addEventListener('error', handleError);

        // 이미 로드된 상태에서 다시 마운트된 경우 대응
        if (window.naver && window.naver.maps) {
            setIsLoaded(true);
        }

        return () => {
            script.removeEventListener('load', handleLoad);
            script.removeEventListener('error', handleError);
        };
    }, []);

    return { isLoaded, error };
};
