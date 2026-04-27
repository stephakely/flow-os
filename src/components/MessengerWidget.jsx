import React, { useState, useEffect, useRef } from 'react';
import { api } from '../lib/apiService';
import { chatApi } from '../lib/chatApiService';
import { aiAssistant } from '../lib/aiService';
import { 
  MessageCircle, X, Send, Minimize2, Check, CheckCheck, 
  Smile, Trash2, Reply, MoreVertical, Sparkles, Bot, 
  ArrowLeft, Paperclip, SendHorizontal, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EmojiPicker from 'emoji-picker-react';

export default function MessengerWidget({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'ai'
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [unread, setUnread] = useState(0);
  const [showEmoji, setShowEmoji] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [hoveredMessage, setHoveredMessage] = useState(null);
  const [apiKey, setApiKey] = useState(localStorage.getItem('ANTHROPIC_API_KEY') || '');
  const [showKeyInput, setShowKeyInput] = useState(!apiKey);
  
  // AI State
  const [aiInput, setAiInput] = useState('');
  const [aiHistory, setAiHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('flow_os_ai_history') || '[]'); } catch { return []; }
  });
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem('flow_os_ai_history', JSON.stringify(aiHistory));
  }, [aiHistory]);

  const messagesEndRef = useRef(null);
  const aiEndRef = useRef(null);
  const lastCountRef = useRef(0);

  useEffect(() => {
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
      const newCount = messages.length - lastCountRef.current;
      if (newCount > 0) setUnread(newCount);
    }
  }, [messages, isOpen]);

  const scrollToBottom = (isAi = false) => {
    setTimeout(() => {
      const ref = isAi ? aiEndRef : messagesEndRef;
      ref.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const msg = {
      senderId: user.id,
      senderName: user.name,
      senderRole: user.role,
      text: input.trim(),
      timestamp: new Date().toISOString(),
      reactions: {},
      replyTo: replyingTo ? {
        id: replyingTo.id,
        text: replyingTo.text,
        senderName: replyingTo.senderName
      } : null
    };

    await api.sendMessage(msg);
    setInput('');
    setReplyingTo(null);
    setShowEmoji(false);
  };

  const handleAiSend = async (e) => {
    e.preventDefault();
    if (!aiInput.trim() || isAiLoading) return;

    const userMsg = { role: "user", parts: [{ text: aiInput.trim() }] };
    setAiHistory(prev => [...prev, userMsg]);
    setAiInput('');
    setIsAiLoading(true);
    scrollToBottom(true);

    const response = await aiAssistant.generateResponse(userMsg.parts[0].text, aiHistory);
    
    if (response.includes("Clé API Claude manquante")) {
      setShowKeyInput(true);
      setAiHistory(prev => prev.slice(0, -1)); // Remove user message
    } else {
      setAiHistory(prev => [...prev, { role: "model", parts: [{ text: response }] }]);
    }
    setIsAiLoading(false);
    scrollToBottom(true);
  };

  const saveApiKey = (e) => {
    e.preventDefault();
    localStorage.setItem('ANTHROPIC_API_KEY', apiKey);
    setShowKeyInput(false);
  };

  const clearMemory = () => {
    if (confirm('Effacer la mémoire de Claude ?')) {
      setAiHistory([]);
      localStorage.removeItem('flow_os_ai_history');
    }
  };

  const formatTime = (iso) => {
    return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (iso) => {
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const onEmojiClick = (emojiObject) => {
    setInput(prev => prev + emojiObject.emoji);
  };

  if (user.role === 'client') return null;

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 45 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-2xl bg-cyber-neon text-black flex items-center justify-center shadow-[0_0_25px_rgba(0,255,170,0.5)] hover:shadow-[0_0_40px_rgba(0,255,170,0.8)] transition-all duration-300 group"
          >
            <MessageCircle size={30} className="group-hover:scale-110 transition-transform" />
            {unread > 0 && (
              <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-cyber-dark animate-bounce">
                {unread}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-[400px] h-[600px] flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-cyber-neon/20 backdrop-blur-xl"
            style={{ backgroundColor: 'rgba(11, 20, 26, 0.95)' }}
          >
            {/* Header Tabs */}
            <div className="flex bg-[#202c33] p-1 gap-1">
              <button 
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all ${activeTab === 'chat' ? 'bg-cyber-neon text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              >
                <MessageCircle size={18} />
                Studio Chat
              </button>
              <button 
                onClick={() => setActiveTab('ai')}
                className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all ${activeTab === 'ai' ? 'bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              >
                <Bot size={18} />
                Claude AI
              </button>
              <button onClick={() => setIsOpen(false)} className="px-3 text-gray-400 hover:text-white">
                <Minimize2 size={20} />
              </button>
            </div>

            {activeTab === 'chat' ? (
              <>
                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-chat-pattern">
                  {messages.map((msg, idx) => {
                    const isMe = msg.senderId === user.id;
                    const showHeader = idx === 0 || messages[idx-1].senderId !== msg.senderId;
                    
                    return (
                      <motion.div 
                        key={msg.id || idx}
                        initial={{ opacity: 0, x: isMe ? 20 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group mb-1`}
                        onMouseEnter={() => setHoveredMessage(msg.id)}
                        onMouseLeave={() => setHoveredMessage(null)}
                      >
                        {/* Reply Info */}
                        {msg.replyTo && (
                          <div className={`text-[11px] mb-[-4px] px-3 py-1 bg-white/5 rounded-t-lg border-l-4 border-cyber-neon opacity-60 flex items-center gap-2 ${isMe ? 'mr-2' : 'ml-2'}`}>
                            <Reply size={10} />
                            <span>{msg.replyTo.senderName}: {msg.replyTo.text.substring(0, 30)}...</span>
                          </div>
                        )}

                        <div className={`relative max-w-[85%] px-3 py-2 text-[14px] shadow-sm ${
                          isMe 
                            ? 'bg-[#005c4b] text-white rounded-l-2xl rounded-tr-2xl' 
                            : 'bg-[#202c33] text-gray-100 rounded-r-2xl rounded-tl-2xl'
                        }`}>
                          {showHeader && !isMe && (
                            <span className="text-[11px] font-bold text-cyber-neon mb-1 block">
                              {msg.senderName}
                            </span>
                          )}
                          <div className="whitespace-pre-wrap">{msg.text}</div>
                          <div className="flex items-center justify-end gap-1 mt-1 opacity-60">
                            <span className="text-[10px]">{formatTime(msg.timestamp)}</span>
                            {isMe && <CheckCheck size={14} className="text-cyan-400" />}
                          </div>

                          {/* Quick Reactions Bar (Simplified) */}
                          <div className={`absolute ${isMe ? '-left-12' : '-right-12'} top-0 opacity-0 group-hover:opacity-100 transition-all flex flex-col gap-1 bg-black/40 p-1 rounded-full backdrop-blur-md`}>
                            <button onClick={() => chatApi.toggleReaction(msg.id, '❤️', user.id)} className="hover:scale-125 transition-transform">❤️</button>
                            <button onClick={() => chatApi.toggleReaction(msg.id, '👍', user.id)} className="hover:scale-125 transition-transform">👍</button>
                            <button onClick={() => setReplyingTo(msg)} className="text-white hover:text-cyber-neon p-1"><Reply size={14}/></button>
                            {isMe && <button onClick={() => chatApi.deleteMessage(msg.id)} className="text-red-400 hover:text-red-300 p-1"><Trash2 size={14}/></button>}
                          </div>

                          {/* Display Reactions */}
                          {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {Object.entries(msg.reactions).map(([emoji, users]) => (
                                <button 
                                  key={emoji}
                                  onClick={() => chatApi.toggleReaction(msg.id, emoji, user.id)}
                                  className={`text-[10px] px-1.5 py-0.5 rounded-full border transition-all ${users.includes(user.id) ? 'bg-cyber-neon/20 border-cyber-neon text-cyber-neon' : 'bg-black/20 border-white/10 text-white'}`}
                                >
                                  {emoji} {users.length > 0 && users.length}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Bar */}
                <div className="p-3 bg-[#202c33] border-t border-white/5">
                  {replyingTo && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-black/20 p-2 rounded-lg mb-2 flex items-start justify-between border-l-4 border-cyber-neon"
                    >
                      <div>
                        <div className="text-[10px] text-cyber-neon font-bold">Réponse à {replyingTo.senderName}</div>
                        <div className="text-xs text-gray-400 truncate w-64">{replyingTo.text}</div>
                      </div>
                      <button onClick={() => setReplyingTo(null)} className="text-gray-500 hover:text-white">
                        <X size={14} />
                      </button>
                    </motion.div>
                  )}
                  
                  <form onSubmit={handleSend} className="flex items-end gap-2">
                    <div className="relative">
                      <button 
                        type="button"
                        onClick={() => setShowEmoji(!showEmoji)}
                        className={`p-2 rounded-full transition-colors ${showEmoji ? 'text-cyber-neon' : 'text-gray-400 hover:text-white'}`}
                      >
                        <Smile size={24} />
                      </button>
                      {showEmoji && (
                        <div className="absolute bottom-12 left-0 z-[60]">
                          <EmojiPicker 
                            onEmojiClick={onEmojiClick}
                            theme="dark"
                            width={300}
                            height={400}
                          />
                        </div>
                      )}
                    </div>
                    
                    <textarea
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      placeholder="Tapez un message..."
                      className="flex-1 bg-[#2a3942] text-gray-100 rounded-xl px-4 py-2.5 text-[15px] outline-none resize-none max-h-32 min-h-[44px]"
                      rows={1}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend(e);
                        }
                      }}
                    />
                    
                    <button 
                      type="submit"
                      disabled={!input.trim()}
                      className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${input.trim() ? 'bg-cyber-neon text-black shadow-neon' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
                    >
                      <SendHorizontal size={22} />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              /* AI ASSISTANT TAB */
              <div className="flex-1 flex flex-col overflow-hidden bg-[#0b141a]">
                {showKeyInput ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-grid-cyber">
                    <div className="w-16 h-16 rounded-2xl bg-orange-500/20 flex items-center justify-center text-orange-400 mb-4 animate-pulse">
                      <Bot size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Configuration requise</h3>
                    <p className="text-sm text-gray-400 mb-6">Pour utiliser l'assistant Claude AI, vous devez configurer votre clé API Anthropic.</p>
                    <form onSubmit={saveApiKey} className="w-full space-y-4">
                      <input 
                        type="password"
                        placeholder="Entrez votre clé API Anthropic"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="w-full bg-black/50 border border-orange-500/30 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500"
                      />
                      <button className="w-full py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors">
                        Enregistrer la clé
                      </button>
                    </form>
                    <a href="https://console.anthropic.com/" target="_blank" rel="noreferrer" className="mt-4 text-[10px] text-orange-400 hover:underline">
                      Obtenir une clé API Anthropic ici
                    </a>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                  <div className="flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white shrink-0">
                      <Sparkles size={18} />
                    </div>
                    <div className="bg-orange-900/20 border border-orange-500/20 p-3 rounded-2xl text-sm text-gray-200">
                      Bonjour ! Je suis Claude 3.5. Je peux analyser vos projets, générer du code ou gérer votre équipe.
                    </div>
                  </div>

                  {aiHistory.map((msg, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`flex gap-3 items-start ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 ${msg.role === 'user' ? 'bg-cyber-neon text-black' : 'bg-orange-500'}`}>
                        {msg.role === 'user' ? <MessageCircle size={18}/> : <Sparkles size={18} />}
                      </div>
                      <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                        msg.role === 'user' 
                          ? 'bg-cyber-neon/10 border border-cyber-neon/20 text-white' 
                          : 'bg-orange-900/20 border border-orange-500/30 text-gray-100'
                      }`}>
                        <div className="whitespace-pre-wrap leading-relaxed">{msg.parts ? msg.parts[0].text : ''}</div>
                      </div>
                    </motion.div>
                  ))}
                  
                  {isAiLoading && (
                    <div className="flex gap-3 items-start animate-pulse">
                      <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white shrink-0">
                        <Sparkles size={18} />
                      </div>
                      <div className="bg-orange-900/10 border border-orange-500/10 p-3 rounded-2xl text-sm text-orange-400">
                        Réflexion en cours...
                      </div>
                    </div>
                  )}
                    <div ref={aiEndRef} />
                  </div>

                  {/* AI Input */}
                  <div className="p-4 bg-[#202c33]/50 border-t border-orange-500/20">
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-[9px] text-orange-400/80 uppercase tracking-widest font-bold">Claude 3.5 Sonnet</span>
                       <div className="flex gap-3">
                         <button onClick={clearMemory} className="text-[9px] text-red-500 hover:text-white uppercase">Flush RAM</button>
                         <button onClick={() => setShowKeyInput(true)} className="text-[9px] text-gray-500 hover:text-white uppercase">Api Key</button>
                       </div>
                    </div>
                    <form onSubmit={handleAiSend} className="flex gap-2">
                    <input
                      type="text"
                      value={aiInput}
                      onChange={e => setAiInput(e.target.value)}
                      placeholder="Demander n'importe quoi à Claude..."
                      className="flex-1 bg-black/40 border border-orange-500/30 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-500 transition-colors"
                      disabled={isAiLoading}
                    />
                    <button 
                      type="submit"
                      disabled={!aiInput.trim() || isAiLoading}
                      className="w-11 h-11 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-lg hover:shadow-orange-500/40 transition-all disabled:opacity-50"
                    >
                      <Sparkles size={20} />
                    </button>
                  </form>
                  </div>
                </>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
