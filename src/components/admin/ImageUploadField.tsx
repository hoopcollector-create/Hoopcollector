import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Upload, Loader2, Image as ImageIcon, X } from 'lucide-react';

interface ImageUploadFieldProps {
    label: string;
    value: string;
    onChange: (url: string) => void;
    helperText?: string;
    bucket?: string;
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({ 
    label, 
    value, 
    onChange, 
    helperText,
    bucket = 'hoop-assets' 
}) => {
    const [uploading, setUploading] = useState(false);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            if (!e.target.files || e.target.files.length === 0) return;
            
            setUploading(true);
            const file = e.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
            const filePath = `public/${fileName}`;

            // Upload directly to supabase bucket
            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get the public URL
            const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
            onChange(data.publicUrl);

        } catch (error: any) {
            console.error('Upload error:', error);
            alert('사진 업로드에 실패했습니다: ' + (error.message || '알 수 없는 오류'));
        } finally {
            setUploading(false);
        }
    };

    return (
        <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
                <label style={labelStyle}>{label}</label>
                {helperText && <span style={{ fontSize: '0.7rem', opacity: 0.4 }}>{helperText}</span>}
            </div>
            
            <div style={containerStyle}>
                {/* Preview Area */}
                <div style={previewBox}>
                    {value ? (
                        <>
                            <img src={value} alt="Preview" style={previewImg} />
                            <button 
                                type="button" 
                                onClick={() => onChange('')} 
                                style={removeBtn}
                            >
                                <X size={12} />
                            </button>
                        </>
                    ) : (
                        <div style={placeholder}>
                            <ImageIcon size={20} style={{ opacity: 0.2 }} />
                        </div>
                    )}
                </div>

                {/* Control Area */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ position: 'relative' }}>
                        <input 
                            type="text" 
                            style={inputStyle} 
                            value={value} 
                            onChange={(e) => onChange(e.target.value)}
                            placeholder="이미지 주소(URL)를 입력하거나 직접 업로드하세요"
                        />
                    </div>
                    
                    <label style={{ ...uploadBtnStyle, cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.6 : 1 }}>
                        {uploading ? (
                            <>
                                <Loader2 size={16} className="animate-spin" /> 
                                업로드 중...
                            </>
                        ) : (
                            <>
                                <Upload size={16} /> 사진 선택하기
                            </>
                        )}
                        <input 
                            type="file" 
                            style={{ display: 'none' }} 
                            accept="image/*" 
                            disabled={uploading}
                            onChange={handleUpload}
                        />
                    </label>
                </div>
            </div>
            
            <style>{`
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

const labelStyle: React.CSSProperties = { fontSize: '0.75rem', fontWeight: 900, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' };
const containerStyle: React.CSSProperties = { display: 'flex', gap: '16px', alignItems: 'flex-start', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' };
const previewBox: React.CSSProperties = { width: '80px', height: '80px', borderRadius: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden', flexShrink: 0 };
const previewImg: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'cover' };
const placeholder: React.CSSProperties = { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const removeBtn: React.CSSProperties = { position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', borderRadius: '4px', padding: '4px', cursor: 'pointer', display: 'flex' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '0.85rem', outline: 'none' };
const uploadBtnStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', borderRadius: '10px', background: 'var(--color-coach)', color: 'white', fontSize: '0.85rem', fontWeight: 800, transition: 'all 0.2s', border: 'none' };
