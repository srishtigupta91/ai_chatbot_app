import React, { useState } from 'react';

const ChatBot = () => {
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);

  const handleSend = () => {
    // ...existing code for sending message to backend...
    setChat([...chat, { sender: 'vendor', text: message }]);
    setMessage('');
  };

  return (
    <div>
      <h2>ChatBot</h2>
      <div>
        {chat.map((c, index) => (
          <p key={index}>
            <strong>{c.sender}:</strong> {c.text}
          </p>
        ))}
      </div>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button onClick={handleSend}>Send</button>
    </div>
  );
};

export default ChatBot;
