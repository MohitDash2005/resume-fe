import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Wifi, CheckCircle, XCircle, AlertCircle, RefreshCw, ChevronRight } from "lucide-react";
import Button from "../ui/Button";

const LIGHTING_THRESHOLD = 60; // 0–255 avg brightness

// ── Network Speed Bar ───────────────────────────────────────────────────────
const SpeedBar = ({ mbps }) => {
  const pct = Math.min(100, (mbps / 20) * 100);
  const color = mbps >= 5 ? "#10b981" : mbps >= 1 ? "#f59e0b" : "#ef4444";
  return (
    <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="h-full rounded-full"
        style={{ background: color, boxShadow: `0 0 8px ${color}80` }}
      />
    </div>
  );
};

// ── Status Icon ──────────────────────────────────────────────────────────────
const StatusIcon = ({ status }) => {
  if (status === "pass")    return <CheckCircle  size={16} className="text-emerald-400" />;
  if (status === "fail")    return <XCircle      size={16} className="text-red-400" />;
  if (status === "warn")    return <AlertCircle  size={16} className="text-amber-400" />;
  if (status === "running") return <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}><RefreshCw size={16} className="text-primary-400" /></motion.div>;
  return <div className="w-4 h-4 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }} />;
};

// ── Main Component ───────────────────────────────────────────────────────────
const EnvironmentCheck = ({ onPass, onBack }) => {
  const [cameraStatus,  setCameraStatus]  = useState("idle");
  const [networkStatus, setNetworkStatus] = useState("idle");

  const [cameraMsg,     setCameraMsg]     = useState("");
  const [brightness,    setBrightness]    = useState(null);

  const [networkMbps,   setNetworkMbps]   = useState(null);
  const [networkMsg,    setNetworkMsg]    = useState("");

  const videoRef  = useRef(null);
  const streamRef = useRef(null);

  const allDone = [cameraStatus, networkStatus].every(s => s !== "idle" && s !== "running");
  const canProceed = allDone && cameraStatus !== "fail";

  // ── Camera check ────────────────────────────────────────────────────────
  const runCameraCheck = useCallback(async () => {
    setCameraStatus("running");
    setCameraMsg("Accessing camera...");
    setBrightness(null);

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true });
    } catch {
      setCameraStatus("fail");
      setCameraMsg("Camera access denied.");
      return;
    }

    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play().catch(() => {});
    }

    setCameraMsg("Checking lighting...");
    await new Promise(r => setTimeout(r, 1500));

    // Measure brightness via canvas
    const canvas = document.createElement("canvas");
    const video  = videoRef.current;
    if (video && video.videoWidth) {
      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0);
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let sum = 0;
      for (let i = 0; i < pixels.length; i += 4) sum += (pixels[i] + pixels[i+1] + pixels[i+2]) / 3;
      const avg = sum / (pixels.length / 4);
      setBrightness(Math.round(avg));

      if (avg < LIGHTING_THRESHOLD) {
        setCameraStatus("warn");
        setCameraMsg(`Low lighting detected (brightness: ${Math.round(avg)}). Try better lighting.`);
      } else {
        setCameraStatus("pass");
        setCameraMsg(`Camera ready. Good lighting (brightness: ${Math.round(avg)})`);
      }
    } else {
      setCameraStatus("pass");
      setCameraMsg("Camera ready.");
    }

    stream.getTracks().forEach(t => t.stop());
  }, []);

  // ── Network check ───────────────────────────────────────────────────────
  const runNetworkCheck = useCallback(async () => {
    setNetworkStatus("running");
    setNetworkMsg("Testing connection speed...");
    setNetworkMbps(null);

    try {
      // Download a ~500KB payload from a public CDN to estimate speed
      const url   = `https://speed.cloudflare.com/__down?bytes=500000&_=${Date.now()}`;
      const start = performance.now();
      const res   = await fetch(url, { cache: "no-store" });
      await res.arrayBuffer();
      const elapsed = (performance.now() - start) / 1000; // seconds
      const mbps    = (500000 * 8) / elapsed / 1_000_000;
      setNetworkMbps(mbps);

      if (mbps >= 5) {
        setNetworkStatus("pass");
        setNetworkMsg(`Good connection (${mbps.toFixed(1)} Mbps)`);
      } else if (mbps >= 1) {
        setNetworkStatus("warn");
        setNetworkMsg(`Slow connection (${mbps.toFixed(1)} Mbps). May affect AI responses.`);
      } else {
        setNetworkStatus("fail");
        setNetworkMsg(`Very slow connection (${mbps.toFixed(1)} Mbps). Interview may not work well.`);
      }
    } catch {
      // Fallback: use navigator.connection if available
      const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (conn?.downlink) {
        const mbps = conn.downlink;
        setNetworkMbps(mbps);
        setNetworkStatus(mbps >= 1 ? "warn" : "fail");
        setNetworkMsg(`Estimated ${mbps.toFixed(1)} Mbps (speed test blocked by browser)`);
      } else {
        setNetworkStatus("warn");
        setNetworkMsg("Could not measure speed. Proceeding with caution.");
      }
    }
  }, []);

  useEffect(() => {
    const run = async () => {
      await runCameraCheck();
      await runNetworkCheck();
    };
    run();
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, []); // eslint-disable-line

  const rerunAll = () => {
    setCameraStatus("idle"); setNetworkStatus("idle");
    setNetworkMbps(null); setBrightness(null);
    setTimeout(async () => {
      await runCameraCheck();
      await runNetworkCheck();
    }, 100);
  };

  const statusColor = (s) =>
    s === "pass" ? "#10b981" : s === "warn" ? "#f59e0b" : s === "fail" ? "#ef4444" : s === "running" ? "#6366f1" : "#334155";

  return (
    <div className="h-full flex flex-col items-center justify-center gap-5 px-2 py-4 max-w-lg mx-auto w-full">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
          style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)", boxShadow: "0 0 24px rgba(99,102,241,0.15)" }}>
          <span className="text-2xl">🔍</span>
        </div>
        <h3 className="text-lg font-black text-white">Environment Check</h3>
        <p className="text-slate-500 text-xs mt-1">Making sure your setup is interview-ready</p>
      </motion.div>

      {/* Checks */}
      <div className="w-full space-y-3">

        {/* ── Camera ── */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          className="p-4 rounded-2xl space-y-3"
          style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${statusColor(cameraStatus)}30` }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: `${statusColor(cameraStatus)}15`, border: `1px solid ${statusColor(cameraStatus)}30` }}>
                <Camera size={14} style={{ color: statusColor(cameraStatus) }} />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Camera & Lighting</p>
                <p className="text-[10px] text-slate-500">{cameraMsg || "Waiting..."}</p>
              </div>
            </div>
            <StatusIcon status={cameraStatus} />
          </div>

          <video ref={videoRef} muted playsInline className="hidden" />

          {brightness !== null && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Lighting Level</span>
                <span style={{ color: statusColor(cameraStatus) }}>{brightness}/255</span>
              </div>
              <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(brightness / 255) * 100}%` }}
                  transition={{ duration: 0.8 }}
                  className="h-full rounded-full"
                  style={{ background: statusColor(cameraStatus), boxShadow: `0 0 6px ${statusColor(cameraStatus)}80` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-700">
                <span>Dark</span><span>Bright</span>
              </div>
            </div>
          )}
        </motion.div>

        {/* ── Network ── */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
          className="p-4 rounded-2xl space-y-3"
          style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${statusColor(networkStatus)}30` }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: `${statusColor(networkStatus)}15`, border: `1px solid ${statusColor(networkStatus)}30` }}>
                <Wifi size={14} style={{ color: statusColor(networkStatus) }} />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Network Speed</p>
                <p className="text-[10px] text-slate-500">{networkMsg || "Waiting..."}</p>
              </div>
            </div>
            <StatusIcon status={networkStatus} />
          </div>

          {networkMbps !== null && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Download Speed</span>
                <span style={{ color: statusColor(networkStatus) }}>{networkMbps.toFixed(1)} Mbps</span>
              </div>
              <SpeedBar mbps={networkMbps} />
              <div className="flex justify-between text-[10px] text-slate-700">
                <span>0</span><span className="text-amber-500">1 Mbps</span><span className="text-emerald-500">5+ Mbps</span>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Summary banner */}
      <AnimatePresence>
        {allDone && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="w-full p-3 rounded-xl flex items-center gap-3"
            style={{
              background: canProceed ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
              border: `1px solid ${canProceed ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
            }}>
            {canProceed
              ? <CheckCircle size={16} className="text-emerald-400 flex-shrink-0" />
              : <XCircle    size={16} className="text-red-400 flex-shrink-0" />}
            <p className="text-xs font-semibold" style={{ color: canProceed ? "#34d399" : "#f87171" }}>
              {canProceed
                ? "Environment looks good! You're ready to start."
                : "Fix the issues above before starting the interview."}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={onBack} className="px-5 py-2.5 text-sm">Back</Button>
        <button onClick={rerunAll}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-all"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <RefreshCw size={13} /> Re-check
        </button>
        <Button onClick={onPass} disabled={!canProceed} icon={<ChevronRight size={15} />} className="px-8 py-2.5 text-sm font-bold">
          Start Interview
        </Button>
      </div>
    </div>
  );
};

export default EnvironmentCheck;
