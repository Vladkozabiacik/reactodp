import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import ChatInput from './ChatInput';
import ChatMessage from './ChatMessage';
import './Chat.css';
const Chat = () => {
  const { chat_id } = useParams();
  const [ws, setWs] = useState(null);
  const [conversationId, setConversationId] = useState(chat_id || null);
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState('DacoSaPokazilo');
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (chat_id) {
      const cookies = document.cookie.split(';');
      let username = null;
      let user_id = null;
      cookies.forEach(cookie => {
        const [key, value] = cookie.split('=');
        if (key.trim() === 'username') {
          username = value;
        } else if (key.trim() === 'user_id') {
          user_id = parseInt(value);
        }
      });

      setUserId(user_id);
      setUsername(username || 'DacoSaPokazilo');

      const URL = `ws://${process.env.REACT_APP_WS_HOST}:${process.env.REACT_APP_WS_PORT}?conversation_id=${chat_id}`;
      const wsInstance = new WebSocket(URL);
      setWs(wsInstance);

      return () => {
        if (wsInstance.readyState === 1) {
          wsInstance.close();
        }
      };
    }
  }, [chat_id]);

  useEffect(() => {
    if (ws) {
      ws.onopen = () => {
        console.log('Connected');
        ws.send(JSON.stringify({ user_id: userId }));
        ws.send(JSON.stringify({ conversation_id: conversationId }));
      };

      ws.onmessage = evt => {
        const reader = new FileReader();
        reader.onload = () => {
          const message = JSON.parse(reader.result);
          loadMessage(message);
        };

        if (evt.data instanceof Blob) {
          reader.readAsText(evt.data);
        } else {
          const message = JSON.parse(evt.data);
          loadMessage(message);
        }
      };

      ws.onclose = () => {
        console.log('Disconnected');
        setWs(null);
      };
    }
  }, [ws, conversationId, userId]);

  const loadMessage = message => {
    setMessages(prevMessages => [...prevMessages, message]);
  };

  const addMessage = message => {
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const messageWithTimestamp = { ...message, timestamp: currentTime };

    setMessages(prevMessages => [messageWithTimestamp, ...prevMessages]);
  };

  const submitMessage = messageString => {
    const message = {
      conversation_id: conversationId,
      user_id: userId,
      username: username,
      content: messageString,
    };
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket connection is not open.');
    }
    addMessage(message);
  };

  const reversedMessages = [...messages].reverse();

  return (
    <div>
      <Link to="/"><button>Go back to chats</button></Link>
      <Link to={`/chat/profile/${conversationId}`}><button>Group profile</button></Link>
      <ChatInput onSubmitMessage={submitMessage} />
      <div className='chat-wrapper'>
        {reversedMessages.map((message, index) => {
          const isUserSender = message.user_id === userId;
          return (
            <div key={index} style={{ display: 'flex', justifyContent: isUserSender ? 'end' : 'start' }}>
              <ChatMessage
                message={message.content}
                name={message.username}
                timestamp={message.timestamp}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Chat;
