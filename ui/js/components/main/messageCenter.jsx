import React, { useState, useEffect } from 'react';

const MessageCenter = ({ messageLogged }) => {
  const [messageQueue, setMessageQueue] = useState([]);
  const [currentMessage, setCurrentMessage] = useState(null);

  // Helper to build a message object
  const buildMessage = (message, priority, details) => ({
    details,
    timestamp: Date.now(),
    message: typeof message === 'string' ? [message] : message,
    priority,
  });

  // Function to display the next message
  const nextMessage = () => {
    if (messageQueue.length > 0) {
      const [next, ...rest] = messageQueue;
      setCurrentMessage(next);
      setMessageQueue(rest);

      setTimeout(() => {
        setCurrentMessage(null);
        setTimeout(nextMessage, 500); // Prepare the next message after 500ms
      }, 2500); // Display message for 2500ms
    }
  };

  // Add new messages to the queue and trigger the next message display
  const addMessage = (message, priority, details) => {
    const newMessage = buildMessage(message, priority, details);
    setMessageQueue((prevQueue) => [...prevQueue, newMessage]);
  };

  // Log messages in session storage
  const logMessage = (message, priority, details) => {
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

  // Combining log and notify for messageLogNotify
  const messageLogNotify = (message, priority, details) => {
    addMessage(message, priority, details);
    logMessage(message, priority, details);
  };

  // Modal display for messages
  const messageModal = (message, priority, details) => {
    if (typeof message === 'object') {
      message = message.map((line) => line).join('<br/>');
    }
    if (details) {
      message += `<details class="message-details">
                    <summary></summary>
                    <pre>${JSON.stringify(details || {}, null, 4)}</pre>
                  </details>`;
    }
    alert(`${message}`); // You can use a modal component here instead of alert
  };

  // Lifecycle effect to handle the next message display
  useEffect(() => {
    if (messageQueue.length > 0 && !currentMessage) {
      nextMessage();
    }
  }, [messageQueue, currentMessage]);

  // Setting up global functions
  useEffect(() => {
    window.messageNotify = (message, priority, details) => {
      addMessage(message, priority, details);
    };

    window.messageLog = logMessage;

    window.messageLogNotify = messageLogNotify;

    window.messageModal = messageModal;

    return () => {
      // Cleanup global functions
      window.messageNotify = null;
      window.messageLog = null;
      window.messageLogNotify = null;
      window.messageModal = null;
    };
  }, []);

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
};

export default MessageCenter;
