import React, { useState, useEffect } from 'react';

function MessageCenter({ messageLogged }) {
    const [messageQueue, setMessageQueue] = useState([]);
    const [currentMessage, setCurrentMessage] = useState(null);

    // Helper function to build a message object
    const buildMessage = (message, priority, details) => ({
        details,
        timestamp: Date.now(),
        message: typeof message === 'string' ? [message] : message,
        priority,
    });

    // Message notification logic
    const messageNotify = (message, priority, details) => {
        const newMessage = buildMessage(message, priority, details);
        setMessageQueue((prevQueue) => [...prevQueue, newMessage]);
        nextMessage();
    };

    // Message logging logic
    const messageLog = (message, priority, details) => {
        const newMessage = buildMessage(message, priority, details);
        let messages = sessionStorage.getItem('messageQueue') || '[]';
        try {
            messages = JSON.parse(messages);
        } catch (e) {
            messages = [];
        }
        messages.push(newMessage);
        sessionStorage.setItem('messageQueue', JSON.stringify(messages));
        messageLogged(messages.length);
    };

    // Combined message notification and logging
    const messageLogNotify = (message, priority, details) => {
        messageNotify(message, priority, details);
        messageLog(message, priority, details);
    };

    // Handle showing the next message in the queue
    const nextMessage = () => {
        if (messageQueue.length > 0) {
            const next = messageQueue.shift();
            setCurrentMessage(next);
            setMessageQueue([...messageQueue]);
            setTimeout(() => {
                setCurrentMessage(null);
                setTimeout(nextMessage, 500); // Continue to the next message after a delay
            }, 2500);
        }
    };

    useEffect(() => {
        // Attach the functions to window object for external calls (if needed)
        window.messageNotify = messageNotify;
        window.messageLog = messageLog;
        window.messageLogNotify = messageLogNotify;

        // Cleanup window functions on component unmount
        return () => {
            delete window.messageNotify;
            delete window.messageLog;
            delete window.messageLogNotify;
        };
    }, [messageQueue]);

    return (
        <div className="message-center message-list">
            {currentMessage && (
                <div className={`message ${currentMessage.priority || 'success'}`}>
                    {currentMessage.message.map((text, key) => (
                        <div key={key}>{text}</div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default MessageCenter;
