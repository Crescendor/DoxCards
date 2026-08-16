import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { sounds } from '../services/soundEffects';

const QUICK_REACTIONS = ['😂', '🚩', '💀', '🍿', '💍', '💩', '🔥'];

export default function LobbyChat({ messages = [], onSendMessage, onSendReaction, player }) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    sounds.playClick();
    onSendMessage({
      senderName: player.name,
      senderColor: player.color,
      text: input.trim()
    });
    setInput('');
  };

  const handleReaction = (emoji) => {
    sounds.playReaction();
    onSendReaction(emoji);
  };

  return (
    <div className="lobby-chat-card">
      {/* Header */}
      <div className="lobby-chat-header">
        <span style={{ fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageSquare size={16} color="#ef4444" />
          oda sohbeti
        </span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {messages.length} mesaj
        </span>
      </div>

      {/* Messages Feed */}
      <div className="lobby-chat-messages">
        {messages.length === 0 ? (
          <div style={{
            color: 'var(--text-muted)',
            textAlign: 'center',
            marginTop: 'auto',
            marginBottom: 'auto',
            fontSize: '0.85rem'
          }}>
            henüz mesaj yok.<br />arkadaşlarına ilk mesajı yaz!
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`chat-bubble-wrap ${m.senderName === player.name ? 'is-me' : ''}`}
            >
              {!m.isSystem && (
                <div className="chat-sender-info" style={{ color: m.senderColor || 'var(--text-muted)' }}>
                  <span>{m.senderName}</span>
                  <span className="chat-time">{m.time}</span>
                </div>
              )}

              <div className={`chat-bubble ${m.isSystem ? 'system' : m.senderName === player.name ? 'me' : 'other'}`}>
                {m.text}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Reactions Bar */}
      <div className="lobby-chat-reactions">
        {QUICK_REACTIONS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => handleReaction(emoji)}
            className="reaction-btn"
            title={emoji}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="lobby-chat-input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="mesaj yaz..."
          maxLength={150}
          className="form-input"
          style={{ padding: '9px 12px', fontSize: '0.88rem' }}
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="btn-primary"
          style={{ padding: '9px 14px', borderRadius: 'var(--radius-md)' }}
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
