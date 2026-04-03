import { useCallback } from "react";

/* ── Domain keyword banks ── */
const BANKS = {
  Java:       ["java","jvm","spring","maven","gradle","oop","inheritance","polymorphism","interface","abstract","thread","concurrency","garbage","collection","stream","lambda","generics","hibernate","jdbc","microservice"],
  Python:     ["python","django","flask","pandas","numpy","scikit","tensorflow","pytorch","decorator","generator","comprehension","asyncio","pip","virtualenv","pytest","lambda","class","module","package","api"],
  JavaScript: ["javascript","react","node","express","async","await","promise","closure","prototype","event","dom","webpack","babel","typescript","hook","component","state","props","callback","fetch"],
  "C++":      ["c++","pointer","memory","allocation","template","stl","vector","map","class","inheritance","virtual","destructor","constructor","namespace","overload","reference","iterator","algorithm","complexity"],
  SQL:        ["sql","query","join","index","transaction","acid","normalization","primary","foreign","key","aggregate","group","having","subquery","view","stored","procedure","trigger","constraint","schema"],
  HR:         ["team","leadership","communication","conflict","deadline","initiative","responsibility","impact","result","learned","improved","managed","delivered","collaborate","challenge","solution","goal","growth","passion","value"],
  General:    ["experience","skill","project","role","achieve","professional","background","strength","weakness","future","example","situation","action","result","because","therefore","however","specifically","demonstrated"],
};

/* ── Filler words that reduce clarity score ── */
const FILLERS = ["um","uh","like","basically","literally","you know","i mean","sort of","kind of","actually","honestly","right","okay so","well so"];

const isNonAnswer = (answer = "") => {
  const lower = String(answer).toLowerCase().trim();
  return (
    lower.length <= 20 &&
    /\b(i don't know|i dont know|don't know|dont know|do not know|not sure|no idea|can't remember|cannot remember|sorry)\b/.test(lower)
  );
};



export const useScoring = () => {

  const scoreAnswer = useCallback((answer, question, track = "General") => {
    if (!answer || answer.trim().length < 3) return { total: 0, breakdown: { relevance: 0, depth: 0, keywords: 0, clarity: 0, confidence: 0 }, wordCount: 0, grade: "F", feedback: "No answer provided." };
    if (isNonAnswer(answer)) {
      return {
        total: 3,
        breakdown: { relevance: 1, depth: 0, keywords: 0, clarity: 1, confidence: 1 },
        wordCount: answer.trim().split(/\s+/).filter(Boolean).length,
        grade: "F",
        feedback: [
          "It is okay to say you do not know, but try adding what you do know about the topic.",
          "Start with a basic definition, a related concept, or a very small example."
        ],
        modelAnswer: null,
      };
    }

    const words     = answer.trim().split(/\s+/).filter(Boolean);
    const wc        = words.length;
    const lower     = answer.toLowerCase();
    const qLower    = String(question || "").toLowerCase();

    /* 1. Relevance (0–20) */
    const qWords    = qLower.split(/\s+/).filter(w => w.length > 4);
    const overlap   = qWords.filter(w => lower.includes(w)).length;
    const relevance = Math.min(20, Math.round((overlap / Math.max(qWords.length, 1)) * 16) + (wc > 15 ? 4 : 0));

    /* 2. Depth (0–20) */
    const depth = wc < 15  ? 4
                : wc < 35  ? 10
                : wc < 60  ? 15
                : wc < 100 ? 18
                : 20;

    /* 3. Domain Keywords (0–20) */
    const bank    = [...(BANKS[track] || []), ...BANKS.General];
    const hits    = bank.filter(k => lower.includes(k)).length;
    const keywords = Math.min(20, hits * 3 + (hits >= 3 ? 5 : 0));

    /* 4. Clarity (0–20) */
    const sentences   = answer.split(/[.!?]+/).filter(s => s.trim().length > 4).length;
    const fillerCount = FILLERS.filter(f => lower.includes(f)).length;
    const avgLen      = wc / Math.max(sentences, 1);
    const structureOk = sentences >= 2 && avgLen >= 6 && avgLen <= 28;
    const clarityBase = structureOk ? 16 : 9;
    const clarity     = Math.max(0, Math.min(20, clarityBase - fillerCount * 2 + (sentences >= 3 ? 4 : 0)));

    /* 5. Confidence (0–20): sentence starters, assertive language */
    const assertive   = ["i have","i built","i led","i designed","i implemented","i achieved","i improved","i managed","i created","i developed","my experience","in my","i am","i believe","i know"].filter(p => lower.includes(p)).length;
    const hedging     = ["i think maybe","i'm not sure","i guess","probably","might be","i don't know"].filter(p => lower.includes(p)).length;
    const confidence  = Math.max(0, Math.min(20, assertive * 4 - hedging * 3 + (wc > 40 ? 4 : 0)));

    const total = relevance + depth + keywords + clarity + confidence;
    const capped = Math.min(100, total);

    const grade = capped >= 85 ? "A" : capped >= 70 ? "B" : capped >= 55 ? "C" : capped >= 40 ? "D" : "F";

    const feedback = buildFeedback({ relevance, depth, keywords, clarity, confidence, wc, fillerCount, hits });

    return {
      total: capped,
      breakdown: { relevance, depth, keywords, clarity, confidence },
      wordCount: wc,
      grade,
      feedback,
      modelAnswer: null,
    };
  }, []);

  return { scoreAnswer };
};

const buildFeedback = ({ relevance, depth, keywords, clarity, confidence, wc, fillerCount, hits }) => {
  const tips = [];
  if (relevance < 10)   tips.push("Address the question more directly.");
  if (depth < 10)       tips.push(wc < 30 ? "Expand your answer with more detail." : "Good length.");
  if (keywords < 8)     tips.push("Use more domain-specific terminology.");
  if (clarity < 10)     tips.push(fillerCount > 2 ? "Reduce filler words for clearer delivery." : "Structure your answer with clear sentences.");
  if (confidence < 8)   tips.push("Use assertive language — start with 'I built', 'I led', 'I achieved'.");
  if (tips.length === 0) tips.push("Excellent answer! Well-structured and confident.");
  return tips;
};
