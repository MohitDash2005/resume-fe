import { useState, useCallback } from "react";
import { resumeService } from "../services/resume.service";

const useResumeHistory = () => {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [fetched, setFetched] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await resumeService.history();
      setResumes(data || []);
      setFetched(true);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load resume history");
    } finally {
      setLoading(false);
    }
  }, []);

  return { resumes, loading, error, fetched, refetch: fetch };
};

export default useResumeHistory;
