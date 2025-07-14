import React, { useState, useEffect } from 'react';
import './VendorDashboard.css'; // Import the CSS file


const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const VendorDashboard = ({ companyId, initialGreeting, conversationTranscript }) => {
  const [messages, setMessages] = useState([]); // Chat messages
  const [input, setInput] = useState(''); // User input

  // Add the initial greeting to the chat only once when the component mounts
  useEffect(() => {
    if (initialGreeting && messages.length === 0) {
      setMessages([{ sender: 'agent', text: initialGreeting }]);
    }
  }, [initialGreeting]);

  // Update the chat messages when the conversationTranscript changes
  useEffect(() => {
    if (conversationTranscript.length > 0) {
      const latestMessage = conversationTranscript[conversationTranscript.length - 1];

      // Avoid adding duplicate messages
      setMessages((prevMessages) => {
        if (
          prevMessages.length > 0 &&
          prevMessages[prevMessages.length - 1].text === latestMessage.text
        ) {
          return prevMessages; // Do not add duplicate messages
        }
        return [
          ...prevMessages,
          {
            sender: latestMessage.speaker.toLowerCase(),
            text: latestMessage.text,
          },
        ];
      });
    }
  }, [conversationTranscript]);

  const handleSendMessage = async () => {
    if (!input.trim()) {
      alert('Please enter a message.');
      return;
    }

    const userId = localStorage.getItem('user_id'); // Retrieve user_id from localStorage
    const sessionId = localStorage.getItem('session_id'); // Retrieve session_id from localStorage

    if (!userId) {
      alert('User ID not found. Please log in again.');
      return;
    }

    if (!sessionId) {
      alert('Session ID not found. Please log in again.');
      return;
    }

    const formData = new FormData();
    formData.append('message', input);
    formData.append('user_id', userId);
    formData.append('company_id', companyId);
    formData.append('session_id', sessionId); // Add session_id to the payload

    try {
      const response = await fetch(`${BACKEND_URL}/api/conversation/chat/`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const agentMessage = { sender: 'agent', text: data.response };
        setMessages((prevMessages) => [
          ...prevMessages,
          { sender: 'user', text: input },
          agentMessage,
        ]);
        setInput(''); // Clear the input field
      } else {
        console.error('Failed to send message:', response.statusText);
        alert('Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Error during chat:', error);
      alert('An error occurred while communicating with the agent.');
    }
  };

  return (
    <div className="vendor-dashboard">
      <div className="chat-container">
        <h3>Chat History</h3>
        {messages.map((message, index) => (
          <div key={index} className={`chat-message ${message.sender}`}>
            <strong>{message.sender === 'user' ? 'You' : 'Agent'}:</strong> {message.text}
          </div>
        ))}
      </div>
      <div className="chat-input-container">
        <input
          type="text"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="chat-input"
        />
        <button onClick={handleSendMessage} className="chat-button">
          Send
        </button>
      </div>
    </div>
  );
};

export default VendorDashboard;