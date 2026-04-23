import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Html5Qrcode } from 'html5-qrcode';
import { supabase } from '../lib/supabase';
import { QrCode, Loader2, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';

interface AttendanceQRProps {
    classRequestId: string;
    isCoach: boolean;
}

export const AttendanceQR: React.FC<AttendanceQRProps> = ({ classRequestId, isCoach }) => {
    const [qrToken, setQrToken] = useState<string | null>(null);
    const [status, setStatus] = useState<'idle' | 'scanning' | 'verifying' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState<string>('');
    const [expiresAt, setExpiresAt] = useState<Date | null>(null);

    // 1. Coach Side: Generate QR Token
    const generateToken = async () => {
        try {
            setStatus('verifying');
            const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            const expiry = new Date();
            expiry.setMinutes(expiry.getMinutes() + 5); // 5 minute validity

            const { data, error } = await supabase
                .from('class_attendance')
                .insert([{
                    class_request_id: classRequestId,
                    qr_token: token,
                    expires_at: expiry.toISOString()
                }])
                .select()
                .single();

            if (error) throw error;

            setQrToken(token);
            setExpiresAt(expiry);
            setStatus('success');
        } catch (err: any) {
            console.error('Error generating token:', err);
            setStatus('error');
            setMessage(err.message);
        }
    };

    // 2. Student Side: Scan QR
    useEffect(() => {
        let html5QrCode: Html5Qrcode;
        if (!isCoach && status === 'scanning') {
            html5QrCode = new Html5Qrcode("qr-reader");
            
            html5QrCode.start(
                { facingMode: "environment" }, 
                { fps: 10, qrbox: { width: 250, height: 250 } },
                onScanSuccess,
                onScanFailure
            ).catch(err => {
                console.error("Camera start failed", err);
                setMessage("카메라에 접근할 수 없거나 기기에 카메라가 없습니다.");
                setStatus('error');
            });

            return () => {
                if (html5QrCode && html5QrCode.isScanning) {
                    html5QrCode.stop().then(() => html5QrCode.clear()).catch(error => console.error("Failed to stop scanner", error));
                }
            };
        }
    }, [status, isCoach]);

    const onScanSuccess = async (decodedText: string) => {
        setStatus('verifying');
        try {
            const { data, error } = await supabase
                .from('class_attendance')
                .update({ scanned_at: new Date().toISOString() })
                .eq('qr_token', decodedText)
                .is('scanned_at', null)
                .gt('expires_at', new Date().toISOString())
                .select();

            if (error) throw error;
            if (!data || data.length === 0) throw new Error('Invalid or Expired QR Code');

            setStatus('success');
            setMessage('출석이 완료되었습니다! 100포인트가 적립되었습니다.');
        } catch (err: any) {
            setStatus('error');
            setMessage(err.message);
        }
    };

    const onScanFailure = (error: any) => {
        // Silently ignore normal scan failures
    };

    return (
        <div style={container}>
            <div style={card}>
                <div style={header}>
                    <div style={iconBox}>
                        <QrCode size={24} color="var(--accent-primary)" />
                    </div>
                    <div>
                        <h3 style={title}>수업 출석 인증</h3>
                        <p style={subtitle}>{isCoach ? '학생에게 QR 코드를 보여주세요' : '코치의 QR 코드를 스캔하세요'}</p>
                    </div>
                </div>

                <div style={content}>
                    {isCoach ? (
                        qrToken ? (
                            <div style={qrWrapper}>
                                <QRCodeSVG value={qrToken} size={200} includeMargin={true} />
                                <div style={expiryBox}>
                                    <Loader2 size={16} className="animate-spin" />
                                    <span>만료 예정: {expiresAt?.toLocaleTimeString()}</span>
                                </div>
                            </div>
                        ) : (
                            <button onClick={generateToken} style={actionButton} disabled={status === 'verifying'}>
                                {status === 'verifying' ? <Loader2 className="animate-spin" /> : 'QR 생성하기'}
                            </button>
                        )
                    ) : (
                        status === 'scanning' ? (
                            <div id="qr-reader" style={{ width: '100%', borderRadius: '12px', overflow: 'hidden' }}></div>
                        ) : status === 'success' ? (
                            <div style={resultBox}>
                                <CheckCircle2 size={48} color="var(--status-success)" />
                                <p style={resultText}>{message}</p>
                            </div>
                        ) : status === 'error' ? (
                            <div style={resultBox}>
                                <XCircle size={48} color="var(--status-error)" />
                                <p style={resultText}>{message}</p>
                                <button onClick={() => setStatus('scanning')} style={retryButton}>다시 시도</button>
                            </div>
                        ) : (
                            <button onClick={() => setStatus('scanning')} style={actionButton}>스캔 시작하기</button>
                        )
                    )}
                </div>

                <div style={footer}>
                    <ShieldCheck size={16} />
                    <span>보안 인증된 출석 시스템</span>
                </div>
            </div>
        </div>
    );
};

// Styles
const container: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    padding: '20px',
    backgroundColor: 'var(--bg-surface-L0)'
};

const card: React.CSSProperties = {
    width: '100%',
    maxWidth: '400px',
    background: 'var(--bg-surface-L1)',
    borderRadius: '24px',
    border: '1px solid var(--border-subtle)',
    boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
    overflow: 'hidden'
};

const header: React.CSSProperties = {
    padding: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    borderBottom: '1px solid var(--border-subtle)'
};

const iconBox: React.CSSProperties = {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
};

const title: React.CSSProperties = {
    margin: 0,
    fontSize: '18px',
    fontWeight: 700,
    color: 'var(--text-primary)'
};

const subtitle: React.CSSProperties = {
    margin: '4px 0 0 0',
    fontSize: '14px',
    color: 'var(--text-secondary)'
};

const content: React.CSSProperties = {
    padding: '32px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '24px'
};

const qrWrapper: React.CSSProperties = {
    padding: '16px',
    background: 'white',
    borderRadius: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px'
};

const expiryBox: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: 'var(--text-secondary)'
};

const actionButton: React.CSSProperties = {
    width: '100%',
    padding: '16px',
    borderRadius: '12px',
    border: 'none',
    backgroundColor: 'var(--accent-primary)',
    color: 'white',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer'
};

const resultBox: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '16px'
};

const resultText: React.CSSProperties = {
    fontSize: '16px',
    color: 'var(--text-primary)',
    lineHeight: 1.5
};

const retryButton: React.CSSProperties = {
    marginTop: '8px',
    backgroundColor: 'transparent',
    border: '1px solid var(--border-subtle)',
    color: 'var(--text-primary)',
    padding: '8px 16px',
    borderRadius: '8px',
    cursor: 'pointer'
};

const footer: React.CSSProperties = {
    padding: '16px',
    backgroundColor: 'var(--bg-surface-L2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '12px',
    color: 'var(--text-muted)'
};
