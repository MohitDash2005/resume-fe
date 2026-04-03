import { useState, useRef, useCallback, useEffect } from "react";

const LANG_CODES = {
  English:    "en-US",
  Hindi:      "hi-IN",
  Spanish:    "es-ES",
  French:     "fr-FR",
  German:     "de-DE",
  Japanese:   "ja-JP",
};

export const useSpeech = (language = "English") => {
  const [transcript, setTranscript]   = useState("");
  const [interim, setInterim]         = useState("");
  const [listening, setListening]     = useState(false);
  const [ttsActive, setTtsActive]     = useState(false);
  const [supported, setSupported]     = useState(true);
  const recognitionRef = useRef(null);
  const synthRef       = useRef(window.speechSynthesis);
  const langCode       = LANG_CODES[language] || "en-US";

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { setSupported(false); return; }

    const rec = new SpeechRecognition();
    rec.continuous      = true;
    rec.interimResults  = true;
    rec.lang            = langCode;
    rec.maxAlternatives = 1;

    rec.onresult = (e) => {
      let final = "", inter = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        e.results[i].isFinal ? (final += t) : (inter += t);
      }
      if (final) setTranscript(p => (p + " " + final).trim());
      setInterim(inter);
    };

    rec.onend  = () => { setListening(false); setInterim(""); };
    rec.onerror = (e) => { if (e.error !== "aborted") setListening(false); };
    recognitionRef.current = rec;
  }, [langCode]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || listening) return;
    setTranscript("");
    setInterim("");
    try { recognitionRef.current.start(); setListening(true); } catch {}
  }, [listening]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try { recognitionRef.current.stop(); } catch {}
    setListening(false);
  }, []);

  const speak = useCallback((text, onEnd) => {
    if (!synthRef.current || !text) return;
    synthRef.current.cancel();
    const utt  = new SpeechSynthesisUtterance(text);
    utt.lang   = langCode;
    utt.rate   = 0.92;
    utt.pitch  = 1.05;
    utt.volume = 1;

    // Pick a natural voice if available
    const voices = synthRef.current.getVoices();
    const match  = voices.find(v => v.lang.startsWith(langCode.split("-")[0]) && v.localService);
    if (match) utt.voice = match;

    utt.onstart = () => setTtsActive(true);
    utt.onend   = () => { setTtsActive(false); onEnd?.(); };
    utt.onerror = () => setTtsActive(false);
    synthRef.current.speak(utt);
  }, [langCode]);

  const cancelSpeech = useCallback(() => {
    synthRef.current?.cancel();
    setTtsActive(false);
  }, []);

  const clearTranscript = useCallback(() => setTranscript(""), []);

  return { transcript, interim, listening, ttsActive, supported, startListening, stopListening, speak, cancelSpeech, clearTranscript };
};
