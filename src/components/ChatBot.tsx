"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Loader2 } from 'lucide-react';

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
        const cleanQuery = query.toLowerCase().trim().replace(/[?.,!]/g, "");
        
        // 1. GREETINGS
        if (["hello", "hi", "hey", "hola", "namaste", "नमस्ते", "हेलो", "helo", "hlo"].some(word => cleanQuery === word || cleanQuery.startsWith(word + " "))) {
            const replies = [
                "Hello there! 😊 Hope you are doing wonderful today. How can I help you? (नमस्ते! आशा है आपका दिन अच्छा जा रहा होगा। मैं आपकी क्या मदद कर सकता हूँ?)",
                "Hi! It's great to connect with you. How is your day going so far? (हाय! आपसे बात करके अच्छा लगा। आपका दिन कैसा चल रहा है?)",
                "Hello! DawaKhana assistant here. What can I do for you today? (नमस्ते! दवाखाना सहायक यहाँ है। मैं आज आपके लिए क्या कर सकता हूँ?)"
            ];
            return replies[Math.floor(Math.random() * replies.length)];
        }

        // 2. HOW ARE YOU
        if (cleanQuery.includes("how are you") || cleanQuery.includes("kaise ho") || cleanQuery.includes("aap kaise ho") || cleanQuery.includes("hal chal") || cleanQuery.includes("हाल चाल") || cleanQuery.includes("कैसे हो") || cleanQuery.includes("कैसी हो")) {
            return "I am doing fantastic, running smoothly and ready to help! 🚀 Thank you so much for asking. How are you doing? How is your health today? (मैं बिल्कुल ठीक हूँ, पूछने के लिए बहुत धन्यवाद। आप कैसे हैं? आपकी तबीयत कैसी है?)";
        }

        // 3. EATING / FOOD
        if (cleanQuery.includes("khana khaya") || cleanQuery.includes("did you eat") || cleanQuery.includes("eat food") || cleanQuery.includes("खाना खाया") || cleanQuery.includes("खाना खाए") || cleanQuery.includes("lunch") || cleanQuery.includes("dinner") || cleanQuery.includes("food")) {
            return "Haha, that's sweet of you to ask! 🍕 I'm an AI, so I don't eat food. I only consume electricity and data. But what about you? Did you eat your food today? What did you have? (हाहा, पूछने के लिए धन्यवाद! मैं एक एआई हूँ, इसलिए खाना नहीं खा सकता। क्या आपने खाना खाया? आज आपने क्या खाया?)";
        }

        // 4. WHO ARE YOU / NAME
        if (cleanQuery.includes("who are you") || cleanQuery.includes("what is your name") || cleanQuery.includes("naam kya hai") || cleanQuery.includes("tum kaun ho") || cleanQuery.includes("नाम") || cleanQuery.includes("कौन हो")) {
            return "I am your friendly DawaKhana Virtual Assistant! 🤖 I can help you find medicines, give general health info, and guide you with orders. (मैं आपका दवाखाना सहायक हूँ! मैं आपको दवाएं ढूंढने और ऑर्डर करने में मदद कर सकता हूँ।)";
        }

        // 5. THANK YOU
        if (cleanQuery.includes("thank you") || cleanQuery.includes("thanks") || cleanQuery.includes("dhanyawad") || cleanQuery.includes("shukriya") || cleanQuery.includes("धन्यवाद") || cleanQuery.includes("शुक्रिया")) {
            return "You're very welcome! ❤️ Helping you makes me happy. Is there anything else you'd like to ask? (आपका स्वागत है! आपकी मदद करके मुझे खुशी हुई। क्या आप कुछ और पूछना चाहते हैं?)";
        }

        // 6. BYE
        if (cleanQuery.includes("bye") || cleanQuery.includes("goodbye") || cleanQuery.includes("alvida") || cleanQuery.includes("बाय")) {
            return "Goodbye! 👋 Take care of your health, eat well, and have a beautiful day ahead! (बाय-बाय! अपनी सेहत का ख्याल रखें और आपका दिन शुभ हो!)";
        }

        // 7. COMMON HEALTH ILLNESSES
        if (cleanQuery.includes('fever') || cleanQuery.includes('bukhar') || cleanQuery.includes('बुखार')) {
            return "Oh, sorry to hear that. For fever (बुखार), Paracetamol 650mg is typically taken after meals. Keep track of your temperature, drink plenty of water, and rest. If it doesn't improve in 3 days, please consult a doctor. (बुखार के लिए Paracetamol 650mg ली जा सकती है। आराम करें और डॉक्टर से संपर्क करें।)";
        }

        if (cleanQuery.includes('cough') || cleanQuery.includes('cold') || cleanQuery.includes('खांसी') || cleanQuery.includes('सर्दी') || cleanQuery.includes('जुकाम') || cleanQuery.includes('sardi') || cleanQuery.includes('khansi')) {
            return "Cold and cough (सर्दी-खांसी) can be annoying! Taking steam inhalation twice a day and drinking warm ginger tea can help. Standard syrups like Alex or Ascoril are useful. Rest well and keep warm! (सर्दी-खांसी के लिए गर्म पानी/चाय पिएं और भाप लें।)";
        }

        if (cleanQuery.includes('headache') || cleanQuery.includes('sir dard') || cleanQuery.includes('सर दर्द')) {
            return "For headaches (सर दर्द), check if you need some rest or water. A Crocin or Combiflam can relieve mild pain. Avoid looking at screens for a while. (सर दर्द के लिए स्क्रीन से दूर रहें, थोड़ा पानी पिएं और आराम करें।)";
        }

        if (cleanQuery.includes('stomach') || cleanQuery.includes('pet dard') || cleanQuery.includes('पेट दर्द') || cleanQuery.includes('acidity') || cleanQuery.includes('gas')) {
            return "Stomach discomfort or acidity (पेट दर्द/एसिडिटी) can often be settled with Digene or Pan-D. Try to eat light foods like khichdi and avoid spicy items. (पेट के दर्द/गैस के लिए हल्का खाना खाएं।)";
        }

        // 8. FALLBACK (SMART MULTI-TURN AI FEEL)
        const fallbacks = [
            "I see! 📝 As a health assistant, I'm constantly learning. Could you explain a bit more so I can guide you better? (मैं समझ रहा हूँ। क्या आप थोड़ा विस्तार से बता सकते हैं ताकि मैं बेहतर मदद कर सकूँ?)",
            "That's interesting! How is your day going? Do you have any queries about DawaKhana services or ordering medicines? (दिलचस्प बात है! क्या आपके पास दवाओं या ऑर्डर से जुड़ा कोई सवाल है?)",
            "Got it! I am here to help you. If you'd like to place an order or need help with delivery, just let me know! (समझ गया! मैं आपकी सहायता के लिए हूँ। अगर आपको ऑर्डर करना है तो मुझे बताएं।)",
            "Understood! For specific medical advice, it's always best to consult a professional. You can also contact our support at +91 8707535798. (समझ गया! विशेष सलाह के लिए आप हमारे सपोर्ट नंबर +91 8707535798 पर भी बात कर सकते हैं।)"
        ];
        return fallbacks[Math.floor(Math.random() * fallbacks.length)];
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
