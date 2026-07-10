import React, { useState } from 'react';

interface Message {
    text: string;
    sender: 'user' | 'bot';
}

const ChatBot = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');

    const handleSend = () => {
        if (input.trim() !== '') {
            setMessages((prev) => [...prev, { text: input, sender: 'user' }]);
            setInput('');
            // Yahan bot response logic add kar sakte hain
        }
    };

    return (
        <div className="chatbot-container p-4 bg-white rounded-xl border border-slate-100 shadow-sm max-w-sm mt-4">
            <div className="chatbox max-h-60 overflow-y-auto mb-3 space-y-2">
                {messages.map((msg, index) => (
                    <div 
                        key={index} 
                        className={`p-2 rounded-lg text-sm max-w-[80%] ${
                            msg.sender === 'user' 
                                ? 'bg-primary text-white ml-auto' 
                                : 'bg-slate-100 text-slate-700'
                        }`}
                    >
                        {msg.text}
                    </div>
                ))}
            </div>
            <div className="flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-grow h-10 px-3 border border-slate-200 rounded-lg outline-none text-sm focus:border-primary text-slate-800"
                    placeholder="अपनी समस्या यहाँ लिखें / fever, cough, cold..."
                />
                <button 
                    onClick={handleSend}
                    className="h-10 px-4 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                    Submit
                </button>
            </div>
        </div>
    );
};

export default ChatBot;
