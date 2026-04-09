import React, { useState, useEffect, useRef } from 'react';
import { api } from '../lib/apiService';
import { MessageCircle, X, Send, Minimize2, Check, CheckCheck } from 'lucide-react';

export default function ChatWidget({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [unread, setUnread] = useState(0);
  const messagesEndRef = useRef(null);
  const lastCountRef = useRef(0);

  useEffect(() => {
    // True real-time subscription via Firestore
    const unsubscribe = api.subscribeMessages((msgs) => {
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isOpen) {
      setUnread(0);
      lastCountRef.current = messages.length;
      scrollToBottom();
    } else {
      // Compter les nouveaux messages depuis la dernière fois
      const newCount = messages.length - lastCountRef.current;
      if (newCount > 0) setUnread(newCount);
    }
  }, [messages, isOpen]);

  const loadMessages = async () => {
    const msgs = await api.getMessages();
    setMessages(msgs);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const msg = {
      id: `msg_${Date.now()}`,
      senderId: user.id,
      senderName: user.name,
      senderRole: user.role,
      text: input.trim(),
      timestamp: new Date().toISOString()
    };

    await api.sendMessage(msg);
    setInput('');
    loadMessages();
  };

  const formatTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const getRoleColor = (role) => {
    if (role === 'admin') return 'text-red-400';
    if (role === 'editor') return 'text-cyber-neon';
    return 'text-purple-400';
  };

  // Grouper les messages par jour
  const groupedMessages = messages.reduce((groups, msg) => {
    const date = formatDate(msg.timestamp);
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
    return groups;
  }, {});

  if (user.role === 'client') return null; // Les clients n'ont pas accès au chat interne

  return (
    <>
      {/* Bouton flottant */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-cyber-neon text-black flex items-center justify-center shadow-[0_0_25px_rgba(0,255,170,0.5)] hover:shadow-[0_0_40px_rgba(0,255,170,0.7)] hover:scale-110 transition-all duration-300"
        >
          <MessageCircle size={24} />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center animate-pulse">
              {unread}
            </span>
          )}
        </button>
      )}

      {/* Fenêtre de chat */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-80 md:w-96 h-[500px] flex flex-col rounded-xl overflow-hidden shadow-2xl animate-fade-in" style={{ backgroundColor: '#0b141a' }}>
          
          {/* Header WhatsApp Style */}
          <div className="flex items-center justify-between p-3" style={{ backgroundColor: '#202c33' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-cyber-dark overflow-hidden flex items-center justify-center border border-gray-600">
                  <span className="text-white font-bold text-sm">G-C</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-100 text-[15px]">Groupe Studio</h3>
                <span className="text-xs text-gray-400">{messages.length} messages</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors p-2">
              <Minimize2 size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" style={{ backgroundImage: 'url("https://web.whatsapp.com/img/bg-chat-tile-dark_a4be512e7195b6b733d9110b408f075d.png")', backgroundColor: '#0b141a', backgroundRepeat: 'repeat' }}>
            {messages.length === 0 && (
              <div className="text-center text-gray-400 text-xs py-10">
                L'historique des messages apparaîtra ici.
              </div>
            )}
            
            {Object.entries(groupedMessages).map(([date, msgs]) => (
              <div key={date}>
                <div className="text-center my-3">
                  <span className="text-[12px] text-gray-400" style={{ backgroundColor: '#182229', padding: '4px 12px', borderRadius: '8px' }}>{date}</span>
                </div>
                {msgs.map(msg => {
                  const isMe = msg.senderId === user.id;
                  return (
                    <div key={msg.id} className={`flex flex-col mb-1 ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className={`relative max-w-[85%] px-2 pt-1.5 pb-1 text-[14.5px] text-[#e9edef] ${
                        isMe 
                          ? 'rounded-l-lg rounded-br-lg' 
                          : 'rounded-r-lg rounded-bl-lg'
                      }`} style={{ backgroundColor: isMe ? '#005c4b' : '#202c33' }}>
                        {!isMe && (
                          <div className={`text-[12px] font-semibold mb-0.5 ${getRoleColor(msg.senderRole)}`}>
                            {msg.senderName}
                          </div>
                        )}
                        <div className="pr-12 leading-relaxed whitespace-pre-wrap">{msg.text}</div>
                        <div className="absolute bottom-1 right-2 flex items-center gap-1">
                            <span className="text-[10px] text-gray-400 opacity-80">{formatTime(msg.timestamp)}</span>
                            {isMe && <CheckCheck size={14} className="text-[#53bdeb]" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input WhatsApp Style */}
          <form onSubmit={handleSend} className="p-3 pl-4 flex gap-2 items-end" style={{ backgroundColor: '#202c33' }}>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Tapez un message"
                className="flex-1 min-h-[40px] px-4 py-2 rounded-lg text-[15px] text-[#e9edef] outline-none"
                style={{ backgroundColor: '#2a3942' }}
                autoFocus
              />
              <button 
                type="submit"
                disabled={!input.trim()}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${input.trim() ? 'text-[#00a884]' : 'text-gray-500'}`}
              >
                <Send size={20} />
              </button>
          </form>
        </div>
      )}
    </>
  );
}
