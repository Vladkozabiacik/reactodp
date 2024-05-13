import React from 'react';
import './ChatMessage.css';

const ChatMessage = ({ name, message, timestamp }) => (
  <div className='message'>
    <p className='username-message'>{name}</p>
    <p className='message message-helper'>{message}</p>
    <p className='timestamp'>{timestamp}</p>
  </div>
);

export default ChatMessage;
