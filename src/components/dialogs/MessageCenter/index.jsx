import React, { useCallback } from 'react';
import { useData } from '../../../stores/DataContext';
import { AnimatePresence, motion } from 'framer-motion';

const MessageCenter = () => {
  const { messages, removeMessage } = useData();

  const handleRemove = useCallback((id) => {
    removeMessage(id);
  }, [removeMessage]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`mb-2 p-4 rounded-lg shadow-lg 
              ${message.type === 'error' ? 'bg-red-500' :
              message.type === 'success' ? 'bg-green-500' :
              'bg-blue-500'} text-white`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 mr-4">{message.text}</div>
              <button
                onClick={() => handleRemove(message.id)}
                className="text-white hover:text-gray-200"
              >
                ×
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};