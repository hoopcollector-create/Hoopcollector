import React, { useEffect, useRef, useState } from 'react';

// Naver Map Type Extensions
declare global {
  interface Window {
    naver: any;
  }
}

interface NaverMapSelectorProps {
  onLocationSelected: (lat: number, lng: number, address: string) => void;
  defaultLocation?: { lat: number; lng: number };
}

export const NaverMapSelector: React.FC<NaverMapSelectorProps> = ({ onLocationSelected, defaultLocation }) => {
  const mapElement = useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [markerInstance, setMarkerInstance] = useState<any>(null);

  useEffect(() => {
    // 1. Load Naver Map Script Dynamically
    if (window.naver && window.naver.maps) {
      setScriptLoaded(true);
      return;
    }
    
    // Fallback if VITE_NAVER_MAP_CLIENT_ID is not set in production
    const clientId = import.meta.env.VITE_NAVER_MAP_CLIENT_ID || 'YOUR_CLIENT_ID';
    
    // In actual implementation, we must wait for the user to provide the Client ID through .env or database
    if (clientId === 'YOUR_CLIENT_ID') {
        console.warn("Naver map client ID is not provided. Please add VITE_NAVER_MAP_CLIENT_ID to your .env file.");
    }

    const script = document.createElement('script');
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}&submodules=geocoder`;
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    document.head.appendChild(script);

    return () => {
      // Optional: Cleanup if necessary
    };
  }, []);

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
    });

  }, [scriptLoaded]);

  return (
    <div style={{ display: 'grid', gap: '8px' }}>
      {!scriptLoaded && <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>지도 불러오는 중...</div>}
      <div ref={mapElement} style={{ width: '100%', height: '300px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', display: scriptLoaded ? 'block' : 'none' }} />
      <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>* 지도를 클릭하여 정확한 장소를 선택해 주세요.</div>
    </div>
  );
};
