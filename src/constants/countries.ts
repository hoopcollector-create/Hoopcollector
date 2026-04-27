export interface Country {
    code: string;
    name: string;
    flag: string;
    timezone: string;
}

export const COUNTRIES: Country[] = [
    { code: 'KR', name: '대한민국', flag: '🇰🇷', timezone: 'Asia/Seoul' },
    { code: 'JP', name: '일본', flag: '🇯🇵', timezone: 'Asia/Tokyo' },
    { code: 'US_NY', name: '미국 (뉴욕)', flag: '🇺🇸', timezone: 'America/New_York' },
    { code: 'US_LA', name: '미국 (LA)', flag: '🇺🇸', timezone: 'America/Los_Angeles' },
    { code: 'GB', name: '영국', flag: '🇬🇧', timezone: 'Europe/London' },
    { code: 'FR', name: '프랑스', flag: '🇫🇷', timezone: 'Europe/Paris' },
    { code: 'CN', name: '중국', flag: '🇨🇳', timezone: 'Asia/Shanghai' },
    { code: 'SG', name: '싱가포르', flag: '🇸🇬', timezone: 'Asia/Singapore' },
    { code: 'AU', name: '호주 (시드니)', flag: '🇦🇺', timezone: 'Australia/Sydney' },
];

export const getCountryByCode = (code: string) => COUNTRIES.find(c => c.code === code) || COUNTRIES[0];
export const getCountryByTimezone = (tz: string) => COUNTRIES.find(c => c.timezone === tz) || COUNTRIES[0];
