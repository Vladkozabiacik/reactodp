import React from 'react';
import './ChatMessage.css';
const ChatMessage = ({ name, message }) => (
  <div className='message'>
    <p className='username-message'>{name}</p>
    <p className='message message-helper'>{message}</p>
  </div>
);

export default ChatMessage;
