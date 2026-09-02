import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface SpeechInputButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

// Support SpeechRecognition interfaces across browsers
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export const SpeechInputButton: React.FC<SpeechInputButtonProps> = ({
  onTranscript,
  disabled = false,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognitionClass =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript.trim()) {
        onTranscript(finalTranscript.trim());
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, [onTranscript]);

  const toggleListening = () => {
    if (!recognitionRef.current || disabled) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <button
      id="speech-dictate-btn"
      type="button"
      onClick={toggleListening}
      disabled={disabled}
      title={isListening ? 'Stop voice recording' : 'Dictate reflection (Speech-to-text)'}
      className={`relative flex h-9 w-9 items-center justify-center rounded-lg transition ${
        isListening
          ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/20'
          : 'text-stone-500 hover:bg-stone-100 hover:text-stone-700'
      } disabled:opacity-40`}
    >
      {isListening ? (
        <>
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
          </span>
          <MicOff className="h-4 w-4" />
        </>
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </button>
  );
};
