import { useState, useEffect } from 'react';

export const usePWAInstall = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Check if already in standalone mode
        const checkStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                               (window.navigator as any).standalone === true;
        setIsStandalone(checkStandalone);

        // Check if it's iOS
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(isIOSDevice);

        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            if (!checkStandalone) {
                setIsInstallable(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handler);

        // For iOS, it's installable if not standalone
        if (isIOSDevice && !checkStandalone) {
            setIsInstallable(true);
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const install = async () => {
        if (!deferredPrompt) return false;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setIsInstallable(false);
            setDeferredPrompt(null);
            return true;
        }
        return false;
    };

    return { isInstallable, isIOS, isStandalone, install };
};
