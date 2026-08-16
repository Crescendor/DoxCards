import React from 'react';
import { X, Heart, Flag, Crown, Sparkles, CheckCircle2 } from 'lucide-react';
import { sounds } from '../services/soundEffects';

export default function HowToPlayModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Flag size={26} color="#ef4444" />
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Nasıl Oynanır?</h2>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="btn-icon"
          >
            <X size={20} />
          </button>
        </div>

        {/* Rules Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', lineHeight: '1.6', fontSize: '0.95rem' }}>
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--border-red)',
            borderRadius: 'var(--radius-md)',
            padding: '16px'
          }}>
            <h4 style={{ color: '#f87171', fontWeight: 800, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={18} /> Oyunun Amacı
            </h4>
            <p style={{ color: 'var(--text-main)' }}>
              Bekâr (Single) olan oyuncu için en ideal sevgili adayını yaratıp rakiplerinin adaylarını korkunç <b>Kırmızı Bayraklarla (Red Flags)</b> sabote ederek Bekâr'ın senin adayını seçmesini sağlamak!
            </p>
          </div>

          <div>
            <h4 style={{ fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24' }}>
              <Crown size={18} /> 1. Roller ve Sıra
            </h4>
            <p style={{ color: 'var(--text-muted)' }}>
              Her tur saat yönünde bir oyuncu <b>Bekâr (Hakem)</b> olur. Diğer oyuncular ise <b>Çöpçatan</b> rolündedir. Çöpçatanların elinde 4 Beyaz Kart (İyi Özellikler) ve 3 Kırmızı Kart (Kusurlar) bulunur.
            </p>
          </div>

          <div>
            <h4 style={{ fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8' }}>
              <Heart size={18} /> 2. Aday Hazırlama (Beyaz Kartlar)
            </h4>
            <p style={{ color: 'var(--text-muted)' }}>
              Çöpçatanlar ellerindeki 4 beyaz kart arasından Bekâr'ın aklını başından alacak <b>2 Beyaz Kartı</b> seçerek adayı oluşturur (Örn: <i>"Milyarder"</i> + <i>"Dünyanın en iyi masajını yapıyor"</i>).
            </p>
          </div>

          <div>
            <h4 style={{ fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', color: '#f87171' }}>
              <Flag size={18} /> 3. Kırmızı Bayrak Sabotajı!
            </h4>
            <p style={{ color: 'var(--text-muted)' }}>
              Her çöpçatan, rakip çöpçatanın hazırladığı mükemmel adayı mahvetmek için elindeki <b>1 Kırmızı Kartı</b> o adayın üzerine koyar (Örn: <i>"Ama her 15 dakikada bir kontrolsüzce osuruyor"</i>).
            </p>
          </div>

          <div>
            <h4 style={{ fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399' }}>
              <CheckCircle2 size={18} /> 4. Karar ve Puan
            </h4>
            <p style={{ color: 'var(--text-muted)' }}>
              Tüm adaylar açılır. Çöpçatanlar kendi adayını savunur. Bekâr adayları dinler ve tüm kusurlara rağmen çıkmak istediği en iyi adayı seçer. Kazanan çöpçatan <b>1 Puan</b> kazanır. Hedef puana (Örn: 3-5 puan) ilk ulaşan oyunu kazanır!
            </p>
          </div>
        </div>

        {/* Footer Button */}
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="btn-primary"
            style={{ width: '100%', padding: '12px' }}
          >
            anladım, devam et
          </button>
        </div>
      </div>
    </div>
  );
}
