import React, { useState, useEffect, useRef } from 'react';
import './ProfessionalAvatar.css';
// Import the SVG sprite asset
import AvatarSprite from './avatar-sprite.svg'; 

const ProfessionalAvatar = ({ textToRead }) => {
  const [isTalking, setIsTalking] = useState(false);
  const synthesisRef = useRef(window.speechSynthesis);

  // Function to handle the synthesis
  const handleSpeak = () => {
    if (!textToRead) return;

    // Cancel any current speech
    synthesisRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(textToRead);

    utterance.onstart = () => {
      setIsTalking(true);
    };

    utterance.onend = () => {
      setIsTalking(false);
    };

    utterance.onerror = (event) => {
      console.error("SpeechSynthesisUtterance error", event);
      setIsTalking(false);
    };

    synthesisRef.current.speak(utterance);
  };

  // Clean up synthesis on unmount
  useEffect(() => {
    return () => {
      synthesisRef.current.cancel();
    };
  }, []);

  return (
    <div className="pro-avatar-container">
      {/* The Avatar Display Area */}
      <div className={`pro-avatar ${isTalking ? 'status-talking' : ''}`}>
        
        {/* The Base Face (always visible) */}
        {/* <div className="face-base" style={{ backgroundImage: `url(${'./avatar-sprite.svg'})` }}></div>
        <div className="mouth-window">
          <div className="mouth-sprite-sheet" style={{ backgroundImage: `url(${'./avatar-sprite.svg'})` }}></div>
        </div> */}

        <div className="face-base"></div>
  
        <div className="mouth-window">
          <div className="mouth-sprite-sheet"></div>
        </div>

      </div>

      {/* Control UI */}
      <div className="controls">
        <p className="text-preview">Will read: "{textToRead.substring(0, 30)}..."</p>
        <button className="speak-btn-pro" onClick={handleSpeak} disabled={isTalking}>
          {isTalking ? "Speaking..." : "Speak Text"}
        </button>
      </div>
    </div>
  );
};

export default ProfessionalAvatar;