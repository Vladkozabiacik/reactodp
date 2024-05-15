import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import ChatInput from './ChatInput';
import ChatMessage from './ChatMessage';
import './Chat.css';
const Chat = () => {
  const { chat_id } = useParams();
  const [ws, setWs] = useState(null);
  const [state, setState] = useState({
    conversation_id: chat_id || null,
    user_id: null,
    name: null,
    messages: [],
  });

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

      setState(prevState => ({
        ...prevState,
        user_id,
        name: username || 'DacoSaPokazilo'
      }));

      const URL = `ws://10.1.3.183:3030?conversation_id=${chat_id}`;
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
        ws.send(JSON.stringify(state.user_id));
        ws.send(JSON.stringify({ conversation_id: state.conversation_id }));
      };
  
      ws.onmessage = evt => {
        if (evt.data instanceof Blob) {
          const reader = new FileReader();
          reader.onload = () => {
            const message = JSON.parse(reader.result);
            loadMessage(message);
          };
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
  }, [ws, state.conversation_id, state.user_id]);
  
  const loadMessage = message => {
    setState(prevState => ({
      ...prevState,
      messages: [...prevState.messages, message]
    }));
  };

  const addMessage = message => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const currentTime = `${hours}:${minutes}:${seconds}`;

    const messageWithTimestamp = { ...message, timestamp: currentTime };

    setState(prevState => ({
      ...prevState,
      messages: [messageWithTimestamp, ...prevState.messages]
    }));
  };

  const submitMessage = messageString => {
    const { conversation_id, user_id, name } = state;
    const message = {
      conversation_id,
      user_id,
      username: name,
      content: messageString,
    };
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket connection is not open.');
    }
    addMessage(message);
  };

  const { user_id, messages } = state;

  const reversedMessages = [...messages].reverse();

  return (
    <div>
      <Link to="/"><button>Go back to chats</button></Link>
      <ChatInput
        ws={ws}
        onSubmitMessage={messageString => submitMessage(messageString)}
      />
      <div className='chat-wrapper'>
      {reversedMessages.map((message, index) => {
        const isUserSender = message.user_id === user_id;
          return (
            <div key={index} style={{display: 'flex', justifyContent: isUserSender ? 'end' : 'start' }}>
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
