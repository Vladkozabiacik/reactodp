import React, { Component } from 'react';
import ChatInput from './ChatInput';
import ChatMessage from './ChatMessage';

const URL = 'ws://localhost:3030';

class Chat extends Component {
  constructor(props) {
    super(props);
    this.state = {
      conversation_id: props.conversation_id || 1,
      user_id: props.user_id || 1,
      name: props.username || 'DacoSaPokazilo',
      messages: [],
    };
    this.ws = new WebSocket(URL);
  }

  componentDidMount() {
    this.ws.onopen = () => {
      console.log('Connected');
      this.ws.send(JSON.stringify(this.state.user_id));
    };

    this.ws.onmessage = evt => {
      if (evt.data instanceof Blob) {
        const reader = new FileReader();
        reader.onload = () => {
          const message = JSON.parse(reader.result);
          this.addMessage(message);
        };
        reader.readAsText(evt.data);
      } else {
        const message = JSON.parse(evt.data);
        this.addMessage(message);
      }
    };

    this.ws.onclose = () => {
      console.log('Disconnected');
      this.setState({
        ws: new WebSocket(URL),
      });
    };
  }

  addMessage = message => {
    this.setState(prevState => {
      const updatedMessages = [...prevState.messages, message];
      console.log('Updated messages:', updatedMessages);
      return { messages: updatedMessages };
    });
  };

  submitMessage = messageString => {
    const message = {
      conversation_id: this.state.conversation_id,
      user_id: this.state.user_id,
      username: this.state.name,
      message: messageString,
    };
    this.ws.send(JSON.stringify(message));
    this.addMessage(message);
  };

  render() {
    const { user_id, messages } = this.state;

    return (
      <div>
        <ChatInput
          ws={this.ws}
          onSubmitMessage={messageString => this.submitMessage(messageString)}
        />
        {messages.map((message, index) => {
          const isUserSender = message.user_id === user_id;
          return (
            <div key={index} style={{ textAlign: isUserSender ? 'right' : 'left' }}> {/* tento barbarsky pocin vieme passnut do props ChatMessageu ako boolean ak bude true tak sa zobrazi iny styling etc, docasne! */}
              <ChatMessage
                message={message.content}
                name={message.username}
              />
            </div>
          );
        })}
      </div>
    );
  }
}

export default Chat;
