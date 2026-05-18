import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, CameraOff, Eye, EyeOff, UserX, AlertTriangle, Maximize2, Minimize2 } from "lucide-react";
import { useWebcam } from "../../hooks/useWebcam";
import AIAvatar from "./AIAvatar";

/* ── Status pill ── */
const StatusPill = ({ eyeContact, faceDetected }) => {
  if (!faceDetected) return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
      style={{ background: "rgba(239,68,68,0.2)", color: "#f87171", border: "1px solid rgba(239,68,68,0.35)" }}>
      <UserX size={9} /> Out of frame
    </span>
  );
  if (!eyeContact) return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
      style={{ background: "rgba(245,158,11,0.2)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.35)" }}>
      <EyeOff size={9} /> Look at camera
    </span>
  );
  return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
      style={{ background: "rgba(16,185,129,0.15)", color: "#34d399", border: "1px solid rgba(16,185,129,0.3)" }}>
      <Eye size={9} /> Eye contact good
    </span>
  );
};

/* ── Out of frame overlay ── */
const OutOfFrameOverlay = ({ show }) => (
  <AnimatePresence>
    {show && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-2xl"
        style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(3px)" }}>
        <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.4, repeat: Infinity }}
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(239,68,68,0.2)", border: "2px solid rgba(239,68,68,0.5)" }}>
          <UserX size={26} className="text-red-400" />
        </motion.div>
        <p className="text-red-400 text-sm font-bold">You're out of frame!</p>
        <p className="text-slate-500 text-xs text-center px-6">Please move back in front of the camera</p>
        <motion.div animate={{ opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 1.2, repeat: Infinity }}
          className="absolute inset-1 rounded-xl pointer-events-none"
          style={{ border: "2px dashed rgba(239,68,68,0.6)" }} />
      </motion.div>
    )}
  </AnimatePresence>
);

/* ── Eye contact goodning ── */
const EyeContactWarning = ({ show }) => (
  <AnimatePresence>
    {show && (
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
        className="absolute top-3 left-3 right-12 z-20 flex items-center gap-2 px-3 py-2 rounded-xl"
        style={{ background: "rgba(245,158,11,0.18)", border: "1px solid rgba(245,158,11,0.4)", backdropFilter: "blur(8px)" }}>
        <motion.div animate={{ rotate: [0, -8, 8, 0] }} transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1.5 }}>
          <AlertTriangle size={13} className="text-amber-400 flex-shrink-0" />
        </motion.div>
        <p className="text-amber-300 text-xs font-semibold">Please look at the camera</p>
        <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1, repeat: Infinity }}
          className="ml-auto w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
      </motion.div>
    )}
  </AnimatePresence>
);

/* ── Border glow ── */
const BorderGlow = ({ faceDetected, eyeContact }) => {
  if (!faceDetected) return (
    <motion.div animate={{ opacity: [0.4, 0.9, 0.4] }} transition={{ duration: 1, repeat: Infinity }}
      className="absolute inset-0 rounded-2xl pointer-events-none"
      style={{ border: "2px solid rgba(239,68,68,0.7)", boxShadow: "inset 0 0 32px rgba(239,68,68,0.1), 0 0 20px rgba(239,68,68,0.2)" }} />
  );
  if (!eyeContact) return (
    <motion.div animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }}
      className="absolute inset-0 rounded-2xl pointer-events-none"
      style={{ border: "2px solid rgba(245,158,11,0.6)", boxShadow: "inset 0 0 24px rgba(245,158,11,0.08)" }} />
  );
  return (
    <div className="absolute inset-0 rounded-2xl pointer-events-none"
      style={{ border: "2px solid rgba(16,185,129,0.5)", boxShadow: "inset 0 0 24px rgba(16,185,129,0.06), 0 0 16px rgba(16,185,129,0.15)" }} />
  );
};

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
const MultiPersonWarning = ({ show }) => (
  <AnimatePresence>
    {show && (
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
        className="absolute top-3 left-3 right-12 z-20 flex items-center gap-2 px-3 py-2 rounded-xl"
        style={{ background: "rgba(239,68,68,0.18)", border: "1px solid rgba(239,68,68,0.5)", backdropFilter: "blur(8px)" }}>
        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.6, repeat: Infinity }}>
          <AlertTriangle size={13} className="text-red-400 flex-shrink-0" />
        </motion.div>
        <p className="text-red-300 text-xs font-semibold">Multiple people detected!</p>
        <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 0.8, repeat: Infinity }}
          className="ml-auto w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
      </motion.div>
    )}
  </AnimatePresence>
);

