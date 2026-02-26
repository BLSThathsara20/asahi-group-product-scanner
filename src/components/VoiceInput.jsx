import { useState, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';

export function VoiceInput({ onResult, disabled, className = '' }) {
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const typingTimerRef = useRef(null);

  const handleResult = (text) => {
    onResult(text);
    setIsTyping(true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      setIsTyping(false);
      typingTimerRef.current = null;
    }, 500);
  };

  const toggle = () => {
    if (isListening) {
      setIsListening(false);
      if (window.__voiceRecognition) {
        window.__voiceRecognition.stop();
        window.__voiceRecognition = null;
      }
    } else {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setError('Voice input not supported. Try Chrome.');
        return;
      }
      setError(null);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            final += (final ? ' ' : '') + event.results[i][0].transcript;
          }
        }
        if (final) handleResult(final);
      };

      recognition.onerror = (e) => {
        if (e.error !== 'no-speech') {
          setError(e.error === 'not-allowed' ? 'Microphone access denied' : e.error);
        }
        recognition.stop();
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        window.__voiceRecognition = null;
      };

      window.__voiceRecognition = recognition;
      recognition.start();
      setIsListening(true);
    }
  };

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <div className="relative inline-flex">
        {isListening && (
          <span className="absolute -inset-1 rounded-lg bg-red-200/50 animate-ping" aria-hidden />
        )}
        {isTyping && (
          <span className="absolute -right-2 -top-2 flex gap-0.5" aria-hidden>
            <span className="w-1.5 h-1.5 bg-asahi rounded-full animate-bounce" style={{ animationDelay: '-0.3s' }} />
            <span className="w-1.5 h-1.5 bg-asahi rounded-full animate-bounce" style={{ animationDelay: '-0.15s' }} />
            <span className="w-1.5 h-1.5 bg-asahi rounded-full animate-bounce" />
          </span>
        )}
        <button
          type="button"
          onClick={toggle}
          disabled={disabled}
          className={`relative p-2 rounded-lg transition-colors ring-2 ring-transparent ${
            isListening ? 'ring-red-300 ring-offset-2 bg-red-100 text-red-600 hover:bg-red-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={isListening ? 'Stop listening' : 'Voice input'}
          aria-label={isListening ? 'Stop listening' : 'Start voice input'}
        >
          {isListening ? (
            <MicOff className="w-5 h-5" strokeWidth={2} />
          ) : (
            <Mic className="w-5 h-5" strokeWidth={2} />
          )}
        </button>
      </div>
      {isListening && (
        <span className="text-xs text-red-600 font-medium">Listening...</span>
      )}
      {isTyping && (
        <span className="text-xs text-asahi font-medium">Typing...</span>
      )}
      {error && (
        <p className="text-xs text-red-600 text-center">{error}</p>
      )}
    </div>
  );
}
