import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, Smile, Flame } from 'lucide-react';
import { sounds } from '../services/soundEffects';

const REACTIONS = ['😂', '🚩', '💀', '🍿', '💍', '💩', '🤡', '🔥'];

export default function ChatDrawer({ messages = [], onSendMessage, onSendReaction, player }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);

  // Track unread messages when drawer is closed
  useEffect(() => {
    if (!isOpen && messages.length > 0) {
      setUnreadCount(prev => prev + 1);
    }
  }, [messages.length, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    sounds.playClick();
    onSendMessage({
      senderName: player.name,
      senderColor: player.color,
      senderAvatar: player.avatar,
      text: input.trim()
    });
    setInput('');
  };

  const handleReactionClick = (emoji) => {
    sounds.playReaction();
    onSendReaction(emoji);
  };

  return (
    <>
      {/* Floating Reaction Bar & Chat Toggle Button */}
      <div style={{
        position: 'fixed',
        bottom: '220px',
        right: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '10px',
        zIndex: 95
      }}>
        {/* Quick Reactions Strip */}
        <div style={{
          background: 'rgba(15, 18, 30, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '9999px',
          padding: '6px 12px',
          display: 'flex',
          gap: '6px',
          boxShadow: 'var(--shadow-md)'
        }}>
          {REACTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleReactionClick(emoji)}
              style={{
                background: 'transparent',
                fontSize: '1.2rem',
                padding: '4px',
                borderRadius: '50%',
                transition: 'transform 0.15s'
              }}
              className="hover:scale-125"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Chat Toggle Button */}
        <button
          onClick={() => {
            sounds.playClick();
            setIsOpen(!isOpen);
          }}
          className="btn-primary"
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            padding: 0,
            position: 'relative'
          }}
          title="Sohbet"
        >
          {isOpen ? <X size={20} /> : <MessageSquare size={20} />}
          {!isOpen && unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: '#fbbf24',
              color: '#000',
              fontWeight: 900,
              fontSize: '0.75rem',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Chat Side Drawer */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '280px',
          right: '20px',
          width: '320px',
          height: '400px',
          background: 'rgba(15, 18, 32, 0.95)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 96,
          overflow: 'hidden',
          animation: 'popIn 0.2s ease-out'
        }}>
          {/* Chat Header */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(0, 0, 0, 0.2)'
          }}>
            <span style={{ fontWeight: 800, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MessageSquare size={16} color="#ef4444" /> Oyun Sohbeti
            </span>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'transparent', color: 'var(--text-muted)' }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages List */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            {messages.length === 0 ? (
              <div style={{ color: 'var(--text-subtle)', textAlign: 'center', marginTop: '40px', fontSize: '0.85rem' }}>
                Henüz mesaj yok. İlk mesajı sen yaz! 💬
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignSelf: m.senderName === player.name ? 'flex-end' : 'flex-start',
                    maxWidth: '85%'
                  }}
                >
                  {!m.isSystem && (
                    <div style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: m.senderColor || '#94a3b8',
                      marginBottom: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <span>{m.senderName}</span>
                      <span style={{ opacity: 0.6, fontSize: '0.65rem' }}>{m.time}</span>
                    </div>
                  )}

                  <div style={{
                    background: m.isSystem
                      ? 'rgba(16, 185, 129, 0.15)'
                      : m.senderName === player.name
                        ? 'linear-gradient(135deg, #ef4444, #b91c1c)'
                        : 'rgba(255, 255, 255, 0.08)',
                    color: m.isSystem ? '#34d399' : '#ffffff',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.88rem',
                    border: m.isSystem ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-subtle)',
                    wordBreak: 'break-word'
                  }}>
                    {m.text}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} style={{
            padding: '10px 12px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            gap: '8px',
            background: 'rgba(0, 0, 0, 0.3)'
          }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Bir şeyler yaz..."
              style={{
                flex: 1,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 12px',
                color: '#fff',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              className="btn-primary"
              style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
