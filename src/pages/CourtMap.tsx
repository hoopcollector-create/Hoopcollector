import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';
import { useNaverMap } from '../hooks/useNaverMap';

interface CourtLocation {
    lat: number;
    lng: number;
    address: string;
    class_count: number;
}

export const CourtMap: React.FC = () => {
    const mapElement = useRef<HTMLDivElement>(null);
    const { isLoaded: scriptLoaded, error: scriptError } = useNaverMap();
    const [locations, setLocations] = useState<CourtLocation[]>([]);
    const [loading, setLoading] = useState(true);
    const [mapInstance, setMapInstance] = useState<any>(null);

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
            
            // Basic grouping by coordinates
            const grouped = (data || []).reduce((acc: Record<string, CourtLocation>, req: any) => {
                const key = `${Number(req.lat).toFixed(5)}_${Number(req.lng).toFixed(5)}`;
                if (!acc[key]) {
                    acc[key] = { lat: Number(req.lat), lng: Number(req.lng), address: req.address || "알 수 없는 장소", class_count: 0 };
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

    // Initialize Map
    useEffect(() => {
        if (!scriptLoaded || !mapElement.current || !window.naver) return;

        // Even if locations are empty, we should initialize the map to show functionality
        const initialCenter = new window.naver.maps.LatLng(37.5666805, 126.9784147); // Seoul City Hall
        
        const map = new window.naver.maps.Map(mapElement.current, {
            center: initialCenter,
            zoom: 11,
            mapDataControl: false,
        });

        setMapInstance(map);

    }, [scriptLoaded]);

    // Handle Markers when data or map is ready
    useEffect(() => {
        if (!mapInstance || locations.length === 0) return;

        // Add markers
        locations.forEach(loc => {
            const marker = new window.naver.maps.Marker({
                position: new window.naver.maps.LatLng(loc.lat, loc.lng),
                map: mapInstance,
                icon: {
                    content: `
                        <div style="background: var(--color-primary); border-radius: 50%; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.4); cursor: pointer;">
                            <span style="color: white; font-weight: 900; font-size: 11px;">${loc.class_count}</span>
                        </div>
                    `,
                    anchor: new window.naver.maps.Point(13, 13)
                }
            });

            const infoWindow = new window.naver.maps.InfoWindow({
                content: `
                    <div style="padding:12px; min-width: 150px; background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
                        <div style="color:#000; font-size:13px; font-weight:800; margin-bottom: 4px;">${loc.address}</div>
                        <div style="color:var(--color-primary); font-size:11px; font-weight:700;">총 ${loc.class_count}회 수업 진행됨</div>
                    </div>
                `,
                borderWidth: 0,
                backgroundColor: 'transparent',
                disableAnchor: true,
                pixelOffset: new window.naver.maps.Point(0, -10)
            });

            window.naver.maps.Event.addListener(marker, "click", () => {
                if (infoWindow.getMap()) {
                    infoWindow.close();
                } else {
                    infoWindow.open(mapInstance, marker);
                }
            });
        });

        // Fit bounds if multiple locations
        if (locations.length > 1) {
            const bounds = new window.naver.maps.LatLngBounds();
            locations.forEach(loc => bounds.extend(new window.naver.maps.LatLng(loc.lat, loc.lng)));
            mapInstance.fitBounds(bounds);
        } else if (locations.length === 1) {
            mapInstance.setCenter(new window.naver.maps.LatLng(locations[0].lat, locations[0].lng));
            mapInstance.setZoom(14);
        }

    }, [mapInstance, locations]);

    return (
        <div style={{ color: 'white', maxWidth: '1200px', margin: '0 auto', paddingBottom: '100px' }}>
            <div style={{ padding: '0 20px', marginBottom: '2rem' }} className="page-header">
                <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, marginBottom: '0.5rem', letterSpacing: '-0.04em' }}>HOOPCOLLECTOR MAP</h1>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.1rem' }}>대한민국 농구인들이 훕콜렉터와 함께 땀 흘린 코트의 흔적입니다.</p>
            </div>

            <div style={{ padding: '0 20px' }}>
                <div style={{ width: '100%', height: '70vh', borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', background: '#161618', position: 'relative', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
                    <div ref={mapElement} style={{ width: '100%', height: '100%' }} />
                    
                    {scriptError && (
                        <div style={overlayStyle}>
                            <AlertCircle size={40} color="#ef4444" style={{ marginBottom: '16px' }} />
                            <div style={{ fontWeight: 800, textAlign: 'center', maxWidth: '300px' }}>{scriptError}</div>
                        </div>
                    )}

                    {loading && (
                        <div style={overlayStyle}>
                            <Loader2 className="animate-spin" size={32} style={{ marginBottom: '16px', color: 'var(--color-primary)' }} />
                            <div style={{ fontWeight: 800 }}>지도 데이터를 수집하는 중...</div>
                        </div>
                    )}

                    {!loading && !scriptError && locations.length === 0 && (
                        <div style={{ ...overlayStyle, background: 'rgba(0,0,0,0.3)', pointerEvents: 'none' }}>
                            <div style={{ padding: '16px 24px', background: 'rgba(0,0,0,0.8)', borderRadius: '16px', fontWeight: 800, border: '1px solid rgba(255,255,255,0.1)' }}>
                                아직 등록된 코트 데이터가 없습니다. 첫 수업을 시작해 보세요!
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const overlayStyle: React.CSSProperties = { 
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 10 
};
