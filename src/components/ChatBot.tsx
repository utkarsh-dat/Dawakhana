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
            return "I am doing fantastic, running smoothly and ready to help! 🚀 How are you doing today? If you need medical guidance, I can help you schedule a doctor consultation. (मैं बिल्कुल ठीक हूँ। आप कैसे हैं? यदि आपको चिकित्सा मार्गदर्शन की आवश्यकता है, तो मैं डॉक्टर परामर्श बुक करने में आपकी मदद कर सकता हूँ।)";
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
            return "Haha, I'm an AI, so I don't eat food! I only consume electricity and data. But please take good care of your health and eat on time. (हाहा, मैं एक एआई हूँ, इसलिए खाना नहीं खा सकता! कृपया अपने स्वास्थ्य का ध्यान रखें और समय पर भोजन करें।)";
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
            return "I am your friendly DawaKhana Virtual Assistant! 🤖 My primary goal is to help you browse our medicine catalog and assist you in booking teleconsultations with qualified doctors. (मैं आपका दवाखाना सहायक हूँ! मेरा काम दवाओं को खोजने और डॉक्टरों के साथ टेलीकंसल्टेशन बुक करने में आपकी मदद करना है।)";
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
            return "Hello there! 😊 How can I help you today? If you want to connect with a doctor, I can provide information to schedule a consultation. (नमस्ते! आज मैं आपकी क्या मदद कर सकता हूँ? यदि आप डॉक्टर से संपर्क करना चाहते हैं, तो मैं परामर्श शेड्यूल करने की जानकारी दे सकता हूँ।)";
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
            return "You're very welcome! ❤️ Let me know if you need help booking a doctor consultation or finding medicines. (आपका स्वागत है! परामर्श बुक करने या दवाओं को खोजने में मदद चाहिए तो अवश्य बताएं।)";
        }

        // 6. BYE
        if (
            cleanQuery.includes("bye") || 
            cleanQuery.includes("goodbye") || 
            cleanQuery.includes("alvida") || 
            cleanQuery.includes("बाय")
        ) {
            return "Goodbye! 👋 Take care of your health! If you ever need a teleconsultation, we are here to help. (बाय-बाय! अपनी सेहत का ख्याल रखें!)";
        }

        // 7. HEALTH ISSUES / SYMPTOMS / DOCTOR CONSULTATION REQUESTS
        if (
            cleanQuery.includes('fever') || cleanQuery.includes('bukhar') || cleanQuery.includes('बुखार') ||
            cleanQuery.includes('cough') || cleanQuery.includes('cold') || cleanQuery.includes('खांसी') || 
            cleanQuery.includes('सर्दी') || cleanQuery.includes('जुकाम') || cleanQuery.includes('sardi') || 
            cleanQuery.includes('khansi') || cleanQuery.includes('headache') || cleanQuery.includes('sir dard') || 
            cleanQuery.includes('सर दर्द') || cleanQuery.includes('stomach') || cleanQuery.includes('pet dard') || 
            cleanQuery.includes('पेट दर्द') || cleanQuery.includes('acidity') || cleanQuery.includes('gas') ||
            cleanQuery.includes('doctor') || cleanQuery.includes('consult') || cleanQuery.includes('appointment') || 
            cleanQuery.includes('ill') || cleanQuery.includes('sick') || cleanQuery.includes('pain') ||
            cleanQuery.includes('डॉक्टर') || cleanQuery.includes('बीमार') || cleanQuery.includes('दिखाना')
        ) {
            return "To protect your health, I am strictly forbidden from providing medical advice, suggesting diagnoses, or recommending individual doctors. However, you can schedule a teleconsultation with a qualified medical professional through our platform. Please contact us at +91 8707535798 to book your consultation! (अपनी सुरक्षा के लिए, मुझे चिकित्सा सलाह देने, रोगों का निदान करने या विशिष्ट डॉक्टरों की सिफारिश करने की अनुमति नहीं है। यदि आप अस्वस्थ हैं, तो आप हमारे प्लेटफ़ॉर्म के माध्यम से डॉक्टर के साथ टेलीकंसल्टेशन बुक कर सकते हैं। बुकिंग के लिए कृपया +91 8707535798 पर संपर्क करें!)";
        }

        // 8. CUSTOM ORDER OR ENQUIRY
        if (cleanQuery.includes("order") || cleanQuery.includes("buy") || cleanQuery.includes("delivery") || cleanQuery.includes("dawa") || cleanQuery.includes("medicine")) {
            return "To order medicines, simply search for them in our Medicine Catalog, add them to your Cart, and proceed to checkout. For support or ordering, contact us at +91 8707535798! (दवाएं ऑर्डर करने के लिए कैटलॉग से सिलेक्ट करें, कार्ट में डालें और चेकआउट करें।)";
        }

        // 9. GENERAL CONVERSATION FALLBACK
        return "I am here to assist you! 📝 I can guide you on how to book a teleconsultation with qualified doctors on our platform or find medicines. For teleconsultation bookings, please contact us at +91 8707535798. (मैं आपकी सहायता के लिए तैयार हूँ! आप +91 8707535798 पर संपर्क करके टेलीकंसल्टेशन बुक कर सकते हैं।)";
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
                    systemInstruction: "You are a digital pharmacy assistant for the DawaKhana website. Your primary goal is to assist users in booking consultations with qualified medical professionals. When a user expresses a health concern, reports symptoms, or requests to see a doctor, you must provide information on how to schedule a teleconsultation through our platform (by contacting support at +91 8707535798). You are STRICTLY FORBIDDEN from providing medical advice, suggesting diagnoses, recommending specific medications, or recommending individual doctors."
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
