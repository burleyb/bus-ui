import React, { useState, useEffect } from 'react';
import Dialog from './dialog'; // Assuming this is the reusable Dialog component
import moment from 'moment';

function MessageList({ onClose, messageDeleted }) {
    const [messages, setMessages] = useState(JSON.parse(sessionStorage.getItem('messageQueue') || '[]').reverse());
    const [detailIndex, setDetailIndex] = useState(undefined);

    const clearMessage = (index) => {
        const updatedMessages = [...messages];
        updatedMessages.splice(index, 1);
        sessionStorage.setItem('messageQueue', JSON.stringify(updatedMessages.reverse()));
        setMessages(updatedMessages.reverse());
        messageDeleted(updatedMessages.length);
    };

    const clearMessages = () => {
        sessionStorage.removeItem('messageQueue');
        setMessages([]);
        messageDeleted(0);
    };

    return (
        <Dialog title="Messages" onClose={onClose}>
            {messages.length > 0 ? (
                <div className="height-1-1 overflow-hidden">
                    <div className="height-1-1 message-list">
                        {messages.map((message, index) => {
                            if (typeof message.message === 'object' && !message.message.length) {
                                message.message = Object.keys(message.message);
                            }
                            return (
                                <div key={index} className={`message ${message.priority || 'success'}`}>
                                    <div>
                                        {message.message.map((text, key) => (
                                            <span key={key}>{text}</span>
                                        ))}
                                        <i
                                            className="icon-minus-circled pull-right"
                                            onClick={() => clearMessage(index)}
                                            style={{ cursor: 'pointer' }}
                                        />
                                        <div className="details-wrapper">
                                            {message.details ? (
                                                detailIndex === index ? (
                                                    <>
                                                        <div className="details">
                                                            {JSON.stringify(message.details, null, 4)}
                                                        </div>
                                                        <span
                                                            className="pull-right cursor-pointer"
                                                            onClick={() => setDetailIndex(undefined)}
                                                        >
                                                            hide details
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span
                                                        className="pull-right cursor-pointer"
                                                        onClick={() => setDetailIndex(index)}
                                                    >
                                                        view details
                                                    </span>
                                                )
                                            ) : null}
                                        </div>
                                        <small>
                                            {message.timestamp
                                                ? moment(message.timestamp).format('MMM D @ h:mm:ss a')
                                                : '-'}
                                        </small>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div>
                        <button
                            type="button"
                            className="theme-button pull-right"
                            onClick={clearMessages}
                        >
                            Clear Message List
                        </button>
                    </div>
                </div>
            ) : (
                <div>No messages</div>
            )}
        </Dialog>
    );
}

export default MessageList;
