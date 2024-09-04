import React, { useState, useEffect } from 'react';
import moment from 'moment'; // Assuming moment is used for formatting timestamps
import $ from 'jquery'; // Assuming jQuery is globally available

const MessageList = ({ onClose, messageDeleted }) => {
  const [messages, setMessages] = useState(
    JSON.parse(sessionStorage.getItem('messageQueue') || '[]').reverse()
  );
  const [detailIndex, setDetailIndex] = useState(undefined);

  useEffect(() => {
    const modal = LeoKit.modal($('.messageList'), {}, 'Messages', onClose);

    return () => {
      LeoKit.closeModal(modal); // Clean up the modal on unmount
    };
  }, [onClose]);

  const clearMessage = (index) => {
    const updatedMessages = [...messages];
    updatedMessages.splice(index, 1);
    sessionStorage.setItem('messageQueue', JSON.stringify(updatedMessages.reverse()));
    setMessages(updatedMessages.reverse());
    LeoKit.center($('.messageList'));
    messageDeleted(updatedMessages.length);
  };

  const clearMessages = () => {
    sessionStorage.removeItem('messageQueue');
    setMessages([]);
    LeoKit.center($('.messageList'));
    messageDeleted(0);
  };

  return (
    <div className="display-none">
      <div className="messageList">
        {messages && messages.length > 0 ? (
          <div className="height-1-1 overflow-hidden">
            <div className="height-1-1 message-list">
              {messages.map((message, index) => {
                if (typeof message.message === 'object' && !Array.isArray(message.message)) {
                  message.message = Object.keys(message.message);
                }
                return (
                  <div key={index} className={`message ${message.priority || 'success'}`}>
                    <div>
                      {(message.message || message).map((msg, key) => (
                        <span key={key}>{msg}</span>
                      ))}
                      <i
                        className="icon-minus-circled pull-right"
                        onClick={() => clearMessage(index)}
                      />
                      <div className="details-wrapper">
                        {message.details ? (
                          detailIndex === index ? (
                            <>
                              <div key="0" className="details">
                                {JSON.stringify(message.details || {}, null, 4)}
                              </div>
                              <span
                                key="1"
                                className="pull-right cursor-pointer"
                                onClick={() => setDetailIndex(undefined)}
                              >
                                hide details
                              </span>
                            </>
                          ) : (
                            <span
                              className="pull-right cursor-pointer"
                              onClick={() => {
                                setDetailIndex(index);
                                LeoKit.center($('.messageList'));
                              }}
                            >
                              view details
                            </span>
                          )
                        ) : null}
                      </div>
                      <small>
                        {message.timestamp ? moment(message.timestamp).format('MMM D @ h:mm:ss a') : '-'}
                      </small>
                    </div>
                  </div>
                );
              })}
            </div>
            <div>
              <button type="button" className="theme-button pull-right" onClick={clearMessages}>
                Clear Message List
              </button>
            </div>
          </div>
        ) : (
          <div>No messages</div>
        )}
      </div>
    </div>
  );
};

export default MessageList;
