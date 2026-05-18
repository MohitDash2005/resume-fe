import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, RotateCcw, Mic, MicOff, Clock, Video, VideoOff, Loader2, Square, Maximize, Minimize, Building2, Crown, Lock } from "lucide-react";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import PracticeSetupWizard from "../components/interview/PracticeSetupWizard";
import EnvironmentCheck from "../components/interview/EnvironmentCheck";
import VideoPanel from "../components/interview/VideoPanel";
import LiveScoreHUD from "../components/interview/LiveScoreHUD";
import SubtitleBar from "../components/interview/SubtitleBar";
import ScoreReport from "../components/interview/ScoreReport";
import { useApp } from "../context/AppContext";
import { useSpeech } from "../hooks/useSpeech";
import { useScoring } from "../hooks/useScoring";
import {
  evaluateAnswer as apiEvaluateAnswer,
  getInterviewQuestion,
  createInterviewSession,
  completeInterviewSession,
} from "../api/resumeApi";
import { getFollowUp } from "../data/questions";

const REACTIONS = ["+1", "Tip", "Aim", "Star", "Hot"];

const PremiumGate = () => (
  <div className="h-full flex items-center justify-center p-4">
    <div
      className="w-full max-w-3xl rounded-3xl p-8 md:p-10"
      style={{
        background: "linear-gradient(135deg, rgba(17,24,39,0.96), rgba(8,8,18,0.98))",
        border: "1px solid rgba(236,72,153,0.18)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
      }}
    >
      <div className="flex flex-col md:flex-row md:items-start gap-8">
        <div className="flex-1">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
            style={{ background: "rgba(236,72,153,0.14)", border: "1px solid rgba(236,72,153,0.24)" }}
          >
            <Crown size={26} className="text-pink-400" />
          </div>
          <Badge label="Premium Only" variant="amber" />
          <h1 className="text-3xl font-black text-white mt-4">Premium Interview</h1>
          <p className="text-slate-400 mt-3 leading-relaxed max-w-xl">
            Practice company-specific interviews with the same live experience as the main interview page:
            webcam, speech-to-text, adaptive scoring, timers, and full reports.
          </p>

          <div className="grid sm:grid-cols-3 gap-3 mt-6">
            {[
              { icon: Building2, title: "Top Companies", text: "Amazon, Google, Microsoft, Meta and more." },
              { icon: Bot, title: "Live Coaching", text: "Real interview flow with scoring and follow-ups." },
              { icon: Lock, title: "Premium Access", text: "Unlock this mode with a premium plan." },
            ].map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="rounded-2xl p-4"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <Icon size={16} className="text-pink-400 mb-2" />
                <p className="text-sm font-bold text-white">{title}</p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <div
          className="w-full md:w-80 rounded-2xl p-5"
          style={{ background: "rgba(236,72,153,0.08)", border: "1px solid rgba(236,72,153,0.16)" }}
        >
          <p className="text-sm font-bold text-white">Upgrade required</p>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Your account does not have premium access yet. Once premium is enabled, this page opens the full interview setup immediately.
          </p>
          <div className="space-y-2 mt-5">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
              Company-specific question pools
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
              Live interview environment
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
              Detailed performance report
            </div>
          </div>
          <Button variant="outline" className="w-full mt-6">
            Contact Admin To Upgrade
          </Button>
        </div>
      </div>
    </div>
  </div>
);

const isNonAnswer = (answer = "") => {
  const lower = String(answer).toLowerCase().trim();
  return (
    lower.length <= 20 &&
    /\b(i don't know|i dont know|don't know|dont know|do not know|not sure|no idea|can't remember|cannot remember|sorry)\b/.test(lower)
  );
};

const FALLBACK_QUESTIONS = {
  Normal: {
    Beginner:     ["What does it mean to write clean code?", "Can you explain what a function is and why we use them?", "What is the difference between a bug and a feature?", "What does version control mean to you?", "Can you explain what an API is in simple terms?"],
    Intermediate: ["How do you prioritize tasks when working under pressure?", "Describe a challenge you solved recently and how you approached it.", "How do you approach debugging a problem you have never seen before?", "What is one skill you are currently improving, and how are you working on it?", "How do you decide when code is good enough to ship?"],
    Advanced:     ["How would you design a system that needs to handle 1 million requests per day?", "Describe a situation where you had to make a difficult architectural decision and its trade-offs.", "How do you approach technical debt in a fast-moving codebase?", "What strategies do you use to ensure reliability in a distributed system?", "How would you lead a team through a major refactor without breaking production?"],
  },
  Java: {
    Beginner:     ["What is the difference between a class and an object in Java?", "What does the static keyword mean in Java?", "Can you explain what inheritance is in Java?", "What is the difference between int and Integer in Java?", "What is a constructor and why do we use it?"],
    Intermediate: ["What is the difference between an interface and an abstract class in Java?", "How does Java handle exceptions, and when would you use checked vs unchecked exceptions?", "How would you implement thread safety in a Java application?", "What is the difference between ArrayList and LinkedList?", "How does the Java Collections Framework work?"],
    Advanced:     ["How does Java memory management and garbage collection work at a deep level?", "How would you design a scalable Spring Boot microservice with proper fault tolerance?", "Explain the Java memory model and how it affects concurrent programming.", "How would you optimize a Java application experiencing high GC pressure?", "What are the trade-offs between virtual threads in Java 21 vs traditional thread pools?"],
  },
  Python: {
    Beginner:     ["What is the difference between a list and a tuple in Python?", "What does it mean for Python to be dynamically typed?", "Can you explain what a dictionary is in Python?", "What is the difference between == and is in Python?", "What is a function in Python and how do you define one?"],
    Intermediate: ["What are Python generators, and when would you use them over a list?", "What are decorators in Python, and can you give a practical use case?", "How does Python's GIL affect multi-threaded programs?", "What is the difference between shallow copy and deep copy in Python?", "How would you structure a Python backend service for maintainability?"],
    Advanced:     ["How does Python's memory management and reference counting work internally?", "How would you design a high-performance async Python service using asyncio?", "What are metaclasses in Python and when would you actually use one?", "How would you profile and optimize a slow Python application in production?", "Explain how Python's import system works and how you would structure a large package."],
  },
  JavaScript: {
    Beginner:     ["What is the difference between let, const, and var in JavaScript?", "What is a callback function in JavaScript?", "Can you explain what the DOM is?", "What does undefined mean in JavaScript?", "What is the difference between == and === in JavaScript?"],
    Intermediate: ["What is the difference between synchronous and asynchronous JavaScript?", "Explain closures in JavaScript with a practical example.", "How does the event loop work in Node.js?", "What is event bubbling and how would you stop it?", "How do Promises differ from async/await?"],
    Advanced:     ["How would you optimize the performance of a large React application?", "Explain how JavaScript's prototype chain works and how it relates to class inheritance.", "How would you design a state management solution for a complex React app without Redux?", "What are the memory leak patterns in JavaScript and how do you detect them?", "How does V8 optimize JavaScript execution, and what patterns should you avoid?"],
  },
  "C++": {
    Beginner:     ["What is the difference between a pointer and a reference in C++?", "What does const mean when applied to a variable in C++?", "Can you explain what a class is in C++?", "What is the difference between stack and heap memory?", "What is a constructor and when is it called?"],
    Intermediate: ["When would you use virtual functions in C++, and what is the vtable?", "What is RAII and why is it important in C++?", "How do smart pointers work and when would you use unique_ptr vs shared_ptr?", "What is the difference between deep copy and shallow copy in C++?", "How does template specialization work in C++?"],
    Advanced:     ["How does the C++ memory model affect concurrent programming?", "What are the performance implications of virtual dispatch and how would you avoid it?", "How would you design a lock-free data structure in C++?", "Explain move semantics and perfect forwarding in C++11 and beyond.", "How would you profile and optimize a C++ application with high cache miss rates?"],
  },
  SQL: {
    Beginner:     ["What is the difference between a primary key and a foreign key?", "What does a SELECT statement do in SQL?", "Can you explain what a JOIN is in simple terms?", "What is the difference between WHERE and HAVING in SQL?", "What does NULL mean in a database?"],
    Intermediate: ["What is the difference between INNER JOIN and LEFT JOIN?", "How do indexes improve query performance, and when would you add one?", "What are database transactions and why are they important?", "What is normalization and what problem does it solve?", "How would you write a query to find duplicate records in a table?"],
    Advanced:     ["How would you optimize a slow SQL query on a table with 100 million rows?", "What are the trade-offs between normalized and denormalized database schemas?", "How do database locks work and how would you diagnose a deadlock?", "Explain the difference between clustered and non-clustered indexes.", "How would you design a database schema for a multi-tenant SaaS application?"],
  },
  HR: {
    Beginner:     ["Tell me about yourself and what you are looking for in a role.", "What are your top three strengths?", "Why did you choose this field or career path?", "How do you handle feedback from a manager or peer?", "Describe a time you worked as part of a team."],
    Intermediate: ["Describe a challenge you faced at work or school and how you resolved it.", "How do you handle disagreements with teammates?", "Tell me about a time you had to learn something new quickly.", "How do you manage your time when handling multiple responsibilities?", "Describe a situation where you showed initiative without being asked."],
    Advanced:     ["Tell me about a time you led a project or team through a difficult situation.", "Describe a situation where you had to influence stakeholders without direct authority.", "How have you handled a situation where you disagreed with a senior decision?", "Tell me about a time you had to deliver difficult feedback to a colleague.", "Describe a situation where you had to make a high-stakes decision with incomplete information."],
  },
  "Resume-Based": {
    Beginner:     ["Can you walk me through your resume in two to three minutes?", "What is the project on your resume you are most comfortable explaining?", "Which skill on your resume did you learn most recently?", "Tell me about your educational background and how it relates to this role.", "What tools or technologies on your resume do you use most often?"],
    Intermediate: ["Walk me through the most impactful project on your resume.", "Which skill on your resume are you most confident in, and why?", "Tell me about a result on your resume that you are especially proud of.", "Describe a challenge you faced in one of the projects listed on your resume.", "How did you measure the success of a project on your resume?"],
    Advanced:     ["Which project on your resume best demonstrates your ability to solve a complex technical problem?", "Tell me about a time on your resume where you had to make a difficult architectural or design decision.", "What is the most technically challenging thing you have built, and what were the trade-offs?", "Describe a situation from your resume where you had to balance speed and quality under pressure.", "If you could redo one project on your resume, what would you change and why?"],
  },
};

const formatTime = (date) =>
  date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const formatDuration = (seconds) =>
  `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

const getFallbackQuestion = (cfg, previousQuestions = [], lastAnswer = "") => {
  const trackBank = FALLBACK_QUESTIONS[cfg?.track] || FALLBACK_QUESTIONS.Normal;
  const pool = trackBank[cfg?.difficulty] || trackBank.Intermediate || Object.values(trackBank)[0];
  const unused = pool.filter((q) => !previousQuestions.includes(q));
  if (isNonAnswer(lastAnswer)) return unused[0] || pool[0];
  return unused[0] || pool[previousQuestions.length % pool.length];
};

const Waveform = ({ active }) => (
  <div className="flex items-center gap-0.5 h-5">
    {Array.from({ length: 9 }).map((_, i) => (
      <motion.div
        key={i}
        className="w-0.5 rounded-full"
        style={{ background: active ? "#818cf8" : "#334155" }}
        animate={active ? { scaleY: [0.3, 1, 0.3] } : { scaleY: 0.3 }}
        transition={active ? { duration: 0.6, repeat: Infinity, delay: i * 0.07, ease: "easeInOut" } : {}}
      />
    ))}
  </div>
);

const TypingIndicator = () => (
  <div className="flex items-center gap-1.5 px-4 py-3">
    {[0, 1, 2].map((i) => (
      <motion.span
        key={i}
        className="w-2 h-2 rounded-full"
        style={{ background: "#6366f1" }}
        animate={{ y: [0, -6, 0], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 0.65, repeat: Infinity, delay: i * 0.13 }}
      />
    ))}
  </div>
);

const AnswerScoreBadge = ({ score, grade, feedback, missingKeywords, pending }) => {
  if (pending) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="mt-2 p-3 rounded-xl flex items-center gap-2.5"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(99,102,241,0.18)" }}>
        <Loader2 size={14} className="text-primary-400 animate-spin" />
        <div>
          <p className="text-[11px] font-semibold text-primary-300">Analyzing your answer...</p>
          <p className="text-[10px] text-slate-500">Scoring it and preparing the next question.</p>
        </div>
      </motion.div>
    );
  }

  const color = score >= 70 ? "#10b981" : score >= 45 ? "#f59e0b" : "#ef4444";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="mt-2 p-3 rounded-xl space-y-1.5"
      style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${color}30` }}
    >
      <div className="flex items-center gap-2">
        <span className="text-xs font-black" style={{ color }}>
          Score: {score}/100
        </span>
        <span
          className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
          style={{ background: `${color}20`, color }}
        >
          {grade}
        </span>
      </div>
      {feedback?.slice(0, 1).map((tip, i) => (
        <p key={i} className="text-[11px] text-slate-500 leading-relaxed">
          Tip: {tip}
        </p>
      ))}
      {missingKeywords?.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-0.5">
          <span className="text-[10px] text-slate-600">Missed:</span>
          {missingKeywords.slice(0, 4).map((keyword) => (
            <span
              key={keyword}
              className="text-[10px] px-1.5 py-0.5 rounded font-medium"
              style={{ background: "rgba(239,68,68,0.1)", color: "#f87171" }}
            >
              {keyword}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
};

const MessageBubble = ({ msg, onReact, showFeedback }) => {
  const isUser = msg.role === "user";
  const [showReactions, setShowReactions] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`flex items-end gap-2.5 group ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mb-1 ${isUser ? "order-last" : ""}`}
        style={
          isUser
            ? { background: "linear-gradient(135deg,#4f46e5,#7c3aed)", boxShadow: "0 0 12px rgba(99,102,241,0.35)" }
            : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }
        }
      >
        {isUser ? <User size={13} className="text-white" /> : <Bot size={13} className="text-primary-400" />}
      </div>

      <div className={`max-w-[78%] flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed relative ${isUser ? "rounded-br-sm" : "rounded-bl-sm"}`}
          style={
            isUser
              ? { background: "linear-gradient(135deg,#4f46e5,#6366f1)", boxShadow: "0 4px 16px rgba(99,102,241,0.25)" }
              : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }
          }
          onMouseEnter={() => !isUser && setShowReactions(true)}
          onMouseLeave={() => setShowReactions(false)}
        >
          <p className="text-slate-100 whitespace-pre-line">{msg.content}</p>
          <AnimatePresence>
            {showReactions && !isUser && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 4 }}
                className="absolute -top-9 left-0 flex gap-1 px-2 py-1.5 rounded-xl z-10"
                style={{ background: "rgba(12,12,22,0.95)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}
              >
                {REACTIONS.map((reaction) => (
                  <button key={reaction} onClick={() => onReact(msg.id, reaction)} className="text-base hover:scale-125 transition-transform">
                    {reaction}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {isUser && showFeedback && (msg.scorePending || msg.scoreData) && (
          <AnswerScoreBadge
            score={msg.scoreData?.total}
            grade={msg.scoreData?.grade}
            feedback={msg.scoreData?.feedback}
            missingKeywords={msg.scoreData?.missingKeywords}
            pending={msg.scorePending}
          />
        )}

        <div className={`flex items-center gap-2 px-1 ${isUser ? "flex-row-reverse" : ""}`}>
          <span className="text-[10px] text-slate-700">{formatTime(msg.timestamp)}</span>
          {msg.reaction && <span className="text-sm">{msg.reaction}</span>}
          {msg.wordCount && isUser && <span className="text-[10px] text-slate-700">{msg.wordCount}w</span>}
        </div>
      </div>
    </motion.div>
  );
};

const ConfidenceMeter = ({ score }) => {
  const color = score >= 70 ? "#10b981" : score >= 45 ? "#f59e0b" : "#ef4444";
  const label = score >= 70 ? "High" : score >= 45 ? "Medium" : "Low";

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-slate-600 font-semibold uppercase tracking-wide">Confidence</span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
        <motion.div
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="h-full rounded-full"
          style={{ background: color, boxShadow: `0 0 6px ${color}80` }}
        />
      </div>
      <span className="text-[10px] font-bold" style={{ color }}>
        {label}
      </span>
    </div>
  );
};

const PracticePage = () => {
  const { user } = useApp();
  const [screen, setScreen] = useState("setup");
  const [pendingConfig, setPendingConfig] = useState(null);
  const [config, setConfig] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [aiState, setAiState] = useState("idle");
  const [showVideo, setShowVideo] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [qIndex, setQIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [qTimer, setQTimer] = useState(0);
  const [confidence, setConfidence] = useState(72);
  const [answers, setAnswers] = useState([]);
  const [lastScore, setLastScore] = useState(null);
  const [sessionScores, setSessionScores] = useState([]);
  const [report, setReport] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [processingAnswer, setProcessingAnswer] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [tabWarning, setTabWarning] = useState("");
  const [sessionRemaining, setSessionRemaining] = useState(null);
  const [responseElapsed, setResponseElapsed]   = useState(0);
  const [faceConfidence, setFaceConfidence]     = useState(0);
  const faceConfidenceRef = useRef(0);

  const { scoreAnswer } = useScoring();
  const {
    transcript,
    interim,
    listening,
    ttsActive,
    startListening,
    stopListening,
    speak,
    cancelSpeech,
    clearTranscript,
  } = useSpeech("English");

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const timerRef    = useRef(null);
  const qTimerRef   = useRef(null);
  const sessionRef  = useRef(null);
  const responseRef = useRef(null);
  const pageRef     = useRef(null);
  const endInterviewRef = useRef(() => {});
  const questionsRef = useRef([]);
  const answersRef   = useRef([]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  useEffect(() => {
    if (screen === "interview") {
      timerRef.current  = setInterval(() => setElapsed((prev) => prev + 1), 1000);
      qTimerRef.current = setInterval(() => setQTimer((prev) => prev + 1), 1000);

      if (config?.sessionMinutes) {
        const totalSec = config.sessionMinutes * 60;
        setSessionRemaining(totalSec);
        sessionRef.current = setInterval(() => {
          setSessionRemaining(prev => {
            if (prev <= 1) {
              clearInterval(sessionRef.current);
              setTimeout(() => endInterviewRef.current(false, "session_timeout"), 0);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }

    return () => {
      clearInterval(timerRef.current);
      clearInterval(qTimerRef.current);
      clearInterval(sessionRef.current);
      clearInterval(responseRef.current);
    };
  }, [screen, config]);

  useEffect(() => {
    if (listening) {
      setInput([transcript, interim].filter(Boolean).join(" ").trim());
    }
  }, [transcript, interim, listening]);

  const requestInterviewFullscreen = useCallback(async () => {
    const el = pageRef.current;
    if (!el || document.fullscreenElement) return true;

    try {
      await el.requestFullscreen();
      return true;
    } catch {
      setTabWarning("Fullscreen was blocked. Please allow fullscreen for the interview.");
      return false;
    }
  }, []);

  const exitInterviewFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) return;
    try {
      await document.exitFullscreen();
    } catch {}
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      const active = Boolean(document.fullscreenElement);
      setIsFullscreen(active);

      if (screen === "interview" && !active) {
        setTabWarning((prev) => prev || "Fullscreen is required during the interview.");
      }
    };

    const onVisibilityChange = () => {
      if (screen !== "interview" || document.visibilityState !== "hidden") return;

      setTabSwitchCount((count) => count + 1);
      setTabWarning("Tab switching is not allowed. This interview was ended.");
      setTimeout(() => {
        endInterviewRef.current(true);
      }, 0);
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [screen]);

  useEffect(() => {
    if (screen !== "interview") {
      setTabWarning("");
      return;
    }

    requestInterviewFullscreen();
  }, [screen, requestInterviewFullscreen]);

  const startResponseTimer = useCallback(() => {
    clearInterval(responseRef.current);
    setResponseElapsed(0);
    if (!config?.responseTimeout) return;
    responseRef.current = setInterval(() => {
      setResponseElapsed(prev => {
        const next = prev + 1;
        if (next >= config.responseTimeout) {
          clearInterval(responseRef.current);
          setTimeout(() => endInterviewRef.current(false, "response_timeout"), 0);
        }
        return next;
      });
    }, 1000);
  }, [config]);

  const stopResponseTimer = useCallback(() => {
    clearInterval(responseRef.current);
    setResponseElapsed(0);
  }, []);

  const handleFaceConfidence = useCallback((val) => {
    faceConfidenceRef.current = val;
    setFaceConfidence(val);
  }, []);

  const addMessage = useCallback((role, content, extra = {}) => {
    setMessages((prev) => [
      ...prev,
      { role, content, timestamp: new Date(), id: Date.now() + Math.random(), ...extra },
    ]);
  }, []);

  const aiSay = useCallback(async (text) => {
    setAiState("thinking");
    setTyping(true);
    await new Promise((resolve) => setTimeout(resolve, 200));
    setTyping(false);
    addMessage("ai", text);
    setAiState("speaking");

    if (config?.useVoice) {
      speak(text, () => setAiState("idle"));
    } else {
      setTimeout(() => setAiState("idle"), 1800);
    }
  }, [config, speak, addMessage]);

  const fetchQuestion = useCallback(async (cfg, prevQuestions, conversationHistory, lastQuestion, lastAnswer) => {
    const seededPool = Array.isArray(cfg?.questionPool) ? cfg.questionPool : [];
    const nextSeeded = seededPool.find((question) => !prevQuestions.includes(question));
    if (nextSeeded) return nextSeeded;

    try {
      const { question } = await getInterviewQuestion({
        track: `${cfg.track} Company Interview`,
        difficulty: cfg.difficulty,
        previousQuestions: prevQuestions,
        conversationHistory,
        lastQuestion: lastQuestion || null,
        lastAnswer: lastAnswer || null,
        resumeContext: cfg.resumeContext || `Company: ${cfg.companyName || cfg.track}. Role Focus: ${cfg.companyRole || "Interview practice"}. Ask interview questions aligned with this company.`,
      });
      return question;
    } catch {
      return nextSeeded || getFallbackQuestion(cfg, prevQuestions, lastAnswer);
    }
  }, []);

  const handleSetupDone = useCallback((cfg) => {
    setPendingConfig(cfg);
    setScreen("env-check");
  }, []);

  const handleStart = useCallback(async (cfg) => {
    setConfig(cfg);
    setQuestions([]);
    questionsRef.current = [];
    setMessages([]);
    setAnswers([]);
    answersRef.current = [];
    setSessionScores([]);
    setLastScore(null);
    setElapsed(0);
    setQTimer(0);
    setConfidence(72);
    setSessionRemaining(null);
    setResponseElapsed(0);
    setFaceConfidence(0);
    faceConfidenceRef.current = 0;
    setScreen("interview");
    setShowVideo(cfg.useVideo);
    setTabSwitchCount(0);
    setTabWarning("");

    try {
      const { sessionId: sid } = await createInterviewSession({ track: `Premium Interview - ${cfg.track}`, difficulty: cfg.difficulty });
      setSessionId(sid);
    } catch {
      setSessionId(null);
    }

    await aiSay(`Welcome to your Premium Interview for ${cfg.track}.\n\nWe'll run a ${cfg.difficulty} company-focused session with ${cfg.qCount} questions. Let's begin.`);
    await new Promise((resolve) => setTimeout(resolve, 400));
    setQTimer(0);

    const firstQuestion = await fetchQuestion(cfg, [], [], null, null);
    questionsRef.current = [firstQuestion];
    setQuestions([firstQuestion]);
    await aiSay(firstQuestion);
    setQIndex(0);
    startResponseTimer();
  }, [aiSay, fetchQuestion, startResponseTimer]);

  const buildReport = useCallback(async (allAnswers) => {
    const scores = allAnswers.map((answer) => answer.score);
    const overall = Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length);
    const grade = overall >= 85 ? "A" : overall >= 70 ? "B" : overall >= 55 ? "C" : overall >= 40 ? "D" : "F";
    const dims = ["relevance", "depth", "keywords", "clarity", "confidence"];

    const radarData = dims.map((dim) => ({
      subject: dim.charAt(0).toUpperCase() + dim.slice(1),
      score: Math.round(allAnswers.reduce((sum, answer) => sum + (answer.breakdown?.[dim] ?? 0), 0) / allAnswers.length),
    }));

    const avgByDim = dims.map((dim) => ({
      dim,
      value: allAnswers.reduce((sum, answer) => sum + (answer.breakdown?.[dim] ?? 0), 0) / allAnswers.length,
    }));

    const weakAreas = avgByDim.filter((item) => item.value < 12).map((item) => item.dim.charAt(0).toUpperCase() + item.dim.slice(1));
    const strengths = avgByDim.filter((item) => item.value >= 15).map((item) => item.dim.charAt(0).toUpperCase() + item.dim.slice(1));

    const reportData = {
      overallScore: overall,
      grade,
      track: `Premium Interview - ${config?.track}`,
      difficulty: config?.difficulty,
      duration: elapsed,
      answers: allAnswers,
      radarData,
      weakAreas,
      strengths,
    };

    if (sessionId) {
      try {
        await completeInterviewSession(sessionId, {
          answers: allAnswers,
          overallScore: overall,
          grade,
          duration: elapsed,
          radarData,
          weakAreas,
          strengths,
        });
      } catch {}
    }

    setReport(reportData);
    setScreen("report");
  }, [config, elapsed, sessionId]);

  const submitAnswer = useCallback(async (text) => {
    const cleanText = text.trim();
    if (!cleanText || typing || processingAnswer) return;

    cancelSpeech();
    stopListening();
    clearTranscript();
    setInput("");
    setProcessingAnswer(true);

    const wordCount = cleanText.split(/\s+/).filter(Boolean).length;
    const currentQuestion = questions[qIndex];
    const nextIndex = qIndex + 1;
    const userMessageId = Date.now() + Math.random();

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: cleanText,
        timestamp: new Date(),
        id: userMessageId,
        wordCount,
        scorePending: !!config?.showFeedback,
        scoreData: null,
      },
    ]);
    setAiState("thinking");
    setTyping(true);

    try {
      const currentQuestions = questionsRef.current;
      const currentAnswers   = answersRef.current;

      const [scored, nextQuestion] = await Promise.all([
        (async () => {
          try {
            const aiResult = await apiEvaluateAnswer({
              question: currentQuestion,
              answer: cleanText,
              track: config?.track,
            });

            return {
              total: typeof aiResult.total === "number" ? aiResult.total : 0,
              grade: typeof aiResult.grade === "string" ? aiResult.grade : "F",
              breakdown: aiResult.breakdown && typeof aiResult.breakdown === "object" ? aiResult.breakdown : {},
              feedback: Array.isArray(aiResult.feedback) ? aiResult.feedback : [],
              modelAnswer: typeof aiResult.modelAnswer === "string" ? aiResult.modelAnswer : null,
              missingKeywords: Array.isArray(aiResult.missingKeywords) ? aiResult.missingKeywords : [],
            };
          } catch {
            return scoreAnswer(cleanText, currentQuestion, config?.track);
          }
        })(),
        nextIndex < config?.qCount
          ? fetchQuestion(
              config,
              currentQuestions,
              [...currentAnswers, { question: currentQuestion, answer: cleanText }].map(a => ({ question: a.question, answer: a.answer })),
              currentQuestion,
              cleanText
            )
          : Promise.resolve(null),
      ]);

      setLastScore(scored);
      setSessionScores((prev) => [...prev, scored.total]);
      setConfidence((prev) => Math.min(100, Math.max(20, prev + (wordCount > 30 ? 4 : -2))));
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessageId
            ? {
                ...msg,
                scorePending: false,
                scoreData: config?.showFeedback
                  ? {
                      total: scored.total,
                      grade: scored.grade,
                      feedback: scored.feedback,
                      missingKeywords: scored.missingKeywords ?? [],
                    }
                  : null,
              }
            : msg
        )
      );

      const completedAnswer = {
        question: currentQuestion,
        answer: cleanText,
        score: scored.total,
        grade: scored.grade,
        breakdown: scored.breakdown,
        feedback: scored.feedback,
        modelAnswer: scored.modelAnswer ?? null,
        missingKeywords: scored.missingKeywords ?? [],
        faceConfidence: faceConfidenceRef.current,
      };

      answersRef.current = [...currentAnswers, completedAnswer];
      setAnswers(answersRef.current);
      setQTimer(0);

      if (nextIndex < config?.qCount) {
        const resolvedNextQuestion = nextQuestion;
        questionsRef.current = [...currentQuestions, resolvedNextQuestion];
        setQuestions(questionsRef.current);
        setQIndex(nextIndex);

        const followUp = isNonAnswer(cleanText)
          ? "No problem. Let's try a different question and keep going."
          : scored.total < 45
            ? getFollowUp(scored.total)
            : null;
        const transitions = [
          "Good answer! Next question:",
          "Interesting, moving on:",
          "Well articulated. Let's continue:",
          "Got it. Next:",
        ];
        const prefix = followUp ? `${followUp}\n\n` : `${transitions[qIndex % transitions.length]}\n\n`;

        await aiSay(`${prefix}${resolvedNextQuestion}`);
      } else {
        setQIndex(nextIndex);
        clearInterval(timerRef.current);
        clearInterval(qTimerRef.current);
        await aiSay("Excellent! You've completed all questions. Generating your performance report now...");
        setTimeout(() => buildReport([...answers, completedAnswer]), 1200);
      }
    } finally {
      setTyping(false);
      setProcessingAnswer(false);
      stopResponseTimer();
      if (nextIndex < config?.qCount) startResponseTimer();
    }
  }, [typing, processingAnswer, qIndex, config, scoreAnswer, fetchQuestion, cancelSpeech, stopListening, clearTranscript, aiSay, buildReport, startResponseTimer, stopResponseTimer]);

  const toggleMic = () => {
    if (listening) {
      stopListening();
      setAiState("idle");
    } else {
      clearTranscript();
      setInput("");
      startListening();
      setAiState("listening");
      stopResponseTimer(); // user is actively responding
    }
  };

  const reset = () => {
    cancelSpeech();
    stopListening();
    exitInterviewFullscreen();
    setScreen("setup");
    setConfig(null);
    setPendingConfig(null);
    setMessages([]);
    setInput("");
    setTyping(false);
    setAiState("idle");
    setQuestions([]);
    questionsRef.current = [];
    setQIndex(0);
    setElapsed(0);
    setQTimer(0);
    setConfidence(72);
    setAnswers([]);
    answersRef.current = [];
    setLastScore(null);
    setSessionScores([]);
    setReport(null);
    setSessionId(null);
    setProcessingAnswer(false);
    setIsFullscreen(false);
    setTabSwitchCount(0);
    setTabWarning("");
    setSessionRemaining(null);
    setResponseElapsed(0);
    setFaceConfidence(0);
    faceConfidenceRef.current = 0;
    clearInterval(timerRef.current);
    clearInterval(qTimerRef.current);
    clearInterval(sessionRef.current);
    clearInterval(responseRef.current);
  };

  const endInterview = useCallback(async (silent = false, reason = "") => {
    if (processingAnswer) return;

    cancelSpeech();
    stopListening();
    exitInterviewFullscreen();
    clearInterval(timerRef.current);
    clearInterval(qTimerRef.current);
    clearInterval(sessionRef.current);
    clearInterval(responseRef.current);

    if (!answers.length) {
      reset();
      return;
    }

    if (!silent) {
      const msg = reason === "session_timeout"
        ? "Time's up! Your session has ended. Generating your report..."
        : reason === "response_timeout"
          ? "Response time exceeded. Ending interview and generating your report..."
          : "Interview ended. Preparing your report from the answers completed so far...";
      await aiSay(msg);
    }

    buildReport(answers);
  }, [processingAnswer, cancelSpeech, stopListening, exitInterviewFullscreen, answers, aiSay, buildReport]);

  useEffect(() => {
    endInterviewRef.current = endInterview;
  }, [endInterview]);

  const sessionAvg = sessionScores.length
    ? Math.round(sessionScores.reduce((a, b) => a + b, 0) / sessionScores.length)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-4xl mx-auto flex flex-col pb-4"
      style={{ height: "calc(100vh - 5.5rem)" }}
      ref={pageRef}
    >
      <AnimatePresence mode="wait">
        {screen === "setup" && (
          <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 card overflow-y-auto">
            {user?.isPremium || user?.isAdmin ? (
              <PracticeSetupWizard onStart={handleSetupDone} />
            ) : (
              <PremiumGate />
            )}
          </motion.div>
        )}

        {screen === "env-check" && (
          <motion.div key="env-check" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 card overflow-y-auto">
            <EnvironmentCheck
              onPass={() => handleStart(pendingConfig)}
              onBack={() => setScreen("setup")}
            />
          </motion.div>
        )}

        {screen === "report" && report && (
          <motion.div key="report" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 overflow-y-auto">
            <ScoreReport report={report} onRetry={reset} />
          </motion.div>
        )}

        {screen === "interview" && (
          <motion.div key="interview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col min-h-0 gap-3">
            <div className="card relative flex items-center justify-between flex-shrink-0">
              {tabWarning && (
                <div className="absolute left-4 right-4 top-full mt-2 rounded-xl px-3 py-2 flex items-center justify-between gap-3 text-xs" style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.28)" }}>
                  <span className="text-amber-300">{tabWarning}{tabSwitchCount ? ` Tab switches: ${tabSwitchCount}` : ""}</span>
                  {screen === "interview" && !isFullscreen && (
                    <button onClick={requestInterviewFullscreen} className="text-amber-200 hover:text-white font-semibold">Resume fullscreen</button>
                  )}
                </div>
              )}
              <div className="flex items-center gap-3">
                <div
                  className="relative w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.2)" }}
                >
                  <Bot size={19} className="text-primary-400" />
                  <span
                    className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#080810]"
                    style={{ background: "#10b981", boxShadow: "0 0 6px rgba(16,185,129,0.8)" }}
                  />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    Premium Interview Coach
                    <Badge label="Live" variant="green" />
                    {config && <Badge label={config.track} variant="indigo" />}
                    <Badge label="Premium" variant="amber" />
                  </h2>
                  <p className="text-[11px] text-slate-600">
                    Q{Math.min(qIndex + 1, config?.qCount || 1)} / {config?.qCount} - {config?.difficulty}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-mono tabular-nums">
                  <Clock size={12} />
                  {formatDuration(elapsed)}
                </div>

                <div className="hidden sm:flex gap-1.5">
                  {Array.from({ length: config?.qCount || 0 }).map((_, i) => (
                    <motion.div
                      key={i}
                      animate={i === qIndex ? { scale: [1, 1.3, 1] } : {}}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="w-2 h-2 rounded-full transition-all duration-300"
                      style={{
                        background: i < qIndex ? "#10b981" : i === qIndex ? "#6366f1" : "rgba(255,255,255,0.1)",
                        boxShadow: i === qIndex ? "0 0 6px rgba(99,102,241,0.6)" : "none",
                      }}
                    />
                  ))}
                </div>

                <button
                  onClick={() => setShowVideo((prev) => !prev)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                  style={{ background: showVideo ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  {showVideo ? <Video size={13} className="text-primary-400" /> : <VideoOff size={13} className="text-slate-600" />}
                </button>

                <button
                  onClick={() => (isFullscreen ? exitInterviewFullscreen() : requestInterviewFullscreen())}
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                  style={{ background: isFullscreen ? "rgba(16,185,129,0.16)" : "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  {isFullscreen ? <Minimize size={13} className="text-emerald-300" /> : <Maximize size={13} className="text-slate-300" />}
                </button>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={endInterview}
                  disabled={processingAnswer}
                  className="h-8 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold text-red-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.22)" }}
                >
                  <Square size={11} />
                  End
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={reset}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 hover:text-white transition-all"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <RotateCcw size={13} />
                </motion.button>
              </div>
            </div>

            <div className="px-1 flex-shrink-0">
              <ConfidenceMeter score={confidence} />
            </div>

            <div className="flex-1 flex flex-col lg:flex-row gap-3 min-h-0">
              <div className="flex flex-col gap-3 lg:w-72 flex-shrink-0">
                <AnimatePresence>
                  {showVideo && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                      <VideoPanel aiState={aiState} track={config?.companyName || config?.track} enabled={showVideo} onFaceConfidence={handleFaceConfidence} />
                    </motion.div>
                  )}
                </AnimatePresence>

                <LiveScoreHUD
                  currentScore={lastScore?.total}
                  breakdown={lastScore?.breakdown}
                  qTimer={qTimer}
                  qIndex={qIndex}
                  totalQ={config?.qCount}
                  sessionScore={sessionAvg}
                  visible={true}
                  sessionRemaining={sessionRemaining}
                  responseTimeout={config?.responseTimeout || 0}
                  responseElapsed={responseElapsed}
                />
              </div>

              <div className="flex-1 flex flex-col min-h-0 gap-3">
                <div className="flex-1 card overflow-y-auto p-4 space-y-4 min-h-0">
                  <AnimatePresence initial={false}>
                    {messages.map((msg) => (
                      <MessageBubble
                        key={msg.id}
                        msg={msg}
                        onReact={(id, reaction) => setMessages((prev) => prev.map((item) => (item.id === id ? { ...item, reaction } : item)))}
                        showFeedback={config?.showFeedback}
                      />
                    ))}
                  </AnimatePresence>

                  {typing && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-end gap-2.5">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        <Bot size={13} className="text-primary-400" />
                      </div>
                      <div className="rounded-2xl rounded-bl-sm" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        <TypingIndicator />
                      </div>
                    </motion.div>
                  )}
                  <div ref={bottomRef} />
                </div>

                <SubtitleBar
                  transcript={transcript}
                  interim={interim}
                  listening={listening}
                  ttsActive={ttsActive}
                  aiText={messages.filter((item) => item.role === "ai").slice(-1)[0]?.content}
                  processing={processingAnswer}
                />

                <div className="card flex items-end gap-3 flex-shrink-0">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleMic}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all flex-shrink-0"
                    style={
                      listening
                        ? { background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.3)", boxShadow: "0 0 12px rgba(99,102,241,0.3)" }
                        : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }
                    }
                  >
                    {listening ? <Mic size={15} className="text-primary-400" /> : <MicOff size={15} className="text-slate-600" />}
                  </motion.button>

                  <div className="flex-1 flex items-center gap-2 min-h-[24px]">
                    {listening ? (
                      <div className="flex items-center gap-3 flex-1">
                        <Waveform active />
                        <span className="text-xs text-slate-500">{interim || transcript || "Listening..."}</span>
                      </div>
                    ) : (
                      <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => { setInput(e.target.value); if (e.target.value) stopResponseTimer(); }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            submitAnswer(input);
                          }
                        }}
                        placeholder={processingAnswer ? "Analyzing your answer..." : "Type your answer... (Enter to send)"}
                        rows={1}
                        disabled={typing || processingAnswer}
                        className="flex-1 bg-transparent text-sm text-white placeholder-slate-700 resize-none focus:outline-none leading-relaxed max-h-28 overflow-y-auto disabled:opacity-40"
                        style={{ minHeight: "24px" }}
                      />
                    )}
                  </div>

                  {input && (
                    <span className="text-[10px] text-slate-700 flex-shrink-0 tabular-nums">
                      {input.split(/\s+/).filter(Boolean).length}w
                    </span>
                  )}

                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => (listening ? submitAnswer(transcript || input) : submitAnswer(input))}
                    disabled={(!input.trim() && !transcript) || typing || processingAnswer}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all flex-shrink-0 disabled:opacity-25 disabled:cursor-not-allowed"
                    style={{ background: "linear-gradient(135deg,#4f46e5,#6366f1)", boxShadow: "0 0 12px rgba(99,102,241,0.35)" }}
                  >
                    {processingAnswer ? <Loader2 size={14} className="text-white animate-spin" /> : <Send size={14} className="text-white" />}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PracticePage;




