import React, { useEffect, useRef, useState } from 'react';
import { useNaverMap } from '../hooks/useNaverMap';
import { Loader2, MapPin } from 'lucide-react';

interface NaverMapSelectorProps {
  onLocationSelected: (lat: number, lng: number, address: string) => void;
  defaultLocation?: { lat: number; lng: number };
}

export const NaverMapSelector: React.FC<NaverMapSelectorProps> = ({ onLocationSelected, defaultLocation }) => {
  const mapElement = useRef<HTMLDivElement>(null);
  const { isLoaded: scriptLoaded, error: scriptError } = useNaverMap();
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [markerInstance, setMarkerInstance] = useState<any>(null);
  const [isGpsLoading, setIsGpsLoading] = useState(false);

  const updateLocation = (lat: number, lng: number, mapObj: any, markerObj: any) => {
    const coord = new window.naver.maps.LatLng(lat, lng);
    mapObj.setCenter(coord);
    markerObj.setPosition(coord);

    if (window.naver.maps.Service && window.naver.maps.Service.reverseGeocode) {
      window.naver.maps.Service.reverseGeocode({
        coords: coord,
        orders: [
          window.naver.maps.Service.OrderType.ADDR,
          window.naver.maps.Service.OrderType.ROAD_ADDR
        ].join(',')
      }, function(status: any, response: any) {
        if (status === window.naver.maps.Service.Status.OK) {
          const result = response.v2;
          const items = result.address;
          const finalAddress = items.roadAddress || items.jibunAddress || "알 수 없는 주소";
          onLocationSelected(lat, lng, finalAddress);
        }
      });
    }
  };

  const handleMyLocation = () => {
    if (!navigator.geolocation) {
      alert("이 브라우저에서는 위치 정보를 지원하지 않습니다.");
      return;
    }

    setIsGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        if (mapInstance && markerInstance) {
          updateLocation(latitude, longitude, mapInstance, markerInstance);
        }
        setIsGpsLoading(false);
      },
      (error) => {
        console.error("GPS Error:", error);
        alert("위치 정보를 가져올 수 없습니다. 권한 설정을 확인해 주세요.");
        setIsGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    if (!scriptLoaded || !mapElement.current || !window.naver) return;

    // Default to Seoul if not provided
    const initLat = defaultLocation?.lat ?? 37.5666805;
    const initLng = defaultLocation?.lng ?? 126.9784147;

    const location = new window.naver.maps.LatLng(initLat, initLng);
    
    const map = new window.naver.maps.Map(mapElement.current, {
      center: location,
      zoom: 15,
      mapDataControl: false,
      scaleControl: false
    });
    
    const marker = new window.naver.maps.Marker({
      position: location,
      map: map
    });

    setMapInstance(map);
    setMarkerInstance(marker);

    // Event listener for map clicks
    window.naver.maps.Event.addListener(map, 'click', function(e: any) {
        marker.setPosition(e.coord);
        
        // Reverse Geocoding to get Address
        if (window.naver.maps.Service && window.naver.maps.Service.reverseGeocode) {
            window.naver.maps.Service.reverseGeocode({
                coords: e.coord,
                orders: [
                    window.naver.maps.Service.OrderType.ADDR,
                    window.naver.maps.Service.OrderType.ROAD_ADDR
                ].join(',')
            }, function(status: any, response: any) {
                if (status !== window.naver.maps.Service.Status.OK) {
                    onLocationSelected(e.coord.y, e.coord.x, "주소 확인 불가");
                    return;
                }
                
                const result = response.v2;
                const items = result.address;
                const finalAddress = items.roadAddress || items.jibunAddress || "알 수 없는 주소";
                onLocationSelected(e.coord.y, e.coord.x, finalAddress);
            });
        } else {
            // Fallback if Geocoder not loaded
            onLocationSelected(e.coord.y, e.coord.x, "주소 서비스 일시 중단");
        }
    });

  }, [scriptLoaded]);

  return (
    <div style={{ display: 'grid', gap: '8px', position: 'relative' }}>
      {!scriptLoaded && !scriptError && (
        <div style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', gap: 12 }}>
          <Loader2 className="animate-spin" size={24} />
          <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>지도 불러오는 중...</div>
        </div>
      )}

      {scriptError && (
        <div style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)', padding: 20 }}>
          <div style={{ color: '#ef4444', fontWeight: 800, fontSize: '0.9rem', textAlign: 'center' }}>{scriptError}</div>
        </div>
      )}

      <div style={{ position: 'relative' }}>
        <div 
          ref={mapElement} 
          style={{ 
            width: '100%', height: '300px', borderRadius: '12px', 
            border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', 
            display: scriptLoaded ? 'block' : 'none' 
          }} 
        />
        
        {scriptLoaded && (
          <button
            onClick={handleMyLocation}
            disabled={isGpsLoading}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              zIndex: 10,
              background: isGpsLoading ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.9)',
              border: 'none',
              borderRadius: '8px',
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s'
            }}
            title="내 위치 찾기"
          >
            {isGpsLoading ? (
              <Loader2 className="animate-spin" size={18} color="#000" />
            ) : (
              <MapPin size={18} color="#ee2c2c" />
            )}
          </button>
        )}
      </div>
      
      {scriptLoaded && (
        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <MapPin size={12} />
          <span>지도를 클릭하거나 우측 상단 버튼으로 현 위치를 찾아보세요.</span>
        </div>
      )}
    </div>
  );
};
