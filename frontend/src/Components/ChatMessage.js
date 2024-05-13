import React from 'react';
import './ChatMessage.css';

const ChatMessage = ({ name, message, timestamp }) => {
  let displayTime;
  if (timestamp) {
    const isoDate = new Date(timestamp);
    if (!isNaN(isoDate)) {
      displayTime = isoDate.toLocaleTimeString();
    } else {
      const [hours, minutes, seconds] = timestamp.split(':');
      const date = new Date();
      date.setHours(hours);
      date.setMinutes(minutes);
      date.setSeconds(seconds);
      displayTime = date.toLocaleTimeString();
    }
  }

  return (
    <div className='message'>
      <p className='username-message'>{name}</p>
      <div className='message-content'>
        <p className='message message-helper'>{message}</p>
        <p className='timestamp'>{displayTime}</p>
      </div>
    </div>
  );
};

export default ChatMessage;
