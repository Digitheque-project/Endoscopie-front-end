/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  onFinalTranscript: (text: string, meta?: { startsAfterPause?: boolean }) => void;
  lang?: string;
  className?: string;
};

// Bouton micro compact pour dicter directement dans un champ (sans zone de texte dédiée).
export default function MicButton({ onFinalTranscript, lang = "fr-FR", className = "" }: Props) {
  const [isSupported] = useState(() => {
    if (typeof window === "undefined") return false;
    const SpeechRecognitionCtor = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    return Boolean(SpeechRecognitionCtor);
  });
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const forceBreakRef = useRef(false);
  const lastFinalRef = useRef("");
  // Intention de l'utilisateur — distingue un arrêt volontaire d'un arrêt inattendu du
  // moteur de reconnaissance (silence prolongé, limite navigateur), à relancer seul.
  const shouldListenRef = useRef(false);

  const start = () => {
    if (!isSupported) return;
    const SpeechRecognitionCtor = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = lang;
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (!res.isFinal) continue;
        const text = res[0]?.transcript?.trim() ?? "";
        if (text && text !== lastFinalRef.current) {
          lastFinalRef.current = text;
          onFinalTranscript(text, { startsAfterPause: forceBreakRef.current });
          forceBreakRef.current = false;
        }
      }
    };

    recognition.onerror = (event: any) => {
      // "no-speech" (silence normal) et "aborted" sont récupérables — onend s'en
      // charge (redémarrage automatique) plutôt que de couper la dictée pour ça.
      if (event?.error === "no-speech" || event?.error === "aborted") return;
      shouldListenRef.current = false;
      setIsRecording(false);
    };

    recognition.onend = () => {
      if (shouldListenRef.current) {
        try {
          recognition.start();
          return;
        } catch {}
      }
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    shouldListenRef.current = true;
    try {
      recognition.start();
      setIsRecording(true);
    } catch {}
  };

  const stop = () => {
    shouldListenRef.current = false;
    try {
      recognitionRef.current?.stop();
    } catch {}
    setIsRecording(false);
    forceBreakRef.current = true;
  };

  // Relâche le micro si le composant est démonté en cours de dictée (ex. changement
  // d'onglet du compte rendu) plutôt que de laisser le flux audio ouvert pour rien.
  useEffect(() => {
    return () => {
      shouldListenRef.current = false;
      try {
        recognitionRef.current?.stop();
      } catch {}
    };
  }, []);

  const toggle = () => (isRecording ? stop() : start());

  if (!isSupported) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      title={isRecording ? "Arrêter la dictée" : "Dicter"}
      aria-label="microphone"
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${isRecording ? "bg-rose-600 text-white shadow-md animate-pulse" : "bg-blue-600 text-white hover:bg-blue-700"} ${className}`}
    >
      <span className="material-symbols-outlined text-[18px]">{isRecording ? "stop" : "mic"}</span>
    </button>
  );
}
