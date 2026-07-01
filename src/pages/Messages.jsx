import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Send, ArrowRight, ArrowLeft, Loader2, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { usePusher } from '../context/PusherContext';
import { useAuth } from '../context/AuthContext';

export default function Messages() {
  const { language } = useLanguage();
  const { t } = useTranslation();
  const location = useLocation();
  const { channel } = usePusher();
  
  const [contacts, setContacts] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false); // حالة تحميل للرسائل
  const messagesEndRef = useRef(null);

  const { user: currentUser } = useAuth();
  const myId = currentUser?.id;

  // 1. Fetch Contacts (جلب جهات الاتصال)
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const res = await api.get('/messages/contacts');
        setContacts(res.data);
        
        // Handle Auto-Open from Doctor Card or Notification
        if (location.state?.startChatWith) {
            const newDoc = location.state.startChatWith;
            const exists = res.data.find(c => c.id === newDoc.id);
            const chatUser = exists || { ...newDoc, role: 'doctor' };
            if (!exists) setContacts(prev => [chatUser, ...prev]);
            setActiveChat(chatUser);
        }
        if (location.state?.openChatWithId) {
            const targetId = parseInt(location.state.openChatWithId);
            const targetContact = res.data.find(c => c.id === targetId);
            if (targetContact) {
                setActiveChat(targetContact);
            }
        }
      } catch (err) { console.error("Error fetching contacts:", err); } 
      finally { setIsLoadingContacts(false); }
    };
    fetchContacts();
  }, [location.state]); 

  // 2. Fetch Messages (جلب الرسائل القديمة عند اختيار محادثة)
  // 🔥 هذا هو الجزء الذي كان لا يعمل بشكل صحيح
  useEffect(() => {
    if (!activeChat) {
        sessionStorage.removeItem('activeChatId');
        return;
    }

    console.log("🔄 Fetching history for chat:", activeChat.id);
    sessionStorage.setItem('activeChatId', activeChat.id);
    setIsLoadingMessages(true); // بدء التحميل

    const fetchMessages = async () => {
        try {
            const res = await api.get(`/messages/${activeChat.id}`);
            console.log("✅ History loaded:", res.data.length, "messages");
            setMessages(res.data);
            
            // تحديد الرسائل كمقروءة
            await api.put(`/notifications/chat/${activeChat.id}`);
        } catch (err) { 
            console.error("Error fetching messages:", err); 
        } finally {
            setIsLoadingMessages(false); // انتهاء التحميل
        }
    };

    fetchMessages();
  }, [activeChat]);

  // 3. Real-time Listener (استقبال الرسائل الجديدة)
  useEffect(() => {
    if (!channel) return;

    const handleNewMessage = (newMsg) => {
        console.log("⚡ New message via pusher:", newMsg);
        
        // إذا وصلت رسالة، هل هي للشات المفتوح حالياً؟
        if (activeChat && (newMsg.senderId === activeChat.id || newMsg.receiverId === activeChat.id)) {
            // إضافة الرسالة فقط إذا لم تكن موجودة بالفعل (لمنع التكرار)
            setMessages(prev => {
                const exists = prev.some(m => m.id === newMsg.id);
                if (exists) return prev;
                return [...prev, newMsg];
            });
            
            // تمرير لأسفل الشات
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            
            // تحديد كمقروءة إذا كنت أنا المستلم
            if (newMsg.senderId === activeChat.id) {
                 api.put(`/notifications/chat/${activeChat.id}`).catch(() => {});
            }
        }
    };

    channel.bind("receive_message", handleNewMessage);

    return () => channel.unbind("receive_message", handleNewMessage);
  }, [channel, activeChat]);

  // Scroll on update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoadingMessages]);

  // 4. Send Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChat) return;

    const textToSend = inputText;
    setInputText(''); 

    // Optimistic UI Update
    const tempMsg = {
        id: Date.now(), // ID مؤقت
        senderId: myId,
        content: textToSend,
        createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
        const res = await api.post('/messages', {
            receiverId: activeChat.id,
            content: textToSend
        });
        
        // تحديث الرسالة المؤقتة بالرسالة الحقيقية من السيرفر (التي تحتوي على ID صحيح)
        setMessages(prev => prev.map(m => m.id === tempMsg.id ? res.data : m));
        
    } catch (err) {
        console.error("Failed to send", err);
        // يمكن هنا حذف الرسالة المؤقتة لإخبار المستخدم بالفشل
        setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
        console.log("فشل إرسال الرسالة");
    }
  };

  const getInitials = (first, last) => `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase();
  const ArrowIcon = language === 'ar' ? ArrowRight : ArrowLeft;

  return (
    <div className="h-[calc(100vh-120px)] bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex">
      {/* Sidebar (Contacts) */}
      <div className={`w-full md:w-96 border-gray-100 flex flex-col bg-white ${activeChat ? 'hidden md:flex' : 'flex'} ${language === 'ar' ? 'md:border-l' : 'md:border-r'}`}>
        <div className="p-5 border-b border-gray-50">
          <h2 className="text-xl font-bold text-dark mb-4">{t('messagesPage.title')}</h2>
          <div className="relative">
            <input 
                type="text" 
                placeholder={t('messagesPage.search')} 
                className={`w-full py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all border border-transparent focus:border-primary/30 ${language === 'ar' ? 'pl-4 pr-10' : 'pr-4 pl-10'}`}
            />
            <Search className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${language === 'ar' ? 'right-3' : 'left-3'}`} size={18} />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoadingContacts ? (
             <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>
          ) : contacts.length > 0 ? (
            contacts.map((contact) => (
                <div 
                    key={contact.id} 
                    onClick={() => setActiveChat(contact)} 
                    className={`p-4 flex items-center gap-3 cursor-pointer transition-all hover:bg-gray-50 border-b border-gray-50/50
                    ${activeChat?.id === contact.id 
                        ? `bg-blue-50/50 ${language === 'ar' ? 'border-r-4 border-r-primary' : 'border-l-4 border-l-primary'}` 
                        : `${language === 'ar' ? 'border-r-4' : 'border-l-4'} border-transparent`}`}
                >
                <div className="relative">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-primary font-bold text-sm bg-blue-100 border-2 border-white shadow-sm">
                        {getInitials(
                            language === 'ar' ? contact.firstNameAr : contact.firstNameEn,
                            language === 'ar' ? contact.lastNameAr : contact.lastNameEn
                        )}
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                        <h4 className="font-bold text-dark text-sm truncate">
                            {language === 'ar' ? `${contact.firstNameAr} ${contact.lastNameAr}` : `${contact.firstNameEn} ${contact.lastNameEn}`}
                        </h4>
                        <span className="text-[10px] text-gray-400">{t('messagesPage.now')}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{language === 'ar' ? contact.specialtyAr : contact.specialtyEn || (contact.role === 'DOCTOR' ? 'Doctor' : 'Patient')}</p>
                </div>
                </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-400 text-sm flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                    <User size={24} className="opacity-50"/>
                </div>
                <p>{t('messagesPage.noChats')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className={`flex-1 flex flex-col bg-[#F0F2F5] relative ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>

        {activeChat ? (
          <>
            {/* Header */}
            <div className="h-20 border-b border-gray-200 bg-white px-6 flex items-center justify-between shadow-sm z-10">
              <div className="flex items-center gap-4">
                <button onClick={() => setActiveChat(null)} className="md:hidden p-2 -mr-2 text-gray-500 hover:bg-gray-100 rounded-full">
                    <ArrowIcon size={20} />
                </button>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-primary font-bold text-xs bg-blue-100">
                    {getInitials(
                        language === 'ar' ? activeChat.firstNameAr : activeChat.firstNameEn,
                        language === 'ar' ? activeChat.lastNameAr : activeChat.lastNameEn
                    )}
                </div>
                <div>
                  <h3 className="font-bold text-dark text-sm">
                    {activeChat.role === 'DOCTOR' ? (language === 'ar' ? 'د.' : 'Dr.') : ''} {language === 'ar' ? `${activeChat.firstNameAr} ${activeChat.lastNameAr}` : `${activeChat.firstNameEn} ${activeChat.lastNameEn}`}
                  </h3>
                  <p className="text-[10px] text-green-600 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> {t('messagesPage.online')}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 z-0">
              {isLoadingMessages ? (
                 <div className="flex justify-center items-center h-full">
                    <Loader2 className="animate-spin text-primary w-8 h-8" />
                 </div>
              ) : messages.map((msg, idx) => {
                const isMe = msg.senderId === myId;
                const alignment = isMe ? 'justify-end' : 'justify-start';
                
                return (
                  <div key={idx} className={`flex ${alignment}`}>
                    <div className={`max-w-[75%] rounded-2xl p-3.5 shadow-sm relative text-sm
                        ${isMe 
                            ? `bg-primary text-white ${language === 'ar' ? 'rounded-tl-none' : 'rounded-tr-none'}` 
                            : `bg-white text-dark border border-gray-100 ${language === 'ar' ? 'rounded-tr-none' : 'rounded-tl-none'}`}`}
                    >
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      <div className={`text-[9px] mt-1.5 flex items-center gap-1 opacity-80 
                        ${isMe ? 'text-blue-100 justify-end' : 'text-gray-400 justify-end'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute:'2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100 z-10">
              <div className="flex items-center gap-3">
                <input 
                  type="text" 
                  placeholder={t('messagesPage.typePlaceholder')}
                  className="flex-1 bg-gray-50 outline-none text-dark placeholder:text-gray-400 text-sm px-5 py-3.5 rounded-full focus:bg-white focus:ring-2 focus:ring-primary/20 border border-transparent transition-all"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
                <button 
                    type="submit" 
                    disabled={!inputText.trim()} 
                    className={`p-3.5 rounded-full transition-all duration-300 shadow-md flex items-center justify-center
                    ${inputText.trim() 
                        ? 'bg-primary text-white hover:scale-105 hover:bg-primary-hover' 
                        : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
                >
                  <Send size={18} className={language === 'ar' ? (inputText.trim() ? 'ml-0.5' : '') : (inputText.trim() ? 'mr-0.5' : '')} /> 
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-300 bg-gray-50/50">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                <Send size={40} className="opacity-20 text-dark ml-2" />
            </div>
            <p className="font-bold text-gray-400">{t('messagesPage.startChat')}</p>
          </div>
        )}
      </div>
    </div>
  );
}