export const TRACKS      = ["Normal", "Java", "Python", "JavaScript", "C++", "SQL", "HR"];
export const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];

export const FOLLOW_UPS = {
  low:  ["Can you elaborate on that?", "Could you give a specific example?", "Can you walk me through your thought process?"],
  mid:  ["Interesting — how did that impact the outcome?", "What would you do differently now?", "How did you measure success there?"],
  high: ["Excellent! How would you scale that approach?", "Great answer. What were the trade-offs you considered?"],
};

export const getFollowUp = (score) => {
  const pool = score < 45 ? FOLLOW_UPS.low : score < 70 ? FOLLOW_UPS.mid : FOLLOW_UPS.high;
  return pool[Math.floor(Math.random() * pool.length)];
};
