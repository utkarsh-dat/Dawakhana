"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Loader2 } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface Message {
    text: string;
    sender: 'user' | 'bot';
    time: string;
}

const ChatBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            text: "Hello! Welcome to DawaKhana. How can I help you today? (नमस्ते! दवाखाना में स्वागत है। आज मैं आपकी क्या सहायता कर सकता हूँ?)",
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

    // Local fallback conversational matching logic (extremely robust)
    const getLocalResponse = (query: string): string => {
        const cleanQuery = query.toLowerCase().trim().replace(/[?.,!]/g, "");

        // 1. HOW ARE YOU / WELL-BEING (ap kaise hai, kaise ho, how are you, kaisa chal raha, etc.)
        if (
            cleanQuery.includes("kaise") || 
            cleanQuery.includes("kaisa") || 
            cleanQuery.includes("kaisi") || 
            cleanQuery.includes("how are you") || 
            cleanQuery.includes("how r u") || 
            cleanQuery.includes("hal chal") || 
            cleanQuery.includes("हाल") ||
            cleanQuery.includes("कैसे") ||
            cleanQuery.includes("कैसा")
        ) {
            return "I am doing fantastic, running smoothly and ready to help! 🚀 Thank you so much for asking. How are you doing? How is your health today? (मैं बिल्कुल ठीक हूँ, पूछने के लिए बहुत धन्यवाद। आप कैसे हैं? आपकी तबीयत कैसी है?)";
        }

        // 2. EATING / FOOD (khana khaya, did you eat, eat food, etc.)
        if (
            cleanQuery.includes("khana") || 
            cleanQuery.includes("khaya") || 
            cleanQuery.includes("khaye") || 
            cleanQuery.includes("eat") || 
            cleanQuery.includes("food") || 
            cleanQuery.includes("lunch") || 
            cleanQuery.includes("dinner") ||
            cleanQuery.includes("खाना") ||
            cleanQuery.includes("खाया")
        ) {
            return "Haha, that's sweet of you to ask! 🍕 I'm an AI, so I don't eat food. I only consume electricity and data. But what about you? Did you eat your food today? What did you have? (हाहा, पूछने के लिए धन्यवाद! मैं एक एआई हूँ, इसलिए खाना नहीं खा सकता। क्या आपने खाना खाया? आज आपने क्या खाया?)";
        }

        // 3. IDENTITY / WHO ARE YOU (who are you, what is your name, kaun ho, naam kya hai, etc.)
        if (
            cleanQuery.includes("who") || 
            cleanQuery.includes("name") || 
            cleanQuery.includes("naam") || 
            cleanQuery.includes("kaun") ||
            cleanQuery.includes("identity") ||
            cleanQuery.includes("नाम") ||
            cleanQuery.includes("कौन")
        ) {
            return "I am your friendly DawaKhana Virtual Assistant! 🤖 I can help you find medicines, give general health info, and guide you with orders. (मैं आपका दवाखाना सहायक हूँ! मैं आपको दवाएं ढूंढने और ऑर्डर करने में मदद कर सकता हूँ।)";
        }

        // 4. GREETINGS (hello, hi, hlo, helo, namaste, etc.)
        if (
            cleanQuery === "hi" || 
            cleanQuery === "hello" || 
            cleanQuery === "hey" || 
            cleanQuery === "hlo" || 
            cleanQuery === "helo" || 
            cleanQuery === "namaste" || 
            cleanQuery === "नमस्ते" || 
            cleanQuery === "हेलो" ||
            cleanQuery.startsWith("hi ") ||
            cleanQuery.startsWith("hello ") ||
            cleanQuery.startsWith("hlo ") ||
            cleanQuery.startsWith("helo ") ||
            cleanQuery.startsWith("hey ")
        ) {
            return "Hello there! 😊 Hope you are doing wonderful today. How can I help you? (नमस्ते! आशा है आपका दिन अच्छा जा रहा होगा। मैं आपकी क्या मदद कर सकता हूँ?)";
        }

        // 5. THANK YOU
        if (
            cleanQuery.includes("thank") || 
            cleanQuery.includes("thanks") || 
            cleanQuery.includes("dhanyawad") || 
            cleanQuery.includes("shukriya") || 
            cleanQuery.includes("धन्यवाद") || 
            cleanQuery.includes("शुक्रिया")
        ) {
            return "You're very welcome! ❤️ Helping you makes me happy. Is there anything else you'd like to ask? (आपका स्वागत है! आपकी मदद करके मुझे खुशी हुई। क्या आप कुछ और पूछना चाहते हैं?)";
        }

        // 6. BYE
        if (
            cleanQuery.includes("bye") || 
            cleanQuery.includes("goodbye") || 
            cleanQuery.includes("alvida") || 
            cleanQuery.includes("बाय")
        ) {
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

        // 8. CUSTOM ORDER OR ENQUIRY
        if (cleanQuery.includes("order") || cleanQuery.includes("buy") || cleanQuery.includes("delivery") || cleanQuery.includes("dawa") || cleanQuery.includes("medicine")) {
            return "To order medicines, simply search for them in our Medicine Catalog, add them to your Cart, and proceed to checkout. For special prescription medicines, feel free to contact us at +91 8707535798! (दवाएं ऑर्डर करने के लिए कैटलॉग से सिलेक्ट करें, कार्ट में डालें और चेकआउट करें।)";
        }

        // 9. GENERAL CONVERSATION FALLBACK
        return "I understand your point! 📝 As your DawaKhana Assistant, I'm here to support you. Let me know if you have any questions about health, medicines, or your orders! (मैं समझ रहा हूँ। दवाओं या सेहत से जुड़े किसी भी सवाल के लिए आप मुझसे बेझिझक पूछ सकते हैं।)";
    };

    const handleSend = async () => {
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

        try {
            const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
            
            // Check if key is present and starts with standard Google AI Studio key prefix
            if (geminiKey && (geminiKey.startsWith("AIzaSy") || geminiKey.startsWith("AQ."))) {
                // Initialize Gemini Client
                const genAI = new GoogleGenerativeAI(geminiKey);
                const model = genAI.getGenerativeModel({
                    model: "gemini-3.5-flash",
                    systemInstruction: "You are the DawaKhana Assistant, a helpful and friendly online pharmacy companion. You must reply politely in Hinglish/Hindi/English. Give short health info when asked (fever, cold, stomach ache), but politely remind them to consult a doctor. Be friendly, answer queries like 'kaise ho' (I am fine), 'khana khaya' (I am an AI, I don't eat food, but I run on electricity). Keep answers concise and interactive."
                });

                // Convert message history to Gemini format
                const formattedHistory = messages.map(msg => ({
                    role: msg.sender === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.text }]
                }));

                // Append latest query
                formattedHistory.push({
                    role: 'user',
                    parts: [{ text: userQuery }]
                });

                const result = await model.generateContent({
                    contents: formattedHistory,
                    generationConfig: {
                        maxOutputTokens: 250,
                    }
                });

                const botText = result.response.text() || "I am currently processing your query. Please try again. (मैं आपके प्रश्न पर कार्य कर रहा हूँ।)";
                
                setMessages((prev) => [...prev, {
                    text: botText,
                    sender: 'bot',
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }]);
            } else {
                // If API Key is not set or invalid format, run robust local pattern matcher
                setTimeout(() => {
                    setMessages((prev) => [...prev, {
                        text: getLocalResponse(userQuery),
                        sender: 'bot',
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }]);
                }, 800);
            }
        } catch (error) {
            console.warn("Gemini AI API Error:", error);
            // Fallback to local response on API error
            setMessages((prev) => [...prev, {
                text: getLocalResponse(userQuery),
                sender: 'bot',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
        } finally {
            setIsTyping(false);
        }
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
