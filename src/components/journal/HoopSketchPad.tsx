import React, { useRef, useState, useEffect } from 'react';
import { Trash2, RotateCcw, PenTool, CheckCircle, Loader2 } from 'lucide-react';

interface HoopSketchPadProps {
    onSave: (blob: Blob) => Promise<void>;
    saving?: boolean;
}

export const HoopSketchPad: React.FC<HoopSketchPadProps> = ({ onSave, saving }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasContent, setHasContent] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Set display size
        const container = canvas.parentElement;
        if (container) {
            canvas.width = container.clientWidth * 2; // for retina
            canvas.height = (container.clientWidth * 1.2) * 2;
            canvas.style.width = `${container.clientWidth}px`;
            canvas.style.height = `${container.clientWidth * 1.2}px`;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.scale(2, 2);
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;
        contextRef.current = ctx;

        drawCourt(ctx, canvas.width / 2, canvas.height / 2);
    }, []);

    const drawCourt = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
        ctx.clearRect(0, 0, w, h);
        
        // Background
        ctx.fillStyle = '#121214';
        ctx.fillRect(0, 0, w, h);

        // Lines Style
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 2;

        const margin = 20;
        const courtW = w - margin * 2;
        const courtH = h - margin * 2;

        // Outer Boundary
        ctx.strokeRect(margin, margin, courtW, courtH);

        // Mid line (if half court, it's the top line)
        
        // Key Area
        const keyW = courtW * 0.35;
        const keyH = courtH * 0.4;
        const keyX = margin + (courtW - keyW) / 2;
        const keyY = margin;
        ctx.strokeRect(keyX, keyY, keyW, keyH);

        // Three point arc
        ctx.beginPath();
        ctx.arc(margin + courtW / 2, margin + courtH * 0.1, courtW * 0.45, 0, Math.PI);
        ctx.stroke();

        // Hoop & Backboard (Simplified)
        ctx.strokeRect(margin + courtW / 2 - 25, margin + 15, 50, 2); // board
        ctx.beginPath();
        ctx.arc(margin + courtW / 2, margin + 25, 12, 0, Math.PI * 2); // rim
        ctx.stroke();

        // Reset for drawing
        ctx.strokeStyle = '#3b82f6'; // Bright blue for tactical drawing
        ctx.lineWidth = 4;
    };

    const startDrawing = ({ nativeEvent }: React.MouseEvent | React.TouchEvent) => {
        const { offsetX, offsetY } = getCoordinates(nativeEvent);
        contextRef.current?.beginPath();
        contextRef.current?.moveTo(offsetX, offsetY);
        setIsDrawing(true);
    };

    const draw = ({ nativeEvent }: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const { offsetX, offsetY } = getCoordinates(nativeEvent);
        contextRef.current?.lineTo(offsetX, offsetY);
        contextRef.current?.stroke();
        setHasContent(true);
    };

    const stopDrawing = () => {
        contextRef.current?.closePath();
        setIsDrawing(false);
    };

    const getCoordinates = (event: any) => {
        if (event.touches) {
            const rect = canvasRef.current!.getBoundingClientRect();
            return {
                offsetX: event.touches[0].clientX - rect.left,
                offsetY: event.touches[0].clientY - rect.top
            };
        }
        return { offsetX: event.offsetX, offsetY: event.offsetY };
    };

    const clear = () => {
        const canvas = canvasRef.current;
        if (canvas && contextRef.current) {
            drawCourt(contextRef.current, canvas.width / 2, canvas.height / 2);
            setHasContent(false);
        }
    };

    const handleSaveClick = () => {
        canvasRef.current?.toBlob((blob) => {
            if (blob) onSave(blob);
        }, 'image/png');
    };

    return (
        <div style={container}>
            <div style={header}>
                <div style={title}><PenTool size={16} /> HOOP SKETCH PAD</div>
                <div style={controls}>
                    <button onClick={clear} style={iconBtn} title="지우기"><Trash2 size={16} /></button>
                    <button onClick={handleSaveClick} disabled={!hasContent || saving} style={saveBtn}>
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                        {saving ? "저장 중..." : "그림 확정"}
                    </button>
                </div>
            </div>
            
            <div style={canvasWrap}>
                <canvas 
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    style={{ cursor: 'crosshair', touchAction: 'none' }}
                />
                {!hasContent && <div style={hint}>오늘의 하이라이트 전술이나 움직임을 그려주세요!</div>}
            </div>

            <style>{`
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

const container: React.CSSProperties = { background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' };
const header: React.CSSProperties = { padding: '12px 20px', background: 'rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' };
const title: React.CSSProperties = { fontSize: '0.75rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '0.05em' };
const controls: React.CSSProperties = { display: 'flex', gap: '8px' };
const iconBtn: React.CSSProperties = { padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex' };
const saveBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', background: 'var(--color-coach)', color: 'white', border: 'none', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' };
const canvasWrap: React.CSSProperties = { position: 'relative', width: '100%', background: '#121214' };
const hint: React.CSSProperties = { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none', fontSize: '0.85rem', color: 'rgba(255,255,255,0.15)', textAlign: 'center', width: '80%' };