const VideoPanel = ({ aiState = "idle", track, enabled, onFaceConfidence }) => {
  const {
    videoRef, stream, enabled: camOn, error,
    eyeContact, faceDetected, multiPerson, faceConfidence, startCamera, stopCamera,
  } = useWebcam();

  const [stableNoFace, setStableNoFace] = useState(false);
  const [stableNoEye,  setStableNoEye]  = useState(false);
  const [expanded,     setExpanded]     = useState(false); // fullscreen modal
  const noFaceTimer = useRef(null);
  const noEyeTimer  = useRef(null);
  const fullscreenVideoRef = useRef(null);

  useEffect(() => {
    if (!camOn || !stream) { setStableNoFace(false); setStableNoEye(false); return; }
    if (!faceDetected) {
      noFaceTimer.current = setTimeout(() => setStableNoFace(true), 1500);
    } else {
      clearTimeout(noFaceTimer.current);
      setStableNoFace(false);
    }
    return () => clearTimeout(noFaceTimer.current);
  }, [faceDetected, camOn, stream]);

  useEffect(() => {
    if (!camOn || !stream || !faceDetected) { setStableNoEye(false); return; }
    if (!eyeContact) {
      noEyeTimer.current = setTimeout(() => setStableNoEye(true), 2000);
    } else {
      clearTimeout(noEyeTimer.current);
      setStableNoEye(false);
    }
    return () => clearTimeout(noEyeTimer.current);
  }, [eyeContact, faceDetected, camOn, stream]);

  const prevEnabled = useRef(null);
  useEffect(() => {
    if (prevEnabled.current === enabled) return;
    prevEnabled.current = enabled;
    if (enabled) startCamera();
    else stopCamera();
  }, [enabled]); // eslint-disable-line

  // Bubble faceConfidence up to parent
  useEffect(() => {
    if (onFaceConfidence) onFaceConfidence(faceConfidence);
  }, [faceConfidence, onFaceConfidence]);

  useEffect(() => {
    const fullscreenVideo = fullscreenVideoRef.current;
    if (!fullscreenVideo) return;

    if (expanded && camOn && stream) {
      fullscreenVideo.srcObject = stream;
      fullscreenVideo.play().catch(() => {});
      return;
    }

    fullscreenVideo.srcObject = null;
  }, [expanded, camOn, stream]);

  const CameraView = ({ fullscreen = false }) => (
    <div className={`relative rounded-2xl overflow-hidden ${fullscreen ? "w-full h-full" : "w-full aspect-video"}`}
      style={{ background: "rgba(0,0,0,0.85)", border: "1px solid rgba(255,255,255,0.08)" }}>

      {/* Video element */}
      <video ref={fullscreen ? undefined : videoRef} autoPlay muted playsInline
        className="w-full h-full object-cover scale-x-[-1]"
        style={{ display: camOn && stream ? "block" : "none" }} />

      {/* Camera off state */}
      {(!camOn || !stream) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
            <CameraOff size={28} className="text-slate-600" />
          </div>
          {error
            ? <p className="text-xs text-red-400 text-center px-6 leading-relaxed">{error}</p>
            : <p className="text-sm text-slate-600">Camera is off</p>
          }
          <button onClick={startCamera}
            className="text-xs text-primary-400 hover:text-primary-300 transition-colors underline mt-1">
            Enable camera
          </button>
        </div>
      )}

      {/* Live overlays */}
      {camOn && stream && (
        <>
          <OutOfFrameOverlay show={stableNoFace} />
          {!stableNoFace && <EyeContactWarning show={stableNoEye} />}
          <BorderGlow faceDetected={faceDetected} eyeContact={eyeContact} />

          {/* Bottom bar */}
          <div className="absolute bottom-0 left-0 right-0 px-3 py-2.5 flex items-center justify-between z-10"
            style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.85))" }}>
            <div className="flex items-center gap-2">
              <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.2, repeat: Infinity }}
                className="w-2 h-2 rounded-full"
                style={{ background: faceDetected ? (eyeContact ? "#10b981" : "#f59e0b") : "#ef4444" }} />
              <span className="text-xs text-white font-semibold">You</span>
            </div>
            <StatusPill eyeContact={eyeContact} faceDetected={faceDetected} />
          </div>
        </>
      )}

      {/* Controls top-right */}
      <div className="absolute top-2 right-2 flex gap-1.5 z-30">
        {/* Expand/collapse */}
        {!fullscreen && (
          <button onClick={() => setExpanded(true)}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
            style={{ background: "rgba(0,0,0,0.65)", border: "1px solid rgba(255,255,255,0.15)" }}>
            <Maximize2 size={12} className="text-white" />
          </button>
        )}
        {/* Camera toggle */}
        <button onClick={() => camOn ? stopCamera() : startCamera()}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
          style={{ background: "rgba(0,0,0,0.65)", border: "1px solid rgba(255,255,255,0.15)" }}>
          {camOn ? <Camera size={12} className="text-white" /> : <CameraOff size={12} className="text-slate-400" />}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Normal panel: full-width camera + AI avatar row ── */}
      <div className="space-y-3">

        {/* Camera — full width, taller aspect ratio */}
        <div className="relative w-full" style={{ aspectRatio: "4/3" }}>
          <div className="absolute inset-0 rounded-2xl overflow-hidden"
            style={{ background: "rgba(0,0,0,0.85)", border: "1px solid rgba(255,255,255,0.08)" }}>

            <video ref={videoRef} autoPlay muted playsInline
              className="w-full h-full object-cover scale-x-[-1]"
              style={{ display: camOn && stream ? "block" : "none" }} />

            {(!camOn || !stream) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center"
                  style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                  <CameraOff size={28} className="text-slate-600" />
                </div>
                {error
                  ? <p className="text-xs text-red-400 text-center px-6 leading-relaxed">{error}</p>
                  : <p className="text-sm text-slate-600">Camera is off</p>
                }
                <button onClick={startCamera}
                  className="text-xs text-primary-400 hover:text-primary-300 transition-colors underline">
                  Enable camera
                </button>
              </div>
            )}

              {camOn && stream && (
              <>
                <OutOfFrameOverlay show={stableNoFace} />
                {!stableNoFace && <EyeContactWarning show={stableNoEye} />}
                <MultiPersonWarning show={multiPerson} />
                <BorderGlow faceDetected={faceDetected} eyeContact={eyeContact} />
                <div className="absolute bottom-0 left-0 right-0 px-3 py-2.5 flex items-center justify-between z-10"
                  style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.85))" }}>
                  <div className="flex items-center gap-2">
                    <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.2, repeat: Infinity }}
                      className="w-2 h-2 rounded-full"
                      style={{ background: faceDetected ? (eyeContact ? "#10b981" : "#f59e0b") : "#ef4444" }} />
                    <span className="text-xs text-white font-semibold">You</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold tabular-nums"
                      style={{ color: faceConfidence >= 70 ? "#10b981" : faceConfidence >= 40 ? "#f59e0b" : "#ef4444" }}>
                      {faceConfidence}%
                    </span>
                    <StatusPill eyeContact={eyeContact} faceDetected={faceDetected} />
                  </div>
                </div>
              </>
            )}

            {/* Controls */}
            <div className="absolute top-2 right-2 flex gap-1.5 z-30">
              <button onClick={() => setExpanded(true)}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                style={{ background: "rgba(0,0,0,0.65)", border: "1px solid rgba(255,255,255,0.15)" }}>
                <Maximize2 size={12} className="text-white" />
              </button>
              <button onClick={() => camOn ? stopCamera() : startCamera()}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                style={{ background: "rgba(0,0,0,0.65)", border: "1px solid rgba(255,255,255,0.15)" }}>
                {camOn ? <Camera size={12} className="text-white" /> : <CameraOff size={12} className="text-slate-400" />}
              </button>
            </div>
          </div>
        </div>

        {/* AI Avatar — full width strip below camera */}
        <div className="relative rounded-2xl px-4 py-3 flex items-center gap-4"
          style={{
            background: "linear-gradient(135deg, rgba(79,70,229,0.1), rgba(124,58,237,0.06))",
            border: "1px solid rgba(99,102,241,0.18)",
          }}>
          {/* Scan line */}
          <motion.div animate={{ y: ["0%", "100%", "0%"] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 right-0 h-px opacity-20 pointer-events-none"
            style={{ background: "linear-gradient(90deg, transparent, #6366f1, transparent)" }} />

          <AIAvatar state={aiState} track={track} size="sm" />

          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white">AI Interviewer</p>
            <p className="text-[10px] text-slate-500 mt-0.5 truncate">
              {aiState === "speaking"  ? "Speaking..." :
               aiState === "thinking"  ? "Thinking..." :
               aiState === "listening" ? "Listening..." :
               `${track} Track`}
            </p>
          </div>

          {/* AI state indicator */}
          <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: aiState === "speaking" ? "#10b981" : aiState === "thinking" ? "#f59e0b" : "#6366f1" }} />
        </div>
      </div>

      {/* ── Fullscreen camera modal ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(12px)" }}
            onClick={() => setExpanded(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }} transition={{ ease: [0.16,1,.3,1], duration: 0.3 }}
              className="relative w-full max-w-3xl rounded-2xl overflow-hidden"
              style={{ aspectRatio: "16/9", border: "1px solid rgba(255,255,255,0.1)" }}
              onClick={e => e.stopPropagation()}>

              <video autoPlay muted playsInline
                ref={fullscreenVideoRef}
                className="w-full h-full object-cover scale-x-[-1]"
                style={{ display: camOn && stream ? "block" : "none" }} />

              {(!camOn || !stream) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                  style={{ background: "rgba(0,0,0,0.85)" }}>
                  <CameraOff size={40} className="text-slate-600" />
                  <p className="text-slate-500 text-sm">Camera is off</p>
                </div>
              )}

              {camOn && stream && (
                <>
                  <OutOfFrameOverlay show={stableNoFace} />
                  {!stableNoFace && <EyeContactWarning show={stableNoEye} />}
                  <MultiPersonWarning show={multiPerson} />
                  <BorderGlow faceDetected={faceDetected} eyeContact={eyeContact} />
                  <div className="absolute bottom-0 left-0 right-0 px-5 py-4 flex items-center justify-between z-10"
                    style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.85))" }}>
                    <div className="flex items-center gap-2">
                      <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.2, repeat: Infinity }}
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ background: faceDetected ? (eyeContact ? "#10b981" : "#f59e0b") : "#ef4444" }} />
                      <span className="text-sm text-white font-semibold">You — Live</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold tabular-nums"
                        style={{ color: faceConfidence >= 70 ? "#10b981" : faceConfidence >= 40 ? "#f59e0b" : "#ef4444" }}>
                        {faceConfidence}%
                      </span>
                      <StatusPill eyeContact={eyeContact} faceDetected={faceDetected} />
                    </div>
                  </div>
                </>
              )}

              {/* Close button */}
              <button onClick={() => setExpanded(false)}
                className="absolute top-3 right-3 w-9 h-9 rounded-xl flex items-center justify-center z-30 transition-all"
                style={{ background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.2)" }}>
                <Minimize2 size={16} className="text-white" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default VideoPanel;


