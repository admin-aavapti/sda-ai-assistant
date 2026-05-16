import React, { useState, useEffect } from 'react';
import './SpeechAvatar.css';

const SpeechAvatar = ({ textToRead }) => {
  const [isTalking, setIsTalking] = useState(false);

  const handleSpeak = () => {
    if (!textToRead) return;

    const utterance = new SpeechSynthesisUtterance(textToRead);

    // Triggered when speech starts
    utterance.onstart = () => setIsTalking(true);
    
    // Triggered when speech ends
    utterance.onend = () => setIsTalking(false);

    // Cancel any ongoing speech and play new
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="avatar-container">
      <div className={`avatar ${isTalking ? 'is-talking' : ''}`}>
        <div className="head">
          <div className="eye left"></div>
          <div className="eye right"></div>
          <div className="mouth"></div>
        </div>
        <div className="body"></div>
      </div>
      
      <button className="speak-btn" onClick={handleSpeak}>
        Read Text Aloud
      </button>
    </div>
  );
};

export default SpeechAvatar;