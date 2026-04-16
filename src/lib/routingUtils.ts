// routingUtils.ts

// Calculates distance in kilometers between two GPS coordinates
export function getDistanceKms(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1); 
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
      ; 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const d = R * c; // Distance in km
    return d;
}

function deg2rad(deg: number) {
    return deg * (Math.PI/180);
}

/**
 * Estimate travel time in minutes based on distance and transport mode.
 * - Car: base speed ~ 30km/h in city + 5 mins buffer
 * - Transit: base speed ~ 15km/h in city + 10 mins buffer for walking/wait
 */
export function estimateTravelTimeMin(distanceKm: number, mode: 'car' | 'transit' = 'transit'): number {
    if (distanceKm < 0.5) return 10; // Under 500m is just a 10 min walk
    
    if (mode === 'car') {
        const hours = distanceKm / 30; // 30 km/h avg city speed
        const mins = (hours * 60) + 5; // 5 min buffer (parking, traffic)
        return Math.ceil(mins);
    } else {
        const hours = distanceKm / 15; // 15 km/h avg transit speed
        const mins = (hours * 60) + 15; // 15 min buffer (waiting, walking)
        return Math.ceil(mins);
    }
}
