import React from 'react';
import './Message.css';

const Message = ({message, visible, typeMessage="success"}) => {
  
  return (
    <div className={`alert alert-${typeMessage} max-alertmessage ${visible ? "show" : ""}`} role="alert">
    {message}
    </div>
  );
};

export default Message;
