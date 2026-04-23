import { useState, useEffect } from 'react';

/**
 * 네이버 지도 API 스크립트를 index.html에서 정적으로 로드하므로,
 * 이 훅은 단순히 전역 객체가 준비되었는지만 확인합니다.
 */
export const useNaverMap = () => {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // 이미 로드되어 있는지 확인
        if (window.naver && window.naver.maps && window.naver.maps.Service) {
            setIsLoaded(true);
            return;
        }

        // 로드될 때까지 반복 체크 (정적 로딩 대응)
        const checkReady = setInterval(() => {
            if (window.naver && window.naver.maps && window.naver.maps.Service) {
                setIsLoaded(true);
                clearInterval(checkReady);
            }
        }, 100);

        // 최대 10초 대기
        const timeout = setTimeout(() => clearInterval(checkReady), 10000);

        return () => {
            clearInterval(checkReady);
            clearTimeout(timeout);
        };
    }, []);

    return { isLoaded, error: null };
};
