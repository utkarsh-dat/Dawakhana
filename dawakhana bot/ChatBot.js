import React, { useState } from 'react';

const ChatBot = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');

    const handleSend = () => {
        if (input.trim() !== '') {
            setMessages([...messages, { text: input, sender: 'user' }]);
            setInput('');
            // यहाँ पर आप अपने बॉट का जवाब प्रोसेस कर सकते हैं
        }
    };

    return (
        <div className="chatbot-container">
            <div className="chatbox">
                {messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.sender}`}>
                        {msg.text}
                    </div>
                ))}
            </div>
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="अपनी समस्या यहाँ लिखें / medicine name / medicine detail / or problrm e.g. fever,cough,cold or any type of information "
            />
            <button onClick={handleSend}>Submit</button>
        </div>
    );
};

export default ChatBot;