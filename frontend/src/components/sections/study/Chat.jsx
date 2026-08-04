import React, { useState } from 'react';
import { chatMessages } from '../../../data/studyData';
import { Send } from 'lucide-react';

export default function Chat() {
  const [messages, setMessages] = useState(chatMessages);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    
    // Add user message
    const newMsg = { sender: 'user', text: input, initials: 'AR' };
    setMessages([...messages, newMsg]);
    setInput('');
    
    // Simulate AI response for the prototype
    setTimeout(() => {
      setMessages(prev => [
        ...prev, 
        { sender: 'ai', text: "I'm a simulated AI. Once connected to the backend, I'll provide real answers!" }
      ]);
    }, 1000);
  };

  return (
    <div className="tab-panel active" style={{ height: '100%' }}>
      <div className="chat-wrap">
        <div className="chat-msgs">
          {messages.map((msg, idx) => (
            <div className={`msg ${msg.sender}`} key={idx}>
              <div className="msg-avatar" style={msg.sender === 'user' ? { fontSize: '11px', fontWeight: 700, color: '#4B5563' } : {}}>
                {msg.sender === 'ai' ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2l2.2 5.2L20 9l-5.8 1.8L12 16l-2.2-5.2L4 9l5.8-1.8L12 2z" fill="#fff" />
                  </svg>
                ) : (
                  msg.initials
                )}
              </div>
              <div className="msg-bubble">{msg.text}</div>
            </div>
          ))}
        </div>
        <div className="chat-input-row">
          <input 
            placeholder="Ask a question about this document..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button className="send-btn" onClick={handleSend}>
            <Send size={16} fill="#fff" stroke="none" />
          </button>
        </div>
      </div>
    </div>
  );
}
