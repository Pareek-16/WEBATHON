import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, 
  MicOff, 
  Send, 
  Volume2, 
  VolumeX, 
  Globe, 
  Sparkles, 
  ArrowRight, 
  Bot, 
  User, 
  Clock, 
  Layers, 
  ShieldCheck,
  Check
} from 'lucide-react';
import { 
  AssistantMessage, 
  processUserQuery, 
  isSpeechRecognitionSupported, 
  isSpeechSynthesisSupported, 
  speakText, 
  stopSpeech 
} from '../services/voiceAssistant';
import { ShopkeeperProfile } from '../types';

interface VoiceAssistantViewProps {
  profile: ShopkeeperProfile;
  onNavigate: (tab: string) => void;
}

export const VoiceAssistantView: React.FC<VoiceAssistantViewProps> = ({
  profile,
  onNavigate,
}) => {
  const [language, setLanguage] = useState<'en' | 'hi' | 'hinglish'>(profile.preferredLanguage || 'en');
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechActive, setSpeechActive] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: language === 'hi'
        ? `नमस्ते ${profile.fullName}! मैं SmartStock SOS असिस्टेंट हूँ। आज के एक्सपायरी अलर्ट्स, गौशाला रिकवरी मैच, रीऑर्डर लिस्ट या दुकान के मूल्यांकन के बारे में मुझसे पूछें।`
        : `Hello ${profile.fullName}! I am SmartStock SOS, your AI inventory assistant. Ask me about today's expiry priorities, gaushala/NGO recovery matches, low stock reorders, or Diwali demand forecast.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isListening]);

  // Handle Speech Recognition
  const toggleListening = () => {
    if (!isSpeechRecognitionSupported()) {
      alert('Speech Recognition is not natively supported in this browser. Please type your query in the box below.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognitionClass();
    recognitionRef.current = recognition;

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      handleSendMessage(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleSendMessage = (textToSend?: string) => {
    const q = textToSend || inputText;
    if (!q.trim()) return;

    const userMsg: AssistantMessage = {
      id: 'usr_' + Date.now(),
      sender: 'user',
      text: q.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');

    // Process query using live DB
    setTimeout(() => {
      const response = processUserQuery(q, language);
      setMessages(prev => [...prev, response]);

      // Automatically speak response if audio is enabled
      if (profile.audioAlertsEnabled) {
        setSpeechActive(true);
        speakText(response.text, language);
      }
    }, 350);
  };

  const promptSuggestions = [
    { label: 'Expired Stock', query: 'Show me all expired products' },
    { label: 'This Week Expiry', query: 'Which products expire this week?' },
    { label: 'Aaj Ka Stock (Hindi)', query: 'Aaj kaun sa stock check karna hai?' },
    { label: 'Gaushala Matches', query: 'Find eligible farmers and gaushalas for surplus bread' },
    { label: 'Reorder Low Stock', query: 'Which items should I reorder from suppliers?' },
    { label: 'Store Valuation', query: 'What is my current inventory purchase value?' },
    { label: 'Diwali Forecast', query: 'Prepare my Diwali festive stock plan' },
  ];

  return (
    <div className="content-body" style={{ display: 'flex', flexDirection: 'column', gap: 18, height: 'calc(100vh - 120px)' }}>
      {/* Title & Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 className="heading-1">SmartStock SOS Assistant</h1>
            <span className="badge badge-mint" style={{ fontSize: 12 }}>Multilingual Voice AI</span>
          </div>
          <p style={{ marginTop: 4 }}>
            Speak in Hindi, English, or Hinglish to inspect stock, execute safety checks, and forecast demand.
          </p>
        </div>

        {/* Language selector & Speech Mute */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: 3 }}>
            {[
              { id: 'en', label: 'English' },
              { id: 'hi', label: 'हिन्दी' },
              { id: 'hinglish', label: 'Hinglish' },
            ].map(l => (
              <button
                key={l.id}
                className={`btn btn-xs ${language === l.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{ border: 'none', background: language === l.id ? 'var(--forest-green)' : 'transparent' }}
                onClick={() => setLanguage(l.id as any)}
              >
                {l.label}
              </button>
            ))}
          </div>

          <button
            className="icon-btn"
            onClick={() => {
              stopSpeech();
              setSpeechActive(false);
            }}
            title="Stop / Silence Assistant Speech"
          >
            <VolumeX size={18} />
          </button>
        </div>
      </div>

      {/* Suggested Prompt Pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
          Suggested:
        </span>
        {promptSuggestions.map((p, i) => (
          <button
            key={i}
            className="btn btn-xs btn-secondary"
            style={{ borderRadius: 'var(--radius-full)', whiteSpace: 'nowrap', fontSize: 12 }}
            onClick={() => handleSendMessage(p.query)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Chat Messages Container */}
      <div 
        className="card" 
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 16, 
          padding: 20,
          background: '#FDFEFC'
        }}
      >
        {messages.map(msg => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                gap: 12,
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                maxWidth: '75%',
                flexDirection: isUser ? 'row-reverse' : 'row'
              }}
            >
              {/* Avatar */}
              <div style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: isUser ? 'var(--forest-green)' : 'var(--mint-accent)',
                color: isUser ? '#FFFFFF' : 'var(--forest-green)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {isUser ? <User size={16} /> : <Bot size={18} />}
              </div>

              {/* Message Bubble */}
              <div style={{
                background: isUser ? 'var(--forest-green)' : '#FFFFFF',
                color: isUser ? '#FFFFFF' : 'var(--text-primary)',
                padding: '12px 16px',
                borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                border: isUser ? 'none' : '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-sm)',
                fontSize: 13.5,
                lineHeight: 1.5
              }}>
                <div>{msg.text}</div>

                {/* Data Highlights */}
                {msg.dataHighlight && (
                  <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                    {msg.dataHighlight.map((dh, idx) => (
                      <div key={idx} style={{ background: '#F5F8F6', border: '1px solid #DCE7E1', padding: '6px 10px', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ fontSize: 10.5, color: 'var(--text-secondary)' }}>{dh.label}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--forest-green)' }}>{dh.value}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Direct Action Link */}
                {msg.actionRoute && (
                  <button
                    className="btn btn-xs btn-primary"
                    style={{ marginTop: 10, background: 'var(--forest-green)', color: '#FFFFFF' }}
                    onClick={() => onNavigate(msg.actionRoute!)}
                  >
                    <span>{msg.actionLabel || 'Inspect Details'}</span>
                    <ArrowRight size={12} />
                  </button>
                )}

                <div style={{ fontSize: 10.5, color: isUser ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)', textAlign: 'right', marginTop: 6 }}>
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {/* Listening Waveform Indicator */}
        {isListening && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#E8F5EE', borderRadius: 'var(--radius-md)', alignSelf: 'flex-start' }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--critical-red)', animation: 'pulse 1s infinite' }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--forest-green)' }}>
              Listening... Speak now ({language === 'hi' ? 'हिन्दी में बोलें' : 'Speak in English'})
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box & Mic Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Animated Mic Button */}
        <button
          className="btn"
          style={{
            width: 48,
            height: 48,
            padding: 0,
            borderRadius: '50%',
            background: isListening ? 'var(--critical-red)' : 'var(--forest-green)',
            color: '#FFFFFF',
            flexShrink: 0,
            boxShadow: isListening ? '0 0 0 6px rgba(228, 91, 98, 0.25)' : 'none',
            transition: 'var(--transition)'
          }}
          onClick={toggleListening}
          title={isListening ? 'Click to stop listening' : 'Click to speak (Voice Recognition)'}
        >
          {isListening ? <MicOff size={22} /> : <Mic size={22} />}
        </button>

        {/* Text Input Field */}
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="text"
            className="form-control"
            placeholder={language === 'hi' ? 'यहाँ प्रश्न टाइप करें या माइक पर क्लिक करें...' : 'Ask about stock, expiry radar, recovery, reorder...'}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSendMessage();
              }
            }}
          />
        </div>

        {/* Send Button */}
        <button 
          className="btn btn-primary" 
          style={{ height: 44, width: 44, padding: 0 }}
          onClick={() => handleSendMessage()}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};
