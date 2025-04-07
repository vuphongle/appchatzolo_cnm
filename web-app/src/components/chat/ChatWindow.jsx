import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

// const socket = io('http://localhost:8080');

const ChatWindow = () => {
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');

    //   useEffect(() => {
    //     socket.on('receive_message', (newMessage) => {
    //       setMessages((prev) => [...prev, newMessage]);
    //     });

    //     return () => socket.disconnect();
    //   }, []);

    // const sendMessage = () => {
    //     if (message.trim() === '') return;
    //     socket.emit('send_message', { content: message });
    //     setMessage('');
    // };

    return (
        <div className="chat-window">
            <div className="messages">
                {messages.map((msg, index) => (
                    <p key={index}>{msg.content}</p>
                ))}
            </div>
            <div className="input-container">
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message"
                />
                {/* <button onClick={sendMessage}>Send</button> */}
            </div>
        </div>
    );
};

export default ChatWindow;
