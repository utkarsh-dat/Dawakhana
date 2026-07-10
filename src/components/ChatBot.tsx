"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Loader2, Phone, Mail } from 'lucide-react';

interface Message {
    text: string;
    sender: 'user' | 'bot';
    time: string;
}

const ChatBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            text: "Hello! Welcome to DawaKhana. How can I help you today? (नमस्ते! दवाखाना में आपका स्वागत है। मैं आपकी क्या मदद कर सकता हूँ?)",
            sender: 'bot',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to the bottom of chat history when a message is added
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const getBotResponse = (query: string): string => {
        const lowerQuery = query.toLowerCase();
        
        if (lowerQuery.includes('fever') || lowerQuery.includes('bukhar') || lowerQuery.includes('बुखार')) {
            return "For fever (बुखार), Paracetamol (650mg) is commonly used. Take it after food, up to 3 times a day. If the fever stays above 101°F or lasts more than 3 days, please consult a doctor. (बुखार के लिए Paracetamol 650mg ली जा सकती है। कृपया बुखार अधिक होने पर डॉक्टर से संपर्क करें।)";
        }
        
        if (lowerQuery.includes('cough') || lowerQuery.includes('cold') || lowerQuery.includes('खांसी') || lowerQuery.includes('सर्दी') || lowerQuery.includes('जुकाम')) {
            return "For cold and cough (सर्दी-खांसी), you can take standard cough syrups (like Alex or Ascoril) and take steam inhalation. Drink warm water and avoid cold items. (सर्दी-खांसी के लिए गर्म पानी पिएं और स्टीम लें।)";
        }
        
        if (lowerQuery.includes('headache') || lowerQuery.includes('sir dard') || lowerQuery.includes('सर दर्द')) {
            return "For mild headaches (सर दर्द), a pain reliever like Crocin or Combiflam can help. Make sure to rest in a quiet, dark room and drink enough water. (सर दर्द के लिए आराम करें और पर्याप्त पानी पिएं।)";
        }
        
        if (lowerQuery.includes('stomach') || lowerQuery.includes('pet dard') || lowerQuery.includes('पेट दर्द') || lowerQuery.includes('acidity') || lowerQuery.includes('gas')) {
            return "For stomach pain or acidity (पेट दर्द/एसिडिटी), Digene syrup or Pan-D can be helpful. Avoid spicy/heavy food. (पेट दर्द या गैस के लिए हल्का खाना खाएं और डिजीन ले सकते हैं।)";
        }
        
        if (lowerQuery.includes('hello') || lowerQuery.includes('hi') || lowerQuery.includes('hey') || lowerQuery.includes('नमस्ते') || lowerQuery.includes('namaste')) {
            return "Hello! I am your DawaKhana virtual helper. You can ask me about common health symptoms or medicines. (नमस्ते! मैं आपका दवाखाना सहायक हूँ। आप मुझसे सामान्य बीमारियों या दवाओं के बारे में पूछ सकते हैं।)";
        }
        
        return "I have received your query. For accurate medical guidance or placing a custom order, please contact our support team at +91 8707535798 or email us at Dawakhana011@gmail.com. (अपनी समस्या के लिए आप हमारे सपोर्ट टीम से +91 8707535798 पर संपर्क कर सकते हैं।)";
    };

    const handleSend = () => {
        if (input.trim() === '') return;

        const userMessage: Message = {
            text: input,
            sender: 'user',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages((prev) => [...prev, userMessage]);
        const userQuery = input;
        setInput('');
        setIsTyping(true);

        // Simulate chatbot reply delay
        setTimeout(() => {
            const botMessage: Message = {
                text: getBotResponse(userQuery),
                sender: 'bot',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages((prev) => [...prev, botMessage]);
            setIsTyping(false);
        }, 1000);
    };

    return (
        <>
            {/* Floating Action Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-teal-600 hover:bg-teal-700 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 group"
                aria-label="Open Chatbot"
            >
                {isOpen ? (
                    <X size={24} className="animate-spin-once" />
                ) : (
                    <MessageSquare size={24} className="group-hover:rotate-12 transition-transform" />
                )}
            </button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="fixed bottom-24 right-6 z-50 w-[350px] sm:w-[380px] h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-teal-600 to-blue-600 p-4 text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold text-lg">
                                        DK
                                    </div>
                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-teal-600 rounded-full animate-pulse" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">DawaKhana Assistant</h3>
                                    <p className="text-[10px] text-teal-100">Ready to help 24/7</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Message Box */}
                        <div className="flex-grow p-4 overflow-y-auto bg-slate-50 space-y-4">
                            {messages.map((msg, index) => (
                                <div
                                    key={index}
                                    className={`flex flex-col ${
                                        msg.sender === 'user' ? 'items-end' : 'items-start'
                                    }`}
                                >
                                    <div
                                        className={`p-3 rounded-2xl max-w-[85%] text-sm shadow-sm leading-relaxed ${
                                            msg.sender === 'user'
                                                ? 'bg-teal-600 text-white rounded-tr-none'
                                                : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                                        }`}
                                    >
                                        <p>{msg.text}</p>
                                    </div>
                                    <span className="text-[9px] text-slate-400 mt-1 px-1">
                                        {msg.time}
                                    </span>
                                </div>
                            ))}

                            {/* Typing Indicator */}
                            {isTyping && (
                                <div className="flex items-center gap-2 text-slate-400 text-xs bg-white border border-slate-100 p-3 rounded-2xl rounded-tl-none max-w-[50%] shadow-sm">
                                    <Loader2 size={14} className="animate-spin text-teal-600" />
                                    <span>Typing...</span>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Footer */}
                        <div className="p-3 bg-white border-t border-slate-100 flex gap-2 items-center">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSend();
                                }}
                                placeholder="अपनी समस्या लिखें (e.g. fever, cough...)"
                                className="flex-grow h-10 px-3 border border-slate-200 rounded-xl focus:border-teal-500 outline-none text-sm text-slate-800 bg-slate-50 focus:bg-white transition-all"
                            />
                            <button
                                onClick={handleSend}
                                className="w-10 h-10 bg-teal-600 hover:bg-teal-700 text-white rounded-xl flex items-center justify-center transition-colors shadow-md active:scale-95"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default ChatBot;
