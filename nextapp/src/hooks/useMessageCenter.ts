"use client";

import { useState, useCallback } from 'react';

/**
 * Custom hook for managing message notifications in the application
 */

// Define the message type
interface Message {
  details: any;
  timestamp: number;
  message: string | string[];
  priority: any;
  id: string;
}

const useMessageCenter = () => {
  const [messageQueue, setMessageQueue] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState<Message | null>(null);

  // Helper function to build a message object
  const buildMessage = useCallback((message: any, priority: any, details: any): Message => {
    return {
      details,
      timestamp: Date.now(),
      message: typeof message === 'string' ? [message] : message,
      priority,
      id: Math.random().toString(36).substring(2) + Date.now().toString(36),
    };
  }, []);

  // Message notification logic
  const messageNotify = useCallback((message: any, priority: any, details: any) => {
    const newMessage = buildMessage(message, priority, details);
    setMessageQueue(prevQueue => [...prevQueue, newMessage]);
    nextMessage();
  }, [buildMessage]);

  // Message logging logic
  const messageLog = useCallback((message: any, priority: any, details: any) => {
    const newMessage = buildMessage(message, priority, details);
    let messages = [];
    
    try {
      const storedMessages = sessionStorage.getItem('messageQueue');
      messages = storedMessages ? JSON.parse(storedMessages) : [];
    } catch (e) {
      console.error('Error parsing stored messages', e);
      messages = [];
    }
    
    messages.push(newMessage);
    sessionStorage.setItem('messageQueue', JSON.stringify(messages));
    
    return messages.length;
  }, [buildMessage]);

  // Combined message notification and logging
  const messageLogNotify = useCallback((message: any, priority: any, details: any) => {
    messageNotify(message, priority, details);
    messageLog(message, priority, details);
  }, [messageNotify, messageLog]);

  // Handle showing the next message in the queue
  const nextMessage = useCallback(() => {
    if (messageQueue.length > 0) {
      const next = messageQueue[0];
      setCurrentMessage(next);
      setMessageQueue((prevQueue) => prevQueue.slice(1));
      
      setTimeout(() => {
        setCurrentMessage(null);
        setTimeout(() => {
          if (messageQueue.length > 0) {
            nextMessage();
          }
        }, 500); // Delay before showing the next message
      }, 2500); // How long to show each message
    }
  }, [messageQueue]);

  // Get all stored messages
  const getStoredMessages = useCallback(() => {
    try {
      const storedMessages = sessionStorage.getItem('messageQueue');
      return storedMessages ? JSON.parse(storedMessages) : [];
    } catch (e) {
      console.error('Error retrieving stored messages', e);
      return [];
    }
  }, []);

  // Clear all stored messages
  const clearStoredMessages = useCallback(() => {
    sessionStorage.removeItem('messageQueue');
    return 0;
  }, []);

  return {
    messageQueue,
    currentMessage,
    messageNotify,
    messageLog,
    messageLogNotify,
    getStoredMessages,
    clearStoredMessages,
  };
};

export default useMessageCenter;