import useApi from "./useApi";
import { dashboardService } from "../services/dashboard.service";

const FALLBACK_TREND = [
  { day: "Mon", score: 0, interviews: 0 },
  { day: "Tue", score: 0, interviews: 0 },
  { day: "Wed", score: 0, interviews: 0 },
  { day: "Thu", score: 0, interviews: 0 },
  { day: "Fri", score: 0, interviews: 0 },
  { day: "Sat", score: 0, interviews: 0 },
  { day: "Sun", score: 0, interviews: 0 },
];

const useDashboard = () => {
  const { data: stats, loading, error, refetch } = useApi(dashboardService.stats);

  return {
    loading,
    error,
    refetch,
    resumeScore:     stats?.resumeScore     ?? 0,
    interviewScore:  stats?.interviewScore  ?? 0,
    totalAnalyses:   stats?.totalAnalyses   ?? 0,
    totalInterviews: stats?.totalInterviews ?? 0,
    trend:           stats?.trend?.length   ? stats.trend : FALLBACK_TREND,
    atsScore:        stats?.latestResume?.atsScore        ?? 0,
    formatScore:     stats?.latestResume?.formatScore     ?? 0,
    keywordsScore:   stats?.latestResume?.keywordsScore   ?? 0,
    detectedSkills:  stats?.latestResume?.extractedSkills ?? [],
    missingSkills:   stats?.latestResume?.missingSkills   ?? [],
    recentActivity:  stats?.recentActivity  ?? [],
  };
};

export default useDashboard;
