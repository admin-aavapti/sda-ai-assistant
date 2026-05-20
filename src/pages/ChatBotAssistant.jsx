import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import SPEAKING_VID from "./speaking.mp4";
import LISTENING_VID from "./listening.mp4";
import THINKING_IMG from "./holding_mobile_image.png";

// --- Constants ---
const SERVER = 'https://sda-rag-api-hwapdnhbfsfdh9ef.centralindia-01.azurewebsites.net';
const STT_LOCALE = 'en-US';

const ASSETS = {
  LISTENING: LISTENING_VID,
  SPEAKING: SPEAKING_VID,
  THINKING: THINKING_IMG,
  COLORS: {
    PRIMARY_PINK: '#CF0048',
    LIGHT_PINK: '#FFF0F3',
    WHITE: '#FFFFFF',
    LIGHT_GRAY: '#E1E5E9',
    BLACK: '#000000'
  }
};

const ChatBotAssistant = () => {
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentAssistantResponse, setCurrentAssistantResponse] = useState('');
  const [isTypingResponse, setIsTypingResponse] = useState(false);
  const [voicePhase, setVoicePhase] = useState('idle');
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // --- Window resize tracking ---
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;

  // --- 1. Speech-to-Text (STT) Initialization ---
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = STT_LOCALE;

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setInputMessage(transcript);
      };

      recognitionRef.current.onend = () => {
        if (voicePhase === 'listening') setVoicePhase('idle');
      };

      recognitionRef.current.onerror = () => setVoicePhase('idle');
    }
  }, [voicePhase]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, currentAssistantResponse]);

  // --- 2. Female Voice Selection & TTS ---
  const playTTS = (text) => {
    window.speechSynthesis.cancel();
    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();

    const femaleVoice = voices.find(voice =>
      voice.name.toLowerCase().includes('female') ||
      voice.name.toLowerCase().includes('woman') ||
      voice.name.toLowerCase().includes('zira') ||
      voice.name.toLowerCase().includes('samantha') ||
      voice.name.toLowerCase().includes('google uk english female')
    );

    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }

    utterance.lang = STT_LOCALE;
    utterance.rate = 1.0;

    utterance.onstart = () => setVoicePhase('speaking');
    utterance.onend = () => setVoicePhase('idle');
    utterance.onerror = () => setVoicePhase('idle');

    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    window.speechSynthesis.getVoices();
  }, []);

  const startListening = () => {
    if (recognitionRef.current) {
      window.speechSynthesis.cancel();
      setVoicePhase('listening');
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setVoicePhase('idle');
    }
  };

  const animateText = (fullText) => {
    setCurrentAssistantResponse('');
    setIsTypingResponse(true);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setCurrentAssistantResponse(fullText.slice(0, i));
      if (i >= fullText.length) {
        clearInterval(interval);
        setIsTypingResponse(false);
        setChatMessages(prev => [...prev, {
          type: 'assistant',
          text: fullText,
          id: Date.now().toString()
        }]);
        setCurrentAssistantResponse('');
      }
    }, 25);
  };

  // --- 3. Backend API Integration with 1-Second Delay ---
  const handleSendMessage = async () => {
    const queryText = inputMessage.trim();
    if (!queryText || isLoading) return;

    setChatMessages(prev => [...prev, { type: 'user', text: queryText, id: Date.now().toString() }]);
    setInputMessage('');
    setIsLoading(true);
    setVoicePhase('thinking');

    try {
      const response = await axios.post(`${SERVER}/query`, {
        question: queryText,
        language: 'en-US',
        summarize: true
      });

      // alert("response - ", response)

      const reply = response.data?.summary || "I'm sorry, I couldn't reach the health assistant.";

      setIsLoading(false);
      animateText(reply);

      setTimeout(() => {
        playTTS(reply);
      }, 1000);

    } catch (error) {
      console.error(error);
      setIsLoading(false);
      setVoicePhase('idle');
      const errorMsg = "Sorry, I am unable to reach the health server right now.";
      setChatMessages(prev => [...prev, { type: 'assistant', text: errorMsg, id: Date.now().toString() }]);

      setTimeout(() => {
        playTTS(errorMsg);
      }, 1000);
    }
  };

  // --- Responsive style builder ---
  const getResponsiveStyles = () => {
    if (isMobile) {
      return {
        // Mobile: column layout — compact avatar strip on top, chat below
        avatarWrapper: { width: '80px', height: '80px' },
        leftSection: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: '12px',
          padding: '8px 16px',
          borderRight: 'none',
          borderBottom: `1px solid ${ASSETS.COLORS.LIGHT_GRAY}`,
          flexShrink: 0,
          width: '100%',
          backgroundColor: '#FFFFFF',
        },
        avatarZoneContent: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: '12px',
          width: '100%',
          justifyContent: 'flex-start',
        },
        mainContent: { flexDirection: 'column' },
        rightSection: { flex: '1', width: '100%', minHeight: 0 },
      };
    }
    if (isTablet) {
      return {
        avatarWrapper: { width: '240px', height: '240px' },
        leftSection: {
          flex: '0 0 38%',
          padding: '24px 16px',
          borderRight: `1px solid ${ASSETS.COLORS.LIGHT_GRAY}`,
        },
        avatarZoneContent: {},
        mainContent: { flexDirection: 'row' },
        rightSection: { flex: '1' },
      };
    }
    return {
      avatarWrapper: { width: '400px', height: '400px' },
      leftSection: {
        flex: '0 0 40%',
        padding: '40px',
        borderRight: `1px solid ${ASSETS.COLORS.LIGHT_GRAY}`,
      },
      avatarZoneContent: {},
      mainContent: { flexDirection: 'row' },
      rightSection: { flex: '1' },
    };
  };

  const responsive = getResponsiveStyles();

  return (
    <div style={styles.pageContainer}>
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <h1 style={styles.headerText}>Chat Assistant</h1>
        </div>
      </header>

      <div style={{ ...styles.mainContent, flexDirection: responsive.mainContent.flexDirection }}>

        {/* LEFT SECTION — Avatar */}
        <div style={{
          ...styles.leftSection,
          ...responsive.leftSection,
        }}>
          <div style={{
            ...styles.avatarZoneContent,
            ...responsive.avatarZoneContent,
          }}>

            {/* State pill — hide on mobile strip to save space */}
            {!isMobile && (
              <div style={styles.statePill}>{voicePhase.toUpperCase()}</div>
            )}

            <div style={{ ...styles.avatarWrapper, ...responsive.avatarWrapper }}>
              {voicePhase === 'thinking' ? (
                <img src={ASSETS.THINKING} style={styles.avatarMedia} alt="Thinking" />
              ) : (
                <video
                  key={voicePhase}
                  src={voicePhase === 'speaking' ? ASSETS.SPEAKING : ASSETS.LISTENING}
                  autoPlay loop muted playsInline
                  style={styles.avatarMedia}
                />
              )}
            </div>

            {/* On mobile: show name + state inline next to video */}
            {isMobile ? (
              <div style={styles.mobileAvatarInfo}>
                <span style={styles.mobileAvatarName}>MF — Health Assistant</span>
                <span style={{
                  ...styles.mobileStateBadge,
                  backgroundColor: voicePhase !== 'idle' ? ASSETS.COLORS.PRIMARY_PINK : ASSETS.COLORS.LIGHT_PINK,
                  color: voicePhase !== 'idle' ? '#fff' : ASSETS.COLORS.PRIMARY_PINK,
                  borderColor: ASSETS.COLORS.PRIMARY_PINK,
                }}>
                  {voicePhase.toUpperCase()}
                </span>
                <span style={styles.mobileAvatarSubtitle}>Ask me anything about safe delivery</span>
              </div>
            ) : (
              <>
                <h2 style={{ ...styles.avatarName, fontSize: isTablet ? '1rem' : '1.1rem' }}>MF — Health Assistant</h2>
                <p style={styles.avatarSubtitle}>Ask me anything about safe delivery</p>
              </>
            )}
          </div>
        </div>

        {/* RIGHT SECTION — Chat */}
        <div style={{
          ...styles.rightSection,
          ...responsive.rightSection,
        }}>
          <div style={{
            ...styles.messagesList,
            padding: isMobile ? '16px' : isTablet ? '20px' : '30px',
          }}>
            {chatMessages.length === 0 && !isLoading && (
              <div style={styles.greeting}>Hi Buddy! How may I help you? 😊</div>
            )}

            {chatMessages.map((msg) => (
              <div key={msg.id} style={styles.messageBlock}>
                <div style={{
                  ...styles.bubbleLabel,
                  textAlign: msg.type === 'user' ? 'right' : 'left',
                  color: msg.type === 'user' ? ASSETS.COLORS.PRIMARY_PINK : '#888'
                }}>
                  {msg.type === 'user' ? 'YOUR QUESTION' : "MF'S RESPONSE"}
                </div>
                <div style={msg.type === 'user' ? styles.userBubble : styles.assistantBubble}>
                  {msg.text}
                </div>
              </div>
            ))}

            {isTypingResponse && (
              <div style={styles.messageBlock}>
                <div style={styles.bubbleLabel}>MF'S RESPONSE</div>
                <div style={styles.assistantBubble}>
                  {currentAssistantResponse}<span style={styles.cursor}>|</span>
                </div>
              </div>
            )}

            {isLoading && !isTypingResponse && (
              <div style={{ ...styles.assistantBubble, fontStyle: 'italic', fontSize: '0.9rem', color: '#666' }}>
                Searching for the best answer...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div style={{
            ...styles.inputContainer,
            padding: isMobile ? '12px 16px' : isTablet ? '16px 20px' : '25px',
          }}>
            <div style={styles.inputWrapper}>
              <textarea
                style={{
                  ...styles.input,
                  fontSize: isMobile ? '0.95rem' : '1rem',
                }}
                placeholder={voicePhase === 'listening' ? "Speak now..." : "Type your query..."}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
              />
              <button
                onClick={voicePhase === 'listening' ? stopListening : startListening}
                style={{
                  ...styles.micButton,
                  backgroundColor: voicePhase === 'listening' ? '#ccc' : ASSETS.COLORS.PRIMARY_PINK,
                  width: isMobile ? '42px' : '48px',
                  height: isMobile ? '42px' : '48px',
                  flexShrink: 0,
                }}
              >
                🎙️
              </button>
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              style={{
                ...styles.sendButton,
                opacity: (!inputMessage.trim() || isLoading) ? 0.6 : 1,
                padding: isMobile ? '12px' : '14px',
                fontSize: isMobile ? '0.95rem' : '1rem',
              }}
            >
              Send Message
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Layout Styles ---
const styles = {
  pageContainer: {
    display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw',
    fontFamily: "'Segoe UI', Roboto, sans-serif", backgroundColor: '#fff', overflow: 'hidden'
  },
  header: {
    backgroundColor: ASSETS.COLORS.PRIMARY_PINK,
    padding: '12px 16px',
    color: '#fff',
    flexShrink: 0,
  },
  headerInner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    maxWidth: '100%',
  },
  headerText: { margin: 0, fontSize: '1.1rem', fontWeight: '500', textAlign: 'center', flex: 1 },
  mainContent: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  leftSection: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  avatarZoneContent: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    width: '100%', justifyContent: 'center'
  },
  avatarWrapper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '20px',
    overflow: 'hidden',
    backgroundColor: '#fff'
  },
  avatarMedia: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    display: 'block'
  },
  statePill: {
    border: `1px solid ${ASSETS.COLORS.PRIMARY_PINK}`, color: ASSETS.COLORS.PRIMARY_PINK,
    padding: '4px 14px', borderRadius: '20px', fontSize: '0.7rem', marginBottom: '20px',
    fontWeight: 'bold', letterSpacing: '1px'
  },
  avatarName: { margin: '5px 0', fontWeight: '600' },
  avatarSubtitle: { fontSize: '0.85rem', color: '#666', fontStyle: 'italic', textAlign: 'center' },
  // Mobile strip styles
  mobileAvatarInfo: {
    display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '4px', flex: 1,
  },
  mobileAvatarName: {
    fontSize: '0.85rem', fontWeight: '600', color: '#000', lineHeight: 1.2,
  },
  mobileAvatarSubtitle: {
    fontSize: '0.72rem', color: '#888', fontStyle: 'italic',
  },
  mobileStateBadge: {
    alignSelf: 'flex-start',
    border: `1px solid ${ASSETS.COLORS.PRIMARY_PINK}`,
    padding: '2px 10px', borderRadius: '20px',
    fontSize: '0.6rem', fontWeight: 'bold', letterSpacing: '0.8px',
    transition: 'all 0.2s ease',
  },
  rightSection: {
    display: 'flex', flexDirection: 'column', backgroundColor: '#fafafa',
    overflow: 'hidden',
  },
  messagesList: {
    flex: 1, overflowY: 'auto',
    display: 'flex', flexDirection: 'column', gap: '20px'
  },
  messageBlock: { display: 'flex', flexDirection: 'column' },
  bubbleLabel: { fontSize: '0.65rem', fontWeight: 'bold', marginBottom: '6px' },
  userBubble: {
    alignSelf: 'flex-end', backgroundColor: '#FFF0F3', padding: '12px 18px',
    borderRadius: '18px 18px 0 18px',
    maxWidth: '85%', border: '1px solid #FFD1DC',
    wordBreak: 'break-word',
  },
  assistantBubble: {
    alignSelf: 'flex-start', backgroundColor: '#FFFFFF', padding: '12px 18px',
    borderRadius: '18px 18px 18px 0',
    maxWidth: '85%', border: '1px solid #E1E5E9',
    boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
    wordBreak: 'break-word',
  },
  cursor: { color: ASSETS.COLORS.PRIMARY_PINK, fontWeight: 'bold' },
  inputContainer: {
    borderTop: `1px solid ${ASSETS.COLORS.LIGHT_GRAY}`,
    backgroundColor: '#fff',
    flexShrink: 0,
  },
  inputWrapper: { display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' },
  input: {
    flex: 1, borderRadius: '25px', border: '1px solid #ddd', padding: '12px 20px',
    outline: 'none', resize: 'none', height: '45px',
    fontFamily: "'Segoe UI', Roboto, sans-serif",
    boxSizing: 'border-box',
  },
  micButton: {
    border: 'none', borderRadius: '50%', cursor: 'pointer',
    fontSize: '1.2rem', color: '#fff',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  sendButton: {
    width: '100%', borderRadius: '30px', border: 'none',
    backgroundColor: ASSETS.COLORS.PRIMARY_PINK, color: '#fff',
    fontWeight: 'bold', cursor: 'pointer',
    fontFamily: "'Segoe UI', Roboto, sans-serif",
  },
  greeting: {
    textAlign: 'center', color: ASSETS.COLORS.PRIMARY_PINK,
    backgroundColor: '#FFF0F3', padding: '20px', borderRadius: '15px',
    border: '1px dashed #CF0048'
  }
};

export default ChatBotAssistant;
