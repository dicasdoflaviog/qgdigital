import { useState, useEffect, useRef, useCallback } from "react";

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export const useVoiceInput = (onResult: (text: string) => void) => {
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const fullTranscriptRef = useRef("");
  const onResultRef = useRef(onResult);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript + " ";
        } else {
          interim += transcript;
        }
      }
      if (final) {
        fullTranscriptRef.current += final;
      }
      onResultRef.current((fullTranscriptRef.current + interim).trim());
    };

    recognition.onend = () => {
      if (isListeningRef.current) {
        console.log("Speech recognition ended due to silence, restarting...");
        try {
          recognition.start();
        } catch {
          isListeningRef.current = false;
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "not-allowed" || event.error === "denied") {
        isListeningRef.current = false;
        setIsListening(false);
      } else if (event.error === "no-speech") {
        // Will auto-restart via onend
      } else {
        isListeningRef.current = false;
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      isListeningRef.current = false;
      recognitionRef.current?.stop();
    };
  }, []);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current || !supported) return;

    if (isListening) {
      isListeningRef.current = false;
      recognitionRef.current.stop();
    } else {
      fullTranscriptRef.current = "";
      isListeningRef.current = true;
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening, supported]);

  return { isListening, toggleListening, supported };
};
