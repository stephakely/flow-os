import React, { useState, useEffect, useRef } from 'react';
import { api } from '../lib/apiService';
import { MessageCircle, X, Send, Minimize2 } from 'lucide-react';

export default function ChatWidget({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [unread, setUnread] = useState(0);
  const messagesEndRef = useRef(null);
  const lastCountRef = useRef(0);

  useEffect(() => {
    loadMessages();
    // Polling toutes les 3 secondes pour simuler le temps réel
    const interval = setInterval(loadMessages, 3000);
    const handleDbUpdate = () => loadMessages();
    window.addEventListener('flow-db-update', handleDbUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener('flow-db-update', handleDbUpdate);
    };
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
        <div className="fixed bottom-6 right-6 z-50 w-96 h-[500px] flex flex-col rounded-2xl border border-cyber-neon/30 bg-cyber-card/95 backdrop-blur-xl shadow-[0_0_50px_-12px_rgba(0,255,170,0.3)] animate-fade-in overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-cyber-border/30 bg-black/30">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]"></div>
              <div>
                <h3 className="font-bold text-white text-sm tracking-wider uppercase">Chat Studio</h3>
                <span className="text-[10px] text-cyber-muted">{messages.length} messages</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-cyber-muted hover:text-white transition-colors p-1">
              <Minimize2 size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.length === 0 && (
              <div className="text-center text-cyber-muted text-xs py-10 italic">
                Aucun message. Lancez la conversation ! 💬
              </div>
            )}
            
            {Object.entries(groupedMessages).map(([date, msgs]) => (
              <div key={date}>
                <div className="text-center my-3">
                  <span className="text-[10px] text-cyber-muted bg-black/40 px-3 py-1 rounded-full uppercase tracking-widest">{date}</span>
                </div>
                {msgs.map(msg => {
                  const isMe = msg.senderId === user.id;
                  return (
                    <div key={msg.id} className={`flex flex-col mb-3 ${isMe ? 'items-end' : 'items-start'}`}>
                      {!isMe && (
                        <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${getRoleColor(msg.senderRole)}`}>
                          {msg.senderName}
                        </span>
                      )}
                      <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                        isMe 
                          ? 'bg-cyber-neon/20 text-white border border-cyber-neon/30 rounded-br-sm' 
                          : 'bg-black/40 text-gray-200 border border-cyber-border/30 rounded-bl-sm'
                      }`}>
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-cyber-muted mt-0.5">{formatTime(msg.timestamp)}</span>
                    </div>
                  );
                })}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-3 border-t border-cyber-border/30 bg-black/20">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Écrire un message..."
                className="flex-1 bg-black/40 border border-cyber-border/50 text-white text-sm p-2.5 rounded-lg focus:border-cyber-neon outline-none placeholder:text-cyber-muted/50"
                autoFocus
              />
              <button 
                type="submit"
                disabled={!input.trim()}
                className="px-3 bg-cyber-neon/20 border border-cyber-neon/30 text-cyber-neon rounded-lg hover:bg-cyber-neon/30 transition-colors disabled:opacity-30"
              >
                <Send size={18} />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
