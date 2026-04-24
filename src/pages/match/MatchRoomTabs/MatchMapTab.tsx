import React, { useEffect } from 'react';
import { MapPin } from 'lucide-react';

export const MatchMapTab: React.FC<{ match: any }> = ({ match }) => {
    const mapRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!mapRef.current || !window.naver || !match.latitude) return;

        const position = new window.naver.maps.LatLng(match.latitude, match.longitude);
        const map = new window.naver.maps.Map(mapRef.current, {
            center: position,
            zoom: 16,
            logoControl: false
        });

        new window.naver.maps.Marker({
            position,
            map,
            icon: {
                content: `<div style="background: var(--accent-primary); color: white; padding: 6px 12px; border-radius: 12px; font-weight: 900; border: 2px solid white; box-shadow: 0 4px 15px rgba(0,0,0,0.4);">${match.place_name}</div>`,
                anchor: new window.naver.maps.Point(20, 20)
            }
        });
    }, [match]);

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '24px' }}>
            <div ref={mapRef} style={{ flex: 1, borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }} />
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 900 }}>{match.place_name}</div>
                    <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>{match.address}</div>
                </div>
                <button 
                    onClick={() => window.open(`https://map.naver.com/v5/search/${encodeURIComponent(match.address)}`, '_blank')}
                    style={{ padding: '12px 20px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontWeight: 800, cursor: 'pointer' }}
                >
                    길찾기
                </button>
            </div>
        </div>
    );
};
