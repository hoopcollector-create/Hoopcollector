import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { MapPin } from 'lucide-react';

declare global {
  interface Window {
    naver: any;
  }
}

interface CourtLocation {
    lat: number;
    lng: number;
    address: string;
    class_count: number;
}

export const CourtMap: React.FC = () => {
    const mapElement = useRef<HTMLDivElement>(null);
    const [scriptLoaded, setScriptLoaded] = useState(false);
    const [locations, setLocations] = useState<CourtLocation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCourtData();
    }, []);

    async function loadCourtData() {
        try {
            // Get all completed class requests with a location
            const { data, error } = await supabase
                .from('class_requests')
                .select('lat, lng, address')
                .eq('status', 'completed')
                .not('lat', 'is', null)
                .not('lng', 'is', null);

            if (error) throw error;
            
            // Basic grouping by coordinates (to show count of classes per court)
            const grouped = (data || []).reduce((acc: Record<string, CourtLocation>, req: any) => {
                const key = `${req.lat.toFixed(5)}_${req.lng.toFixed(5)}`;
                if (!acc[key]) {
                    acc[key] = { lat: Number(req.lat), lng: Number(req.lng), address: req.address, class_count: 0 };
                }
                acc[key].class_count += 1;
                return acc;
            }, {});

            setLocations(Object.values(grouped));
        } catch (e) {
            console.error("Failed to load court data", e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (!window.naver || !window.naver.maps) {
            const clientId = import.meta.env.VITE_NAVER_MAP_CLIENT_ID || 'YOUR_CLIENT_ID';
            const script = document.createElement('script');
            script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}`;
            script.async = true;
            script.onload = () => setScriptLoaded(true);
            document.head.appendChild(script);
        } else {
            setScriptLoaded(true);
        }
    }, []);

    useEffect(() => {
        if (!scriptLoaded || !mapElement.current || !window.naver || locations.length === 0) return;

        // Center map to Seoul or the bounds of all markers
        const map = new window.naver.maps.Map(mapElement.current, {
            center: new window.naver.maps.LatLng(37.5666805, 126.9784147),
            zoom: 11,
            mapDataControl: false,
        });

        // Add markers
        locations.forEach(loc => {
            const marker = new window.naver.maps.Marker({
                position: new window.naver.maps.LatLng(loc.lat, loc.lng),
                map: map,
                icon: {
                    content: `
                        <div style="background: var(--color-primary); border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">
                            <span style="color: white; font-weight: 900; font-size: 10px;">${loc.class_count}</span>
                        </div>
                    `,
                    anchor: new window.naver.maps.Point(12, 12)
                }
            });

            // Info window logic
            const infoWindow = new window.naver.maps.InfoWindow({
                content: `<div style="padding:10px; color:black; font-size:12px; font-weight:700;">${loc.address}<br/><span style="color:red;">총 ${loc.class_count}회 수업 진행</span></div>`,
                borderWidth: 0,
                disableAnchor: true,
                backgroundColor: 'rgba(255,255,255,0.9)',
                borderRadius: '8px'
            });

            window.naver.maps.Event.addListener(marker, "click", function() {
                if (infoWindow.getMap()) {
                    infoWindow.close();
                } else {
                    infoWindow.open(map, marker);
                }
            });
        });

    }, [scriptLoaded, locations]);

    return (
        <div style={{ color: 'white', maxWidth: '1200px', margin: '0 auto', paddingBottom: '100px' }}>
            <div style={{ padding: '0 20px', marginBottom: '2rem' }} className="page-header">
                <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, marginBottom: '0.5rem', letterSpacing: '-0.04em' }}>HOOPCOLLECTOR MAP</h1>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.2rem' }}>대한민국 농구인들이 훕콜렉터와 함께 땀 흘린 코트의 흔적입니다.</p>
            </div>

            <div style={{ padding: '0 20px' }}>
                <div style={{ width: '100%', height: '70vh', borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', background: '#0a0a0b', position: 'relative' }}>
                    <div ref={mapElement} style={{ width: '100%', height: '100%' }} />
                    
                    {loading && (
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
                            <div style={{ fontWeight: 800 }}>지도 데이터를 수집하는 중...</div>
                        </div>
                    )}

                    {!loading && locations.length === 0 && (
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
                            <div style={{ fontWeight: 800 }}>아직 등록된 코트 데이터가 없습니다. 첫 수업을 만들어주세요!</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
