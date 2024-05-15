import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './ChatInput.css';
class ChatInput extends Component {
  static propTypes = {
    onSubmitMessage: PropTypes.func.isRequired,
  }
  state = {
    message: '',
  }

  render() {
    return (
      <div className='send-message'>
        <form
          action="."
          onSubmit={e => {
            e.preventDefault()
            this.props.onSubmitMessage(this.state.message)
            this.setState({ message: '' })
          }}
        >
          <input
            type="text"
            placeholder={'Enter message...'}
            value={this.state.message}
            onChange={e => this.setState({ message: e.target.value })}
            required
          />
          <input type="submit" value={'Send'} />
        </form>
      </div>
    )
  }
}

export default ChatInput