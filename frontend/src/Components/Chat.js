import React, { Component } from 'react';
import ChatInput from './ChatInput';
import ChatMessage from './ChatMessage';

const URL = 'ws://localhost:3030';

class Chat extends Component {
  state = {
    conversation_id: this.props.conversation_id || 1,
    user_id: null,
    name: null,
    messages: [],
  };

  ws = new WebSocket(URL);

  componentDidMount() {
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

    this.setState({
      user_id,
      name: username || 'DacoSaPokazilo'
    });

    this.ws.onopen = () => {
      console.log('Connected');
      this.ws.send(JSON.stringify(user_id));
    };

    this.ws.onmessage = evt => {
      if (evt.data instanceof Blob) {
        const reader = new FileReader();
        reader.onload = () => {
          const message = JSON.parse(reader.result);
          this.loadMessage(message);
        };
        reader.readAsText(evt.data);
      } else {
        const message = JSON.parse(evt.data);
        this.loadMessage(message);
      }
    };

    this.ws.onclose = () => {
      console.log('Disconnected');
      this.setState({
        ws: new WebSocket(URL),
      });
    };
    this.setState(prevState => ({
      messages: prevState.messages.reverse()
    }));
  }
  loadMessage = message => {
    this.setState(prevState => {
      const updatedMessages = [...prevState.messages, message];
      return { messages: updatedMessages };
    });
  }
  addMessage = message => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const currentTime = `${hours}:${minutes}:${seconds}`;
  
    const messageWithTimestamp = { ...message, timestamp: currentTime };
  
    this.setState(prevState => {
      const updatedMessages = [messageWithTimestamp, ...prevState.messages];
      return { messages: updatedMessages };
    });
  };

  submitMessage = messageString => {
    const { conversation_id, user_id, name } = this.state;
    const message = {
      conversation_id,
      user_id,
      username: name,
      content: messageString,
    };
    this.ws.send(JSON.stringify(message));
    this.addMessage(message);
  };

  render() {
    const { user_id } = this.state;
    const { messages } = this.state;
  
    const reversedMessages = [...messages].reverse();
  
    return (
      <div>
        <ChatInput
          ws={this.ws}
          onSubmitMessage={messageString => this.submitMessage(messageString)}
        />
        {reversedMessages.map((message, index) => {
          const isUserSender = message.user_id === user_id;
          return (
            <div key={index} style={{ textAlign: isUserSender ? 'right' : 'left' }}>
              <ChatMessage
                message={message.content}
                name={message.username}
                timestamp={message.timestamp}
              />
            </div>
          );
        })}
      </div>
    );
  }
  
}

export default Chat;
