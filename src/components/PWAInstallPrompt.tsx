import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Download, X } from 'lucide-react';

export const PWAInstallPrompt: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Check if it's iOS
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(isIOSDevice);

        // For Android/PC
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            // Check if already in standalone mode
            if (!(window.matchMedia('(display-mode: standalone)').matches)) {
                setIsVisible(true);
            }
        });

        // If iOS, we check standalone manually
        if (isIOSDevice && !(window.navigator as any).standalone) {
            // Show prompt after 3 seconds for better UX
            const timer = setTimeout(() => setIsVisible(true), 3000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setIsVisible(false);
        }
        setDeferredPrompt(null);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div 
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    style={bannerContainer}
                >
                    <button onClick={() => setIsVisible(false)} style={floatingCloseBtn}>
                        <X size={18} />
                    </button>
                    <div style={contentWrap}>
                        <div style={iconWrap}>
                            <Smartphone size={24} color="var(--accent-primary)" />
                        </div>
                        <div style={textWrap}>
                            <div style={title}>앱으로 더 편하게 이용하세요</div>
                            <div style={desc}>
                                {isIOS 
                                    ? '브라우저 하단의 [공유] 버튼 클릭 후 "홈 화면에 추가"를 선택해 주세요.' 
                                    : '훕콜렉터를 홈 화면에 추가하고 실시간 알림을 받아보세요.'}
                            </div>
                        </div>
                        {!isIOS && (
                            <div style={actionRow}>
                                <button onClick={handleInstall} style={installBtn}>
                                    <Download size={16} /> 설치
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const bannerContainer: React.CSSProperties = {
    position: 'fixed',
    bottom: '80px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 'calc(100% - 40px)',
    maxWidth: '500px',
    background: 'rgba(20, 20, 22, 0.95)',
    backdropFilter: 'blur(10px)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '20px',
    padding: '16px 20px',
    zIndex: 9999,
    boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
};

const contentWrap: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
};

const iconWrap: React.CSSProperties = {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: 'var(--bg-surface-L2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
};

const textWrap: React.CSSProperties = {
    flex: 1
};

const title: React.CSSProperties = {
    fontSize: '15px',
    fontWeight: 800,
    color: 'white',
    marginBottom: '4px'
};

const desc: React.CSSProperties = {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 1.4
};

const actionRow: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
};

const installBtn: React.CSSProperties = {
    padding: '8px 16px',
    borderRadius: '10px',
    background: 'var(--accent-primary)',
    color: 'white',
    border: 'none',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    whiteSpace: 'nowrap'
};

const floatingCloseBtn: React.CSSProperties = {
    position: 'absolute',
    top: '10px',
    right: '10px',
    background: 'rgba(255,255,255,0.05)',
    border: 'none',
    color: 'rgba(255,255,255,0.4)',
    cursor: 'pointer',
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    transition: 'all 0.2s'
};
